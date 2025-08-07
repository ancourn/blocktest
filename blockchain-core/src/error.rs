//! Error types for the KALDRIX blockchain core

use thiserror::Error;

/// Core error types for the blockchain
#[derive(Error, Debug)]
pub enum CoreError {
    /// Cryptographic error
    #[error("Cryptographic error: {0}")]
    Crypto(String),
    
    /// DAG structure error
    #[error("DAG error: {0}")]
    Dag(String),
    
    /// Consensus error
    #[error("Consensus error: {0}")]
    Consensus(String),
    
    /// Network error
    #[error("Network error: {0}")]
    Network(String),
    
    /// Serialization error
    #[error("Serialization error: {0}")]
    Serialization(String),
    
    /// Validation error
    #[error("Validation error: {0}")]
    Validation(String),
    
    /// Configuration error
    #[error("Configuration error: {0}")]
    Config(String),
    
    /// Storage error
    #[error("Storage error: {0}")]
    Storage(String),
    
    /// Transaction error
    #[error("Transaction error: {0}")]
    Transaction(String),
    
    /// Block error
    #[error("Block error: {0}")]
    Block(String),
    
    /// Validator error
    #[error("Validator error: {0}")]
    Validator(String),
    
    /// Key management error
    #[error("Key management error: {0}")]
    KeyManagement(String),
    
    /// Insufficient funds
    #[error("Insufficient funds: required {required}, available {available}")]
    InsufficientFunds {
        required: u128,
        available: u128,
    },
    
    /// Invalid signature
    #[error("Invalid signature")]
    InvalidSignature,
    
    /// Invalid hash
    #[error("Invalid hash")]
    InvalidHash,
    
    /// Invalid transaction
    #[error("Invalid transaction: {0}")]
    InvalidTransaction(String),
    
    /// Invalid block
    #[error("Invalid block: {0}")]
    InvalidBlock(String),
    
    /// Invalid proof
    #[error("Invalid proof")]
    InvalidProof,
    
    /// Fork detected
    #[error("Fork detected: {0}")]
    ForkDetected(String),
    
    /// Timeout error
    #[error("Timeout: {0}")]
    Timeout(String),
    
    /// Internal error
    #[error("Internal error: {0}")]
    Internal(String),
    
    /// Not found error
    #[error("Not found: {0}")]
    NotFound(String),
    
    /// Already exists error
    #[error("Already exists: {0}")]
    AlreadyExists(String),
    
    /// Permission denied
    #[error("Permission denied: {0}")]
    PermissionDenied(String),
    
    /// Rate limited
    #[error("Rate limited: {0}")]
    RateLimited(String),
    
    /// Maintenance mode
    #[error("Maintenance mode: {0}")]
    Maintenance(String),
    
    /// Incompatible version
    #[error("Incompatible version: expected {expected}, got {actual}")]
    IncompatibleVersion {
        expected: String,
        actual: String,
    },
}

/// Result type for core operations
pub type CoreResult<T> = Result<T, CoreError>;

impl From<pqcrypto::Error> for CoreError {
    fn from(err: pqcrypto::Error) -> Self {
        CoreError::Crypto(format!("Post-quantum crypto error: {}", err))
    }
}

impl From<serde_json::Error> for CoreError {
    fn from(err: serde_json::Error) -> Self {
        CoreError::Serialization(format!("JSON serialization error: {}", err))
    }
}

impl From<bincode::Error> for CoreError {
    fn from(err: bincode::Error) -> Self {
        CoreError::Serialization(format!("Bincode serialization error: {}", err))
    }
}

impl From<std::io::Error> for CoreError {
    fn from(err: std::io::Error) -> Self {
        CoreError::Storage(format!("IO error: {}", err))
    }
}

impl From<uuid::Error> for CoreError {
    fn from(err: uuid::Error) -> Self {
        CoreError::Internal(format!("UUID error: {}", err))
    }
}

impl From<chrono::ParseError> for CoreError {
    fn from(err: chrono::ParseError) -> Self {
        CoreError::Validation(format!("Timestamp parsing error: {}", err))
    }
}

impl From<anyhow::Error> for CoreError {
    fn from(err: anyhow::Error) -> Self {
        CoreError::Internal(format!("Anyhow error: {}", err))
    }
}