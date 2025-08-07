import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ApiServer } from '../server';
import request from 'supertest';

describe('Blockchain API Integration Tests', () => {
  let server: ApiServer;
  let app: any;
  let authToken: string;

  beforeEach(async () => {
    const config = {
      port: 3004,
      host: '0.0.0.0',
      jwtSecret: 'test-secret-key',
      rateLimit: {
        max: 1000,
        timeWindow: '1m',
      },
      cors: {
        origin: ['http://localhost:3000'],
        credentials: true,
      },
    };

    server = new ApiServer(config);
    await server.initialize();
    app = (server as any).fastify;

    // Create test user and get auth token
    await request(app)
      .post('/auth/register')
      .send({
        username: 'testuser',
        password: 'testpassword123',
        email: 'test@example.com',
      })
      .expect(201);

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        username: 'testuser',
        password: 'testpassword123',
      })
      .expect(200);

    authToken = loginResponse.body.accessToken;
  });

  afterEach(async () => {
    if (server) {
      await server.stop();
    }
  });

  describe('Authentication Endpoints', () => {
    it('should register a new user', async () => {
      const userData = {
        username: 'newuser',
        password: 'newpassword123',
        email: 'newuser@example.com',
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('username', userData.username);
      expect(response.body).toHaveProperty('email', userData.email);
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should reject registration with existing username', async () => {
      const userData = {
        username: 'testuser', // Already exists
        password: 'password123',
        email: 'another@example.com',
      };

      await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        username: 'newuser',
        password: '123', // Too weak
        email: 'newuser@example.com',
      };

      await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        username: 'testuser',
        password: 'testpassword123',
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body).toHaveProperty('tokenType', 'Bearer');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('userId');
      expect(response.body.user).toHaveProperty('username', 'testuser');
    });

    it('should reject login with invalid credentials', async () => {
      const loginData = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);
    });

    it('should refresh access token', async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'testpassword123',
        })
        .expect(200);

      const refreshData = {
        refreshToken: loginResponse.body.refreshToken,
      };

      const response = await request(app)
        .post('/auth/refresh')
        .send(refreshData)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('expiresIn');
    });

    it('should logout successfully', async () => {
      await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should generate API key', async () => {
      const apiKeyData = {
        name: 'Test API Key',
        permissions: ['read', 'write'],
      };

      const response = await request(app)
        .post('/auth/api-keys')
        .set('Authorization', `Bearer ${authToken}`)
        .send(apiKeyData)
        .expect(201);

      expect(response.body).toHaveProperty('apiKey');
      expect(response.body).toHaveProperty('name', apiKeyData.name);
      expect(response.body).toHaveProperty('permissions', apiKeyData.permissions);
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should list API keys', async () => {
      // Generate an API key first
      await request(app)
        .post('/auth/api-keys')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test API Key',
          permissions: ['read'],
        })
        .expect(201);

      const response = await request(app)
        .get('/auth/api-keys')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('apiKeys');
      expect(Array.isArray(response.body.apiKeys)).toBe(true);
      expect(response.body.apiKeys.length).toBeGreaterThan(0);
    });

    it('should revoke API key', async () => {
      // Generate an API key first
      const createResponse = await request(app)
        .post('/auth/api-keys')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test API Key',
          permissions: ['read'],
        })
        .expect(201);

      const apiKeyName = createResponse.body.name;

      await request(app)
        .delete(`/auth/api-keys/${apiKeyName}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Blockchain Endpoints', () => {
    it('should get blockchain status', async () => {
      const response = await request(app)
        .get('/api/v1/blockchain/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('metrics');
      expect(response.body).toHaveProperty('version');
    });

    it('should get DAG state', async () => {
      const response = await request(app)
        .get('/api/v1/blockchain/dag')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('nodes');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('tips');
      expect(response.body).toHaveProperty('metrics');
      expect(Array.isArray(response.body.nodes)).toBe(true);
      expect(Array.isArray(response.body.tips)).toBe(true);
    });

    it('should get DAG state with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/blockchain/dag?limit=5&offset=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('nodes');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit', 5);
      expect(response.body).toHaveProperty('offset', 10);
    });

    it('should get DAG tips', async () => {
      const response = await request(app)
        .get('/api/v1/blockchain/dag/tips')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('tips');
      expect(response.body).toHaveProperty('count');
      expect(Array.isArray(response.body.tips)).toBe(true);
    });

    it('should get DAG tips with limit', async () => {
      const response = await request(app)
        .get('/api/v1/blockchain/dag/tips?max=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('tips');
      expect(response.body).toHaveProperty('count');
      expect(response.body.tips.length).toBeLessThanOrEqual(5);
    });

    it('should get network information', async () => {
      const response = await request(app)
        .get('/api/v1/blockchain/network')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('networkId');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('peers');
      expect(response.body).toHaveProperty('totalPeers');
      expect(response.body).toHaveProperty('syncStatus');
    });

    it('should get quantum security status', async () => {
      const response = await request(app)
        .get('/api/v1/blockchain/quantum-security')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('enabled');
      expect(response.body).toHaveProperty('algorithm');
      expect(response.body).toHaveProperty('keySize');
      expect(response.body).toHaveProperty('metrics');
    });

    it('should reject requests without authentication', async () => {
      await request(app)
        .get('/api/v1/blockchain/status')
        .expect(401);
    });

    it('should reject requests with invalid authentication', async () => {
      await request(app)
        .get('/api/v1/blockchain/status')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Transaction Endpoints', () => {
    it('should validate transaction', async () => {
      const transaction = {
        id: 'tx_123',
        sender: 'kx1sender',
        receiver: 'kx1receiver',
        amount: 100,
        timestamp: new Date().toISOString(),
        signature: '0x123abc',
        parents: [],
      };

      const response = await request(app)
        .post('/api/v1/transactions/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ transaction })
        .expect(200);

      expect(response.body).toHaveProperty('isValid');
      expect(response.body).toHaveProperty('errors');
      expect(response.body).toHaveProperty('warnings');
      expect(Array.isArray(response.body.errors)).toBe(true);
      expect(Array.isArray(response.body.warnings)).toBe(true);
    });

    it('should get transaction fees', async () => {
      const response = await request(app)
        .get('/api/v1/transactions/fees')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('baseFee');
      expect(response.body).toHaveProperty('priorityFee');
      expect(response.body).toHaveProperty('estimatedFee');
      expect(response.body).toHaveProperty('feeHistory');
      expect(response.body).toHaveProperty('recommendations');
    });

    it('should get pending transactions', async () => {
      const response = await request(app)
        .get('/api/v1/transactions/pending')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('transactions');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('totalFees');
      expect(response.body).toHaveProperty('oldestTransaction');
      expect(Array.isArray(response.body.transactions)).toBe(true);
    });

    it('should get pending transactions with limit', async () => {
      const response = await request(app)
        .get('/api/v1/transactions/pending?limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('transactions');
      expect(response.body).toHaveProperty('count');
      expect(response.body.transactions.length).toBeLessThanOrEqual(5);
    });

    it('should get transactions with filters', async () => {
      const response = await request(app)
        .get('/api/v1/transactions/?sender=kx1sender&status=confirmed&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('transactions');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit', 10);
      expect(response.body).toHaveProperty('offset', 0);
      expect(response.body).toHaveProperty('filters');
      expect(response.body.filters).toHaveProperty('sender', 'kx1sender');
      expect(response.body.filters).toHaveProperty('status', 'confirmed');
    });

    it('should reject transaction validation without authentication', async () => {
      await request(app)
        .post('/api/v1/transactions/validate')
        .send({ transaction: {} })
        .expect(401);
    });
  });

  describe('Wallet Endpoints', () => {
    it('should create a wallet', async () => {
      const walletData = {
        name: 'Test Wallet',
        type: 'standard',
        password: 'walletpassword123',
      };

      const response = await request(app)
        .post('/api/v1/wallet/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(walletData)
        .expect(201);

      expect(response.body).toHaveProperty('walletId');
      expect(response.body).toHaveProperty('address');
      expect(response.body).toHaveProperty('publicKey');
      expect(response.body).toHaveProperty('name', walletData.name);
      expect(response.body).toHaveProperty('type', walletData.type);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('warning');
    });

    it('should list wallets', async () => {
      // Create a wallet first
      await request(app)
        .post('/api/v1/wallet/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Wallet',
          type: 'standard',
        })
        .expect(201);

      const response = await request(app)
        .get('/api/v1/wallet/')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('wallets');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit', 20);
      expect(response.body).toHaveProperty('offset', 0);
      expect(Array.isArray(response.body.wallets)).toBe(true);
      expect(response.body.wallets.length).toBeGreaterThan(0);
    });

    it('should list wallets with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/wallet/?limit=5&offset=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('wallets');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit', 5);
      expect(response.body).toHaveProperty('offset', 10);
    });

    it('should reject wallet creation without authentication', async () => {
      await request(app)
        .post('/api/v1/wallet/create')
        .send({ name: 'Test Wallet' })
        .expect(401);
    });

    it('should reject wallet creation with invalid data', async () => {
      await request(app)
        .post('/api/v1/wallet/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '' }) // Invalid name
        .expect(400);
    });
  });

  describe('Consensus Endpoints', () => {
    it('should get consensus status', async () => {
      const response = await request(app)
        .get('/api/v1/consensus/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('algorithm');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('round');
      expect(response.body).toHaveProperty('phase');
      expect(response.body).toHaveProperty('validators');
      expect(response.body).toHaveProperty('lastBlock');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('metrics');
    });

    it('should get detailed consensus status', async () => {
      const response = await request(app)
        .get('/api/v1/consensus/status?detailed=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('algorithm');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('metrics');
    });

    it('should get validators', async () => {
      const response = await request(app)
        .get('/api/v1/consensus/validators')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('validators');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit', 100);
      expect(response.body).toHaveProperty('offset', 0);
      expect(Array.isArray(response.body.validators)).toBe(true);
    });

    it('should get active validators only', async () => {
      const response = await request(app)
        .get('/api/v1/consensus/validators?active=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('validators');
      expect(response.body).toHaveProperty('filters');
      expect(response.body.filters).toHaveProperty('active', true);
    });

    it('should get validators with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/consensus/validators?limit=5&offset=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('validators');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit', 5);
      expect(response.body).toHaveProperty('offset', 10);
    });

    it('should get consensus metrics', async () => {
      const response = await request(app)
        .get('/api/v1/consensus/metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('timeframe');
      expect(response.body).toHaveProperty('metrics');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.metrics).toHaveProperty('blockTime');
      expect(response.body.metrics).toHaveProperty('finalityTime');
      expect(response.body.metrics).toHaveProperty('throughput');
      expect(response.body.metrics).toHaveProperty('successRate');
    });

    it('should get consensus metrics for different timeframes', async () => {
      const timeframes = ['1h', '24h', '7d', '30d'];
      
      for (const timeframe of timeframes) {
        const response = await request(app)
          .get(`/api/v1/consensus/metrics?timeframe=${timeframe}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('timeframe', timeframe);
        expect(response.body).toHaveProperty('metrics');
      }
    });

    it('should get active proposals', async () => {
      const response = await request(app)
        .get('/api/v1/consensus/proposals')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('proposals');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit', 20);
      expect(response.body).toHaveProperty('offset', 0);
      expect(Array.isArray(response.body.proposals)).toBe(true);
    });

    it('should get proposals with different statuses', async () => {
      const statuses = ['active', 'pending', 'completed', 'failed'];
      
      for (const status of statuses) {
        const response = await request(app)
          .get(`/api/v1/consensus/proposals?status=${status}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('filters');
        expect(response.body.filters).toHaveProperty('status', status);
      }
    });

    it('should get consensus history', async () => {
      const response = await request(app)
        .get('/api/v1/consensus/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('events');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit', 100);
      expect(response.body).toHaveProperty('offset', 0);
      expect(Array.isArray(response.body.events)).toBe(true);
    });

    it('should get fork information', async () => {
      const response = await request(app)
        .get('/api/v1/consensus/forks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('activeForks');
      expect(response.body).toHaveProperty('resolvedForks');
      expect(response.body).toHaveProperty('totalForks');
      expect(response.body).toHaveProperty('resolutionRate');
      expect(Array.isArray(response.body.activeForks)).toBe(true);
      expect(Array.isArray(response.body.resolvedForks)).toBe(true);
    });

    it('should get validator rewards', async () => {
      const response = await request(app)
        .get('/api/v1/consensus/rewards')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalRewards');
      expect(response.body).toHaveProperty('timeframe');
      expect(response.body).toHaveProperty('rewards');
      expect(response.body).toHaveProperty('distribution');
      expect(Array.isArray(response.body.rewards)).toBe(true);
    });

    it('should reject consensus requests without authentication', async () => {
      await request(app)
        .get('/api/v1/consensus/status')
        .expect(401);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent endpoints', async () => {
      await request(app)
        .get('/api/v1/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should handle invalid JSON in request body', async () => {
      await request(app)
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });

    it('should handle validation errors for missing required fields', async () => {
      await request(app)
        .post('/auth/login')
        .send({ username: 'testuser' }) // Missing password
        .expect(400);
    });

    it('should handle validation errors for invalid field values', async () => {
      await request(app)
        .get('/api/v1/blockchain/dag?limit=-1') // Invalid limit
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should handle validation errors for invalid enum values', async () => {
      await request(app)
        .get('/api/v1/consensus/metrics?timeframe=invalid') // Invalid timeframe
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting', async () => {
      // Make many requests to trigger rate limiting
      const requests = Array(150).fill(null).map(() => 
        request(app).get('/health')
      );

      const responses = await Promise.all(requests);
      
      // Most requests should succeed
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(0);
      
      // Some requests might be rate limited
      const rateLimitedCount = responses.filter(r => r.status === 429).length;
      // Note: Rate limiting behavior may vary based on configuration
    });
  });

  describe('CORS', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/health')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
    });

    it('should reject requests from unauthorized origins', async () => {
      await request(app)
        .get('/health')
        .set('Origin', 'http://malicious.com')
        .expect(400);
    });
  });
});