import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BlockchainService } from '../../src/lib/blockchain-service';

// Types
interface GetConsensusStatusRequest {
  Querystring: {
    detailed?: boolean;
  };
}

interface GetValidatorsRequest {
  Querystring: {
    active?: boolean;
    limit?: number;
    offset?: number;
  };
}

interface GetValidatorRequest {
  Params: {
    validatorId: string;
  };
}

interface GetConsensusMetricsRequest {
  Querystring: {
    timeframe?: '1h' | '24h' | '7d' | '30d';
  };
}

interface SubmitVoteRequest {
  Body: {
    proposalId: string;
    vote: 'approve' | 'reject' | 'abstain';
    validatorId: string;
    signature: string;
  };
}

// Routes
export async function consensusRoutes(fastify: FastifyInstance) {
  const blockchainService = new BlockchainService();

  // Get consensus status
  fastify.get<GetConsensusStatusRequest>('/status', {
    schema: {
      description: 'Get consensus status and information',
      tags: ['Consensus'],
      querystring: {
        type: 'object',
        properties: {
          detailed: { type: 'boolean', default: false },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            algorithm: { type: 'string' },
            status: { type: 'string' },
            round: { type: 'number' },
            phase: { type: 'string' },
            validators: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                active: { type: 'number' },
                required: { type: 'number' },
              },
            },
            lastBlock: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            metrics: {
              type: 'object',
              properties: {
                blockTime: { type: 'number' },
                finalityTime: { type: 'number' },
                throughput: { type: 'number' },
                successRate: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<GetConsensusStatusRequest>, reply: FastifyReply) => {
    try {
      const { detailed = false } = request.query;
      const status = await blockchainService.getConsensusStatus(detailed);
      return reply.send(status);
    } catch (error) {
      fastify.log.error('Error getting consensus status:', error);
      return reply.code(500).send({ error: 'Failed to get consensus status' });
    }
  });

  // Get validators
  fastify.get<GetValidatorsRequest>('/validators', {
    schema: {
      description: 'Get list of validators',
      tags: ['Consensus'],
      querystring: {
        type: 'object',
        properties: {
          active: { type: 'boolean' },
          limit: { type: 'number', minimum: 1, maximum: 1000, default: 100 },
          offset: { type: 'number', minimum: 0, default: 0 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            validators: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  address: { type: 'string' },
                  stake: { type: 'number' },
                  reputation: { type: 'number' },
                  status: { type: 'string' },
                  lastActive: { type: 'string', format: 'date-time' },
                  blocksProduced: { type: 'number' },
                  uptime: { type: 'number' },
                },
              },
            },
            total: { type: 'number' },
            limit: { type: 'number' },
            offset: { type: 'number' },
            filters: {
              type: 'object',
              properties: {
                active: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<GetValidatorsRequest>, reply: FastifyReply) => {
    try {
      const { active, limit = 100, offset = 0 } = request.query;
      const validators = await blockchainService.getValidators(active, limit, offset);
      return reply.send(validators);
    } catch (error) {
      fastify.log.error('Error getting validators:', error);
      return reply.code(500).send({ error: 'Failed to get validators' });
    }
  });

  // Get specific validator
  fastify.get<GetValidatorRequest>('/validators/:validatorId', {
    schema: {
      description: 'Get specific validator information',
      tags: ['Consensus'],
      params: {
        type: 'object',
        required: ['validatorId'],
        properties: {
          validatorId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            address: { type: 'string' },
            publicKey: { type: 'string' },
            stake: { type: 'number' },
            reputation: { type: 'number' },
            status: { type: 'string' },
            joinedAt: { type: 'string', format: 'date-time' },
            lastActive: { type: 'string', format: 'date-time' },
            blocksProduced: { type: 'number' },
            blocksMissed: { type: 'number' },
            uptime: { type: 'number' },
            rewards: { type: 'number' },
            penalties: { type: 'number' },
            performance: {
              type: 'object',
              properties: {
                blockProductionRate: { type: 'number' },
                voteParticipation: { type: 'number' },
                responseTime: { type: 'number' },
              },
            },
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
  }, async (request: FastifyRequest<GetValidatorRequest>, reply: FastifyReply) => {
    try {
      const { validatorId } = request.params;
      const validator = await blockchainService.getValidator(validatorId);
      
      if (!validator) {
        return reply.code(404).send({ error: 'Validator not found' });
      }
      
      return reply.send(validator);
    } catch (error) {
      fastify.log.error('Error getting validator:', error);
      return reply.code(500).send({ error: 'Failed to get validator' });
    }
  });

  // Get consensus metrics
  fastify.get<GetConsensusMetricsRequest>('/metrics', {
    schema: {
      description: 'Get consensus performance metrics',
      tags: ['Consensus'],
      querystring: {
        type: 'object',
        properties: {
          timeframe: { type: 'string', enum: ['1h', '24h', '7d', '30d'], default: '24h' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            timeframe: { type: 'string' },
            metrics: {
              type: 'object',
              properties: {
                blockTime: {
                  type: 'object',
                  properties: {
                    average: { type: 'number' },
                    median: { type: 'number' },
                    min: { type: 'number' },
                    max: { type: 'number' },
                  },
                },
                finalityTime: {
                  type: 'object',
                  properties: {
                    average: { type: 'number' },
                    median: { type: 'number' },
                    min: { type: 'number' },
                    max: { type: 'number' },
                  },
                },
                throughput: {
                  type: 'object',
                  properties: {
                    tps: { type: 'number' },
                    blockCount: { type: 'number' },
                    transactionCount: { type: 'number' },
                  },
                },
                successRate: { type: 'number' },
                validatorParticipation: { type: 'number' },
                forkRate: { type: 'number' },
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<GetConsensusMetricsRequest>, reply: FastifyReply) => {
    try {
      const { timeframe = '24h' } = request.query;
      const metrics = await blockchainService.getConsensusMetrics(timeframe);
      return reply.send(metrics);
    } catch (error) {
      fastify.log.error('Error getting consensus metrics:', error);
      return reply.code(500).send({ error: 'Failed to get consensus metrics' });
    }
  });

  // Get active proposals
  fastify.get('/proposals', {
    schema: {
      description: 'Get active consensus proposals',
      tags: ['Consensus'],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['active', 'pending', 'completed', 'failed'], default: 'active' },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'number', minimum: 0, default: 0 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            proposals: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  type: { type: 'string' },
                  status: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  expiresAt: { type: 'string', format: 'date-time' },
                  votes: {
                    type: 'object',
                    properties: {
                      approve: { type: 'number' },
                      reject: { type: 'number' },
                      abstain: { type: 'number' },
                      total: { type: 'number' },
                    },
                  },
                  threshold: { type: 'number' },
                },
              },
            },
            total: { type: 'number' },
            limit: { type: 'number' },
            offset: { type: 'number' },
            filters: {
              type: 'object',
              properties: {
                status: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { status = 'active', limit = 20, offset = 0 } = request.query as any;
      const proposals = await blockchainService.getProposals(status, limit, offset);
      return reply.send(proposals);
    } catch (error) {
      fastify.log.error('Error getting proposals:', error);
      return reply.code(500).send({ error: 'Failed to get proposals' });
    }
  });

  // Submit vote
  fastify.post<SubmitVoteRequest>('/vote', {
    schema: {
      description: 'Submit vote for consensus proposal',
      tags: ['Consensus'],
      body: {
        type: 'object',
        required: ['proposalId', 'vote', 'validatorId', 'signature'],
        properties: {
          proposalId: { type: 'string' },
          vote: { type: 'string', enum: ['approve', 'reject', 'abstain'] },
          validatorId: { type: 'string' },
          signature: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            proposalId: { type: 'string' },
            vote: { type: 'string' },
            validatorId: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            status: { type: 'string' },
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
  }, async (request: FastifyRequest<SubmitVoteRequest>, reply: FastifyReply) => {
    try {
      const { proposalId, vote, validatorId, signature } = request.body;
      
      const result = await blockchainService.submitVote({
        proposalId,
        vote,
        validatorId,
        signature,
      });

      return reply.code(201).send({
        proposalId,
        vote,
        validatorId,
        timestamp: new Date().toISOString(),
        status: result.status,
      });
    } catch (error) {
      fastify.log.error('Error submitting vote:', error);
      
      if (error.message.includes('invalid signature')) {
        return reply.code(400).send({ error: 'Invalid signature' });
      }
      
      if (error.message.includes('proposal not found')) {
        return reply.code(404).send({ error: 'Proposal not found' });
      }
      
      if (error.message.includes('validator not found')) {
        return reply.code(404).send({ error: 'Validator not found' });
      }
      
      return reply.code(500).send({ error: 'Failed to submit vote' });
    }
  });

  // Get consensus history
  fastify.get('/history', {
    schema: {
      description: 'Get consensus history and events',
      tags: ['Consensus'],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 1000, default: 100 },
          offset: { type: 'number', minimum: 0, default: 0 },
          type: { type: 'string', enum: ['block', 'vote', 'proposal', 'validator'], default: 'block' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            events: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' },
                  data: { type: 'object' },
                },
              },
            },
            total: { type: 'number' },
            limit: { type: 'number' },
            offset: { type: 'number' },
            filters: {
              type: 'object',
              properties: {
                type: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { limit = 100, offset = 0, type = 'block' } = request.query as any;
      const history = await blockchainService.getConsensusHistory(limit, offset, type);
      return reply.send(history);
    } catch (error) {
      fastify.log.error('Error getting consensus history:', error);
      return reply.code(500).send({ error: 'Failed to get consensus history' });
    }
  });

  // Get fork information
  fastify.get('/forks', {
    schema: {
      description: 'Get fork information and resolution status',
      tags: ['Consensus'],
      response: {
        200: {
          type: 'object',
          properties: {
            activeForks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  blockHash: { type: 'string' },
                  height: { type: 'number' },
                  createdAt: { type: 'string', format: 'date-time' },
                  validators: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                  status: { type: 'string' },
                },
              },
            },
            resolvedForks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  blockHash: { type: 'string' },
                  resolvedAt: { type: 'string', format: 'date-time' },
                  resolutionTime: { type: 'number' },
                  winningChain: { type: 'string' },
                },
              },
            },
            totalForks: { type: 'number' },
            resolutionRate: { type: 'number' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const forks = await blockchainService.getForkInformation();
      return reply.send(forks);
    } catch (error) {
      fastify.log.error('Error getting fork information:', error);
      return reply.code(500).send({ error: 'Failed to get fork information' });
    }
  });

  // Get validator rewards
  fastify.get('/rewards', {
    schema: {
      description: 'Get validator rewards and distribution',
      tags: ['Consensus'],
      querystring: {
        type: 'object',
        properties: {
          validatorId: { type: 'string' },
          timeframe: { type: 'string', enum: ['1h', '24h', '7d', '30d'], default: '24h' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            totalRewards: { type: 'number' },
            timeframe: { type: 'string' },
            rewards: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  validatorId: { type: 'string' },
                  amount: { type: 'number' },
                  blockHash: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' },
                  type: { type: 'string' },
                },
              },
            },
            distribution: {
              type: 'object',
              properties: {
                topValidators: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      validatorId: { type: 'string' },
                      rewards: { type: 'number' },
                      percentage: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { validatorId, timeframe = '24h' } = request.query as any;
      const rewards = await blockchainService.getValidatorRewards(validatorId, timeframe);
      return reply.send(rewards);
    } catch (error) {
      fastify.log.error('Error getting validator rewards:', error);
      return reply.code(500).send({ error: 'Failed to get validator rewards' });
    }
  });
}