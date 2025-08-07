# KALDRIX Blockchain TypeScript Interfaces

Complete TypeScript type definitions and interfaces for interacting with the KALDRIX blockchain core from frontend applications.

## Overview

This package provides comprehensive TypeScript interfaces for the KALDRIX blockchain, enabling type-safe interaction with the Rust blockchain core through APIs and WebSockets. It includes interfaces for all major blockchain components:

- **DAG (Directed Acyclic Graph)** - Core blockchain structure
- **Quantum Cryptography** - Post-quantum secure cryptographic operations
- **Consensus Engine** - PBFT-based consensus mechanism
- **Network Layer** - Peer-to-peer networking
- **Types & Utilities** - Core data types and utility functions

## Installation

```bash
npm install @kaldrix/blockchain-types
# or
yarn add @kaldrix/blockchain-types
```

## Quick Start

```typescript
import { 
  createKaldrixBlockchain, 
  DefaultBlockchainConfig,
  Transaction,
  DAGNode 
} from '@kaldrix/blockchain-types';

// Create blockchain instance
const blockchain = await createKaldrixBlockchain(DefaultBlockchainConfig);

// Start the blockchain
await blockchain.start();

// Create and submit a transaction
const transaction: Transaction = {
  id: crypto.getRandomValues(new Uint8Array(32)) as any,
  sender: crypto.getRandomValues(new Uint8Array(32)) as any,
  receiver: crypto.getRandomValues(new Uint8Array(32)) as any,
  amount: 1000000000000000000n, // 1 ETH
  gasPrice: 20000000000n, // 20 Gwei
  gasLimit: 21000n,
  nonce: 1,
  data: new Uint8Array(),
  signature: new Uint8Array(),
  timestamp: Date.now(),
  priority: 5,
};

await blockchain.dag.addTransaction(transaction);

// Get blockchain status
const status = await blockchain.getStatus();
console.log('Blockchain status:', status);

// Get DAG metrics
const dagMetrics = await blockchain.dag.getMetrics();
console.log('DAG metrics:', dagMetrics);

// Generate key pair
const keyPair = await blockchain.crypto.generateKeyPair();
console.log('Generated key pair:', keyPair.id);

// Stop the blockchain
await blockchain.stop();
```

## Core Components

### 1. DAG (Directed Acyclic Graph)

The DAG is the core data structure of the KALDRIX blockchain, enabling high-throughput parallel transaction processing.

```typescript
import { DAGEngine, DAGNode, DAGConfig } from '@kaldrix/blockchain-types';

const dagConfig: DAGConfig = {
  maxTransactionsPerBlock: 1000,
  maxParents: 8,
  blockTimeTargetMs: 1000,
  enablePrioritization: true,
  enableParallelExecution: true,
  transactionPoolSize: 10000,
  cacheSize: 1000,
  pruningEnabled: true,
  pruningThreshold: 10000,
};

// DAG operations
await dagEngine.initialize(dagConfig);
await dagEngine.start();

// Add transaction
await dagEngine.addTransaction(transaction);

// Create block
const block = await dagEngine.createBlock(publicKey);

// Add block to DAG
await dagEngine.addBlock(block);

// Get DAG metrics
const metrics = await dagEngine.getMetrics();
console.log('Throughput:', metrics.tps, 'TPS');
console.log('Nodes:', metrics.nodeCount);
console.log('Tips:', metrics.tipsCount);

// Traverse DAG
const relatedBlocks = await dagEngine.traverseDAG(block.hash, 'children');
```

### 2. Quantum Cryptography

Post-quantum secure cryptographic operations using CRYSTALS-Kyber and CRYSTALS-Dilithium algorithms.

```typescript
import { QuantumCrypto, CryptoConfig, KeyType } from '@kaldrix/blockchain-types';

const cryptoConfig: CryptoConfig = {
  algorithm: 'hybrid',
  signatureAlgorithm: 'dilithium',
  hashAlgorithm: 'blake3',
  enableQuantumSignatures: true,
  enableKeyRotation: true,
  keyRotationIntervalSecs: 86400,
  cacheSize: 1000,
  enableHSM: false,
};

// Cryptographic operations
await quantumCrypto.initialize(cryptoConfig);

// Generate key pair
const keyPair = await quantumCrypto.generateKeyPair();
console.log('Key type:', keyPair.keyType);

// Sign data
const data = new TextEncoder().encode('Hello, KALDRIX!');
const signature = await quantumCrypto.sign(data, keyPair.privateKey);

// Verify signature
const isValid = await quantumCrypto.verify(data, signature, keyPair.publicKey);
console.log('Signature valid:', isValid);

// Encrypt data
const ciphertext = await quantumCrypto.encrypt(data, keyPair.publicKey);

// Decrypt data
const decrypted = await quantumCrypto.decrypt(ciphertext, keyPair.privateKey);
console.log('Decrypted:', new TextDecoder().decode(decrypted));

// Get performance stats
const stats = await quantumCrypto.getPerformanceStats();
console.log('Operations:', stats.totalOperations);
console.log('Cache hit rate:', stats.cacheHitRate);
```

### 3. Consensus Engine

PBFT-based consensus mechanism with fast finality and validator management.

```typescript
import { ConsensusEngine, ConsensusConfig, Validator } from '@kaldrix/blockchain-types';

const consensusConfig: ConsensusConfig = {
  algorithm: 'pbft',
  numValidators: 21,
  minValidators: 7,
  blockReward: 1000000000000000000n,
  minStake: 32000000000000000000n,
  maxStake: 1000000000000000000000n,
  proposalTimeoutMs: 5000,
  votingTimeoutMs: 10000,
  commitTimeoutMs: 5000,
  blockTimeTargetMs: 1000,
  quorumThreshold: 0.67,
  enableViewChanges: true,
  viewChangeTimeoutMs: 30000,
  maxViewChanges: 10,
  enableSlashing: true,
  slashAmount: 1000000000000000000n,
  enablePerformanceRewards: true,
  performanceRewardMultiplier: 1.5,
};

// Consensus operations
await consensusEngine.initialize(consensusConfig);
await consensusEngine.start();

// Add validator
const validator: Validator = {
  id: 'validator_1',
  publicKey: crypto.getRandomValues(new Uint8Array(32)) as any,
  stake: 32000000000000000000n,
  status: 'active',
  joinedAt: new Date(),
  lastActive: new Date(),
  performance: {
    uptime: 99.9,
    blocksProposed: 100,
    blocksMissed: 1,
    avgResponseTime: 100,
    successRate: 0.99,
    totalRewards: 0n,
    slashingCount: 0,
    lastUpdate: new Date(),
  },
  region: 'US-East',
};

await consensusEngine.addValidator(validator);

// Submit block for consensus
await consensusEngine.submitBlock(block);

// Get consensus status
const status = consensusEngine.getStatus();
console.log('Consensus state:', status.state);
console.log('Health score:', status.healthScore);

// Get consensus metrics
const metrics = await consensusEngine.getMetrics();
console.log('Successful rounds:', metrics.successfulRounds);
console.log('Participation rate:', metrics.participationRate);
```

## API Integration

The TypeScript interfaces are designed to work with REST APIs and WebSockets for real-time communication with the Rust blockchain core.

### REST API Example

```typescript
import axios from 'axios';

class BlockchainApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  // Submit transaction
  async submitTransaction(transaction: Transaction): Promise<{ txId: string }> {
    const response = await axios.post(`${this.baseUrl}/api/v1/transactions`, transaction);
    return response.data;
  }

  // Get block by hash
  async getBlock(hash: string): Promise<DAGNode> {
    const response = await axios.get(`${this.baseUrl}/api/v1/blocks/${hash}`);
    return response.data;
  }

  // Get DAG metrics
  async getDAGMetrics(): Promise<DAGMetrics> {
    const response = await axios.get(`${this.baseUrl}/api/v1/dag/metrics`);
    return response.data;
  }

  // Get consensus status
  async getConsensusStatus(): Promise<ConsensusStatus> {
    const response = await axios.get(`${this.baseUrl}/api/v1/consensus/status`);
    return response.data;
  }
}

// Usage
const client = new BlockchainApiClient();
const txId = await client.submitTransaction(transaction);
console.log('Transaction submitted:', txId);
```

### WebSocket Integration

```typescript
import { WebSocket } from 'ws';

class BlockchainWebSocketClient {
  private ws: WebSocket;
  private url: string;

  constructor(url: string = 'ws://localhost:8081') {
    this.url = url;
    this.ws = new WebSocket(url);
  }

  connect() {
    this.ws.on('open', () => {
      console.log('Connected to blockchain WebSocket');
    });

    this.ws.on('message', (data: string) => {
      const message = JSON.parse(data);
      this.handleMessage(message);
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    this.ws.on('close', () => {
      console.log('WebSocket disconnected');
    });
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case 'block_update':
        console.log('New block:', message.data);
        break;
      case 'transaction_update':
        console.log('Transaction update:', message.data);
        break;
      case 'consensus_update':
        console.log('Consensus update:', message.data);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  subscribeToBlocks() {
    this.ws.send(JSON.stringify({ type: 'subscribe_blocks' }));
  }

  subscribeToTransactions() {
    this.ws.send(JSON.stringify({ type: 'subscribe_transactions' }));
  }
}

// Usage
const wsClient = new BlockchainWebSocketClient();
wsClient.connect();
wsClient.subscribeToBlocks();
wsClient.subscribeToTransactions();
```

## Type Safety

The TypeScript interfaces provide comprehensive type safety for all blockchain operations:

```typescript
// Type-safe transaction creation
const transaction: Transaction = {
  id: crypto.getRandomValues(new Uint8Array(32)) as TransactionId,
  sender: publicKey as PublicKey,
  receiver: recipientPublicKey as PublicKey,
  amount: 1000000000000000000n,
  gasPrice: 20000000000n,
  gasLimit: 21000n,
  nonce: 1,
  data: new Uint8Array(),
  signature: signature as Signature,
  timestamp: Date.now(),
  priority: 5,
};

// Type-safe validation
if (!DAGUtils.validateTransaction(transaction)) {
  throw new Error('Invalid transaction structure');
}

// Type-safe configuration
const config: BlockchainConfig = {
  dag: {
    maxTransactionsPerBlock: 1000,
    maxParents: 8,
    // ... other config options
  },
  crypto: {
    algorithm: 'hybrid',
    signatureAlgorithm: 'dilithium',
    // ... other config options
  },
  // ... other sections
};
```

## Utility Functions

The package includes utility functions for common operations:

```typescript
import { TypeUtils, DAGUtils, CryptoUtils, ConsensusUtils } from '@kaldrix/blockchain-types';

// Type conversion utilities
const hashHex = TypeUtils.bytesToHex(blockHash);
const hashBytes = TypeUtils.hexToBytes(hashHex);

// DAG utilities
const isValid = DAGUtils.validateBlock(block);
const blockSize = DAGUtils.calculateBlockSize(block);
const txFee = DAGUtils.calculateTransactionFee(transaction);

// Crypto utilities
const keyStrength = CryptoUtils.calculateKeyStrength(KeyType.Dilithium);
const estimatedTime = CryptoUtils.estimateOperationTime(
  CryptoOperation.Signing,
  KeyType.Dilithium
);

// Consensus utilities
const quorumThreshold = ConsensusUtils.calculateQuorum(21, 0.67);
const healthScore = ConsensusUtils.calculateHealthScore(consensusMetrics);
```

## Error Handling

Comprehensive error handling with typed errors:

```typescript
import { ErrorType, BaseError } from '@kaldrix/blockchain-types';

try {
  await blockchain.dag.addTransaction(transaction);
} catch (error) {
  const blockchainError = error as BaseError;
  
  switch (blockchainError.type) {
    case ErrorType.Transaction:
      console.error('Transaction error:', blockchainError.message);
      break;
    case ErrorType.Network:
      console.error('Network error:', blockchainError.message);
      break;
    case ErrorType.Consensus:
      console.error('Consensus error:', blockchainError.message);
      break;
    default:
      console.error('Unknown error:', blockchainError.message);
  }
}
```

## Configuration

Default configuration is provided, but can be customized:

```typescript
import { DefaultBlockchainConfig, BlockchainConfig } from '@kaldrix/blockchain-types';

const customConfig: BlockchainConfig = {
  ...DefaultBlockchainConfig,
  dag: {
    ...DefaultBlockchainConfig.dag,
    maxTransactionsPerBlock: 2000,
    blockTimeTargetMs: 500,
  },
  consensus: {
    ...DefaultBlockchainConfig.consensus,
    numValidators: 15,
    minValidators: 5,
  },
  network: {
    ...DefaultBlockchainConfig.network,
    listenAddresses: ['/ip4/0.0.0.0/tcp/30334'],
    maxPeers: 100,
  },
};
```

## Testing

The interfaces are designed to work well with testing frameworks:

```typescript
import { createKaldrixBlockchain, Transaction } from '@kaldrix/blockchain-types';

// Mock blockchain for testing
const mockBlockchain = {
  dag: {
    addTransaction: jest.fn().mockResolvedValue(undefined),
    getTransaction: jest.fn().mockResolvedValue(null),
  },
  crypto: {
    generateKeyPair: jest.fn().mockResolvedValue(mockKeyPair),
    sign: jest.fn().mockResolvedValue(mockSignature),
  },
  consensus: {
    getStatus: jest.fn().mockResolvedValue(mockStatus),
  },
};

// Test transaction submission
test('should submit transaction successfully', async () => {
  const transaction: Transaction = {
    // ... transaction data
  };

  await mockBlockchain.dag.addTransaction(transaction);
  
  expect(mockBlockchain.dag.addTransaction).toHaveBeenCalledWith(transaction);
});
```

## Performance Considerations

- **Type Safety**: The interfaces provide compile-time type checking, reducing runtime errors
- **Zero Runtime Overhead**: TypeScript interfaces are erased during compilation
- **Optimized Data Structures**: Efficient binary formats for network communication
- **Caching**: Built-in caching for frequently accessed data
- **Batching**: Support for batch operations to reduce network overhead

## Security Features

- **Type Safety**: Prevents type-related security vulnerabilities
- **Input Validation**: Built-in validation for all data structures
- **Cryptographic Security**: Post-quantum secure algorithms
- **Access Control**: Role-based access control interfaces
- **Audit Trail**: Comprehensive logging and audit capabilities

## Contributing

1. **Type Safety**: Ensure all new interfaces are properly typed
2. **Documentation**: Add JSDoc comments for all public APIs
3. **Testing**: Include comprehensive tests for new features
4. **Performance**: Consider performance implications of new interfaces
5. **Compatibility**: Maintain backward compatibility when possible

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- **Documentation**: See the comprehensive API documentation
- **Issues**: Create GitHub issues for bugs and feature requests
- **Discussions**: Join community discussions
- **Security**: Report security vulnerabilities privately

---

**KALDRIX Blockchain TypeScript Interfaces** - Building the future of decentralized finance with type-safe blockchain interactions.