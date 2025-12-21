use dotenvy::from_path;
use std::env;

pub struct Config {
    pub db_url: String,
}

impl Default for Config {
    fn default() -> Self {
        from_path("store/.env").ok();
        let db_url = env::var("DATABASE_URL")
            .unwrap_or_else(|_| panic!("Please provide the database_url environment variable"));
        Self { db_url }
    }
}
