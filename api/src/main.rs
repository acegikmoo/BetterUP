use poem::{
    Route, Server, get, handler,
    listener::TcpListener,
    post,
    web::{Json, Path},
};

use crate::{request_inputs::CreateWebsiteInput, request_outputs::CreateWebsiteOutput};

use store::Store;

pub mod request_inputs;
pub mod request_outputs;

#[handler]
fn get_website(Path(name): Path<String>) -> String {
    let s = Store {};
    s.create_user();
    format!("hello: {name}")
}

#[handler]
fn create_website(Json(data): Json<CreateWebsiteInput>) -> Json<CreateWebsiteOutput> {
    let s = Store {};
    s.create_user();
    let _url = data.url;

    let response = CreateWebsiteOutput {
        id: "ID".to_string(),
    };

    Json(response)
}

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {
    let app = Route::new()
        .at("/website/:website_id", get(get_website))
        .at("/website", post(create_website));

    Server::new(TcpListener::bind("0.0.0.0:3000"))
        .name("betteruptime-api")
        .run(app)
        .await
}
