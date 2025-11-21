use std::sync::{Arc, Mutex};

use poem::{
    EndpointExt, Route, Server, get, handler,
    listener::TcpListener,
    post,
    web::{Data, Json, Path},
};

use crate::{
    request_inputs::{CreateUserInput, CreateWebsiteInput},
    request_outputs::{CreateUserOutput, CreateWebsiteOutput, GetWebsiteOutput, SigninOutput},
};
use store::store::Store;
pub mod request_inputs;
pub mod request_outputs;

#[handler]
fn get_website(
    Path(id): Path<String>,
    Data(s): Data<&Arc<Mutex<Store>>>,
) -> Json<GetWebsiteOutput> {
    let mut locked_s = s.lock().unwrap();
    let website = locked_s.get_website(id).unwrap();
    Json(GetWebsiteOutput { url: website.url })
}

#[handler]
fn sign_up(
    Json(data): Json<CreateUserInput>,
    Data(s): Data<&Arc<Mutex<Store>>>,
) -> Json<CreateUserOutput> {
    let mut locked_s = s.lock().unwrap();
    let id = locked_s.sign_up(data.username, data.password).unwrap();

    let response = CreateUserOutput { id };

    Json(response)
}

#[handler]
fn sign_in(
    Json(data): Json<CreateUserInput>,
    Data(s): Data<&Arc<Mutex<Store>>>,
) -> Json<SigninOutput> {
    let mut locked_s = s.lock().unwrap();
    let _exists = locked_s.sign_in(data.username, data.password).unwrap();
    let response = SigninOutput {
        jwt: String::from("Rubai"),
    };
    Json(response)
}

#[handler]
fn create_website(
    Json(data): Json<CreateWebsiteInput>,
    Data(s): Data<&Arc<Mutex<Store>>>,
) -> Json<CreateWebsiteOutput> {
    let mut locked_s = s.lock().unwrap();
    let website = locked_s
        .create_website(
            String::from("ed4b9faf-2bd1-4137-aec3-58eda1f93ae8"),
            data.url,
        )
        .unwrap();
    let response = CreateWebsiteOutput { id: website.id };
    Json(response)
}

#[tokio::main(flavor = "multi_thread")]
async fn main() -> Result<(), std::io::Error> {
    let s = Arc::new(Mutex::new(Store::new().unwrap()));
    let app = Route::new()
        .at("/website/:website_id", get(get_website))
        .at("/website", post(create_website))
        .at("/user/signup", post(sign_up))
        .at("/user/signin", post(sign_in))
        .data(s);

    Server::new(TcpListener::bind("0.0.0.0:3000"))
        .name("betteruptime-api")
        .run(app)
        .await
}
