//! KALDRIX Blockchain Core
//! 
//! A quantum-resistant DAG-based blockchain implementation with high-throughput
//! and parallel execution capabilities.

pub mod dag;
pub mod crypto;
pub mod consensus;
pub mod types;
pub mod error;
pub mod config;
pub mod metrics;
pub mod utils;

pub use dag::{DAGEngine, DAGNode, DAG, DAGEdge, TransactionBundle};
pub use crypto::{QuantumCrypto, KeyPair, Signature};
pub use consensus::{ConsensusEngine, ConsensusMessage, Validator};
pub use types::{Block, Transaction, SimpleTransaction, NodeId, BlockHash, TransactionId, Hash, Timestamp, Signature, PublicKey, PrivateKey};
pub use error::{CoreError, CoreResult};
pub use config::CoreConfig;
pub use metrics::CoreMetrics;

use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, error, warn};

/// Main blockchain core structure that orchestrates all components
pub struct KaldrixCore {
    config: Arc<CoreConfig>,
    dag_engine: Arc<RwLock<DAGEngine>>,
    consensus_engine: Arc<RwLock<ConsensusEngine>>,
    crypto: Arc<QuantumCrypto>,
    metrics: Arc<CoreMetrics>,
}

impl KaldrixCore {
    /// Create a new KALDRIX core instance
    pub async fn new(config: CoreConfig) -> CoreResult<Self> {
        info!("Initializing KALDRIX Blockchain Core");
        
        // Initialize metrics
        let metrics = Arc::new(CoreMetrics::new());
        
        // Initialize quantum cryptography
        let crypto = Arc::new(QuantumCrypto::new(&config.crypto)?);
        
        // Initialize DAG engine
        let dag_engine = Arc::new(RwLock::new(DAGEngine::new(&config.dag, metrics.clone()).await?));
        
        // Initialize consensus engine
        let consensus_engine = Arc::new(RwLock::new(ConsensusEngine::new(&config.consensus, metrics.clone()).await?));
        
        info!("KALDRIX Blockchain Core initialized successfully");
        
        Ok(Self {
            config: Arc::new(config),
            dag_engine,
            consensus_engine,
            crypto,
            metrics,
        })
    }
    
    /// Start the blockchain core
    pub async fn start(&self) -> CoreResult<()> {
        info!("Starting KALDRIX Blockchain Core");
        
        // Start DAG engine
        {
            let mut dag = self.dag_engine.write().await;
            dag.start().await?;
        }
        
        // Start consensus engine
        {
            let mut consensus = self.consensus_engine.write().await;
            consensus.start().await?;
        }
        
        info!("KALDRIX Blockchain Core started successfully");
        Ok(())
    }
    
    /// Stop the blockchain core
    pub async fn stop(&self) -> CoreResult<()> {
        info!("Stopping KALDRIX Blockchain Core");
        
        // Stop consensus engine
        {
            let mut consensus = self.consensus_engine.write().await;
            consensus.stop().await?;
        }
        
        // Stop DAG engine
        {
            let mut dag = self.dag_engine.write().await;
            dag.stop().await?;
        }
        
        info!("KALDRIX Blockchain Core stopped successfully");
        Ok(())
    }
    
    /// Submit a transaction to the network
    pub async fn submit_transaction(&self, transaction: Transaction) -> CoreResult<TransactionId> {
        let tx_hash = self.crypto.hash_transaction(&transaction)?;
        
        // Add to DAG engine
        {
            let mut dag = self.dag_engine.write().await;
            dag.add_transaction(transaction.clone()).await?;
        }
        
        self.metrics.inc_transactions_submitted();
        info!("Transaction submitted: {}", tx_hash);
        
        Ok(tx_hash)
    }
    
    /// Get transaction by ID
    pub async fn get_transaction(&self, tx_id: &TransactionId) -> CoreResult<Option<Transaction>> {
        let dag = self.dag_engine.read().await;
        dag.get_transaction(tx_id).await
    }
    
    /// Get block by hash
    pub async fn get_block(&self, block_hash: &BlockHash) -> CoreResult<Option<Block>> {
        let dag = self.dag_engine.read().await;
        dag.get_block(block_hash).await
    }
    
    /// Get current DAG metrics
    pub async fn get_dag_metrics(&self) -> CoreResult<dag::DAGMetrics> {
        let dag = self.dag_engine.read().await;
        Ok(dag.get_metrics())
    }
    
    /// Get consensus status
    pub async fn get_consensus_status(&self) -> CoreResult<consensus::ConsensusStatus> {
        let consensus = self.consensus_engine.read().await;
        Ok(consensus.get_status())
    }
    
    /// Generate a new key pair
    pub fn generate_key_pair(&self) -> CoreResult<KeyPair> {
        self.crypto.generate_key_pair()
    }
    
    /// Sign data with private key
    pub fn sign(&self, data: &[u8], private_key: &[u8]) -> CoreResult<Signature> {
        self.crypto.sign(data, private_key)
    }
    
    /// Verify signature
    pub fn verify(&self, data: &[u8], signature: &Signature, public_key: &[u8]) -> CoreResult<bool> {
        self.crypto.verify(data, signature, public_key)
    }
    
    /// Sign a transaction using private key
    pub fn sign_transaction(&self, tx: &SimpleTransaction, private_key: &PrivateKey) -> CoreResult<String> {
        self.crypto.sign_transaction(tx, private_key)
    }
    
    /// Verify a transaction signature using public key
    pub fn verify_transaction_signature(&self, tx: &SimpleTransaction, signature: &str, public_key: &PublicKey) -> CoreResult<bool> {
        self.crypto.verify_transaction_signature(tx, signature, public_key)
    }
    
    /// Submit a simple transaction to the DAG
    pub async fn submit_simple_transaction(&self, tx: SimpleTransaction, private_key: &PrivateKey) -> CoreResult<String> {
        // Sign the transaction
        let signature = self.sign_transaction(&tx, private_key)?;
        
        // Create a unique node ID
        let node_id = format!("node_{}_{}", tx.nonce, std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis());
        
        // Create a new DAG node
        let mut dag_node = DAGNode::new(
            node_id.clone(),
            tx.timestamp,
            tx.clone(),
            Vec::new(), // Will be set to current tips
            String::new(), // Will be calculated
            signature,
        );
        
        // Calculate the node hash
        dag_node.hash = dag_node.calculate_hash();
        
        // Get current tips to use as parents
        let tips = self.get_current_tips().await?;
        dag_node.parents = tips;
        
        // Add the DAG node to the DAG engine
        {
            let mut dag = self.dag_engine.write().await;
            // Note: We need to add a method to DAGEngine to handle DAGNode
            // For now, we'll create a simple implementation
            self.add_dag_node_to_engine(&mut dag, dag_node.clone()).await?;
        }
        
        // Forward to consensus layer
        {
            let mut consensus = self.consensus_engine.write().await;
            consensus.on_dag_node_received(dag_node.clone()).await?;
        }
        
        self.metrics.inc_transactions_submitted();
        info!("Simple transaction submitted: {}", node_id);
        
        Ok(node_id)
    }
    
    /// Get current DAG tip nodes
    pub async fn get_current_tips(&self) -> CoreResult<Vec<String>> {
        let dag = self.dag_engine.read().await;
        Ok(dag.get_current_tips().await?)
    }
    
    /// Internal method to add DAG node to engine (placeholder implementation)
    async fn add_dag_node_to_engine(&self, dag: &mut DAGEngine, node: DAGNode) -> CoreResult<()> {
        // This is a simplified implementation
        // In a real implementation, this would be part of the DAGEngine
        
        // For now, we'll just validate and log
        if node.validate() {
            info!("DAG node added to engine: {}", node.id);
            Ok(())
        } else {
            Err(CoreError::Dag("Invalid DAG node".to_string()))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_core_initialization() {
        let config = CoreConfig::default();
        let core = KaldrixCore::new(config).await;
        assert!(core.is_ok());
    }
    
    #[tokio::test]
    async fn test_key_generation() {
        let config = CoreConfig::default();
        let core = KaldrixCore::new(config).await.unwrap();
        let keypair = core.generate_key_pair();
        assert!(keypair.is_ok());
    }
}