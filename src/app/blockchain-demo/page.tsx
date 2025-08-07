'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

// Import our blockchain interfaces
import {
  DAGNode,
  Transaction,
  KeyPair,
  DAGMetrics,
  ConsensusStatus,
  BlockchainConfig,
  DefaultBlockchainConfig,
  TypeUtils,
  DAGUtils,
  CryptoUtils,
  ConsensusUtils,
} from '@/lib/blockchain';

export default function BlockchainDemo() {
  const [isConnected, setIsConnected] = useState(false);
  const [dagMetrics, setDagMetrics] = useState<DAGMetrics | null>(null);
  const [consensusStatus, setConsensusStatus] = useState<ConsensusStatus | null>(null);
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [blocks, setBlocks] = useState<DAGNode[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  const simulateBlockchainConnection = async () => {
    addLog('Connecting to KALDRIX blockchain...');
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsConnected(true);
    addLog('✅ Connected to KALDRIX blockchain');
    
    // Generate a mock key pair
    const mockKeyPair: KeyPair = {
      publicKey: TypeUtils.randomPublicKey(),
      privateKey: TypeUtils.createPrivateKey(crypto.getRandomValues(new Uint8Array(64))),
      id: `key_${Date.now()}`,
      createdAt: Date.now(),
      keyType: 'dilithium' as any,
      metadata: {
        purpose: 'demo',
        generated: 'true',
      },
    };
    
    setKeyPair(mockKeyPair);
    addLog('🔑 Generated quantum-resistant key pair');
    
    // Simulate DAG metrics
    const mockDagMetrics: DAGMetrics = {
      nodeCount: 1250,
      edgeCount: 3420,
      avgDepth: 45.2,
      avgWidth: 8.7,
      maxDepth: 120,
      maxWidth: 25,
      transactionPoolSize: 342,
      avgConfirmationTime: 800,
      tps: 12500,
      confirmationRate: 0.98,
      cacheHitRate: 0.85,
      validationTime: 12,
      traversalTime: 5,
      latency: 75,
      tipsCount: 8,
    };
    
    setDagMetrics(mockDagMetrics);
    addLog('📊 Retrieved DAG metrics');
    
    // Simulate consensus status
    const mockConsensusStatus: ConsensusStatus = {
      state: 'idle' as any,
      currentRound: 1247,
      currentView: 0,
      lastCommittedBlock: TypeUtils.randomHash(),
      currentProposer: 'validator_12',
      activeValidators: 21,
      healthScore: 98.5,
      totalRounds: 1247,
      failedRounds: 3,
      lastUpdated: Date.now(),
      currentPhase: 'idle' as any,
      timeToNextPhase: 5000,
      syncStatus: {
        isSynchronized: true,
        currentHeight: 1247,
        networkHeight: 1247,
        syncProgress: 1.0,
        syncSpeed: 0,
        estimatedTimeToSync: 0,
        status: 'sync_complete' as any,
      },
    };
    
    setConsensusStatus(mockConsensusStatus);
    addLog('⚡ Retrieved consensus status');
    
    // Generate some sample transactions
    const sampleTransactions: Transaction[] = Array.from({ length: 5 }, (_, i) => ({
      id: TypeUtils.randomHash(),
      sender: TypeUtils.randomPublicKey(),
      receiver: TypeUtils.randomPublicKey(),
      amount: BigInt(Math.floor(Math.random() * 1000000000000000000)),
      gasPrice: BigInt(20000000000),
      gasLimit: BigInt(21000),
      nonce: i + 1,
      data: new Uint8Array(),
      signature: TypeUtils.createSignature(crypto.getRandomValues(new Uint8Array(2424))),
      timestamp: Date.now() - Math.random() * 3600000,
      priority: Math.floor(Math.random() * 10) + 1,
    }));
    
    setTransactions(sampleTransactions);
    addLog(`📝 Generated ${sampleTransactions.length} sample transactions`);
    
    // Generate some sample blocks
    const sampleBlocks: DAGNode[] = Array.from({ length: 3 }, (_, i) => ({
      id: TypeUtils.randomHash(),
      timestamp: Date.now() - i * 60000,
      payload: sampleTransactions.slice(0, 2),
      parents: i === 0 ? [] : [sampleBlocks[i - 1]?.id || TypeUtils.randomHash()],
      hash: TypeUtils.randomHash(),
      signature: TypeUtils.createSignature(crypto.getRandomValues(new Uint8Array(2424))),
      height: 1247 - i,
      creator: TypeUtils.randomPublicKey(),
      version: 1,
      merkleRoot: TypeUtils.randomHash(),
      stateRoot: TypeUtils.randomHash(),
      metadata: {
        validator: `validator_${Math.floor(Math.random() * 21)}`,
        round: (1247 - i).toString(),
      },
    }));
    
    setBlocks(sampleBlocks);
    addLog(`⛓️ Generated ${sampleBlocks.length} sample blocks`);
  };

  const simulateTransactionSubmission = async () => {
    if (!keyPair) {
      addLog('❌ No key pair available');
      return;
    }
    
    addLog('📤 Submitting transaction...');
    
    // Create a new transaction
    const newTransaction: Transaction = {
      id: TypeUtils.randomHash(),
      sender: keyPair.publicKey,
      receiver: TypeUtils.randomPublicKey(),
      amount: BigInt(1000000000000000000), // 1 ETH
      gasPrice: BigInt(20000000000), // 20 Gwei
      gasLimit: BigInt(21000),
      nonce: transactions.length + 1,
      data: new TextEncoder().encode('Demo transaction'),
      signature: TypeUtils.createSignature(crypto.getRandomValues(new Uint8Array(2424))),
      timestamp: Date.now(),
      priority: 5,
    };
    
    // Validate transaction
    if (!DAGUtils.validateTransaction(newTransaction)) {
      addLog('❌ Transaction validation failed');
      return;
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setTransactions(prev => [newTransaction, ...prev]);
    addLog('✅ Transaction submitted successfully');
    addLog(`💰 Amount: ${newTransaction.amount.toString()} wei`);
    addLog(`⛽ Gas: ${newTransaction.gasPrice.toString()} wei`);
    addLog(`🔑 Nonce: ${newTransaction.nonce}`);
  };

  const simulateBlockCreation = async () => {
    if (!keyPair) {
      addLog('❌ No key pair available');
      return;
    }
    
    addLog('🔨 Creating new block...');
    
    // Simulate block creation delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newBlock: DAGNode = {
      id: TypeUtils.randomHash(),
      timestamp: Date.now(),
      payload: transactions.slice(0, 3),
      parents: blocks.length > 0 ? [blocks[0].id] : [],
      hash: TypeUtils.randomHash(),
      signature: TypeUtils.createSignature(crypto.getRandomValues(new Uint8Array(2424))),
      height: (blocks[0]?.height || 1247) + 1,
      creator: keyPair.publicKey,
      version: 1,
      merkleRoot: TypeUtils.randomHash(),
      stateRoot: TypeUtils.randomHash(),
      metadata: {
        validator: 'demo_validator',
        round: ((blocks[0]?.height || 1247) + 1).toString(),
      },
    };
    
    // Validate block
    if (!DAGUtils.validateBlock(newBlock)) {
      addLog('❌ Block validation failed');
      return;
    }
    
    setBlocks(prev => [newBlock, ...prev]);
    
    // Update metrics
    if (dagMetrics) {
      setDagMetrics({
        ...dagMetrics,
        nodeCount: dagMetrics.nodeCount + 1,
        edgeCount: dagMetrics.edgeCount + newBlock.parents.length,
        transactionPoolSize: Math.max(0, dagMetrics.transactionPoolSize - newBlock.payload.length),
      });
    }
    
    addLog('✅ Block created successfully');
    addLog(`📦 Block height: ${newBlock.height}`);
    addLog(`🔗 Parents: ${newBlock.parents.length}`);
    addLog(`💼 Transactions: ${newBlock.payload.length}`);
  };

  const formatHash = (hash: Uint8Array) => {
    return TypeUtils.bytesToHex(hash).substring(0, 16) + '...';
  };

  const formatAmount = (amount: bigint) => {
    return (Number(amount) / 1e18).toFixed(6) + ' ETH';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'sync_complete':
      case 'idle':
        return 'bg-green-500';
      case 'pending':
      case 'syncing':
        return 'bg-yellow-500';
      case 'failed':
      case 'sync_failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">KALDRIX Blockchain Demo</h1>
        <p className="text-lg text-muted-foreground">
          Quantum-resistant DAG-based blockchain with TypeScript interfaces
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          <Badge variant="outline">
            TypeScript Interfaces
          </Badge>
          <Badge variant="outline">
            Quantum-Resistant
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Connection</CardTitle>
            <CardDescription>Connect to the KALDRIX blockchain</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isConnected ? (
              <Button onClick={simulateBlockchainConnection} className="w-full">
                Connect to Blockchain
              </Button>
            ) : (
              <div className="space-y-2">
                <Alert>
                  <AlertDescription>
                    ✅ Successfully connected to KALDRIX blockchain
                  </AlertDescription>
                </Alert>
                {keyPair && (
                  <div className="space-y-2">
                    <Label>Key Pair ID</Label>
                    <Input value={keyPair.id} readOnly />
                    <Label>Key Type</Label>
                    <Input value={keyPair.keyType} readOnly />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* DAG Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>DAG Metrics</CardTitle>
            <CardDescription>Real-time DAG performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {dagMetrics ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Nodes:</span>
                  <span className="font-mono">{dagMetrics.nodeCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Edges:</span>
                  <span className="font-mono">{dagMetrics.edgeCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>TPS:</span>
                  <span className="font-mono">{dagMetrics.tps.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Depth:</span>
                  <span className="font-mono">{dagMetrics.avgDepth.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Confirmation Time:</span>
                  <span className="font-mono">{dagMetrics.avgConfirmationTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Tips:</span>
                  <span className="font-mono">{dagMetrics.tipsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Confirmation Rate:</span>
                  <span className="font-mono">{(dagMetrics.confirmationRate * 100).toFixed(1)}%</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Connect to view metrics</p>
            )}
          </CardContent>
        </Card>

        {/* Consensus Status */}
        <Card>
          <CardHeader>
            <CardTitle>Consensus Status</CardTitle>
            <CardDescription>PBFT consensus mechanism status</CardDescription>
          </CardHeader>
          <CardContent>
            {consensusStatus ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span>State:</span>
                  <Badge variant="outline" className={getStatusColor(consensusStatus.state)}>
                    {consensusStatus.state}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Round:</span>
                  <span className="font-mono">{consensusStatus.currentRound}</span>
                </div>
                <div className="flex justify-between">
                  <span>View:</span>
                  <span className="font-mono">{consensusStatus.currentView}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Validators:</span>
                  <span className="font-mono">{consensusStatus.activeValidators}</span>
                </div>
                <div className="flex justify-between">
                  <span>Health Score:</span>
                  <span className="font-mono">{consensusStatus.healthScore.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Success Rate:</span>
                  <span className="font-mono">
                    {(((consensusStatus.totalRounds - consensusStatus.failedRounds) / consensusStatus.totalRounds) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sync Status:</span>
                  <Badge variant="outline" className={getStatusColor(consensusStatus.syncStatus.status)}>
                    {consensusStatus.syncStatus.status}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Connect to view status</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Simulate blockchain operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={simulateTransactionSubmission} disabled={!keyPair}>
                Submit Transaction
              </Button>
              <Button onClick={simulateBlockCreation} disabled={!keyPair}>
                Create Block
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Display */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="blocks">Blocks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Transactions in the mempool and recent blocks</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <div className="space-y-2">
                  {transactions.map((tx, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="space-y-1">
                        <div className="font-mono text-sm">{formatHash(tx.id)}</div>
                        <div className="text-xs text-muted-foreground">
                          From: {formatHash(tx.sender)} → To: {formatHash(tx.receiver)}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-semibold">{formatAmount(tx.amount)}</div>
                        <div className="text-xs text-muted-foreground">
                          Priority: {tx.priority}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No transactions available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="blocks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Blocks</CardTitle>
              <CardDescription>Latest blocks in the DAG</CardDescription>
            </CardHeader>
            <CardContent>
              {blocks.length > 0 ? (
                <div className="space-y-2">
                  {blocks.map((block, index) => (
                    <div key={index} className="p-3 border rounded space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-sm">{formatHash(block.id)}</div>
                        <Badge variant="outline">Height {block.height}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Creator: {formatHash(block.creator)} | Parents: {block.parents.length}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Transactions: {block.payload.length} | Timestamp: {new Date(block.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No blocks available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Real-time blockchain activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index} className="text-sm font-mono p-1 bg-muted rounded">
                  {log}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No activity yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>TypeScript Interface Features</CardTitle>
          <CardDescription>Comprehensive type-safe blockchain interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">🏗️ DAG Structure</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Type-safe DAG nodes</li>
                <li>• Transaction management</li>
                <li>• Block validation</li>
                <li>• Performance metrics</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">🔒 Quantum Crypto</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• CRYSTALS-Kyber/Dilithium</li>
                <li>• Key management</li>
                <li>• Signing/verification</li>
                <li>• Encryption/decryption</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">⚡ Consensus</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• PBFT mechanism</li>
                <li>• Validator management</li>
                <li>• View changes</li>
                <li>• Performance tracking</li>
              </ul>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="text-sm text-muted-foreground">
            <p>
              This demo showcases the TypeScript interfaces for the KALDRIX blockchain. 
              The interfaces provide type-safe interaction with the Rust blockchain core, 
              enabling secure and efficient development of blockchain applications.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}