use criterion::{black_box, criterion_group, criterion_main, Criterion};
use cyphersolbase::{encode, decode, CompressionAlgorithm};

fn bench_encode_small_data(c: &mut Criterion) {
    let data = b"Hello, Solana World!";
    let seed = b"benchmark_secret_key";

    c.bench_function("encode_small_none", |b| {
        b.iter(|| encode(black_box(data), black_box(seed), CompressionAlgorithm::None))
    });

    c.bench_function("encode_small_lz4", |b| {
        b.iter(|| encode(black_box(data), black_box(seed), CompressionAlgorithm::Lz4))
    });

    c.bench_function("encode_small_brotli", |b| {
        b.iter(|| encode(black_box(data), black_box(seed), CompressionAlgorithm::Brotli))
    });
}

fn bench_encode_medium_data(c: &mut Criterion) {
    let data = b"This is a medium-sized test data for benchmarking CypherSolBase encoding performance with different compression algorithms. We want to measure how the library performs with realistic data sizes that might be used in Solana programs.";
    let seed = b"benchmark_secret_key_12345";

    c.bench_function("encode_medium_none", |b| {
        b.iter(|| encode(black_box(data), black_box(seed), CompressionAlgorithm::None))
    });

    c.bench_function("encode_medium_lz4", |b| {
        b.iter(|| encode(black_box(data), black_box(seed), CompressionAlgorithm::Lz4))
    });

    c.bench_function("encode_medium_brotli", |b| {
        b.iter(|| encode(black_box(data), black_box(seed), CompressionAlgorithm::Brotli))
    });
}

fn bench_encode_large_data(c: &mut Criterion) {
    let data = include_bytes!("../src/lib.rs"); // Use the source code as large test data
    let seed = b"benchmark_secret_key_large_data_test";

    c.bench_function("encode_large_none", |b| {
        b.iter(|| encode(black_box(data), black_box(seed), CompressionAlgorithm::None))
    });

    c.bench_function("encode_large_lz4", |b| {
        b.iter(|| encode(black_box(data), black_box(seed), CompressionAlgorithm::Lz4))
    });

    c.bench_function("encode_large_brotli", |b| {
        b.iter(|| encode(black_box(data), black_box(seed), CompressionAlgorithm::Brotli))
    });
}

fn bench_decode_small_data(c: &mut Criterion) {
    let data = b"Hello, Solana World!";
    let seed = b"benchmark_secret_key";

    let encoded_none = encode(data, seed, CompressionAlgorithm::None);
    let encoded_lz4 = encode(data, seed, CompressionAlgorithm::Lz4);
    let encoded_brotli = encode(data, seed, CompressionAlgorithm::Brotli);

    c.bench_function("decode_small_none", |b| {
        b.iter(|| decode(black_box(&encoded_none), black_box(seed), CompressionAlgorithm::None))
    });

    c.bench_function("decode_small_lz4", |b| {
        b.iter(|| decode(black_box(&encoded_lz4), black_box(seed), CompressionAlgorithm::Lz4))
    });

    c.bench_function("decode_small_brotli", |b| {
        b.iter(|| decode(black_box(&encoded_brotli), black_box(seed), CompressionAlgorithm::Brotli))
    });
}

fn bench_decode_medium_data(c: &mut Criterion) {
    let data = b"This is a medium-sized test data for benchmarking CypherSolBase encoding performance with different compression algorithms. We want to measure how the library performs with realistic data sizes that might be used in Solana programs.";
    let seed = b"benchmark_secret_key_12345";

    let encoded_none = encode(data, seed, CompressionAlgorithm::None);
    let encoded_lz4 = encode(data, seed, CompressionAlgorithm::Lz4);
    let encoded_brotli = encode(data, seed, CompressionAlgorithm::Brotli);

    c.bench_function("decode_medium_none", |b| {
        b.iter(|| decode(black_box(&encoded_none), black_box(seed), CompressionAlgorithm::None))
    });

    c.bench_function("decode_medium_lz4", |b| {
        b.iter(|| decode(black_box(&encoded_lz4), black_box(seed), CompressionAlgorithm::Lz4))
    });

    c.bench_function("decode_medium_brotli", |b| {
        b.iter(|| decode(black_box(&encoded_brotli), black_box(seed), CompressionAlgorithm::Brotli))
    });
}

fn bench_roundtrip_consistency(c: &mut Criterion) {
    let data = b"Roundtrip test data for CypherSolBase";
    let seed = b"consistency_test_key";

    c.bench_function("roundtrip_none", |b| {
        b.iter(|| {
            let encoded = encode(black_box(data), black_box(seed), CompressionAlgorithm::None);
            decode(black_box(&encoded), black_box(seed), CompressionAlgorithm::None)
        })
    });

    c.bench_function("roundtrip_lz4", |b| {
        b.iter(|| {
            let encoded = encode(black_box(data), black_box(seed), CompressionAlgorithm::Lz4);
            decode(black_box(&encoded), black_box(seed), CompressionAlgorithm::Lz4)
        })
    });
}

criterion_group!(
    benches,
    bench_encode_small_data,
    bench_encode_medium_data,
    bench_encode_large_data,
    bench_decode_small_data,
    bench_decode_medium_data,
    bench_roundtrip_consistency
);
criterion_main!(benches);