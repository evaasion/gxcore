use axum::serve;
use cyphersolbase::api::create_router;
use std::env;
use tokio::net::TcpListener;

#[tokio::main]
async fn main() {
    let app = create_router();

    let port = env::var("PORT").unwrap_or_else(|_| "3000".to_string());
    let addr = format!("0.0.0.0:{}", port);
    let listener = TcpListener::bind(&addr).await.unwrap();
    println!("API running on http://{}", addr);
    serve(listener, app).await.unwrap();
}