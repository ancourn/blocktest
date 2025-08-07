import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BlockchainService } from '../../src/lib/blockchain-service';

// Types
interface SubmitTransactionRequest {
  Body: {
    sender: string;
    receiver: string;
    amount: number;
    data?: any;
    privateKey?: string;
  };
}

interface GetTransactionRequest {
  Params: {
    transactionId: string;
  };
}

interface GetTransactionsRequest {
  Querystring: {
    limit?: number;
    offset?: number;
    sender?: string;
    receiver?: string;
    status?: 'pending' | 'confirmed' | 'failed';
  };
}

interface ValidateTransactionRequest {
  Body: {
    transaction: any;
  };
}

// Routes
export async function transactionRoutes(fastify: FastifyInstance) {
  const blockchainService = new BlockchainService();

  // Submit transaction
  fastify.post<SubmitTransactionRequest>('/submit', {
    schema: {
      description: 'Submit a new transaction to the blockchain',
      tags: ['Transactions'],
      body: {
        type: 'object',
        required: ['sender', 'receiver', 'amount'],
        properties: {
          sender: { type: 'string', format: 'address' },
          receiver: { type: 'string', format: 'address' },
          amount: { type: 'number', minimum: 0 },
          data: { type: 'object' },
          privateKey: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            transactionId: { type: 'string' },
            status: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            message: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'object' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<SubmitTransactionRequest>, reply: FastifyReply) => {
    try {
      const { sender, receiver, amount, data, privateKey } = request.body;
      
      // Validate input
      if (!sender || !receiver || amount === undefined) {
        return reply.code(400).send({
          error: 'Missing required fields',
          details: { required: ['sender', 'receiver', 'amount'] },
        });
      }

      if (amount <= 0) {
        return reply.code(400).send({
          error: 'Amount must be greater than 0',
        });
      }

      // Submit transaction
      const result = await blockchainService.submitTransaction({
        sender,
        receiver,
        amount,
        data,
        privateKey,
      });

      return reply.code(201).send({
        transactionId: result.transactionId,
        status: result.status,
        timestamp: new Date().toISOString(),
        message: 'Transaction submitted successfully',
      });
    } catch (error) {
      fastify.log.error('Error submitting transaction:', error);
      
      if (error.message.includes('insufficient balance')) {
        return reply.code(400).send({ error: 'Insufficient balance' });
      }
      
      if (error.message.includes('invalid signature')) {
        return reply.code(400).send({ error: 'Invalid signature' });
      }
      
      return reply.code(500).send({ error: 'Failed to submit transaction' });
    }
  });

  // Get transaction
  fastify.get<GetTransactionRequest>('/:transactionId', {
    schema: {
      description: 'Get transaction by ID',
      tags: ['Transactions'],
      params: {
        type: 'object',
        required: ['transactionId'],
        properties: {
          transactionId: { type: 'string' },
        },
      },
      response: {
        200: {
          $ref: 'Transaction',
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<GetTransactionRequest>, reply: FastifyReply) => {
    try {
      const { transactionId } = request.params;
      const transaction = await blockchainService.getTransaction(transactionId);
      
      if (!transaction) {
        return reply.code(404).send({ error: 'Transaction not found' });
      }
      
      return reply.send(transaction);
    } catch (error) {
      fastify.log.error('Error getting transaction:', error);
      return reply.code(500).send({ error: 'Failed to get transaction' });
    }
  });

  // Get transactions
  fastify.get<GetTransactionsRequest>('/', {
    schema: {
      description: 'Get transactions with optional filtering',
      tags: ['Transactions'],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 1000, default: 100 },
          offset: { type: 'number', minimum: 0, default: 0 },
          sender: { type: 'string', format: 'address' },
          receiver: { type: 'string', format: 'address' },
          status: { type: 'string', enum: ['pending', 'confirmed', 'failed'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            transactions: {
              type: 'array',
              items: { $ref: 'Transaction' },
            },
            total: { type: 'number' },
            limit: { type: 'number' },
            offset: { type: 'number' },
            filters: {
              type: 'object',
              properties: {
                sender: { type: 'string' },
                receiver: { type: 'string' },
                status: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<GetTransactionsRequest>, reply: FastifyReply) => {
    try {
      const { limit = 100, offset = 0, sender, receiver, status } = request.query;
      
      const filters = {
        sender,
        receiver,
        status,
      };

      const result = await blockchainService.getTransactions(limit, offset, filters);
      
      return reply.send({
        transactions: result.transactions,
        total: result.total,
        limit,
        offset,
        filters,
      });
    } catch (error) {
      fastify.log.error('Error getting transactions:', error);
      return reply.code(500).send({ error: 'Failed to get transactions' });
    }
  });

  // Validate transaction
  fastify.post<ValidateTransactionRequest>('/validate', {
    schema: {
      description: 'Validate a transaction before submission',
      tags: ['Transactions'],
      body: {
        type: 'object',
        required: ['transaction'],
        properties: {
          transaction: { type: 'object' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            isValid: { type: 'boolean' },
            errors: {
              type: 'array',
              items: { type: 'string' },
            },
            warnings: {
              type: 'array',
              items: { type: 'string' },
            },
            estimatedFee: { type: 'number' },
            estimatedConfirmationTime: { type: 'number' },
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
  }, async (request: FastifyRequest<ValidateTransactionRequest>, reply: FastifyReply) => {
    try {
      const { transaction } = request.body;
      
      const validation = await blockchainService.validateTransaction(transaction);
      
      return reply.send(validation);
    } catch (error) {
      fastify.log.error('Error validating transaction:', error);
      return reply.code(500).send({ error: 'Failed to validate transaction' });
    }
  });

  // Get transaction history for address
  fastify.get('/address/:address', {
    schema: {
      description: 'Get transaction history for a specific address',
      tags: ['Transactions'],
      params: {
        type: 'object',
        required: ['address'],
        properties: {
          address: { type: 'string', format: 'address' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 1000, default: 100 },
          offset: { type: 'number', minimum: 0, default: 0 },
          type: { type: 'string', enum: ['sent', 'received', 'all'], default: 'all' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            address: { type: 'string' },
            transactions: {
              type: 'array',
              items: { $ref: 'Transaction' },
            },
            total: { type: 'number' },
            balance: { type: 'number' },
            stats: {
              type: 'object',
              properties: {
                totalSent: { type: 'number' },
                totalReceived: { type: 'number' },
                transactionCount: { type: 'number' },
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
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { address } = request.params as { address: string };
      const { limit = 100, offset = 0, type = 'all' } = request.query as any;
      
      const history = await blockchainService.getAddressTransactionHistory(
        address,
        limit,
        offset,
        type
      );
      
      if (!history) {
        return reply.code(404).send({ error: 'Address not found' });
      }
      
      return reply.send(history);
    } catch (error) {
      fastify.log.error('Error getting address transaction history:', error);
      return reply.code(500).send({ error: 'Failed to get address transaction history' });
    }
  });

  // Get pending transactions
  fastify.get('/pending', {
    schema: {
      description: 'Get pending transactions',
      tags: ['Transactions'],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 1000, default: 100 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            transactions: {
              type: 'array',
              items: { $ref: 'Transaction' },
            },
            count: { type: 'number' },
            totalFees: { type: 'number' },
            oldestTransaction: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { limit = 100 } = request.query as { limit?: number };
      
      const pending = await blockchainService.getPendingTransactions(limit);
      
      return reply.send(pending);
    } catch (error) {
      fastify.log.error('Error getting pending transactions:', error);
      return reply.code(500).send({ error: 'Failed to get pending transactions' });
    }
  });

  // Get transaction fees
  fastify.get('/fees', {
    schema: {
      description: 'Get current transaction fees',
      tags: ['Transactions'],
      response: {
        200: {
          type: 'object',
          properties: {
            baseFee: { type: 'number' },
            priorityFee: { type: 'number' },
            estimatedFee: { type: 'number' },
            feeHistory: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string', format: 'date-time' },
                  fee: { type: 'number' },
                },
              },
            },
            recommendations: {
              type: 'object',
              properties: {
                slow: { type: 'number' },
                average: { type: 'number' },
                fast: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const fees = await blockchainService.getTransactionFees();
      return reply.send(fees);
    } catch (error) {
      fastify.log.error('Error getting transaction fees:', error);
      return reply.code(500).send({ error: 'Failed to get transaction fees' });
    }
  });
}