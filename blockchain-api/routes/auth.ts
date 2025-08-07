import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// Types
interface LoginRequest {
  Body: {
    username: string;
    password: string;
  };
}

interface RegisterRequest {
  Body: {
    username: string;
    password: string;
    email?: string;
  };
}

interface RefreshTokenRequest {
  Body: {
    refreshToken: string;
  };
}

interface ApiKeyRequest {
  Body: {
    name: string;
    permissions?: string[];
    expiresAt?: string;
  };
}

interface ValidateTokenRequest {
  Body: {
    token: string;
  };
}

// Routes
export async function authRoutes(fastify: FastifyInstance) {
  // Mock user database (in production, use a real database)
  const users = new Map<string, any>();
  const apiKeys = new Map<string, any>();
  const refreshTokens = new Map<string, string>();

  // Login
  fastify.post<LoginRequest>('/login', {
    schema: {
      description: 'User login',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string' },
          password: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            expiresIn: { type: 'number' },
            tokenType: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' },
                email: { type: 'string' },
              },
            },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<LoginRequest>, reply: FastifyReply) => {
    try {
      const { username, password } = request.body;
      
      // Mock authentication - in production, verify against real database
      const user = users.get(username);
      if (!user || user.password !== password) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Generate tokens
      const accessToken = fastify.jwt.sign({
        userId: user.id,
        username: user.username,
      }, { expiresIn: '1h' });

      const refreshToken = fastify.jwt.sign({
        userId: user.id,
        type: 'refresh',
      }, { expiresIn: '7d' });

      // Store refresh token
      refreshTokens.set(refreshToken, user.id);

      return reply.send({
        accessToken,
        refreshToken,
        expiresIn: 3600,
        tokenType: 'Bearer',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });
    } catch (error) {
      fastify.log.error('Error during login:', error);
      return reply.code(500).send({ error: 'Login failed' });
    }
  });

  // Register
  fastify.post<RegisterRequest>('/register', {
    schema: {
      description: 'User registration',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string' },
          password: { type: 'string', minLength: 8 },
          email: { type: 'string', format: 'email' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<RegisterRequest>, reply: FastifyReply) => {
    try {
      const { username, password, email } = request.body;
      
      // Check if user already exists
      if (users.has(username)) {
        return reply.code(400).send({ error: 'Username already exists' });
      }

      // Create user
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      users.set(username, {
        id: userId,
        username,
        password, // In production, hash the password
        email: email || '',
        createdAt: new Date().toISOString(),
      });

      return reply.code(201).send({
        userId,
        username,
        email: email || '',
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      fastify.log.error('Error during registration:', error);
      return reply.code(500).send({ error: 'Registration failed' });
    }
  });

  // Refresh token
  fastify.post<RefreshTokenRequest>('/refresh', {
    schema: {
      description: 'Refresh access token',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            expiresIn: { type: 'number' },
            tokenType: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<RefreshTokenRequest>, reply: FastifyReply) => {
    try {
      const { refreshToken } = request.body;
      
      // Verify refresh token
      const userId = refreshTokens.get(refreshToken);
      if (!userId) {
        return reply.code(401).send({ error: 'Invalid refresh token' });
      }

      // Verify JWT
      try {
        const decoded = fastify.jwt.verify(refreshToken) as any;
        if (decoded.type !== 'refresh') {
          return reply.code(401).send({ error: 'Invalid token type' });
        }
      } catch (error) {
        return reply.code(401).send({ error: 'Invalid refresh token' });
      }

      // Generate new tokens
      const newAccessToken = fastify.jwt.sign({
        userId,
      }, { expiresIn: '1h' });

      const newRefreshToken = fastify.jwt.sign({
        userId,
        type: 'refresh',
      }, { expiresIn: '7d' });

      // Update refresh token
      refreshTokens.delete(refreshToken);
      refreshTokens.set(newRefreshToken, userId);

      return reply.send({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 3600,
        tokenType: 'Bearer',
      });
    } catch (error) {
      fastify.log.error('Error refreshing token:', error);
      return reply.code(500).send({ error: 'Token refresh failed' });
    }
  });

  // Logout
  fastify.post('/logout', {
    schema: {
      description: 'User logout',
      tags: ['Authentication'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string' },
        },
        required: ['authorization'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        return reply.code(401).send({ error: 'No authorization header' });
      }

      const token = authHeader.replace('Bearer ', '');
      
      // Remove refresh token if it exists
      refreshTokens.delete(token);

      return reply.send({ message: 'Logged out successfully' });
    } catch (error) {
      fastify.log.error('Error during logout:', error);
      return reply.code(500).send({ error: 'Logout failed' });
    }
  });

  // Generate API key
  fastify.post<ApiKeyRequest>('/api-keys', {
    schema: {
      description: 'Generate API key',
      tags: ['Authentication'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string' },
        },
        required: ['authorization'],
      },
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          permissions: {
            type: 'array',
            items: { type: 'string' },
            default: ['read'],
          },
          expiresAt: { type: 'string', format: 'date-time' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            apiKey: { type: 'string' },
            name: { type: 'string' },
            permissions: { type: 'array', items: { type: 'string' } },
            expiresAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<ApiKeyRequest>, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        return reply.code(401).send({ error: 'No authorization header' });
      }

      const token = authHeader.replace('Bearer ', '');
      const decoded = fastify.jwt.verify(token) as any;
      const userId = decoded.userId;

      const { name, permissions = ['read'], expiresAt } = request.body;

      // Generate API key
      const apiKey = `kal_${Date.now()}_${Math.random().toString(36).substr(2, 32)}`;
      
      apiKeys.set(apiKey, {
        userId,
        name,
        permissions,
        expiresAt,
        createdAt: new Date().toISOString(),
      });

      return reply.code(201).send({
        apiKey,
        name,
        permissions,
        expiresAt,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      fastify.log.error('Error generating API key:', error);
      return reply.code(500).send({ error: 'API key generation failed' });
    }
  });

  // List API keys
  fastify.get('/api-keys', {
    schema: {
      description: 'List user API keys',
      tags: ['Authentication'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string' },
        },
        required: ['authorization'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            apiKeys: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  permissions: { type: 'array', items: { type: 'string' } },
                  expiresAt: { type: 'string', format: 'date-time' },
                  createdAt: { type: 'string', format: 'date-time' },
                  lastUsed: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        return reply.code(401).send({ error: 'No authorization header' });
      }

      const token = authHeader.replace('Bearer ', '');
      const decoded = fastify.jwt.verify(token) as any;
      const userId = decoded.userId;

      // Get user's API keys
      const userApiKeys = Array.from(apiKeys.entries())
        .filter(([_, keyData]) => keyData.userId === userId)
        .map(([apiKey, keyData]) => ({
          name: keyData.name,
          permissions: keyData.permissions,
          expiresAt: keyData.expiresAt,
          createdAt: keyData.createdAt,
          lastUsed: keyData.lastUsed,
        }));

      return reply.send({ apiKeys: userApiKeys });
    } catch (error) {
      fastify.log.error('Error listing API keys:', error);
      return reply.code(500).send({ error: 'Failed to list API keys' });
    }
  });

  // Revoke API key
  fastify.delete('/api-keys/:keyName', {
    schema: {
      description: 'Revoke API key',
      tags: ['Authentication'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string' },
        },
        required: ['authorization'],
      },
      params: {
        type: 'object',
        required: ['keyName'],
        properties: {
          keyName: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        return reply.code(401).send({ error: 'No authorization header' });
      }

      const token = authHeader.replace('Bearer ', '');
      const decoded = fastify.jwt.verify(token) as any;
      const userId = decoded.userId;

      const { keyName } = request.params as { keyName: string };

      // Find and remove API key
      let keyFound = false;
      for (const [apiKey, keyData] of apiKeys.entries()) {
        if (keyData.userId === userId && keyData.name === keyName) {
          apiKeys.delete(apiKey);
          keyFound = true;
          break;
        }
      }

      if (!keyFound) {
        return reply.code(404).send({ error: 'API key not found' });
      }

      return reply.send({ message: 'API key revoked successfully' });
    } catch (error) {
      fastify.log.error('Error revoking API key:', error);
      return reply.code(500).send({ error: 'Failed to revoke API key' });
    }
  });

  // Validate token
  fastify.post<ValidateTokenRequest>('/validate', {
    schema: {
      description: 'Validate JWT token',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            decoded: { type: 'object' },
            expiresAt: { type: 'string', format: 'date-time' },
          },
        },
        401: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<ValidateTokenRequest>, reply: FastifyReply) => {
    try {
      const { token } = request.body;
      
      try {
        const decoded = fastify.jwt.verify(token) as any;
        const expiresAt = new Date(decoded.exp * 1000).toISOString();
        
        return reply.send({
          valid: true,
          decoded: {
            userId: decoded.userId,
            username: decoded.username,
          },
          expiresAt,
        });
      } catch (error) {
        return reply.code(401).send({
          valid: false,
          error: 'Invalid token',
        });
      }
    } catch (error) {
      fastify.log.error('Error validating token:', error);
      return reply.code(500).send({ error: 'Token validation failed' });
    }
  });
}