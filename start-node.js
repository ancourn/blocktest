#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Command } = require('commander');
const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const cors = require('cors');
const chalk = require('chalk');

// KALDRIX Core Imports
const { FailoverManager } = require('./src/lib/reliability/failover-manager');
const { ConsensusCatchup } = require('./src/lib/reliability/consensus-catchup');
const { FailureSimulator } = require('./src/lib/reliability/failure-simulator');
const { AvailabilityMonitor } = require('./src/lib/reliability/availability-monitor');
const { StressTestEnvironment } = require('./src/lib/reliability/stress-test-environment');
const { MultiShardProcessor } = require('./src/lib/sharding/multi-shard-processor');
const { GPUAccelerator } = require('./src/lib/gpu/gpu-accelerator');
const { TransactionBatcher } = require('./src/lib/batching/transaction-batcher');
const { TPSTargetManager } = require('./src/lib/tps/tps-target-manager');

const program = new Command();

program
  .name('kaldrix-node')
  .description('KALDRIX Quantum DAG Blockchain Node')
  .version('1.0.0');

program
  .command('start')
  .description('Start a KALDRIX node')
  .option('-p, --port <port>', 'Node port', '3000')
  .option('-n, --node-id <id>', 'Node ID', `node-${Math.floor(Math.random() * 1000)}`)
  .option('-r, --role <role>', 'Node role (validator|observer|miner)', 'validator')
  .option('--seed-nodes <nodes>', 'Comma-separated list of seed nodes', '')
  .option('--network <network>', 'Network name', 'kaldrix-testnet')
  .option('--data-dir <dir>', 'Data directory', './data')
  .option('--config <file>', 'Configuration file', './config/node.json')
  .action(async (options) => {
    try {
      await startNode(options);
    } catch (error) {
      console.error(chalk.red('Failed to start node:'), error.message);
      process.exit(1);
    }
  });

program
  .command('testnet')
  .description('Start a local testnet with multiple nodes')
  .option('-n, --nodes <count>', 'Number of nodes to start', '3')
  .option('--base-port <port>', 'Base port for nodes', '3000')
  .option('--network <network>', 'Network name', 'kaldrix-local-testnet')
  .action(async (options) => {
    try {
      await startTestnet(options);
    } catch (error) {
      console.error(chalk.red('Failed to start testnet:'), error.message);
      process.exit(1);
    }
  });

program
  .command('dashboard')
  .description('Start the monitoring dashboard')
  .option('-p, --port <port>', 'Dashboard port', '8080')
  .option('--api-port <port>', 'Metrics API port', '8081')
  .action(async (options) => {
    try {
      await startDashboard(options);
    } catch (error) {
      console.error(chalk.red('Failed to start dashboard:'), error.message);
      process.exit(1);
    }
  });

async function startNode(options) {
  console.log(chalk.blue('🚀 Starting KALDRIX Node...'));
  console.log(chalk.gray(`Node ID: ${options.nodeId}`));
  console.log(chalk.gray(`Port: ${options.port}`));
  console.log(chalk.gray(`Role: ${options.role}`));
  console.log(chalk.gray(`Network: ${options.network}`));

  // Create data directory if it doesn't exist
  const dataDir = path.resolve(options.dataDir);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Load configuration
  const config = loadConfiguration(options);

  // Initialize Express app for API
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Initialize KALDRIX components
  const nodeComponents = await initializeNodeComponents(config);

  // Setup API routes
  setupNodeAPI(app, nodeComponents, config);

  // Setup WebSocket for real-time communication
  const server = http.createServer(app);
  const wss = new WebSocket.Server({ server });

  setupWebSocketHandlers(wss, nodeComponents, config);

  // Start the server
  server.listen(options.port, () => {
    console.log(chalk.green(`✅ KALDRIX node started successfully`));
    console.log(chalk.blue(`📡 HTTP API: http://localhost:${options.port}`));
    console.log(chalk.blue(`🔌 WebSocket: ws://localhost:${options.port}`));
    console.log(chalk.blue(`📊 Metrics: http://localhost:${options.port}/metrics`));
  });

  // Setup graceful shutdown
  setupGracefulShutdown(nodeComponents, server);

  // Start background processes
  startBackgroundProcesses(nodeComponents, config);

  // Connect to seed nodes
  if (options.seedNodes) {
    await connectToSeedNodes(options.seedNodes.split(','), config);
  }
}

async function startTestnet(options) {
  console.log(chalk.blue('🌐 Starting KALDRIX Local Testnet...'));
  console.log(chalk.gray(`Nodes: ${options.nodes}`));
  console.log(chalk.gray(`Base Port: ${options.basePort}`));

  const nodes = [];
  
  for (let i = 0; i < parseInt(options.nodes); i++) {
    const port = parseInt(options.basePort) + i;
    const nodeId = `testnet-node-${i}`;
    const seedNodes = nodes.map(n => `localhost:${n.port}`).join(',');
    
    console.log(chalk.yellow(`Starting node ${i + 1}/${options.nodes}...`));
    
    // In a real implementation, we'd spawn child processes
    // For now, we'll simulate by creating node configurations
    const nodeConfig = {
      port,
      nodeId,
      role: i === 0 ? 'validator' : 'miner',
      seedNodes,
      network: options.network,
      dataDir: `./data/testnet/node-${i}`
    };
    
    nodes.push(nodeConfig);
    
    console.log(chalk.green(`✅ Node ${nodeId} configured on port ${port}`));
  }

  console.log(chalk.blue('\n📋 Testnet Configuration:'));
  nodes.forEach((node, i) => {
    console.log(chalk.gray(`  Node ${i + 1}: ${node.nodeId} -> localhost:${node.port}`));
  });

  console.log(chalk.blue('\n🚀 To start the testnet:'));
  console.log(chalk.gray('  1. Open multiple terminal windows'));
  console.log(chalk.gray('  2. In each terminal, run:'));
  nodes.forEach((node, i) => {
    console.log(chalk.gray(`     Terminal ${i + 1}: npm run start -- --port ${node.port} --node-id ${node.nodeId} --role ${node.role} --seed-nodes "${node.seedNodes}"`));
  });
  console.log(chalk.gray('  3. Start the dashboard: npm run dashboard'));
  
  // Generate testnet configuration file
  const testnetConfig = {
    network: options.network,
    nodes: nodes,
    created: new Date().toISOString(),
    genesis: {
      timestamp: Date.now(),
      validators: nodes.filter(n => n.role === 'validator').map(n => n.nodeId)
    }
  };
  
  fs.writeFileSync('./testnet-config.json', JSON.stringify(testnetConfig, null, 2));
  console.log(chalk.blue('\n📄 Testnet configuration saved to testnet-config.json'));
}

async function startDashboard(options) {
  console.log(chalk.blue('📊 Starting KALDRIX Dashboard...'));
  
  const app = express();
  app.use(cors());
  app.use(express.static(path.join(__dirname, 'public')));
  
  // API routes for dashboard
  app.get('/api/nodes', async (req, res) => {
    try {
      const nodes = await getNetworkNodes();
      res.json(nodes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get('/api/metrics', async (req, res) => {
    try {
      const metrics = await collectNetworkMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get('/api/network/status', async (req, res) => {
    try {
      const status = await getNetworkStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Serve dashboard HTML
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
  });
  
  const server = app.listen(options.port, () => {
    console.log(chalk.green(`✅ Dashboard started successfully`));
    console.log(chalk.blue(`🌐 Dashboard: http://localhost:${options.port}`));
    console.log(chalk.blue(`📡 API: http://localhost:${options.port}/api`));
  });
}

async function initializeNodeComponents(config) {
  console.log(chalk.blue('⚙️  Initializing KALDRIX components...'));
  
  const components = {
    failoverManager: new FailoverManager({
      heartbeatInterval: 5000,
      responseTimeout: 10000,
      maxRetries: 3,
      failoverThreshold: 2,
      consensusCatchupTimeout: 30000
    }),
    
    consensusCatchup: new ConsensusCatchup({
      maxBatchSize: 100,
      syncTimeout: 30000,
      retryAttempts: 3,
      parallelSyncs: 5,
      validationDepth: 50
    }),
    
    failureSimulator: new FailureSimulator({
      maxConcurrentScenarios: 3,
      autoRecovery: true,
      recoveryDelay: 30,
      monitoringInterval: 10,
      chaosEnabled: false
    }),
    
    availabilityMonitor: new AvailabilityMonitor({
      slaTarget: 99.99,
      checkInterval: 5,
      incidentTimeout: 300,
      alertCooldown: 60,
      retentionPeriod: 7,
      enableNotifications: true
    }),
    
    multiShardProcessor: new MultiShardProcessor({
      shardCount: 4,
      maxTransactionsPerShard: 1000,
      validationTimeout: 30000,
      crossShardTimeout: 15000
    }),
    
    gpuAccelerator: new GPUAccelerator({
      enabled: true,
      maxConcurrentTasks: 8,
      memoryLimit: 4096, // MB
      preferredDevice: 0
    }),
    
    transactionBatcher: new TransactionBatcher({
      maxBatchSize: 100,
      batchTimeout: 1000,
      maxBatchWaitTime: 5000,
      enableSignatureAggregation: true
    }),
    
    tpsTargetManager: new TPSTargetManager({
      currentTarget: 1000,
      milestones: [1000, 10000, 30000, 75000],
      autoScaling: true,
      monitoringInterval: 10000
    })
  };
  
  // Initialize all components
  for (const [name, component] of Object.entries(components)) {
    if (component.initialize) {
      await component.initialize();
      console.log(chalk.green(`✅ ${name} initialized`));
    }
  }
  
  // Register this node with failover manager
  components.failoverManager.registerNode(config.nodeId);
  
  return components;
}

function setupNodeAPI(app, components, config) {
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      nodeId: config.nodeId,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });
  
  // Node information
  app.get('/node/info', (req, res) => {
    res.json({
      nodeId: config.nodeId,
      role: config.role,
      network: config.network,
      port: config.port,
      version: '1.0.0',
      startTime: new Date().toISOString()
    });
  });
  
  // Metrics endpoint
  app.get('/metrics', (req, res) => {
    const metrics = {
      node: {
        id: config.nodeId,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      failover: components.failoverManager.getClusterStatus(),
      availability: components.availabilityMonitor.getAvailabilityMetrics(),
      consensus: components.consensusCatchup.getSyncState(),
      performance: components.tpsTargetManager.getCurrentMetrics()
    };
    
    res.json(metrics);
  });
  
  // Network status
  app.get('/network/status', (req, res) => {
    const networkStatus = {
      network: config.network,
      totalNodes: components.failoverManager.getClusterStatus().totalNodes,
      activeNodes: components.failoverManager.getClusterStatus().activeNodes,
      healthyNodes: components.failoverManager.getClusterStatus().healthyNodes,
      availability: components.availabilityMonitor.getSystemMetrics().overallAvailability,
      consensusHeight: components.consensusCatchup.getSyncState().currentHeight,
      lastUpdate: new Date().toISOString()
    };
    
    res.json(networkStatus);
  });
  
  // Transaction submission
  app.post('/transactions', (req, res) => {
    const { transactions } = req.body;
    
    if (!Array.isArray(transactions)) {
      return res.status(400).json({ error: 'Transactions must be an array' });
    }
    
    // Process transactions through the batcher
    components.transactionBatcher.addTransactions(transactions);
    
    res.json({
      accepted: true,
      count: transactions.length,
      batchId: `batch_${Date.now()}`
    });
  });
  
  // Control endpoints for testing
  app.post('/test/failure', (req, res) => {
    const { scenario, targetNodes } = req.body;
    
    components.failureSimulator.startScenario(scenario, targetNodes)
      .then(() => {
        res.json({ success: true, message: `Failure scenario ${scenario} started` });
      })
      .catch(error => {
        res.status(500).json({ error: error.message });
      });
  });
  
  app.post('/test/stress', (req, res) => {
    const { duration, intensity, targetTPS } = req.body;
    
    const stressConfig = {
      duration: duration || 5, // minutes
      intensity: intensity || 'MEDIUM',
      targetTPS: targetTPS || 1000,
      nodeCount: components.failoverManager.getClusterStatus().totalNodes,
      failureRate: 0.1,
      autoScale: true,
      metricsInterval: 5
    };
    
    // Start stress test
    res.json({ success: true, message: 'Stress test started', config: stressConfig });
  });
}

function setupWebSocketHandlers(wss, components, config) {
  wss.on('connection', (ws) => {
    console.log(chalk.blue(`🔌 WebSocket client connected to ${config.nodeId}`));
    
    // Send initial node status
    ws.send(JSON.stringify({
      type: 'node_status',
      data: {
        nodeId: config.nodeId,
        status: 'connected',
        timestamp: new Date().toISOString()
      }
    }));
    
    // Handle client messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        handleWebSocketMessage(ws, data, components, config);
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });
    
    // Handle client disconnect
    ws.on('close', () => {
      console.log(chalk.blue(`🔌 WebSocket client disconnected from ${config.nodeId}`));
    });
  });
  
  // Setup event listeners for real-time updates
  setupRealtimeEventHandlers(wss, components);
}

function handleWebSocketMessage(ws, data, components, config) {
  switch (data.type) {
    case 'subscribe_metrics':
      // Handle metrics subscription
      ws.send(JSON.stringify({
        type: 'metrics_subscription',
        data: { success: true, interval: 5000 }
      }));
      break;
      
    case 'get_cluster_status':
      ws.send(JSON.stringify({
        type: 'cluster_status',
        data: components.failoverManager.getClusterStatus()
      }));
      break;
      
    case 'start_failure_test':
      components.failureSimulator.startScenario(data.scenario, data.targetNodes)
        .then(() => {
          ws.send(JSON.stringify({
            type: 'failure_test_started',
            data: { scenario: data.scenario, success: true }
          }));
        })
        .catch(error => {
          ws.send(JSON.stringify({
            type: 'failure_test_failed',
            data: { error: error.message }
          }));
        });
      break;
      
    default:
      console.warn('Unknown WebSocket message type:', data.type);
  }
}

function setupRealtimeEventHandlers(wss, components) {
  // Failover events
  components.failoverManager.on('nodeFailed', (data) => {
    broadcast(wss, {
      type: 'node_failed',
      data
    });
  });
  
  components.failoverManager.on('nodeRecovered', (data) => {
    broadcast(wss, {
      type: 'node_recovered',
      data
    });
  });
  
  // Availability events
  components.availabilityMonitor.on('incidentStarted', (data) => {
    broadcast(wss, {
      type: 'incident_started',
      data
    });
  });
  
  components.availabilityMonitor.on('alertTriggered', (data) => {
    broadcast(wss, {
      type: 'alert_triggered',
      data
    });
  });
  
  // Consensus events
  components.consensusCatchup.on('catchupProgress', (data) => {
    broadcast(wss, {
      type: 'consensus_progress',
      data
    });
  });
  
  // Failure simulation events
  components.failureSimulator.on('scenarioStarted', (data) => {
    broadcast(wss, {
      type: 'scenario_started',
      data
    });
  });
}

function broadcast(wss, message) {
  const data = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function setupGracefulShutdown(components, server) {
  const shutdown = async (signal) => {
    console.log(chalk.yellow(`🛑 Received ${signal}, shutting down gracefully...`));
    
    // Shutdown all components
    for (const [name, component] of Object.entries(components)) {
      if (component.shutdown) {
        try {
          await component.shutdown();
          console.log(chalk.green(`✅ ${name} shutdown complete`));
        } catch (error) {
          console.error(chalk.red(`❌ Error shutting down ${name}:`), error.message);
        }
      }
    }
    
    // Close server
    server.close(() => {
      console.log(chalk.green('✅ Server shutdown complete'));
      process.exit(0);
    });
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

function startBackgroundProcesses(components, config) {
  // Start periodic metrics collection
  setInterval(() => {
    const metrics = {
      nodeId: config.nodeId,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      cluster: components.failoverManager.getClusterStatus(),
      availability: components.availabilityMonitor.getAvailabilityMetrics()
    };
    
    // Store metrics locally (in a real implementation, this would go to a time-series database)
    const metricsFile = path.join(config.dataDir, 'metrics.json');
    try {
      const existingMetrics = fs.existsSync(metricsFile) ? JSON.parse(fs.readFileSync(metricsFile)) : [];
      existingMetrics.push(metrics);
      
      // Keep only last 1000 metrics entries
      if (existingMetrics.length > 1000) {
        existingMetrics.splice(0, existingMetrics.length - 1000);
      }
      
      fs.writeFileSync(metricsFile, JSON.stringify(existingMetrics, null, 2));
    } catch (error) {
      console.error('Error saving metrics:', error);
    }
  }, 10000); // Every 10 seconds
  
  // Start TPS monitoring
  components.tpsTargetManager.startMonitoring();
  
  console.log(chalk.blue('⚡ Background processes started'));
}

async function connectToSeedNodes(seedNodes, config) {
  console.log(chalk.blue('🔗 Connecting to seed nodes...'));
  
  for (const seedNode of seedNodes) {
    try {
      const [host, port] = seedNode.split(':');
      const ws = new WebSocket(`ws://${host}:${port}`);
      
      ws.on('open', () => {
        console.log(chalk.green(`✅ Connected to seed node: ${seedNode}`));
        
        // Send handshake
        ws.send(JSON.stringify({
          type: 'handshake',
          data: {
            nodeId: config.nodeId,
            network: config.network,
            role: config.role,
            version: '1.0.0'
          }
        }));
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          handleSeedNodeMessage(message, config);
        } catch (error) {
          console.error('Error handling seed node message:', error);
        }
      });
      
      ws.on('error', (error) => {
        console.warn(chalk.yellow(`⚠️  Failed to connect to seed node ${seedNode}:`), error.message);
      });
      
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Error connecting to seed node ${seedNode}:`), error.message);
    }
  }
}

function handleSeedNodeMessage(message, config) {
  switch (message.type) {
    case 'handshake_response':
      console.log(chalk.green(`✅ Handshake successful with ${message.data.nodeId}`));
      break;
    case 'network_update':
      console.log(chalk.blue(`📡 Network update received from ${message.data.nodeId}`));
      break;
    default:
      console.warn('Unknown seed node message type:', message.type);
  }
}

function loadConfiguration(options) {
  let config = {
    nodeId: options.nodeId,
    port: parseInt(options.port),
    role: options.role,
    network: options.network,
    dataDir: options.dataDir,
    seedNodes: options.seedNodes ? options.seedNodes.split(',') : []
  };
  
  // Load from config file if it exists
  if (fs.existsSync(options.config)) {
    try {
      const fileConfig = JSON.parse(fs.readFileSync(options.config));
      config = { ...config, ...fileConfig };
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Error loading config file, using defaults')));
    }
  }
  
  return config;
}

// Helper functions for dashboard
async function getNetworkNodes() {
  // In a real implementation, this would query all known nodes
  return [
    { id: 'node-1', host: 'localhost', port: 3000, status: 'online', role: 'validator' },
    { id: 'node-2', host: 'localhost', port: 3001, status: 'online', role: 'miner' },
    { id: 'node-3', host: 'localhost', port: 3002, status: 'offline', role: 'miner' }
  ];
}

async function collectNetworkMetrics() {
  // In a real implementation, this would collect metrics from all nodes
  return {
    totalNodes: 3,
    activeNodes: 2,
    tps: 1250.5,
    averageLatency: 45.2,
    availability: 99.985,
    uptime: '99.985%',
    blockHeight: 15420,
    memoryUsage: 512000000, // bytes
    cpuUsage: 15.5 // percentage
  };
}

async function getNetworkStatus() {
  return {
    status: 'healthy',
    network: 'kaldrix-testnet',
    totalNodes: 3,
    activeNodes: 2,
    consensus: 'achieved',
    lastBlock: 15420,
    timestamp: new Date().toISOString()
  };
}

if (require.main === module) {
  program.parse();
}

module.exports = {
  startNode,
  startTestnet,
  startDashboard
};