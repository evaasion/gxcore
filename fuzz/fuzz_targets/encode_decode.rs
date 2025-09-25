#![no_main]

use libfuzzer_sys::fuzz_target;
use cyphersolbase::{encode, decode, CompressionAlgorithm};

fuzz_target!(|data: &[u8]| {
    // Fuzz test for encode/decode with various inputs
    let seed = b"fuzz_seed"; // Fixed seed for reproducibility

    // Test with no compression
    let encoded = encode(data, seed, CompressionAlgorithm::None);
    let _ = decode(&encoded, seed, CompressionAlgorithm::None);

    // Test with LZ4 compression
    let encoded = encode(data, seed, CompressionAlgorithm::Lz4);
    let _ = decode(&encoded, seed, CompressionAlgorithm::Lz4);

    // Test partial verification
    let encoded = encode(data, seed, CompressionAlgorithm::None);
    let _ = cyphersolbase::partial_verify(&encoded);
});
