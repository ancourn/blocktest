/**
 * Consensus engine for KALDRIX blockchain
 * TypeScript interfaces for consensus mechanisms
 */

import {
  Validator,
  ValidatorStatus,
  ConsensusState,
  ConsensusAlgorithm,
  VoteType,
  BlockHash,
  ValidatorId,
  Timestamp,
  BaseError,
  ErrorType,
} from './types';
import { DAGNode, Transaction } from './dag';

/**
 * Consensus configuration
 */
export interface ConsensusConfig {
  /** Consensus algorithm */
  algorithm: ConsensusAlgorithm;
  /** Number of validators */
  numValidators: number;
  /** Minimum number of validators required */
  minValidators: number;
  /** Block reward in wei */
  blockReward: bigint;
  /** Minimum stake required to be a validator */
  minStake: bigint;
  /** Maximum stake allowed */
  maxStake: bigint;
  /** Proposal timeout in milliseconds */
  proposalTimeoutMs: number;
  /** Voting timeout in milliseconds */
  votingTimeoutMs: number;
  /** Commit timeout in milliseconds */
  commitTimeoutMs: number;
  /** Block time target in milliseconds */
  blockTimeTargetMs: number;
  /** Quorum threshold (0-1) */
  quorumThreshold: number;
  /** Whether to enable view changes */
  enableViewChanges: boolean;
  /** View change timeout in milliseconds */
  viewChangeTimeoutMs: number;
  /** Maximum number of view changes */
  maxViewChanges: number;
  /** Whether to enable validator slashing */
  enableSlashing: boolean;
  /** Slash amount for misbehavior */
  slashAmount: bigint;
  /** Whether to enable performance-based rewards */
  enablePerformanceRewards: boolean;
  /** Performance reward multiplier */
  performanceRewardMultiplier: number;
}

/**
 * Consensus round information
 */
export interface ConsensusRound {
  /** Round number */
  roundNumber: number;
  /** View number */
  viewNumber: number;
  /** Current block being processed */
  currentBlock?: DAGNode;
  /** Proposer for this round */
  proposer?: ValidatorId;
  /** Votes received */
  votes: Map<ValidatorId, Vote>;
  /** Commit messages received */
  commits: Map<ValidatorId, Commit>;
  /** Round start time */
  startTime: Timestamp;
  /** Round timeout */
  timeout: number;
  /** Round status */
  status: ConsensusRoundStatus;
}

/**
 * Consensus round status
 */
export enum ConsensusRoundStatus {
  /** Round not started */
  NotStarted = 'not_started',
  /** Proposal phase */
  Proposal = 'proposal',
  /** Voting phase */
  Voting = 'voting',
  /** Commit phase */
  Commit = 'commit',
  /** Round completed */
  Completed = 'completed',
  /** Round failed */
  Failed = 'failed',
  /** View change in progress */
  ViewChange = 'view_change',
}

/**
 * Vote message for consensus
 */
export interface Vote {
  /** Validator ID */
  validatorId: ValidatorId;
  /** Block hash being voted on */
  blockHash: BlockHash;
  /** Vote signature */
  signature: Uint8Array;
  /** Vote timestamp */
  timestamp: Timestamp;
  /** Vote type */
  voteType: VoteType;
  /** Round number */
  round: number;
  /** View number */
  view: number;
  /** Vote justification */
  justification?: string;
}

/**
 * Commit message for consensus
 */
export interface Commit {
  /** Validator ID */
  validatorId: ValidatorId;
  /** Block hash being committed */
  blockHash: BlockHash;
  /** Commit signature */
  signature: Uint8Array;
  /** Commit timestamp */
  timestamp: Timestamp;
  /** Round number */
  round: number;
  /** View number */
  view: number;
  /** Commit justification */
  justification?: string;
}

/**
 * View change message
 */
export interface ViewChange {
  /** Validator ID */
  validatorId: ValidatorId;
  /** New view number */
  newView: number;
  /** Reason for view change */
  reason: string;
  /** Signature */
  signature: Uint8Array;
  /** Timestamp */
  timestamp: Timestamp;
  /** Evidence of misbehavior */
  evidence?: any;
}

/**
 * Consensus status
 */
export interface ConsensusStatus {
  /** Current state */
  state: ConsensusState;
  /** Current round */
  currentRound: number;
  /** Current view */
  currentView: number;
  /** Last committed block */
  lastCommittedBlock?: BlockHash;
  /** Current proposer */
  currentProposer?: ValidatorId;
  /** Number of active validators */
  activeValidators: number;
  /** Consensus health score (0-100) */
  healthScore: number;
  /** Total rounds completed */
  totalRounds: number;
  /** Failed rounds */
  failedRounds: number;
  /** Last update timestamp */
  lastUpdated: Timestamp;
  /** Current phase */
  currentPhase: ConsensusPhase;
  /** Time until next phase */
  timeToNextPhase: number;
  /** Network synchronization status */
  syncStatus: SyncStatus;
}

/**
 * Consensus phases
 */
export enum ConsensusPhase {
  /** Idle phase */
  Idle = 'idle',
  /** Proposal phase */
  Proposal = 'proposal',
  /** Voting phase */
  Voting = 'voting',
  /** Commit phase */
  Commit = 'commit',
  /** Finalization phase */
  Finalization = 'finalization',
  /** View change phase */
  ViewChange = 'view_change',
}

/**
 * Synchronization status
 */
export interface SyncStatus {
  /** Whether the node is synchronized */
  isSynchronized: boolean;
  /** Current block height */
  currentHeight: number;
  /** Network height */
  networkHeight: number;
  /** Sync progress (0-1) */
  syncProgress: number;
  /** Sync speed in blocks per second */
  syncSpeed: number;
  /** Estimated time to sync in seconds */
  estimatedTimeToSync: number;
  /** Sync status */
  status: SyncStatusType;
}

/**
 * Sync status types
 */
export enum SyncStatusType {
  /** Not syncing */
  NotSyncing = 'not_syncing',
  /** Syncing headers */
  SyncingHeaders = 'syncing_headers',
  /** Syncing blocks */
  SyncingBlocks = 'syncing_blocks',
  /** Syncing state */
  SyncingState = 'syncing_state',
  /** Sync complete */
  SyncComplete = 'sync_complete',
  /** Sync failed */
  SyncFailed = 'sync_failed',
}

/**
 * Consensus metrics
 */
export interface ConsensusMetrics {
  /** Total consensus rounds */
  totalRounds: number;
  /** Successful rounds */
  successfulRounds: number;
  /** Failed rounds */
  failedRounds: number;
  /** Average consensus time in milliseconds */
  avgConsensusTimeMs: number;
  /** View changes */
  viewChanges: number;
  /** Validator participation rate (0-1) */
  participationRate: number;
  /** Average proposal time in milliseconds */
  avgProposalTimeMs: number;
  /** Average voting time in milliseconds */
  avgVotingTimeMs: number;
  /** Average commit time in milliseconds */
  avgCommitTimeMs: number;
  /** Block commitment rate (0-1) */
  commitmentRate: number;
  /** Fork resolution rate (0-1) */
  forkResolutionRate: number;
  /** Total blocks committed */
  totalBlocksCommitted: number;
  /** Total transactions committed */
  totalTransactionsCommitted: number;
  /** Average block size in bytes */
  avgBlockSize: number;
  /** Average transactions per block */
  avgTransactionsPerBlock: number;
  /** Network latency in milliseconds */
  networkLatency: number;
  /** Validator uptime percentage */
  validatorUptime: number;
  /** Slashing events count */
  slashingEvents: number;
}

/**
 * Consensus engine interface
 */
export interface ConsensusEngine {
  /**
   * Initialize the consensus engine
   */
  initialize(config: ConsensusConfig): Promise<void>;

  /**
   * Start the consensus engine
   */
  start(): Promise<void>;

  /**
   * Stop the consensus engine
   */
  stop(): Promise<void>;

  /**
   * Add a validator
   */
  addValidator(validator: Validator): Promise<void>;

  /**
   * Remove a validator
   */
  removeValidator(validatorId: ValidatorId): Promise<void>;

  /**
   * Submit a block for consensus
   */
  submitBlock(block: DAGNode): Promise<void>;

  /**
   * Get consensus status
   */
  getStatus(): ConsensusStatus;

  /**
   * Get validators
   */
  getValidators(): Promise<Validator[]>;

  /**
   * Get active validators
   */
  getActiveValidators(): Promise<Validator[]>;

  /**
   * Get consensus metrics
   */
  getMetrics(): Promise<ConsensusMetrics>;

  /**
   * Validate a validator
   */
  validateValidator(validatorId: ValidatorId): Promise<boolean>;

  /**
   * Start a new consensus round
   */
  startNewRound(block: DAGNode): Promise<void>;

  /**
   * Select proposer for current round
   */
  selectProposer(): Promise<ValidatorId>;

  /**
   * Propose a block
   */
  proposeBlock(block: DAGNode, proposer: ValidatorId): Promise<void>;

  /**
   * Collect votes for a block
   */
  collectVotes(blockHash: BlockHash): Promise<Vote[]>;

  /**
   * Check if quorum is reached
   */
  hasQuorum(votes: Vote[]): boolean;

  /**
   * Commit a block
   */
  commitBlock(block: DAGNode): Promise<void>;

  /**
   * Start view change
   */
  startViewChange(): Promise<void>;

  /**
   * Process view change message
   */
  processViewChange(viewChange: ViewChange): Promise<void>;

  /**
   * Slash a validator
   */
  slashValidator(validatorId: ValidatorId, reason: string): Promise<void>;

  /**
   * Reset consensus state
   */
  reset(): Promise<void>;

  /**
   * Get pending blocks
   */
  getPendingBlocks(): Promise<DAGNode[]>;

  /**
   * Get committed blocks
   */
  getCommittedBlocks(): Promise<BlockHash[]>;

  /**
   * Get current round information
   */
  getCurrentRound(): Promise<ConsensusRound>;

  /**
   * Get vote history
   */
  getVoteHistory(roundNumber?: number): Promise<Vote[]>;

  /**
   * Get commit history
   */
  getCommitHistory(roundNumber?: number): Promise<Commit[]>;

  /**
   * Get view change history
   */
  getViewChangeHistory(): Promise<ViewChange[]>;

  /**
   * Calculate health score
   */
  calculateHealthScore(): Promise<number>;

  /**
   * Get synchronization status
   */
  getSyncStatus(): Promise<SyncStatus>;

  /**
   * Force synchronization
   */
  forceSync(): Promise<void>;

  /**
   * Get fork information
   */
  getForkInfo(): Promise<{
    hasFork: boolean;
    forkBlocks: BlockHash[];
    longestChain: BlockHash[];
    recommendedChain: BlockHash[];
  }>;

  /**
   * Resolve fork
   */
  resolveFork(recommendedChain: BlockHash[]): Promise<void>;
}

/**
 * Validator election interface
 */
export interface ValidatorElection {
  /**
   * Select validators for the next epoch
   */
  selectValidators(allValidators: Validator[], count: number): Promise<Validator[]>;

  /**
   * Calculate validator score
   */
  calculateValidatorScore(validator: Validator): Promise<number>;

  /**
   * Get validator ranking
   */
  getValidatorRanking(): Promise<Array<{ validator: Validator; score: number; rank: number }>>;

  /**
   * Update validator performance
   */
  updateValidatorPerformance(validatorId: ValidatorId, performance: Partial<Validator['performance']>): Promise<void>;

  /**
   * Get validator rewards
   */
  getValidatorRewards(validatorId: ValidatorId, epoch: number): Promise<bigint>;

  /**
   * Distribute rewards
   */
  distributeRewards(epoch: number): Promise<void>;
}

/**
 * Fork resolution interface
 */
export interface ForkResolution {
  /**
   * Detect forks
   */
  detectForks(): Promise<BlockHash[][]>;

  /**
   * Analyze fork
   */
  analyzeFork(forkBlocks: BlockHash[]): Promise<{
    isValid: boolean;
    confidence: number;
    reason: string;
    recommendedChain: BlockHash[];
  }>;

  /**
   * Select best chain
   */
  selectBestChain(chains: BlockHash[][]): Promise<BlockHash[]>;

  /**
   * Execute fork resolution
   */
  executeForkResolution(selectedChain: BlockHash[]): Promise<void>;

  /**
   * Get fork resolution history
   */
  getForkResolutionHistory(): Promise<Array<{
    timestamp: Timestamp;
    forkBlocks: BlockHash[];
    selectedChain: BlockHash[];
    reason: string;
    confidence: number;
  }>>;
}

/**
 * Consensus utility functions
 */
export const ConsensusUtils = {
  /**
   * Calculate quorum threshold
   */
  calculateQuorum(totalValidators: number, threshold: number): number {
    return Math.ceil(totalValidators * threshold);
  },

  /**
   * Check if vote is valid
   */
  isValidVote(vote: Vote, validators: Validator[]): boolean {
    const validator = validators.find(v => v.id === vote.validatorId);
    if (!validator || validator.status !== ValidatorStatus.Active) {
      return false;
    }
    
    // Check signature validity (in a real implementation)
    // This would involve cryptographic verification
    
    return true;
  },

  /**
   * Check if commit is valid
   */
  isValidCommit(commit: Commit, validators: Validator[]): boolean {
    const validator = validators.find(v => v.id === commit.validatorId);
    if (!validator || validator.status !== ValidatorStatus.Active) {
      return false;
    }
    
    // Check signature validity (in a real implementation)
    // This would involve cryptographic verification
    
    return true;
  },

  /**
   * Calculate participation rate
   */
  calculateParticipationRate(votes: Vote[], totalValidators: number): number {
    if (totalValidators === 0) return 0;
    return votes.length / totalValidators;
  },

  /**
   * Calculate consensus health score
   */
  calculateHealthScore(metrics: ConsensusMetrics): number {
    const roundSuccessRate = metrics.totalRounds > 0 
      ? metrics.successfulRounds / metrics.totalRounds 
      : 1;
    
    const participationScore = metrics.participationRate;
    const commitmentScore = metrics.commitmentRate;
    const uptimeScore = metrics.validatorUptime / 100;
    
    // Weighted average
    const healthScore = (
      roundSuccessRate * 0.3 +
      participationScore * 0.3 +
      commitmentScore * 0.2 +
      uptimeScore * 0.2
    ) * 100;
    
    return Math.min(100, Math.max(0, healthScore));
  },

  /**
   * Select proposer using round-robin
   */
  selectProposerRoundRobin(validators: Validator[], roundNumber: number): ValidatorId {
    if (validators.length === 0) {
      throw new Error('No validators available');
    }
    
    const activeValidators = validators.filter(v => v.status === ValidatorStatus.Active);
    if (activeValidators.length === 0) {
      throw new Error('No active validators available');
    }
    
    const index = roundNumber % activeValidators.length;
    return activeValidators[index].id;
  },

  /**
   * Select proposer using stake-weighted random selection
   */
  selectProposerStakeWeighted(validators: Validator[], seed: number): ValidatorId {
    const activeValidators = validators.filter(v => v.status === ValidatorStatus.Active);
    if (activeValidators.length === 0) {
      throw new Error('No active validators available');
    }
    
    const totalStake = activeValidators.reduce((sum, v) => sum + v.stake, 0n);
    const randomValue = BigInt(seed) % totalStake;
    
    let cumulativeStake = 0n;
    for (const validator of activeValidators) {
      cumulativeStake += validator.stake;
      if (randomValue <= cumulativeStake) {
        return validator.id;
      }
    }
    
    return activeValidators[activeValidators.length - 1].id;
  },

  /**
   * Select proposer using performance-based selection
   */
  selectProposerPerformanceBased(validators: Validator[]): ValidatorId {
    const activeValidators = validators.filter(v => v.status === ValidatorStatus.Active);
    if (activeValidators.length === 0) {
      throw new Error('No active validators available');
    }
    
    // Calculate performance scores
    const validatorScores = activeValidators.map(validator => ({
      validator,
      score: this.calculateValidatorPerformanceScore(validator),
    }));
    
    // Sort by score (highest first)
    validatorScores.sort((a, b) => b.score - a.score);
    
    // Select top performer
    return validatorScores[0].validator.id;
  },

  /**
   * Calculate validator performance score
   */
  calculateValidatorPerformanceScore(validator: Validator): number {
    const { performance } = validator;
    
    // Weighted performance score
    const uptimeScore = performance.uptime / 100;
    const successRateScore = performance.successRate;
    const responseTimeScore = Math.max(0, 1 - (performance.avgResponseTime / 1000)); // Normalize to 0-1
    const blocksProposedScore = Math.min(1, performance.blocksProposed / 100);
    
    const score = (
      uptimeScore * 0.3 +
      successRateScore * 0.3 +
      responseTimeScore * 0.2 +
      blocksProposedScore * 0.2
    ) * 100;
    
    return Math.min(100, Math.max(0, score));
  },

  /**
   * Estimate consensus time
   */
  estimateConsensusTime(numValidators: number, networkLatency: number): number {
    // Base time for consensus operations
    const baseTime = 100; // milliseconds
    
    // Add time proportional to number of validators
    const validatorTime = numValidators * 10; // milliseconds per validator
    
    // Add network latency
    const networkTime = networkLatency * 2; // round trip
    
    return baseTime + validatorTime + networkTime;
  },

  /**
   * Validate consensus configuration
   */
  validateConfig(config: ConsensusConfig): string[] {
    const errors: string[] = [];
    
    if (config.numValidators < config.minValidators) {
      errors.push('Number of validators cannot be less than minimum validators');
    }
    
    if (config.minStake <= 0) {
      errors.push('Minimum stake must be greater than 0');
    }
    
    if (config.maxStake < config.minStake) {
      errors.push('Maximum stake cannot be less than minimum stake');
    }
    
    if (config.quorumThreshold <= 0 || config.quorumThreshold > 1) {
      errors.push('Quorum threshold must be between 0 and 1');
    }
    
    if (config.proposalTimeoutMs <= 0) {
      errors.push('Proposal timeout must be greater than 0');
    }
    
    if (config.votingTimeoutMs <= 0) {
      errors.push('Voting timeout must be greater than 0');
    }
    
    if (config.commitTimeoutMs <= 0) {
      errors.push('Commit timeout must be greater than 0');
    }
    
    if (config.blockTimeTargetMs <= 0) {
      errors.push('Block time target must be greater than 0');
    }
    
    return errors;
  },
};

export default ConsensusEngine;