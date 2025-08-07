//! Integration tests for DAG-aware PBFT consensus

use kaldrix_core::*;
use std::sync::Arc;
use tokio::time::{sleep, Duration};

/// Test DAG-aware PBFT consensus flow with multiple validators
#[tokio::test]
async fn test_dag_aware_pbft_consensus() {
    // Initialize core with DAG-aware configuration
    let mut config = CoreConfig::default();
    config.consensus.num_validators = 4;
    config.dag.max_parents = 3;
    
    let metrics = Arc::new(CoreMetrics::new());
    let mut consensus_engine = ConsensusEngine::new(&config.consensus, metrics.clone()).await.unwrap();
    
    // Start consensus engine
    consensus_engine.start().await.unwrap();
    
    // Add 4 validators (simulating different nodes)
    let validators = create_test_validators(4);
    for validator in validators {
        consensus_engine.add_validator(validator).await.unwrap();
    }
    
    // Verify validators were added
    let active_validators = consensus_engine.get_active_validators().await;
    assert_eq!(active_validators.len(), 4);
    
    // Create DAG tips for block proposal
    let tip1 = [1u8; 32];
    let tip2 = [2u8; 32];
    let tip3 = [3u8; 32];
    let dag_tips = vec![tip1, tip2, tip3];
    
    // Propose DAG-aware block
    let block = consensus_engine.propose_dag_block(dag_tips, "Test DAG block".to_string()).await.unwrap();
    
    // Verify block has DAG parent IDs
    assert!(!block.dag_parent_ids.is_empty());
    assert_eq!(block.dag_parent_ids.len(), 3);
    
    // Validate DAG-aware block
    let is_valid = consensus_engine.validate_dag_block(&block).await.unwrap();
    assert!(is_valid);
    
    // Commit DAG-aware block
    consensus_engine.commit_dag_block(block.clone()).await.unwrap();
    
    // Verify block was committed
    let status = consensus_engine.get_status();
    assert!(status.health_score > 0.0);
    assert_eq!(status.active_validators, 4);
    
    // Check DAG-specific metrics
    let checkpoint_count = metrics.get_checkpoint_count();
    assert!(checkpoint_count > 0);
    
    consensus_engine.stop().await.unwrap();
}

/// Test DAG tip convergence validation
#[tokio::test]
async fn test_dag_tip_convergence() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut dag_engine = DAGEngine::new(&config.dag, metrics.clone()).await.unwrap();
    
    // Start DAG engine
    dag_engine.start().await.unwrap();
    
    // Create test nodes with known ancestry
    let genesis_hash = dag_engine.genesis_hash.unwrap();
    let node1_hash = [1u8; 32];
    let node2_hash = [2u8; 32];
    let node3_hash = [3u8; 32];
    
    // Test ancestry retrieval
    let ancestry = dag_engine.get_ancestry(&node1_hash).await.unwrap();
    assert!(ancestry.contains(&genesis_hash));
    
    // Test tip convergence - nodes with common ancestry should converge
    let converges = dag_engine.validate_tip_convergence(&node1_hash, &node2_hash).await.unwrap();
    assert!(converges);
    
    // Test checkpoint marking
    dag_engine.mark_checkpoint(&node1_hash).await.unwrap();
    
    // Verify checkpoint was marked
    let checkpoint_count = metrics.get_checkpoint_count();
    assert_eq!(checkpoint_count, 1);
    
    dag_engine.stop().await.unwrap();
}

/// Test DAG node reception and conversion to block
#[tokio::test]
async fn test_dag_node_reception() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut consensus_engine = ConsensusEngine::new(&config.consensus, metrics.clone()).await.unwrap();
    
    // Start consensus engine
    consensus_engine.start().await.unwrap();
    
    // Add validators
    let validators = create_test_validators(3);
    for validator in validators {
        consensus_engine.add_validator(validator).await.unwrap();
    }
    
    // Simulate DAG node reception
    let node_id = [42u8; 32];
    consensus_engine.on_dag_node_received(&node_id).await.unwrap();
    
    // Verify the node was processed (should be in pending blocks)
    sleep(Duration::from_millis(50)).await;
    
    // Check consensus status
    let status = consensus_engine.get_status();
    assert!(status.health_score > 0.0);
    
    consensus_engine.stop().await.unwrap();
}

/// Test double-spend detection in DAG ancestry
#[tokio::test]
async fn test_double_spend_detection() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut consensus_engine = ConsensusEngine::new(&config.consensus, metrics).await.unwrap();
    
    // Start consensus engine
    consensus_engine.start().await.unwrap();
    
    // Create a transaction
    let mut transaction = Transaction::default();
    transaction.sender = [1u8; 32];
    transaction.receiver = [2u8; 32];
    transaction.amount = 1000;
    transaction.nonce = 1;
    
    // Create block with the transaction
    let mut block = Block::default();
    block.transactions.push(transaction.clone());
    block.dag_parent_ids = vec![[1u8; 32], [2u8; 32]];
    
    // Test double-spend detection (should return false for no double-spend)
    let has_double_spend = consensus_engine.detect_double_spend(&transaction, &block.parents).await.unwrap();
    assert!(!has_double_spend);
    
    consensus_engine.stop().await.unwrap();
}

/// Test DAG growth rate metrics
#[tokio::test]
async fn test_dag_growth_metrics() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut dag_engine = DAGEngine::new(&config.dag, metrics.clone()).await.unwrap();
    
    // Start DAG engine
    dag_engine.start().await.unwrap();
    
    // Add some nodes to simulate growth
    for i in 0..10 {
        let mut transaction = Transaction::default();
        transaction.amount = i as u128 * 100;
        transaction.nonce = i;
        
        dag_engine.add_transaction(transaction).await.unwrap();
        
        // Create block periodically
        if i % 3 == 0 {
            let creator = [i as u8; 32];
            let _block = dag_engine.create_block(creator).await.unwrap();
        }
    }
    
    // Update growth rate
    metrics.update_dag_growth_rate();
    
    // Check growth rate
    let growth_rate = metrics.get_dag_growth_rate();
    assert!(growth_rate >= 0.0);
    
    // Update tip divergence
    metrics.update_tip_divergence(0.5);
    let tip_divergence = metrics.get_tip_divergence();
    assert!(tip_divergence > 0.0);
    
    dag_engine.stop().await.unwrap();
}

/// Test multiple DAG tips handling
#[tokio::test]
async fn test_multiple_dag_tips() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut consensus_engine = ConsensusEngine::new(&config.consensus, metrics).await.unwrap();
    
    // Start consensus engine
    consensus_engine.start().await.unwrap();
    
    // Add validators
    let validators = create_test_validators(5);
    for validator in validators {
        consensus_engine.add_validator(validator).await.unwrap();
    }
    
    // Test with varying numbers of DAG tips
    for tip_count in &[1, 2, 3, 5, 8] {
        let tips: Vec<BlockHash> = (0..*tip_count)
            .map(|i| [i as u8; 32])
            .collect();
        
        let block = consensus_engine.propose_dag_block(tips, format!("Block with {} tips", tip_count)).await.unwrap();
        
        // Verify block was created with correct number of DAG parent IDs
        assert_eq!(block.dag_parent_ids.len(), *tip_count);
        
        // Validate block
        let is_valid = consensus_engine.validate_dag_block(&block).await.unwrap();
        assert!(is_valid);
    }
    
    consensus_engine.stop().await.unwrap();
}

/// Test DAG checkpoint finality
#[tokio::test]
async fn test_dag_checkpoint_finality() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut consensus_engine = ConsensusEngine::new(&config.consensus, metrics.clone()).await.unwrap();
    
    // Start consensus engine
    consensus_engine.start().await.unwrap();
    
    // Add validators
    let validators = create_test_validators(3);
    for validator in validators {
        consensus_engine.add_validator(validator).await.unwrap();
    }
    
    // Create and commit multiple DAG-aware blocks
    for i in 0..5 {
        let tips = vec![[i as u8; 32], [(i + 1) as u8; 32]];
        let block = consensus_engine.propose_dag_block(tips, format!("Checkpoint block {}", i)).await.unwrap();
        
        consensus_engine.commit_dag_block(block).await.unwrap();
        
        // Verify checkpoint count increases
        let checkpoint_count = metrics.get_checkpoint_count();
        assert_eq!(checkpoint_count, (i + 1) as u64);
    }
    
    // Verify final checkpoint count
    let final_checkpoint_count = metrics.get_checkpoint_count();
    assert_eq!(final_checkpoint_count, 5);
    
    consensus_engine.stop().await.unwrap();
}

/// Test DAG-aware consensus failure handling
#[tokio::test]
async fn test_dag_consensus_failure_handling() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut consensus_engine = ConsensusEngine::new(&config.consensus, metrics).await.unwrap();
    
    // Start consensus engine
    consensus_engine.start().await.unwrap();
    
    // Add validators
    let validators = create_test_validators(3);
    for validator in validators {
        consensus_engine.add_validator(validator).await.unwrap();
    }
    
    // Test with empty DAG tips (should fail)
    let empty_tips = Vec::new();
    let result = consensus_engine.propose_dag_block(empty_tips, "Invalid block".to_string()).await;
    assert!(result.is_ok()); // Should still create block, but validation will fail
    
    // Test validation of invalid block
    if let Ok(block) = result {
        let is_valid = consensus_engine.validate_dag_block(&block).await.unwrap();
        assert!(!is_valid); // Should fail due to empty DAG parent IDs
    }
    
    consensus_engine.stop().await.unwrap();
}

/// Helper function to create test validators
fn create_test_validators(count: usize) -> Vec<Validator> {
    (0..count)
        .map(|i| Validator {
            id: format!("test_validator_{}", i),
            public_key: [i as u8; 32],
            stake: 1000000000000000000u128 + (i as u128 * 100000000000000000u128),
            status: ValidatorStatus::Active,
            joined_at: chrono::Utc::now(),
            last_active: chrono::Utc::now(),
            performance: ValidatorPerformance::default(),
            region: if i % 3 == 0 { "US-East".to_string() }
                     else if i % 3 == 1 { "EU-West".to_string() }
                     else { "Asia-Pacific".to_string() },
        })
        .collect()
}