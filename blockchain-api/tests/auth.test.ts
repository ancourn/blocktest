import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authMiddleware, requireRole, requirePermissions } from '../auth/middleware';
import { FastifyRequest, FastifyReply } from 'fastify';

// Mock FastifyReply
const createMockReply = () => ({
  code: vi.fn().mockReturnThis(),
  send: vi.fn().mockReturnThis(),
  header: vi.fn().mockReturnThis(),
}) as any;

// Mock FastifyRequest
const createMockRequest = (overrides = {}) => ({
  headers: {},
  log: {
    error: vi.fn(),
  },
  server: {
    jwt: {
      verify: vi.fn(),
    },
  },
  ...overrides,
}) as any;

describe('Authentication Middleware', () => {
  let mockReply: FastifyReply;
  let mockRequest: FastifyRequest;
  let nextFn: vi.Mock;

  beforeEach(() => {
    mockReply = createMockReply();
    nextFn = vi.fn();
  });

  it('should reject requests without authorization header', async () => {
    mockRequest = createMockRequest({
      headers: {},
    });

    await authMiddleware(mockRequest, mockReply, nextFn);

    expect(mockReply.code).toHaveBeenCalledWith(401);
    expect(mockReply.send).toHaveBeenCalledWith({ error: 'No authorization header' });
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('should accept valid JWT token', async () => {
    const mockToken = 'valid.jwt.token';
    const mockDecoded = { userId: 'user123', username: 'testuser' };

    mockRequest = createMockRequest({
      headers: {
        authorization: `Bearer ${mockToken}`,
      },
      server: {
        jwt: {
          verify: vi.fn().mockReturnValue(mockDecoded),
        },
      },
    });

    await authMiddleware(mockRequest, mockReply, nextFn);

    expect(mockRequest.server.jwt.verify).toHaveBeenCalledWith(mockToken);
    expect(mockRequest.user).toEqual({
      userId: 'user123',
      username: 'testuser',
    });
    expect(nextFn).toHaveBeenCalled();
  });

  it('should accept valid API key', async () => {
    const mockApiKey = 'kal_123456789';
    const mockApiKeyData = {
      userId: 'user123',
      permissions: ['read', 'write'],
    };

    mockRequest = createMockRequest({
      headers: {
        authorization: `Bearer ${mockApiKey}`,
      },
      server: {
        jwt: {
          verify: vi.fn().mockImplementation(() => {
            throw new Error('Invalid JWT');
          }),
        },
      },
    });

    // Mock the verifyApiKey function
    vi.doMock('../auth/middleware', async () => ({
      verifyApiKey: vi.fn().mockResolvedValue(mockApiKeyData),
    }));

    await authMiddleware(mockRequest, mockReply, nextFn);

    expect(mockRequest.user).toEqual({
      userId: 'user123',
      permissions: ['read', 'write'],
    });
    expect(nextFn).toHaveBeenCalled();
  });

  it('should reject invalid tokens', async () => {
    const mockToken = 'invalid.jwt.token';

    mockRequest = createMockRequest({
      headers: {
        authorization: `Bearer ${mockToken}`,
      },
      server: {
        jwt: {
          verify: vi.fn().mockImplementation(() => {
            throw new Error('Invalid token');
          }),
        },
      },
    });

    await authMiddleware(mockRequest, mockReply, nextFn);

    expect(mockReply.code).toHaveBeenCalledWith(401);
    expect(mockReply.send).toHaveBeenCalledWith({ error: 'Invalid token or API key' });
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('should handle authentication errors gracefully', async () => {
    mockRequest = createMockRequest({
      headers: {
        authorization: 'Bearer test.token',
      },
      server: {
        jwt: {
          verify: vi.fn().mockImplementation(() => {
            throw new Error('Network error');
          }),
        },
      },
    });

    await authMiddleware(mockRequest, mockReply, nextFn);

    expect(mockReply.code).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith({ error: 'Authentication failed' });
    expect(nextFn).not.toHaveBeenCalled();
  });
});

describe('Role-based Authorization', () => {
  let mockReply: FastifyReply;
  let mockRequest: FastifyRequest;
  let nextFn: vi.Mock;

  beforeEach(() => {
    mockReply = createMockReply();
    nextFn = vi.fn();
  });

  it('should reject unauthenticated requests', async () => {
    mockRequest = createMockRequest({
      user: undefined,
    });

    const middleware = requireRole(['admin']);
    await middleware(mockRequest, mockReply, nextFn);

    expect(mockReply.code).toHaveBeenCalledWith(401);
    expect(mockReply.send).toHaveBeenCalledWith({ error: 'Authentication required' });
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('should allow users with required roles', async () => {
    mockRequest = createMockRequest({
      user: {
        userId: 'user123',
        roles: ['user', 'admin'],
      },
    });

    const middleware = requireRole(['admin']);
    await middleware(mockRequest, mockReply, nextFn);

    expect(nextFn).toHaveBeenCalled();
  });

  it('should reject users without required roles', async () => {
    mockRequest = createMockRequest({
      user: {
        userId: 'user123',
        roles: ['user'],
      },
    });

    const middleware = requireRole(['admin']);
    await middleware(mockRequest, mockReply, nextFn);

    expect(mockReply.code).toHaveBeenCalledWith(403);
    expect(mockReply.send).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
    expect(nextFn).not.toHaveBeenCalled();
  });
});

describe('Permission-based Authorization', () => {
  let mockReply: FastifyReply;
  let mockRequest: FastifyRequest;
  let nextFn: vi.Mock;

  beforeEach(() => {
    mockReply = createMockReply();
    nextFn = vi.fn();
  });

  it('should reject unauthenticated requests', async () => {
    mockRequest = createMockRequest({
      user: undefined,
    });

    const middleware = requirePermissions(['read']);
    await middleware(mockRequest, mockReply, nextFn);

    expect(mockReply.code).toHaveBeenCalledWith(401);
    expect(mockReply.send).toHaveBeenCalledWith({ error: 'Authentication required' });
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('should allow users with required permissions', async () => {
    mockRequest = createMockRequest({
      user: {
        userId: 'user123',
        permissions: ['read', 'write'],
      },
    });

    const middleware = requirePermissions(['read']);
    await middleware(mockRequest, mockReply, nextFn);

    expect(nextFn).toHaveBeenCalled();
  });

  it('should allow admin users with any permissions', async () => {
    mockRequest = createMockRequest({
      user: {
        userId: 'user123',
        permissions: ['admin'],
      },
    });

    const middleware = requirePermissions(['read', 'write']);
    await middleware(mockRequest, mockReply, nextFn);

    expect(nextFn).toHaveBeenCalled();
  });

  it('should reject users without required permissions', async () => {
    mockRequest = createMockRequest({
      user: {
        userId: 'user123',
        permissions: ['read'],
      },
    });

    const middleware = requirePermissions(['write']);
    await middleware(mockRequest, mockReply, nextFn);

    expect(mockReply.code).toHaveBeenCalledWith(403);
    expect(mockReply.send).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('should handle permission check errors gracefully', async () => {
    mockRequest = createMockRequest({
      user: {
        userId: 'user123',
        permissions: ['read'],
      },
    });

    const middleware = requirePermissions(['write']);
    await middleware(mockRequest, mockReply, nextFn);

    expect(mockReply.code).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith({ error: 'Permission check failed' });
    expect(nextFn).not.toHaveBeenCalled();
  });
});