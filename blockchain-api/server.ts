import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyJwt from '@fastify/jwt';
import fastifyWebSocket from '@fastify/websocket';
import { Server } from 'socket.io';
import { createServer } from 'http';

import { blockchainRoutes } from './routes/blockchain';
import { transactionRoutes } from './routes/transactions';
import { walletRoutes } from './routes/wallet';
import { consensusRoutes } from './routes/consensus';
import { authRoutes } from './routes/auth';
import { websocketHandler } from './ws/handler';
import { authMiddleware } from './auth/middleware';
import { BlockchainService } from '../src/lib/blockchain-service';

interface ApiConfig {
  port: number;
  host: string;
  jwtSecret: string;
  rateLimit: {
    max: number;
    timeWindow: string;
  };
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
}

export class ApiServer {
  private fastify: FastifyInstance;
  private server: any;
  private io: Server;
  private blockchainService: BlockchainService;
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
    this.fastify = Fastify({
      logger: {
        level: 'info',
        prettyPrint: true,
      },
    });
    this.server = createServer(this.fastify);
    this.io = new Server(this.server, {
      cors: {
        origin: config.cors.origin,
        credentials: config.cors.credentials,
      },
    });
    this.blockchainService = new BlockchainService();
  }

  async initialize(): Promise<void> {
    await this.setupPlugins();
    await this.setupRoutes();
    await this.setupWebSocket();
    await this.setupSwagger();
  }

  private async setupPlugins(): Promise<void> {
    // CORS
    await this.fastify.register(fastifyCors, this.config.cors);

    // Helmet for security
    await this.fastify.register(fastifyHelmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    });

    // Rate limiting
    await this.fastify.register(fastifyRateLimit, {
      global: true,
      max: this.config.rateLimit.max,
      timeWindow: this.config.rateLimit.timeWindow,
      errorResponseBuilder: (request, context) => ({
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded, retry in ${context.after}`,
      }),
    });

    // JWT
    await this.fastify.register(fastifyJwt, {
      secret: this.config.jwtSecret,
      sign: {
        expiresIn: '1h',
      },
    });

    // WebSocket support
    await this.fastify.register(fastifyWebSocket);

    // Swagger
    await this.fastify.register(fastifySwagger, {
      swagger: {
        info: {
          title: 'KALDRIX Blockchain API',
          description: 'REST and WebSocket API for KALDRIX blockchain operations',
          version: '1.0.0',
        },
        host: `${this.config.host}:${this.config.port}`,
        schemes: ['http', 'https'],
        consumes: ['application/json'],
        produces: ['application/json'],
        securityDefinitions: {
          bearerAuth: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header',
          },
        },
      },
    });

    await this.fastify.register(fastifySwaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'full',
        deepLinking: false,
      },
    });
  }

  private async setupRoutes(): Promise<void> {
    // Health check
    this.fastify.get('/health', async (request, reply) => {
      return { 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        blockchain: await this.blockchainService.getStatus()
      };
    });

    // Auth routes (no authentication required)
    this.fastify.register(authRoutes, { prefix: '/auth' });

    // Protected routes
    this.fastify.register(async (fastify) => {
      fastify.addHook('preHandler', authMiddleware);

      // Blockchain routes
      fastify.register(blockchainRoutes, { prefix: '/blockchain' });

      // Transaction routes
      fastify.register(transactionRoutes, { prefix: '/transactions' });

      // Wallet routes
      fastify.register(walletRoutes, { prefix: '/wallet' });

      // Consensus routes
      fastify.register(consensusRoutes, { prefix: '/consensus' });
    }, { prefix: '/api/v1' });
  }

  private async setupWebSocket(): Promise<void> {
    this.io.on('connection', (socket) => {
      websocketHandler(socket, this.io, this.blockchainService);
    });

    // Set up blockchain event listeners
    this.blockchainService.on('transaction', (transaction) => {
      this.io.emit('transaction', transaction);
    });

    this.blockchainService.on('block', (block) => {
      this.io.emit('block', block);
    });

    this.blockchainService.on('consensus', (event) => {
      this.io.emit('consensus', event);
    });
  }

  private async setupSwagger(): Promise<void> {
    // Additional OpenAPI schema definitions
    this.fastify.addSchema({
      $id: 'Transaction',
      type: 'object',
      properties: {
        id: { type: 'string' },
        sender: { type: 'string' },
        receiver: { type: 'string' },
        amount: { type: 'number' },
        timestamp: { type: 'string', format: 'date-time' },
        signature: { type: 'string' },
        parents: { type: 'array', items: { type: 'string' } },
      },
      required: ['id', 'sender', 'receiver', 'amount', 'timestamp', 'signature'],
    });

    this.fastify.addSchema({
      $id: 'Block',
      type: 'object',
      properties: {
        id: { type: 'string' },
        transactions: { type: 'array', items: { type: 'string' } },
        timestamp: { type: 'string', format: 'date-time' },
        validator: { type: 'string' },
        signature: { type: 'string' },
        parents: { type: 'array', items: { type: 'string' } },
      },
      required: ['id', 'transactions', 'timestamp', 'validator', 'signature'],
    });
  }

  async start(): Promise<void> {
    try {
      await this.initialize();
      
      this.server.listen({
        port: this.config.port,
        host: this.config.host,
      }, (err: any, address: string) => {
        if (err) {
          console.error(err);
          process.exit(1);
        }
        console.log(`🚀 KALDRIX Blockchain API server listening at ${address}`);
        console.log(`📚 Swagger UI available at ${address}/docs`);
      });
    } catch (err) {
      console.error('Error starting server:', err);
      process.exit(1);
    }
  }

  async stop(): Promise<void> {
    await this.fastify.close();
    this.io.close();
  }
}

// Default configuration
const defaultConfig: ApiConfig = {
  port: parseInt(process.env.API_PORT || '3001'),
  host: process.env.API_HOST || '0.0.0.0',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    timeWindow: process.env.RATE_LIMIT_WINDOW || '1m',
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
};

// Start server if this file is run directly
if (require.main === module) {
  const server = new ApiServer(defaultConfig);
  server.start();
}

export { ApiServer as default };