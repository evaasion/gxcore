use axum::{
    extract::Json,
    http::{Method, StatusCode},
    routing::{post, get},
    Router,
};
use serde::{Deserialize, Serialize};
use tower_http::cors::{Any, CorsLayer};
use crate::{encode, decode, partial_verify, CompressionAlgorithm};
use std::time::Instant;

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

#[derive(Serialize)]
struct BenchmarkResult {
    operation: String,
    data_size: usize,
    compression: String,
    iterations: usize,
    total_time_ms: f64,
    avg_time_per_op_ns: f64,
    throughput_mb_per_sec: f64,
}

#[derive(Serialize)]
struct BenchmarkResponse {
    results: Vec<BenchmarkResult>,
    total_time_ms: f64,
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

async fn benchmark_handler() -> Json<BenchmarkResponse> {
    let start_time = Instant::now();
    let mut results = Vec::new();

    // Test data sets
    let small_data = b"Hello, Solana World!";
    let medium_data = b"This is a medium-sized test data for benchmarking CypherSolBase encoding performance with different compression algorithms. We want to measure how the library performs with realistic data sizes that might be used in Solana programs.";
    let large_data = include_bytes!("../src/lib.rs"); // Use source code as large test data

    let seed = b"benchmark_secret_key";
    let iterations = 1000;

    // Benchmark configurations
    let configs = vec![
        ("small", small_data.as_slice(), iterations / 10), // Fewer iterations for small data
        ("medium", medium_data.as_slice(), iterations / 5),
        ("large", large_data.as_slice(), iterations / 20), // Even fewer for large data
    ];

    let compressions = vec![
        ("none", CompressionAlgorithm::None),
        ("lz4", CompressionAlgorithm::Lz4),
        ("brotli", CompressionAlgorithm::Brotli),
    ];

    for (data_name, data, iters) in configs {
        for (comp_name, compression) in &compressions {
            // Benchmark encoding
            let encode_start = Instant::now();
            for _ in 0..iters {
                let _ = encode(data, seed, *compression);
            }
            let encode_duration = encode_start.elapsed();

            // Benchmark decoding (need to encode first)
            let encoded = encode(data, seed, *compression);
            let decode_start = Instant::now();
            for _ in 0..iters {
                let _ = decode(&encoded, seed, *compression);
            }
            let decode_duration = decode_start.elapsed();

            // Calculate metrics for encoding
            let encode_avg_ns = encode_duration.as_nanos() as f64 / iters as f64;
            let encode_throughput = (data.len() * iters) as f64 / encode_duration.as_secs_f64() / (1024.0 * 1024.0);

            results.push(BenchmarkResult {
                operation: format!("encode_{}", data_name),
                data_size: data.len(),
                compression: comp_name.to_string(),
                iterations: iters,
                total_time_ms: encode_duration.as_millis() as f64,
                avg_time_per_op_ns: encode_avg_ns,
                throughput_mb_per_sec: encode_throughput,
            });

            // Calculate metrics for decoding
            let decode_avg_ns = decode_duration.as_nanos() as f64 / iters as f64;
            let decode_throughput = (encoded.len() * iters) as f64 / decode_duration.as_secs_f64() / (1024.0 * 1024.0);

            results.push(BenchmarkResult {
                operation: format!("decode_{}", data_name),
                data_size: encoded.len(),
                compression: comp_name.to_string(),
                iterations: iters,
                total_time_ms: decode_duration.as_millis() as f64,
                avg_time_per_op_ns: decode_avg_ns,
                throughput_mb_per_sec: decode_throughput,
            });
        }
    }

    let total_duration = start_time.elapsed();

    Json(BenchmarkResponse {
        results,
        total_time_ms: total_duration.as_millis() as f64,
    })
}

pub fn create_router() -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)  // Permettre toutes les origines pour le développement, ou spécifier "https://gxcore.io"
        .allow_methods([Method::GET, Method::POST])
        .allow_headers(Any);

    Router::new()
        .route("/encode", post(encode_handler))
        .route("/decode", post(decode_handler))
        .route("/verify", post(verify_handler))
        .route("/benchmark", get(benchmark_handler))
        .layer(cors)
}