//! Unit tests for quantum cryptography module

use super::*;
use crate::config::CoreConfig;

#[test]
fn test_crypto_initialization() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let crypto = QuantumCrypto::new(&config.crypto, metrics);
    assert!(crypto.is_ok());
}

#[test]
fn test_key_generation() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let crypto = QuantumCrypto::new(&config.crypto, metrics).unwrap();
    
    // Test Dilithium key generation
    let keypair = crypto.generate_key_pair();
    assert!(keypair.is_ok());
    
    let keypair = keypair.unwrap();
    assert!(!keypair.public_key.is_empty());
    assert!(!keypair.private_key.is_empty());
    assert!(!keypair.id.is_empty());
    assert!(matches!(keypair.key_type, KeyType::Dilithium));
    
    // Test key format validation
    assert!(crypto.validate_key_format(keypair.key_type.clone(), &keypair.public_key));
    assert!(crypto.validate_key_format(keypair.key_type.clone(), &keypair.private_key));
}

#[test]
fn test_signing_and_verification() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let crypto = QuantumCrypto::new(&config.crypto, metrics).unwrap();
    
    let keypair = crypto.generate_key_pair().unwrap();
    let data = b"test data for quantum signatures";
    
    // Test signing
    let signature = crypto.sign(data, &keypair.private_key);
    assert!(signature.is_ok());
    
    let signature = signature.unwrap();
    assert!(!signature.is_empty());
    
    // Test verification
    let is_valid = crypto.verify(data, &signature, &keypair.public_key);
    assert!(is_valid.is_ok());
    assert!(is_valid.unwrap());
    
    // Test with wrong data
    let wrong_data = b"wrong data";
    let is_valid = crypto.verify(wrong_data, &signature, &keypair.public_key);
    assert!(is_valid.is_ok());
    assert!(!is_valid.unwrap());
    
    // Test with wrong public key
    let wrong_keypair = crypto.generate_key_pair().unwrap();
    let is_valid = crypto.verify(data, &signature, &wrong_keypair.public_key);
    assert!(is_valid.is_ok());
    assert!(!is_valid.unwrap());
    
    // Test with wrong signature
    let wrong_signature = vec![0u8; signature.len()];
    let is_valid = crypto.verify(data, &wrong_signature, &keypair.public_key);
    assert!(is_valid.is_ok());
    assert!(!is_valid.unwrap());
}

#[test]
fn test_transaction_hashing() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let crypto = QuantumCrypto::new(&config.crypto, metrics).unwrap();
    
    // Create transaction
    let mut transaction = Transaction::default();
    transaction.sender = [1u8; 32];
    transaction.receiver = [2u8; 32];
    transaction.amount = 1000;
    transaction.nonce = 1;
    
    // Hash transaction
    let hash = crypto.hash_transaction(&transaction);
    assert!(hash.is_ok());
    
    let hash = hash.unwrap();
    assert_eq!(hash.len(), 32);
    
    // Hash same transaction again - should get same hash
    let hash2 = crypto.hash_transaction(&transaction).unwrap();
    assert_eq!(hash, hash2);
    
    // Modify transaction and verify hash changes
    let mut modified_tx = transaction.clone();
    modified_tx.amount = 2000;
    let modified_hash = crypto.hash_transaction(&modified_tx).unwrap();
    assert_ne!(hash, modified_hash);
}

#[test]
fn test_block_hashing() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let crypto = QuantumCrypto::new(&config.crypto, metrics).unwrap();
    
    // Create block
    let mut block = Block::default();
    block.height = 1;
    block.creator = [1u8; 32];
    block.timestamp = current_timestamp_ms();
    
    // Hash block
    let hash = crypto.hash_block(&block);
    assert!(hash.is_ok());
    
    let hash = hash.unwrap();
    assert_eq!(hash.len(), 32);
    
    // Hash same block again - should get same hash
    let hash2 = crypto.hash_block(&block).unwrap();
    assert_eq!(hash, hash2);
    
    // Modify block and verify hash changes
    let mut modified_block = block.clone();
    modified_block.height = 2;
    let modified_hash = crypto.hash_block(&modified_block).unwrap();
    assert_ne!(hash, modified_hash);
}

#[test]
fn test_encryption_decryption() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let crypto = QuantumCrypto::new(&config.crypto, metrics).unwrap();
    
    let keypair = crypto.generate_key_pair().unwrap();
    let plaintext = b"secret quantum message";
    
    // Test encryption
    let ciphertext = crypto.encrypt(plaintext, &keypair.public_key);
    assert!(ciphertext.is_ok());
    
    let ciphertext = ciphertext.unwrap();
    assert!(!ciphertext.is_empty());
    assert_ne!(ciphertext, plaintext);
    
    // Test decryption
    let decrypted = crypto.decrypt(&ciphertext, &keypair.private_key);
    assert!(decrypted.is_ok());
    
    let decrypted = decrypted.unwrap();
    assert_eq!(decrypted, plaintext);
    
    // Test with wrong private key
    let wrong_keypair = crypto.generate_key_pair().unwrap();
    let decrypted = crypto.decrypt(&ciphertext, &wrong_keypair.private_key);
    assert!(decrypted.is_err());
    
    // Test with corrupted ciphertext
    let mut corrupted = ciphertext.clone();
    corrupted[0] ^= 0xFF;
    let decrypted = crypto.decrypt(&corrupted, &keypair.private_key);
    assert!(decrypted.is_err());
}

#[test]
fn test_key_management() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let crypto = QuantumCrypto::new(&config.crypto, metrics).unwrap();
    
    // Generate multiple key pairs
    let keypair1 = crypto.generate_key_pair().unwrap();
    let keypair2 = crypto.generate_key_pair().unwrap();
    
    // Test key retrieval
    let retrieved_keypair = crypto.get_key_pair(&keypair1.id).unwrap();
    assert!(retrieved_keypair.is_some());
    assert_eq!(retrieved_keypair.unwrap().id, keypair1.id);
    
    // Test listing all key pairs
    let all_keypairs = crypto.list_key_pairs();
    assert!(all_keypairs.len() >= 2);
    
    // Test key removal
    crypto.remove_key_pair(&keypair1.id).unwrap();
    let retrieved_keypair = crypto.get_key_pair(&keypair1.id).unwrap();
    assert!(retrieved_keypair.is_none());
    
    // Verify other keypair still exists
    let retrieved_keypair = crypto.get_key_pair(&keypair2.id).unwrap();
    assert!(retrieved_keypair.is_some());
}

#[test]
fn test_shared_secret_generation() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let crypto = QuantumCrypto::new(&config.crypto, metrics).unwrap();
    
    let keypair1 = crypto.generate_key_pair().unwrap();
    let keypair2 = crypto.generate_key_pair().unwrap();
    
    // Generate shared secret
    let shared_secret1 = crypto.generate_shared_secret(&keypair2.public_key, &keypair1.private_key);
    assert!(shared_secret1.is_ok());
    
    let shared_secret1 = shared_secret1.unwrap();
    assert!(!shared_secret1.is_empty());
    
    // Generate shared secret in reverse direction - should be same
    let shared_secret2 = crypto.generate_shared_secret(&keypair1.public_key, &keypair2.private_key);
    assert!(shared_secret2.is_ok());
    
    let shared_secret2 = shared_secret2.unwrap();
    assert_eq!(shared_secret1, shared_secret2);
}

#[test]
fn test_performance_metrics() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let crypto = QuantumCrypto::new(&config.crypto, metrics).unwrap();
    
    let keypair = crypto.generate_key_pair().unwrap();
    let data = b"performance test data";
    
    // Perform multiple operations
    for _ in 0..10 {
        let _signature = crypto.sign(data, &keypair.private_key).unwrap();
        let _is_valid = crypto.verify(data, &_signature, &keypair.public_key).unwrap();
        let _hash = crypto.hash_transaction(&Transaction::default()).unwrap();
    }
    
    // Check performance stats
    let stats = crypto.get_performance_stats();
    assert!(stats.total_operations >= 30); // At least 10 sign + 10 verify + 10 hash
    assert!(stats.failed_operations == 0);
    assert!(stats.avg_signing_time_us > 0);
    assert!(stats.avg_verification_time_us > 0);
    assert!(stats.cache_hit_rate >= 0.0);
    assert!(stats.cache_hit_rate <= 1.0);
}

#[test]
fn test_security_levels() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let crypto = QuantumCrypto::new(&config.crypto, metrics).unwrap();
    
    // Test security level detection
    let security_level = crypto.get_security_level();
    assert!(matches!(security_level, SecurityLevel::QuantumResistant | SecurityLevel::Hybrid));
}

#[test]
fn test_key_rotation() {
    let mut config = CoreConfig::default();
    config.crypto.enable_key_rotation = true;
    config.crypto.key_rotation_interval_secs = 1; // Very short for testing
    
    let metrics = Arc::new(CoreMetrics::new());
    let mut crypto = QuantumCrypto::new(&config.crypto, metrics).unwrap();
    
    // Add some keys to rotation manager
    let keypair = crypto.generate_key_pair().unwrap();
    crypto.key_rotation.active_keys.insert(keypair.id.clone(), keypair.clone());
    crypto.key_rotation.rotation_schedule.insert(keypair.id.clone(), current_timestamp_ms());
    
    // Test key rotation
    let result = crypto.rotate_keys();
    assert!(result.is_ok());
    
    // Verify key was rotated (new key should exist)
    let rotated_key = crypto.key_rotation.active_keys.get(&keypair.id);
    assert!(rotated_key.is_some());
    
    // Verify rotation schedule was updated
    let new_schedule_time = crypto.key_rotation.rotation_schedule.get(&keypair.id);
    assert!(new_schedule_time.is_some());
    assert!(new_schedule_key.unwrap() > crypto.key_rotation.last_check);
}

#[test]
fn test_different_signature_algorithms() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    
    // Test Dilithium
    let mut dilithium_config = config.clone();
    dilithium_config.crypto.signature_algorithm = crate::config::SignatureAlgorithm::Dilithium;
    let dilithium_crypto = QuantumCrypto::new(&dilithium_config.crypto, metrics.clone()).unwrap();
    test_signature_algorithm(&dilithium_crypto);
    
    // Test Sphincs+
    let mut sphincs_config = config.clone();
    sphincs_config.crypto.signature_algorithm = crate::config::SignatureAlgorithm::SphincsPlus;
    let sphincs_crypto = QuantumCrypto::new(&sphincs_config.crypto, metrics.clone()).unwrap();
    test_signature_algorithm(&sphincs_crypto);
    
    // Test Falcon
    let mut falcon_config = config.clone();
    falcon_config.crypto.signature_algorithm = crate::config::SignatureAlgorithm::Falcon;
    let falcon_crypto = QuantumCrypto::new(&falcon_config.crypto, metrics.clone()).unwrap();
    test_signature_algorithm(&falcon_crypto);
    
    // Test Ed25519 (for compatibility)
    let mut ed25519_config = config;
    ed25519_config.crypto.signature_algorithm = crate::config::SignatureAlgorithm::Ed25519;
    let ed25519_crypto = QuantumCrypto::new(&ed25519_config.crypto, metrics).unwrap();
    test_signature_algorithm(&ed25519_crypto);
}

fn test_signature_algorithm(crypto: &QuantumCrypto) {
    let keypair = crypto.generate_key_pair().unwrap();
    let data = b"test data";
    
    let signature = crypto.sign(data, &keypair.private_key).unwrap();
    let is_valid = crypto.verify(data, &signature, &keypair.public_key).unwrap();
    assert!(is_valid);
}

#[test]
fn test_caching_behavior() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let crypto = QuantumCrypto::new(&config.crypto, metrics).unwrap();
    
    let keypair = crypto.generate_key_pair().unwrap();
    let data = b"cache test data";
    
    // First signing - should not be cached
    let start = std::time::Instant::now();
    let _signature1 = crypto.sign(data, &keypair.private_key).unwrap();
    let first_duration = start.elapsed();
    
    // Second signing with same data - should be cached
    let start = std::time::Instant::now();
    let _signature2 = crypto.sign(data, &keypair.private_key).unwrap();
    let second_duration = start.elapsed();
    
    // Cached operation should be faster (or at least not slower)
    println!("First signing: {:?}", first_duration);
    println!("Second signing: {:?}", second_duration);
    
    // Check cache hit rate increased
    let stats = crypto.get_performance_stats();
    assert!(stats.cache_hit_rate > 0.0);
}

#[test]
fn test_error_handling() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let crypto = QuantumCrypto::new(&config.crypto, metrics).unwrap();
    
    // Test with invalid private key size
    let invalid_private_key = [0u8; 32]; // Wrong size for most algorithms
    let result = crypto.sign(b"test", &invalid_private_key);
    assert!(result.is_err());
    
    // Test with invalid signature size
    let invalid_signature = vec![0u8; 10];
    let result = crypto.verify(b"test", &invalid_signature, &[0u8; 32]);
    assert!(result.is_err());
    
    // Test with invalid public key
    let invalid_public_key = [0u8; 10];
    let result = crypto.verify(b"test", &vec![0u8; 2424], &invalid_public_key);
    assert!(result.is_err());
    
    // Test encryption with invalid public key
    let result = crypto.encrypt(b"test", &invalid_public_key);
    assert!(result.is_err());
    
    // Test decryption with invalid ciphertext
    let result = crypto.decrypt(&[0u8; 10], &[0u8; 64]);
    assert!(result.is_err());
}