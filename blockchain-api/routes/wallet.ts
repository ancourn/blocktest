import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BlockchainService } from '../../src/lib/blockchain-service';

// Types
interface CreateWalletRequest {
  Body: {
    name?: string;
    password?: string;
    type?: 'standard' | 'hardware' | 'multisig';
  };
}

interface ImportWalletRequest {
  Body: {
    privateKey: string;
    name?: string;
    password?: string;
  };
}

interface GetWalletRequest {
  Params: {
    walletId: string;
  };
}

interface UpdateWalletRequest {
  Params: {
    walletId: string;
  };
  Body: {
    name?: string;
    password?: string;
  };
}

interface SignTransactionRequest {
  Params: {
    walletId: string;
  };
  Body: {
    transaction: any;
    password?: string;
  };
}

interface ExportWalletRequest {
  Params: {
    walletId: string;
  };
  Body: {
    password?: string;
    format?: 'privateKey' | 'mnemonic' | 'keystore';
  };
}

// Routes
export async function walletRoutes(fastify: FastifyInstance) {
  const blockchainService = new BlockchainService();

  // Create wallet
  fastify.post<CreateWalletRequest>('/create', {
    schema: {
      description: 'Create a new wallet',
      tags: ['Wallet'],
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          password: { type: 'string' },
          type: { type: 'string', enum: ['standard', 'hardware', 'multisig'], default: 'standard' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            walletId: { type: 'string' },
            address: { type: 'string' },
            publicKey: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            warning: { type: 'string' },
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
  }, async (request: FastifyRequest<CreateWalletRequest>, reply: FastifyReply) => {
    try {
      const { name, password, type = 'standard' } = request.body;
      
      const wallet = await blockchainService.createWallet({
        name,
        password,
        type,
      });

      return reply.code(201).send({
        walletId: wallet.id,
        address: wallet.address,
        publicKey: wallet.publicKey,
        name: wallet.name,
        type: wallet.type,
        createdAt: wallet.createdAt,
        warning: 'Store your private key securely. It cannot be recovered if lost.',
      });
    } catch (error) {
      fastify.log.error('Error creating wallet:', error);
      return reply.code(500).send({ error: 'Failed to create wallet' });
    }
  });

  // Import wallet
  fastify.post<ImportWalletRequest>('/import', {
    schema: {
      description: 'Import wallet from private key',
      tags: ['Wallet'],
      body: {
        type: 'object',
        required: ['privateKey'],
        properties: {
          privateKey: { type: 'string' },
          name: { type: 'string' },
          password: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            walletId: { type: 'string' },
            address: { type: 'string' },
            publicKey: { type: 'string' },
            name: { type: 'string' },
            importedAt: { type: 'string', format: 'date-time' },
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
  }, async (request: FastifyRequest<ImportWalletRequest>, reply: FastifyReply) => {
    try {
      const { privateKey, name, password } = request.body;
      
      const wallet = await blockchainService.importWallet({
        privateKey,
        name,
        password,
      });

      return reply.code(201).send({
        walletId: wallet.id,
        address: wallet.address,
        publicKey: wallet.publicKey,
        name: wallet.name,
        importedAt: new Date().toISOString(),
      });
    } catch (error) {
      fastify.log.error('Error importing wallet:', error);
      
      if (error.message.includes('invalid private key')) {
        return reply.code(400).send({ error: 'Invalid private key' });
      }
      
      return reply.code(500).send({ error: 'Failed to import wallet' });
    }
  });

  // Get wallet
  fastify.get<GetWalletRequest>('/:walletId', {
    schema: {
      description: 'Get wallet information',
      tags: ['Wallet'],
      params: {
        type: 'object',
        required: ['walletId'],
        properties: {
          walletId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            walletId: { type: 'string' },
            address: { type: 'string' },
            publicKey: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string' },
            balance: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            lastActivity: { type: 'string', format: 'date-time' },
            transactionCount: { type: 'number' },
            isEncrypted: { type: 'boolean' },
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
  }, async (request: FastifyRequest<GetWalletRequest>, reply: FastifyReply) => {
    try {
      const { walletId } = request.params;
      const wallet = await blockchainService.getWallet(walletId);
      
      if (!wallet) {
        return reply.code(404).send({ error: 'Wallet not found' });
      }
      
      return reply.send(wallet);
    } catch (error) {
      fastify.log.error('Error getting wallet:', error);
      return reply.code(500).send({ error: 'Failed to get wallet' });
    }
  });

  // Update wallet
  fastify.put<UpdateWalletRequest>('/:walletId', {
    schema: {
      description: 'Update wallet information',
      tags: ['Wallet'],
      params: {
        type: 'object',
        required: ['walletId'],
        properties: {
          walletId: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          password: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            walletId: { type: 'string' },
            name: { type: 'string' },
            updatedAt: { type: 'string', format: 'date-time' },
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
  }, async (request: FastifyRequest<UpdateWalletRequest>, reply: FastifyReply) => {
    try {
      const { walletId } = request.params;
      const { name, password } = request.body;
      
      const wallet = await blockchainService.updateWallet(walletId, {
        name,
        password,
      });
      
      if (!wallet) {
        return reply.code(404).send({ error: 'Wallet not found' });
      }
      
      return reply.send({
        walletId,
        name: wallet.name,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      fastify.log.error('Error updating wallet:', error);
      return reply.code(500).send({ error: 'Failed to update wallet' });
    }
  });

  // Get wallet balance
  fastify.get<GetWalletRequest>('/:walletId/balance', {
    schema: {
      description: 'Get wallet balance',
      tags: ['Wallet'],
      params: {
        type: 'object',
        required: ['walletId'],
        properties: {
          walletId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            walletId: { type: 'string' },
            address: { type: 'string' },
            balance: { type: 'number' },
            pendingBalance: { type: 'number' },
            lastUpdated: { type: 'string', format: 'date-time' },
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
  }, async (request: FastifyRequest<GetWalletRequest>, reply: FastifyReply) => {
    try {
      const { walletId } = request.params;
      const balance = await blockchainService.getWalletBalance(walletId);
      
      if (balance === null) {
        return reply.code(404).send({ error: 'Wallet not found' });
      }
      
      return reply.send({
        walletId,
        address: balance.address,
        balance: balance.confirmed,
        pendingBalance: balance.pending,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      fastify.log.error('Error getting wallet balance:', error);
      return reply.code(500).send({ error: 'Failed to get wallet balance' });
    }
  });

  // Sign transaction
  fastify.post<SignTransactionRequest>('/:walletId/sign', {
    schema: {
      description: 'Sign transaction with wallet',
      tags: ['Wallet'],
      params: {
        type: 'object',
        required: ['walletId'],
        properties: {
          walletId: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        required: ['transaction'],
        properties: {
          transaction: { type: 'object' },
          password: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            transaction: { type: 'object' },
            signature: { type: 'string' },
            signedAt: { type: 'string', format: 'date-time' },
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
  }, async (request: FastifyRequest<SignTransactionRequest>, reply: FastifyReply) => {
    try {
      const { walletId } = request.params;
      const { transaction, password } = request.body;
      
      const result = await blockchainService.signTransaction(walletId, transaction, password);
      
      if (!result) {
        return reply.code(404).send({ error: 'Wallet not found' });
      }
      
      return reply.send({
        transaction: result.transaction,
        signature: result.signature,
        signedAt: new Date().toISOString(),
      });
    } catch (error) {
      fastify.log.error('Error signing transaction:', error);
      
      if (error.message.includes('invalid password')) {
        return reply.code(400).send({ error: 'Invalid password' });
      }
      
      return reply.code(500).send({ error: 'Failed to sign transaction' });
    }
  });

  // Export wallet
  fastify.post<ExportWalletRequest>('/:walletId/export', {
    schema: {
      description: 'Export wallet',
      tags: ['Wallet'],
      params: {
        type: 'object',
        required: ['walletId'],
        properties: {
          walletId: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          password: { type: 'string' },
          format: { type: 'string', enum: ['privateKey', 'mnemonic', 'keystore'], default: 'privateKey' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            format: { type: 'string' },
            data: { type: 'string' },
            exportedAt: { type: 'string', format: 'date-time' },
            warning: { type: 'string' },
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
  }, async (request: FastifyRequest<ExportWalletRequest>, reply: FastifyReply) => {
    try {
      const { walletId } = request.params;
      const { password, format = 'privateKey' } = request.body;
      
      const result = await blockchainService.exportWallet(walletId, password, format);
      
      if (!result) {
        return reply.code(404).send({ error: 'Wallet not found' });
      }
      
      return reply.send({
        format,
        data: result.data,
        exportedAt: new Date().toISOString(),
        warning: 'Keep this data secure. Anyone with access can control your wallet.',
      });
    } catch (error) {
      fastify.log.error('Error exporting wallet:', error);
      
      if (error.message.includes('invalid password')) {
        return reply.code(400).send({ error: 'Invalid password' });
      }
      
      return reply.code(500).send({ error: 'Failed to export wallet' });
    }
  });

  // List wallets
  fastify.get('/', {
    schema: {
      description: 'List all wallets',
      tags: ['Wallet'],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'number', minimum: 0, default: 0 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            wallets: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  walletId: { type: 'string' },
                  address: { type: 'string' },
                  name: { type: 'string' },
                  type: { type: 'string' },
                  balance: { type: 'number' },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
            total: { type: 'number' },
            limit: { type: 'number' },
            offset: { type: 'number' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { limit = 20, offset = 0 } = request.query as { limit?: number; offset?: number };
      
      const wallets = await blockchainService.listWallets(limit, offset);
      
      return reply.send(wallets);
    } catch (error) {
      fastify.log.error('Error listing wallets:', error);
      return reply.code(500).send({ error: 'Failed to list wallets' });
    }
  });

  // Delete wallet
  fastify.delete<GetWalletRequest>('/:walletId', {
    schema: {
      description: 'Delete wallet',
      tags: ['Wallet'],
      params: {
        type: 'object',
        required: ['walletId'],
        properties: {
          walletId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            walletId: { type: 'string' },
            deleted: { type: 'boolean' },
            deletedAt: { type: 'string', format: 'date-time' },
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
  }, async (request: FastifyRequest<GetWalletRequest>, reply: FastifyReply) => {
    try {
      const { walletId } = request.params;
      const deleted = await blockchainService.deleteWallet(walletId);
      
      if (!deleted) {
        return reply.code(404).send({ error: 'Wallet not found' });
      }
      
      return reply.send({
        walletId,
        deleted: true,
        deletedAt: new Date().toISOString(),
      });
    } catch (error) {
      fastify.log.error('Error deleting wallet:', error);
      return reply.code(500).send({ error: 'Failed to delete wallet' });
    }
  });
}