import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BlockchainService } from '../../src/lib/blockchain-service';

// Types
interface GetDagStateRequest {
  Querystring: {
    limit?: number;
    offset?: number;
  };
}

interface GetNodeRequest {
  Params: {
    nodeId: string;
  };
}

interface GetTipsRequest {
  Querystring: {
    max?: number;
  };
}

interface GetNodeHistoryRequest {
  Params: {
    nodeId: string;
  };
  Querystring: {
    depth?: number;
  };
}

// Routes
export async function blockchainRoutes(fastify: FastifyInstance) {
  const blockchainService = new BlockchainService();

  // Get DAG state
  fastify.get<GetDagStateRequest>('/dag', {
    schema: {
      description: 'Get current DAG state',
      tags: ['Blockchain'],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 1000, default: 100 },
          offset: { type: 'number', minimum: 0, default: 0 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            nodes: {
              type: 'array',
              items: { $ref: 'Block' },
            },
            total: { type: 'number' },
            tips: {
              type: 'array',
              items: { type: 'string' },
            },
            metrics: {
              type: 'object',
              properties: {
                totalNodes: { type: 'number' },
                totalTransactions: { type: 'number' },
                confirmationTime: { type: 'number' },
                throughput: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<GetDagStateRequest>, reply: FastifyReply) => {
    try {
      const { limit = 100, offset = 0 } = request.query;
      const dagState = await blockchainService.getDagState(limit, offset);
      return reply.send(dagState);
    } catch (error) {
      fastify.log.error('Error getting DAG state:', error);
      return reply.code(500).send({ error: 'Failed to get DAG state' });
    }
  });

  // Get specific node
  fastify.get<GetNodeRequest>('/dag/nodes/:nodeId', {
    schema: {
      description: 'Get specific node by ID',
      tags: ['Blockchain'],
      params: {
        type: 'object',
        required: ['nodeId'],
        properties: {
          nodeId: { type: 'string' },
        },
      },
      response: {
        200: {
          $ref: 'Block',
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<GetNodeRequest>, reply: FastifyReply) => {
    try {
      const { nodeId } = request.params;
      const node = await blockchainService.getNode(nodeId);
      
      if (!node) {
        return reply.code(404).send({ error: 'Node not found' });
      }
      
      return reply.send(node);
    } catch (error) {
      fastify.log.error('Error getting node:', error);
      return reply.code(500).send({ error: 'Failed to get node' });
    }
  });

  // Get DAG tips
  fastify.get<GetTipsRequest>('/dag/tips', {
    schema: {
      description: 'Get current DAG tips (unconfirmed transactions)',
      tags: ['Blockchain'],
      querystring: {
        type: 'object',
        properties: {
          max: { type: 'number', minimum: 1, maximum: 100, default: 10 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            tips: {
              type: 'array',
              items: { $ref: 'Transaction' },
            },
            count: { type: 'number' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<GetTipsRequest>, reply: FastifyReply) => {
    try {
      const { max = 10 } = request.query;
      const tips = await blockchainService.getTips(max);
      return reply.send({
        tips,
        count: tips.length,
      });
    } catch (error) {
      fastify.log.error('Error getting tips:', error);
      return reply.code(500).send({ error: 'Failed to get tips' });
    }
  });

  // Get node history
  fastify.get<GetNodeHistoryRequest>('/dag/nodes/:nodeId/history', {
    schema: {
      description: 'Get node history and ancestry',
      tags: ['Blockchain'],
      params: {
        type: 'object',
        required: ['nodeId'],
        properties: {
          nodeId: { type: 'string' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          depth: { type: 'number', minimum: 1, maximum: 50, default: 10 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            node: { $ref: 'Block' },
            history: {
              type: 'array',
              items: { $ref: 'Block' },
            },
            depth: { type: 'number' },
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
  }, async (request: FastifyRequest<GetNodeHistoryRequest>, reply: FastifyReply) => {
    try {
      const { nodeId } = request.params;
      const { depth = 10 } = request.query;
      const history = await blockchainService.getNodeHistory(nodeId, depth);
      
      if (!history.node) {
        return reply.code(404).send({ error: 'Node not found' });
      }
      
      return reply.send(history);
    } catch (error) {
      fastify.log.error('Error getting node history:', error);
      return reply.code(500).send({ error: 'Failed to get node history' });
    }
  });

  // Get blockchain status
  fastify.get('/status', {
    schema: {
      description: 'Get blockchain status and metrics',
      tags: ['Blockchain'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            metrics: {
              type: 'object',
              properties: {
                totalNodes: { type: 'number' },
                totalTransactions: { type: 'number' },
                confirmedTransactions: { type: 'number' },
                pendingTransactions: { type: 'number' },
                networkThroughput: { type: 'number' },
                averageConfirmationTime: { type: 'number' },
                activeValidators: { type: 'number' },
                quantumSecurity: { type: 'boolean' },
              },
            },
            version: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const status = await blockchainService.getStatus();
      return reply.send(status);
    } catch (error) {
      fastify.log.error('Error getting blockchain status:', error);
      return reply.code(500).send({ error: 'Failed to get blockchain status' });
    }
  });

  // Get network info
  fastify.get('/network', {
    schema: {
      description: 'Get network information',
      tags: ['Blockchain'],
      response: {
        200: {
          type: 'object',
          properties: {
            networkId: { type: 'string' },
            version: { type: 'string' },
            peers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  address: { type: 'string' },
                  lastSeen: { type: 'string', format: 'date-time' },
                  reputation: { type: 'number' },
                },
              },
            },
            totalPeers: { type: 'number' },
            syncStatus: {
              type: 'object',
              properties: {
                isSyncing: { type: 'boolean' },
                currentBlock: { type: 'string' },
                highestBlock: { type: 'string' },
                progress: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const networkInfo = await blockchainService.getNetworkInfo();
      return reply.send(networkInfo);
    } catch (error) {
      fastify.log.error('Error getting network info:', error);
      return reply.code(500).send({ error: 'Failed to get network info' });
    }
  });

  // Get quantum security status
  fastify.get('/quantum-security', {
    schema: {
      description: 'Get quantum security status',
      tags: ['Blockchain'],
      response: {
        200: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            algorithm: { type: 'string' },
            keySize: { type: 'number' },
            lastRotation: { type: 'string', format: 'date-time' },
            nextRotation: { type: 'string', format: 'date-time' },
            securityLevel: { type: 'string' },
            metrics: {
              type: 'object',
              properties: {
                signaturesVerified: { type: 'number' },
                encryptionOperations: { type: 'number' },
                keyGenerationTime: { type: 'number' },
                verificationTime: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const quantumSecurity = await blockchainService.getQuantumSecurityStatus();
      return reply.send(quantumSecurity);
    } catch (error) {
      fastify.log.error('Error getting quantum security status:', error);
      return reply.code(500).send({ error: 'Failed to get quantum security status' });
    }
  });
}