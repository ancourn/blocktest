//! Configuration for the KALDRIX blockchain core

use serde::{Serialize, Deserialize};
use std::path::PathBuf;

/// Main configuration for the blockchain core
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoreConfig {
    /// DAG engine configuration
    pub dag: DAGConfig,
    /// Consensus engine configuration
    pub consensus: ConsensusConfig,
    /// Cryptography configuration
    pub crypto: CryptoConfig,
    /// Network configuration
    pub network: NetworkConfig,
    /// Storage configuration
    pub storage: StorageConfig,
    /// Logging configuration
    pub logging: LoggingConfig,
    /// Metrics configuration
    pub metrics: MetricsConfig,
}

/// DAG engine configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DAGConfig {
    /// Maximum number of transactions per block
    pub max_transactions_per_block: usize,
    /// Maximum number of parent blocks
    pub max_parents: usize,
    /// Block time target in milliseconds
    pub block_time_target_ms: u64,
    /// Maximum DAG depth
    pub max_dag_depth: u64,
    /// Transaction pool size
    pub transaction_pool_size: usize,
    /// Bundle size for transaction grouping
    pub bundle_size: usize,
    /// Maximum bundle size
    pub max_bundle_size: usize,
    /// Enable transaction prioritization
    pub enable_prioritization: bool,
    /// Enable parallel execution
    pub enable_parallel_execution: bool,
    /// Cache size for DAG nodes
    pub cache_size: usize,
    /// Pruning enabled
    pub pruning_enabled: bool,
    /// Pruning interval in blocks
    pub pruning_interval: u64,
    /// Maximum orphan blocks
    pub max_orphan_blocks: usize,
}

/// Consensus engine configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsensusConfig {
    /// Consensus algorithm type
    pub algorithm: ConsensusAlgorithm,
    /// Number of validators
    pub num_validators: usize,
    /// Minimum validators required
    pub min_validators: usize,
    /// Block proposal timeout in milliseconds
    pub proposal_timeout_ms: u64,
    /// Voting timeout in milliseconds
    pub voting_timeout_ms: u64,
    /// View change timeout in milliseconds
    pub view_change_timeout_ms: u64,
    /// Minimum stake for validators
    pub min_stake: u128,
    /// Maximum stake for validators
    pub max_stake: u128,
    /// Reward per block
    pub block_reward: u128,
    /// Slashing penalty
    pub slashing_penalty: f64,
    /// Enable view changes
    pub enable_view_changes: bool,
    /// Enable finality gadget
    pub enable_finality: bool,
    /// Finality threshold (percentage)
    pub finality_threshold: f64,
    /// Byzantine fault tolerance threshold (percentage)
    pub bft_threshold: f64,
}

/// Cryptography configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CryptoConfig {
    /// Post-quantum algorithm to use
    pub algorithm: CryptoAlgorithm,
    /// Key size in bits
    pub key_size_bits: usize,
    /// Signature algorithm
    pub signature_algorithm: SignatureAlgorithm,
    /// Hash algorithm
    pub hash_algorithm: HashAlgorithm,
    /// Enable quantum signatures
    pub enable_quantum_signatures: bool,
    /// Key derivation function
    pub key_derivation_function: KeyDerivationFunction,
    /// Enable key rotation
    pub enable_key_rotation: bool,
    /// Key rotation interval in seconds
    pub key_rotation_interval_secs: u64,
}

/// Network configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkConfig {
    /// Listen addresses
    pub listen_addresses: Vec<String>,
    /// Bootstrap nodes
    pub bootstrap_nodes: Vec<String>,
    /// Maximum peers
    pub max_peers: usize,
    /// Minimum peers
    pub min_peers: usize,
    /// Connection timeout in seconds
    pub connection_timeout_secs: u64,
    /// Handshake timeout in seconds
    pub handshake_timeout_secs: u64,
    /// Message timeout in seconds
    pub message_timeout_secs: u64,
    /// Enable NAT traversal
    pub enable_nat_traversal: bool,
    /// Enable relay
    pub enable_relay: bool,
    /// Enable discovery
    pub enable_discovery: bool,
    /// Discovery interval in seconds
    pub discovery_interval_secs: u64,
    /// Enable DHT
    pub enable_dht: bool,
    /// Enable metrics
    pub enable_metrics: bool,
    /// Bandwidth limits in bytes per second
    pub bandwidth_limit_bps: Option<u64>,
}

/// Storage configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageConfig {
    /// Storage backend
    pub backend: StorageBackend,
    /// Database path
    pub database_path: PathBuf,
    /// Maximum database size in MB
    pub max_database_size_mb: usize,
    /// Cache size in MB
    pub cache_size_mb: usize,
    /// Write buffer size in MB
    pub write_buffer_size_mb: usize,
    /// Enable compression
    pub enable_compression: bool,
    /// Enable encryption
    pub enable_encryption: bool,
    /// Encryption key (if enabled)
    pub encryption_key: Option<String>,
    /// Backup enabled
    pub backup_enabled: bool,
    /// Backup interval in hours
    pub backup_interval_hours: u64,
    /// Backup retention in days
    pub backup_retention_days: u64,
    /// Enable WAL
    pub enable_wal: bool,
    /// WAL sync mode
    pub wal_sync_mode: WalSyncMode,
}

/// Logging configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoggingConfig {
    /// Log level
    pub level: String,
    /// Log format
    pub format: LogFormat,
    /// Log file path
    pub log_file: Option<PathBuf>,
    /// Maximum log file size in MB
    pub max_log_size_mb: usize,
    /// Maximum log files to keep
    pub max_log_files: usize,
    /// Enable console logging
    pub enable_console: bool,
    /// Enable file logging
    pub enable_file: bool,
    /// Enable JSON logging
    pub enable_json: bool,
    /// Enable colored logging
    pub enable_colors: bool,
    /// Log filters
    pub filters: Vec<String>,
}

/// Metrics configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricsConfig {
    /// Enable metrics collection
    pub enabled: bool,
    /// Metrics port
    pub port: u16,
    /// Metrics host
    pub host: String,
    /// Metrics path
    pub path: String,
    /// Enable prometheus exporter
    pub enable_prometheus: bool,
    /// Enable internal metrics
    pub enable_internal: bool,
    /// Metrics collection interval in seconds
    pub collection_interval_secs: u64,
    /// Metrics retention in hours
    pub retention_hours: u64,
    /// Enable detailed metrics
    pub enable_detailed: bool,
    /// Enable histogram metrics
    pub enable_histograms: bool,
}

/// Consensus algorithm types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConsensusAlgorithm {
    /// Proof of Stake
    ProofOfStake,
    /// Delegated Proof of Stake
    DelegatedProofOfStake,
    /// Practical Byzantine Fault Tolerance
    PBFT,
    /// Tendermint consensus
    Tendermint,
    /// Proof of Activity
    ProofOfActivity,
    /// Hybrid consensus
    Hybrid,
}

/// Cryptographic algorithm types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CryptoAlgorithm {
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

/// Signature algorithm types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SignatureAlgorithm {
    /// CRYSTALS-Dilithium
    Dilithium,
    /// SPHINCS+
    SphincsPlus,
    /// Falcon
    Falcon,
    /// Ed25519 (for compatibility)
    Ed25519,
}

/// Hash algorithm types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum HashAlgorithm {
    /// BLAKE3
    Blake3,
    /// SHA3-256
    Sha3_256,
    /// SHA3-512
    Sha3_512,
    /// Keccak-256
    Keccak256,
}

/// Key derivation function types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum KeyDerivationFunction {
    /// HKDF with SHA-256
    HkdfSha256,
    /// PBKDF2 with SHA-256
    Pbkdf2Sha256,
    /// Scrypt
    Scrypt,
    /// Argon2
    Argon2,
}

/// Storage backend types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StorageBackend {
    /// RocksDB
    RocksDB,
    /// LevelDB
    LevelDB,
    /// SQLite
    SQLite,
    /// In-memory
    InMemory,
}

/// Write-ahead log sync modes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WalSyncMode {
    /// No sync
    Off,
    /// Sync on flush
    Normal,
    /// Full sync
    Full,
}

/// Log format types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LogFormat {
    /// Plain text format
    Plain,
    /// JSON format
    Json,
    /// Compact format
    Compact,
}

impl Default for CoreConfig {
    fn default() -> Self {
        Self {
            dag: DAGConfig::default(),
            consensus: ConsensusConfig::default(),
            crypto: CryptoConfig::default(),
            network: NetworkConfig::default(),
            storage: StorageConfig::default(),
            logging: LoggingConfig::default(),
            metrics: MetricsConfig::default(),
        }
    }
}

impl Default for DAGConfig {
    fn default() -> Self {
        Self {
            max_transactions_per_block: 1000,
            max_parents: 8,
            block_time_target_ms: 1000,
            max_dag_depth: 1000000,
            transaction_pool_size: 10000,
            bundle_size: 100,
            max_bundle_size: 500,
            enable_prioritization: true,
            enable_parallel_execution: true,
            cache_size: 10000,
            pruning_enabled: true,
            pruning_interval: 1000,
            max_orphan_blocks: 100,
        }
    }
}

impl Default for ConsensusConfig {
    fn default() -> Self {
        Self {
            algorithm: ConsensusAlgorithm::PBFT,
            num_validators: 21,
            min_validators: 7,
            proposal_timeout_ms: 5000,
            voting_timeout_ms: 10000,
            view_change_timeout_ms: 30000,
            min_stake: 1000000000000000000000u128, // 1000 tokens
            max_stake: 100000000000000000000000u128, // 100000 tokens
            block_reward: 1000000000000000000u128, // 1 token
            slashing_penalty: 0.1, // 10%
            enable_view_changes: true,
            enable_finality: true,
            finality_threshold: 0.67, // 2/3
            bft_threshold: 0.67, // 2/3
        }
    }
}

impl Default for CryptoConfig {
    fn default() -> Self {
        Self {
            algorithm: CryptoAlgorithm::Hybrid,
            key_size_bits: 256,
            signature_algorithm: SignatureAlgorithm::Dilithium,
            hash_algorithm: HashAlgorithm::Blake3,
            enable_quantum_signatures: true,
            key_derivation_function: KeyDerivationFunction::HkdfSha256,
            enable_key_rotation: true,
            key_rotation_interval_secs: 86400, // 24 hours
        }
    }
}

impl Default for NetworkConfig {
    fn default() -> Self {
        Self {
            listen_addresses: vec!["/ip4/0.0.0.0/tcp/30333".to_string()],
            bootstrap_nodes: Vec::new(),
            max_peers: 50,
            min_peers: 5,
            connection_timeout_secs: 30,
            handshake_timeout_secs: 10,
            message_timeout_secs: 30,
            enable_nat_traversal: true,
            enable_relay: true,
            enable_discovery: true,
            discovery_interval_secs: 60,
            enable_dht: true,
            enable_metrics: true,
            bandwidth_limit_bps: Some(1024 * 1024), // 1 MB/s
        }
    }
}

impl Default for StorageConfig {
    fn default() -> Self {
        Self {
            backend: StorageBackend::RocksDB,
            database_path: PathBuf::from("./data"),
            max_database_size_mb: 1024, // 1 GB
            cache_size_mb: 128,
            write_buffer_size_mb: 64,
            enable_compression: true,
            enable_encryption: false,
            encryption_key: None,
            backup_enabled: true,
            backup_interval_hours: 24,
            backup_retention_days: 30,
            enable_wal: true,
            wal_sync_mode: WalSyncMode::Normal,
        }
    }
}

impl Default for LoggingConfig {
    fn default() -> Self {
        Self {
            level: "info".to_string(),
            format: LogFormat::Json,
            log_file: Some(PathBuf::from("./logs/kaldrix.log")),
            max_log_size_mb: 100,
            max_log_files: 10,
            enable_console: true,
            enable_file: true,
            enable_json: true,
            enable_colors: true,
            filters: Vec::new(),
        }
    }
}

impl Default for MetricsConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            port: 9090,
            host: "0.0.0.0".to_string(),
            path: "/metrics".to_string(),
            enable_prometheus: true,
            enable_internal: true,
            collection_interval_secs: 10,
            retention_hours: 24,
            enable_detailed: true,
            enable_histograms: true,
        }
    }
}