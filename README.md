# CypherSolBase

A Rust library for Solana implementing a custom Base64-inspired encoding scheme with cryptographic features, compression, and privacy layers.

## Features

- **Dynamic Alphabet Permutation**: Alphabet derived from SHA-256 hash of a private seed for encryption-like encoding.
- **Error Detection**: CRC-32 checksum for data integrity verification.
- **Optional Compression**: Huffman compression to reduce overhead by 25-30% for common patterns like addresses or hashes.
- **Privacy Layer**: Cypherpunk-inspired privacy where decoding without the key is obfuscated but allows partial verification.
- **Solana Integration**: Compatible with Solana smart contracts for NFT metadata or DeFi data.
- **ZK Proofs**: Basic integration with Halo2 for advanced verification.

## Usage

Add to your `Cargo.toml`:

```toml
[dependencies]
cyphersolbase = "0.1.0"
```

### Example

```rust
use cyphersolbase::{encode, decode, partial_verify};

let data = b"Hello, Solana!";
let seed = b"my_secret_seed";

let encoded = encode(data, seed, false);
let decoded = decode(&encoded, seed, false).unwrap();
assert_eq!(data, decoded.as_slice());

// Partial verification without key
assert!(!partial_verify(&encoded)); // Obfuscated
```

## API

- `encode(data: &[u8], seed: &[u8], compress: bool) -> Vec<u8>`: Encode data with custom alphabet, checksum, and optional compression.
- `decode(encoded: &[u8], seed: &[u8], compressed: bool) -> Result<Vec<u8>, &'static str>`: Decode and verify data.
- `partial_verify(encoded: &[u8]) -> bool`: Partial verification without key.
- `zk_checksum_verify(data: &[u8], checksum: u32) -> bool`: Basic ZK-inspired checksum verification.

## Security

- Uses SHA-256 for key derivation.
- CRC-32 for integrity (not cryptographic security).
- Designed for efficiency on Solana to reduce on-chain fees.

## Compatibility

- Rust 1.70+
- Solana crates standard.

## Tests

Run `cargo test` to execute unit tests.

## License

MIT