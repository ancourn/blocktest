/**
 * KALDRIX Blockchain Core TypeScript Interfaces
 * Complete type definitions and interfaces for blockchain interaction
 */

// Export core types
export * from './types';

// Export DAG interfaces
export * from './dag';

// Export crypto interfaces
export * from './crypto';

// Export consensus interfaces
export * from './consensus';

// Re-export commonly used types for convenience
export type {
  Hash,
  BlockHash,
  TransactionId,
  PublicKey,
  PrivateKey,
  Signature,
  Amount,
  GasPrice,
  GasLimit,
  Nonce,
  Timestamp,
  BlockHeight,
  ValidatorId,
  NetworkAddress,
} from './types';

export type {
  DAGNode,
  DAGEdge,
  DAGMetrics,
  DAGTopology,
  DAGConfig,
  Transaction,
  DAGValidationResult,
  DAGTraversalOptions,
  DAGStatistics,
} from './dag';

export type {
  CryptoConfig,
  KeyPair,
  KeyRotationManager,
  KeyRotationEvent,
  QuantumCrypto,
  CryptoOperation,
  CryptoBenchmark,
  SecurityAudit,
  SecurityVulnerability,
  HSMInterface,
  ZeroKnowledgeProof,
  MultiSignature,
  ThresholdCrypto,
} from './crypto';

export type {
  ConsensusConfig,
  ConsensusRound,
  ConsensusRoundStatus,
  Vote,
  Commit,
  ViewChange,
  ConsensusStatus,
  ConsensusPhase,
  SyncStatus,
  SyncStatusType,
  ConsensusMetrics,
  ValidatorElection,
  ForkResolution,
} from './consensus';

// Export utility classes
export { TypeUtils } from './types';
export { DAGUtils } from './dag';
export { CryptoUtils } from './crypto';
export { ConsensusUtils } from './consensus';

// Export main interfaces
export { default as DAGEngine } from './dag';
export { default as QuantumCrypto } from './crypto';
export { default as ConsensusEngine } from './consensus';

/**
 * KALDRIX Blockchain Core - Main Interface
 * 
 * This provides a unified interface for interacting with the blockchain
 * from TypeScript/JavaScript applications.
 */
export interface KaldrixBlockchain {
  /**
   * Initialize the blockchain core
   */
  initialize(config: BlockchainConfig): Promise<void>;

  /**
   * Start the blockchain
   */
  start(): Promise<void>;

  /**
   * Stop the blockchain
   */
  stop(): Promise<void>;

  /**
   * Get blockchain status
   */
  getStatus(): Promise<BlockchainStatus>;

  /**
   * Get blockchain metrics
   */
  getMetrics(): Promise<BlockchainMetrics>;

  /**
   * DAG operations
   */
  dag: {
    /** Add transaction to mempool */
    addTransaction(transaction: Transaction): Promise<void>;
    /** Get transaction by ID */
    getTransaction(txId: TransactionId): Promise<Transaction | null>;
    /** Get block by hash */
    getBlock(blockHash: BlockHash): Promise<DAGNode | null>;
    /** Get DAG metrics */
    getMetrics(): Promise<DAGMetrics>;
    /** Get DAG topology */
    getTopology(): Promise<DAGTopology>;
    /** Get tips (unconfirmed nodes) */
    getTips(): Promise<BlockHash[]>;
    /** Traverse DAG */
    traverseDAG(startHash: BlockHash, direction: 'parents' | 'children'): Promise<DAGNode[]>;
  };

  /**
   * Cryptographic operations
   */
  crypto: {
    /** Generate key pair */
    generateKeyPair(): Promise<KeyPair>;
    /** Sign data */
    sign(data: Uint8Array, privateKey: PrivateKey): Promise<Signature>;
    /** Verify signature */
    verify(data: Uint8Array, signature: Signature, publicKey: PublicKey): Promise<boolean>;
    /** Encrypt data */
    encrypt(data: Uint8Array, publicKey: PublicKey): Promise<Uint8Array>;
    /** Decrypt data */
    decrypt(ciphertext: Uint8Array, privateKey: PrivateKey): Promise<Uint8Array>;
    /** Hash transaction */
    hashTransaction(transaction: Transaction): Promise<BlockHash>;
    /** Hash block */
    hashBlock(block: DAGNode): Promise<BlockHash>;
  };

  /**
   * Consensus operations
   */
  consensus: {
    /** Get consensus status */
    getStatus(): Promise<ConsensusStatus>;
    /** Get validators */
    getValidators(): Promise<Validator[]>;
    /** Submit block for consensus */
    submitBlock(block: DAGNode): Promise<void>;
    /** Get consensus metrics */
    getMetrics(): Promise<ConsensusMetrics>;
    /** Get sync status */
    getSyncStatus(): Promise<SyncStatus>;
  };

  /**
   * Network operations
   */
  network: {
    /** Connect to peer */
    connect(peerAddress: NetworkAddress): Promise<void>;
    /** Disconnect from peer */
    disconnect(peerId: string): Promise<void>;
    /** Get network stats */
    getStats(): Promise<NetworkStats>;
    /** Get peers */
    getPeers(): Promise<Peer[]>;
  };

  /**
   * Blockchain events
   */
  events: {
    /** Subscribe to block events */
    onBlock(callback: (block: DAGNode) => void): () => void;
    /** Subscribe to transaction events */
    onTransaction(callback: (transaction: Transaction) => void): () => void;
    /** Subscribe to consensus events */
    onConsensus(callback: (status: ConsensusStatus) => void): () => void;
    /** Subscribe to network events */
    onNetwork(callback: (stats: NetworkStats) => void): () => void;
  };
}

/**
 * Blockchain configuration
 */
export interface BlockchainConfig {
  /** DAG configuration */
  dag: DAGConfig;
  /** Crypto configuration */
  crypto: CryptoConfig;
  /** Consensus configuration */
  consensus: ConsensusConfig;
  /** Network configuration */
  network: {
    /** Listen addresses */
    listenAddresses: NetworkAddress[];
    /** Maximum number of peers */
    maxPeers: number;
    /** Enable peer discovery */
    enableDiscovery: boolean;
    /** Enable DHT */
    enableDHT: boolean;
    /** Bootstrap nodes */
    bootstrapNodes: NetworkAddress[];
    /** NAT traversal enabled */
    enableNatTraversal: boolean;
  };
  /** Storage configuration */
  storage: {
    /** Storage backend */
    backend: 'memory' | 'rocksdb' | 'postgres';
    /** Database path */
    databasePath?: string;
    /** Enable compression */
    enableCompression: boolean;
    /** Enable backup */
    backupEnabled: boolean;
    /** Backup interval in seconds */
    backupIntervalSecs: number;
  };
  /** Logging configuration */
  logging: {
    /** Log level */
    level: 'error' | 'warn' | 'info' | 'debug' | 'trace';
    /** Enable file logging */
    enableFileLogging: boolean;
    /** Log file path */
    logFilePath?: string;
    /** Enable structured logging */
    enableStructuredLogging: boolean;
  };
  /** API configuration */
  api: {
    /** Enable HTTP API */
    enableHttpApi: boolean;
    /** HTTP API port */
    httpApiPort: number;
    /** Enable WebSocket API */
    enableWebSocketApi: boolean;
    /** WebSocket API port */
    webSocketApiPort: number;
    /** API rate limiting */
    enableRateLimiting: boolean;
    /** Rate limit requests per minute */
    rateLimitRpm: number;
    /** Enable CORS */
    enableCors: boolean;
    /** CORS origins */
    corsOrigins: string[];
  };
}

/**
 * Blockchain status
 */
export interface BlockchainStatus {
  /** Whether the blockchain is running */
  isRunning: boolean;
  /** Current block height */
  currentHeight: number;
  /** Network ID */
  networkId: string;
  /** Chain ID */
  chainId: string;
  /** Version */
  version: string;
  /** Start time */
  startTime: Timestamp;
  /** Uptime in seconds */
  uptime: number;
  /** Number of connected peers */
  connectedPeers: number;
  /** Memory usage in bytes */
  memoryUsage: number;
  /** CPU usage percentage */
  cpuUsage: number;
  /** Disk usage in bytes */
  diskUsage: number;
  /** Transaction pool size */
  transactionPoolSize: number;
  /** Last block time */
  lastBlockTime: Timestamp;
  /** Sync status */
  syncStatus: SyncStatus;
  /** Consensus status */
  consensusStatus: ConsensusStatus;
  /** Health score (0-100) */
  healthScore: number;
}

/**
 * Blockchain metrics
 */
export interface BlockchainMetrics {
  /** DAG metrics */
  dag: DAGMetrics;
  /** Consensus metrics */
  consensus: ConsensusMetrics;
  /** Network metrics */
  network: NetworkStats;
  /** System metrics */
  system: {
    /** CPU usage percentage */
    cpuUsage: number;
    /** Memory usage in bytes */
    memoryUsage: number;
    /** Memory usage percentage */
    memoryUsagePercent: number;
    /** Disk usage in bytes */
    diskUsage: number;
    /** Disk usage percentage */
    diskUsagePercent: number;
    /** Network I/O */
    networkIO: {
      bytesSent: number;
      bytesReceived: number;
    };
    /** System uptime */
    uptime: number;
    /** Load average */
    loadAverage: [number, number, number];
  };
  /** Performance metrics */
  performance: {
    /** Transactions per second */
    tps: number;
    /** Average block time in milliseconds */
    avgBlockTime: number;
    /** Average confirmation time in milliseconds */
    avgConfirmationTime: number;
    /** Average transaction fee */
    avgTransactionFee: bigint;
    /** Success rate (0-1) */
    successRate: number;
  };
  /** Economic metrics */
  economic: {
    /** Total supply */
    totalSupply: bigint;
    /** Circulating supply */
    circulatingSupply: bigint;
    /** Market cap */
    marketCap: bigint;
    /** Total staked */
    totalStaked: bigint;
    /** Staking rate (0-1) */
    stakingRate: number;
    /** Inflation rate (0-1) */
    inflationRate: number;
  };
}

/**
 * Default configuration
 */
export const DefaultBlockchainConfig: BlockchainConfig = {
  dag: {
    maxTransactionsPerBlock: 1000,
    maxParents: 8,
    blockTimeTargetMs: 1000,
    enablePrioritization: true,
    enableParallelExecution: true,
    transactionPoolSize: 10000,
    cacheSize: 1000,
    pruningEnabled: true,
    pruningThreshold: 10000,
  },
  crypto: {
    algorithm: 'hybrid' as any,
    signatureAlgorithm: 'dilithium' as any,
    hashAlgorithm: 'blake3' as any,
    enableQuantumSignatures: true,
    enableKeyRotation: true,
    keyRotationIntervalSecs: 86400,
    cacheSize: 1000,
    enableHSM: false,
  },
  consensus: {
    algorithm: 'pbft' as any,
    numValidators: 21,
    minValidators: 7,
    blockReward: 1000000000000000000n, // 1 ETH in wei
    minStake: 32000000000000000000n, // 32 ETH in wei
    maxStake: 1000000000000000000000n, // 1000 ETH in wei
    proposalTimeoutMs: 5000,
    votingTimeoutMs: 10000,
    commitTimeoutMs: 5000,
    blockTimeTargetMs: 1000,
    quorumThreshold: 0.67,
    enableViewChanges: true,
    viewChangeTimeoutMs: 30000,
    maxViewChanges: 10,
    enableSlashing: true,
    slashAmount: 1000000000000000000n, // 1 ETH in wei
    enablePerformanceRewards: true,
    performanceRewardMultiplier: 1.5,
  },
  network: {
    listenAddresses: ['/ip4/0.0.0.0/tcp/30333'],
    maxPeers: 50,
    enableDiscovery: true,
    enableDHT: true,
    bootstrapNodes: [],
    enableNatTraversal: true,
  },
  storage: {
    backend: 'rocksdb',
    databasePath: './data',
    enableCompression: true,
    backupEnabled: true,
    backupIntervalSecs: 3600,
  },
  logging: {
    level: 'info',
    enableFileLogging: true,
    logFilePath: './logs/kaldrix.log',
    enableStructuredLogging: true,
  },
  api: {
    enableHttpApi: true,
    httpApiPort: 8080,
    enableWebSocketApi: true,
    webSocketApiPort: 8081,
    enableRateLimiting: true,
    rateLimitRpm: 60,
    enableCors: true,
    corsOrigins: ['*'],
  },
};

/**
 * Create a new KALDRIX blockchain instance
 */
export async function createKaldrixBlockchain(
  config: BlockchainConfig = DefaultBlockchainConfig
): Promise<KaldrixBlockchain> {
  // This would be implemented to connect to the Rust backend
  // For now, it's a placeholder that would make API calls to the backend
  
  throw new Error('Not implemented - connect to Rust backend via API');
}

// Default export
export default createKaldrixBlockchain;