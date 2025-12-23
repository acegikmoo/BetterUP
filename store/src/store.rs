use std::sync::{Arc, Mutex};

use diesel::{Connection, ConnectionError, PgConnection};

use crate::config::Config;

#[derive(Clone)]
pub struct Store {
    pub conn: Arc<Mutex<PgConnection>>,
}

impl Store {
    pub async fn new() -> Result<Self, ConnectionError> {
        let config = Config::default();
        let conn = PgConnection::establish(&config.db_url)?;
        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
        })
    }
}
