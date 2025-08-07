/**
 * DAG-based blockchain structure for KALDRIX
 * TypeScript interfaces for frontend interaction with Rust blockchain core
 */

import { Signature, PublicKey, PrivateKey, BlockHash, TransactionId } from './types';

/**
 * DAG node representing a block in the blockchain
 */
export interface DAGNode {
  /** Unique identifier for the node */
  id: BlockHash;
  /** Timestamp when the node was created */
  timestamp: number;
  /** Payload data (transactions) */
  payload: Transaction[];
  /** Parent node hashes */
  parents: BlockHash[];
  /** Node hash */
  hash: BlockHash;
  /** Creator signature */
  signature: Signature;
  /** Block height */
  height: number;
  /** Creator public key */
  creator: PublicKey;
  /** Version number */
  version: number;
  /** Merkle root of transactions */
  merkleRoot: BlockHash;
  /** State root */
  stateRoot: BlockHash;
  /** Additional metadata */
  metadata: Record<string, string>;
}

/**
 * DAG edge representing relationship between blocks
 */
export interface DAGEdge {
  /** Source block hash */
  from: BlockHash;
  /** Target block hash */
  to: BlockHash;
  /** Edge weight for prioritization */
  weight: number;
  /** Type of edge relationship */
  edgeType: EdgeType;
}

/**
 * Types of edges in the DAG
 */
export enum EdgeType {
  /** Parent-child relationship */
  Parent = 'parent',
  /** Reference relationship */
  Reference = 'reference',
  /** Dependency relationship */
  Dependency = 'dependency',
  /** Strong reference */
  Strong = 'strong',
  /** Weak reference */
  Weak = 'weak',
}

/**
 * DAG node metrics
 */
export interface DAGNodeMetrics {
  /** Node depth in the DAG */
  depth: number;
  /** Node width (number of children) */
  width: number;
  /** Number of transactions */
  transactionCount: number;
  /** Confirmation score (0-1) */
  confirmationScore: number;
  /** Creation timestamp */
  createdAt: number;
  /** Last updated timestamp */
  updatedAt: number;
}

/**
 * DAG engine metrics
 */
export interface DAGMetrics {
  /** Total number of nodes */
  nodeCount: number;
  /** Total number of edges */
  edgeCount: number;
  /** Average depth */
  avgDepth: number;
  /** Average width */
  avgWidth: number;
  /** Maximum depth */
  maxDepth: number;
  /** Maximum width */
  maxWidth: number;
  /** Transaction pool size */
  transactionPoolSize: number;
  /** Average confirmation time in milliseconds */
  avgConfirmationTime: number;
  /** Throughput (transactions per second) */
  tps: number;
  /** Confirmation rate (0-1) */
  confirmationRate: number;
  /** Cache hit rate (0-1) */
  cacheHitRate: number;
  /** Validation time in milliseconds */
  validationTime: number;
  /** Traversal time in milliseconds */
  traversalTime: number;
  /** Network latency in milliseconds */
  latency: number;
  /** Number of tips (unconfirmed nodes) */
  tipsCount: number;
}

/**
 * DAG topology information
 */
export interface DAGTopology {
  /** Total number of nodes */
  nodeCount: number;
  /** Total number of edges */
  edgeCount: number;
  /** Whether the DAG is acyclic */
  isAcyclic: boolean;
  /** Whether the DAG is connected */
  isConnected: boolean;
  /** Genesis block hash */
  genesisHash?: BlockHash;
  /** Longest path length */
  longestPath: number;
  /** Average path length */
  avgPathLength: number;
  /** Node distribution by depth */
  depthDistribution: Record<number, number>;
}

/**
 * DAG configuration
 */
export interface DAGConfig {
  /** Maximum transactions per block */
  maxTransactionsPerBlock: number;
  /** Maximum number of parent blocks */
  maxParents: number;
  /** Target block time in milliseconds */
  blockTimeTargetMs: number;
  /** Whether to enable transaction prioritization */
  enablePrioritization: boolean;
  /** Whether to enable parallel execution */
  enableParallelExecution: boolean;
  /** Transaction pool size */
  transactionPoolSize: number;
  /** Cache size for frequently accessed nodes */
  cacheSize: number;
  /** Whether to enable DAG pruning */
  pruningEnabled: boolean;
  /** Pruning threshold */
  pruningThreshold: number;
}

/**
 * DAG engine interface for frontend
 */
export interface DAGEngine {
  /** Initialize the DAG engine */
  initialize(config: DAGConfig): Promise<void>;
  
  /** Start the DAG engine */
  start(): Promise<void>;
  
  /** Stop the DAG engine */
  stop(): Promise<void>;
  
  /** Add a transaction to the pool */
  addTransaction(transaction: Transaction): Promise<void>;
  
  /** Add multiple transactions to the pool */
  addTransactions(transactions: Transaction[]): Promise<number>;
  
  /** Create a new block */
  createBlock(creator: PublicKey): Promise<DAGNode>;
  
  /** Add a block to the DAG */
  addBlock(block: DAGNode): Promise<void>;
  
  /** Get a block by hash */
  getBlock(blockHash: BlockHash): Promise<DAGNode | null>;
  
  /** Get a transaction by ID */
  getTransaction(transactionId: TransactionId): Promise<Transaction | null>;
  
  /** Get all tips (unconfirmed nodes) */
  getTips(): Promise<BlockHash[]>;
  
  /** Traverse the DAG from a starting node */
  traverseDAG(startHash: BlockHash, direction: 'parents' | 'children'): Promise<DAGNode[]>;
  
  /** Get DAG metrics */
  getMetrics(): Promise<DAGMetrics>;
  
  /** Get DAG topology */
  getTopology(): Promise<DAGTopology>;
  
  /** Validate the DAG structure */
  validateDAG(): Promise<boolean>;
  
  /** Get transaction pool size */
  getMempoolSize(): Promise<number>;
  
  /** Get node metrics */
  getNodeMetrics(blockHash: BlockHash): Promise<DAGNodeMetrics | null>;
  
  /** Get all blocks in a specific depth range */
  getBlocksByDepth(minDepth: number, maxDepth: number): Promise<DAGNode[]>;
  
  /** Get longest chain */
  getLongestChain(): Promise<DAGNode[]>;
  
  /** Get conflicting branches (forks) */
  getForks(): Promise<DAGNode[][]>;
}

/**
 * Transaction interface
 */
export interface Transaction {
  /** Unique transaction identifier */
  id: TransactionId;
  /** Sender public key */
  sender: PublicKey;
  /** Receiver public key */
  receiver: PublicKey;
  /** Transaction amount */
  amount: bigint;
  /** Gas price */
  gasPrice: bigint;
  /** Gas limit */
  gasLimit: bigint;
  /** Transaction nonce */
  nonce: number;
  /** Transaction data */
  data: Uint8Array;
  /** Transaction signature */
  signature: Signature;
  /** Transaction timestamp */
  timestamp: number;
  /** Transaction priority (1-10) */
  priority: number;
  /** Optional quantum signature */
  quantumSignature?: Signature;
}

/**
 * DAG validation result
 */
export interface DAGValidationResult {
  /** Whether the DAG is valid */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
  /** Warnings */
  warnings: string[];
  /** Validation metrics */
  metrics: {
    /** Number of nodes validated */
    nodesValidated: number;
    /** Number of edges validated */
    edgesValidated: number;
    /** Validation time in milliseconds */
    validationTime: number;
  };
}

/**
 * DAG traversal options
 */
export interface DAGTraversalOptions {
  /** Maximum depth to traverse */
  maxDepth?: number;
  /** Maximum number of nodes to return */
  maxNodes?: number;
  /** Whether to include node metrics */
  includeMetrics?: boolean;
  /** Whether to include transactions */
  includeTransactions?: boolean;
  /** Filter by node depth range */
  depthRange?: { min: number; max: number };
  /** Filter by creator */
  creator?: PublicKey;
  /** Filter by timestamp range */
  timestampRange?: { start: number; end: number };
}

/**
 * DAG statistics
 */
export interface DAGStatistics {
  /** Total number of transactions */
  totalTransactions: number;
  /** Total number of blocks */
  totalBlocks: number;
  /** Average transactions per block */
  avgTransactionsPerBlock: number;
  /** Average block time in milliseconds */
  avgBlockTime: number;
  /** Network throughput (TPS) */
  throughput: number;
  /** Confirmation rate (0-1) */
  confirmationRate: number;
  /** Orphan rate (0-1) */
  orphanRate: number;
  /** Fork rate (0-1) */
  forkRate: number;
  /** Memory usage in bytes */
  memoryUsage: number;
  /** Disk usage in bytes */
  diskUsage: number;
}

/**
 * Export utility functions
 */
export const DAGUtils = {
  /**
   * Convert block hash to hex string
   */
  hashToHex(hash: BlockHash): string {
    return Buffer.from(hash).toString('hex');
  },

  /**
   * Convert hex string to block hash
   */
  hexToHash(hex: string): BlockHash {
    return new Uint8Array(Buffer.from(hex, 'hex')) as BlockHash;
  },

  /**
   * Calculate transaction fee
   */
  calculateTransactionFee(transaction: Transaction): bigint {
    return transaction.gasPrice * transaction.gasLimit;
  },

  /**
   * Validate transaction structure
   */
  validateTransaction(transaction: Transaction): boolean {
    return (
      transaction.id.length === 32 &&
      transaction.sender.length === 32 &&
      transaction.receiver.length === 32 &&
      transaction.amount > 0n &&
      transaction.gasPrice > 0n &&
      transaction.gasLimit > 0n &&
      transaction.priority >= 1 &&
      transaction.priority <= 10 &&
      transaction.signature.length > 0
    );
  },

  /**
   * Validate block structure
   */
  validateBlock(block: DAGNode): boolean {
    return (
      block.id.length === 32 &&
      block.parents.length > 0 &&
      block.parents.length <= 8 &&
      block.creator.length === 32 &&
      block.signature.length > 0 &&
      block.merkleRoot.length === 32 &&
      block.stateRoot.length === 32 &&
      block.height >= 0
    );
  },

  /**
   * Calculate block size in bytes
   */
  calculateBlockSize(block: DAGNode): number {
    return (
      block.id.length +
      block.parents.reduce((sum, parent) => sum + parent.length, 0) +
      block.transactions.reduce((sum, tx) => sum + this.calculateTransactionSize(tx), 0) +
      block.signature.length +
      block.merkleRoot.length +
      block.stateRoot.length
    );
  },

  /**
   * Calculate transaction size in bytes
   */
  calculateTransactionSize(transaction: Transaction): number {
    return (
      transaction.id.length +
      transaction.sender.length +
      transaction.receiver.length +
      transaction.data.length +
      transaction.signature.length +
      (transaction.quantumSignature?.length || 0)
    );
  },
};

export default DAGEngine;