//! Unit tests for DAG engine

use super::*;
use crate::config::CoreConfig;

#[tokio::test]
async fn test_dag_engine_creation() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let engine = DAGEngine::new(&config.dag, metrics).await;
    assert!(engine.is_ok());
}

#[tokio::test]
async fn test_genesis_block_creation() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut engine = DAGEngine::new(&config.dag, metrics).await.unwrap();
    
    engine.start().await.unwrap();
    
    assert!(engine.genesis_hash.is_some());
    
    let genesis_hash = engine.genesis_hash.unwrap();
    let genesis_block = engine.get_block(&genesis_hash).await.unwrap();
    assert!(genesis_block.is_some());
    
    let genesis_block = genesis_block.unwrap();
    assert_eq!(genesis_block.height, 0);
    assert!(genesis_block.parents.is_empty());
    assert!(genesis_block.metadata.contains_key("genesis"));
}

#[tokio::test]
async fn test_transaction_pool_management() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut engine = DAGEngine::new(&config.dag, metrics).await.unwrap();
    
    engine.start().await.unwrap();
    
    // Add transaction
    let transaction = Transaction::default();
    engine.add_transaction(transaction.clone()).await.unwrap();
    
    // Check transaction exists in pool
    let tx_hash = transaction.hash();
    assert!(engine.transaction_exists(&tx_hash).await.unwrap());
    
    // Get transaction from pool
    let retrieved_tx = engine.get_transaction(&tx_hash).await.unwrap();
    assert!(retrieved_tx.is_some());
    assert_eq!(retrieved_tx.unwrap().hash(), tx_hash);
    
    // Check pool size
    assert_eq!(engine.get_mempool_size().await, 1);
}

#[tokio::test]
async fn test_block_creation_and_addition() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut engine = DAGEngine::new(&config.dag, metrics).await.unwrap();
    
    engine.start().await.unwrap();
    
    // Create block
    let creator = [1u8; 32];
    let block = engine.create_block(creator).await.unwrap();
    
    // Verify block properties
    assert!(block.height > 0);
    assert!(!block.parents.is_empty());
    assert_eq!(block.creator, creator);
    
    // Add block to DAG
    engine.add_block(block.clone()).await.unwrap();
    
    // Verify block was added
    let retrieved_block = engine.get_block(&block.id).await.unwrap();
    assert!(retrieved_block.is_some());
    assert_eq!(retrieved_block.unwrap().id, block.id);
    
    // Check DAG metrics
    let metrics = engine.get_metrics();
    assert_eq!(metrics.node_count, 2); // Genesis + new block
    assert!(metrics.edge_count > 0);
}

#[tokio::test]
async fn test_dag_structure_validation() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut engine = DAGEngine::new(&config.dag, metrics).await.unwrap();
    
    engine.start().await.unwrap();
    
    // Create multiple blocks
    let creator = [1u8; 32];
    for i in 0..5 {
        let block = engine.create_block(creator).await.unwrap();
        engine.add_block(block).await.unwrap();
    }
    
    // Validate DAG structure
    let is_valid = engine.validate_dag().await.unwrap();
    assert!(is_valid);
    
    // Check topology
    let topology = engine.get_topology().await.unwrap();
    assert!(topology.node_count > 1);
    assert!(topology.is_acyclic);
    assert!(topology.is_connected);
    assert!(topology.genesis_hash.is_some());
}

#[tokio::test]
async fn test_orphan_block_handling() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut engine = DAGEngine::new(&config.dag, metrics).await.unwrap();
    
    engine.start().await.unwrap();
    
    // Create orphan block (with non-existent parent)
    let mut orphan_block = Block::default();
    orphan_block.parents = vec![[255u8; 32]]; // Non-existent parent
    orphan_block.id = orphan_block.hash();
    
    // Add orphan block
    engine.add_block(orphan_block.clone()).await.unwrap();
    
    // Verify it's in orphan blocks
    assert!(engine.orphan_blocks.contains_key(&orphan_block.id));
    
    // Create parent block
    let creator = [1u8; 32];
    let parent_block = engine.create_block(creator).await.unwrap();
    engine.add_block(parent_block).await.unwrap();
    
    // Process orphan blocks (should now be processed)
    engine.process_orphan_blocks().await.unwrap();
    
    // Verify orphan block is no longer in orphans
    assert!(!engine.orphan_blocks.contains_key(&orphan_block.id));
}

#[tokio::test]
async fn test_transaction_selection() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut engine = DAGEngine::new(&config.dag, metrics).await.unwrap();
    
    engine.start().await.unwrap();
    
    // Add transactions with different priorities
    for i in 0..10 {
        let mut tx = Transaction::default();
        tx.priority = (i % 5) + 1; // Priorities 1-5
        tx.amount = i as u128 * 1000;
        engine.add_transaction(tx).await.unwrap();
    }
    
    // Create block (should select high priority transactions)
    let creator = [1u8; 32];
    let block = engine.create_block(creator).await.unwrap();
    
    // Verify transactions were selected
    assert!(!block.transactions.is_empty());
    assert!(block.transactions.len() <= config.dag.max_transactions_per_block);
    
    // Verify transaction pool is now smaller
    assert!(engine.get_mempool_size().await < 10);
}

#[tokio::test]
async fn test_parent_selection() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut engine = DAGEngine::new(&config.dag, metrics).await.unwrap();
    
    engine.start().await.unwrap();
    
    // Create multiple blocks to build DAG structure
    let creator = [1u8; 32];
    let mut blocks = Vec::new();
    
    for i in 0..5 {
        let block = engine.create_block(creator).await.unwrap();
        engine.add_block(block.clone()).await.unwrap();
        blocks.push(block);
    }
    
    // Create new block and check parent selection
    let new_block = engine.create_block(creator).await.unwrap();
    
    // Verify parents were selected
    assert!(!new_block.parents.is_empty());
    assert!(new_block.parents.len() <= config.dag.max_parents);
    
    // Verify all parents exist in DAG
    for parent_hash in &new_block.parents {
        assert!(engine.get_block(parent_hash).await.unwrap().is_some());
    }
}

#[tokio::test]
async fn test_dag_metrics() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut engine = DAGEngine::new(&config.dag, metrics).await.unwrap();
    
    engine.start().await.unwrap();
    
    // Create some blocks
    let creator = [1u8; 32];
    for i in 0..3 {
        let block = engine.create_block(creator).await.unwrap();
        engine.add_block(block).await.unwrap();
    }
    
    // Get metrics
    let dag_metrics = engine.get_metrics();
    
    assert!(dag_metrics.node_count >= 2); // At least genesis + 1 block
    assert!(dag_metrics.edge_count > 0);
    assert!(dag_metrics.avg_depth > 0.0);
    assert!(dag_metrics.max_depth > 0);
    assert!(dag_metrics.tips_count > 0);
}

#[tokio::test]
async fn test_block_validation() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut engine = DAGEngine::new(&config.dag, metrics).await.unwrap();
    
    engine.start().await.unwrap();
    
    // Create valid block
    let creator = [1u8; 32];
    let mut valid_block = engine.create_block(creator).await.unwrap();
    
    // Add some transactions
    for i in 0..3 {
        let mut tx = Transaction::default();
        tx.amount = i as u128;
        valid_block.transactions.push(tx);
    }
    
    // Recalculate merkle root
    valid_block.merkle_root = valid_block.calculate_merkle_root();
    valid_block.id = valid_block.hash();
    
    // Should be valid
    assert!(valid_block.validate());
    
    // Test invalid block (empty parents)
    let mut invalid_block = valid_block.clone();
    invalid_block.parents = Vec::new();
    assert!(!invalid_block.validate());
    
    // Test invalid block (wrong merkle root)
    let mut invalid_block = valid_block.clone();
    invalid_block.merkle_root = [255u8; 32];
    assert!(!invalid_block.validate());
    
    // Test invalid block (invalid signature length)
    let mut invalid_block = valid_block.clone();
    invalid_block.signature = vec![0u8; 10];
    assert!(!invalid_block.validate());
}

#[tokio::test]
async fn test_transaction_validation() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut engine = DAGEngine::new(&config.dag, metrics).await.unwrap();
    
    engine.start().await.unwrap();
    
    // Create valid transaction
    let mut valid_tx = Transaction::default();
    valid_tx.amount = 1000;
    valid_tx.gas_price = 1000;
    valid_tx.gas_limit = 21000;
    valid_tx.priority = 5;
    valid_tx.signature = vec![0u8; 2424]; // Valid Dilithium signature size
    
    // Should be valid
    assert!(valid_tx.validate());
    
    // Test invalid transaction (zero amount)
    let mut invalid_tx = valid_tx.clone();
    invalid_tx.amount = 0;
    assert!(!invalid_tx.validate());
    
    // Test invalid transaction (zero gas price)
    let mut invalid_tx = valid_tx.clone();
    invalid_tx.gas_price = 0;
    assert!(!invalid_tx.validate());
    
    // Test invalid transaction (zero gas limit)
    let mut invalid_tx = valid_tx.clone();
    invalid_tx.gas_limit = 0;
    assert!(!invalid_tx.validate());
    
    // Test invalid transaction (invalid priority)
    let mut invalid_tx = valid_tx.clone();
    invalid_tx.priority = 0;
    assert!(!invalid_tx.validate());
    
    // Test invalid transaction (invalid signature length)
    let mut invalid_tx = valid_tx.clone();
    invalid_tx.signature = vec![0u8; 10];
    assert!(!invalid_tx.validate());
}

#[tokio::test]
async fn test_dag_engine_lifecycle() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut engine = DAGEngine::new(&config.dag, metrics).await.unwrap();
    
    // Test start/stop cycle
    assert!(!engine.is_running);
    
    engine.start().await.unwrap();
    assert!(engine.is_running);
    
    // Should not start again
    let result = engine.start().await;
    assert!(result.is_ok());
    assert!(engine.is_running);
    
    engine.stop().await.unwrap();
    assert!(!engine.is_running);
    
    // Should not stop again
    let result = engine.stop().await;
    assert!(result.is_ok());
    assert!(!engine.is_running);
}

// Tests for the basic DAG structure
#[test]
fn test_dag_creation() {
    let dag = DAG::new();
    assert!(dag.is_empty());
    assert_eq!(dag.len(), 0);
    assert!(dag.get_tips().is_empty());
}

#[test]
fn test_dag_node_creation() {
    let node_id = "node1".to_string();
    let timestamp = 1234567890;
    let parents = vec![];
    let payload = b"test payload".to_vec();
    let hash = [1u8; 32];
    let signature = vec![0u8; 2424];
    
    let node = DAGNode::new(
        node_id.clone(),
        timestamp,
        parents,
        payload,
        hash,
        signature,
    );
    
    assert_eq!(node.id, node_id);
    assert_eq!(node.timestamp, timestamp);
    assert!(node.parents.is_empty());
    assert_eq!(node.payload, b"test payload");
    assert_eq!(node.hash, hash);
    assert_eq!(node.signature, signature);
}

#[test]
fn test_dag_node_validation() {
    let node_id = "node1".to_string();
    let timestamp = 1234567890;
    let parents = vec![];
    let payload = b"test payload".to_vec();
    let mut hash = [1u8; 32];
    let signature = vec![0u8; 2424];
    
    // Create valid node
    let node = DAGNode::new(
        node_id.clone(),
        timestamp,
        parents,
        payload,
        hash,
        signature,
    );
    
    // Should be valid
    assert!(node.validate());
    
    // Test invalid node (empty ID)
    let mut invalid_node = node.clone();
    invalid_node.id = String::new();
    assert!(!invalid_node.validate());
    
    // Test invalid node (zero timestamp)
    let mut invalid_node = node.clone();
    invalid_node.timestamp = 0;
    assert!(!invalid_node.validate());
    
    // Test invalid node (empty payload)
    let mut invalid_node = node.clone();
    invalid_node.payload = Vec::new();
    assert!(!invalid_node.validate());
    
    // Test invalid node (wrong signature length)
    let mut invalid_node = node.clone();
    invalid_node.signature = vec![0u8; 10];
    assert!(!invalid_node.validate());
    
    // Test invalid node (wrong hash)
    let mut invalid_node = node.clone();
    invalid_node.hash = [2u8; 32];
    assert!(!invalid_node.validate());
}

#[test]
fn test_dag_add_node() {
    let mut dag = DAG::new();
    
    // Create genesis node
    let genesis_node = DAGNode::new(
        "genesis".to_string(),
        1234567890,
        vec![],
        b"genesis payload".to_vec(),
        [1u8; 32],
        vec![0u8; 2424],
    );
    
    // Add genesis node
    let result = dag.add_node(genesis_node.clone());
    assert!(result.is_ok());
    assert_eq!(dag.len(), 1);
    assert!(dag.contains_node(&genesis_node.id));
    
    // Check tips
    let tips = dag.get_tips();
    assert_eq!(tips.len(), 1);
    assert!(tips.contains(&genesis_node.id));
    
    // Create child node
    let child_node = DAGNode::new(
        "child1".to_string(),
        1234567891,
        vec![genesis_node.id.clone()],
        b"child payload".to_vec(),
        [2u8; 32],
        vec![0u8; 2424],
    );
    
    // Add child node
    let result = dag.add_node(child_node.clone());
    assert!(result.is_ok());
    assert_eq!(dag.len(), 2);
    assert!(dag.contains_node(&child_node.id));
    
    // Check tips (genesis should no longer be a tip)
    let tips = dag.get_tips();
    assert_eq!(tips.len(), 1);
    assert!(tips.contains(&child_node.id));
    assert!(!tips.contains(&genesis_node.id));
}

#[test]
fn test_dag_add_node_validation() {
    let mut dag = DAG::new();
    
    // Create genesis node
    let genesis_node = DAGNode::new(
        "genesis".to_string(),
        1234567890,
        vec![],
        b"genesis payload".to_vec(),
        [1u8; 32],
        vec![0u8; 2424],
    );
    
    // Add genesis node
    let result = dag.add_node(genesis_node.clone());
    assert!(result.is_ok());
    
    // Try to add the same node again
    let result = dag.add_node(genesis_node.clone());
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Node already exists");
    
    // Try to add node with non-existent parent
    let orphan_node = DAGNode::new(
        "orphan".to_string(),
        1234567891,
        vec!["nonexistent".to_string()],
        b"orphan payload".to_vec(),
        [2u8; 32],
        vec![0u8; 2424],
    );
    
    let result = dag.add_node(orphan_node);
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("does not exist"));
    
    // Try to add invalid node
    let mut invalid_node = DAGNode::new(
        "invalid".to_string(),
        1234567891,
        vec![genesis_node.id.clone()],
        b"invalid payload".to_vec(),
        [3u8; 32],
        vec![0u8; 2424],
    );
    
    invalid_node.id = String::new(); // Invalid ID
    let result = dag.add_node(invalid_node);
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Invalid node structure");
}

#[test]
fn test_dag_get_tips() {
    let mut dag = DAG::new();
    
    // Initially no tips
    assert!(dag.get_tips().is_empty());
    
    // Add genesis node
    let genesis_node = DAGNode::new(
        "genesis".to_string(),
        1234567890,
        vec![],
        b"genesis payload".to_vec(),
        [1u8; 32],
        vec![0u8; 2424],
    );
    dag.add_node(genesis_node.clone()).unwrap();
    
    // Should have one tip
    let tips = dag.get_tips();
    assert_eq!(tips.len(), 1);
    assert!(tips.contains(&genesis_node.id));
    
    // Add two child nodes
    let child1 = DAGNode::new(
        "child1".to_string(),
        1234567891,
        vec![genesis_node.id.clone()],
        b"child1 payload".to_vec(),
        [2u8; 32],
        vec![0u8; 2424],
    );
    
    let child2 = DAGNode::new(
        "child2".to_string(),
        1234567892,
        vec![genesis_node.id.clone()],
        b"child2 payload".to_vec(),
        [3u8; 32],
        vec![0u8; 2424],
    );
    
    dag.add_node(child1.clone()).unwrap();
    dag.add_node(child2.clone()).unwrap();
    
    // Should have two tips
    let tips = dag.get_tips();
    assert_eq!(tips.len(), 2);
    assert!(tips.contains(&child1.id));
    assert!(tips.contains(&child2.id));
    assert!(!tips.contains(&genesis_node.id));
    
    // Add grandchild node
    let grandchild = DAGNode::new(
        "grandchild".to_string(),
        1234567893,
        vec![child1.id.clone()],
        b"grandchild payload".to_vec(),
        [4u8; 32],
        vec![0u8; 2424],
    );
    
    dag.add_node(grandchild.clone()).unwrap();
    
    // Should have two tips (child2 and grandchild)
    let tips = dag.get_tips();
    assert_eq!(tips.len(), 2);
    assert!(tips.contains(&child2.id));
    assert!(tips.contains(&grandchild.id));
    assert!(!tips.contains(&child1.id));
}

#[test]
fn test_dag_validate_node() {
    let mut dag = DAG::new();
    
    // Create and add valid node
    let valid_node = DAGNode::new(
        "valid".to_string(),
        1234567890,
        vec![],
        b"valid payload".to_vec(),
        [1u8; 32],
        vec![0u8; 2424],
    );
    
    dag.add_node(valid_node.clone()).unwrap();
    
    // Validate existing node
    let result = dag.validate_node(&valid_node.id);
    assert!(result.is_ok());
    assert!(result.unwrap());
    
    // Try to validate non-existent node
    let result = dag.validate_node("nonexistent");
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Node not found");
}

#[test]
fn test_dag_traverse() {
    let mut dag = DAG::new();
    
    // Create a simple DAG structure:
    // genesis -> child1 -> grandchild1
    //         -> child2 -> grandchild2
    
    let genesis = DAGNode::new(
        "genesis".to_string(),
        1234567890,
        vec![],
        b"genesis".to_vec(),
        [1u8; 32],
        vec![0u8; 2424],
    );
    
    let child1 = DAGNode::new(
        "child1".to_string(),
        1234567891,
        vec![genesis.id.clone()],
        b"child1".to_vec(),
        [2u8; 32],
        vec![0u8; 2424],
    );
    
    let child2 = DAGNode::new(
        "child2".to_string(),
        1234567892,
        vec![genesis.id.clone()],
        b"child2".to_vec(),
        [3u8; 32],
        vec![0u8; 2424],
    );
    
    let grandchild1 = DAGNode::new(
        "grandchild1".to_string(),
        1234567893,
        vec![child1.id.clone()],
        b"grandchild1".to_vec(),
        [4u8; 32],
        vec![0u8; 2424],
    );
    
    let grandchild2 = DAGNode::new(
        "grandchild2".to_string(),
        1234567894,
        vec![child2.id.clone()],
        b"grandchild2".to_vec(),
        [5u8; 32],
        vec![0u8; 2424],
    );
    
    // Add all nodes
    dag.add_node(genesis.clone()).unwrap();
    dag.add_node(child1.clone()).unwrap();
    dag.add_node(child2.clone()).unwrap();
    dag.add_node(grandchild1.clone()).unwrap();
    dag.add_node(grandchild2.clone()).unwrap();
    
    // Traverse from genesis
    let result = dag.traverse_dag(&genesis.id);
    assert!(result.is_ok());
    
    let traversal = result.unwrap();
    assert_eq!(traversal.len(), 5); // All nodes should be visited
    
    // Verify all nodes are included
    let node_ids: Vec<&str> = traversal.iter().map(|s| s.as_str()).collect();
    assert!(node_ids.contains(&"genesis"));
    assert!(node_ids.contains(&"child1"));
    assert!(node_ids.contains(&"child2"));
    assert!(node_ids.contains(&"grandchild1"));
    assert!(node_ids.contains(&"grandchild2"));
    
    // Traverse from child1
    let result = dag.traverse_dag(&child1.id);
    assert!(result.is_ok());
    
    let traversal = result.unwrap();
    assert_eq!(traversal.len(), 2); // child1 and grandchild1
    
    let node_ids: Vec<&str> = traversal.iter().map(|s| s.as_str()).collect();
    assert!(node_ids.contains(&"child1"));
    assert!(node_ids.contains(&"grandchild1"));
    
    // Try to traverse from non-existent node
    let result = dag.traverse_dag("nonexistent");
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Start node not found");
}

#[test]
fn test_dag_utilities() {
    let mut dag = DAG::new();
    
    // Test empty DAG
    assert!(dag.is_empty());
    assert_eq!(dag.len(), 0);
    
    // Add a node
    let node = DAGNode::new(
        "node1".to_string(),
        1234567890,
        vec![],
        b"payload".to_vec(),
        [1u8; 32],
        vec![0u8; 2424],
    );
    
    dag.add_node(node.clone()).unwrap();
    
    // Test non-empty DAG
    assert!(!dag.is_empty());
    assert_eq!(dag.len(), 1);
    assert!(dag.contains_node(&node.id));
    
    // Test get_node
    let retrieved_node = dag.get_node(&node.id);
    assert!(retrieved_node.is_some());
    assert_eq!(retrieved_node.unwrap().id, node.id);
    
    // Test get_all_nodes
    let all_nodes = dag.get_all_nodes();
    assert_eq!(all_nodes.len(), 1);
    assert_eq!(all_nodes[0].id, node.id);
    
    // Test clear
    dag.clear();
    assert!(dag.is_empty());
    assert_eq!(dag.len(), 0);
    assert!(dag.get_tips().is_empty());
}

#[test]
fn test_dag_default() {
    let dag: DAG = DAG::default();
    assert!(dag.is_empty());
    assert_eq!(dag.len(), 0);
    assert!(dag.get_tips().is_empty());
}