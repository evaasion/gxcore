use axum::{
    extract::Json,
    http::StatusCode,
    routing::post,
    Router,
};
use serde::{Deserialize, Serialize};
use crate::{encode, decode, partial_verify, CompressionAlgorithm};

#[derive(Deserialize)]
struct EncodeRequest {
    data: Vec<u8>,
    seed: Vec<u8>,
    compression: String,
}

#[derive(Serialize)]
struct EncodeResponse {
    encoded: Vec<u8>,
}

#[derive(Deserialize)]
struct DecodeRequest {
    encoded: Vec<u8>,
    seed: Vec<u8>,
    compression: String,
}

#[derive(Serialize)]
struct DecodeResponse {
    decoded: Vec<u8>,
}

#[derive(Deserialize)]
struct VerifyRequest {
    encoded: Vec<u8>,
}

#[derive(Serialize)]
struct VerifyResponse {
    valid: bool,
}

async fn encode_handler(Json(payload): Json<EncodeRequest>) -> Result<Json<EncodeResponse>, StatusCode> {
    let compression = match payload.compression.as_str() {
        "none" => CompressionAlgorithm::None,
        "lz4" => CompressionAlgorithm::Lz4,
        "brotli" => CompressionAlgorithm::Brotli,
        _ => return Err(StatusCode::BAD_REQUEST),
    };

    let encoded = encode(&payload.data, &payload.seed, compression);
    Ok(Json(EncodeResponse { encoded }))
}

async fn decode_handler(Json(payload): Json<DecodeRequest>) -> Result<Json<DecodeResponse>, StatusCode> {
    let compression = match payload.compression.as_str() {
        "none" => CompressionAlgorithm::None,
        "lz4" => CompressionAlgorithm::Lz4,
        "brotli" => CompressionAlgorithm::Brotli,
        _ => return Err(StatusCode::BAD_REQUEST),
    };

    match decode(&payload.encoded, &payload.seed, compression) {
        Ok(decoded) => Ok(Json(DecodeResponse { decoded })),
        Err(_) => Err(StatusCode::BAD_REQUEST),
    }
}

async fn verify_handler(Json(payload): Json<VerifyRequest>) -> Json<VerifyResponse> {
    let valid = partial_verify(&payload.encoded);
    Json(VerifyResponse { valid })
}

pub fn create_router() -> Router {
    Router::new()
        .route("/encode", post(encode_handler))
        .route("/decode", post(decode_handler))
        .route("/verify", post(verify_handler))
}