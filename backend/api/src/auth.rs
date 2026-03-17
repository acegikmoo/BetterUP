use jsonwebtoken::{DecodingKey, Validation, decode};
use poem::{FromRequest, Request, RequestBody, Result, http::StatusCode};

use crate::Claims;

#[allow(dead_code)]
pub struct AuthUser {
    pub id: String,
    pub email: String,
}

impl<'a> FromRequest<'a> for AuthUser {
    async fn from_request(req: &'a Request, _body: &mut RequestBody) -> Result<Self> {
        let token = req
            .headers()
            .get("Authorization")
            .and_then(|v| v.to_str().ok())
            .and_then(|v| v.strip_prefix("Bearer "))
            .ok_or_else(|| poem::Error::from_status(StatusCode::UNAUTHORIZED))?;

        let jwt_secret = req
            .data::<String>()
            .ok_or_else(|| poem::Error::from_status(StatusCode::INTERNAL_SERVER_ERROR))?;

        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(jwt_secret.as_bytes()),
            &Validation::default(),
        )
        .map_err(|_| poem::Error::from_status(StatusCode::UNAUTHORIZED))?;

        Ok(AuthUser {
            id: token_data.claims.sub,
            email: token_data.claims.email,
        })
    }
}
