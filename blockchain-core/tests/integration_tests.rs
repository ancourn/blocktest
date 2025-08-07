//! Integration tests for KALDRIX blockchain core

use kaldrix_core::*;
use std::sync::Arc;
use tokio::time::{sleep, Duration};

/// Test complete blockchain workflow
#[tokio::test]
async fn test_complete_blockchain_workflow() {
    // Initialize core
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut core = KaldrixCore::new(config).await.unwrap();
    
    // Start core
    core.start().await.unwrap();
    
    // Generate key pairs
    let keypair1 = core.generate_key_pair().unwrap();
    let keypair2 = core.generate_key_pair().unwrap();
    
    // Create and submit transactions
    let mut transaction1 = Transaction::default();
    transaction1.sender = keypair1.public_key;
    transaction1.receiver = keypair2.public_key;
    transaction1.amount = 1000;
    transaction1.nonce = 1;
    
    let tx1_id = core.submit_transaction(transaction1.clone()).await.unwrap();
    
    let mut transaction2 = Transaction::default();
    transaction2.sender = keypair2.public_key;
    transaction2.receiver = keypair1.public_key;
    transaction2.amount = 500;
    transaction2.nonce = 1;
    
    let tx2_id = core.submit_transaction(transaction2.clone()).await.unwrap();
    
    // Verify transactions are in pool
    let retrieved_tx1 = core.get_transaction(&tx1_id).await.unwrap();
    assert!(retrieved_tx1.is_some());
    
    let retrieved_tx2 = core.get_transaction(&tx2_id).await.unwrap();
    assert!(retrieved_tx2.is_some());
    
    // Create a block
    let block = core.dag_engine.write().await.create_block(keypair1.public_key).await.unwrap();
    
    // Submit block for consensus
    core.submit_block(block.clone()).await.unwrap();
    
    // Wait for consensus to complete
    sleep(Duration::from_millis(100)).await;
    
    // Verify block was committed
    let retrieved_block = core.get_block(&block.id).await.unwrap();
    assert!(retrieved_block.is_some());
    
    // Check metrics
    let dag_metrics = core.get_dag_metrics().await.unwrap();
    assert!(dag_metrics.node_count > 0);
    
    let consensus_status = core.get_consensus_status().await;
    assert!(consensus_status.health_score > 0.0);
    
    // Stop core
    core.stop().await.unwrap();
}

/// Test DAG structure and operations
#[tokio::test]
async fn test_dag_operations() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut dag_engine = DAGEngine::new(&config.dag, metrics).await.unwrap();
    
    // Start DAG engine
    dag_engine.start().await.unwrap();
    
    // Add transactions
    let transaction = Transaction::default();
    dag_engine.add_transaction(transaction.clone()).await.unwrap();
    
    // Create block
    let creator = [1u8; 32];
    let block = dag_engine.create_block(creator).await.unwrap();
    
    // Add block to DAG
    dag_engine.add_block(block.clone()).await.unwrap();
    
    // Verify block was added
    let retrieved_block = dag_engine.get_block(&block.id).await.unwrap();
    assert!(retrieved_block.is_some());
    assert_eq!(retrieved_block.unwrap().id, block.id);
    
    // Verify transaction was included
    let retrieved_tx = dag_engine.get_transaction(&transaction.hash()).await.unwrap();
    assert!(retrieved_tx.is_some());
    
    // Check DAG metrics
    let metrics = dag_engine.get_metrics();
    assert_eq!(metrics.node_count, 2); // Genesis + new block
    assert!(metrics.transaction_pool_size == 0); // Transaction should be in block
    
    // Validate DAG structure
    let is_valid = dag_engine.validate_dag().await.unwrap();
    assert!(is_valid);
    
    // Get topology
    let topology = dag_engine.get_topology().await.unwrap();
    assert!(topology.node_count > 0);
    assert!(topology.is_acyclic);
    assert!(topology.is_connected);
    
    // Stop DAG engine
    dag_engine.stop().await.unwrap();
}

/// Test quantum-resistant cryptography
#[tokio::test]
async fn test_quantum_cryptography() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let crypto = QuantumCrypto::new(&config.crypto, metrics).unwrap();
    
    // Test key generation
    let keypair = crypto.generate_key_pair().unwrap();
    assert!(!keypair.public_key.is_empty());
    assert!(!keypair.private_key.is_empty());
    
    // Test signing and verification
    let data = b"test data for quantum signatures";
    let signature = crypto.sign(data, &keypair.private_key).unwrap();
    let is_valid = crypto.verify(data, &signature, &keypair.public_key).unwrap();
    assert!(is_valid);
    
    // Test with invalid data
    let invalid_data = b"invalid data";
    let is_valid = crypto.verify(invalid_data, &signature, &keypair.public_key).unwrap();
    assert!(!is_valid);
    
    // Test transaction hashing
    let transaction = Transaction::default();
    let tx_hash = crypto.hash_transaction(&transaction).unwrap();
    assert_eq!(tx_hash.len(), 32);
    
    // Test block hashing
    let block = Block::default();
    let block_hash = crypto.hash_block(&block).unwrap();
    assert_eq!(block_hash.len(), 32);
    
    // Test encryption/decryption
    let plaintext = b"secret quantum message";
    let ciphertext = crypto.encrypt(plaintext, &keypair.public_key).unwrap();
    let decrypted = crypto.decrypt(&ciphertext, &keypair.private_key).unwrap();
    assert_eq!(decrypted, plaintext);
    
    // Test key caching
    let cached_keypair = crypto.get_key_pair(&keypair.id).unwrap();
    assert!(cached_keypair.is_some());
    assert_eq!(cached_keypair.unwrap().id, keypair.id);
    
    // Test performance stats
    let stats = crypto.get_performance_stats();
    assert!(stats.total_operations > 0);
    assert!(stats.failed_operations == 0);
    
    // Test security level
    let security_level = crypto.get_security_level();
    assert!(matches!(security_level, SecurityLevel::QuantumResistant | SecurityLevel::Hybrid));
}

/// Test consensus mechanism
#[tokio::test]
async fn test_consensus_mechanism() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut consensus_engine = ConsensusEngine::new(&config.consensus, metrics).await.unwrap();
    
    // Start consensus engine
    consensus_engine.start().await.unwrap();
    
    // Add validators
    for i in 0..7 {
        let validator = Validator {
            id: format!("validator_{}", i),
            public_key: [i as u8; 32],
            stake: config.consensus.min_stake + (i as u128 * 1000000000000000000u128),
            status: ValidatorStatus::Active,
            joined_at: chrono::Utc::now(),
            last_active: chrono::Utc::now(),
            performance: ValidatorPerformance::default(),
            region: "US-East".to_string(),
        };
        consensus_engine.add_validator(validator).await.unwrap();
    }
    
    // Verify validators were added
    let validators = consensus_engine.get_validators().await;
    assert_eq!(validators.len(), 7);
    
    let active_validators = consensus_engine.get_active_validators().await;
    assert_eq!(active_validators.len(), 7);
    
    // Test validator validation
    let is_valid = consensus_engine.validate_validator("validator_0").await.unwrap();
    assert!(is_valid);
    
    // Submit block for consensus
    let block = Block::default();
    consensus_engine.submit_block(block.clone()).await.unwrap();
    
    // Wait for consensus processing
    sleep(Duration::from_millis(100)).await;
    
    // Check consensus status
    let status = consensus_engine.get_status();
    assert!(status.health_score > 0.0);
    assert_eq!(status.active_validators, 7);
    
    // Test quorum calculation
    let votes = vec![
        Vote::default(), Vote::default(), Vote::default(), Vote::default(), Vote::default()
    ];
    let has_quorum = consensus_engine.has_quorum(&votes);
    assert!(has_quorum); // 5/7 votes should meet 2/3 threshold
    
    // Test consensus metrics
    let metrics = consensus_engine.get_consensus_metrics().await;
    assert!(metrics.total_rounds >= 0);
    assert!(metrics.participation_rate > 0.0);
    
    // Test validator slashing
    consensus_engine.slash_validator("validator_0", "test misbehavior").await.unwrap();
    let active_validators = consensus_engine.get_active_validators().await;
    assert_eq!(active_validators.len(), 6); // One should be slashed
    
    // Stop consensus engine
    consensus_engine.stop().await.unwrap();
}

/// Test transaction validation and processing
#[tokio::test]
async fn test_transaction_processing() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut core = KaldrixCore::new(config).await.unwrap();
    
    core.start().await.unwrap();
    
    // Generate key pairs
    let sender_keypair = core.generate_key_pair().unwrap();
    let receiver_keypair = core.generate_key_pair().unwrap();
    
    // Create valid transaction
    let mut valid_transaction = Transaction {
        sender: sender_keypair.public_key,
        receiver: receiver_keypair.public_key,
        amount: 1000,
        gas_price: 1000,
        gas_limit: 21000,
        nonce: 1,
        data: Vec::new(),
        signature: vec![0u8; 2424], // Placeholder Dilithium signature
        timestamp: current_timestamp_ms(),
        priority: 5,
        quantum_signature: None,
        ..Default::default()
    };
    
    // Calculate transaction ID
    valid_transaction.id = valid_transaction.hash();
    
    // Submit valid transaction
    let tx_id = core.submit_transaction(valid_transaction.clone()).await.unwrap();
    
    // Verify transaction was submitted
    let retrieved_tx = core.get_transaction(&tx_id).await.unwrap();
    assert!(retrieved_tx.is_some());
    assert_eq!(retrieved_tx.unwrap().amount, 1000);
    
    // Test transaction validation
    assert!(valid_transaction.validate());
    
    // Test invalid transaction (zero amount)
    let mut invalid_transaction = valid_transaction.clone();
    invalid_transaction.amount = 0;
    assert!(!invalid_transaction.validate());
    
    // Test transaction fee calculation
    assert_eq!(valid_transaction.fee(), 1000 * 21000);
    
    // Test transaction prioritization
    let mut high_priority_tx = valid_transaction.clone();
    high_priority_tx.priority = 10;
    high_priority_tx.gas_price = 2000;
    
    let mut low_priority_tx = valid_transaction.clone();
    low_priority_tx.priority = 1;
    low_priority_tx.gas_price = 500;
    
    // High priority transaction should have higher fee
    assert!(high_priority_tx.fee() > low_priority_tx.fee());
    
    core.stop().await.unwrap();
}

/// Test block validation and processing
#[tokio::test]
async fn test_block_processing() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut core = KaldrixCore::new(config).await.unwrap();
    
    core.start().await.unwrap();
    
    // Generate key pair for block creator
    let creator_keypair = core.generate_key_pair().unwrap();
    
    // Create transactions
    let mut transactions = Vec::new();
    for i in 0..10 {
        let mut tx = Transaction::default();
        tx.amount = i as u128 * 100;
        tx.nonce = i;
        transactions.push(tx);
    }
    
    // Create block
    let mut block = Block {
        height: 1,
        parents: vec![[0u8; 32]], // Genesis block
        transactions: transactions.clone(),
        creator: creator_keypair.public_key,
        timestamp: current_timestamp_ms(),
        signature: vec![0u8; 2424],
        version: 1,
        merkle_root: [0u8; 32],
        state_root: [0u8; 32],
        metadata: HashMap::new(),
        ..Default::default()
    };
    
    // Calculate block hash and merkle root
    block.merkle_root = block.calculate_merkle_root();
    block.id = block.hash();
    
    // Submit block for consensus
    core.submit_block(block.clone()).await.unwrap();
    
    // Wait for consensus
    sleep(Duration::from_millis(100)).await;
    
    // Verify block was processed
    let retrieved_block = core.get_block(&block.id).await.unwrap();
    assert!(retrieved_block.is_some());
    assert_eq!(retrieved_block.unwrap().height, 1);
    
    // Test block validation
    assert!(block.validate());
    
    // Test merkle root calculation
    assert_eq!(block.calculate_merkle_root(), block.merkle_root);
    
    // Test invalid block (empty parents)
    let mut invalid_block = block.clone();
    invalid_block.parents = Vec::new();
    assert!(!invalid_block.validate());
    
    // Test block with invalid signature
    let mut invalid_sig_block = block.clone();
    invalid_sig_block.signature = Vec::new();
    assert!(!invalid_sig_block.validate());
    
    core.stop().await.unwrap();
}

/// Test network resilience and error handling
#[tokio::test]
async fn test_network_resilience() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut core = KaldrixCore::new(config).await.unwrap();
    
    core.start().await.unwrap();
    
    // Test with invalid transaction
    let mut invalid_tx = Transaction::default();
    invalid_tx.amount = 0; // Invalid amount
    
    let result = core.submit_transaction(invalid_tx).await;
    assert!(result.is_err());
    
    // Test with non-existent transaction
    let fake_tx_id = [255u8; 32];
    let retrieved_tx = core.get_transaction(&fake_tx_id).await.unwrap();
    assert!(retrieved_tx.is_none());
    
    // Test with non-existent block
    let fake_block_hash = [255u8; 32];
    let retrieved_block = core.get_block(&fake_block_hash).await.unwrap();
    assert!(retrieved_block.is_none());
    
    // Test consensus with insufficient validators
    let mut consensus_config = ConsensusConfig::default();
    consensus_config.num_validators = 1;
    consensus_config.min_validators = 3;
    
    let mut bad_consensus = ConsensusEngine::new(&consensus_config, Arc::new(CoreMetrics::new())).await.unwrap();
    bad_consensus.start().await.unwrap();
    
    // Should fail due to insufficient validators
    let block = Block::default();
    let result = bad_consensus.submit_block(block).await;
    assert!(result.is_err());
    
    bad_consensus.stop().await.unwrap();
    
    // Test cryptography with invalid keys
    let crypto = QuantumCrypto::new(&config.crypto, metrics).unwrap();
    
    let invalid_private_key = [0u8; 32]; // Wrong size
    let result = crypto.sign(b"test", &invalid_private_key);
    assert!(result.is_err());
    
    let invalid_signature = vec![0u8; 10]; // Wrong size
    let result = crypto.verify(b"test", &invalid_signature, &[0u8; 32]);
    assert!(result.is_err());
    
    core.stop().await.unwrap();
}

/// Test performance and scalability
#[tokio::test]
async fn test_performance_scalability() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut core = KaldrixCore::new(config).await.unwrap();
    
    core.start().await.unwrap();
    
    let start_time = std::time::Instant::now();
    let num_transactions = 1000;
    
    // Generate and submit many transactions
    let keypair = core.generate_key_pair().unwrap();
    
    for i in 0..num_transactions {
        let mut tx = Transaction::default();
        tx.sender = keypair.public_key;
        tx.receiver = [0u8; 32];
        tx.amount = i as u128;
        tx.nonce = i;
        
        core.submit_transaction(tx).await.unwrap();
        
        if i % 100 == 0 {
            println!("Submitted {} transactions", i);
        }
    }
    
    let tx_duration = start_time.elapsed();
    let tx_tps = num_transactions as f64 / tx_duration.as_secs_f64();
    
    println!("Transaction submission: {:.2} TPS", tx_tps);
    
    // Create and submit many blocks
    let block_start = std::time::Instant::now();
    let num_blocks = 50;
    
    for i in 0..num_blocks {
        let block = core.dag_engine.write().await.create_block(keypair.public_key).await.unwrap();
        core.submit_block(block).await.unwrap();
        
        if i % 10 == 0 {
            println!("Created {} blocks", i);
        }
        
        // Small delay to allow consensus processing
        sleep(Duration::from_millis(10)).await;
    }
    
    let block_duration = block_start.elapsed();
    let block_tps = num_blocks as f64 / block_duration.as_secs_f64();
    
    println!("Block creation: {:.2} blocks/sec", block_tps);
    
    // Check final metrics
    let dag_metrics = core.get_dag_metrics().await.unwrap();
    let consensus_status = core.get_consensus_status().await;
    let core_metrics = core.get_metrics().get_all_metrics();
    
    println!("Final DAG metrics: {} nodes, {} edges", dag_metrics.node_count, dag_metrics.edge_count);
    println!("Final consensus health: {:.1}%", consensus_status.health_score);
    println!("Total transactions submitted: {}", core_metrics.transactions.submitted);
    println!("Total blocks created: {}", core_metrics.blocks.created);
    
    // Performance assertions
    assert!(tx_tps > 100.0, "Transaction TPS should be > 100");
    assert!(block_tps > 1.0, "Block creation rate should be > 1/sec");
    assert!(dag_metrics.node_count > 10, "Should have multiple DAG nodes");
    assert!(consensus_status.health_score > 50.0, "Consensus health should be reasonable");
    
    core.stop().await.unwrap();
}

/// Test concurrent operations
#[tokio::test]
async fn test_concurrent_operations() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut core = KaldrixCore::new(config).await.unwrap();
    
    core.start().await.unwrap();
    
    let keypair = core.generate_key_pair().unwrap();
    
    // Spawn multiple tasks to submit transactions concurrently
    let mut handles = Vec::new();
    for i in 0..10 {
        let core_ref = &core;
        let keypair_ref = &keypair;
        let handle = tokio::spawn(async move {
            for j in 0..100 {
                let mut tx = Transaction::default();
                tx.sender = keypair_ref.public_key;
                tx.receiver = [0u8; 32];
                tx.amount = (i * 100 + j) as u128;
                tx.nonce = (i * 100 + j) as u64;
                
                core_ref.submit_transaction(tx).await.unwrap();
            }
        });
        handles.push(handle);
    }
    
    // Wait for all tasks to complete
    for handle in handles {
        handle.await.unwrap();
    }
    
    // Verify all transactions were processed
    let final_metrics = core.get_metrics().get_all_metrics();
    assert_eq!(final_metrics.transactions.submitted, 1000);
    
    // Test concurrent block creation
    let mut block_handles = Vec::new();
    for i in 0..5 {
        let core_ref = &core;
        let creator = keypair.public_key;
        let handle = tokio::spawn(async move {
            for _ in 0..10 {
                let block = core_ref.dag_engine.write().await.create_block(creator).await.unwrap();
                core_ref.submit_block(block).await.unwrap();
                tokio::time::sleep(Duration::from_millis(10)).await;
            }
        });
        block_handles.push(handle);
    }
    
    // Wait for all block creation tasks to complete
    for handle in block_handles {
        handle.await.unwrap();
    }
    
    // Verify blocks were created
    let final_dag_metrics = core.get_dag_metrics().await.unwrap();
    assert!(final_dag_metrics.node_count > 50); // Should have many blocks
    
    core.stop().await.unwrap();
}

/// Test end-to-end DAG transaction flow with SimpleTransaction
#[tokio::test]
async fn test_end_to_end_dag_transaction_flow() {
    // Initialize core
    let config = CoreConfig::default();
    let mut core = KaldrixCore::new(config).await.unwrap();
    
    // Start core
    core.start().await.unwrap();
    
    // Generate key pair
    let keypair = core.generate_key_pair().unwrap();
    
    // Create a SimpleTransaction
    let simple_tx = SimpleTransaction::new(
        "alice".to_string(),
        "bob".to_string(),
        1000,
        1
    );
    
    // Validate the simple transaction
    assert!(simple_tx.validate());
    assert_eq!(simple_tx.from, "alice");
    assert_eq!(simple_tx.to, "bob");
    assert_eq!(simple_tx.amount, 1000);
    assert_eq!(simple_tx.nonce, 1);
    
    // Test transaction signing
    let signature = core.sign_transaction(&simple_tx, &keypair.private_key).unwrap();
    assert!(!signature.is_empty());
    
    // Test signature verification
    let is_valid = core.verify_transaction_signature(&simple_tx, &signature, &keypair.public_key).unwrap();
    assert!(is_valid);
    
    // Test with invalid signature
    let invalid_signature = "invalid_signature";
    let is_valid_invalid = core.verify_transaction_signature(&simple_tx, invalid_signature, &keypair.public_key).unwrap();
    assert!(!is_valid_invalid);
    
    // Submit the simple transaction to the DAG
    let node_id = core.submit_simple_transaction(simple_tx.clone(), &keypair.private_key).await.unwrap();
    assert!(!node_id.is_empty());
    
    // Wait for processing
    tokio::time::sleep(Duration::from_millis(100)).await;
    
    // Get current tips
    let tips = core.get_current_tips().await.unwrap();
    assert!(!tips.is_empty());
    
    // Verify that the DAG has processed the transaction
    let dag_metrics = core.get_dag_metrics().await.unwrap();
    assert!(dag_metrics.node_count > 0); // Should have at least genesis + our node
    
    // Test multiple transactions in sequence
    for i in 2..=5 {
        let tx = SimpleTransaction::new(
            "alice".to_string(),
            "charlie".to_string(),
            i * 500,
            i
        );
        
        let node_id = core.submit_simple_transaction(tx, &keypair.private_key).await.unwrap();
        assert!(!node_id.is_empty());
    }
    
    // Wait for processing
    tokio::time::sleep(Duration::from_millis(200)).await;
    
    // Check final state
    let final_tips = core.get_current_tips().await.unwrap();
    let final_metrics = core.get_dag_metrics().await.unwrap();
    let consensus_status = core.get_consensus_status().await;
    
    // Verify the DAG grew
    assert!(final_metrics.node_count >= 5); // Should have multiple nodes
    assert!(final_tips.len() >= 1); // Should have at least one tip
    
    // Verify consensus is healthy
    assert!(consensus_status.health_score > 0.0);
    
    // Test DAG node creation and validation
    let test_tx = SimpleTransaction::new(
        "test_sender".to_string(),
        "test_receiver".to_string(),
        42,
        99
    );
    
    let test_signature = core.sign_transaction(&test_tx, &keypair.private_key).unwrap();
    
    // Create a DAG node manually for testing
    let mut dag_node = DAGNode::new(
        "test_node".to_string(),
        test_tx.timestamp,
        test_tx.clone(),
        Vec::new(), // No parents for test
        String::new(), // Will be calculated
        test_signature,
    );
    
    // Calculate hash
    dag_node.hash = dag_node.calculate_hash();
    
    // Validate the DAG node
    assert!(dag_node.validate());
    assert!(!dag_node.hash.is_empty());
    assert_eq!(dag_node.transaction.from, "test_sender");
    assert_eq!(dag_node.transaction.to, "test_receiver");
    assert_eq!(dag_node.transaction.amount, 42);
    
    // Test JSON serialization for transaction
    let tx_json = test_tx.to_json().unwrap();
    assert!(!tx_json.is_empty());
    
    let deserialized_tx = SimpleTransaction::from_json(&tx_json).unwrap();
    assert_eq!(deserialized_tx.from, test_tx.from);
    assert_eq!(deserialized_tx.to, test_tx.to);
    assert_eq!(deserialized_tx.amount, test_tx.amount);
    assert_eq!(deserialized_tx.nonce, test_tx.nonce);
    
    core.stop().await.unwrap();
}

/// Test DAG integration with consensus layer
#[tokio::test]
async fn test_dag_consensus_integration() {
    // Initialize core
    let config = CoreConfig::default();
    let mut core = KaldrixCore::new(config).await.unwrap();
    
    // Start core
    core.start().await.unwrap();
    
    // Generate key pair
    let keypair = core.generate_key_pair().unwrap();
    
    // Create and submit multiple transactions to build DAG
    let mut node_ids = Vec::new();
    for i in 0..10 {
        let tx = SimpleTransaction::new(
            format!("node_{}", i),
            format!("node_{}", i + 1),
            (i + 1) * 100,
            i
        );
        
        let node_id = core.submit_simple_transaction(tx, &keypair.private_key).await.unwrap();
        node_ids.push(node_id);
    }
    
    // Wait for DAG and consensus processing
    tokio::time::sleep(Duration::from_millis(500)).await;
    
    // Check DAG structure
    let dag_metrics = core.get_dag_metrics().await.unwrap();
    assert!(dag_metrics.node_count >= 10); // Should have our nodes
    
    // Check consensus status
    let consensus_status = core.get_consensus_status().await;
    assert!(consensus_status.health_score > 0.0);
    
    // Verify tips exist and are reasonable
    let tips = core.get_current_tips().await.unwrap();
    assert!(!tips.is_empty());
    
    // Test that consensus processed DAG nodes
    let final_metrics = core.get_metrics().get_all_metrics();
    assert!(final_metrics.dag_nodes_received >= 10); // Should have received our nodes
    
    // Test DAG traversal capabilities
    if !tips.is_empty() {
        // We can't directly test traversal without access to the internal DAG structure,
        // but we can verify the tips are valid strings
        for tip in tips {
            assert!(!tip.is_empty());
            assert!(tip.len() > 0);
        }
    }
    
    core.stop().await.unwrap();
}