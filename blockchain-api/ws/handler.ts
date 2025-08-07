import { Server, Socket } from 'socket.io';
import { BlockchainService } from '../../src/lib/blockchain-service';

// Types
interface AuthenticatedSocket extends Socket {
  user?: {
    userId: string;
    permissions?: string[];
  };
  subscriptions: Set<string>;
}

interface SubscriptionRequest {
  type: 'dag' | 'transactions' | 'consensus' | 'blocks' | 'wallet' | 'validator';
  filter?: any;
}

interface UnsubscribeRequest {
  type: string;
}

interface AuthRequest {
  token: string;
}

// WebSocket event handlers
export function websocketHandler(
  socket: AuthenticatedSocket,
  io: Server,
  blockchainService: BlockchainService
) {
  console.log(`Client connected: ${socket.id}`);
  
  // Initialize subscriptions set
  socket.subscriptions = new Set();

  // Authentication
  socket.on('authenticate', async (data: AuthRequest) => {
    try {
      const { token } = data;
      
      // Verify JWT token
      const decoded = (socket.server as any).jwt.verify(token) as any;
      
      socket.user = {
        userId: decoded.userId,
        permissions: decoded.permissions || ['read'],
      };

      socket.emit('authenticated', {
        success: true,
        userId: decoded.userId,
        permissions: decoded.permissions || ['read'],
      });

      console.log(`Client authenticated: ${socket.id} (${decoded.userId})`);
    } catch (error) {
      socket.emit('authenticated', {
        success: false,
        error: 'Invalid token',
      });
      console.log(`Authentication failed for client: ${socket.id}`);
    }
  });

  // Subscribe to events
  socket.on('subscribe', async (data: SubscriptionRequest) => {
    try {
      const { type, filter } = data;
      
      // Check if user is authenticated for protected subscriptions
      if (type !== 'dag' && !socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      // Add subscription
      socket.subscriptions.add(type);
      
      // Send initial data
      switch (type) {
        case 'dag':
          const dagState = await blockchainService.getDagState(10, 0);
          socket.emit('dag:init', dagState);
          break;
          
        case 'transactions':
          const transactions = await blockchainService.getPendingTransactions(10);
          socket.emit('transactions:init', transactions);
          break;
          
        case 'consensus':
          const consensusStatus = await blockchainService.getConsensusStatus(true);
          socket.emit('consensus:init', consensusStatus);
          break;
          
        case 'blocks':
          const latestBlocks = await blockchainService.getLatestBlocks(10);
          socket.emit('blocks:init', latestBlocks);
          break;
          
        case 'wallet':
          if (filter?.address) {
            const walletInfo = await blockchainService.getWalletBalance(filter.address);
            socket.emit('wallet:init', walletInfo);
          }
          break;
          
        case 'validator':
          if (filter?.validatorId) {
            const validatorInfo = await blockchainService.getValidator(filter.validatorId);
            socket.emit('validator:init', validatorInfo);
          }
          break;
      }

      socket.emit('subscribed', { type, success: true });
      console.log(`Client ${socket.id} subscribed to ${type}`);
    } catch (error) {
      socket.emit('error', { message: 'Subscription failed' });
      console.error(`Subscription error for client ${socket.id}:`, error);
    }
  });

  // Unsubscribe from events
  socket.on('unsubscribe', (data: UnsubscribeRequest) => {
    try {
      const { type } = data;
      
      if (socket.subscriptions.has(type)) {
        socket.subscriptions.delete(type);
        socket.emit('unsubscribed', { type, success: true });
        console.log(`Client ${socket.id} unsubscribed from ${type}`);
      } else {
        socket.emit('unsubscribed', { type, success: false, error: 'Not subscribed' });
      }
    } catch (error) {
      socket.emit('error', { message: 'Unsubscription failed' });
      console.error(`Unsubscription error for client ${socket.id}:`, error);
    }
  });

  // Get current subscriptions
  socket.on('get_subscriptions', () => {
    socket.emit('subscriptions', {
      subscriptions: Array.from(socket.subscriptions),
    });
  });

  // Request specific data
  socket.on('request_data', async (data: any) => {
    try {
      const { type, params } = data;
      
      // Check authentication
      if (!socket.user && type !== 'dag') {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      let result;
      switch (type) {
        case 'dag':
          result = await blockchainService.getDagState(params?.limit || 10, params?.offset || 0);
          break;
          
        case 'transaction':
          result = await blockchainService.getTransaction(params.transactionId);
          break;
          
        case 'transactions':
          result = await blockchainService.getTransactions(params?.limit || 10, params?.offset || 0, params?.filters || {});
          break;
          
        case 'consensus':
          result = await blockchainService.getConsensusStatus(params?.detailed || false);
          break;
          
        case 'validators':
          result = await blockchainService.getValidators(params?.active, params?.limit || 10, params?.offset || 0);
          break;
          
        case 'wallet':
          result = await blockchainService.getWallet(params.walletId);
          break;
          
        default:
          socket.emit('error', { message: 'Invalid data type requested' });
          return;
      }

      socket.emit('data_response', {
        type,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      socket.emit('error', { message: 'Data request failed' });
      console.error(`Data request error for client ${socket.id}:`, error);
    }
  });

  // Submit transaction via WebSocket
  socket.on('submit_transaction', async (data: any) => {
    try {
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const result = await blockchainService.submitTransaction(data);
      
      socket.emit('transaction_submitted', {
        success: true,
        transactionId: result.transactionId,
        status: result.status,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      socket.emit('error', { 
        message: 'Transaction submission failed',
        details: error.message,
      });
      console.error(`Transaction submission error for client ${socket.id}:`, error);
    }
  });

  // Get blockchain status
  socket.on('get_status', async () => {
    try {
      const status = await blockchainService.getStatus();
      socket.emit('status', status);
    } catch (error) {
      socket.emit('error', { message: 'Failed to get status' });
      console.error(`Status request error for client ${socket.id}:`, error);
    }
  });

  // Ping/Pong for connection health
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() });
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected: ${socket.id} (${reason})`);
    
    // Clean up subscriptions
    socket.subscriptions.clear();
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error(`Socket error for client ${socket.id}:`, error);
  });

  // Send welcome message
  socket.emit('welcome', {
    message: 'Connected to KALDRIX Blockchain WebSocket API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    supported_events: [
      'authenticate',
      'subscribe',
      'unsubscribe',
      'get_subscriptions',
      'request_data',
      'submit_transaction',
      'get_status',
      'ping',
    ],
  });
}

// Real-time event broadcasting
export function setupEventBroadcasters(io: Server, blockchainService: BlockchainService) {
  // Listen to blockchain events
  blockchainService.on('transaction', (transaction) => {
    io.to('transactions').emit('transaction:new', transaction);
  });

  blockchainService.on('block', (block) => {
    io.to('blocks').emit('block:new', block);
    io.to('dag').emit('dag:update', { type: 'block', data: block });
  });

  blockchainService.on('consensus', (event) => {
    io.to('consensus').emit('consensus:event', event);
  });

  blockchainService.on('validator', (event) => {
    io.to('validator').emit('validator:event', event);
  });

  // Periodic status updates
  setInterval(async () => {
    try {
      const status = await blockchainService.getStatus();
      io.emit('status:update', status);
    } catch (error) {
      console.error('Error broadcasting status update:', error);
    }
  }, 30000); // Every 30 seconds
}

// Room management
export function setupRoomManagement(io: Server) {
  // Join room
  io.on('connection', (socket: AuthenticatedSocket) => {
    socket.on('join_room', (room: string) => {
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      socket.join(room);
      socket.emit('joined_room', { room, success: true });
      console.log(`Client ${socket.id} joined room: ${room}`);
    });

    // Leave room
    socket.on('leave_room', (room: string) => {
      socket.leave(room);
      socket.emit('left_room', { room, success: true });
      console.log(`Client ${socket.id} left room: ${room}`);
    });

    // Get rooms
    socket.on('get_rooms', () => {
      const rooms = Array.from(socket.rooms);
      socket.emit('rooms', { rooms });
    });
  });
}

// Connection management
export function setupConnectionManagement(io: Server) {
  // Track connections
  const connections = new Map<string, AuthenticatedSocket>();

  io.on('connection', (socket: AuthenticatedSocket) => {
    connections.set(socket.id, socket);
    
    // Update connection count
    io.emit('connections:count', { count: connections.size });

    socket.on('disconnect', () => {
      connections.delete(socket.id);
      io.emit('connections:count', { count: connections.size });
    });
  });

  // Periodic connection health check
  setInterval(() => {
    connections.forEach((socket, id) => {
      if (!socket.connected) {
        connections.delete(id);
      }
    });
    
    io.emit('connections:count', { count: connections.size });
  }, 60000); // Every minute
}

// Error handling
export function setupErrorHandling(io: Server) {
  io.on('connection', (socket: AuthenticatedSocket) => {
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
      socket.emit('error', { message: 'Internal server error' });
    });
  });
}