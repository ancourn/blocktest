import { EventEmitter } from 'events';

export interface NetworkNode {
  id: string;
  region: string;
  role: 'validator' | 'miner' | 'full-node' | 'light-node';
  status: 'online' | 'offline' | 'syncing' | 'error';
  coordinates: {
    lat: number;
    lng: number;
  };
  specs: {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
  };
  lastSeen: Date;
  metrics: {
    tps: number;
    latency: number;
    uptime: number;
    peers: number;
  };
}

export interface NetworkTopology {
  id: string;
  name: string;
  description: string;
  nodes: NetworkNode[];
  connections: {
    from: string;
    to: string;
    latency: number;
    bandwidth: number;
    reliability: number;
  }[];
  regions: string[];
  createdAt: Date;
}

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  duration: number; // in seconds
  loadProfile: {
    tps: number;
    transactions: number;
    complexity: 'low' | 'medium' | 'high';
  };
  networkConditions: {
    latency: number;
    packetLoss: number;
    bandwidth: number;
  };
  failureScenarios: {
    nodeFailures: number;
    networkPartitions: number;
    byzantineNodes: number;
  };
}

export interface NetworkTestResult {
  id: string;
  scenarioId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  topologyId: string;
  metrics: {
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    averageTps: number;
    peakTps: number;
    averageLatency: number;
    p95Latency: number;
    p99Latency: number;
    availability: number;
    consensusTime: number;
    recoveryTime: number;
  };
  nodeMetrics: {
    [nodeId: string]: {
      uptime: number;
      tps: number;
      latency: number;
      errors: number;
    };
  };
  failures: {
    nodeFailures: number;
    networkPartitions: number;
    recoveryTime: number;
  };
}

export class MiniTestnetManager extends EventEmitter {
  private activeTestnets: Map<string, NetworkTopology> = new Map();
  private runningTests: Map<string, NetworkTestResult> = new Map();
  private nodeRegistry: Map<string, NetworkNode> = new Map();

  constructor() {
    super();
    this.initializeDefaultTopologies();
  }

  private initializeDefaultTopologies(): void {
    // Global distributed topology
    const globalTopology: NetworkTopology = {
      id: 'global-distributed',
      name: 'Global Distributed Network',
      description: 'Nodes distributed across major regions worldwide',
      nodes: this.generateGlobalNodes(),
      connections: this.generateGlobalConnections(),
      regions: ['us-east', 'us-west', 'eu-central', 'asia-southeast', 'asia-northeast'],
      createdAt: new Date()
    };

    // Regional cluster topology
    const regionalTopology: NetworkTopology = {
      id: 'regional-cluster',
      name: 'Regional Cluster Network',
      description: 'Nodes clustered in specific regions with low latency',
      nodes: this.generateRegionalNodes(),
      connections: this.generateRegionalConnections(),
      regions: ['us-east', 'eu-central'],
      createdAt: new Date()
    };

    // Hybrid topology
    const hybridTopology: NetworkTopology = {
      id: 'hybrid-mixed',
      name: 'Hybrid Mixed Network',
      description: 'Mix of validators, miners, and full nodes across regions',
      nodes: this.generateHybridNodes(),
      connections: this.generateHybridConnections(),
      regions: ['us-east', 'us-west', 'eu-central', 'asia-southeast'],
      createdAt: new Date()
    };

    this.activeTestnets.set(globalTopology.id, globalTopology);
    this.activeTestnets.set(regionalTopology.id, regionalTopology);
    this.activeTestnets.set(hybridTopology.id, hybridTopology);
  }

  private generateGlobalNodes(): NetworkNode[] {
    const regions = [
      { name: 'us-east', lat: 40.7128, lng: -74.0060 },
      { name: 'us-west', lat: 37.7749, lng: -122.4194 },
      { name: 'eu-central', lat: 50.1109, lng: 8.6821 },
      { name: 'asia-southeast', lat: 1.3521, lng: 103.8198 },
      { name: 'asia-northeast', lat: 35.6762, lng: 139.6503 }
    ];

    const nodes: NetworkNode[] = [];
    let nodeIdCounter = 1;

    regions.forEach(region => {
      // Add validators
      for (let i = 0; i < 2; i++) {
        nodes.push(this.createNode(
          `validator-${region.name}-${nodeIdCounter++}`,
          region.name,
          'validator',
          region.lat,
          region.lng
        ));
      }

      // Add miners
      for (let i = 0; i < 3; i++) {
        nodes.push(this.createNode(
          `miner-${region.name}-${nodeIdCounter++}`,
          region.name,
          'miner',
          region.lat,
          region.lng
        ));
      }

      // Add full nodes
      for (let i = 0; i < 2; i++) {
        nodes.push(this.createNode(
          `full-node-${region.name}-${nodeIdCounter++}`,
          region.name,
          'full-node',
          region.lat,
          region.lng
        ));
      }
    });

    return nodes;
  }

  private generateRegionalNodes(): NetworkNode[] {
    const regions = [
      { name: 'us-east', lat: 40.7128, lng: -74.0060 },
      { name: 'eu-central', lat: 50.1109, lng: 8.6821 }
    ];

    const nodes: NetworkNode[] = [];
    let nodeIdCounter = 1;

    regions.forEach(region => {
      // High concentration of validators
      for (let i = 0; i < 5; i++) {
        nodes.push(this.createNode(
          `validator-${region.name}-${nodeIdCounter++}`,
          region.name,
          'validator',
          region.lat,
          region.lng
        ));
      }

      // Medium concentration of miners
      for (let i = 0; i < 8; i++) {
        nodes.push(this.createNode(
          `miner-${region.name}-${nodeIdCounter++}`,
          region.name,
          'miner',
          region.lat,
          region.lng
        ));
      }

      // Full nodes
      for (let i = 0; i < 5; i++) {
        nodes.push(this.createNode(
          `full-node-${region.name}-${nodeIdCounter++}`,
          region.name,
          'full-node',
          region.lat,
          region.lng
        ));
      }
    });

    return nodes;
  }

  private generateHybridNodes(): NetworkNode[] {
    const regions = [
      { name: 'us-east', lat: 40.7128, lng: -74.0060 },
      { name: 'us-west', lat: 37.7749, lng: -122.4194 },
      { name: 'eu-central', lat: 50.1109, lng: 8.6821 },
      { name: 'asia-southeast', lat: 1.3521, lng: 103.8198 }
    ];

    const nodes: NetworkNode[] = [];
    let nodeIdCounter = 1;

    regions.forEach((region, regionIndex) => {
      // Different node distribution per region
      const validatorCount = regionIndex === 0 ? 4 : 2;
      const minerCount = regionIndex === 0 ? 6 : 3;
      const fullNodeCount = regionIndex === 0 ? 4 : 2;

      for (let i = 0; i < validatorCount; i++) {
        nodes.push(this.createNode(
          `validator-${region.name}-${nodeIdCounter++}`,
          region.name,
          'validator',
          region.lat,
          region.lng
        ));
      }

      for (let i = 0; i < minerCount; i++) {
        nodes.push(this.createNode(
          `miner-${region.name}-${nodeIdCounter++}`,
          region.name,
          'miner',
          region.lat,
          region.lng
        ));
      }

      for (let i = 0; i < fullNodeCount; i++) {
        nodes.push(this.createNode(
          `full-node-${region.name}-${nodeIdCounter++}`,
          region.name,
          'full-node',
          region.lat,
          region.lng
        ));
      }

      // Add some light nodes
      for (let i = 0; i < 2; i++) {
        nodes.push(this.createNode(
          `light-node-${region.name}-${nodeIdCounter++}`,
          region.name,
          'light-node',
          region.lat,
          region.lng
        ));
      }
    });

    return nodes;
  }

  private createNode(id: string, region: string, role: NetworkNode['role'], lat: number, lng: number): NetworkNode {
    const node: NetworkNode = {
      id,
      region,
      role,
      status: 'online',
      coordinates: { lat, lng },
      specs: this.generateNodeSpecs(role),
      lastSeen: new Date(),
      metrics: {
        tps: 0,
        latency: 0,
        uptime: 100,
        peers: 0
      }
    };

    this.nodeRegistry.set(id, node);
    return node;
  }

  private generateNodeSpecs(role: NetworkNode['role']) {
    const baseSpecs = {
      validator: { cpu: 8, memory: 32, storage: 1000, network: 1000 },
      miner: { cpu: 16, memory: 64, storage: 2000, network: 1000 },
      'full-node': { cpu: 4, memory: 16, storage: 500, network: 500 },
      'light-node': { cpu: 2, memory: 8, storage: 100, network: 100 }
    };

    // Add some variation
    const specs = baseSpecs[role];
    return {
      cpu: specs.cpu + Math.floor(Math.random() * 4) - 2,
      memory: specs.memory + Math.floor(Math.random() * 8) - 4,
      storage: specs.storage + Math.floor(Math.random() * 200) - 100,
      network: specs.network + Math.floor(Math.random() * 200) - 100
    };
  }

  private generateGlobalConnections() {
    // Generate realistic inter-region connections
    return [
      // US East connections
      { from: 'validator-us-east-1', to: 'validator-us-east-2', latency: 5, bandwidth: 1000, reliability: 0.999 },
      { from: 'validator-us-east-1', to: 'miner-us-east-1', latency: 3, bandwidth: 1000, reliability: 0.999 },
      { from: 'us-east', to: 'us-west', latency: 75, bandwidth: 500, reliability: 0.995 },
      { from: 'us-east', to: 'eu-central', latency: 85, bandwidth: 400, reliability: 0.994 },
      { from: 'us-east', to: 'asia-southeast', latency: 180, bandwidth: 300, reliability: 0.992 },
      { from: 'us-east', to: 'asia-northeast', latency: 150, bandwidth: 350, reliability: 0.993 },
      
      // US West connections
      { from: 'us-west', to: 'asia-southeast', latency: 120, bandwidth: 400, reliability: 0.994 },
      { from: 'us-west', to: 'asia-northeast', latency: 100, bandwidth: 450, reliability: 0.995 },
      
      // EU Central connections
      { from: 'eu-central', to: 'asia-southeast', latency: 140, bandwidth: 350, reliability: 0.993 },
      { from: 'eu-central', to: 'asia-northeast', latency: 160, bandwidth: 300, reliability: 0.992 },
      
      // Asia connections
      { from: 'asia-southeast', to: 'asia-northeast', latency: 60, bandwidth: 800, reliability: 0.997 }
    ];
  }

  private generateRegionalConnections() {
    return [
      // US East internal connections
      { from: 'validator-us-east-1', to: 'validator-us-east-2', latency: 2, bandwidth: 1000, reliability: 0.999 },
      { from: 'validator-us-east-1', to: 'miner-us-east-1', latency: 1, bandwidth: 1000, reliability: 0.999 },
      { from: 'miner-us-east-1', to: 'full-node-us-east-1', latency: 1, bandwidth: 1000, reliability: 0.999 },
      
      // EU Central internal connections
      { from: 'validator-eu-central-1', to: 'validator-eu-central-2', latency: 2, bandwidth: 1000, reliability: 0.999 },
      { from: 'validator-eu-central-1', to: 'miner-eu-central-1', latency: 1, bandwidth: 1000, reliability: 0.999 },
      { from: 'miner-eu-central-1', to: 'full-node-eu-central-1', latency: 1, bandwidth: 1000, reliability: 0.999 },
      
      // Cross-region connection
      { from: 'us-east', to: 'eu-central', latency: 85, bandwidth: 400, reliability: 0.994 }
    ];
  }

  private generateHybridConnections() {
    return [
      // High-speed regional connections
      { from: 'us-east', to: 'us-west', latency: 75, bandwidth: 500, reliability: 0.995 },
      { from: 'us-east', to: 'eu-central', latency: 85, bandwidth: 400, reliability: 0.994 },
      { from: 'us-west', to: 'asia-southeast', latency: 120, bandwidth: 400, reliability: 0.994 },
      { from: 'eu-central', to: 'asia-southeast', latency: 140, bandwidth: 350, reliability: 0.993 },
      
      // Inter-regional connections
      { from: 'us-east', to: 'asia-southeast', latency: 180, bandwidth: 300, reliability: 0.992 },
      { from: 'us-west', to: 'eu-central', latency: 150, bandwidth: 350, reliability: 0.993 },
      { from: 'us-east', to: 'asia-northeast', latency: 150, bandwidth: 350, reliability: 0.993 }
    ];
  }

  // Public API methods
  getAvailableTopologies(): NetworkTopology[] {
    return Array.from(this.activeTestnets.values());
  }

  getTopology(topologyId: string): NetworkTopology | undefined {
    return this.activeTestnets.get(topologyId);
  }

  getNode(nodeId: string): NetworkNode | undefined {
    return this.nodeRegistry.get(nodeId);
  }

  getAllNodes(): NetworkNode[] {
    return Array.from(this.nodeRegistry.values());
  }

  createCustomTopology(config: {
    name: string;
    description: string;
    regions: string[];
    nodeCounts: {
      validators: number;
      miners: number;
      fullNodes: number;
      lightNodes: number;
    };
  }): NetworkTopology {
    const topologyId = `custom-${Date.now()}`;
    const nodes: NetworkNode[] = [];
    let nodeIdCounter = 1;

    const regionCoords = {
      'us-east': { lat: 40.7128, lng: -74.0060 },
      'us-west': { lat: 37.7749, lng: -122.4194 },
      'eu-central': { lat: 50.1109, lng: 8.6821 },
      'asia-southeast': { lat: 1.3521, lng: 103.8198 },
      'asia-northeast': { lat: 35.6762, lng: 139.6503 }
    };

    config.regions.forEach(region => {
      const coords = regionCoords[region as keyof typeof regionCoords];
      if (!coords) return;

      // Add validators
      for (let i = 0; i < config.nodeCounts.validators; i++) {
        nodes.push(this.createNode(
          `validator-${region}-${nodeIdCounter++}`,
          region,
          'validator',
          coords.lat,
          coords.lng
        ));
      }

      // Add miners
      for (let i = 0; i < config.nodeCounts.miners; i++) {
        nodes.push(this.createNode(
          `miner-${region}-${nodeIdCounter++}`,
          region,
          'miner',
          coords.lat,
          coords.lng
        ));
      }

      // Add full nodes
      for (let i = 0; i < config.nodeCounts.fullNodes; i++) {
        nodes.push(this.createNode(
          `full-node-${region}-${nodeIdCounter++}`,
          region,
          'full-node',
          coords.lat,
          coords.lng
        ));
      }

      // Add light nodes
      for (let i = 0; i < config.nodeCounts.lightNodes; i++) {
        nodes.push(this.createNode(
          `light-node-${region}-${nodeIdCounter++}`,
          region,
          'light-node',
          coords.lat,
          coords.lng
        ));
      }
    });

    const topology: NetworkTopology = {
      id: topologyId,
      name: config.name,
      description: config.description,
      nodes,
      connections: this.generateCustomConnections(nodes),
      regions: config.regions,
      createdAt: new Date()
    };

    this.activeTestnets.set(topologyId, topology);
    this.emit('topologyCreated', topology);

    return topology;
  }

  private generateCustomConnections(nodes: NetworkNode[]) {
    const connections = [];
    const regionGroups = new Map<string, NetworkNode[]>();

    // Group nodes by region
    nodes.forEach(node => {
      if (!regionGroups.has(node.region)) {
        regionGroups.set(node.region, []);
      }
      regionGroups.get(node.region)!.push(node);
    });

    // Create intra-region connections
    regionGroups.forEach((regionNodes, region) => {
      for (let i = 0; i < regionNodes.length; i++) {
        for (let j = i + 1; j < regionNodes.length; j++) {
          connections.push({
            from: regionNodes[i].id,
            to: regionNodes[j].id,
            latency: Math.random() * 5 + 1,
            bandwidth: 1000,
            reliability: 0.999
          });
        }
      }
    });

    // Create inter-region connections
    const regions = Array.from(regionGroups.keys());
    for (let i = 0; i < regions.length; i++) {
      for (let j = i + 1; j < regions.length; j++) {
        const region1 = regions[i];
        const region2 = regions[j];
        
        // Connect a few nodes between regions
        const nodes1 = regionGroups.get(region1)!;
        const nodes2 = regionGroups.get(region2)!;
        
        for (let k = 0; k < Math.min(2, nodes1.length, nodes2.length); k++) {
          connections.push({
            from: nodes1[k].id,
            to: nodes2[k].id,
            latency: Math.random() * 100 + 50,
            bandwidth: 400,
            reliability: 0.995
          });
        }
      }
    }

    return connections;
  }

  startNetworkTest(topologyId: string, scenario: TestScenario): Promise<NetworkTestResult> {
    return new Promise((resolve, reject) => {
      const topology = this.activeTestnets.get(topologyId);
      if (!topology) {
        reject(new Error(`Topology ${topologyId} not found`));
        return;
      }

      const testResult: NetworkTestResult = {
        id: `test-${Date.now()}`,
        scenarioId: scenario.id,
        startTime: new Date(),
        endTime: new Date(Date.now() + scenario.duration * 1000),
        duration: scenario.duration,
        topologyId,
        metrics: {
          totalTransactions: 0,
          successfulTransactions: 0,
          failedTransactions: 0,
          averageTps: 0,
          peakTps: 0,
          averageLatency: 0,
          p95Latency: 0,
          p99Latency: 0,
          availability: 100,
          consensusTime: 0,
          recoveryTime: 0
        },
        nodeMetrics: {},
        failures: {
          nodeFailures: 0,
          networkPartitions: 0,
          recoveryTime: 0
        }
      };

      this.runningTests.set(testResult.id, testResult);
      this.emit('testStarted', testResult);

      // Simulate network test execution
      this.simulateNetworkTest(testResult, topology, scenario)
        .then(finalResult => {
          this.runningTests.delete(testResult.id);
          resolve(finalResult);
        })
        .catch(error => {
          this.runningTests.delete(testResult.id);
          reject(error);
        });
    });
  }

  private async simulateNetworkTest(testResult: NetworkTestResult, topology: NetworkTopology, scenario: TestScenario): Promise<NetworkTestResult> {
    const startTime = Date.now();
    const endTime = startTime + scenario.duration * 1000;

    // Initialize node metrics
    topology.nodes.forEach(node => {
      testResult.nodeMetrics[node.id] = {
        uptime: 100,
        tps: 0,
        latency: 0,
        errors: 0
      };
    });

    // Simulate test execution
    const testInterval = setInterval(() => {
      const currentTime = Date.now();
      const progress = (currentTime - startTime) / (endTime - startTime);

      // Update metrics
      this.updateTestMetrics(testResult, topology, scenario, progress);
      this.emit('testProgress', { testResult, progress });

      if (currentTime >= endTime) {
        clearInterval(testInterval);
        testResult.endTime = new Date();
        this.emit('testCompleted', testResult);
      }
    }, 1000);

    // Wait for test completion
    await new Promise(resolve => {
      setTimeout(resolve, scenario.duration * 1000);
    });

    return testResult;
  }

  private updateTestMetrics(testResult: NetworkTestResult, topology: NetworkTopology, scenario: TestScenario, progress: number): void {
    // Simulate realistic metrics based on scenario and topology
    const baseTps = scenario.loadProfile.tps;
    const currentTps = baseTps * (0.8 + Math.random() * 0.4); // Add some variation
    
    testResult.metrics.totalTransactions += Math.floor(currentTps);
    testResult.metrics.successfulTransactions += Math.floor(currentTps * 0.98); // 98% success rate
    testResult.metrics.failedTransactions += Math.floor(currentTps * 0.02); // 2% failure rate
    
    testResult.metrics.averageTps = testResult.metrics.totalTransactions / ((Date.now() - testResult.startTime.getTime()) / 1000);
    testResult.metrics.peakTps = Math.max(testResult.metrics.peakTps, currentTps);
    
    // Simulate latency based on network conditions
    const baseLatency = scenario.networkConditions.latency;
    testResult.metrics.averageLatency = baseLatency * (0.8 + Math.random() * 0.4);
    testResult.metrics.p95Latency = testResult.metrics.averageLatency * 1.5;
    testResult.metrics.p99Latency = testResult.metrics.averageLatency * 2.0;
    
    // Update node metrics
    topology.nodes.forEach(node => {
      const nodeMetric = testResult.nodeMetrics[node.id];
      if (nodeMetric) {
        nodeMetric.tps = currentTps / topology.nodes.length;
        nodeMetric.latency = testResult.metrics.averageLatency + (Math.random() * 10 - 5);
        nodeMetric.uptime = 100 - (Math.random() * 0.1); // Very high uptime
        nodeMetric.errors = Math.floor(Math.random() * 2);
      }
    });

    // Simulate occasional failures
    if (Math.random() < 0.01) { // 1% chance per update
      testResult.failures.nodeFailures += 1;
      testResult.metrics.availability = Math.max(99.9, testResult.metrics.availability - 0.01);
    }
  }

  getRunningTests(): NetworkTestResult[] {
    return Array.from(this.runningTests.values());
  }

  getTestHistory(topologyId?: string): NetworkTestResult[] {
    // This would typically fetch from a database
    return [];
  }

  stopTest(testId: string): boolean {
    const test = this.runningTests.get(testId);
    if (test) {
      test.endTime = new Date();
      this.runningTests.delete(testId);
      this.emit('testStopped', test);
      return true;
    }
    return false;
  }
}