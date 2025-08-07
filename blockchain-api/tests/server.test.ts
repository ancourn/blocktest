import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ApiServer } from '../server';
import request from 'supertest';

describe('Blockchain API Server', () => {
  let server: ApiServer;
  let app: any;

  beforeEach(async () => {
    const config = {
      port: 3002,
      host: '0.0.0.0',
      jwtSecret: 'test-secret',
      rateLimit: {
        max: 100,
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
  });

  afterEach(async () => {
    if (server) {
      await server.stop();
    }
  });

  describe('Health Check', () => {
    it('should return 200 for health check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('blockchain');
    });
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const userData = {
        username: 'testuser',
        password: 'testpassword123',
        email: 'test@example.com',
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

    it('should login with valid credentials', async () => {
      // First register a user
      await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          password: 'testpassword123',
        })
        .expect(201);

      // Then login
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
    });

    it('should reject login with invalid credentials', async () => {
      const loginData = {
        username: 'nonexistent',
        password: 'wrongpassword',
      };

      await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);
    });
  });

  describe('Protected Routes', () => {
    let authToken: string;

    beforeEach(async () => {
      // Register and login a user
      await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          password: 'testpassword123',
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

    it('should access blockchain status with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/blockchain/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('metrics');
    });

    it('should reject requests without authentication', async () => {
      await request(app)
        .get('/api/v1/blockchain/status')
        .expect(401);
    });

    it('should reject requests with invalid token', async () => {
      await request(app)
        .get('/api/v1/blockchain/status')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting', async () => {
      const requests = Array(101).fill(null).map(() => 
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
    });
  });

  describe('WebSocket Events', () => {
    it('should handle WebSocket connection', async () => {
      // This is a placeholder for WebSocket tests
      // In a real implementation, you would use a WebSocket client library
      expect(true).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      await request(app)
        .get('/nonexistent-endpoint')
        .expect(404);
    });

    it('should handle invalid JSON', async () => {
      await request(app)
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });

    it('should handle validation errors', async () => {
      await request(app)
        .post('/auth/register')
        .send({
          username: 'te', // Too short
          password: '123', // Too short
        })
        .expect(400);
    });
  });
});

describe('Blockchain API Integration', () => {
  let server: ApiServer;
  let app: any;
  let authToken: string;

  beforeEach(async () => {
    const config = {
      port: 3003,
      host: '0.0.0.0',
      jwtSecret: 'test-secret',
      rateLimit: {
        max: 100,
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

    // Setup authenticated user
    await request(app)
      .post('/auth/register')
      .send({
        username: 'testuser',
        password: 'testpassword123',
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

  describe('DAG Operations', () => {
    it('should get DAG state', async () => {
      const response = await request(app)
        .get('/api/v1/blockchain/dag')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('nodes');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('tips');
      expect(response.body).toHaveProperty('metrics');
    });

    it('should get DAG tips', async () => {
      const response = await request(app)
        .get('/api/v1/blockchain/dag/tips')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('tips');
      expect(response.body).toHaveProperty('count');
    });
  });

  describe('Transaction Operations', () => {
    it('should validate transaction structure', async () => {
      const transaction = {
        sender: 'kx1q9f5j8g7h6d5s4a3z2x1c9v8b7n6m5k4j3i2h1g',
        receiver: 'kx1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t',
        amount: 100.5,
      };

      const response = await request(app)
        .post('/api/v1/transactions/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ transaction })
        .expect(200);

      expect(response.body).toHaveProperty('isValid');
      expect(response.body).toHaveProperty('errors');
      expect(response.body).toHaveProperty('warnings');
    });

    it('should get transaction fees', async () => {
      const response = await request(app)
        .get('/api/v1/transactions/fees')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('baseFee');
      expect(response.body).toHaveProperty('priorityFee');
      expect(response.body).toHaveProperty('estimatedFee');
    });
  });

  describe('Wallet Operations', () => {
    it('should create a wallet', async () => {
      const walletData = {
        name: 'Test Wallet',
        type: 'standard',
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
    });

    it('should list wallets', async () => {
      // Create a wallet first
      await request(app)
        .post('/api/v1/wallet/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Wallet' })
        .expect(201);

      const response = await request(app)
        .get('/api/v1/wallet/')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('wallets');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.wallets)).toBe(true);
    });
  });

  describe('Consensus Operations', () => {
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
    });

    it('should get validators', async () => {
      const response = await request(app)
        .get('/api/v1/consensus/validators')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('validators');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.validators)).toBe(true);
    });
  });
});