import { NextRequest, NextResponse } from 'next/server';

// Simulated blockchain network data
let networkData = {
  nodes: [
    { id: 'node-1', host: 'localhost', port: 3000, status: 'online', role: 'validator', lastSeen: new Date() },
    { id: 'node-2', host: 'localhost', port: 3001, status: 'online', role: 'miner', lastSeen: new Date() },
    { id: 'node-3', host: 'localhost', port: 3002, status: 'degraded', role: 'miner', lastSeen: new Date(Date.now() - 30000) },
    { id: 'node-4', host: 'localhost', port: 3003, status: 'online', role: 'validator', lastSeen: new Date() },
    { id: 'node-5', host: 'localhost', port: 3004, status: 'offline', role: 'miner', lastSeen: new Date(Date.now() - 300000) }
  ],
  transactions: {
    total: 15420,
    last24h: 3250,
    tps: 127.5,
    averageConfirmationTime: 2.3,
    successRate: 99.85
  },
  blocks: {
    height: 15420,
    difficulty: 1250000000000,
    hashRate: 45.2,
    averageBlockTime: 8.5
  },
  network: {
    totalPeers: 247,
    activeConnections: 189,
    averageLatency: 45,
    bandwidth: 12.5
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    // Simulate real-time data updates
    networkData.transactions.tps += (Math.random() - 0.5) * 10;
    networkData.transactions.tps = Math.max(0, networkData.transactions.tps);
    
    networkData.blocks.height += Math.floor(Math.random() * 3);
    networkData.transactions.total += Math.floor(Math.random() * 20);

    // Update node statuses randomly
    networkData.nodes.forEach(node => {
      if (Math.random() < 0.05) { // 5% chance to change status
        const statuses = ['online', 'degraded', 'offline'];
        const currentIndex = statuses.indexOf(node.status);
        const newStatus = statuses[(currentIndex + 1) % statuses.length];
        node.status = newStatus;
        node.lastSeen = newStatus === 'offline' 
          ? new Date(Date.now() - 300000) 
          : new Date();
      }
    });

    switch (endpoint) {
      case 'nodes':
        return NextResponse.json(networkData.nodes);

      case 'transactions':
        return NextResponse.json(networkData.transactions);

      case 'blocks':
        return NextResponse.json(networkData.blocks);

      case 'network':
        return NextResponse.json(networkData.network);

      case 'summary':
        const onlineNodes = networkData.nodes.filter(n => n.status === 'online').length;
        const totalNodes = networkData.nodes.length;
        
        return NextResponse.json({
          totalNodes,
          onlineNodes,
          networkHealth: (onlineNodes / totalNodes) * 100,
          currentTPS: networkData.transactions.tps,
          blockHeight: networkData.blocks.height,
          totalTransactions: networkData.transactions.total,
          timestamp: new Date().toISOString()
        });

      case 'topology':
        // Simulate network topology
        const topology = {
          nodes: networkData.nodes.map(node => ({
            id: node.id,
            role: node.role,
            status: node.status,
            connections: Math.floor(Math.random() * 10) + 1
          })),
          edges: generateNetworkEdges(networkData.nodes)
        };
        
        return NextResponse.json(topology);

      default:
        return NextResponse.json({
          ...networkData,
          timestamp: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Network API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'register-node':
        const newNode = {
          id: params.nodeId,
          host: params.host || 'localhost',
          port: params.port || 3000,
          status: 'online',
          role: params.role || 'miner',
          lastSeen: new Date()
        };
        
        networkData.nodes.push(newNode);
        
        return NextResponse.json({
          success: true,
          message: `Node ${params.nodeId} registered`,
          node: newNode
        });

      case 'update-node-status':
        const node = networkData.nodes.find(n => n.id === params.nodeId);
        if (node) {
          node.status = params.status;
          node.lastSeen = new Date();
          
          return NextResponse.json({
            success: true,
            message: `Node ${params.nodeId} status updated to ${params.status}`,
            node
          });
        } else {
          return NextResponse.json(
            { error: 'Node not found' },
            { status: 404 }
          );
        }

      case 'simulate-transaction':
        networkData.transactions.total += 1;
        networkData.transactions.last24h += 1;
        
        return NextResponse.json({
          success: true,
          message: 'Transaction simulated',
          transactionId: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });

      case 'simulate-block':
        networkData.blocks.height += 1;
        
        return NextResponse.json({
          success: true,
          message: 'Block simulated',
          blockHeight: networkData.blocks.height,
          blockHash: `block_${networkData.blocks.height}_${Math.random().toString(36).substr(2, 16)}`
        });

      case 'reset-network':
        networkData = {
          nodes: [
            { id: 'node-1', host: 'localhost', port: 3000, status: 'online', role: 'validator', lastSeen: new Date() },
            { id: 'node-2', host: 'localhost', port: 3001, status: 'online', role: 'miner', lastSeen: new Date() },
            { id: 'node-3', host: 'localhost', port: 3002, status: 'degraded', role: 'miner', lastSeen: new Date(Date.now() - 30000) },
            { id: 'node-4', host: 'localhost', port: 3003, status: 'online', role: 'validator', lastSeen: new Date() },
            { id: 'node-5', host: 'localhost', port: 3004, status: 'offline', role: 'miner', lastSeen: new Date(Date.now() - 300000) }
          ],
          transactions: {
            total: 0,
            last24h: 0,
            tps: 0,
            averageConfirmationTime: 2.3,
            successRate: 99.85
          },
          blocks: {
            height: 0,
            difficulty: 1250000000000,
            hashRate: 45.2,
            averageBlockTime: 8.5
          },
          network: {
            totalPeers: 247,
            activeConnections: 189,
            averageLatency: 45,
            bandwidth: 12.5
          }
        };

        return NextResponse.json({
          success: true,
          message: 'Network data reset'
        });

      default:
        return NextResponse.json(
          { error: 'Unknown action', action },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Network API POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

function generateNetworkEdges(nodes: any[]) {
  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (Math.random() < 0.3) { // 30% chance of connection
        edges.push({
          source: nodes[i].id,
          target: nodes[j].id,
          latency: Math.floor(Math.random() * 100) + 10,
          bandwidth: Math.random() * 100 + 10
        });
      }
    }
  }
  return edges;
}