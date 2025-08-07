import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { websocketHandler, setupEventBroadcasters } from '../ws/handler';
import { BlockchainService } from '../../src/lib/blockchain-service';

// Mock BlockchainService
vi.mock('../../src/lib/blockchain-service', () => ({
  BlockchainService: vi.fn().mockImplementation(() => ({
    getDagState: vi.fn().mockResolvedValue({
      nodes: [],
      total: 0,
      tips: [],
      metrics: {},
    }),
    getPendingTransactions: vi.fn().mockResolvedValue({
      transactions: [],
      count: 0,
      totalFees: 0,
    }),
    getConsensusStatus: vi.fn().mockResolvedValue({
      algorithm: 'PBFT',
      status: 'active',
      round: 1,
      phase: 'prepare',
    }),
    getLatestBlocks: vi.fn().mockResolvedValue([]),
    getWalletBalance: vi.fn().mockResolvedValue(null),
    getValidator: vi.fn().mockResolvedValue(null),
    getStatus: vi.fn().mockResolvedValue({
      status: 'healthy',
      metrics: {},
    }),
    submitTransaction: vi.fn().mockResolvedValue({
      transactionId: 'tx_123',
      status: 'pending',
    }),
    getTransaction: vi.fn().mockResolvedValue(null),
    getTransactions: vi.fn().mockResolvedValue({
      transactions: [],
      total: 0,
    }),
    getValidators: vi.fn().mockResolvedValue({
      validators: [],
      total: 0,
    }),
    getWallet: vi.fn().mockResolvedValue(null),
    getConsensusHistory: vi.fn().mockResolvedValue({
      events: [],
      total: 0,
    }),
    getForkInformation: vi.fn().mockResolvedValue({
      activeForks: [],
      resolvedForks: [],
      totalForks: 0,
    }),
    getValidatorRewards: vi.fn().mockResolvedValue({
      totalRewards: 0,
      rewards: [],
    }),
    on: vi.fn(),
    off: vi.fn(),
  })),
}));

describe('WebSocket Handler', () => {
  let io: Server;
  let server: any;
  let blockchainService: BlockchainService;
  let mockSocket: any;

  beforeEach(() => {
    server = createServer();
    io = new Server(server);
    blockchainService = new BlockchainService();
    
    // Mock socket
    mockSocket = {
      id: 'test-socket-id',
      emit: vi.fn(),
      on: vi.fn(),
      join: vi.fn(),
      leave: vi.fn(),
      rooms: new Set(),
      connected: true,
      subscriptions: new Set(),
      server: {
        jwt: {
          verify: vi.fn(),
        },
      },
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (io) {
      io.close();
    }
    if (server) {
      server.close();
    }
  });

  describe('Connection Handling', () => {
    it('should send welcome message on connection', () => {
      websocketHandler(mockSocket, io, blockchainService);

      expect(mockSocket.emit).toHaveBeenCalledWith('welcome', {
        message: 'Connected to KALDRIX Blockchain WebSocket API',
        timestamp: expect.any(String),
        version: '1.0.0',
        supported_events: expect.arrayContaining([
          'authenticate',
          'subscribe',
          'unsubscribe',
          'get_subscriptions',
          'request_data',
          'submit_transaction',
          'get_status',
          'ping',
        ]),
      });
    });

    it('should initialize subscriptions set', () => {
      websocketHandler(mockSocket, io, blockchainService);

      expect(mockSocket.subscriptions).toBeInstanceOf(Set);
      expect(mockSocket.subscriptions.size).toBe(0);
    });
  });

  describe('Authentication', () => {
    it('should handle successful authentication', () => {
      const mockToken = 'valid.jwt.token';
      const mockDecoded = { userId: 'user123', permissions: ['read'] };

      mockSocket.server.jwt.verify.mockReturnValue(mockDecoded);

      websocketHandler(mockSocket, io, blockchainService);

      // Simulate authenticate event
      const authenticateHandler = mockSocket.on.mock.calls.find(
        ([event]) => event === 'authenticate'
      )?.[1];

      if (authenticateHandler) {
        authenticateHandler({ token: mockToken });

        expect(mockSocket.server.jwt.verify).toHaveBeenCalledWith(mockToken);
        expect(mockSocket.user).toEqual({
          userId: 'user123',
          permissions: ['read'],
        });
        expect(mockSocket.emit).toHaveBeenCalledWith('authenticated', {
          success: true,
          userId: 'user123',
          permissions: ['read'],
        });
      }
    });

    it('should handle authentication failure', () => {
      const mockToken = 'invalid.jwt.token';

      mockSocket.server.jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      websocketHandler(mockSocket, io, blockchainService);

      // Simulate authenticate event
      const authenticateHandler = mockSocket.on.mock.calls.find(
        ([event]) => event === 'authenticate'
      )?.[1];

      if (authenticateHandler) {
        authenticateHandler({ token: mockToken });

        expect(mockSocket.emit).toHaveBeenCalledWith('authenticated', {
          success: false,
          error: 'Invalid token',
        });
      }
    });
  });

  describe('Subscription Management', () => {
    beforeEach(() => {
      mockSocket.user = { userId: 'user123', permissions: ['read'] };
    });

    it('should handle DAG subscription', () => {
      websocketHandler(mockSocket, io, blockchainService);

      // Simulate subscribe event
      const subscribeHandler = mockSocket.on.mock.calls.find(
        ([event]) => event === 'subscribe'
      )?.[1];

      if (subscribeHandler) {
        subscribeHandler({ type: 'dag' });

        expect(mockSocket.subscriptions.has('dag')).toBe(true);
        expect(blockchainService.getDagState).toHaveBeenCalledWith(10, 0);
        expect(mockSocket.emit).toHaveBeenCalledWith('dag:init', expect.any(Object));
        expect(mockSocket.emit).toHaveBeenCalledWith('subscribed', {
          type: 'dag',
          success: true,
        });
      }
    });

    it('should handle transaction subscription', () => {
      websocketHandler(mockSocket, io, blockchainService);

      // Simulate subscribe event
      const subscribeHandler = mockSocket.on.mock.calls.find(
        ([event]) => event === 'subscribe'
      )?.[1];

      if (subscribeHandler) {
        subscribeHandler({ type: 'transactions' });

        expect(mockSocket.subscriptions.has('transactions')).toBe(true);
        expect(blockchainService.getPendingTransactions).toHaveBeenCalledWith(10);
        expect(mockSocket.emit).toHaveBeenCalledWith('transactions:init', expect.any(Object));
        expect(mockSocket.emit).toHaveBeenCalledWith('subscribed', {
          type: 'transactions',
          success: true,
        });
      }
    });

    it('should reject unauthenticated subscription to protected types', () => {
      mockSocket.user = undefined;
      websocketHandler(mockSocket, io, blockchainService);

      // Simulate subscribe event
      const subscribeHandler = mockSocket.on.mock.calls.find(
        ([event]) => event === 'subscribe'
      )?.[1];

      if (subscribeHandler) {
        subscribeHandler({ type: 'consensus' });

        expect(mockSocket.emit).toHaveBeenCalledWith('error', {
          message: 'Authentication required',
        });
      }
    });

    it('should handle unsubscription', () => {
      mockSocket.subscriptions.add('dag');
      websocketHandler(mockSocket, io, blockchainService);

      // Simulate unsubscribe event
      const unsubscribeHandler = mockSocket.on.mock.calls.find(
        ([event]) => event === 'unsubscribe'
      )?.[1];

      if (unsubscribeHandler) {
        unsubscribeHandler({ type: 'dag' });

        expect(mockSocket.subscriptions.has('dag')).toBe(false);
        expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribed', {
          type: 'dag',
          success: true,
        });
      }
    });

    it('should handle unsubscription from non-subscribed type', () => {
      websocketHandler(mockSocket, io, blockchainService);

      // Simulate unsubscribe event
      const unsubscribeHandler = mockSocket.on.mock.calls.find(
        ([event]) => event === 'unsubscribe'
      )?.[1];

      if (unsubscribeHandler) {
        unsubscribeHandler({ type: 'dag' });

        expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribed', {
          type: 'dag',
          success: false,
          error: 'Not subscribed',
        });
      }
    });

    it('should handle get subscriptions', () => {
      mockSocket.subscriptions.add('dag');
      mockSocket.subscriptions.add('transactions');
      websocketHandler(mockSocket, io, blockchainService);

      // Simulate get_subscriptions event
      const getSubscriptionsHandler = mockSocket.on.mock.calls.find(
        ([event]) => event === 'get_subscriptions'
      )?.[1];

      if (getSubscriptionsHandler) {
        getSubscriptionsHandler();

        expect(mockSocket.emit).toHaveBeenCalledWith('subscriptions', {
          subscriptions: ['dag', 'transactions'],
        });
      }
    });
  });

  describe('Data Requests', () => {
    beforeEach(() => {
      mockSocket.user = { userId: 'user123', permissions: ['read'] };
    });

    it('should handle DAG data request', () => {
      websocketHandler(mockSocket, io, blockchainService);

      // Simulate request_data event
      const requestDataHandler = mockSocket.on.mock.calls.find(
        ([event]) => event === 'request_data'
      )?.[1];

      if (requestDataHandler) {
        requestDataHandler({ type: 'dag', params: { limit: 5, offset: 0 } });

        expect(blockchainService.getDagState).toHaveBeenCalledWith(5, 0);
        expect(mockSocket.emit).toHaveBeenCalledWith('data_response', {
          type: 'dag',
          data: expect.any(Object),
          timestamp: expect.any(String),
        });
      }
    });

    it('should handle transaction data request', () => {
      websocketHandler(mockSocket, io, blockchainService);

      // Simulate request_data event
      const requestDataHandler = mockSocket.on.mock.calls.find(
        ([event]) => event === 'request_data'
      )?.[1];

      if (requestDataHandler) {
        requestDataHandler({ type: 'transactions', params: { limit: 10 } });

        expect(blockchainService.getTransactions).toHaveBeenCalledWith(10, 0, {});
        expect(mockSocket.emit).toHaveBeenCalledWith('data_response', {
          type: 'transactions',
          data: expect.any(Object),
          timestamp: expect.any(String),
        });
      }
    });

    it('should reject unauthenticated data requests', () => {
      mockSocket.user = undefined;
      websocketHandler(mockSocket, io, blockchainService);

      // Simulate request_data event
      const requestDataHandler = mockSocket.on.mock.calls.find(
        ([event]) => event === 'request_data'
      )?.[1];

      if (requestDataHandler) {
        requestDataHandler({ type: 'consensus' });

        expect(mockSocket.emit).toHaveBeenCalledWith('error', {
          message: 'Authentication required',
        });
      }
    });

    it('should handle invalid data request type', () => {
      websocketHandler(mockSocket, io, blockchainService);

      // Simulate request_data event
      const requestDataHandler = mockSocket.on.mock.calls.find(
        ([event]) => event === 'request_data'
      )?.[1];

      if (requestDataHandler) {
        requestDataHandler({ type: 'invalid_type' });

        expect(mockSocket.emit).toHaveBeenCalledWith('error', {
          message: 'Invalid data type requested',
        });
      }
    });
  });

  describe('Transaction Submission', () => {
    beforeEach(() => {
      mockSocket.user = { userId: 'user123', permissions: ['write'] };
    });

    it('should handle transaction submission', () => {
      const transactionData = {
        sender: 'kx1sender',
        receiver: 'kx1receiver',
        amount: 100,
      };

      websocketHandler(mockSocket, io, blockchainService);

      // Simulate submit_transaction event
      const submitTransactionHandler = mockSocket.on.mock.calls.find(
        ([event]) => event === 'submit_transaction'
      )?.[1];

      if (submitTransactionHandler) {
        submitTransactionHandler(transactionData);

        expect(blockchainService.submitTransaction).toHaveBeenCalledWith(transactionData);
        expect(mockSocket.emit).toHaveBeenCalledWith('transaction_submitted', {
          success: true,
          transactionId: 'tx_123',
          status: 'pending',
          timestamp: expect.any(String),
        });
      }
    });

    it('should reject unauthenticated transaction submission', () => {
      mockSocket.user = undefined;
      websocketHandler(mockSocket, io, blockchainService);

      // Simulate submit_transaction event
      const submitTransactionHandler = mockSocket.on.mock.calls.find(
        ([event]) => event === 'submit_transaction'
      )?.[1];

      if (submitTransactionHandler) {
        submitTransactionHandler({ sender: 'kx1sender', receiver: 'kx1receiver', amount: 100 });

        expect(mockSocket.emit).toHaveBeenCalledWith('error', {
          message: 'Authentication required',
        });
      }
    });

    it('should handle transaction submission errors', () => {
      blockchainService.submitTransaction.mockRejectedValue(new Error('Insufficient balance'));

      const transactionData = {
        sender: 'kx1sender',
        receiver: 'kx1receiver',
        amount: 100,
      };

      websocketHandler(mockSocket, io, blockchainService);

      // Simulate submit_transaction event
      const submitTransactionHandler = mockSocket.on.mock.calls.find(
        ([event]) => event === 'submit_transaction'
      )?.[1];

      if (submitTransactionHandler) {
        submitTransactionHandler(transactionData);

        expect(mockSocket.emit).toHaveBeenCalledWith('error', {
          message: 'Transaction submission failed',
          details: 'Insufficient balance',
        });
      }
    });
  });

  describe('Health Checks', () => {
    it('should handle ping events', () => {
      websocketHandler(mockSocket, io, blockchainService);

      // Simulate ping event
      const pingHandler = mockSocket.on.mock.calls.find(
        ([event]) => event === 'ping'
      )?.[1];

      if (pingHandler) {
        pingHandler();

        expect(mockSocket.emit).toHaveBeenCalledWith('pong', {
          timestamp: expect.any(String),
        });
      }
    });

    it('should handle status requests', () => {
      websocketHandler(mockSocket, io, blockchainService);

      // Simulate get_status event
      const getStatusHandler = mockSocket.on.mock.calls.find(
        ([event]) => event === 'get_status'
      )?.[1];

      if (getStatusHandler) {
        getStatusHandler();

        expect(blockchainService.getStatus).toHaveBeenCalled();
        expect(mockSocket.emit).toHaveBeenCalledWith('status', expect.any(Object));
      }
    });
  });

  describe('Disconnection', () => {
    it('should clean up subscriptions on disconnect', () => {
      mockSocket.subscriptions.add('dag');
      mockSocket.subscriptions.add('transactions');
      
      websocketHandler(mockSocket, io, blockchainService);

      // Simulate disconnect event
      const disconnectHandler = mockSocket.on.mock.calls.find(
        ([event]) => event === 'disconnect'
      )?.[1];

      if (disconnectHandler) {
        disconnectHandler('client disconnect');

        expect(mockSocket.subscriptions.size).toBe(0);
      }
    });
  });
});

describe('Event Broadcasters', () => {
  let io: Server;
  let server: any;
  let blockchainService: BlockchainService;

  beforeEach(() => {
    server = createServer();
    io = new Server(server);
    blockchainService = new BlockchainService();
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (io) {
      io.close();
    }
    if (server) {
      server.close();
    }
  });

  it('should setup blockchain event listeners', () => {
    setupEventBroadcasters(io, blockchainService);

    expect(blockchainService.on).toHaveBeenCalledWith('transaction', expect.any(Function));
    expect(blockchainService.on).toHaveBeenCalledWith('block', expect.any(Function));
    expect(blockchainService.on).toHaveBeenCalledWith('consensus', expect.any(Function));
    expect(blockchainService.on).toHaveBeenCalledWith('validator', expect.any(Function));
  });

  it('should broadcast transaction events', () => {
    setupEventBroadcasters(io, blockchainService);

    // Get the transaction event handler
    const transactionHandler = blockchainService.on.mock.calls.find(
      ([event]) => event === 'transaction'
    )?.[1];

    if (transactionHandler) {
      const mockTransaction = { id: 'tx_123', amount: 100 };
      io.to = vi.fn().mockReturnThis();
      io.emit = vi.fn();

      transactionHandler(mockTransaction);

      expect(io.to).toHaveBeenCalledWith('transactions');
      expect(io.emit).toHaveBeenCalledWith('transaction:new', mockTransaction);
    }
  });

  it('should broadcast block events', () => {
    setupEventBroadcasters(io, blockchainService);

    // Get the block event handler
    const blockHandler = blockchainService.on.mock.calls.find(
      ([event]) => event === 'block'
    )?.[1];

    if (blockHandler) {
      const mockBlock = { id: 'block_123', transactions: ['tx_123'] };
      io.to = vi.fn().mockReturnThis();
      io.emit = vi.fn();

      blockHandler(mockBlock);

      expect(io.to).toHaveBeenCalledWith('blocks');
      expect(io.emit).toHaveBeenCalledWith('block:new', mockBlock);
      expect(io.to).toHaveBeenCalledWith('dag');
      expect(io.emit).toHaveBeenCalledWith('dag:update', {
        type: 'block',
        data: mockBlock,
      });
    }
  });
});