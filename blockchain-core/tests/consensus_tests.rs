//! Unit tests for consensus engine

use super::*;
use crate::config::CoreConfig;

#[tokio::test]
async fn test_consensus_engine_creation() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let engine = ConsensusEngine::new(&config.consensus, metrics).await;
    assert!(engine.is_ok());
}

#[tokio::test]
async fn test_validator_management() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let engine = ConsensusEngine::new(&config.consensus, metrics).await.unwrap();
    
    // Add validator
    let validator = Validator {
        id: "test_validator".to_string(),
        public_key: [1u8; 32],
        stake: config.consensus.min_stake,
        status: ValidatorStatus::Active,
        joined_at: chrono::Utc::now(),
        last_active: chrono::Utc::now(),
        performance: ValidatorPerformance::default(),
        region: "US-East".to_string(),
    };
    
    engine.add_validator(validator.clone()).await.unwrap();
    
    // Verify validator was added
    let validators = engine.get_validators().await;
    assert_eq!(validators.len(), 1);
    assert_eq!(validators[0].id, validator.id);
    
    let active_validators = engine.get_active_validators().await;
    assert_eq!(active_validators.len(), 1);
    assert_eq!(active_validators[0].id, validator.id);
    
    // Test validator validation
    let is_valid = engine.validate_validator("test_validator").await.unwrap();
    assert!(is_valid);
    
    // Remove validator
    engine.remove_validator("test_validator").await.unwrap();
    
    // Verify validator was removed
    let validators = engine.get_validators().await;
    assert_eq!(validators.len(), 0);
    
    let active_validators = engine.get_active_validators().await;
    assert_eq!(active_validators.len(), 0);
}

#[tokio::test]
async fn test_default_validator_initialization() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut engine = ConsensusEngine::new(&config.consensus, metrics).await.unwrap();
    
    engine.start().await.unwrap();
    
    // Should initialize default validators
    let validators = engine.get_validators().await;
    assert_eq!(validators.len(), config.consensus.num_validators);
    
    let active_validators = engine.get_active_validators().await;
    assert_eq!(active_validators.len(), config.consensus.num_validators);
    
    // All validators should be valid
    for validator in &validators {
        let is_valid = engine.validate_validator(&validator.id).await.unwrap();
        assert!(is_valid);
    }
}

#[tokio::test]
async fn test_block_submission() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut engine = ConsensusEngine::new(&config.consensus, metrics).await.unwrap();
    
    engine.start().await.unwrap();
    
    // Create block
    let block = Block::default();
    
    // Submit block
    engine.submit_block(block.clone()).await.unwrap();
    
    // Verify block is in pending queue
    let pending_blocks = engine.pending_blocks.read().await;
    assert_eq!(pending_blocks.len(), 1);
    assert_eq!(pending_blocks[0].id, block.id);
}

#[tokio::test]
async fn test_consensus_round_management() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut engine = ConsensusEngine::new(&config.consensus, metrics).await.unwrap();
    
    engine.start().await.unwrap();
    
    let block = Block::default();
    
    // Start new round
    engine.start_new_round(&block).await.unwrap();
    
    let round = engine.current_round.read().await;
    assert_eq!(round.round_number, 1);
    assert!(round.current_block.is_some());
    assert_eq!(round.current_block.as_ref().unwrap().id, block.id);
    assert_eq!(*engine.state.read().await, ConsensusState::Proposing);
}

#[tokio::test]
async fn test_proposer_selection() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut engine = ConsensusEngine::new(&config.consensus, metrics).await.unwrap();
    
    engine.start().await.unwrap();
    
    let block = Block::default();
    engine.start_new_round(&block).await.unwrap();
    
    // Select proposer
    let proposer = engine.select_proposer().await.unwrap();
    
    // Verify proposer is one of the active validators
    let active_validators = engine.active_validators.read().await;
    assert!(active_validators.contains(&proposer));
    
    // Verify proposer was set in current round
    let round = engine.current_round.read().await;
    assert_eq!(round.proposer, Some(proposer));
}

#[tokio::test]
async fn test_vote_collection() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut engine = ConsensusEngine::new(&config.consensus, metrics).await.unwrap();
    
    engine.start().await.unwrap();
    
    let block = Block::default();
    engine.start_new_round(&block).await.unwrap();
    engine.select_proposer().await.unwrap();
    
    // Collect votes
    let votes = engine.collect_votes(&block.id).await.unwrap();
    
    // Should have votes from all active validators except proposer
    let active_validators = engine.active_validators.read().await;
    let expected_votes = active_validators.len() - 1; // Exclude proposer
    assert_eq!(votes.len(), expected_votes);
    
    // Verify all votes are for the correct block
    for vote in &votes {
        assert_eq!(vote.block_hash, block.id);
        assert!(active_validators.contains(&vote.validator_id));
    }
}

#[tokio::test]
async fn test_quorum_calculation() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let engine = ConsensusEngine::new(&config.consensus, metrics).await.unwrap();
    
    // Test with default config (7 validators, 2/3 threshold)
    let votes = vec![
        Vote::default(), Vote::default(), Vote::default(), Vote::default()
    ];
    assert!(engine.has_quorum(&votes)); // 4/7 > 2/3
    
    let votes = vec![
        Vote::default(), Vote::default(), Vote::default()
    ];
    assert!(!engine.has_quorum(&votes)); // 3/7 < 2/3
    
    // Test with edge case
    let votes = vec![
        Vote::default(), Vote::default(), Vote::default(), Vote::default(), Vote::default()
    ];
    assert!(engine.has_quorum(&votes)); // 5/7 > 2/3
}

#[tokio::test]
async fn test_block_commitment() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut engine = ConsensusEngine::new(&config.consensus, metrics).await.unwrap();
    
    engine.start().await.unwrap();
    
    let block = Block::default();
    
    // Commit block
    engine.commit_block(&block).await.unwrap();
    
    // Verify block is in committed blocks
    let committed_blocks = engine.committed_blocks.read().await;
    assert!(committed_blocks.contains(&block.id));
    
    // Verify last block time was updated
    let last_block_time = engine.last_block_time.read().await;
    assert!(*last_block_time > 0);
}

#[tokio::test]
async fn test_consensus_status() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut engine = ConsensusEngine::new(&config.consensus, metrics).await.unwrap();
    
    engine.start().await.unwrap();
    
    let status = engine.get_status();
    
    assert_eq!(status.current_round, 0);
    assert_eq!(status.current_view, 0);
    assert!(matches!(status.state, ConsensusState::Idle));
    assert!(status.health_score > 0.0);
    assert!(status.health_score <= 100.0);
    assert_eq!(status.active_validators, config.consensus.num_validators);
    assert_eq!(status.total_rounds, 0);
    assert_eq!(status.failed_rounds, 0);
}

#[tokio::test]
async fn test_view_change() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut engine = ConsensusEngine::new(&config.consensus, metrics).await.unwrap();
    
    engine.start().await.unwrap();
    
    let initial_view = engine.current_round.read().await.view_number;
    
    // Start view change
    engine.start_view_change().await.unwrap();
    
    let round = engine.current_round.read().await;
    assert_eq!(round.view_number, initial_view + 1);
    assert_eq!(*engine.state.read().await, ConsensusState::ViewChange);
    
    // Verify view change timer was set
    let timer = engine.view_change_timer.read().await;
    assert!(timer.is_some());
}

#[tokio::test]
async fn test_validator_slashing() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut engine = ConsensusEngine::new(&config.consensus, metrics).await.unwrap();
    
    engine.start().await.unwrap();
    
    let validator_id = "test_validator".to_string();
    let initial_stake = config.consensus.min_stake * 2;
    
    let validator = Validator {
        id: validator_id.clone(),
        public_key: [1u8; 32],
        stake: initial_stake,
        status: ValidatorStatus::Active,
        joined_at: chrono::Utc::now(),
        last_active: chrono::Utc::now(),
        performance: ValidatorPerformance::default(),
        region: "US-East".to_string(),
    };
    
    engine.add_validator(validator).await.unwrap();
    
    // Slash validator
    engine.slash_validator(&validator_id, "test misbehavior").await.unwrap();
    
    // Verify validator was slashed
    let validators = engine.get_validators().await;
    let slashed_validator = validators.iter().find(|v| v.id == validator_id).unwrap();
    
    assert_eq!(slashed_validator.status, ValidatorStatus::Slashed);
    assert!(slashed_validator.stake < initial_stake);
    
    // Verify validator is no longer active
    let active_validators = engine.get_active_validators().await;
    assert!(!active_validators.iter().any(|v| v.id == validator_id));
}

#[tokio::test]
async fn test_consensus_metrics() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut engine = ConsensusEngine::new(&config.consensus, metrics).await.unwrap();
    
    engine.start().await.unwrap();
    
    // Perform some consensus operations
    let block = Block::default();
    engine.submit_block(block).await.unwrap();
    
    // Give some time for processing
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    let consensus_metrics = engine.get_consensus_metrics().await;
    
    assert!(consensus_metrics.total_rounds >= 0);
    assert!(consensus_metrics.successful_rounds >= 0);
    assert!(consensus_metrics.failed_rounds >= 0);
    assert!(consensus_metrics.participation_rate >= 0.0);
    assert!(consensus_metrics.participation_rate <= 1.0);
    assert!(consensus_metrics.commitment_rate >= 0.0);
    assert!(consensus_metrics.commitment_rate <= 1.0);
}

#[tokio::test]
async fn test_consensus_reset() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut engine = ConsensusEngine::new(&config.consensus, metrics).await.unwrap();
    
    engine.start().await.unwrap();
    
    // Perform some operations to change state
    let block = Block::default();
    engine.submit_block(block).await.unwrap();
    
    // Reset consensus
    engine.reset().await.unwrap();
    
    // Verify state was reset
    assert_eq!(*engine.state.read().await, ConsensusState::Idle);
    
    let round = engine.current_round.read().await;
    assert_eq!(round.round_number, 0);
    assert_eq!(round.view_number, 0);
    assert!(round.current_block.is_none());
    assert!(round.proposer.is_none());
    assert!(round.votes.is_empty());
    assert!(round.commits.is_empty());
    
    let committed_blocks = engine.committed_blocks.read().await;
    assert!(committed_blocks.is_empty());
    
    let pending_blocks = engine.pending_blocks.read().await;
    assert!(pending_blocks.is_empty());
}

#[tokio::test]
async fn test_consensus_engine_lifecycle() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut engine = ConsensusEngine::new(&config.consensus, metrics).await.unwrap();
    
    // Test start/stop cycle
    let status = engine.get_status();
    assert_eq!(status.active_validators, config.consensus.num_validators); // Should initialize validators
    
    engine.start().await.unwrap();
    
    // Should not fail if started again
    let result = engine.start().await;
    assert!(result.is_ok());
    
    engine.stop().await.unwrap();
    
    // Should not fail if stopped again
    let result = engine.stop().await;
    assert!(result.is_ok());
}

#[tokio::test]
async fn test_failed_consensus_handling() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut engine = ConsensusEngine::new(&config.consensus, metrics).await.unwrap();
    
    engine.start().await.unwrap();
    
    // Simulate failed consensus by submitting block but not having enough validators
    // Remove all validators except one
    let validators = engine.get_validators().await;
    for validator in validators.iter().skip(1) {
        engine.remove_validator(&validator.id).await.unwrap();
    }
    
    let block = Block::default();
    engine.submit_block(block).await.unwrap();
    
    // Give time for processing
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // Should have triggered view change due to failed consensus
    let status = engine.get_status();
    assert!(matches!(status.state, ConsensusState::ViewChange | ConsensusState::Idle));
    
    // Should have some failed rounds in metrics
    let consensus_metrics = engine.get_consensus_metrics().await;
    assert!(consensus_metrics.failed_rounds > 0);
}

#[tokio::test]
async fn test_validator_validation_criteria() {
    let config = CoreConfig::default();
    let metrics = Arc::new(CoreMetrics::new());
    let mut engine = ConsensusEngine::new(&config.consensus, metrics).await.unwrap();
    
    engine.start().await.unwrap();
    
    // Test validator with insufficient stake
    let mut poor_validator = Validator::default();
    poor_validator.id = "poor_validator".to_string();
    poor_validator.stake = config.consensus.min_stake - 1;
    poor_validator.status = ValidatorStatus::Active;
    
    engine.add_validator(poor_validator.clone()).await.unwrap();
    
    let is_valid = engine.validate_validator("poor_validator").await.unwrap();
    assert!(!is_valid); // Should fail due to insufficient stake
    
    // Test inactive validator
    let mut inactive_validator = Validator::default();
    inactive_validator.id = "inactive_validator".to_string();
    inactive_validator.stake = config.consensus.min_stake;
    inactive_validator.status = ValidatorStatus::Inactive;
    
    engine.add_validator(inactive_validator.clone()).await.unwrap();
    
    let is_valid = engine.validate_validator("inactive_validator").await.unwrap();
    assert!(!is_valid); // Should fail due to inactive status
    
    // Test validator with poor performance
    let mut poor_performance_validator = Validator::default();
    poor_performance_validator.id = "poor_performance_validator".to_string();
    poor_performance_validator.stake = config.consensus.min_stake;
    poor_performance_validator.status = ValidatorStatus::Active;
    poor_performance_validator.performance.uptime = 90.0; // Below 95%
    
    engine.add_validator(poor_performance_validator.clone()).await.unwrap();
    
    let is_valid = engine.validate_validator("poor_performance_validator").await.unwrap();
    assert!(!is_valid); // Should fail due to poor uptime
}