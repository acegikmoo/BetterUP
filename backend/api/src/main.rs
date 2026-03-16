use poem::{
    EndpointExt, Route, Server, get, handler,
    listener::TcpListener,
    middleware::Cors,
    post,
    web::{Data, Json, Path},
};
use serde::{Deserialize, Serialize};

use bcrypt::{DEFAULT_COST, hash, verify};
use jsonwebtoken::{EncodingKey, Header, encode};
use redis_lib::{RedisStore, WebsiteStreamEntry};
use store::{
    Store,
    models::{Region, Website},
};

mod input;

#[derive(Serialize, Deserialize)]
struct Claims {
    sub: String,
    email: String,
    exp: usize,
}

#[derive(Serialize)]
struct AuthResponse {
    token: String,
}

#[handler]
async fn signup(
    store: Data<&Store>,
    jwt_secret: Data<&String>,
    input: Json<input::AuthInput>,
) -> Result<Json<AuthResponse>, poem::Error> {
    let hashed = hash(&input.password, DEFAULT_COST).map_err(poem::error::InternalServerError)?;

    let user = store
        .create_user(&input.email, &hashed)
        .await
        .map_err(|e| match e {
            sqlx::Error::Database(db) if db.constraint() == Some("user_email_key") => {
                poem::Error::from_string("Email already in use", poem::http::StatusCode::CONFLICT)
            }
            _ => poem::error::InternalServerError(e),
        })?;

    let claims = Claims {
        sub: user.id,
        email: user.email,
        exp: 2000000000,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(jwt_secret.as_bytes()),
    )
    .map_err(poem::error::InternalServerError)?;

    Ok(Json(AuthResponse { token }))
}

#[handler]
async fn signin(
    store: Data<&Store>,
    jwt_secret: Data<&String>,
    input: Json<input::AuthInput>,
) -> Result<Json<AuthResponse>, poem::Error> {
    let user = store.get_user_by_email(&input.email).await.map_err(|_| {
        poem::Error::from_string(
            "Invalid email or password",
            poem::http::StatusCode::UNAUTHORIZED,
        )
    })?;

    let valid =
        verify(&input.password, &user.password).map_err(poem::error::InternalServerError)?;

    if !valid {
        return Err(poem::Error::from_string(
            "Invalid email or password",
            poem::http::StatusCode::UNAUTHORIZED,
        ));
    }

    let claims = Claims {
        sub: user.id,
        email: user.email,
        exp: 2000000000,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(jwt_secret.as_bytes()),
    )
    .map_err(poem::error::InternalServerError)?;

    Ok(Json(AuthResponse { token }))
}

#[handler]
async fn get_websites(store: Data<&Store>) -> Json<Vec<Website>> {
    let websites = store.get_websites().await.unwrap_or_default();
    Json(websites)
}

#[handler]
async fn get_website(store: Data<&Store>, id: Path<String>) -> Json<Option<Website>> {
    let website = store.get_website(&id).await.ok();
    Json(website)
}

#[handler]
async fn create_website(
    store: Data<&Store>,
    redis: Data<&RedisStore>,
    input: Json<input::CreateWebsite>,
) -> Result<Json<Website>, poem::Error> {
    let website = store
        .create_website(&input.url, input.name.as_deref())
        .await
        .map_err(poem::error::InternalServerError)?;

    let entry = WebsiteStreamEntry {
        id: website.id.clone(),
        url: website.url.clone(),
        name: website.name.clone(),
    };

    redis.add_website_to_stream(entry).await.map_err(|e| {
        poem::Error::from_string(e.to_string(), poem::http::StatusCode::INTERNAL_SERVER_ERROR)
    })?;

    Ok(Json(website))
}

#[handler]
async fn update_website(
    store: Data<&Store>,
    id: Path<String>,
    input: Json<input::UpdateWebsite>,
) -> Json<Option<Website>> {
    let website = store
        .update_website(&id, input.url.as_deref(), input.name.as_deref())
        .await
        .ok();
    Json(website)
}

#[handler]
async fn delete_website(store: Data<&Store>, id: Path<String>) -> String {
    match store.delete_website(&id).await {
        Ok(_) => "Website deleted".to_string(),
        Err(_) => "Website not found".to_string(),
    }
}

#[handler]
async fn get_regions(store: Data<&Store>) -> Json<Vec<Region>> {
    let regions = store.get_regions().await.unwrap_or_default();
    Json(regions)
}

#[handler]
async fn create_region(store: Data<&Store>, input: Json<input::CreateRegion>) -> Json<Region> {
    let region = store.create_region(&input.name).await.unwrap();
    Json(region)
}

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {
    dotenv::from_filename(".env")
        .map_err(|e| std::io::Error::other(format!("Failed to load .env file: {}", e)))?;

    let store = Store::new()
        .await
        .map_err(|e| std::io::Error::other(format!("Failed to initialize store: {}", e)))?;

    let redis_url = std::env::var("REDIS_URL").expect("REDIS_URL must be set");
    let redis = RedisStore::new(&redis_url)
        .await
        .map_err(|e| std::io::Error::other(format!("Failed to initialize redis: {}", e)))?;
    let jwt_secret = std::env::var("JWT_SECRET").expect("JWT_SECRET must be set");

    let app = Route::new()
        .at("/auth/signup", post(signup))
        .at("/auth/signin", post(signin))
        .at("/websites", get(get_websites).post(create_website))
        .at(
            "/websites/:id",
            get(get_website)
                .patch(update_website)
                .delete(delete_website),
        )
        .at("/regions", post(create_region).get(get_regions))
        .data(store)
        .data(redis)
        .data(jwt_secret)
        .with(Cors::new());

    let port = std::env::var("PORT").unwrap_or_else(|_| "5000".to_string());
    let addr = format!("0.0.0.0:{port}");

    println!("API listening on http://localhost:{port}");

    Server::new(TcpListener::bind(&addr)).run(app).await
}
