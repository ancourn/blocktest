//! Core types for the KALDRIX blockchain

use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use chrono::{DateTime, Utc};
use uuid::Uuid;

/// Unique identifier for a node in the network
pub type NodeId = String;

/// Hash of a block (32 bytes)
pub type BlockHash = [u8; 32];

/// Hash of a transaction (32 bytes)
pub type TransactionId = [u8; 32];

/// Public key for quantum-resistant cryptography
pub type PublicKey = [u8; 32];

/// Private key for quantum-resistant cryptography
pub type PrivateKey = [u8; 64];

/// Signature using quantum-resistant cryptography
pub type Signature = Vec<u8>;

/// Amount in the smallest unit (atto-KALD)
pub type Amount = u128;

/// Gas price in wei
pub type GasPrice = u64;

/// Gas limit for transactions
pub type GasLimit = u64;

/// Nonce for transactions
pub type Nonce = u64;

/// Block height in the chain
pub type BlockHeight = u64;

/// Timestamp in milliseconds since Unix epoch
pub type Timestamp = u64;

/// Node identifier for DAG nodes
pub type NodeId = String;

/// Hash of a node (32 bytes)
pub type Hash = [u8; 32];

/// Signature using quantum-resistant cryptography
pub type Signature = Vec<u8>;

/// Public key for quantum-resistant cryptography
pub type PublicKey = [u8; 32];

/// Private key for quantum-resistant cryptography
pub type PrivateKey = [u8; 64];

/// Simplified transaction for DAG nodes
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SimpleTransaction {
    /// Sender address
    pub from: String,
    /// Receiver address
    pub to: String,
    /// Transfer amount
    pub amount: u64,
    /// Transaction nonce
    pub nonce: u64,
    /// Transaction timestamp
    pub timestamp: u64,
}

impl SimpleTransaction {
    /// Create a new simple transaction
    pub fn new(from: String, to: String, amount: u64, nonce: u64) -> Self {
        Self {
            from,
            to,
            amount,
            nonce,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
        }
    }
    
    /// Validate transaction structure
    pub fn validate(&self) -> bool {
        !self.from.is_empty() && 
        !self.to.is_empty() && 
        self.amount > 0 && 
        self.timestamp > 0
    }
    
    /// Convert to JSON string for signing
    pub fn to_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string(self)
    }
    
    /// Create from JSON string
    pub fn from_json(json: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(json)
    }
}

impl Default for SimpleTransaction {
    fn default() -> Self {
        Self {
            from: String::new(),
            to: String::new(),
            amount: 0,
            nonce: 0,
            timestamp: 0,
        }
    }
}

/// A transaction in the KALDRIX blockchain
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Transaction {
    /// Unique transaction identifier
    pub id: TransactionId,
    /// Sender's public key
    pub sender: PublicKey,
    /// Receiver's public key
    pub receiver: PublicKey,
    /// Amount to transfer
    pub amount: Amount,
    /// Gas price offered
    pub gas_price: GasPrice,
    /// Maximum gas limit
    pub gas_limit: GasLimit,
    /// Nonce to prevent replay attacks
    pub nonce: Nonce,
    /// Transaction data (for smart contracts)
    pub data: Vec<u8>,
    /// Transaction signature
    pub signature: Signature,
    /// Transaction timestamp
    pub timestamp: Timestamp,
    /// Transaction priority (1-10, higher = more important)
    pub priority: u8,
    /// Quantum-resistant signature (optional for enhanced security)
    pub quantum_signature: Option<Signature>,
}

impl Transaction {
    /// Calculate transaction hash
    pub fn hash(&self) -> BlockHash {
        use blake3::Hash;
        let mut hasher = Hash::new();
        hasher.update(&self.sender);
        hasher.update(&self.receiver);
        hasher.update(&self.amount.to_le_bytes());
        hasher.update(&self.gas_price.to_le_bytes());
        hasher.update(&self.gas_limit.to_le_bytes());
        hasher.update(&self.nonce.to_le_bytes());
        hasher.update(&self.data);
        hasher.update(&self.timestamp.to_le_bytes());
        hasher.update(&[self.priority]);
        
        if let Some(ref qs) = self.quantum_signature {
            hasher.update(qs);
        }
        
        hasher.finalize().into()
    }
    
    /// Calculate transaction fee
    pub fn fee(&self) -> Amount {
        (self.gas_price as Amount) * (self.gas_limit as Amount)
    }
    
    /// Validate transaction structure
    pub fn validate(&self) -> bool {
        // Basic validation
        if self.amount == 0 {
            return false;
        }
        
        if self.gas_price == 0 {
            return false;
        }
        
        if self.gas_limit == 0 {
            return false;
        }
        
        if self.priority == 0 || self.priority > 10 {
            return false;
        }
        
        // Validate signature length (Dilithium signature is 2424 bytes)
        if self.signature.len() != 2424 {
            return false;
        }
        
        true
    }
}

/// A block (DAG node) in the KALDRIX blockchain
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    /// Unique block identifier
    pub id: BlockHash,
    /// Block height
    pub height: BlockHeight,
    /// Parent blocks (DAG structure - can have multiple parents)
    pub parents: Vec<BlockHash>,
    /// DAG parent IDs for tip convergence validation
    pub dag_parent_ids: Vec<BlockHash>,
    /// Transactions included in this block
    pub transactions: Vec<Transaction>,
    /// Block creator (validator)
    pub creator: PublicKey,
    /// Block timestamp
    pub timestamp: Timestamp,
    /// Block signature
    pub signature: Signature,
    /// Block version
    pub version: u32,
    /// Merkle root of transactions
    pub merkle_root: BlockHash,
    /// State root hash
    pub state_root: BlockHash,
    /// Additional metadata
    pub metadata: HashMap<String, String>,
}

impl Block {
    /// Calculate block hash
    pub fn hash(&self) -> BlockHash {
        use blake3::Hash;
        let mut hasher = Hash::new();
        hasher.update(&self.height.to_le_bytes());
        
        for parent in &self.parents {
            hasher.update(parent);
        }
        
        for dag_parent in &self.dag_parent_ids {
            hasher.update(dag_parent);
        }
        
        hasher.update(&self.creator);
        hasher.update(&self.timestamp.to_le_bytes());
        hasher.update(&self.version.to_le_bytes());
        hasher.update(&self.merkle_root);
        hasher.update(&self.state_root);
        
        hasher.finalize().into()
    }
    
    /// Calculate merkle root of transactions
    pub fn calculate_merkle_root(&self) -> BlockHash {
        if self.transactions.is_empty() {
            return [0u8; 32];
        }
        
        let mut hashes: Vec<BlockHash> = self.transactions
            .iter()
            .map(|tx| tx.hash())
            .collect();
        
        while hashes.len() > 1 {
            let mut new_hashes = Vec::new();
            
            for i in (0..hashes.len()).step_by(2) {
                let left = hashes[i];
                let right = hashes.get(i + 1).unwrap_or(&left);
                
                let mut hasher = blake3::Hash::new();
                hasher.update(&left);
                hasher.update(right);
                new_hashes.push(hasher.finalize().into());
            }
            
            hashes = new_hashes;
        }
        
        hashes[0]
    }
    
    /// Validate block structure
    pub fn validate(&self) -> bool {
        // Basic validation
        if self.parents.is_empty() {
            return false;
        }
        
        if self.transactions.is_empty() {
            return false;
        }
        
        // Validate merkle root
        if self.calculate_merkle_root() != self.merkle_root {
            return false;
        }
        
        // Validate signature length
        if self.signature.len() != 2424 {
            return false;
        }
        
        true
    }
}

/// Network peer information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeerInfo {
    /// Peer ID
    pub id: NodeId,
    /// Multiaddresses for the peer
    pub addresses: Vec<String>,
    /// Public key
    pub public_key: PublicKey,
    /// Peer capabilities
    pub capabilities: Vec<String>,
    /// Last seen timestamp
    pub last_seen: DateTime<Utc>,
    /// Reputation score
    pub reputation: f64,
    /// Connection status
    pub is_connected: bool,
}

/// Validator information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Validator {
    /// Validator ID
    pub id: NodeId,
    /// Public key
    pub public_key: PublicKey,
    /// Stake amount
    pub stake: Amount,
    /// Validator status
    pub status: ValidatorStatus,
    /// Join timestamp
    pub joined_at: DateTime<Utc>,
    /// Last active timestamp
    pub last_active: DateTime<Utc>,
    /// Validator performance metrics
    pub performance: ValidatorPerformance,
    /// Geographic region
    pub region: String,
}

/// Validator status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ValidatorStatus {
    /// Active validator
    Active,
    /// Inactive validator
    Inactive,
    /// Slashed validator (punished for misbehavior)
    Slashed,
    /// Exiting validator
    Exiting,
}

/// Validator performance metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidatorPerformance {
    /// Number of blocks proposed
    pub blocks_proposed: u64,
    /// Number of blocks validated
    pub blocks_validated: u64,
    /// Uptime percentage
    pub uptime: f64,
    /// Average response time in milliseconds
    pub avg_response_time: u64,
    /// Success rate of validations
    pub success_rate: f64,
    /// Last performance update
    pub last_updated: DateTime<Utc>,
}

/// Network message types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NetworkMessage {
    /// Transaction broadcast
    Transaction(Transaction),
    /// Block broadcast
    Block(Block),
    /// Consensus message
    Consensus(ConsensusMessage),
    /// Peer discovery request
    PeerDiscovery,
    /// Peer discovery response
    PeerDiscoveryResponse(Vec<PeerInfo>),
    /// Heartbeat/Ping
    Ping,
    /// Heartbeat/Pong
    Pong,
    /// Status request
    StatusRequest,
    /// Status response
    StatusResponse(NetworkStatus),
}

/// Consensus message types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConsensusMessage {
    /// Propose new block
    Propose(Block),
    /// Vote for block
    Vote {
        block_hash: BlockHash,
        validator_id: NodeId,
        signature: Signature,
    },
    /// Commit block
    Commit {
        block_hash: BlockHash,
        validator_id: NodeId,
        signature: Signature,
    },
    /// View change (for PBFT)
    ViewChange {
        new_view: u64,
        validator_id: NodeId,
        signature: Signature,
    },
}

/// Network status information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkStatus {
    /// Current block height
    pub block_height: BlockHeight,
    /// Number of connected peers
    pub connected_peers: usize,
    /// Network health status
    pub health: NetworkHealth,
    /// Current TPS (transactions per second)
    pub tps: f64,
    /// Average block time in milliseconds
    pub avg_block_time: u64,
    /// Number of active validators
    pub active_validators: usize,
    /// Last update timestamp
    pub last_updated: DateTime<Utc>,
}

/// Network health status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum NetworkHealth {
    /// Network is healthy
    Healthy,
    /// Network is degraded but functional
    Degraded,
    /// Network is unhealthy
    Unhealthy,
}

/// Transaction bundle for DAG optimization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionBundle {
    /// Bundle ID
    pub id: String,
    /// Transactions in the bundle
    pub transactions: Vec<Transaction>,
    /// Bundle timestamp
    pub timestamp: Timestamp,
    /// Bundle creator
    pub creator: PublicKey,
    /// Bundle signature
    pub signature: Signature,
    /// Bundle priority
    pub priority: u8,
}

impl TransactionBundle {
    /// Calculate bundle hash
    pub fn hash(&self) -> BlockHash {
        use blake3::Hash;
        let mut hasher = Hash::new();
        
        for tx in &self.transactions {
            hasher.update(&tx.hash());
        }
        
        hasher.update(&self.creator);
        hasher.update(&self.timestamp.to_le_bytes());
        hasher.update(&[self.priority]);
        
        hasher.finalize().into()
    }
    
    /// Calculate total fee for the bundle
    pub fn total_fee(&self) -> Amount {
        self.transactions.iter().map(|tx| tx.fee()).sum()
    }
    
    /// Get total amount in the bundle
    pub fn total_amount(&self) -> Amount {
        self.transactions.iter().map(|tx| tx.amount).sum()
    }
}

impl Default for Transaction {
    fn default() -> Self {
        Self {
            id: [0u8; 32],
            sender: [0u8; 32],
            receiver: [0u8; 32],
            amount: 0,
            gas_price: 0,
            gas_limit: 0,
            nonce: 0,
            data: Vec::new(),
            signature: Vec::new(),
            timestamp: 0,
            priority: 1,
            quantum_signature: None,
        }
    }
}

impl Default for Block {
    fn default() -> Self {
        Self {
            id: [0u8; 32],
            height: 0,
            parents: Vec::new(),
            dag_parent_ids: Vec::new(),
            transactions: Vec::new(),
            creator: [0u8; 32],
            timestamp: 0,
            signature: Vec::new(),
            version: 1,
            merkle_root: [0u8; 32],
            state_root: [0u8; 32],
            metadata: HashMap::new(),
        }
    }
}

impl Default for Validator {
    fn default() -> Self {
        Self {
            id: String::new(),
            public_key: [0u8; 32],
            stake: 0,
            status: ValidatorStatus::Inactive,
            joined_at: Utc::now(),
            last_active: Utc::now(),
            performance: ValidatorPerformance::default(),
            region: String::new(),
        }
    }
}

impl Default for ValidatorPerformance {
    fn default() -> Self {
        Self {
            blocks_proposed: 0,
            blocks_validated: 0,
            uptime: 100.0,
            avg_response_time: 100,
            success_rate: 100.0,
            last_updated: Utc::now(),
        }
    }
}

impl Default for NetworkStatus {
    fn default() -> Self {
        Self {
            block_height: 0,
            connected_peers: 0,
            health: NetworkHealth::Healthy,
            tps: 0.0,
            avg_block_time: 1000,
            active_validators: 0,
            last_updated: Utc::now(),
        }
    }
}

impl Default for TransactionBundle {
    fn default() -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            transactions: Vec::new(),
            timestamp: 0,
            creator: [0u8; 32],
            signature: Vec::new(),
            priority: 1,
        }
    }
}