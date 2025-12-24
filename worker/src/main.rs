use chrono::Utc;
use futures::stream;
use influxdb2::{Client as InfluxClient, models::DataPoint};
use redis_lib::RedisStore;
use reqwest::Client as HttpClient;
use std::fmt;
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
    dotenv::from_filename(".env")?;

    let redis_url = std::env::var("REDIS_URL").expect("REDIS_URL must be set");
    let redis = RedisStore::new(&redis_url).await?;

    let influx_url = std::env::var("INFLUXDB_URL").expect("INFLUXDB_URL must be set");
    let influx_token = std::env::var("INFLUXDB_TOKEN").expect("INFLUXDB_TOKEN must be set");
    let influx = InfluxClient::new(&influx_url, "website_ticks", &influx_token);

    let http_client = HttpClient::new();
    let worker_id = uuid::Uuid::new_v4().to_string();
    let consumer_group = "website_checkers";

    let mut interval = interval(Duration::from_secs(10));
    loop {
        interval.tick().await;
        process_websites(&redis, &influx, &http_client, &worker_id, consumer_group).await?;
    }
}

async fn process_websites(
    redis: &RedisStore,
    influx: &InfluxClient,
    http_client: &HttpClient,
    _worker_id: &str,
    _consumer_group: &str,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let websites = redis.get_all_websites().await?;
    for website in websites {
        println!("get website: {:?}", website);
        let start = Utc::now().timestamp_millis();
        let status = match http_client.get(&website.url).send().await {
            Ok(resp) => {
                if resp.status().is_success() {
                    Status::Up
                } else {
                    Status::Down
                }
            }
            Err(e) => {
                eprintln!("Failed to check {}: {}", website.url, e);
                Status::Down
            }
        };
        let response_time_ms = (Utc::now().timestamp_millis() - start) as i32;

        // Writing to InfluxDB
        let point = DataPoint::builder("website_tick")
            .tag("website_id", website.id.clone())
            .tag("region_id", REGION_ID)
            .field("response_time_ms", response_time_ms as i64)
            .field("status", status.to_string())
            .timestamp(start * 1_000_000)
            .build()?;
        influx
            .write("website_ticks", stream::iter(vec![point]))
            .await?;

        println!("status: {:?}", status);

        // If down, add to notification stream
        if status == Status::Down {
            let notification = redis_lib::NotificationEntry {
                website_id: website.id.clone(),
                region_id: REGION_ID.to_string(),
                status: status.to_string(),
                response_time_ms,
                timestamp: start,
            };
            redis.add_notification(notification).await?;
        }
    }
    Ok(())
}
