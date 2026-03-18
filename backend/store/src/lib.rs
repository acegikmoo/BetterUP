use sqlx::{PgPool, pool::PoolOptions};

pub use models::{Region, Website};
use uuid::Uuid;

pub mod models;

#[derive(Clone)]
pub struct Store {
    pool: PgPool,
}

impl Store {
    pub async fn new() -> Result<Self, sqlx::Error> {
        let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
        let pool = PoolOptions::new()
            .max_connections(50)
            .connect(&database_url)
            .await?;
        Ok(Store { pool })
    }

    pub async fn create_user(
        &self,
        email: &str,
        password: &str,
    ) -> Result<models::User, sqlx::Error> {
        let user = sqlx::query_as!(
            models::User,
            r#"
        INSERT INTO "user" (id, email, password)
        VALUES ($1, $2, $3)
        RETURNING id, email, password, created_at
        "#,
            Uuid::new_v4().to_string(),
            email,
            password
        )
        .fetch_one(&self.pool)
        .await?;
        Ok(user)
    }

    pub async fn get_user_by_email(&self, email: &str) -> Result<models::User, sqlx::Error> {
        let user = sqlx::query_as!(
            models::User,
            r#"SELECT id, email, password, created_at FROM "user" WHERE email = $1"#,
            email
        )
        .fetch_one(&self.pool)
        .await?;
        Ok(user)
    }

    pub async fn get_user_by_id(&self, id: &str) -> Result<models::User, sqlx::Error> {
        let user = sqlx::query_as!(
            models::User,
            r#"SELECT id, email, password, created_at FROM "user" WHERE id = $1"#,
            id
        )
        .fetch_one(&self.pool)
        .await?;
        Ok(user)
    }

    // Returns the owner email to propagate Notif entry
    pub async fn get_website_owner_email(&self, website_id: &str) -> Result<String, sqlx::Error> {
        let row = sqlx::query!(
            r#"
            SELECT u.email
            FROM website w
            JOIN "user" u ON u.id = w.user_id
            WHERE w.id = $1
            "#,
            website_id
        )
        .fetch_one(&self.pool)
        .await?;
        Ok(row.email)
    }

    pub async fn create_website(
        &self,
        url: &str,
        name: Option<&str>,
        user_id: &str,
    ) -> Result<models::Website, sqlx::Error> {
        let website = sqlx::query_as!(
            models::Website,
            r#"
        INSERT INTO website (id, url, name, user_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id, url, name, time_added, user_id
        "#,
            Uuid::new_v4().to_string(),
            url,
            name,
            user_id,
        )
        .fetch_one(&self.pool)
        .await?;
        Ok(website)
    }

    pub async fn get_website(
        &self,
        id: &str,
        user_id: &str,
    ) -> Result<models::Website, sqlx::Error> {
        sqlx::query_as!(
            models::Website,
            r#"
        SELECT id, url, name, time_added, user_id
        FROM website
        WHERE id = $1 AND user_id = $2
        "#,
            id,
            user_id,
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn get_websites(&self, user_id: &str) -> Result<Vec<models::Website>, sqlx::Error> {
        sqlx::query_as!(
            models::Website,
            r#"
        SELECT id, url, name, time_added, user_id
        FROM website
        WHERE user_id = $1
        "#,
            user_id,
        )
        .fetch_all(&self.pool)
        .await
    }

    pub async fn update_website(
        &self,
        id: &str,
        user_id: &str,
        url: Option<&str>,
        name: Option<&str>,
    ) -> Result<models::Website, sqlx::Error> {
        sqlx::query_as!(
            models::Website,
            r#"
        UPDATE website
        SET url = COALESCE($3, url),
            name = COALESCE($4, name)
        WHERE id = $1 AND user_id = $2
        RETURNING id, url, name, time_added, user_id
        "#,
            id,
            user_id,
            url,
            name,
        )
        .fetch_one(&self.pool)
        .await
    }

    pub async fn delete_website(&self, id: &str, user_id: &str) -> Result<(), sqlx::Error> {
        sqlx::query!(
            r#"
        DELETE FROM website
        WHERE id = $1 AND user_id = $2
        "#,
            id,
            user_id,
        )
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn get_regions(&self) -> Result<Vec<models::Region>, sqlx::Error> {
        let regions = sqlx::query_as!(models::Region, r#"SELECT id, name FROM region"#,)
            .fetch_all(&self.pool)
            .await?;
        Ok(regions)
    }

    pub async fn create_region(&self, name: &str) -> Result<models::Region, sqlx::Error> {
        let region = sqlx::query_as!(
            models::Region,
            r#"
            INSERT INTO region (id, name)
            VALUES ($1, $2)
            RETURNING id, name
            "#,
            Uuid::new_v4().to_string(),
            name
        )
        .fetch_one(&self.pool)
        .await?;
        Ok(region)
    }
}
