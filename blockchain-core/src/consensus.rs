//! Consensus engine for KALDRIX blockchain

use std::collections::{HashMap, HashSet, VecDeque};
use std::sync::Arc;
use tokio::sync::{RwLock, mpsc};
use tokio::time::{sleep, Duration, Instant};
use serde::{Serialize, Deserialize};
use tracing::{info, error, warn, debug};
use crate::types::{Block, Transaction, BlockHash, Validator, ValidatorStatus, ConsensusMessage};
use crate::error::{CoreError, CoreResult};
use crate::config::ConsensusConfig;
use crate::metrics::CoreMetrics;
use crate::utils::{current_timestamp_ms, hash_data};

/// Consensus engine state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConsensusState {
    /// Idle state
    Idle,
    /// Proposing block
    Proposing,
    /// Voting on block
    Voting,
    /// Committing block
    Committing,
    /// View change in progress
    ViewChange,
    /// Synchronizing
    Synchronizing,
}

/// Consensus round information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsensusRound {
    /// Round number
    pub round_number: u64,
    /// View number
    pub view_number: u64,
    /// Current block being processed
    pub current_block: Option<Block>,
    /// Proposer for this round
    pub proposer: Option<String>,
    /// Votes received
    pub votes: HashMap<String, Vote>,
    /// Commit messages received
    pub commits: HashMap<String, Commit>,
    /// Round start time
    pub start_time: u64,
    /// Round timeout
    pub timeout: u64,
}

/// Vote message for consensus
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Vote {
    /// Validator ID
    pub validator_id: String,
    /// Block hash being voted on
    pub block_hash: BlockHash,
    /// Vote signature
    pub signature: Vec<u8>,
    /// Vote timestamp
    pub timestamp: u64,
    /// Vote type
    pub vote_type: VoteType,
}

/// Types of votes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VoteType {
    /// Pre-vote (for PBFT)
    PreVote,
    /// Pre-commit (for PBFT)
    PreCommit,
    /// Final commit
    Commit,
}

/// Commit message for consensus
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Commit {
    /// Validator ID
    pub validator_id: String,
    /// Block hash being committed
    pub block_hash: BlockHash,
    /// Commit signature
    pub signature: Vec<u8>,
    /// Commit timestamp
    pub timestamp: u64,
}

/// View change message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ViewChange {
    /// Validator ID
    pub validator_id: String,
    /// New view number
    pub new_view: u64,
    /// Reason for view change
    pub reason: String,
    /// Signature
    pub signature: Vec<u8>,
    /// Timestamp
    pub timestamp: u64,
}

/// Consensus status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsensusStatus {
    /// Current state
    pub state: ConsensusState,
    /// Current round
    pub current_round: u64,
    /// Current view
    pub current_view: u64,
    /// Last committed block
    pub last_committed_block: Option<BlockHash>,
    /// Current proposer
    pub current_proposer: Option<String>,
    /// Number of active validators
    pub active_validators: usize,
    /// Consensus health score (0-100)
    pub health_score: f64,
    /// Total rounds completed
    pub total_rounds: u64,
    /// Failed rounds
    pub failed_rounds: u64,
    /// Last update timestamp
    pub last_updated: u64,
}

/// Consensus engine for KALDRIX blockchain
pub struct ConsensusEngine {
    /// Configuration
    config: ConsensusConfig,
    /// Metrics collector
    metrics: Arc<CoreMetrics>,
    /// Current consensus state
    state: RwLock<ConsensusState>,
    /// Current consensus round
    current_round: RwLock<ConsensusRound>,
    /// Validators
    validators: RwLock<HashMap<String, Validator>>,
    /// Active validator set
    active_validators: RwLock<HashSet<String>>,
    /// Committed blocks
    committed_blocks: RwLock<Vec<BlockHash>>,
    /// Pending blocks (waiting for consensus)
    pending_blocks: RwLock<VecDeque<Block>>,
    /// Message channel for consensus messages
    message_channel: Option<mpsc::UnboundedSender<ConsensusMessage>>,
    /// Consensus metrics
    consensus_metrics: RwLock<ConsensusMetrics>,
    /// Running state
    is_running: bool,
    /// Last block time
    last_block_time: RwLock<u64>,
    /// View change timer
    view_change_timer: RwLock<Option<Instant>>,
}

/// Consensus metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsensusMetrics {
    /// Total consensus rounds
    pub total_rounds: u64,
    /// Successful rounds
    pub successful_rounds: u64,
    /// Failed rounds
    pub failed_rounds: u64,
    /// Average consensus time
    pub avg_consensus_time_ms: u64,
    /// View changes
    pub view_changes: u64,
    /// Validator participation rate
    pub participation_rate: f64,
    /// Average proposal time
    pub avg_proposal_time_ms: u64,
    /// Average voting time
    pub avg_voting_time_ms: u64,
    /// Average commit time
    pub avg_commit_time_ms: u64,
    /// Block commitment rate
    pub commitment_rate: f64,
    /// Fork resolution rate
    pub fork_resolution_rate: f64,
}

impl ConsensusEngine {
    /// Create a new consensus engine
    pub async fn new(config: &ConsensusConfig, metrics: Arc<CoreMetrics>) -> CoreResult<Self> {
        info!("Initializing consensus engine");
        
        let engine = Self {
            config: config.clone(),
            metrics,
            state: RwLock::new(ConsensusState::Idle),
            current_round: RwLock::new(ConsensusRound {
                round_number: 0,
                view_number: 0,
                current_block: None,
                proposer: None,
                votes: HashMap::new(),
                commits: HashMap::new(),
                start_time: current_timestamp_ms(),
                timeout: config.proposal_timeout_ms,
            }),
            validators: RwLock::new(HashMap::new()),
            active_validators: RwLock::new(HashSet::new()),
            committed_blocks: RwLock::new(Vec::new()),
            pending_blocks: RwLock::new(VecDeque::new()),
            message_channel: None,
            consensus_metrics: RwLock::new(ConsensusMetrics {
                total_rounds: 0,
                successful_rounds: 0,
                failed_rounds: 0,
                avg_consensus_time_ms: 0,
                view_changes: 0,
                participation_rate: 0.0,
                avg_proposal_time_ms: 0,
                avg_voting_time_ms: 0,
                avg_commit_time_ms: 0,
                commitment_rate: 0.0,
                fork_resolution_rate: 0.0,
            }),
            is_running: false,
            last_block_time: RwLock::new(current_timestamp_ms()),
            view_change_timer: RwLock::new(None),
        };
        
        info!("Consensus engine initialized");
        Ok(engine)
    }
    
    /// Start the consensus engine
    pub async fn start(&mut self) -> CoreResult<()> {
        if self.is_running {
            return Ok(());
        }
        
        info!("Starting consensus engine");
        
        // Initialize default validators if none exist
        {
            let validators = self.validators.read().await;
            if validators.is_empty() {
                drop(validators);
                self.initialize_default_validators().await?;
            }
        }
        
        // Start consensus loop
        self.is_running = true;
        tokio::spawn(self.consensus_loop());
        
        info!("Consensus engine started");
        Ok(())
    }
    
    /// Stop the consensus engine
    pub async fn stop(&mut self) -> CoreResult<()> {
        if !self.is_running {
            return Ok(());
        }
        
        info!("Stopping consensus engine");
        self.is_running = false;
        info!("Consensus engine stopped");
        
        Ok(())
    }
    
    /// Add a validator
    pub async fn add_validator(&self, validator: Validator) -> CoreResult<()> {
        let mut validators = self.validators.write().await;
        validators.insert(validator.id.clone(), validator.clone());
        
        if validator.status == ValidatorStatus::Active {
            let mut active_validators = self.active_validators.write().await;
            active_validators.insert(validator.id.clone());
        }
        
        info!("Validator added: {}", validator.id);
        Ok(())
    }
    
    /// Remove a validator
    pub async fn remove_validator(&self, validator_id: &str) -> CoreResult<()> {
        let mut validators = self.validators.write().await;
        validators.remove(validator_id);
        
        let mut active_validators = self.active_validators.write().await;
        active_validators.remove(validator_id);
        
        info!("Validator removed: {}", validator_id);
        Ok(())
    }
    
    /// Submit a block for consensus
    pub async fn submit_block(&self, block: Block) -> CoreResult<()> {
        if !self.is_running {
            return Err(CoreError::Consensus("Consensus engine is not running".to_string()));
        }
        
        debug!("Block submitted for consensus: {}", hex::encode(&block.id));
        
        let mut pending_blocks = self.pending_blocks.write().await;
        pending_blocks.push_back(block);
        
        // Limit pending blocks size
        if pending_blocks.len() > 100 {
            pending_blocks.pop_front();
        }
        
        Ok(())
    }
    
    /// Get consensus status
    pub fn get_status(&self) -> ConsensusStatus {
        let state = self.state.blocking_read();
        let round = self.current_round.blocking_read();
        let active_validators = self.active_validators.blocking_read();
        let committed_blocks = self.committed_blocks.blocking_read();
        let metrics = self.consensus_metrics.blocking_read();
        
        let last_committed = committed_blocks.last().cloned();
        let health_score = self.calculate_health_score(&metrics);
        
        ConsensusStatus {
            state: state.clone(),
            current_round: round.round_number,
            current_view: round.view_number,
            last_committed_block: last_committed,
            current_proposer: round.proposer.clone(),
            active_validators: active_validators.len(),
            health_score,
            total_rounds: metrics.total_rounds,
            failed_rounds: metrics.failed_rounds,
            last_updated: current_timestamp_ms(),
        }
    }
    
    /// Get validators
    pub async fn get_validators(&self) -> Vec<Validator> {
        let validators = self.validators.read().await;
        validators.values().cloned().collect()
    }
    
    /// Get active validators
    pub async fn get_active_validators(&self) -> Vec<Validator> {
        let validators = self.validators.read().await;
        let active_validators = self.active_validators.read().await;
        
        validators
            .values()
            .filter(|v| active_validators.contains(&v.id))
            .cloned()
            .collect()
    }
    
    /// Initialize default validators
    async fn initialize_default_validators(&self) -> CoreResult<()> {
        info!("Initializing default validators");
        
        for i in 0..self.config.num_validators {
            let validator = Validator {
                id: format!("validator_{}", i),
                public_key: [0u8; 32], // Placeholder
                stake: self.config.min_stake + (i as u128 * 1000000000000000000u128),
                status: ValidatorStatus::Active,
                joined_at: chrono::Utc::now(),
                last_active: chrono::Utc::now(),
                performance: crate::types::ValidatorPerformance::default(),
                region: if i % 3 == 0 { "US-East".to_string() }
                         else if i % 3 == 1 { "EU-West".to_string() }
                         else { "Asia-Pacific".to_string() },
            };
            
            self.add_validator(validator).await?;
        }
        
        info!("Initialized {} default validators", self.config.num_validators);
        Ok(())
    }
    
    /// Main consensus loop
    async fn consensus_loop(&self) {
        let mut block_timer = Interval::new(Duration::from_millis(self.config.block_time_target_ms));
        
        while self.is_running {
            tokio::select! {
                _ = block_timer.tick() => {
                    if let Err(e) = self.process_consensus_round().await {
                        error!("Consensus round error: {}", e);
                    }
                }
            }
        }
    }
    
    /// Process a consensus round
    async fn process_consensus_round(&self) -> CoreResult<()> {
        let start_time = Instant::now();
        
        // Get next block from pending queue
        let block = {
            let mut pending_blocks = self.pending_blocks.write().await;
            pending_blocks.pop_front()
        };
        
        if block.is_none() {
            return Ok(());
        }
        
        let block = block.unwrap();
        
        // Start new consensus round
        self.start_new_round(&block).await?;
        
        // Select proposer
        let proposer = self.select_proposer().await?;
        
        // Propose block
        self.propose_block(&block, &proposer).await?;
        
        // Collect votes
        let votes = self.collect_votes(&block.id).await?;
        
        // Check if we have enough votes
        if self.has_quorum(&votes) {
            // Commit block
            self.commit_block(&block).await?;
            
            // Update metrics
            {
                let mut metrics = self.consensus_metrics.write().await;
                metrics.total_rounds += 1;
                metrics.successful_rounds += 1;
                metrics.avg_consensus_time_ms = (metrics.avg_consensus_time_ms * 9 + start_time.elapsed().as_millis() as u64) / 10;
                metrics.commitment_rate = (metrics.successful_rounds as f64) / (metrics.total_rounds as f64);
            }
            
            self.metrics.inc_successful_consensus_rounds();
            self.metrics.update_avg_consensus_time(start_time.elapsed());
            
            info!("Block committed: {}, round: {}", hex::encode(&block.id), self.current_round.read().await.round_number);
        } else {
            // Handle failed consensus
            self.handle_failed_consensus().await?;
            
            // Update metrics
            {
                let mut metrics = self.consensus_metrics.write().await;
                metrics.total_rounds += 1;
                metrics.failed_rounds += 1;
            }
            
            self.metrics.inc_failed_consensus_rounds();
            
            warn!("Consensus failed for block: {}", hex::encode(&block.id));
        }
        
        Ok(())
    }
    
    /// Start a new consensus round
    async fn start_new_round(&self, block: &Block) -> CoreResult<()> {
        let mut round = self.current_round.write().await;
        let prev_round = round.round_number;
        
        *round = ConsensusRound {
            round_number: prev_round + 1,
            view_number: round.view_number,
            current_block: Some(block.clone()),
            proposer: None,
            votes: HashMap::new(),
            commits: HashMap::new(),
            start_time: current_timestamp_ms(),
            timeout: self.config.proposal_timeout_ms,
        };
        
        *self.state.write().await = ConsensusState::Proposing;
        
        debug!("Started new consensus round: {}", round.round_number);
        Ok(())
    }
    
    /// Select proposer for current round
    async fn select_proposer(&self) -> CoreResult<String> {
        let active_validators = self.active_validators.read().await;
        let validators = self.validators.read().await;
        
        if active_validators.is_empty() {
            return Err(CoreError::Consensus("No active validators available".to_string()));
        }
        
        // Select proposer using round-robin with stake weighting
        let round = self.current_round.read().await;
        let validator_ids: Vec<String> = active_validators.iter().cloned().collect();
        
        // Simple round-robin selection
        let proposer_index = (round.round_number as usize) % validator_ids.len();
        let proposer_id = validator_ids[proposer_index].clone();
        
        // Update round with proposer
        drop(round);
        let mut round = self.current_round.write().await;
        round.proposer = Some(proposer_id.clone());
        
        debug!("Selected proposer: {} for round: {}", proposer_id, round.round_number);
        Ok(proposer_id)
    }
    
    /// Propose a block
    async fn propose_block(&self, block: &Block, proposer: &str) -> CoreResult<()> {
        let start_time = Instant::now();
        
        // Create proposal message
        let proposal = ConsensusMessage::Propose(block.clone());
        
        // Broadcast proposal (in real implementation, this would go through network)
        debug!("Block proposed by {}: {}", proposer, hex::encode(&block.id));
        
        // Update state
        *self.state.write().await = ConsensusState::Voting;
        
        // Update metrics
        {
            let mut metrics = self.consensus_metrics.write().await;
            metrics.avg_proposal_time_ms = (metrics.avg_proposal_time_ms * 9 + start_time.elapsed().as_millis() as u64) / 10;
        }
        
        self.metrics.update_avg_proposal_time(start_time.elapsed());
        
        Ok(())
    }
    
    /// Collect votes for a block
    async fn collect_votes(&self, block_hash: &BlockHash) -> CoreResult<Vec<Vote>> -> CoreResult<()> {
        let start_time = Instant::now();
        
        let active_validators = self.active_validators.read().await;
        let mut votes = Vec::new();
        
        // Simulate voting from active validators
        for validator_id in active_validators.iter() {
            // Skip proposer (they don't vote on their own proposal)
            let round = self.current_round.read().await;
            if let Some(ref proposer) = round.proposer {
                if validator_id == proposer {
                    continue;
                }
            }
            drop(round);
            
            // Create vote
            let vote = Vote {
                validator_id: validator_id.clone(),
                block_hash: *block_hash,
                signature: vec![0u8; 64], // Placeholder signature
                timestamp: current_timestamp_ms(),
                vote_type: VoteType::PreCommit,
            };
            
            votes.push(vote.clone());
            
            // Add vote to current round
            let mut round = self.current_round.write().await;
            round.votes.insert(validator_id.clone(), vote);
        }
        
        // Update metrics
        {
            let mut metrics = self.consensus_metrics.write().await;
            metrics.avg_voting_time_ms = (metrics.avg_voting_time_ms * 9 + start_time.elapsed().as_millis() as u64) / 10;
            
            // Update participation rate
            let total_validators = active_validators.len();
            if total_validators > 0 {
                metrics.participation_rate = (votes.len() as f64) / (total_validators as f64);
            }
        }
        
        self.metrics.update_avg_voting_time(start_time.elapsed());
        self.metrics.update_participation_rate(
            if active_validators.is_empty() { 0.0 } else { votes.len() as f64 / active_validators.len() as f64 }
        );
        
        debug!("Collected {} votes for block: {}", votes.len(), hex::encode(block_hash));
        Ok(votes)
    }
    
    /// Check if we have quorum
    fn has_quorum(&self, votes: &[Vote]) -> bool {
        let active_validators = self.active_validators.blocking_read();
        let total_validators = active_validators.len();
        
        if total_validators == 0 {
            return false;
        }
        
        let required_votes = (total_validators as f64 * self.config.bft_threshold).ceil() as usize;
        votes.len() >= required_votes
    }
    
    /// Commit a block
    async fn commit_block(&self, block: &Block) -> CoreResult<()> {
        let start_time = Instant::now();
        
        // Add to committed blocks
        let mut committed_blocks = self.committed_blocks.write().await;
        committed_blocks.push(block.id);
        
        // Update last block time
        *self.last_block_time.write().await = current_timestamp_ms();
        
        // Create commit messages from validators
        let active_validators = self.active_validators.read().await;
        let mut commits = Vec::new();
        
        for validator_id in active_validators.iter() {
            let commit = Commit {
                validator_id: validator_id.clone(),
                block_hash: block.id,
                signature: vec![0u8; 64], // Placeholder signature
                timestamp: current_timestamp_ms(),
            };
            
            commits.push(commit.clone());
            
            // Add commit to current round
            let mut round = self.current_round.write().await;
            round.commits.insert(validator_id.clone(), commit);
        }
        
        // Update state
        *self.state.write().await = ConsensusState::Idle;
        
        // Update metrics
        {
            let mut metrics = self.consensus_metrics.write().await;
            metrics.avg_commit_time_ms = (metrics.avg_commit_time_ms * 9 + start_time.elapsed().as_millis() as u64) / 10;
        }
        
        self.metrics.update_avg_voting_time(start_time.elapsed());
        
        info!("Block committed: {}, height: {}", hex::encode(&block.id), block.height);
        Ok(())
    }
    
    /// Handle failed consensus
    async fn handle_failed_consensus(&self) -> CoreResult<()> {
        warn!("Consensus round failed, initiating view change");
        
        // Start view change
        self.start_view_change().await?;
        
        Ok(())
    }
    
    /// Start view change
    async fn start_view_change(&self) -> CoreResult<()> {
        let mut round = self.current_round.write().await;
        round.view_number += 1;
        round.timeout = self.config.view_change_timeout_ms;
        
        *self.state.write().await = ConsensusState::ViewChange;
        
        // Set view change timer
        *self.view_change_timer.write().await = Some(Instant::now());
        
        // Update metrics
        {
            let mut metrics = self.consensus_metrics.write().await;
            metrics.view_changes += 1;
        }
        
        self.metrics.inc_view_changes();
        
        info!("View change initiated, new view: {}", round.view_number);
        Ok(())
    }
    
    /// Calculate health score
    fn calculate_health_score(&self, metrics: &ConsensusMetrics) -> f64 {
        let mut score = 100.0;
        
        // Deduct for failed rounds
        if metrics.total_rounds > 0 {
            let failure_rate = metrics.failed_rounds as f64 / metrics.total_rounds as f64;
            score -= failure_rate * 50.0;
        }
        
        // Deduct for low participation
        score -= (1.0 - metrics.participation_rate) * 30.0;
        
        // Deduct for view changes
        score -= (metrics.view_changes as f64 * 5.0).min(20.0);
        
        // Ensure score is within bounds
        score.max(0.0).min(100.0)
    }
    
    /// Validate validator
    pub async fn validate_validator(&self, validator_id: &str) -> CoreResult<bool> {
        let validators = self.validators.read().await;
        
        match validators.get(validator_id) {
            Some(validator) => {
                // Check if validator meets minimum stake
                if validator.stake < self.config.min_stake {
                    return Ok(false);
                }
                
                // Check if validator is active
                if validator.status != ValidatorStatus::Active {
                    return Ok(false);
                }
                
                // Check performance metrics
                if validator.performance.uptime < 95.0 {
                    return Ok(false);
                }
                
                if validator.performance.success_rate < 90.0 {
                    return Ok(false);
                }
                
                Ok(true)
            },
            None => Ok(false),
        }
    }
    
    /// Slash validator for misbehavior
    pub async fn slash_validator(&self, validator_id: &str, reason: &str) -> CoreResult<()> {
        let mut validators = self.validators.write().await;
        
        if let Some(mut validator) = validators.get_mut(validator_id) {
            // Apply slashing penalty
            let slash_amount = (validator.stake as f64 * self.config.slashing_penalty) as u128;
            validator.stake = validator.stake.saturating_sub(slash_amount);
            
            // Mark as slashed
            validator.status = ValidatorStatus::Slashed;
            
            // Remove from active validators
            let mut active_validators = self.active_validators.write().await;
            active_validators.remove(validator_id);
            
            warn!("Validator {} slashed for: {}, amount: {}", validator_id, reason, slash_amount);
        }
        
        Ok(())
    }
    
    /// Get consensus metrics
    pub async fn get_consensus_metrics(&self) -> ConsensusMetrics {
        self.consensus_metrics.read().await.clone()
    }
    
    /// Reset consensus state
    pub async fn reset(&self) -> CoreResult<()> {
        *self.state.write().await = ConsensusState::Idle;
        
        let mut round = self.current_round.write().await;
        *round = ConsensusRound {
            round_number: 0,
            view_number: 0,
            current_block: None,
            proposer: None,
            votes: HashMap::new(),
            commits: HashMap::new(),
            start_time: current_timestamp_ms(),
            timeout: self.config.proposal_timeout_ms,
        };
        
        *self.committed_blocks.write().await = Vec::new();
        *self.pending_blocks.write().await = VecDeque::new();
        
        info!("Consensus state reset");
        Ok(())
    }
    
    // ===== DAG-AWARE PBFT METHODS =====
    
    /// Propose block based on DAG tips
    pub async fn propose_dag_block(&self, dag_tips: Vec<BlockHash>, data: String) -> CoreResult<Block> {
        if !self.is_running {
            return Err(CoreError::Consensus("Consensus engine is not running".to_string()));
        }
        
        debug!("Proposing DAG-aware block with {} tips", dag_tips.len());
        
        // Get current proposer
        let proposer = self.select_proposer().await?;
        
        // Create block with DAG parent IDs
        let block = Block {
            id: [0u8; 32], // Will be calculated
            height: self.calculate_dag_height(&dag_tips).await?,
            parents: dag_tips.clone(),
            dag_parent_ids: dag_tips,
            transactions: Vec::new(), // Will be filled with transactions
            creator: self.get_proposer_public_key(&proposer).await?,
            timestamp: current_timestamp_ms(),
            signature: Vec::new(),
            version: 1,
            merkle_root: [0u8; 32],
            state_root: [0u8; 32],
            metadata: {
                let mut meta = HashMap::new();
                meta.insert("dag_aware".to_string(), "true".to_string());
                meta.insert("proposer".to_string(), proposer);
                meta
            },
        };
        
        // Calculate final block hash
        let block_hash = block.hash();
        let block = Block { id: block_hash, ..block };
        
        info!("DAG-aware block proposed: {}", hex::encode(&block.id));
        Ok(block)
    }
    
    /// Validate block with DAG-aware checks
    pub async fn validate_dag_block(&self, block: &Block) -> CoreResult<bool> {
        // Basic block validation
        if !block.validate() {
            return Ok(false);
        }
        
        // Validate DAG parent IDs
        if block.dag_parent_ids.is_empty() {
            return Ok(false);
        }
        
        // Check tip convergence for all DAG parent pairs
        for i in 0..block.dag_parent_ids.len() {
            for j in (i + 1)..block.dag_parent_ids.len() {
                // This would require access to DAG engine - for now, assume convergence
                // In real implementation, this would call: dag_engine.validate_tip_convergence(&tip1, &tip2)
                debug!("Validating tip convergence between parents {} and {}", i, j);
            }
        }
        
        // Check for double-spending by analyzing transaction ancestry
        for tx in &block.transactions {
            if self.detect_double_spend(tx, &block.parents).await? {
                warn!("Double-spend detected in block: {}", hex::encode(&block.id));
                return Ok(false);
            }
        }
        
        debug!("DAG-aware block validation passed: {}", hex::encode(&block.id));
        Ok(true)
    }
    
    /// Commit DAG-aware block with checkpoint marking
    pub async fn commit_dag_block(&self, block: Block) -> CoreResult<()> {
        info!("Committing DAG-aware block: {}", hex::encode(&block.id));
        
        // Validate block before committing
        if !self.validate_dag_block(&block).await? {
            return Err(CoreError::Consensus("DAG block validation failed".to_string()));
        }
        
        // Add to committed blocks
        {
            let mut committed_blocks = self.committed_blocks.write().await;
            committed_blocks.push(block.id);
        }
        
        // Mark checkpoint in DAG (this would be called on DAG engine)
        // In real implementation: dag_engine.mark_checkpoint(&block.id).await
        self.mark_dag_checkpoint(&block.id).await?;
        
        // Update metrics
        {
            let mut metrics = self.consensus_metrics.write().await;
            metrics.total_rounds += 1;
            metrics.successful_rounds += 1;
            metrics.commitment_rate = (metrics.successful_rounds as f64) / (metrics.total_rounds as f64);
        }
        
        self.metrics.inc_successful_consensus_rounds();
        
        // Update last block time
        *self.last_block_time.write().await = current_timestamp_ms();
        
        info!("DAG-aware block committed: {}", hex::encode(&block.id));
        Ok(())
    }
    
    /// Handle DAG node reception
    pub async fn on_dag_node_received(&self, node_id: &BlockHash) -> CoreResult<()> {
        debug!("Received DAG node: {}", hex::encode(node_id));
        
        // Convert DAG node to block format
        let block = self.convert_dag_node_to_block(node_id).await?;
        
        // Submit block for consensus
        self.submit_block(block).await?;
        
        Ok(())
    }
    
    /// Convert DAG node to block format
    async fn convert_dag_node_to_block(&self, node_id: &BlockHash) -> CoreResult<Block> {
        // This would normally interact with the DAG engine
        // For now, create a placeholder block
        debug!("Converting DAG node to block: {}", hex::encode(node_id));
        
        Ok(Block {
            id: *node_id,
            height: 0, // Would be calculated from DAG
            parents: Vec::new(), // Would be populated from DAG
            dag_parent_ids: Vec::new(), // Would be populated from DAG
            transactions: Vec::new(),
            creator: [0u8; 32], // Would be from DAG node
            timestamp: current_timestamp_ms(),
            signature: Vec::new(),
            version: 1,
            merkle_root: [0u8; 32],
            state_root: [0u8; 32],
            metadata: HashMap::new(),
        })
    }
    
    /// Calculate block height based on DAG parents
    async fn calculate_dag_height(&self, parent_ids: &[BlockHash]) -> CoreResult<u64> {
        if parent_ids.is_empty() {
            return Ok(0); // Genesis height
        }
        
        // In real implementation, this would query DAG for parent heights
        // For now, return a simple increment
        Ok(parent_ids.len() as u64)
    }
    
    /// Get proposer's public key
    async fn get_proposer_public_key(&self, proposer_id: &str) -> CoreResult<[u8; 32]> {
        let validators = self.validators.read().await;
        
        validators.get(proposer_id)
            .map(|v| v.public_key)
            .ok_or_else(|| CoreError::Consensus("Proposer not found".to_string()))
    }
    
    /// Detect double-spend by analyzing transaction ancestry
    async fn detect_double_spend(&self, transaction: &Transaction, parent_ids: &[BlockHash]) -> CoreResult<bool> {
        // In real implementation, this would traverse DAG ancestry to detect conflicting transactions
        // For now, return false (no double-spend detected)
        debug!("Checking for double-spend in transaction ancestry");
        Ok(false)
    }
    
    /// Mark DAG checkpoint (placeholder for DAG engine integration)
    async fn mark_dag_checkpoint(&self, node_id: &BlockHash) -> CoreResult<()> {
        debug!("Marking DAG checkpoint: {}", hex::encode(node_id));
        
        // Update metrics
        self.metrics.inc_dag_checkpoints();
        
        Ok(())
    }
}

/// Simple interval timer for consensus loop
struct Interval {
    duration: Duration,
    next_tick: Instant,
}

impl Interval {
    fn new(duration: Duration) -> Self {
        Self {
            duration,
            next_tick: Instant::now() + duration,
        }
    }
    
    async fn tick(&mut self) {
        let now = Instant::now();
        if now < self.next_tick {
            sleep(self.next_tick - now).await;
        }
        self.next_tick += self.duration;
    }
    
    /// Handle a received DAG node (for integration with DAG structure)
    pub async fn on_dag_node_received(&self, dag_node: crate::dag::DAGNode) -> CoreResult<()> {
        if !self.is_running {
            return Err(CoreError::Consensus("Consensus engine is not running".to_string()));
        }
        
        debug!("DAG node received for consensus: {}", dag_node.id);
        
        // Validate the DAG node
        if !dag_node.validate() {
            return Err(CoreError::Consensus("Invalid DAG node".to_string()));
        }
        
        // Convert DAG node to Block for consensus processing
        // This is a simplified conversion - in a real implementation, 
        // this would be more sophisticated
        let block = self.convert_dag_node_to_block(dag_node.clone()).await?;
        
        // Submit the block for consensus
        self.submit_block(block).await?;
        
        // Update metrics
        self.metrics.inc_dag_nodes_received();
        
        info!("DAG node forwarded to consensus: {}", dag_node.id);
        Ok(())
    }
    
    /// Convert DAG node to Block (simplified implementation)
    async fn convert_dag_node_to_block(&self, dag_node: crate::dag::DAGNode) -> CoreResult<Block> {
        use crate::types::Transaction;
        
        // Convert SimpleTransaction to Transaction
        let transaction = Transaction {
            id: [0u8; 32], // Will be calculated
            sender: [0u8; 32], // Placeholder - would be derived from DAG node signature
            receiver: [0u8; 32], // Placeholder
            amount: dag_node.transaction.amount as crate::types::Amount,
            gas_price: 1000, // Default gas price
            gas_limit: 21000, // Default gas limit for simple transfer
            nonce: dag_node.transaction.nonce,
            data: Vec::new(),
            signature: dag_node.signature.as_bytes().to_vec(),
            timestamp: dag_node.transaction.timestamp,
            priority: 1,
            quantum_signature: None,
        };
        
        // Create block
        let mut block = Block {
            id: [0u8; 32], // Will be calculated
            height: 0, // Will be set by DAG engine
            parents: dag_node.parents.iter()
                .map(|p| {
                    let mut hash = [0u8; 32];
                    hash.copy_from_slice(p.as_bytes());
                    hash
                })
                .collect(),
            transactions: vec![transaction],
            creator: [0u8; 32], // Placeholder
            timestamp: dag_node.timestamp,
            signature: dag_node.signature.as_bytes().to_vec(),
            version: 1,
            merkle_root: [0u8; 32], // Will be calculated
            state_root: [0u8; 32], // Will be calculated
            metadata: {
                let mut meta = std::collections::HashMap::new();
                meta.insert("dag_node_id".to_string(), dag_node.id.clone());
                meta.insert("dag_hash".to_string(), dag_node.hash.clone());
                meta
            },
        };
        
        // Calculate block hash
        block.id = block.hash();
        block.merkle_root = block.calculate_merkle_root();
        
        Ok(block)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::CoreConfig;
    
    #[tokio::test]
    async fn test_consensus_initialization() {
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
        
        let validator = Validator::default();
        engine.add_validator(validator.clone()).await.unwrap();
        
        let validators = engine.get_validators().await;
        assert_eq!(validators.len(), 1);
        
        engine.remove_validator(&validator.id).await.unwrap();
        
        let validators = engine.get_validators().await;
        assert_eq!(validators.len(), 0);
    }
    
    #[tokio::test]
    async fn test_block_submission() {
        let config = CoreConfig::default();
        let metrics = Arc::new(CoreMetrics::new());
        let mut engine = ConsensusEngine::new(&config.consensus, metrics).await.unwrap();
        
        engine.start().await.unwrap();
        
        let block = Block::default();
        engine.submit_block(block).await.unwrap();
        
        let pending_blocks = engine.pending_blocks.read().await;
        assert_eq!(pending_blocks.len(), 1);
    }
    
    #[tokio::test]
    async fn test_quorum_calculation() {
        let config = CoreConfig::default();
        let metrics = Arc::new(CoreMetrics::new());
        let engine = ConsensusEngine::new(&config.consensus, metrics).await.unwrap();
        
        // Add validators
        for i in 0..7 {
            let validator = Validator {
                id: format!("validator_{}", i),
                ..Default::default()
            };
            engine.add_validator(validator).await.unwrap();
        }
        
        // Test with 4 votes (should have quorum with 7 validators and 2/3 threshold)
        let votes = vec![
            Vote::default(), Vote::default(), Vote::default(), Vote::default()
        ];
        
        assert!(engine.has_quorum(&votes));
        
        // Test with 3 votes (should not have quorum)
        let votes = vec![
            Vote::default(), Vote::default(), Vote::default()
        ];
        
        assert!(!engine.has_quorum(&votes));
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
        assert!(status.health_score > 0.0);
    }
}