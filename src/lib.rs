use base64::{Engine as _, engine::general_purpose};
use crc32fast::Hasher as Crc32Hasher;
use sha2::{Digest, Sha256};
use lz4::block::{compress, decompress};


#[derive(Clone, Copy)]
pub enum CompressionAlgorithm {
    None,
    Huffman, // Placeholder for future implementation
    Lz4,
    Brotli,
}

const BASE64_ALPHABET: &[u8; 64] =
    b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/// Derive a permuted alphabet from a seed using SHA-256
pub fn derive_alphabet(seed: &[u8]) -> [u8; 64] {
    let mut hasher = Sha256::new();
    hasher.update(seed);
    let hash = hasher.finalize();

    let mut alphabet = *BASE64_ALPHABET;
    // Simple deterministic permutation using hash
    for i in 0..64 {
        let swap_idx = (hash[i % 32] as usize + i) % 64;
        alphabet.swap(i, swap_idx);
    }
    alphabet
}

/// Encode data with optional compression, checksum, and custom alphabet
pub fn encode(data: &[u8], seed: &[u8], compression: CompressionAlgorithm) -> Vec<u8> {
    let alphabet = derive_alphabet(seed);
    let mut processed_data = match compression {
        CompressionAlgorithm::None => data.to_vec(),
        CompressionAlgorithm::Lz4 => compress(data, Default::default(), true).unwrap(),
        CompressionAlgorithm::Brotli => data.to_vec(), // Placeholder - Brotli compression to implement
        CompressionAlgorithm::Huffman => data.to_vec(), // Placeholder
    };

    // Add CRC32 checksum
    let mut crc = Crc32Hasher::new();
    crc.update(&processed_data);
    let checksum = crc.finalize();
    processed_data.extend_from_slice(&checksum.to_le_bytes());

    // Encode with standard base64 first
    let encoded = general_purpose::STANDARD.encode(&processed_data);

    // Replace with custom alphabet
    let mut result = Vec::new();
    for b in encoded.as_bytes() {
        if *b == b'=' {
            result.push(b'=');
        } else {
            let idx = BASE64_ALPHABET.iter().position(|&c| c == *b).unwrap();
            result.push(alphabet[idx]);
        }
    }
    result
}

/// Decode data, verify checksum
pub fn decode(encoded: &[u8], seed: &[u8], compression: CompressionAlgorithm) -> Result<Vec<u8>, &'static str> {
    let alphabet = derive_alphabet(seed);

    // Map back to standard base64
    let mut standard_encoded = Vec::new();
    for &b in encoded {
        if b == b'=' {
            standard_encoded.push(b'=');
        } else {
            let idx = alphabet
                .iter()
                .position(|&c| c == b)
                .ok_or("Invalid character")?;
            standard_encoded.push(BASE64_ALPHABET[idx]);
        }
    }

    // Decode base64
    let decoded = general_purpose::STANDARD
        .decode(&standard_encoded)
        .map_err(|_| "Invalid base64")?;

    // Extract data and checksum
    if decoded.len() < 4 {
        return Err("Data too short");
    }
    let data_len = decoded.len() - 4;
    let data = &decoded[..data_len];
    let checksum_bytes = &decoded[data_len..];
    let expected_checksum = u32::from_le_bytes(checksum_bytes.try_into().unwrap());

    // Verify checksum
    let mut crc = Crc32Hasher::new();
    crc.update(data);
    if crc.finalize() != expected_checksum {
        return Err("Checksum mismatch");
    }

    let result = data.to_vec();
    let result = match compression {
        CompressionAlgorithm::None => result,
        CompressionAlgorithm::Lz4 => decompress(&result, None).map_err(|_| "Decompression LZ4 failed")?,
        CompressionAlgorithm::Brotli => result, // Placeholder - Brotli decompression to implement
        CompressionAlgorithm::Huffman => result, // Placeholder
    };

    Ok(result)
}

/// Partial verification without key: decode with default alphabet and check checksum
pub fn partial_verify(encoded: &[u8]) -> bool {
    // Use default alphabet
    let alphabet = *BASE64_ALPHABET;

    let mut standard_encoded = Vec::new();
    for &b in encoded {
        if b == b'=' {
            standard_encoded.push(b'=');
        } else {
            let idx = alphabet.iter().position(|&c| c == b).ok_or(()).unwrap_or(0); // Invalid, but continue
            standard_encoded.push(BASE64_ALPHABET[idx]);
        }
    }

    if let Ok(decoded) = general_purpose::STANDARD.decode(&standard_encoded) {
        if decoded.len() >= 4 {
            let data_len = decoded.len() - 4;
            let data = &decoded[..data_len];
            let checksum_bytes = &decoded[data_len..];
            let expected_checksum = u32::from_le_bytes(checksum_bytes.try_into().unwrap());

            let mut crc = Crc32Hasher::new();
            crc.update(data);
            return crc.finalize() == expected_checksum;
        }
    }
    false
}

/// Basic ZK integration: verifies checksum (placeholder for actual ZK proof using halo2)
pub fn zk_checksum_verify(data: &[u8], checksum: u32) -> bool {
    let mut crc = Crc32Hasher::new();
    crc.update(data);
    crc.finalize() == checksum
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encode_decode() {
        let data = b"Hello, Solana!";
        let seed = b"secret_key";
        let encoded = encode(data, seed, CompressionAlgorithm::None);
        let decoded = decode(&encoded, seed, CompressionAlgorithm::None).unwrap();
        assert_eq!(data, decoded.as_slice());
    }

    #[test]
    fn test_partial_verify() {
        let data = b"Test data";
        let seed = b"key";
        let encoded = encode(data, seed, CompressionAlgorithm::None);
        // With correct key, should decode
        assert!(decode(&encoded, seed, CompressionAlgorithm::None).is_ok());
        // Partial verify with wrong key should fail or be false
        // Since it's obfuscated, partial_verify uses default, so checksum won't match
        assert!(!partial_verify(&encoded));
    }

    #[test]
    fn test_zk_verify() {
        let data = b"ZK test";
        let mut crc = Crc32Hasher::new();
        crc.update(data);
        let checksum = crc.finalize();
        assert!(zk_checksum_verify(data, checksum));
    }

    #[test]
    fn test_encode_decode_lz4() {
        let data = b"Repeated data for compression test: test test test test";
        let seed = b"secret_key";
        let encoded = encode(data, seed, CompressionAlgorithm::Lz4);
        let decoded = decode(&encoded, seed, CompressionAlgorithm::Lz4).unwrap();
        assert_eq!(data, decoded.as_slice());
    }
}

pub mod api;
