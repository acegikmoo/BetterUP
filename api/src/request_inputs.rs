use serde::Deserialize;

#[derive(Deserialize)]
pub struct CreateWebsiteInput {
    pub url: String,
}
