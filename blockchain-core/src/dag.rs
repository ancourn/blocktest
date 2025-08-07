//! DAG-based blockchain engine for KALDRIX

use std::collections::{HashMap, HashSet, VecDeque};
use std::sync::Arc;
use tokio::sync::RwLock;
use petgraph::graph::{DiGraph, NodeIndex};
use petgraph::visit::{Dfs, Topo};
use tracing::{info, error, warn, debug};
use crate::types::{Block, Transaction, SimpleTransaction, BlockHash, TransactionId, TransactionBundle, NodeId, Timestamp, Hash, Signature};
use crate::error::{CoreError, CoreResult};
use crate::config::DAGConfig;
use crate::metrics::CoreMetrics;
use crate::utils::{hash_data, current_timestamp_ms, calculate_merkle_root};
use serde::{Serialize, Deserialize};
use std::time::Duration;

/// A node in the DAG structure
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DAGNode {
    /// Unique identifier for the node
    pub id: String,
    /// Timestamp when the node was created
    pub timestamp: u64,
    /// Transaction contained in this node
    pub transaction: SimpleTransaction,
    /// Parent node IDs (references to previous nodes)
    pub parents: Vec<String>,
    /// Node hash (cryptographic hash of node content)
    pub hash: String,
    /// Node signature (cryptographic signature by creator)
    pub signature: String,
}

impl DAGNode {
    /// Create a new DAG node
    pub fn new(
        id: String,
        timestamp: u64,
        transaction: SimpleTransaction,
        parents: Vec<String>,
        hash: String,
        signature: String,
    ) -> Self {
        Self {
            id,
            timestamp,
            transaction,
            parents,
            hash,
            signature,
        }
    }
    
    /// Calculate the hash of the node
    pub fn calculate_hash(&self) -> String {
        use blake3::Hash;
        let mut hasher = Hash::new();
        hasher.update(self.id.as_bytes());
        hasher.update(&self.timestamp.to_le_bytes());
        
        // Add transaction data to hash
        if let Ok(tx_json) = self.transaction.to_json() {
            hasher.update(tx_json.as_bytes());
        }
        
        for parent in &self.parents {
            hasher.update(parent.as_bytes());
        }
        
        format!("{:x}", hasher.finalize())
    }
    
    /// Validate the node structure
    pub fn validate(&self) -> bool {
        // Basic validation
        if self.id.is_empty() {
            return false;
        }
        
        if self.timestamp == 0 {
            return false;
        }
        
        // Validate transaction
        if !self.transaction.validate() {
            return false;
        }
        
        // Validate signature (basic check - should be non-empty)
        if self.signature.is_empty() {
            return false;
        }
        
        // Validate hash matches calculated hash
        let calculated_hash = self.calculate_hash();
        if calculated_hash != self.hash {
            return false;
        }
        
        true
    }
}

/// DAG edge representing a relationship between blocks
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DAGEdge {
    /// Source block hash
    pub from: BlockHash,
    /// Target block hash
    pub to: BlockHash,
    /// Edge weight (for prioritization)
    pub weight: f64,
    /// Edge type
    pub edge_type: EdgeType,
}

/// Types of edges in the DAG
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EdgeType {
    /// Parent-child relationship
    Parent,
    /// Reference relationship
    Reference,
    /// Dependency relationship
    Dependency,
    /// Strong reference
    Strong,
    /// Weak reference
    Weak,
}

/// DAG node metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DAGNodeMetrics {
    /// Node depth in the DAG
    pub depth: u64,
    /// Node width (number of children)
    pub width: usize,
    /// Number of transactions
    pub transaction_count: usize,
    /// Confirmation score
    pub confirmation_score: f64,
    /// Creation timestamp
    pub created_at: u64,
    /// Last updated timestamp
    pub updated_at: u64,
}

/// DAG engine metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DAGMetrics {
    /// Total number of nodes
    pub node_count: u64,
    /// Total number of edges
    pub edge_count: u64,
    /// Average depth
    pub avg_depth: f64,
    /// Average width
    pub avg_width: f64,
    /// Maximum depth
    pub max_depth: u64,
    /// Maximum width
    pub max_width: usize,
    /// Number of tip nodes
    pub tips_count: usize,
    /// Transaction pool size
    pub transaction_pool_size: usize,
    /// Average confirmation time
    pub avg_confirmation_time: Duration,
    /// Throughput (transactions per second)
    pub tps: f64,
    /// Confirmation rate
    pub confirmation_rate: f64,
    /// Cache hit rate
    pub cache_hit_rate: f64,
    /// Validation time
    pub validation_time: Duration,
    /// Traversal time
    pub traversal_time: Duration,
    /// Latency
    pub latency: Duration,
}

/// Basic DAG structure for managing nodes and relationships
#[derive(Debug, Clone)]
pub struct DAG {
    /// Collection of all nodes in the DAG
    pub nodes: HashMap<String, DAGNode>,
    /// Set of tip nodes (nodes with no children)
    pub tips: HashSet<String>,
}

impl DAG {
    /// Create a new empty DAG
    pub fn new() -> Self {
        Self {
            nodes: HashMap::new(),
            tips: HashSet::new(),
        }
    }
    
    /// Add a node to the DAG
    pub fn add_node(&mut self, node: DAGNode) -> Result<(), String> {
        // Validate node before adding
        if !node.validate() {
            return Err("Invalid node structure".to_string());
        }
        
        // Check if node already exists
        if self.nodes.contains_key(&node.id) {
            return Err("Node already exists".to_string());
        }
        
        // Check if all parents exist
        for parent_id in &node.parents {
            if !self.nodes.contains_key(parent_id) {
                return Err(format!("Parent node {} does not exist", parent_id));
            }
        }
        
        // Remove parents from tips since they now have a child
        for parent_id in &node.parents {
            self.tips.remove(parent_id);
        }
        
        // Add the new node
        self.nodes.insert(node.id.clone(), node.clone());
        
        // Add new node to tips
        self.tips.insert(node.id.clone());
        
        Ok(())
    }
    
    /// Get the current tip nodes
    pub fn get_tips(&self) -> Vec<String> {
        self.tips.iter().cloned().collect()
    }
    
    /// Validate a node
    pub fn validate_node(&self, node_id: &String) -> Result<bool, String> {
        let node = self.nodes.get(node_id)
            .ok_or("Node not found")?;
        
        Ok(node.validate())
    }
    
    /// Traverse the DAG starting from a specific node
    pub fn traverse_dag(&self, start: &String) -> Result<Vec<String>, String> {
        if !self.nodes.contains_key(start) {
            return Err("Start node not found".to_string());
        }
        
        let mut visited = HashSet::new();
        let mut result = Vec::new();
        let mut stack = vec![start.clone()];
        
        while let Some(current_id) = stack.pop() {
            if visited.contains(&current_id) {
                continue;
            }
            
            visited.insert(current_id.clone());
            result.push(current_id.clone());
            
            // Find all children of this node
            if let Some(current_node) = self.nodes.get(&current_id) {
                for node_id in self.nodes.keys() {
                    if let Some(node) = self.nodes.get(node_id) {
                        if node.parents.contains(&current_id) && !visited.contains(node_id) {
                            stack.push(node_id.clone());
                        }
                    }
                }
            }
        }
        
        Ok(result)
    }
    
    /// Get all nodes in the DAG
    pub fn get_all_nodes(&self) -> Vec<DAGNode> {
        self.nodes.values().cloned().collect()
    }
    
    /// Get a specific node by ID
    pub fn get_node(&self, node_id: &String) -> Option<DAGNode> {
        self.nodes.get(node_id).cloned()
    }
    
    /// Check if a node exists
    pub fn contains_node(&self, node_id: &String) -> bool {
        self.nodes.contains_key(node_id)
    }
    
    /// Get the number of nodes in the DAG
    pub fn len(&self) -> usize {
        self.nodes.len()
    }
    
    /// Check if the DAG is empty
    pub fn is_empty(&self) -> bool {
        self.nodes.is_empty()
    }
    
    /// Clear all nodes from the DAG
    pub fn clear(&mut self) {
        self.nodes.clear();
        self.tips.clear();
    }
}

impl Default for DAG {
    fn default() -> Self {
        Self::new()
    }
}

/// DAG engine for managing the blockchain structure
pub struct DAGEngine {
    /// DAG graph structure
    graph: DiGraph<Block, DAGEdge>,
    /// Hash to node index mapping
    hash_to_index: HashMap<BlockHash, NodeIndex>,
    /// Transaction pool
    transaction_pool: RwLock<VecDeque<Transaction>>,
    /// Node metrics
    node_metrics: HashMap<BlockHash, DAGNodeMetrics>,
    /// Configuration
    config: DAGConfig,
    /// Metrics collector
    metrics: Arc<CoreMetrics>,
    /// Running state
    is_running: bool,
    /// Genesis block hash
    genesis_hash: Option<BlockHash>,
    /// Cache for frequently accessed nodes
    node_cache: HashMap<BlockHash, Block>,
    /// Orphan blocks (blocks without known parents)
    orphan_blocks: HashMap<BlockHash, Block>,
}

impl DAGEngine {
    /// Create a new DAG engine
    pub async fn new(config: &DAGConfig, metrics: Arc<CoreMetrics>) -> CoreResult<Self> {
        info!("Initializing DAG engine");
        
        let engine = Self {
            graph: DiGraph::new(),
            hash_to_index: HashMap::new(),
            transaction_pool: RwLock::new(VecDeque::new()),
            node_metrics: HashMap::new(),
            config: config.clone(),
            metrics,
            is_running: false,
            genesis_hash: None,
            node_cache: HashMap::new(),
            orphan_blocks: HashMap::new(),
        };
        
        info!("DAG engine initialized");
        Ok(engine)
    }
    
    /// Start the DAG engine
    pub async fn start(&mut self) -> CoreResult<()> {
        if self.is_running {
            return Ok(());
        }
        
        info!("Starting DAG engine");
        
        // Create genesis block if not exists
        if self.genesis_hash.is_none() {
            self.create_genesis_block().await?;
        }
        
        self.is_running = true;
        info!("DAG engine started");
        
        Ok(())
    }
    
    /// Stop the DAG engine
    pub async fn stop(&mut self) -> CoreResult<()> {
        if !self.is_running {
            return Ok(());
        }
        
        info!("Stopping DAG engine");
        self.is_running = false;
        info!("DAG engine stopped");
        
        Ok(())
    }
    
    /// Create genesis block
    async fn create_genesis_block(&mut self) -> CoreResult<()> {
        info!("Creating genesis block");
        
        let genesis_block = Block {
            id: [0u8; 32], // Will be calculated
            height: 0,
            parents: Vec::new(), // Genesis has no parents
            transactions: Vec::new(), // No transactions in genesis
            creator: [0u8; 32], // System creator
            timestamp: current_timestamp_ms(),
            signature: Vec::new(),
            version: 1,
            merkle_root: [0u8; 32],
            state_root: [0u8; 32],
            metadata: {
                let mut meta = HashMap::new();
                meta.insert("genesis".to_string(), "true".to_string());
                meta.insert("created_by".to_string(), "kaldrix".to_string());
                meta
            },
        };
        
        let genesis_hash = genesis_block.hash();
        let genesis_block = Block { id: genesis_hash, ..genesis_block };
        
        // Add to graph
        let node_index = self.graph.add_node(genesis_block.clone());
        self.hash_to_index.insert(genesis_hash, node_index);
        self.genesis_hash = Some(genesis_hash);
        
        // Add metrics
        self.node_metrics.insert(genesis_hash, DAGNodeMetrics {
            depth: 0,
            width: 0,
            transaction_count: 0,
            confirmation_score: 1.0,
            created_at: genesis_block.timestamp,
            updated_at: genesis_block.timestamp,
        });
        
        // Update metrics
        self.metrics.inc_dag_nodes();
        self.metrics.set_current_block_height(0);
        
        info!("Genesis block created: {}", bytes_to_hex(&genesis_hash));
        Ok(())
    }
    
    /// Add a transaction to the pool
    pub async fn add_transaction(&mut self, transaction: Transaction) -> CoreResult<()> {
        if !self.is_running {
            return Err(CoreError::Dag("DAG engine is not running".to_string()));
        }
        
        // Validate transaction
        if !transaction.validate() {
            return Err(CoreError::InvalidTransaction("Transaction validation failed".to_string()));
        }
        
        // Check for duplicates
        let tx_hash = transaction.hash();
        if self.transaction_exists(&tx_hash).await? {
            return Err(CoreError::Transaction("Transaction already exists".to_string()));
        }
        
        // Add to pool
        {
            let mut pool = self.transaction_pool.write().await;
            pool.push_back(transaction);
            
            // Limit pool size
            if pool.len() > self.config.transaction_pool_size {
                pool.pop_front();
            }
        }
        
        // Update metrics
        self.metrics.inc_transactions_submitted();
        self.metrics.set_transaction_pool_size(self.transaction_pool.read().await.len());
        self.metrics.update_avg_transaction_fee(transaction.fee() as f64);
        self.metrics.update_avg_transaction_size(std::mem::size_of_val(&transaction) as f64);
        
        debug!("Transaction added to pool: {}", bytes_to_hex(&tx_hash));
        Ok(())
    }
    
    /// Add multiple transactions
    pub async fn add_transactions(&mut self, transactions: Vec<Transaction>) -> CoreResult<usize> {
        let mut added_count = 0;
        
        for transaction in transactions {
            match self.add_transaction(transaction).await {
                Ok(_) => added_count += 1,
                Err(e) => warn!("Failed to add transaction: {}", e),
            }
        }
        
        Ok(added_count)
    }
    
    /// Create a new block (DAG node)
    pub async fn create_block(&mut self, creator: [u8; 32]) -> CoreResult<Block> {
        if !self.is_running {
            return Err(CoreError::Dag("DAG engine is not running".to_string()));
        }
        
        // Select transactions from pool
        let transactions = self.select_transactions().await?;
        
        // Select parent blocks
        let parents = self.select_parents().await?;
        
        // Create block
        let mut block = Block {
            id: [0u8; 32], // Will be calculated
            height: self.calculate_block_height(&parents).await?,
            parents: parents.clone(),
            transactions: transactions.clone(),
            creator,
            timestamp: current_timestamp_ms(),
            signature: Vec::new(),
            version: 1,
            merkle_root: [0u8; 32], // Will be calculated
            state_root: [0u8; 32], // Will be calculated
            metadata: HashMap::new(),
        };
        
        // Calculate merkle root
        block.merkle_root = block.calculate_merkle_root();
        
        // Calculate block hash
        let block_hash = block.hash();
        block.id = block_hash;
        
        debug!("Block created: {}, height: {}, parents: {}", 
               bytes_to_hex(&block_hash), block.height, parents.len());
        
        Ok(block)
    }
    
    /// Add a block to the DAG
    pub async fn add_block(&mut self, mut block: Block) -> CoreResult<()> {
        if !self.is_running {
            return Err(CoreError::Dag("DAG engine is not running".to_string()));
        }
        
        let block_hash = block.id;
        
        // Check if block already exists
        if self.hash_to_index.contains_key(&block_hash) {
            return Err(CoreError::Block("Block already exists".to_string()));
        }
        
        // Validate block
        if !block.validate() {
            return Err(CoreError::InvalidBlock("Block validation failed".to_string()));
        }
        
        // Check if all parents exist
        let mut all_parents_exist = true;
        for parent_hash in &block.parents {
            if !self.hash_to_index.contains_key(parent_hash) {
                all_parents_exist = false;
                break;
            }
        }
        
        if !all_parents_exist {
            // Add to orphan blocks
            self.orphan_blocks.insert(block_hash, block.clone());
            warn!("Block added to orphans: {}", bytes_to_hex(&block_hash));
            return Ok(());
        }
        
        // Add block to graph
        let node_index = self.graph.add_node(block.clone());
        self.hash_to_index.insert(block_hash, node_index);
        
        // Add edges to parents
        for parent_hash in &block.parents {
            if let Some(parent_index) = self.hash_to_index.get(parent_hash) {
                let edge = DAGEdge {
                    from: *parent_hash,
                    to: block_hash,
                    weight: 1.0,
                    edge_type: EdgeType::Parent,
                };
                self.graph.add_edge(*parent_index, node_index, edge);
                self.metrics.inc_dag_edges();
            }
        }
        
        // Calculate node metrics
        let metrics = self.calculate_node_metrics(&block_hash).await?;
        self.node_metrics.insert(block_hash, metrics);
        
        // Update cache
        self.node_cache.insert(block_hash, block.clone());
        
        // Limit cache size
        if self.node_cache.len() > self.config.cache_size {
            if let Some(oldest_key) = self.node_cache.keys().next().cloned() {
                self.node_cache.remove(&oldest_key);
            }
        }
        
        // Remove transactions from pool
        self.remove_transactions_from_pool(&block.transactions).await?;
        
        // Process orphan blocks that might now have parents
        self.process_orphan_blocks().await?;
        
        // Update metrics
        self.metrics.inc_blocks_created();
        self.metrics.inc_dag_nodes();
        self.metrics.set_current_block_height(block.height);
        self.metrics.update_avg_block_size(std::mem::size_of_val(&block) as f64);
        self.metrics.update_avg_transactions_per_block(block.transactions.len() as f64);
        
        // Prune if enabled
        if self.config.pruning_enabled {
            self.prune_dag().await?;
        }
        
        info!("Block added to DAG: {}, height: {}", bytes_to_hex(&block_hash), block.height);
        Ok(())
    }
    
    /// Get a block by hash
    pub async fn get_block(&self, block_hash: &BlockHash) -> CoreResult<Option<Block>> {
        // Check cache first
        if let Some(block) = self.node_cache.get(block_hash) {
            return Ok(Some(block.clone()));
        }
        
        // Check graph
        if let Some(node_index) = self.hash_to_index.get(block_hash) {
            let block = self.graph.node_weight(*node_index)
                .ok_or_else(|| CoreError::Block("Block not found in graph".to_string()))?;
            return Ok(Some(block.clone()));
        }
        
        Ok(None)
    }
    
    /// Get a transaction by ID
    pub async fn get_transaction(&self, tx_id: &TransactionId) -> CoreResult<Option<Transaction>> {
        // Check transaction pool
        {
            let pool = self.transaction_pool.read().await;
            for tx in pool.iter() {
                if &tx.hash() == tx_id {
                    return Ok(Some(tx.clone()));
                }
            }
        }
        
        // Search through all blocks
        for node_index in self.graph.node_indices() {
            if let Some(block) = self.graph.node_weight(node_index) {
                for tx in &block.transactions {
                    if &tx.hash() == tx_id {
                        return Ok(Some(tx.clone()));
                    }
                }
            }
        }
        
        Ok(None)
    }
    
    /// Get transaction pool size
    pub async fn get_mempool_size(&self) -> usize {
        self.transaction_pool.read().await.len()
    }
    
    /// Get current tip nodes
    pub async fn get_tips(&self) -> CoreResult<Vec<BlockHash>> {
        let mut tips = Vec::new();
        
        for node_index in self.graph.node_indices() {
            // Check if node has no children (is a tip)
            let has_children = self.graph.neighbors(node_index).next().is_some();
            
            if !has_children {
                if let Some(block) = self.graph.node_weight(node_index) {
                    tips.push(block.id);
                }
            }
        }
        
        Ok(tips)
    }
    
    /// Get current tips as strings (for compatibility with new DAGNode structure)
    pub async fn get_current_tips(&self) -> CoreResult<Vec<String>> {
        let block_hashes = self.get_tips().await?;
        let tips: Vec<String> = block_hashes.iter()
            .map(|hash| format!("{:x}", hash))
            .collect();
        Ok(tips)
    }
    
    /// Get DAG metrics
    pub fn get_metrics(&self) -> DAGMetrics {
        let node_count = self.graph.node_count();
        let edge_count = self.graph.edge_count();
        
        let depths: Vec<u64> = self.node_metrics.values().map(|m| m.depth).collect();
        let widths: Vec<usize> = self.node_metrics.values().map(|m| m.width).collect();
        
        let avg_depth = if depths.is_empty() {
            0.0
        } else {
            depths.iter().sum::<u64>() as f64 / depths.len() as f64
        };
        
        let avg_width = if widths.is_empty() {
            0.0
        } else {
            widths.iter().sum::<usize>() as f64 / widths.len() as f64
        };
        
        let max_depth = depths.iter().max().copied().unwrap_or(0);
        let max_width = widths.iter().max().copied().unwrap_or(0);
        
        DAGMetrics {
            node_count: node_count as u64,
            edge_count: edge_count as u64,
            avg_depth,
            avg_width,
            max_depth,
            max_width,
            tips_count: 0, // Will be calculated asynchronously
            transaction_pool_size: self.transaction_pool.read().await.len(),
            avg_confirmation_time: Duration::from_millis(1000), // Placeholder
            tps: self.metrics.get_tps(),
            confirmation_rate: 0.95, // Placeholder
            cache_hit_rate: 0.8, // Placeholder
            validation_time: Duration::from_millis(10), // Placeholder
            traversal_time: Duration::from_millis(5), // Placeholder
            latency: Duration::from_millis(1), // Placeholder
        }
    }
    
    /// Get transaction pool size
    pub async fn get_mempool_size(&self) -> usize {
        self.transaction_pool.read().await.len()
    }
    
    /// Get node count
    pub fn get_node_count(&self) -> usize {
        self.graph.node_count()
    }
    
    /// Get transaction count
    pub fn get_transaction_count(&self) -> usize {
        self.graph.node_indices()
            .map(|idx| self.graph.node_weight(idx).unwrap().transactions.len())
            .sum()
    }
    
    /// Get bundle count
    pub fn get_bundle_count(&self) -> usize {
        // Placeholder - bundles are not yet implemented
        0
    }
    
    /// Select transactions from pool for a new block
    async fn select_transactions(&self) -> CoreResult<Vec<Transaction>> {
        let mut pool = self.transaction_pool.write().await;
        let mut selected = Vec::new();
        
        // Sort by priority and fee
        let mut transactions: Vec<_> = pool.iter().cloned().collect();
        transactions.sort_by(|a, b| {
            b.priority.cmp(&a.priority)
                .then(b.fee().cmp(&a.fee()))
        });
        
        // Select transactions up to max limit
        for tx in transactions {
            if selected.len() >= self.config.max_transactions_per_block {
                break;
            }
            selected.push(tx);
        }
        
        // Remove selected from pool
        pool.retain(|tx| !selected.iter().any(|selected_tx| tx.id == selected_tx.id));
        
        Ok(selected)
    }
    
    /// Select parent blocks for a new block
    async fn select_parents(&self) -> CoreResult<Vec<BlockHash>> {
        let mut parents = Vec::new();
        
        // Get tips (blocks with no children)
        let tips = self.get_tips().await?;
        
        // Select parents based on weight and confirmation score
        let mut weighted_tips: Vec<_> = tips.iter().map(|&hash| {
            let weight = self.calculate_block_weight(hash).await.unwrap_or(0.0);
            (hash, weight)
        }).collect();
        
        weighted_tips.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
        
        // Select up to max_parents
        for (tip_hash, _) in weighted_tips.iter().take(self.config.max_parents) {
            parents.push(*tip_hash);
        }
        
        // If no tips found, use genesis
        if parents.is_empty() {
            if let Some(genesis_hash) = self.genesis_hash {
                parents.push(genesis_hash);
            }
        }
        
        Ok(parents)
    }
    
    /// Get tips (blocks with no children)
    async fn get_tips(&self) -> CoreResult<Vec<BlockHash>> {
        let mut tips = Vec::new();
        
        for node_index in self.graph.node_indices() {
            let has_children = self.graph.neighbors(node_index).next().is_some();
            
            if !has_children {
                if let Some(block) = self.graph.node_weight(node_index) {
                    tips.push(block.id);
                }
            }
        }
        
        Ok(tips)
    }
    
    /// Calculate block weight for parent selection
    async fn calculate_block_weight(&self, block_hash: &BlockHash) -> CoreResult<f64> {
        let mut weight = 0.0;
        
        // Base weight from confirmation score
        if let Some(metrics) = self.node_metrics.get(block_hash) {
            weight += metrics.confirmation_score;
        }
        
        // Weight from transaction count
        if let Some(block) = self.get_block(block_hash).await? {
            weight += block.transactions.len() as f64 * 0.1;
        }
        
        // Weight from depth (prefer newer blocks)
        if let Some(metrics) = self.node_metrics.get(block_hash) {
            weight += 1.0 / (metrics.depth as f64 + 1.0);
        }
        
        Ok(weight)
    }
    
    /// Calculate block height based on parents
    async fn calculate_block_height(&self, parents: &[BlockHash]) -> CoreResult<u64> {
        if parents.is_empty() {
            return Ok(0);
        }
        
        let mut max_height = 0;
        
        for parent_hash in parents {
            if let Some(block) = self.get_block(parent_hash).await? {
                max_height = max_height.max(block.height);
            }
        }
        
        Ok(max_height + 1)
    }
    
    /// Calculate node metrics
    async fn calculate_node_metrics(&self, block_hash: &BlockHash) -> CoreResult<DAGNodeMetrics> {
        let node_index = self.hash_to_index.get(block_hash)
            .ok_or_else(|| CoreError::Block("Block not found".to_string()))?;
        
        let block = self.graph.node_weight(*node_index)
            .ok_or_else(|| CoreError::Block("Block not found in graph".to_string()))?;
        
        // Calculate depth (distance from genesis)
        let depth = self.calculate_block_depth(block_hash).await?;
        
        // Calculate width (number of children)
        let width = self.graph.neighbors(*node_index).count();
        
        // Calculate confirmation score
        let confirmation_score = self.calculate_confirmation_score(block_hash).await?;
        
        Ok(DAGNodeMetrics {
            depth,
            width,
            transaction_count: block.transactions.len(),
            confirmation_score,
            created_at: block.timestamp,
            updated_at: current_timestamp_ms(),
        })
    }
    
    /// Calculate block depth (distance from genesis)
    async fn calculate_block_depth(&self, block_hash: &BlockHash) -> CoreResult<u64> {
        let node_index = self.hash_to_index.get(block_hash)
            .ok_or_else(|| CoreError::Block("Block not found".to_string()))?;
        
        let mut depth = 0;
        let mut visited = HashSet::new();
        let mut queue = VecDeque::new();
        queue.push_back(*node_index);
        visited.insert(*node_index);
        
        while !queue.is_empty() {
            let level_size = queue.len();
            
            for _ in 0..level_size {
                let current = queue.pop_front().unwrap();
                
                // Check if this is genesis
                if let Some(genesis_hash) = self.genesis_hash {
                    if let Some(block) = self.graph.node_weight(current) {
                        if block.id == genesis_hash {
                            return Ok(depth);
                        }
                    }
                }
                
                // Add parents to queue
                for parent in self.graph.neighbors_directed(current, petgraph::Direction::Incoming) {
                    if !visited.contains(&parent) {
                        visited.insert(parent);
                        queue.push_back(parent);
                    }
                }
            }
            
            depth += 1;
        }
        
        Ok(depth)
    }
    
    /// Calculate confirmation score for a block
    async fn calculate_confirmation_score(&self, block_hash: &BlockHash) -> CoreResult<f64> {
        let node_index = self.hash_to_index.get(block_hash)
            .ok_or_else(|| CoreError::Block("Block not found".to_string()))?;
        
        let mut descendants = 0;
        let mut visited = HashSet::new();
        let mut queue = VecDeque::new();
        queue.push_back(*node_index);
        visited.insert(*node_index);
        
        while !queue.is_empty() {
            let current = queue.pop_front().unwrap();
            descendants += 1;
            
            // Add children to queue
            for child in self.graph.neighbors_directed(current, petgraph::Direction::Outgoing) {
                if !visited.contains(&child) {
                    visited.insert(child);
                    queue.push_back(child);
                }
            }
        }
        
        // Confirmation score based on number of descendants
        let max_possible_descendants = self.graph.node_count();
        if max_possible_descendants == 0 {
            return Ok(0.0);
        }
        
        Ok(descendants as f64 / max_possible_descendants as f64)
    }
    
    /// Check if transaction exists
    async fn transaction_exists(&self, tx_hash: &TransactionId) -> CoreResult<bool> {
        // Check pool
        {
            let pool = self.transaction_pool.read().await;
            for tx in pool.iter() {
                if &tx.hash() == tx_hash {
                    return Ok(true);
                }
            }
        }
        
        // Check blocks
        for node_index in self.graph.node_indices() {
            if let Some(block) = self.graph.node_weight(node_index) {
                for tx in &block.transactions {
                    if &tx.hash() == tx_hash {
                        return Ok(true);
                    }
                }
            }
        }
        
        Ok(false)
    }
    
    /// Remove transactions from pool
    async fn remove_transactions_from_pool(&self, transactions: &[Transaction]) -> CoreResult<()> {
        let mut pool = self.transaction_pool.write().await;
        pool.retain(|pool_tx| !transactions.iter().any(|tx| tx.id == pool_tx.id));
        Ok(())
    }
    
    /// Process orphan blocks
    async fn process_orphan_blocks(&mut self) -> CoreResult<()> {
        let mut processed = Vec::new();
        
        for (orphan_hash, orphan_block) in self.orphan_blocks.iter() {
            // Check if all parents now exist
            let mut all_parents_exist = true;
            for parent_hash in &orphan_block.parents {
                if !self.hash_to_index.contains_key(parent_hash) {
                    all_parents_exist = false;
                    break;
                }
            }
            
            if all_parents_exist {
                // Add the orphan block
                if let Ok(_) = self.add_block(orphan_block.clone()).await {
                    processed.push(*orphan_hash);
                }
            }
        }
        
        // Remove processed orphans
        for hash in processed {
            self.orphan_blocks.remove(&hash);
            info!("Orphan block processed: {}", bytes_to_hex(&hash));
        }
        
        Ok(())
    }
    
    /// Prune old DAG nodes
    async fn prune_dag(&mut self) -> CoreResult<()> {
        // Placeholder implementation
        // In a real implementation, this would remove old nodes while preserving DAG integrity
        debug!("DAG pruning not yet implemented");
        Ok(())
    }
    
    /// Validate DAG structure
    pub async fn validate_dag(&self) -> CoreResult<bool> {
        // Check for cycles
        if self.has_cycles().await? {
            return Ok(false);
        }
        
        // Check connectivity
        if !self.is_connected().await? {
            return Ok(false);
        }
        
        // Check all blocks are valid
        for node_index in self.graph.node_indices() {
            if let Some(block) = self.graph.node_weight(node_index) {
                if !block.validate() {
                    return Ok(false);
                }
            }
        }
        
        Ok(true)
    }
    
    /// Check if DAG has cycles
    async fn has_cycles(&self) -> CoreResult<bool> {
        // Use DFS to detect cycles
        let start_index = self.graph.node_indices().next();
        if start_index.is_none() {
            return Ok(false);
        }
        
        let mut dfs = Dfs::new(&self.graph, start_index.unwrap());
        let mut visited = HashSet::new();
        
        while let Some(node) = dfs.next(&self.graph) {
            if visited.contains(&node) {
                return Ok(true);
            }
            visited.insert(node);
        }
        
        Ok(false)
    }
    
    /// Check if DAG is connected
    async fn is_connected(&self) -> CoreResult<bool> {
        // Check if all nodes are reachable from genesis
        if let Some(genesis_hash) = self.genesis_hash {
            if let Some(genesis_index) = self.hash_to_index.get(&genesis_hash) {
                let mut visited = HashSet::new();
                let mut queue = VecDeque::new();
                queue.push_back(*genesis_index);
                visited.insert(*genesis_index);
                
                while let Some(current) = queue.pop_front() {
                    for neighbor in self.graph.neighbors(current) {
                        if !visited.contains(&neighbor) {
                            visited.insert(neighbor);
                            queue.push_back(neighbor);
                        }
                    }
                }
                
                return Ok(visited.len() == self.graph.node_count());
            }
        }
        
        Ok(false)
    }
    
    /// Get DAG topology information
    pub async fn get_topology(&self) -> CoreResult<DAGTopology> {
        let metrics = self.get_metrics();
        
        Ok(DAGTopology {
            node_count: metrics.node_count,
            edge_count: metrics.edge_count,
            avg_depth: metrics.avg_depth,
            avg_width: metrics.avg_width,
            max_depth: metrics.max_depth,
            max_width: metrics.max_width,
            tips_count: self.get_tips().await?.len(),
            genesis_hash: self.genesis_hash,
            is_acyclic: !self.has_cycles().await?,
            is_connected: self.is_connected().await?,
        })
    }
    
    /// Get ancestry of a node (all ancestors in the DAG)
    pub async fn get_ancestry(&self, node_id: &BlockHash) -> CoreResult<Vec<BlockHash>> {
        let mut ancestry = Vec::new();
        let mut stack = vec![node_id.clone()];
        let mut visited = HashSet::new();
        
        while let Some(current) = stack.pop() {
            if visited.contains(&current) {
                continue;
            }
            
            visited.insert(current.clone());
            
            // Get the node and its parents
            if let Some(node_index) = self.hash_to_index.get(&current) {
                let node = self.graph.node_weight(*node_index)
                    .ok_or_else(|| CoreError::Dag("Node not found in graph".to_string()))?;
                
                // Add parents to stack for further traversal
                for parent_hash in &node.parents {
                    if !visited.contains(parent_hash) {
                        stack.push(parent_hash.clone());
                        ancestry.push(parent_hash.clone());
                    }
                }
                
                // Also check DAG parent IDs
                for dag_parent in &node.dag_parent_ids {
                    if !visited.contains(dag_parent) {
                        stack.push(dag_parent.clone());
                        ancestry.push(dag_parent.clone());
                    }
                }
            }
        }
        
        Ok(ancestry)
    }
    
    /// Validate tip convergence between two tips
    pub async fn validate_tip_convergence(&self, tip1: &BlockHash, tip2: &BlockHash) -> CoreResult<bool> {
        // Get ancestry for both tips
        let ancestry1 = self.get_ancestry(tip1).await?;
        let ancestry2 = self.get_ancestry(tip2).await?;
        
        // Check if there's any common ancestor (convergence point)
        let set1: HashSet<_> = ancestry1.into_iter().collect();
        let set2: HashSet<_> = ancestry2.into_iter().collect();
        
        // If there's any intersection, the tips converge
        Ok(!set1.is_disjoint(&set2))
    }
    
    /// Mark a checkpoint in the DAG for finality
    pub async fn mark_checkpoint(&mut self, node_id: &BlockHash) -> CoreResult<()> {
        info!("Marking checkpoint at node: {}", bytes_to_hex(node_id));
        
        // Validate the node exists
        if !self.hash_to_index.contains_key(node_id) {
            return Err(CoreError::Dag("Node not found for checkpoint".to_string()));
        }
        
        // Add checkpoint metadata to the node
        if let Some(node_index) = self.hash_to_index.get(node_id) {
            let node = self.graph.node_weight_mut(*node_index)
                .ok_or_else(|| CoreError::Dag("Node not found in graph".to_string()))?;
            
            // Add checkpoint metadata
            node.metadata.insert("checkpoint".to_string(), "true".to_string());
            node.metadata.insert("checkpoint_timestamp".to_string(), current_timestamp_ms().to_string());
            
            // Update metrics
            self.metrics.inc_dag_checkpoints();
            
            info!("Checkpoint marked successfully at node: {}", bytes_to_hex(node_id));
        }
        
        Ok(())
    }
    
    /// Get current tips for consensus proposal
    pub async fn get_current_tips(&self) -> CoreResult<Vec<BlockHash>> {
        let mut tips = Vec::new();
        
        // Find all nodes with no children (tips)
        for node_index in self.graph.node_indices() {
            let has_children = self.graph.neighbors(node_index).next().is_some();
            
            if !has_children {
                if let Some(node) = self.graph.node_weight(node_index) {
                    tips.push(node.id);
                }
            }
        }
        
        // Sort tips by timestamp (newest first)
        tips.sort_by(|a, b| {
            let time_a = self.get_node_timestamp(a).unwrap_or(0);
            let time_b = self.get_node_timestamp(b).unwrap_or(0);
            time_b.cmp(&time_a)
        });
        
        // Return top N tips (configurable)
        let max_tips = self.config.max_parents;
        Ok(tips.into_iter().take(max_tips).collect())
    }
    
    /// Get node timestamp helper
    fn get_node_timestamp(&self, node_id: &BlockHash) -> Option<u64> {
        self.hash_to_index.get(node_id)
            .and_then(|index| self.graph.node_weight(*index))
            .map(|node| node.timestamp)
    }
    
    /// Convert DAG node to block format for consensus
    pub async fn convert_dag_node_to_block(&self, node_id: &BlockHash) -> CoreResult<Block> {
        let node_index = self.hash_to_index.get(node_id)
            .ok_or_else(|| CoreError::Dag("Node not found".to_string()))?;
        
        let node = self.graph.node_weight(*node_index)
            .ok_or_else(|| CoreError::Dag("Node not found in graph".to_string()))?;
        
        // Create a block from the DAG node
        let mut block = node.clone();
        
        // Ensure DAG parent IDs are properly set
        if block.dag_parent_ids.is_empty() {
            block.dag_parent_ids = block.parents.clone();
        }
        
        Ok(block)
    }
}

/// DAG topology information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DAGTopology {
    pub node_count: u64,
    pub edge_count: u64,
    pub avg_depth: f64,
    pub avg_width: f64,
    pub max_depth: u64,
    pub max_width: usize,
    pub tips_count: usize,
    pub genesis_hash: Option<BlockHash>,
    pub is_acyclic: bool,
    pub is_connected: bool,
}

/// Helper function to convert bytes to hex string
fn bytes_to_hex(bytes: &[u8]) -> String {
    hex::encode(bytes)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::CoreConfig;
    
    #[tokio::test]
    async fn test_dag_engine_creation() {
        let config = CoreConfig::default();
        let metrics = Arc::new(CoreMetrics::new());
        let mut engine = DAGEngine::new(&config.dag, metrics).await;
        assert!(engine.is_ok());
    }
    
    #[tokio::test]
    async fn test_genesis_creation() {
        let config = CoreConfig::default();
        let metrics = Arc::new(CoreMetrics::new());
        let mut engine = DAGEngine::new(&config.dag, metrics).await.unwrap();
        
        engine.start().await.unwrap();
        assert!(engine.genesis_hash.is_some());
    }
    
    #[tokio::test]
    async fn test_transaction_addition() {
        let config = CoreConfig::default();
        let metrics = Arc::new(CoreMetrics::new());
        let mut engine = DAGEngine::new(&config.dag, metrics).await.unwrap();
        
        engine.start().await.unwrap();
        
        let transaction = Transaction::default();
        let result = engine.add_transaction(transaction).await;
        assert!(result.is_ok());
    }
    
    #[tokio::test]
    async fn test_block_creation() {
        let config = CoreConfig::default();
        let metrics = Arc::new(CoreMetrics::new());
        let mut engine = DAGEngine::new(&config.dag, metrics).await.unwrap();
        
        engine.start().await.unwrap();
        
        let creator = [0u8; 32];
        let block = engine.create_block(creator).await;
        assert!(block.is_ok());
    }
}