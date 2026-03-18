use chrono::Utc;
use futures::stream;
use influxdb2::{Client as InfluxClient, models::DataPoint};
use redis_lib::RedisStore;
use reqwest::Client as HttpClient;
use std::fmt;
use store::Store;
use tokio::time::{Duration, interval};

const REGION_ID: &str = "europe";

#[derive(Debug, Clone, PartialEq)]
enum Status {
    Up,
    Down,
}

impl fmt::Display for Status {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Status::Up => write!(f, "Up"),
            Status::Down => write!(f, "Down"),
        }
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    dotenv::from_filename(".env").ok();

    let redis_url = std::env::var("REDIS_URL").expect("REDIS_URL must be set");
    let redis = RedisStore::new(&redis_url).await?;

    let influx_url = std::env::var("INFLUXDB_URL").expect("INFLUXDB_URL must be set");
    let influx_token = std::env::var("INFLUXDB_TOKEN").expect("INFLUXDB_TOKEN must be set");
    let influx_org = std::env::var("INFLUXDB_ORG").expect("INFLUXDB_ORG must be set");
    let influx = InfluxClient::new(&influx_url, &influx_org, &influx_token);

    let store = Store::new()
        .await
        .map_err(|e| format!("Failed to initialize store: {}", e))?;

    let http_client = HttpClient::new();
    let worker_id = uuid::Uuid::new_v4().to_string();
    let consumer_group = "website_checkers";

    let mut interval = interval(Duration::from_secs(10));
    loop {
        interval.tick().await;
        if let Err(e) = process_websites(
            &redis,
            &influx,
            &http_client,
            &store,
            &worker_id,
            consumer_group,
        )
        .await
        {
            eprintln!("Error processing websites: {}", e);
        }
    }

    async fn process_websites(
        redis: &RedisStore,
        influx: &InfluxClient,
        http_client: &HttpClient,
        store: &Store,
        _worker_id: &str,
        _consumer_group: &str,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let websites = redis.get_all_websites().await?;

        for website in websites {
            let start = Utc::now().timestamp_millis();

            let status = match http_client.get(&website.url).send().await {
                Ok(resp) if resp.status().is_success() => Status::Up,
                Ok(resp) => {
                    eprintln!("Non-success status for {}: {}", website.url, resp.status());
                    Status::Down
                }
                Err(e) => {
                    eprintln!("Failed to reach {}: {}", website.url, e);
                    Status::Down
                }
            };

            let response_time_ms = (Utc::now().timestamp_millis() - start) as i32;

            println!(
                "[{}] {} — {}ms — {}",
                REGION_ID, website.url, response_time_ms, status
            );

            // Write tick to InfluxDB
            let point = DataPoint::builder("website_tick")
                .tag("website_id", website.id.clone())
                .tag("region_id", REGION_ID)
                .field("response_time_ms", response_time_ms as i64)
                .field("status", status.to_string())
                .timestamp(start * 1_000_000)
                .build()?;

            if let Err(e) = influx
                .write("uptime_metrics", stream::iter(vec![point]))
                .await
            {
                eprintln!("Failed to write to InfluxDB for {}: {}", website.id, e);
            }

            // Only notify if not in cooldown
            if status == Status::Down {
                let in_cooldown = redis
                    .check_and_set_cooldown(&website.id, REGION_ID)
                    .await
                    .unwrap_or(false);

                if in_cooldown {
                    println!("Cooldown active for {}, skipping notification", website.id);
                    continue;
                }

                // Look up the owner's email from db
                match store.get_website_owner_email(&website.id).await {
                    Ok(user_email) => {
                        let notification = redis_lib::NotificationEntry {
                            website_id: website.id.clone(),
                            website_name: website.name.clone(),
                            user_email,
                            region_id: REGION_ID.to_string(),
                            status: status.to_string(),
                            response_time_ms,
                            timestamp: start,
                        };
                        if let Err(e) = redis.add_notification(notification).await {
                            eprintln!("Failed to queue notification for {}: {}", website.id, e);
                        }
                    }
                    Err(e) => {
                        eprintln!("Could not find owner for website {}: {}", website.id, e);
                    }
                }
            }
        }

        Ok(())
    }
}
