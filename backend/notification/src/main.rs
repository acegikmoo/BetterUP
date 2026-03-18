use lettre::{
    Message, SmtpTransport, Transport, message::header::ContentType,
    transport::smtp::authentication::Credentials,
};
use redis_lib::RedisStore;
use tokio::time::{Duration, interval};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    dotenv::from_filename(".env").ok();

    let redis_url = std::env::var("REDIS_URL").expect("REDIS_URL must be set");
    let redis = RedisStore::new(&redis_url).await?;

    let smtp_user = std::env::var("SMTP_USER").expect("SMTP_USER must be set");
    let smtp_pass = std::env::var("SMTP_PASS").expect("SMTP_PASS must be set");
    let smtp_host = std::env::var("SMTP_HOST").expect("SMTP_HOST must be set");

    let creds = Credentials::new(smtp_user.clone(), smtp_pass);
    let mailer = SmtpTransport::relay(&smtp_host)?.credentials(creds).build();

    let from_addr = format!("BetterUp Monitor <{}>", smtp_user)
        .parse()
        .expect("Invalid SMTP_USER email format");

    let consumer_group = "notifiers";
    let consumer_name = uuid::Uuid::new_v4().to_string();

    println!("Notification service started");

    let mut tick = interval(Duration::from_secs(60));
    loop {
        tick.tick().await;
        if let Err(e) =
            process_notifications(&redis, &mailer, &from_addr, consumer_group, &consumer_name).await
        {
            eprintln!("Error processing notifications: {}", e);
        }
    }
}

async fn process_notifications(
    redis: &RedisStore,
    mailer: &SmtpTransport,
    from_addr: &lettre::message::Mailbox,
    consumer_group: &str,
    consumer_name: &str,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let notifications = redis
        .get_notifications(consumer_group, consumer_name, 100)
        .await?;

    for (stream_id, notification) in notifications {
        // Parse recipient
        let to_addr = match notification.user_email.parse::<lettre::message::Mailbox>() {
            Ok(addr) => addr,
            Err(e) => {
                eprintln!(
                    "Bad email address '{}' for website {}: {}",
                    notification.user_email, notification.website_id, e
                );
                redis.ack_notification(consumer_group, &stream_id).await?;
                continue;
            }
        };

        let site_label = notification
            .website_name
            .as_deref()
            .unwrap_or(&notification.website_id);

        let time_str = chrono::DateTime::from_timestamp_millis(notification.timestamp)
            .map(|dt| dt.format("%Y-%m-%d %H:%M:%S UTC").to_string())
            .unwrap_or_else(|| notification.timestamp.to_string());

        let body = format!(
            "Hi,\n\n\
             Your website is down.\n\n\
             Site:     {site_label}\n\
             Region:   {region}\n\
             Status:   {status}\n\
             Response: {response_ms}ms\n\
             Time:     {time}\n\n\
             BetterUp will alert you again if the site remains down after 30 minutes.\n\n\
             — BetterUp",
            site_label = site_label,
            region = notification.region_id,
            status = notification.status,
            response_ms = notification.response_time_ms,
            time = time_str,
        );

        let email = match Message::builder()
            .from(from_addr.clone())
            .to(to_addr)
            .subject(format!("{} is down", site_label))
            .header(ContentType::TEXT_PLAIN)
            .body(body)
        {
            Ok(msg) => msg,
            Err(e) => {
                eprintln!(
                    "Failed to build email for {}: {}",
                    notification.website_id, e
                );
                redis.ack_notification(consumer_group, &stream_id).await?;
                continue;
            }
        };

        match mailer.send(&email) {
            Ok(_) => {
                println!(
                    "Alert sent to {} for website {}",
                    notification.user_email, site_label
                );
                redis.ack_notification(consumer_group, &stream_id).await?;
            }
            Err(e) => {
                eprintln!(
                    "Failed to send email to {} for {}: {}",
                    notification.user_email, site_label, e
                );
                // no ack — will retry next cycle
            }
        }
    }

    Ok(())
}
