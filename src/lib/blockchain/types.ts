/**
 * Core types for KALDRIX blockchain
 * TypeScript type definitions for blockchain data structures
 */

/**
 * 32-byte hash type (used for block hashes, transaction IDs, etc.)
 */
export type Hash = Uint8Array & { readonly __brand: unique symbol };

/**
 * Block hash type (32 bytes)
 */
export type BlockHash = Hash;

/**
 * Transaction ID type (32 bytes)
 */
export type TransactionId = Hash;

/**
 * Public key type (32 bytes)
 */
export type PublicKey = Uint8Array & { readonly __brand: unique symbol };

/**
 * Private key type (variable length depending on algorithm)
 */
export type PrivateKey = Uint8Array & { readonly __brand: unique symbol };

/**
 * Signature type (variable length depending on algorithm)
 */
export type Signature = Uint8Array & { readonly __brand: unique symbol };

/**
 * Amount type (128-bit unsigned integer)
 */
export type Amount = bigint;

/**
 * Gas price type
 */
export type GasPrice = bigint;

/**
 * Gas limit type
 */
export type GasLimit = bigint;

/**
 * Nonce type
 */
export type Nonce = number;

/**
 * Timestamp type (milliseconds since epoch)
 */
export type Timestamp = number;

/**
 * Block height type
 */
export type BlockHeight = number;

/**
 * Validator ID type
 */
export type ValidatorId = string;

/**
 * Network address type
 */
export type NetworkAddress = string;

/**
 * Cryptographic key types
 */
export enum KeyType {
  /** CRYSTALS-Kyber (KEM) */
  Kyber = 'kyber',
  /** CRYSTALS-Dilithium (Signature) */
  Dilithium = 'dilithium',
  /** SPHINCS+ (Signature) */
  SphincsPlus = 'sphincs_plus',
  /** Falcon (Signature) */
  Falcon = 'falcon',
  /** Ed25519 (for compatibility) */
  Ed25519 = 'ed25519',
  /** Hybrid approach */
  Hybrid = 'hybrid',
}

/**
 * Hash algorithms
 */
export enum HashAlgorithm {
  /** BLAKE3 */
  Blake3 = 'blake3',
  /** SHA3-256 */
  Sha3_256 = 'sha3_256',
  /** SHA3-512 */
  Sha3_512 = 'sha3_512',
  /** Keccak256 */
  Keccak256 = 'keccak256',
}

/**
 * Signature algorithms
 */
export enum SignatureAlgorithm {
  /** CRYSTALS-Dilithium */
  Dilithium = 'dilithium',
  /** SPHINCS+ */
  SphincsPlus = 'sphincs_plus',
  /** Falcon */
  Falcon = 'falcon',
  /** Ed25519 */
  Ed25519 = 'ed25519',
}

/**
 * Crypto algorithms
 */
export enum CryptoAlgorithm {
  /** CRYSTALS-Kyber */
  Kyber = 'kyber',
  /** Hybrid approach */
  Hybrid = 'hybrid',
}

/**
 * Consensus algorithms
 */
export enum ConsensusAlgorithm {
  /** Practical Byzantine Fault Tolerance */
  PBFT = 'pbft',
  /** Proof of Stake */
  PoS = 'pos',
  /** Delegated Proof of Stake */
  DPoS = 'dpos',
  /** Hybrid approach */
  Hybrid = 'hybrid',
}

/**
 * Validator status
 */
export enum ValidatorStatus {
  /** Active validator */
  Active = 'active',
  /** Inactive validator */
  Inactive = 'inactive',
  /** Slashed validator */
  Slashed = 'slashed',
  /** Pending activation */
  Pending = 'pending',
  /** Retired */
  Retired = 'retired',
}

/**
 * Consensus state
 */
export enum ConsensusState {
  /** Idle state */
  Idle = 'idle',
  /** Proposing block */
  Proposing = 'proposing',
  /** Voting on block */
  Voting = 'voting',
  /** Committing block */
  Committing = 'committing',
  /** View change in progress */
  ViewChange = 'view_change',
  /** Synchronizing */
  Synchronizing = 'synchronizing',
}

/**
 * Vote types
 */
export enum VoteType {
  /** Pre-vote (for PBFT) */
  PreVote = 'pre_vote',
  /** Pre-commit (for PBFT) */
  PreCommit = 'pre_commit',
  /** Final commit */
  Commit = 'commit',
}

/**
 * Security levels
 */
export enum SecurityLevel {
  /** Basic security */
  Basic = 'basic',
  /** Standard security */
  Standard = 'standard',
  /** High security */
  High = 'high',
  /** Quantum resistant */
  QuantumResistant = 'quantum_resistant',
  /** Hybrid approach */
  Hybrid = 'hybrid',
}

/**
 * Network peer status
 */
export enum PeerStatus {
  /** Connected */
  Connected = 'connected',
  /** Disconnected */
  Disconnected = 'disconnected',
  /** Connecting */
  Connecting = 'connecting',
  /** Banned */
  Banned = 'banned',
  /** Trusted */
  Trusted = 'trusted',
}

/**
 * Transaction status
 */
export enum TransactionStatus {
  /** Pending in mempool */
  Pending = 'pending',
  /** Included in block */
  Confirmed = 'confirmed',
  /** Failed */
  Failed = 'failed',
  /** Replaced by higher fee transaction */
  Replaced = 'replaced',
  /** Expired */
  Expired = 'expired',
}

/**
 * Block status
 */
export enum BlockStatus {
  /** Valid block */
  Valid = 'valid',
  /** Invalid block */
  Invalid = 'invalid',
  /** Orphan block */
  Orphan = 'orphan',
  /** Stale block */
  Stale = 'stale',
}

/**
 * Key pair structure
 */
export interface KeyPair {
  /** Public key */
  publicKey: PublicKey;
  /** Private key */
  privateKey: PrivateKey;
  /** Key pair ID */
  id: string;
  /** Creation timestamp */
  createdAt: Timestamp;
  /** Key type */
  keyType: KeyType;
  /** Additional metadata */
  metadata: Record<string, string>;
}

/**
 * Validator information
 */
export interface Validator {
  /** Validator ID */
  id: ValidatorId;
  /** Validator public key */
  publicKey: PublicKey;
  /** Stake amount */
  stake: Amount;
  /** Validator status */
  status: ValidatorStatus;
  /** When the validator joined */
  joinedAt: Date;
  /** Last active timestamp */
  lastActive: Date;
  /** Performance metrics */
  performance: ValidatorPerformance;
  /** Geographic region */
  region: string;
}

/**
 * Validator performance metrics
 */
export interface ValidatorPerformance {
  /** Uptime percentage (0-100) */
  uptime: number;
  /** Number of blocks proposed */
  blocksProposed: number;
  /** Number of blocks missed */
  blocksMissed: number;
  /** Average response time in milliseconds */
  avgResponseTime: number;
  /** Success rate (0-1) */
  successRate: number;
  /** Total rewards earned */
  totalRewards: Amount;
  /** Slashing count */
  slashingCount: number;
  /** Last performance update */
  lastUpdate: Date;
}

/**
 * Network peer information
 */
export interface Peer {
  /** Peer ID */
  id: string;
  /** Network addresses */
  addresses: NetworkAddress[];
  /** Peer status */
  status: PeerStatus;
  /** Connected since */
  connectedSince?: Date;
  /** Peer version */
  version: string;
  /** Supported protocols */
  protocols: string[];
  /** Geographic region */
  region?: string;
  /** Latency in milliseconds */
  latency?: number;
  /** Additional metadata */
  metadata: Record<string, string>;
}

/**
 * Network statistics
 */
export interface NetworkStats {
  /** Total number of peers */
  totalPeers: number;
  /** Number of connected peers */
  connectedPeers: number;
  /** Number of trusted peers */
  trustedPeers: number;
  /** Average latency in milliseconds */
  avgLatency: number;
  /** Network throughput in bytes per second */
  throughput: number;
  /** Total data sent in bytes */
  totalDataSent: number;
  /** Total data received in bytes */
  totalDataReceived: number;
  /** Network uptime percentage */
  uptime: number;
}

/**
 * Consensus message types
 */
export enum ConsensusMessageType {
  /** Block proposal */
  BlockProposal = 'block_proposal',
  /** Vote message */
  Vote = 'vote',
  /** Commit message */
  Commit = 'commit',
  /** View change message */
  ViewChange = 'view_change',
  /** Sync request */
  SyncRequest = 'sync_request',
  /** Sync response */
  SyncResponse = 'sync_response',
}

/**
 * Base consensus message
 */
export interface ConsensusMessage {
  /** Message type */
  type: ConsensusMessageType;
  /** Sender ID */
  senderId: ValidatorId;
  /** Message timestamp */
  timestamp: Timestamp;
  /** Message signature */
  signature: Signature;
  /** Round number */
  round: number;
  /** View number */
  view: number;
}

/**
 * Block proposal message
 */
export interface BlockProposalMessage extends ConsensusMessage {
  /** Proposed block */
  block: any; // Will be typed as DAGNode when imported
  /** Justification */
  justification?: string;
}

/**
 * Vote message
 */
export interface VoteMessage extends ConsensusMessage {
  /** Block hash being voted on */
  blockHash: BlockHash;
  /** Vote type */
  voteType: VoteType;
  /** Vote justification */
  justification?: string;
}

/**
 * Commit message
 */
export interface CommitMessage extends ConsensusMessage {
  /** Block hash being committed */
  blockHash: BlockHash;
  /** Commit justification */
  justification?: string;
}

/**
 * View change message
 */
export interface ViewChangeMessage extends ConsensusMessage {
  /** New view number */
  newView: number;
  /** Reason for view change */
  reason: string;
  /** Evidence */
  evidence?: any;
}

/**
 * Sync request message
 */
export interface SyncRequestMessage extends ConsensusMessage {
  /** Starting block height */
  startHeight: BlockHeight;
  /** Ending block height */
  endHeight?: BlockHeight;
  /** Requested data types */
  dataTypes: string[];
}

/**
 * Sync response message
 */
export interface SyncResponseMessage extends ConsensusMessage {
  /** Requested data */
  data: any[];
  /** Whether this is the last batch */
  isLast: boolean;
}

/**
 * Cryptographic operation result
 */
export interface CryptoResult {
  /** Operation success */
  success: boolean;
  /** Operation result data */
  data: Uint8Array;
  /** Operation duration in microseconds */
  durationUs: number;
  /** Operation type */
  operation: string;
  /** Additional metadata */
  metadata: Record<string, string>;
}

/**
 * Cryptographic performance statistics
 */
export interface CryptoPerformanceStats {
  /** Total operations */
  totalOperations: number;
  /** Failed operations */
  failedOperations: number;
  /** Average signing time in microseconds */
  avgSigningTimeUs: number;
  /** Average verification time in microseconds */
  avgVerificationTimeUs: number;
  /** Average encryption time in microseconds */
  avgEncryptionTimeUs: number;
  /** Average decryption time in microseconds */
  avgDecryptionTimeUs: number;
  /** Cache hit rate (0-1) */
  cacheHitRate: number;
  /** Operation throughput (operations per second) */
  throughputOpsPerSec: number;
}

/**
 * System metrics
 */
export interface SystemMetrics {
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
  /** Network I/O bytes */
  networkIO: {
    bytesSent: number;
    bytesReceived: number;
  };
  /** System uptime in seconds */
  uptime: number;
  /** Load average (1, 5, 15 minutes) */
  loadAverage: [number, number, number];
  /** Process count */
  processCount: number;
  /** Thread count */
  threadCount: number;
}

/**
 * Error types
 */
export enum ErrorType {
  /** General error */
  General = 'general',
  /** Network error */
  Network = 'network',
  /** Cryptographic error */
  Crypto = 'crypto',
  /** Consensus error */
  Consensus = 'consensus',
  /** DAG error */
  DAG = 'dag',
  /** Transaction error */
  Transaction = 'transaction',
  /** Block error */
  Block = 'block',
  /** Validator error */
  Validator = 'validator',
  /** Configuration error */
  Configuration = 'configuration',
  /** Storage error */
  Storage = 'storage',
  /** API error */
  API = 'api',
}

/**
 * Base error interface
 */
export interface BaseError {
  /** Error type */
  type: ErrorType;
  /** Error message */
  message: string;
  /** Error code */
  code: string;
  /** Timestamp */
  timestamp: Timestamp;
  /** Stack trace */
  stack?: string;
  /** Additional context */
  context?: Record<string, any>;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = any> {
  /** Whether the request was successful */
  success: boolean;
  /** Response data */
  data?: T;
  /** Error information */
  error?: BaseError;
  /** Response timestamp */
  timestamp: Timestamp;
  /** Request ID */
  requestId: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  /** Pagination information */
  pagination: {
    /** Current page number */
    page: number;
    /** Items per page */
    perPage: number;
    /** Total number of items */
    total: number;
    /** Total number of pages */
    totalPages: number;
    /** Whether there's a next page */
    hasNext: boolean;
    /** Whether there's a previous page */
    hasPrevious: boolean;
  };
}

/**
 * WebSocket message types
 */
export enum WebSocketMessageType {
  /** Block update */
  BlockUpdate = 'block_update',
  /** Transaction update */
  TransactionUpdate = 'transaction_update',
  /** Consensus update */
  ConsensusUpdate = 'consensus_update',
  /** Network update */
  NetworkUpdate = 'network_update',
  /** Metrics update */
  MetricsUpdate = 'metrics_update',
  /** Error message */
  Error = 'error',
  /** Heartbeat */
  Heartbeat = 'heartbeat',
}

/**
 * Base WebSocket message
 */
export interface WebSocketMessage {
  /** Message type */
  type: WebSocketMessageType;
  /** Message ID */
  id: string;
  /** Timestamp */
  timestamp: Timestamp;
  /** Payload data */
  data: any;
}

/**
 * Utility functions for type conversions
 */
export const TypeUtils = {
  /**
   * Convert hex string to Uint8Array
   */
  hexToBytes(hex: string): Uint8Array {
    return new Uint8Array(Buffer.from(hex, 'hex'));
  },

  /**
   * Convert Uint8Array to hex string
   */
  bytesToHex(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString('hex');
  },

  /**
   * Convert string to Uint8Array
   */
  stringToBytes(str: string): Uint8Array {
    return new TextEncoder().encode(str);
  },

  /**
   * Convert Uint8Array to string
   */
  bytesToString(bytes: Uint8Array): string {
    return new TextDecoder().decode(bytes);
  },

  /**
   * Create a typed hash from bytes
   */
  createHash(bytes: Uint8Array): Hash {
    if (bytes.length !== 32) {
      throw new Error('Hash must be 32 bytes');
    }
    return bytes as Hash;
  },

  /**
   * Create a typed public key from bytes
   */
  createPublicKey(bytes: Uint8Array): PublicKey {
    if (bytes.length !== 32) {
      throw new Error('Public key must be 32 bytes');
    }
    return bytes as PublicKey;
  },

  /**
   * Create a typed private key from bytes
   */
  createPrivateKey(bytes: Uint8Array): PrivateKey {
    return bytes as PrivateKey;
  },

  /**
   * Create a typed signature from bytes
   */
  createSignature(bytes: Uint8Array): Signature {
    return bytes as Signature;
  },

  /**
   * Validate hash format
   */
  validateHash(hash: Hash): boolean {
    return hash.length === 32;
  },

  /**
   * Validate public key format
   */
  validatePublicKey(publicKey: PublicKey): boolean {
    return publicKey.length === 32;
  },

  /**
   * Generate random bytes
   */
  randomBytes(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
  },

  /**
   * Generate random hash
   */
  randomHash(): Hash {
    return this.createHash(this.randomBytes(32));
  },

  /**
   * Generate random public key
   */
  randomPublicKey(): PublicKey {
    return this.createPublicKey(this.randomBytes(32));
  },
};

export default TypeUtils;