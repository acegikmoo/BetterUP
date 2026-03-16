use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Website {
    pub id: String,
    pub url: String,
    pub name: Option<String>,
    pub time_added: NaiveDateTime,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Region {
    pub id: String,
    pub name: String,
}

pub struct User {
    pub id: String,
    pub email: String,
    pub password: String,
    pub created_at: NaiveDateTime,
}
