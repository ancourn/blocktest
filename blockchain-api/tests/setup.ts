import { vi } from 'vitest';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.API_PORT = '3001';
process.env.API_HOST = '0.0.0.0';
process.env.RATE_LIMIT_MAX = '1000';
process.env.RATE_LIMIT_WINDOW = '1m';
process.env.CORS_ORIGIN = 'http://localhost:3000';

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  // Uncomment to ignore specific log levels
  // log: vi.fn(),
  // warn: vi.fn(),
  // error: vi.fn(),
};

// Mock BlockchainService
vi.mock('../../src/lib/blockchain-service', () => ({
  BlockchainService: vi.fn().mockImplementation(() => ({
    // DAG methods
    getDagState: vi.fn().mockResolvedValue({
      nodes: [],
      total: 0,
      tips: [],
      metrics: {
        totalNodes: 0,
        totalTransactions: 0,
        confirmationTime: 0,
        throughput: 0,
      },
    }),
    getNode: vi.fn().mockResolvedValue(null),
    getTips: vi.fn().mockResolvedValue([]),
    getNodeHistory: vi.fn().mockResolvedValue({
      node: null,
      history: [],
      depth: 0,
    }),
    
    // Status methods
    getStatus: vi.fn().mockResolvedValue({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      metrics: {
        totalNodes: 0,
        totalTransactions: 0,
        confirmedTransactions: 0,
        pendingTransactions: 0,
        networkThroughput: 0,
        averageConfirmationTime: 0,
        activeValidators: 0,
        quantumSecurity: true,
      },
      version: '1.0.0',
    }),
    getNetworkInfo: vi.fn().mockResolvedValue({
      networkId: 'test-network',
      version: '1.0.0',
      peers: [],
      totalPeers: 0,
      syncStatus: {
        isSyncing: false,
        currentBlock: '0',
        highestBlock: '0',
        progress: 100,
      },
    }),
    getQuantumSecurityStatus: vi.fn().mockResolvedValue({
      enabled: true,
      algorithm: 'CRYSTALS-Kyber',
      keySize: 256,
      lastRotation: new Date().toISOString(),
      nextRotation: new Date(Date.now() + 86400000).toISOString(),
      securityLevel: 'high',
      metrics: {
        signaturesVerified: 0,
        encryptionOperations: 0,
        keyGenerationTime: 0,
        verificationTime: 0,
      },
    }),
    
    // Transaction methods
    submitTransaction: vi.fn().mockResolvedValue({
      transactionId: 'tx_test_' + Date.now(),
      status: 'pending',
    }),
    getTransaction: vi.fn().mockResolvedValue(null),
    getTransactions: vi.fn().mockResolvedValue({
      transactions: [],
      total: 0,
    }),
    validateTransaction: vi.fn().mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
      estimatedFee: 0.001,
      estimatedConfirmationTime: 2.5,
    }),
    getAddressTransactionHistory: vi.fn().mockResolvedValue(null),
    getPendingTransactions: vi.fn().mockResolvedValue({
      transactions: [],
      count: 0,
      totalFees: 0,
      oldestTransaction: new Date().toISOString(),
    }),
    getTransactionFees: vi.fn().mockResolvedValue({
      baseFee: 0.001,
      priorityFee: 0.0001,
      estimatedFee: 0.0011,
      feeHistory: [],
      recommendations: {
        slow: 0.001,
        average: 0.0011,
        fast: 0.002,
      },
    }),
    
    // Wallet methods
    createWallet: vi.fn().mockResolvedValue({
      id: 'wallet_test_' + Date.now(),
      address: 'kx1test' + Math.random().toString(36).substr(2, 9),
      publicKey: '0x' + Math.random().toString(36).substr(2, 64),
      name: 'Test Wallet',
      type: 'standard',
      createdAt: new Date().toISOString(),
    }),
    importWallet: vi.fn().mockResolvedValue({
      id: 'wallet_imported_' + Date.now(),
      address: 'kx1imported' + Math.random().toString(36).substr(2, 9),
      publicKey: '0x' + Math.random().toString(36).substr(2, 64),
      name: 'Imported Wallet',
      importedAt: new Date().toISOString(),
    }),
    getWallet: vi.fn().mockResolvedValue(null),
    updateWallet: vi.fn().mockResolvedValue(null),
    getWalletBalance: vi.fn().mockResolvedValue({
      address: 'kx1test' + Math.random().toString(36).substr(2, 9),
      confirmed: 1000,
      pending: 0,
    }),
    signTransaction: vi.fn().mockResolvedValue({
      transaction: {},
      signature: '0x' + Math.random().toString(36).substr(2, 128),
    }),
    exportWallet: vi.fn().mockResolvedValue({
      format: 'privateKey',
      data: '0x' + Math.random().toString(36).substr(2, 64),
    }),
    listWallets: vi.fn().mockResolvedValue({
      wallets: [],
      total: 0,
      limit: 20,
      offset: 0,
    }),
    deleteWallet: vi.fn().mockResolvedValue(true),
    
    // Consensus methods
    getConsensusStatus: vi.fn().mockResolvedValue({
      algorithm: 'PBFT',
      status: 'active',
      round: 1,
      phase: 'prepare',
      validators: {
        total: 21,
        active: 20,
        required: 15,
      },
      lastBlock: 'block_0',
      timestamp: new Date().toISOString(),
      metrics: {
        blockTime: 2.5,
        finalityTime: 5.0,
        throughput: 1500,
        successRate: 99.9,
      },
    }),
    getValidators: vi.fn().mockResolvedValue({
      validators: [],
      total: 0,
      limit: 100,
      offset: 0,
      filters: {},
    }),
    getValidator: vi.fn().mockResolvedValue(null),
    getConsensusMetrics: vi.fn().mockResolvedValue({
      timeframe: '24h',
      metrics: {
        blockTime: {
          average: 2.5,
          median: 2.4,
          min: 1.8,
          max: 3.2,
        },
        finalityTime: {
          average: 5.0,
          median: 4.8,
          min: 3.5,
          max: 6.2,
        },
        throughput: {
          tps: 1500,
          blockCount: 100,
          transactionCount: 150000,
        },
        successRate: 99.9,
        validatorParticipation: 98.5,
        forkRate: 0.1,
      },
      timestamp: new Date().toISOString(),
    }),
    getProposals: vi.fn().mockResolvedValue({
      proposals: [],
      total: 0,
      limit: 20,
      offset: 0,
      filters: {},
    }),
    submitVote: vi.fn().mockResolvedValue({
      status: 'success',
    }),
    getConsensusHistory: vi.fn().mockResolvedValue({
      events: [],
      total: 0,
      limit: 100,
      offset: 0,
      filters: {},
    }),
    getForkInformation: vi.fn().mockResolvedValue({
      activeForks: [],
      resolvedForks: [],
      totalForks: 0,
      resolutionRate: 100,
    }),
    getValidatorRewards: vi.fn().mockResolvedValue({
      totalRewards: 0,
      timeframe: '24h',
      rewards: [],
      distribution: {
        topValidators: [],
      },
    }),
    getLatestBlocks: vi.fn().mockResolvedValue([]),
    
    // Event methods
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  })),
}));

// Setup global test utilities
global.describe = describe;
global.it = it;
global.expect = expect;
global.vi = vi;
global.beforeEach = beforeEach;
global.afterEach = afterEach;
global.beforeAll = beforeAll;
global.afterAll = afterAll;

// Test timeout
vi.setConfig({ testTimeout: 10000 });

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Global test setup
beforeAll(() => {
  // Initialize test database connections, etc.
});

afterAll(() => {
  // Clean up test database connections, etc.
});