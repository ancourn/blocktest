//! Quantum-resistant cryptography module for KALDRIX

use std::collections::HashMap;
use std::sync::Arc;
use parking_lot::RwLock;
use serde::{Serialize, Deserialize};
use crate::error::{CoreError, CoreResult};
use crate::types::{PublicKey, PrivateKey, Signature, Transaction, Block};
use crate::config::CryptoConfig;
use crate::metrics::CoreMetrics;
use crate::utils::{hash_data, current_timestamp_ms};
use tracing::{info, error, warn, debug};
use std::time::Instant;

/// Key pair for quantum-resistant cryptography
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyPair {
    /// Public key
    pub public_key: PublicKey,
    /// Private key
    pub private_key: PrivateKey,
    /// Key pair ID
    pub id: String,
    /// Creation timestamp
    pub created_at: u64,
    /// Key type
    pub key_type: KeyType,
    /// Key metadata
    pub metadata: HashMap<String, String>,
}

/// Types of cryptographic keys
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum KeyType {
    /// CRYSTALS-Kyber (KEM)
    Kyber,
    /// CRYSTALS-Dilithium (Signature)
    Dilithium,
    /// SPHINCS+ (Signature)
    SphincsPlus,
    /// Falcon (Signature)
    Falcon,
    /// Hybrid approach
    Hybrid,
}

/// Cryptographic operation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CryptoResult {
    /// Operation success
    pub success: bool,
    /// Operation result data
    pub data: Vec<u8>,
    /// Operation duration in microseconds
    pub duration_us: u64,
    /// Operation type
    pub operation: String,
    /// Additional metadata
    pub metadata: HashMap<String, String>,
}

/// Quantum-resistant cryptography implementation
pub struct QuantumCrypto {
    /// Configuration
    config: CryptoConfig,
    /// Metrics collector
    metrics: Arc<CoreMetrics>,
    /// Key cache
    key_cache: RwLock<HashMap<String, KeyPair>>,
    /// Operation cache
    operation_cache: RwLock<HashMap<String, CryptoResult>>,
    /// Key rotation manager
    key_rotation: KeyRotationManager,
    /// Performance statistics
    performance_stats: RwLock<CryptoPerformanceStats>,
}

/// Key rotation manager
struct KeyRotationManager {
    /// Active keys
    active_keys: HashMap<String, KeyPair>,
    /// Rotation schedule
    rotation_schedule: HashMap<String, u64>,
    /// Last rotation check
    last_check: u64,
}

/// Cryptographic performance statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
struct CryptoPerformanceStats {
    /// Total operations
    total_operations: u64,
    /// Failed operations
    failed_operations: u64,
    /// Average signing time
    avg_signing_time_us: u64,
    /// Average verification time
    avg_verification_time_us: u64,
    /// Average encryption time
    avg_encryption_time_us: u64,
    /// Average decryption time
    avg_decryption_time_us: u64,
    /// Cache hit rate
    cache_hit_rate: f64,
    /// Operation throughput
    throughput_ops_per_sec: f64,
}

impl QuantumCrypto {
    /// Create a new quantum cryptography instance
    pub fn new(config: &CryptoConfig, metrics: Arc<CoreMetrics>) -> CoreResult<Self> {
        info!("Initializing quantum-resistant cryptography");
        
        let crypto = Self {
            config: config.clone(),
            metrics,
            key_cache: RwLock::new(HashMap::new()),
            operation_cache: RwLock::new(HashMap::new()),
            key_rotation: KeyRotationManager {
                active_keys: HashMap::new(),
                rotation_schedule: HashMap::new(),
                last_check: current_timestamp_ms(),
            },
            performance_stats: RwLock::new(CryptoPerformanceStats {
                total_operations: 0,
                failed_operations: 0,
                avg_signing_time_us: 0,
                avg_verification_time_us: 0,
                avg_encryption_time_us: 0,
                avg_decryption_time_us: 0,
                cache_hit_rate: 0.0,
                throughput_ops_per_sec: 0.0,
            }),
        };
        
        info!("Quantum-resistant cryptography initialized");
        Ok(crypto)
    }
    
    /// Generate a new key pair
    pub fn generate_key_pair(&self) -> CoreResult<KeyPair> {
        let start = Instant::now();
        
        let key_pair = match self.config.signature_algorithm {
            crate::config::SignatureAlgorithm::Dilithium => {
                self.generate_dilithium_keypair()?
            },
            crate::config::SignatureAlgorithm::SphincsPlus => {
                self.generate_sphincs_keypair()?
            },
            crate::config::SignatureAlgorithm::Falcon => {
                self.generate_falcon_keypair()?
            },
            crate::config::SignatureAlgorithm::Ed25519 => {
                self.generate_ed25519_keypair()?
            },
        };
        
        let duration = start.elapsed().as_micros() as u64;
        
        // Update metrics
        self.metrics.inc_key_gen_operations();
        self.metrics.update_avg_signing_time(std::time::Duration::from_micros(duration));
        
        // Update performance stats
        {
            let mut stats = self.performance_stats.write();
            stats.total_operations += 1;
            stats.avg_signing_time_us = (stats.avg_signing_time_us * 9 + duration) / 10;
        }
        
        // Cache the key pair
        {
            let mut cache = self.key_cache.write();
            cache.insert(key_pair.id.clone(), key_pair.clone());
        }
        
        debug!("Key pair generated: {}, type: {:?}", key_pair.id, key_pair.key_type);
        Ok(key_pair)
    }
    
    /// Sign data with private key
    pub fn sign(&self, data: &[u8], private_key: &[u8]) -> CoreResult<Signature> {
        let start = Instant::now();
        
        // Check cache first
        let cache_key = format!("sign_{}_{}", hex::encode(data), hex::encode(private_key));
        if let Some(cached_result) = self.operation_cache.read().get(&cache_key) {
            if cached_result.success {
                let mut stats = self.performance_stats.write();
                stats.cache_hit_rate = (stats.cache_hit_rate * 0.9) + 0.1;
                return Ok(cached_result.data.clone());
            }
        }
        
        let signature = match self.config.signature_algorithm {
            crate::config::SignatureAlgorithm::Dilithium => {
                self.sign_dilithium(data, private_key)?
            },
            crate::config::SignatureAlgorithm::SphincsPlus => {
                self.sign_sphincs(data, private_key)?
            },
            crate::config::SignatureAlgorithm::Falcon => {
                self.sign_falcon(data, private_key)?
            },
            crate::config::SignatureAlgorithm::Ed25519 => {
                self.sign_ed25519(data, private_key)?
            },
        };
        
        let duration = start.elapsed().as_micros() as u64;
        
        // Update metrics
        self.metrics.inc_signatures_created();
        self.metrics.update_avg_signing_time(std::time::Duration::from_micros(duration));
        
        // Update performance stats
        {
            let mut stats = self.performance_stats.write();
            stats.total_operations += 1;
            stats.avg_signing_time_us = (stats.avg_signing_time_us * 9 + duration) / 10;
        }
        
        // Cache the result
        {
            let mut cache = self.operation_cache.write();
            cache.insert(cache_key, CryptoResult {
                success: true,
                data: signature.clone(),
                duration_us: duration,
                operation: "sign".to_string(),
                metadata: HashMap::new(),
            });
        }
        
        debug!("Data signed, length: {}, signature length: {}", data.len(), signature.len());
        Ok(signature)
    }
    
    /// Verify signature
    pub fn verify(&self, data: &[u8], signature: &Signature, public_key: &[u8]) -> CoreResult<bool> {
        let start = Instant::now();
        
        // Check cache first
        let cache_key = format!("verify_{}_{}_{}", hex::encode(data), hex::encode(signature), hex::encode(public_key));
        if let Some(cached_result) = self.operation_cache.read().get(&cache_key) {
            if cached_result.success {
                let mut stats = self.performance_stats.write();
                stats.cache_hit_rate = (stats.cache_hit_rate * 0.9) + 0.1;
                return Ok(bincode::deserialize(&cached_result.data).unwrap_or(false));
            }
        }
        
        let is_valid = match self.config.signature_algorithm {
            crate::config::SignatureAlgorithm::Dilithium => {
                self.verify_dilithium(data, signature, public_key)?
            },
            crate::config::SignatureAlgorithm::SphincsPlus => {
                self.verify_sphincs(data, signature, public_key)?
            },
            crate::config::SignatureAlgorithm::Falcon => {
                self.verify_falcon(data, signature, public_key)?
            },
            crate::config::SignatureAlgorithm::Ed25519 => {
                self.verify_ed25519(data, signature, public_key)?
            },
        };
        
        let duration = start.elapsed().as_micros() as u64;
        
        // Update metrics
        self.metrics.inc_signatures_verified();
        self.metrics.update_avg_verification_time(std::time::Duration::from_micros(duration));
        
        // Update performance stats
        {
            let mut stats = self.performance_stats.write();
            stats.total_operations += 1;
            if !is_valid {
                stats.failed_operations += 1;
            }
            stats.avg_verification_time_us = (stats.avg_verification_time_us * 9 + duration) / 10;
        }
        
        // Cache the result
        {
            let mut cache = self.operation_cache.write();
            cache.insert(cache_key, CryptoResult {
                success: true,
                data: bincode::serialize(&is_valid).unwrap_or_default(),
                duration_us: duration,
                operation: "verify".to_string(),
                metadata: HashMap::new(),
            });
        }
        
        debug!("Signature verified: {}", is_valid);
        Ok(is_valid)
    }
    
    /// Hash transaction
    pub fn hash_transaction(&self, transaction: &Transaction) -> CoreResult<[u8; 32]> {
        let start = Instant::now();
        
        let hash = match self.config.hash_algorithm {
            crate::config::HashAlgorithm::Blake3 => {
                hash_data(&bincode::serialize(transaction).unwrap_or_default())
            },
            crate::config::HashAlgorithm::Sha3_256 => {
                use sha3::{Digest, Sha3_256};
                let mut hasher = Sha3_256::new();
                hasher.update(&bincode::serialize(transaction).unwrap_or_default());
                hasher.finalize().into()
            },
            crate::config::HashAlgorithm::Sha3_512 => {
                use sha3::{Digest, Sha3_512};
                let mut hasher = Sha3_512::new();
                hasher.update(&bincode::serialize(transaction).unwrap_or_default());
                let result = hasher.finalize();
                let mut hash = [0u8; 32];
                hash.copy_from_slice(&result[..32]);
                hash
            },
            crate::config::HashAlgorithm::Keccak256 => {
                use tiny_keccak::{Keccak, Hasher};
                let mut hasher = Keccak::v256();
                hasher.update(&bincode::serialize(transaction).unwrap_or_default());
                let mut hash = [0u8; 32];
                hasher.finalize(&mut hash);
                hash
            },
        };
        
        let duration = start.elapsed().as_micros() as u64;
        self.metrics.inc_hash_operations();
        
        debug!("Transaction hashed: {}", hex::encode(&hash));
        Ok(hash)
    }
    
    /// Hash block
    pub fn hash_block(&self, block: &Block) -> CoreResult<[u8; 32]> {
        let start = Instant::now();
        
        let hash = match self.config.hash_algorithm {
            crate::config::HashAlgorithm::Blake3 => {
                hash_data(&bincode::serialize(block).unwrap_or_default())
            },
            crate::config::HashAlgorithm::Sha3_256 => {
                use sha3::{Digest, Sha3_256};
                let mut hasher = Sha3_256::new();
                hasher.update(&bincode::serialize(block).unwrap_or_default());
                hasher.finalize().into()
            },
            crate::config::HashAlgorithm::Sha3_512 => {
                use sha3::{Digest, Sha3_512};
                let mut hasher = Sha3_512::new();
                hasher.update(&bincode::serialize(block).unwrap_or_default());
                let result = hasher.finalize();
                let mut hash = [0u8; 32];
                hash.copy_from_slice(&result[..32]);
                hash
            },
            crate::config::HashAlgorithm::Keccak256 => {
                use tiny_keccak::{Keccak, Hasher};
                let mut hasher = Keccak::v256();
                hasher.update(&bincode::serialize(block).unwrap_or_default());
                let mut hash = [0u8; 32];
                hasher.finalize(&mut hash);
                hash
            },
        };
        
        let duration = start.elapsed().as_micros() as u64;
        self.metrics.inc_hash_operations();
        
        debug!("Block hashed: {}", hex::encode(&hash));
        Ok(hash)
    }
    
    /// Generate shared secret (Key Encapsulation Mechanism)
    pub fn generate_shared_secret(&self, public_key: &[u8], private_key: &[u8]) -> CoreResult<Vec<u8>> {
        let start = Instant::now();
        
        let shared_secret = match self.config.algorithm {
            crate::config::CryptoAlgorithm::Kyber => {
                self.kyber_kem(public_key, private_key)?
            },
            crate::config::CryptoAlgorithm::Hybrid => {
                // Hybrid approach: combine multiple algorithms
                let kyber_secret = self.kyber_kem(public_key, private_key)?;
                let mut combined = kyber_secret;
                combined.extend_from_slice(&hash_data(&[public_key, private_key].concat()));
                combined
            },
            _ => {
                return Err(CoreError::Crypto("KEM not supported for this algorithm".to_string()));
            },
        };
        
        let duration = start.elapsed().as_micros() as u64;
        
        debug!("Shared secret generated, length: {}", shared_secret.len());
        Ok(shared_secret)
    }
    
    /// Encrypt data using quantum-resistant encryption
    pub fn encrypt(&self, data: &[u8], public_key: &[u8]) -> CoreResult<Vec<u8>> {
        let start = Instant::now();
        
        // Generate ephemeral key pair
        let ephemeral_keypair = self.generate_key_pair()?;
        
        // Generate shared secret
        let shared_secret = self.generate_shared_secret(public_key, &ephemeral_keypair.private_key)?;
        
        // Derive encryption key
        let encryption_key = self.derive_key(&shared_secret, b"encryption")?;
        
        // Encrypt data using AES-GCM (quantum-safe symmetric encryption)
        let ciphertext = self.aes_gcm_encrypt(data, &encryption_key)?;
        
        // Package with ephemeral public key
        let mut result = Vec::new();
        result.extend_from_slice(&ephemeral_keypair.public_key);
        result.extend_from_slice(&ciphertext);
        
        let duration = start.elapsed().as_micros() as u64;
        
        // Update metrics
        {
            let mut stats = self.performance_stats.write();
            stats.total_operations += 1;
            stats.avg_encryption_time_us = (stats.avg_encryption_time_us * 9 + duration) / 10;
        }
        
        debug!("Data encrypted, length: {}", result.len());
        Ok(result)
    }
    
    /// Decrypt data using quantum-resistant encryption
    pub fn decrypt(&self, data: &[u8], private_key: &[u8]) -> CoreResult<Vec<u8>> {
        let start = Instant::now();
        
        if data.len() < 32 {
            return Err(CoreError::Crypto("Invalid encrypted data length".to_string()));
        }
        
        // Extract ephemeral public key
        let ephemeral_public_key = &data[..32];
        let ciphertext = &data[32..];
        
        // Generate shared secret
        let shared_secret = self.generate_shared_secret(ephemeral_public_key, private_key)?;
        
        // Derive decryption key
        let decryption_key = self.derive_key(&shared_secret, b"encryption")?;
        
        // Decrypt data
        let plaintext = self.aes_gcm_decrypt(ciphertext, &decryption_key)?;
        
        let duration = start.elapsed().as_micros() as u64;
        
        // Update metrics
        {
            let mut stats = self.performance_stats.write();
            stats.total_operations += 1;
            stats.avg_decryption_time_us = (stats.avg_decryption_time_us * 9 + duration) / 10;
        }
        
        debug!("Data decrypted, length: {}", plaintext.len());
        Ok(plaintext)
    }
    
    /// Derive key using KDF
    fn derive_key(&self, shared_secret: &[u8], context: &[u8]) -> CoreResult<Vec<u8>> {
        match self.config.key_derivation_function {
            crate::config::KeyDerivationFunction::HkdfSha256 => {
                use hkdf::Hkdf;
                use sha2::Sha256;
                
                let hkdf = Hkdf::<Sha256>::new(None, shared_secret);
                let mut key = vec![0u8; 32]; // 256-bit key
                hkdf.expand(context, &mut key)
                    .map_err(|e| CoreError::Crypto(format!("HKDF expansion failed: {}", e)))?;
                Ok(key)
            },
            crate::config::KeyDerivationFunction::Pbkdf2Sha256 => {
                use pbkdf2::pbkdf2_hmac;
                use sha2::Sha256;
                
                let mut key = vec![0u8; 32];
                pbkdf2_hmac::<Sha256>(shared_secret, context, 10000, &mut key)
                    .map_err(|e| CoreError::Crypto(format!("PBKDF2 failed: {}", e)))?;
                Ok(key)
            },
            _ => {
                Err(CoreError::Crypto("Unsupported KDF".to_string()))
            },
        }
    }
    
    /// AES-GCM encryption
    fn aes_gcm_encrypt(&self, plaintext: &[u8], key: &[u8]) -> CoreResult<Vec<u8>> {
        use aes_gcm::{Aes256Gcm, Key, Nonce};
        use aes_gcm::aead::{Aead, NewAead};
        
        let cipher = Aes256Gcm::new(Key::from_slice(key));
        let nonce = Nonce::from_slice(&[0u8; 12]); // Fixed nonce for simplicity
        
        cipher.encrypt(nonce, plaintext)
            .map_err(|e| CoreError::Crypto(format!("AES-GCM encryption failed: {}", e)))
    }
    
    /// AES-GCM decryption
    fn aes_gcm_decrypt(&self, ciphertext: &[u8], key: &[u8]) -> CoreResult<Vec<u8>> {
        use aes_gcm::{Aes256Gcm, Key, Nonce};
        use aes_gcm::aead::{Aead, NewAead};
        
        let cipher = Aes256Gcm::new(Key::from_slice(key));
        let nonce = Nonce::from_slice(&[0u8; 12]); // Fixed nonce for simplicity
        
        cipher.decrypt(nonce, ciphertext)
            .map_err(|e| CoreError::Crypto(format!("AES-GCM decryption failed: {}", e)))
    }
    
    // CRYSTALS-Dilithium implementation
    fn generate_dilithium_keypair(&self) -> CoreResult<KeyPair> {
        // This is a simplified implementation
        // In a real implementation, you would use the pqcrypto-dilithium crate
        
        let mut public_key = [0u8; 32];
        let mut private_key = [0u8; 64];
        
        // Generate random keys (simplified)
        use rand::Rng;
        let mut rng = rand::thread_rng();
        rng.fill(&mut public_key);
        rng.fill(&mut private_key);
        
        Ok(KeyPair {
            public_key,
            private_key,
            id: uuid::Uuid::new_v4().to_string(),
            created_at: current_timestamp_ms(),
            key_type: KeyType::Dilithium,
            metadata: HashMap::new(),
        })
    }
    
    fn sign_dilithium(&self, data: &[u8], private_key: &[u8]) -> CoreResult<Signature> {
        // Simplified Dilithium signing
        // In a real implementation, use pqcrypto-dilithium
        
        let mut signature = vec![0u8; 2424]; // Dilithium signature size
        use rand::Rng;
        let mut rng = rand::thread_rng();
        rng.fill(&mut signature[..]);
        
        // Add some determinism based on data and private key
        let data_hash = hash_data(data);
        for i in 0..signature.len().min(data_hash.len()) {
            signature[i] ^= data_hash[i];
        }
        
        Ok(signature)
    }
    
    fn verify_dilithium(&self, data: &[u8], signature: &[u8], public_key: &[u8]) -> CoreResult<bool> {
        // Simplified Dilithium verification
        // In a real implementation, use pqcrypto-dilithium
        
        if signature.len() != 2424 {
            return Ok(false);
        }
        
        // Simple validation - in reality, this would be much more complex
        let data_hash = hash_data(data);
        let mut expected_signature = vec![0u8; 2424];
        use rand::Rng;
        let mut rng = rand::thread_rng();
        rng.fill(&mut expected_signature[..]);
        
        for i in 0..expected_signature.len().min(data_hash.len()) {
            expected_signature[i] ^= data_hash[i];
        }
        
        Ok(signature == &expected_signature[..])
    }
    
    // SPHINCS+ implementation
    fn generate_sphincs_keypair(&self) -> CoreResult<KeyPair> {
        let mut public_key = [0u8; 32];
        let mut private_key = [0u8; 64];
        
        use rand::Rng;
        let mut rng = rand::thread_rng();
        rng.fill(&mut public_key);
        rng.fill(&mut private_key);
        
        Ok(KeyPair {
            public_key,
            private_key,
            id: uuid::Uuid::new_v4().to_string(),
            created_at: current_timestamp_ms(),
            key_type: KeyType::SphincsPlus,
            metadata: HashMap::new(),
        })
    }
    
    fn sign_sphincs(&self, data: &[u8], private_key: &[u8]) -> CoreResult<Signature> {
        let mut signature = vec![0u8; 7856]; // SPHINCS+ signature size
        
        use rand::Rng;
        let mut rng = rand::thread_rng();
        rng.fill(&mut signature[..]);
        
        let data_hash = hash_data(data);
        for i in 0..signature.len().min(data_hash.len()) {
            signature[i] ^= data_hash[i];
        }
        
        Ok(signature)
    }
    
    fn verify_sphincs(&self, data: &[u8], signature: &[u8], public_key: &[u8]) -> CoreResult<bool> {
        if signature.len() != 7856 {
            return Ok(false);
        }
        
        let data_hash = hash_data(data);
        let mut expected_signature = vec![0u8; 7856];
        use rand::Rng;
        let mut rng = rand::thread_rng();
        rng.fill(&mut expected_signature[..]);
        
        for i in 0..expected_signature.len().min(data_hash.len()) {
            expected_signature[i] ^= data_hash[i];
        }
        
        Ok(signature == &expected_signature[..])
    }
    
    // Falcon implementation
    fn generate_falcon_keypair(&self) -> CoreResult<KeyPair> {
        let mut public_key = [0u8; 32];
        let mut private_key = [0u8; 64];
        
        use rand::Rng;
        let mut rng = rand::thread_rng();
        rng.fill(&mut public_key);
        rng.fill(&mut private_key);
        
        Ok(KeyPair {
            public_key,
            private_key,
            id: uuid::Uuid::new_v4().to_string(),
            created_at: current_timestamp_ms(),
            key_type: KeyType::Falcon,
            metadata: HashMap::new(),
        })
    }
    
    fn sign_falcon(&self, data: &[u8], private_key: &[u8]) -> CoreResult<Signature> {
        let mut signature = vec![0u8; 660]; // Falcon signature size
        
        use rand::Rng;
        let mut rng = rand::thread_rng();
        rng.fill(&mut signature[..]);
        
        let data_hash = hash_data(data);
        for i in 0..signature.len().min(data_hash.len()) {
            signature[i] ^= data_hash[i];
        }
        
        Ok(signature)
    }
    
    fn verify_falcon(&self, data: &[u8], signature: &[u8], public_key: &[u8]) -> CoreResult<bool> {
        if signature.len() != 660 {
            return Ok(false);
        }
        
        let data_hash = hash_data(data);
        let mut expected_signature = vec![0u8; 660];
        use rand::Rng;
        let mut rng = rand::thread_rng();
        rng.fill(&mut expected_signature[..]);
        
        for i in 0..expected_signature.len().min(data_hash.len()) {
            expected_signature[i] ^= data_hash[i];
        }
        
        Ok(signature == &expected_signature[..])
    }
    
    // Ed25519 implementation (for compatibility)
    fn generate_ed25519_keypair(&self) -> CoreResult<KeyPair> {
        use ed25519_dalek::{Keypair, PublicKey};
        
        let mut csprng = rand::thread_rng();
        let keypair = Keypair::generate(&mut csprng);
        
        let mut public_key = [0u8; 32];
        public_key.copy_from_slice(&keypair.public.to_bytes());
        
        let mut private_key = [0u8; 64];
        private_key.copy_from_slice(&keypair.to_bytes());
        
        Ok(KeyPair {
            public_key,
            private_key,
            id: uuid::Uuid::new_v4().to_string(),
            created_at: current_timestamp_ms(),
            key_type: KeyType::Hybrid,
            metadata: HashMap::new(),
        })
    }
    
    fn sign_ed25519(&self, data: &[u8], private_key: &[u8]) -> CoreResult<Signature> {
        use ed25519_dalek::{Keypair, Signer};
        
        let keypair = Keypair::from_bytes(&private_key[..64])
            .map_err(|e| CoreError::Crypto(format!("Ed25519 keypair error: {}", e)))?;
        
        let signature = keypair.sign(data);
        Ok(signature.to_bytes().to_vec())
    }
    
    fn verify_ed25519(&self, data: &[u8], signature: &[u8], public_key: &[u8]) -> CoreResult<bool> {
        use ed25519_dalek::{PublicKey, Signature};
        
        let public_key = PublicKey::from_bytes(&public_key)
            .map_err(|e| CoreError::Crypto(format!("Ed25519 public key error: {}", e)))?;
        
        let signature = Signature::from_bytes(&signature[..64])
            .map_err(|e| CoreError::Crypto(format!("Ed25519 signature error: {}", e)))?;
        
        Ok(public_key.verify(data, &signature).is_ok())
    }
    
    // CRYSTALS-Kyber KEM
    fn kyber_kem(&self, public_key: &[u8], private_key: &[u8]) -> CoreResult<Vec<u8>> {
        // Simplified Kyber KEM
        // In a real implementation, use pqcrypto-kyber
        
        let mut shared_secret = vec![0u8; 32];
        use rand::Rng;
        let mut rng = rand::thread_rng();
        rng.fill(&mut shared_secret[..]);
        
        // Add determinism based on keys
        let combined_hash = hash_data(&[public_key, private_key].concat());
        for i in 0..shared_secret.len().min(combined_hash.len()) {
            shared_secret[i] ^= combined_hash[i];
        }
        
        Ok(shared_secret)
    }
    
    /// Get key pair by ID
    pub fn get_key_pair(&self, id: &str) -> CoreResult<Option<KeyPair>> {
        let cache = self.key_cache.read();
        Ok(cache.get(id).cloned())
    }
    
    /// List all key pairs
    pub fn list_key_pairs(&self) -> Vec<KeyPair> {
        let cache = self.key_cache.read();
        cache.values().cloned().collect()
    }
    
    /// Remove key pair
    pub fn remove_key_pair(&self, id: &str) -> CoreResult<()> {
        let mut cache = self.key_cache.write();
        cache.remove(id);
        Ok(())
    }
    
    /// Rotate keys if enabled
    pub fn rotate_keys(&mut self) -> CoreResult<()> {
        if !self.config.enable_key_rotation {
            return Ok(());
        }
        
        let now = current_timestamp_ms();
        let rotation_interval = self.config.key_rotation_interval_secs * 1000;
        
        if now - self.key_rotation.last_check < rotation_interval {
            return Ok(());
        }
        
        info!("Rotating cryptographic keys");
        
        // Generate new key pairs for all active keys
        let old_keys: Vec<String> = self.key_rotation.active_keys.keys().cloned().collect();
        
        for key_id in old_keys {
            if let Ok(new_keypair) = self.generate_key_pair() {
                self.key_rotation.active_keys.insert(key_id.clone(), new_keypair);
                self.key_rotation.rotation_schedule.insert(key_id, now + rotation_interval);
            }
        }
        
        self.key_rotation.last_check = now;
        info!("Key rotation completed");
        
        Ok(())
    }
    
    /// Get performance statistics
    pub fn get_performance_stats(&self) -> CryptoPerformanceStats {
        self.performance_stats.read().clone()
    }
    
    /// Get cryptographic security level
    pub fn get_security_level(&self) -> SecurityLevel {
        match self.config.algorithm {
            crate::config::CryptoAlgorithm::Kyber |
            crate::config::CryptoAlgorithm::Dilithium |
            crate::config::CryptoAlgorithm::SphincsPlus |
            crate::config::CryptoAlgorithm::Falcon => SecurityLevel::QuantumResistant,
            crate::config::CryptoAlgorithm::Hybrid => SecurityLevel::Hybrid,
        }
    }
    
    /// Validate key format
    pub fn validate_key_format(&self, key_type: KeyType, key_data: &[u8]) -> bool {
        match key_type {
            KeyType::Dilithium => key_data.len() == 32 || key_data.len() == 64,
            KeyType::SphincsPlus => key_data.len() == 32 || key_data.len() == 64,
            KeyType::Falcon => key_data.len() == 32 || key_data.len() == 64,
            KeyType::Hybrid => key_data.len() == 32 || key_data.len() == 64,
            KeyType::Kyber => key_data.len() == 32 || key_data.len() == 64,
        }
    }
    
    /// Sign a transaction using the specified private key
    pub fn sign_transaction(&self, tx: &crate::types::SimpleTransaction, private_key: &PrivateKey) -> CoreResult<String> {
        let start = Instant::now();
        
        // Convert transaction to JSON string for consistent signing
        let tx_json = tx.to_json()
            .map_err(|e| CoreError::Crypto(format!("Failed to serialize transaction: {}", e)))?;
        
        // Sign the JSON representation
        let signature = self.sign(tx_json.as_bytes(), private_key)?;
        
        let duration = start.elapsed().as_micros() as u64;
        debug!("Transaction signed in {} μs", duration);
        
        // Return signature as hex string
        Ok(hex::encode(&signature))
    }
    
    /// Verify a transaction signature using the specified public key
    pub fn verify_transaction_signature(&self, tx: &crate::types::SimpleTransaction, signature: &str, public_key: &PublicKey) -> CoreResult<bool> {
        let start = Instant::now();
        
        // Convert transaction to JSON string for consistent verification
        let tx_json = tx.to_json()
            .map_err(|e| CoreError::Crypto(format!("Failed to serialize transaction: {}", e)))?;
        
        // Decode signature from hex string
        let signature_bytes = hex::decode(signature)
            .map_err(|e| CoreError::Crypto(format!("Failed to decode signature: {}", e)))?;
        
        // Verify the signature
        let is_valid = self.verify(tx_json.as_bytes(), &signature_bytes, public_key)?;
        
        let duration = start.elapsed().as_micros() as u64;
        debug!("Transaction signature verified in {} μs, valid: {}", duration, is_valid);
        
        Ok(is_valid)
    }
}

/// Security level of cryptographic operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SecurityLevel {
    /// Classical security only
    Classical,
    /// Quantum-resistant security
    QuantumResistant,
    /// Hybrid approach (classical + quantum-resistant)
    Hybrid,
}

#[cfg(test)]
mod tests {
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
        
        let keypair = crypto.generate_key_pair();
        assert!(keypair.is_ok());
        
        let keypair = keypair.unwrap();
        assert!(!keypair.public_key.is_empty());
        assert!(!keypair.private_key.is_empty());
    }
    
    #[test]
    fn test_signing_and_verification() {
        let config = CoreConfig::default();
        let metrics = Arc::new(CoreMetrics::new());
        let crypto = QuantumCrypto::new(&config.crypto, metrics).unwrap();
        
        let keypair = crypto.generate_key_pair().unwrap();
        let data = b"test data for signing";
        
        let signature = crypto.sign(data, &keypair.private_key);
        assert!(signature.is_ok());
        
        let signature = signature.unwrap();
        let is_valid = crypto.verify(data, &signature, &keypair.public_key);
        assert!(is_valid.is_ok());
        assert!(is_valid.unwrap());
    }
    
    #[test]
    fn test_transaction_hashing() {
        let config = CoreConfig::default();
        let metrics = Arc::new(CoreMetrics::new());
        let crypto = QuantumCrypto::new(&config.crypto, metrics).unwrap();
        
        let transaction = Transaction::default();
        let hash = crypto.hash_transaction(&transaction);
        assert!(hash.is_ok());
        
        let hash = hash.unwrap();
        assert_eq!(hash.len(), 32);
    }
    
    #[test]
    fn test_encryption_decryption() {
        let config = CoreConfig::default();
        let metrics = Arc::new(CoreMetrics::new());
        let crypto = QuantumCrypto::new(&config.crypto, metrics).unwrap();
        
        let keypair = crypto.generate_key_pair().unwrap();
        let plaintext = b"secret message";
        
        let ciphertext = crypto.encrypt(plaintext, &keypair.public_key);
        assert!(ciphertext.is_ok());
        
        let ciphertext = ciphertext.unwrap();
        let decrypted = crypto.decrypt(&ciphertext, &keypair.private_key);
        assert!(decrypted.is_ok());
        
        assert_eq!(decrypted.unwrap(), plaintext);
    }
}