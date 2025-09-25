use axum::serve;
use cyphersolbase::api::create_router;
use tokio::net::TcpListener;

#[tokio::main]
async fn main() {
    let app = create_router();

    let listener = TcpListener::bind("127.0.0.1:3000").await.unwrap();
    println!("API running on http://127.0.0.1:3000");
    serve(listener, app).await.unwrap();
}