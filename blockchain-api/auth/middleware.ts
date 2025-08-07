import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';

// Types
interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    userId: string;
    username?: string;
    permissions?: string[];
  };
}

// Authentication middleware
export async function authMiddleware(
  request: AuthenticatedRequest,
  reply: FastifyReply,
  done: () => void
) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      return reply.code(401).send({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      // Verify JWT token
      const decoded = request.server.jwt.verify(token) as any;
      request.user = {
        userId: decoded.userId,
        username: decoded.username,
      };
    } catch (error) {
      // If JWT fails, try API key authentication
      const apiKeyData = await verifyApiKey(request.server, token);
      if (!apiKeyData) {
        return reply.code(401).send({ error: 'Invalid token or API key' });
      }
      
      request.user = {
        userId: apiKeyData.userId,
        permissions: apiKeyData.permissions,
      };
    }

    done();
  } catch (error) {
    request.log.error('Authentication error:', error);
    return reply.code(500).send({ error: 'Authentication failed' });
  }
}

// Role-based authorization middleware
export function requireRole(roles: string[]) {
  return async (request: AuthenticatedRequest, reply: FastifyReply, done: () => void) => {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Authentication required' });
      }

      // In a real implementation, you would check user roles from a database
      // For now, we'll assume all authenticated users have basic access
      if (!roles.includes('user')) {
        return reply.code(403).send({ error: 'Insufficient permissions' });
      }

      done();
    } catch (error) {
      request.log.error('Authorization error:', error);
      return reply.code(500).send({ error: 'Authorization failed' });
    }
  };
}

// Permission-based authorization middleware
export function requirePermissions(permissions: string[]) {
  return async (request: AuthenticatedRequest, reply: FastifyReply, done: () => void) => {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Authentication required' });
      }

      const userPermissions = request.user.permissions || ['read'];
      
      const hasPermission = permissions.every(permission => 
        userPermissions.includes(permission) || userPermissions.includes('admin')
      );

      if (!hasPermission) {
        return reply.code(403).send({ error: 'Insufficient permissions' });
      }

      done();
    } catch (error) {
      request.log.error('Permission check error:', error);
      return reply.code(500).send({ error: 'Permission check failed' });
    }
  };
}

// Rate limiting middleware
export function rateLimitMiddleware(options: {
  max: number;
  timeWindow: string;
  keyGenerator?: (request: FastifyRequest) => string;
}) {
  return async (request: FastifyRequest, reply: FastifyReply, done: () => void) => {
    try {
      // This would typically use Redis or another caching solution
      // For now, we'll implement a simple in-memory rate limiter
      
      const keyGenerator = options.keyGenerator || ((req) => {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        return ip as string;
      });

      const key = keyGenerator(request);
      const now = Date.now();
      const windowStart = now - parseTimeWindow(options.timeWindow);

      // In production, use a proper rate limiting solution
      // This is just a placeholder implementation
      done();
    } catch (error) {
      request.log.error('Rate limiting error:', error);
      done();
    }
  };
}

// API key verification
async function verifyApiKey(server: FastifyInstance, apiKey: string): Promise<any> {
  // In production, verify API key against database
  // For now, we'll use a simple mock implementation
  
  // Mock API keys database
  const mockApiKeys = new Map<string, any>();
  
  const keyData = mockApiKeys.get(apiKey);
  if (!keyData) {
    return null;
  }

  // Check if API key is expired
  if (keyData.expiresAt && new Date(keyData.expiresAt) < new Date()) {
    mockApiKeys.delete(apiKey);
    return null;
  }

  // Update last used timestamp
  keyData.lastUsed = new Date().toISOString();
  
  return keyData;
}

// Helper function to parse time window
function parseTimeWindow(timeWindow: string): number {
  const match = timeWindow.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 60000; // Default to 1 minute
  }

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 60000;
  }
}

// Input validation middleware
export function validateInput(schema: any) {
  return async (request: FastifyRequest, reply: FastifyReply, done: () => void) => {
    try {
      // Validate request body against schema
      if (schema.body && request.body) {
        const { error } = schema.body.validate(request.body);
        if (error) {
          return reply.code(400).send({
            error: 'Invalid input',
            details: error.details,
          });
        }
      }

      // Validate query parameters
      if (schema.query && request.query) {
        const { error } = schema.query.validate(request.query);
        if (error) {
          return reply.code(400).send({
            error: 'Invalid query parameters',
            details: error.details,
          });
        }
      }

      // Validate path parameters
      if (schema.params && request.params) {
        const { error } = schema.params.validate(request.params);
        if (error) {
          return reply.code(400).send({
            error: 'Invalid path parameters',
            details: error.details,
          });
        }
      }

      done();
    } catch (error) {
      request.log.error('Input validation error:', error);
      return reply.code(500).send({ error: 'Input validation failed' });
    }
  };
}

// Security headers middleware
export function securityHeaders() {
  return async (request: FastifyRequest, reply: FastifyReply, done: () => void) => {
    try {
      // Add security headers
      reply.header('X-Content-Type-Options', 'nosniff');
      reply.header('X-Frame-Options', 'DENY');
      reply.header('X-XSS-Protection', '1; mode=block');
      reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
      reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      
      done();
    } catch (error) {
      request.log.error('Security headers error:', error);
      done();
    }
  };
}

// CORS middleware configuration
export const corsOptions = {
  origin: (origin: string, callback: any) => {
    // In production, configure allowed origins properly
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://kaldrix.io',
      'https://api.kaldrix.io',
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  exposedHeaders: ['X-Rate-Limit-Limit', 'X-Rate-Limit-Remaining', 'X-Rate-Limit-Reset'],
};

// Logging middleware
export function loggingMiddleware() {
  return async (request: FastifyRequest, reply: FastifyReply, done: () => void) => {
    const start = Date.now();
    
    // Log request
    request.log.info({
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: request.headers['x-forwarded-for'] || request.socket.remoteAddress,
    }, 'Incoming request');

    // Hook into response
    reply.addHook('onSend', async (req, res, payload) => {
      const duration = Date.now() - start;
      
      request.log.info({
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
      }, 'Request completed');
    });

    done();
  };
}

// Error handling middleware
export function errorHandler() {
  return async (error: any, request: FastifyRequest, reply: FastifyReply) => {
    request.log.error('Error occurred:', error);

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (error.validation) {
      return reply.code(400).send({
        error: 'Validation error',
        details: isDevelopment ? error.validation : undefined,
      });
    }

    if (error.code === 'FST_JWT_NO_AUTHORIZATION_HEADER') {
      return reply.code(401).send({ error: 'No authorization header' });
    }

    if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
      return reply.code(401).send({ error: 'Invalid token' });
    }

    if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
      return reply.code(401).send({ error: 'Token expired' });
    }

    // Default error response
    return reply.code(500).send({
      error: 'Internal server error',
      details: isDevelopment ? error.message : undefined,
    });
  };
}