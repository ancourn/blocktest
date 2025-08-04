import { EventEmitter } from 'events';

export interface TopologyNode {
  id: string;
  name: string;
  type: 'validator' | 'miner' | 'full-node' | 'light-node' | 'archive-node' | 'api-node';
  location: {
    region: string;
    datacenter: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  specifications: {
    cpu: {
      cores: number;
      speed: number; // GHz
    };
    memory: {
      total: number; // GB
      type: string;
    };
    storage: {
      total: number; // GB
      type: string;
      iops: number;
    };
    network: {
      bandwidth: number; // Mbps
      latency: number; // ms
    };
  };
  status: {
    online: boolean;
    lastSeen: Date;
    uptime: number; // percentage
    load: {
      cpu: number; // percentage
      memory: number; // percentage
      storage: number; // percentage
      network: number; // percentage
    };
  };
  connections: string[]; // Connected node IDs
  metrics: {
    transactionsProcessed: number;
    blocksProduced: number;
    consensusParticipation: number;
    peerCount: number;
  };
}

export interface TopologyConnection {
  id: string;
  from: string;
  to: string;
  type: 'direct' | 'relay' | 'tunnel';
  properties: {
    bandwidth: number; // Mbps
    latency: number; // ms
    reliability: number; // 0-1
    cost: number; // per GB
    encryption: boolean;
    compression: boolean;
  };
  status: {
    active: boolean;
    lastUsed: Date;
    traffic: {
      incoming: number; // Mbps
      outgoing: number; // Mbps
    };
    errors: number;
  };
}

export interface NetworkTopology {
  id: string;
  name: string;
  description: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  nodes: TopologyNode[];
  connections: TopologyConnection[];
  properties: {
    totalNodes: number;
    totalConnections: number;
    averageLatency: number;
    totalBandwidth: number;
    redundancy: number;
    decentralization: number;
  };
  configuration: {
    consensus: 'proof-of-stake' | 'proof-of-work' | 'delegated-proof-of-stake' | 'practical-byzantine-fault-tolerance';
    shardCount: number;
    replicationFactor: number;
    minimumValidators: number;
    blockTime: number; // seconds
  };
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  duration: number; // seconds
  events: SimulationEvent[];
  metrics: {
    collectInterval: number; // seconds
    targets: string[]; // metric names to collect
  };
}

export interface SimulationEvent {
  id: string;
  type: 'node-failure' | 'network-partition' | 'latency-spike' | 'bandwidth-throttle' | 'ddos-attack' | 'software-update';
  timestamp: number; // seconds from start
  target: string; // node ID or connection ID
  parameters: {
    [key: string]: any;
  };
  duration?: number; // seconds
}

export interface SimulationResult {
  id: string;
  scenarioId: string;
  topologyId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  events: {
    triggered: SimulationEvent[];
    completed: SimulationEvent[];
    failed: SimulationEvent[];
  };
  metrics: {
    timeline: {
      timestamp: Date;
      data: { [key: string]: number };
    }[];
    summary: {
      averageTps: number;
      peakTps: number;
      averageLatency: number;
      availability: number;
      consensusTime: number;
      recoveryTime: number;
    };
    nodeMetrics: { [nodeId: string]: any };
    connectionMetrics: { [connectionId: string]: any };
  };
  analysis: {
    bottlenecks: string[];
    failurePoints: string[];
    recommendations: string[];
    resilienceScore: number;
  };
}

export class NetworkTopologySimulator extends EventEmitter {
  private topologies: Map<string, NetworkTopology> = new Map();
  private scenarios: Map<string, SimulationScenario> = new Map();
  private simulationHistory: SimulationResult[] = new Map();
  private activeSimulations: Map<string, SimulationResult> = new Map();

  constructor() {
    super();
    this.initializeDefaultTopologies();
    this.initializeDefaultScenarios();
  }

  private initializeDefaultTopologies(): void {
    // Small testnet topology
    const smallTestnet: NetworkTopology = {
      id: 'small-testnet',
      name: 'Small Testnet',
      description: 'Compact network for development and testing',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      nodes: this.generateSmallTestnetNodes(),
      connections: this.generateSmallTestnetConnections(),
      properties: {
        totalNodes: 0,
        totalConnections: 0,
        averageLatency: 0,
        totalBandwidth: 0,
        redundancy: 0,
        decentralization: 0
      },
      configuration: {
        consensus: 'proof-of-stake',
        shardCount: 1,
        replicationFactor: 3,
        minimumValidators: 4,
        blockTime: 5
      }
    };

    // Medium enterprise topology
    const mediumEnterprise: NetworkTopology = {
      id: 'medium-enterprise',
      name: 'Medium Enterprise Network',
      description: 'Mid-sized network for enterprise applications',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      nodes: this.generateMediumEnterpriseNodes(),
      connections: this.generateMediumEnterpriseConnections(),
      properties: {
        totalNodes: 0,
        totalConnections: 0,
        averageLatency: 0,
        totalBandwidth: 0,
        redundancy: 0,
        decentralization: 0
      },
      configuration: {
        consensus: 'delegated-proof-of-stake',
        shardCount: 4,
        replicationFactor: 5,
        minimumValidators: 21,
        blockTime: 3
      }
    };

    // Large global topology
    const largeGlobal: NetworkTopology = {
      id: 'large-global',
      name: 'Large Global Network',
      description: 'Global-scale network with high availability',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      nodes: this.generateLargeGlobalNodes(),
      connections: this.generateLargeGlobalConnections(),
      properties: {
        totalNodes: 0,
        totalConnections: 0,
        averageLatency: 0,
        totalBandwidth: 0,
        redundancy: 0,
        decentralization: 0
      },
      configuration: {
        consensus: 'practical-byzantine-fault-tolerance',
        shardCount: 16,
        replicationFactor: 7,
        minimumValidators: 100,
        blockTime: 1
      }
    };

    // Calculate topology properties
    this.calculateTopologyProperties(smallTestnet);
    this.calculateTopologyProperties(mediumEnterprise);
    this.calculateTopologyProperties(largeGlobal);

    this.topologies.set(smallTestnet.id, smallTestnet);
    this.topologies.set(mediumEnterprise.id, mediumEnterprise);
    this.topologies.set(largeGlobal.id, largeGlobal);
  }

  private generateSmallTestnetNodes(): TopologyNode[] {
    const nodes: TopologyNode[] = [];
    const regions = [
      { name: 'us-east', datacenter: 'aws-us-east-1', lat: 39.0437, lng: -77.4875 },
      { name: 'eu-central', datacenter: 'gcp-eu-central-1', lat: 50.1109, lng: 8.6821 }
    ];

    let nodeId = 1;
    
    // Generate validators
    for (let i = 0; i < 4; i++) {
      const region = regions[i % regions.length];
      nodes.push(this.createNode(
        `validator-${nodeId++}`,
        'validator',
        region.name,
        region.datacenter,
        region.lat,
        region.lng,
        { cpu: 8, memory: 32, storage: 1000, network: 1000 }
      ));
    }

    // Generate miners
    for (let i = 0; i < 6; i++) {
      const region = regions[i % regions.length];
      nodes.push(this.createNode(
        `miner-${nodeId++}`,
        'miner',
        region.name,
        region.datacenter,
        region.lat,
        region.lng,
        { cpu: 16, memory: 64, storage: 2000, network: 1000 }
      ));
    }

    // Generate full nodes
    for (let i = 0; i < 4; i++) {
      const region = regions[i % regions.length];
      nodes.push(this.createNode(
        `full-node-${nodeId++}`,
        'full-node',
        region.name,
        region.datacenter,
        region.lat,
        region.lng,
        { cpu: 4, memory: 16, storage: 500, network: 500 }
      ));
    }

    return nodes;
  }

  private generateMediumEnterpriseNodes(): TopologyNode[] {
    const nodes: TopologyNode[] = [];
    const regions = [
      { name: 'us-east', datacenter: 'aws-us-east-1', lat: 39.0437, lng: -77.4875 },
      { name: 'us-west', datacenter: 'gcp-us-west-1', lat: 37.7749, lng: -122.4194 },
      { name: 'eu-central', datacenter: 'azure-eu-central', lat: 50.1109, lng: 8.6821 },
      { name: 'asia-southeast', datacenter: 'aws-ap-southeast-1', lat: 1.3521, lng: 103.8198 }
    ];

    let nodeId = 1;

    // Generate validators (more distributed)
    for (let i = 0; i < 21; i++) {
      const region = regions[i % regions.length];
      nodes.push(this.createNode(
        `validator-${nodeId++}`,
        'validator',
        region.name,
        region.datacenter,
        region.lat,
        region.lng,
        { cpu: 12, memory: 48, storage: 1500, network: 2000 }
      ));
    }

    // Generate miners
    for (let i = 0; i < 30; i++) {
      const region = regions[i % regions.length];
      nodes.push(this.createNode(
        `miner-${nodeId++}`,
        'miner',
        region.name,
        region.datacenter,
        region.lat,
        region.lng,
        { cpu: 24, memory: 96, storage: 3000, network: 2000 }
      ));
    }

    // Generate full nodes
    for (let i = 0; i < 20; i++) {
      const region = regions[i % regions.length];
      nodes.push(this.createNode(
        `full-node-${nodeId++}`,
        'full-node',
        region.name,
        region.datacenter,
        region.lat,
        region.lng,
        { cpu: 8, memory: 32, storage: 1000, network: 1000 }
      ));
    }

    // Generate archive nodes
    for (let i = 0; i < 4; i++) {
      const region = regions[i % regions.length];
      nodes.push(this.createNode(
        `archive-node-${nodeId++}`,
        'archive-node',
        region.name,
        region.datacenter,
        region.lat,
        region.lng,
        { cpu: 16, memory: 128, storage: 10000, network: 1000 }
      ));
    }

    // Generate API nodes
    for (let i = 0; i < 6; i++) {
      const region = regions[i % regions.length];
      nodes.push(this.createNode(
        `api-node-${nodeId++}`,
        'api-node',
        region.name,
        region.datacenter,
        region.lat,
        region.lng,
        { cpu: 8, memory: 32, storage: 500, network: 5000 }
      ));
    }

    return nodes;
  }

  private generateLargeGlobalNodes(): TopologyNode[] {
    const nodes: TopologyNode[] = [];
    const regions = [
      { name: 'us-east', datacenter: 'aws-us-east-1', lat: 39.0437, lng: -77.4875 },
      { name: 'us-west', datacenter: 'gcp-us-west-1', lat: 37.7749, lng: -122.4194 },
      { name: 'eu-central', datacenter: 'azure-eu-central', lat: 50.1109, lng: 8.6821 },
      { name: 'eu-west', datacenter: 'aws-eu-west-1', lat: 51.5074, lng: -0.1278 },
      { name: 'asia-southeast', datacenter: 'aws-ap-southeast-1', lat: 1.3521, lng: 103.8198 },
      { name: 'asia-northeast', datacenter: 'gcp-asia-northeast-1', lat: 35.6762, lng: 139.6503 },
      { name: 'sa-east', datacenter: 'aws-sa-east-1', lat: -23.5505, lng: -46.6333 },
      { name: 'af-south', datacenter: 'aws-af-south-1', lat: -33.9249, lng: 18.4241 }
    ];

    let nodeId = 1;

    // Generate validators (highly distributed)
    for (let i = 0; i < 150; i++) {
      const region = regions[i % regions.length];
      nodes.push(this.createNode(
        `validator-${nodeId++}`,
        'validator',
        region.name,
        region.datacenter,
        region.lat,
        region.lng,
        { cpu: 16, memory: 64, storage: 2000, network: 5000 }
      ));
    }

    // Generate miners
    for (let i = 0; i < 200; i++) {
      const region = regions[i % regions.length];
      nodes.push(this.createNode(
        `miner-${nodeId++}`,
        'miner',
        region.name,
        region.datacenter,
        region.lat,
        region.lng,
        { cpu: 32, memory: 128, storage: 4000, network: 5000 }
      ));
    }

    // Generate full nodes
    for (let i = 0; i < 100; i++) {
      const region = regions[i % regions.length];
      nodes.push(this.createNode(
        `full-node-${nodeId++}`,
        'full-node',
        region.name,
        region.datacenter,
        region.lat,
        region.lng,
        { cpu: 12, memory: 48, storage: 1500, network: 2000 }
      ));
    }

    // Generate archive nodes
    for (let i = 0; i < 20; i++) {
      const region = regions[i % regions.length];
      nodes.push(this.createNode(
        `archive-node-${nodeId++}`,
        'archive-node',
        region.name,
        region.datacenter,
        region.lat,
        region.lng,
        { cpu: 24, memory: 256, storage: 50000, network: 2000 }
      ));
    }

    // Generate API nodes
    for (let i = 0; i < 30; i++) {
      const region = regions[i % regions.length];
      nodes.push(this.createNode(
        `api-node-${nodeId++}`,
        'api-node',
        region.name,
        region.datacenter,
        region.lat,
        region.lng,
        { cpu: 16, memory: 64, storage: 1000, network: 10000 }
      ));
    }

    // Generate light nodes
    for (let i = 0; i < 50; i++) {
      const region = regions[i % regions.length];
      nodes.push(this.createNode(
        `light-node-${nodeId++}`,
        'light-node',
        region.name,
        region.datacenter,
        region.lat,
        region.lng,
        { cpu: 2, memory: 8, storage: 100, network: 500 }
      ));
    }

    return nodes;
  }

  private createNode(
    id: string,
    type: TopologyNode['type'],
    region: string,
    datacenter: string,
    lat: number,
    lng: number,
    specs: { cpu: number; memory: number; storage: number; network: number }
  ): TopologyNode {
    return {
      id,
      name: id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      type,
      location: {
        region,
        datacenter,
        coordinates: { lat, lng }
      },
      specifications: {
        cpu: {
          cores: specs.cpu,
          speed: 2.5 + Math.random() * 2.0
        },
        memory: {
          total: specs.memory,
          type: 'DDR4'
        },
        storage: {
          total: specs.storage,
          type: 'NVMe SSD',
          iops: 50000 + Math.floor(Math.random() * 50000)
        },
        network: {
          bandwidth: specs.network,
          latency: 1 + Math.random() * 4
        }
      },
      status: {
        online: true,
        lastSeen: new Date(),
        uptime: 99.9 + Math.random() * 0.1,
        load: {
          cpu: Math.random() * 30,
          memory: Math.random() * 40,
          storage: Math.random() * 20,
          network: Math.random() * 25
        }
      },
      connections: [],
      metrics: {
        transactionsProcessed: Math.floor(Math.random() * 1000000),
        blocksProduced: type === 'miner' ? Math.floor(Math.random() * 10000) : 0,
        consensusParticipation: type === 'validator' ? 95 + Math.random() * 5 : 0,
        peerCount: 0
      }
    };
  }

  private generateSmallTestnetConnections(): TopologyConnection[] {
    // This would be generated based on the small testnet nodes
    return this.generateConnections(this.topologies.get('small-testnet')!.nodes, 0.7);
  }

  private generateMediumEnterpriseConnections(): TopologyConnection[] {
    return this.generateConnections(this.topologies.get('medium-enterprise')!.nodes, 0.6);
  }

  private generateLargeGlobalConnections(): TopologyConnection[] {
    return this.generateConnections(this.topologies.get('large-global')!.nodes, 0.4);
  }

  private generateConnections(nodes: TopologyNode[], connectionProbability: number): TopologyConnection[] {
    const connections: TopologyConnection[] = [];
    let connectionId = 1;

    // Group nodes by region
    const regionGroups = new Map<string, TopologyNode[]>();
    nodes.forEach(node => {
      if (!regionGroups.has(node.location.region)) {
        regionGroups.set(node.location.region, []);
      }
      regionGroups.get(node.location.region)!.push(node);
    });

    // Create intra-region connections (high probability)
    regionGroups.forEach(regionNodes => {
      for (let i = 0; i < regionNodes.length; i++) {
        for (let j = i + 1; j < regionNodes.length; j++) {
          if (Math.random() < connectionProbability * 1.5) {
            const connection = this.createConnection(
              `conn-${connectionId++}`,
              regionNodes[i].id,
              regionNodes[j].id,
              1 + Math.random() * 5, // Low latency
              1000 + Math.random() * 4000, // High bandwidth
              0.999 // High reliability
            );
            connections.push(connection);
            
            // Add to node connections
            regionNodes[i].connections.push(regionNodes[j].id);
            regionNodes[j].connections.push(regionNodes[i].id);
          }
        }
      }
    });

    // Create inter-region connections (lower probability)
    const regions = Array.from(regionGroups.keys());
    for (let i = 0; i < regions.length; i++) {
      for (let j = i + 1; j < regions.length; j++) {
        const nodes1 = regionGroups.get(regions[i])!;
        const nodes2 = regionGroups.get(regions[j])!;
        
        // Connect a few nodes between regions
        const connectionsPerRegion = Math.min(3, nodes1.length, nodes2.length);
        for (let k = 0; k < connectionsPerRegion; k++) {
          if (Math.random() < connectionProbability) {
            const connection = this.createConnection(
              `conn-${connectionId++}`,
              nodes1[k].id,
              nodes2[k].id,
              50 + Math.random() * 100, // Higher latency
              500 + Math.random() * 1500, // Lower bandwidth
              0.995 // Lower reliability
            );
            connections.push(connection);
            
            // Add to node connections
            nodes1[k].connections.push(nodes2[k].id);
            nodes2[k].connections.push(nodes1[k].id);
          }
        }
      }
    }

    return connections;
  }

  private createConnection(
    id: string,
    from: string,
    to: string,
    latency: number,
    bandwidth: number,
    reliability: number
  ): TopologyConnection {
    return {
      id,
      from,
      to,
      type: 'direct',
      properties: {
        bandwidth: Math.round(bandwidth),
        latency: Math.round(latency * 100) / 100,
        reliability: Math.round(reliability * 10000) / 10000,
        cost: 0.01 + Math.random() * 0.05,
        encryption: true,
        compression: Math.random() > 0.3
      },
      status: {
        active: true,
        lastUsed: new Date(),
        traffic: {
          incoming: Math.random() * bandwidth * 0.3,
          outgoing: Math.random() * bandwidth * 0.3
        },
        errors: Math.floor(Math.random() * 10)
      }
    };
  }

  private calculateTopologyProperties(topology: NetworkTopology): void {
    topology.properties.totalNodes = topology.nodes.length;
    topology.properties.totalConnections = topology.connections.length;
    
    // Calculate average latency
    const totalLatency = topology.connections.reduce((sum, conn) => sum + conn.properties.latency, 0);
    topology.properties.averageLatency = totalLatency / topology.connections.length;
    
    // Calculate total bandwidth
    topology.properties.totalBandwidth = topology.connections.reduce((sum, conn) => sum + conn.properties.bandwidth, 0);
    
    // Calculate redundancy (average connections per node)
    const totalNodeConnections = topology.nodes.reduce((sum, node) => sum + node.connections.length, 0);
    topology.properties.redundancy = totalNodeConnections / topology.nodes.length;
    
    // Calculate decentralization (entropy of node distribution)
    const regionCounts = new Map<string, number>();
    topology.nodes.forEach(node => {
      regionCounts.set(node.location.region, (regionCounts.get(node.location.region) || 0) + 1);
    });
    
    let entropy = 0;
    const totalNodes = topology.nodes.length;
    regionCounts.forEach(count => {
      const probability = count / totalNodes;
      entropy -= probability * Math.log2(probability);
    });
    
    const maxEntropy = Math.log2(regionCounts.size);
    topology.properties.decentralization = entropy / maxEntropy;
  }

  private initializeDefaultScenarios(): void {
    const scenarios: SimulationScenario[] = [
      {
        id: 'node-failure-test',
        name: 'Node Failure Test',
        description: 'Simulate random node failures and measure recovery',
        duration: 300, // 5 minutes
        events: [
          {
            id: 'fail-1',
            type: 'node-failure',
            timestamp: 30,
            target: 'validator-1',
            parameters: { reason: 'hardware-failure' },
            duration: 60
          },
          {
            id: 'fail-2',
            type: 'node-failure',
            timestamp: 90,
            target: 'miner-3',
            parameters: { reason: 'network-outage' },
            duration: 45
          },
          {
            id: 'fail-3',
            type: 'node-failure',
            timestamp: 180,
            target: 'full-node-2',
            parameters: { reason: 'software-crash' },
            duration: 30
          }
        ],
        metrics: {
          collectInterval: 10,
          targets: ['tps', 'latency', 'availability', 'consensus-time']
        }
      },
      {
        id: 'network-partition-test',
        name: 'Network Partition Test',
        description: 'Simulate network partitions and test network resilience',
        duration: 600, // 10 minutes
        events: [
          {
            id: 'partition-1',
            type: 'network-partition',
            timestamp: 60,
            target: 'us-east',
            parameters: { isolatedRegions: ['us-east'], duration: 120 },
            duration: 120
          },
          {
            id: 'partition-2',
            type: 'network-partition',
            timestamp: 240,
            target: 'eu-central',
            parameters: { isolatedRegions: ['eu-central', 'asia-southeast'], duration: 90 },
            duration: 90
          }
        ],
        metrics: {
          collectInterval: 15,
          targets: ['tps', 'latency', 'availability', 'consensus-time', 'recovery-time']
        }
      },
      {
        id: 'latency-spike-test',
        name: 'Latency Spike Test',
        description: 'Simulate latency spikes and measure impact on performance',
        duration: 180, // 3 minutes
        events: [
          {
            id: 'spike-1',
            type: 'latency-spike',
            timestamp: 30,
            target: 'us-east',
            parameters: { multiplier: 5.0, duration: 60 },
            duration: 60
          },
          {
            id: 'spike-2',
            type: 'latency-spike',
            timestamp: 120,
            target: 'global',
            parameters: { multiplier: 3.0, duration: 30 },
            duration: 30
          }
        ],
        metrics: {
          collectInterval: 5,
          targets: ['tps', 'latency', 'consensus-time', 'error-rate']
        }
      },
      {
        id: 'ddos-attack-test',
        name: 'DDoS Attack Test',
        description: 'Simulate DDoS attacks on critical nodes',
        duration: 420, // 7 minutes
        events: [
          {
            id: 'ddos-1',
            type: 'ddos-attack',
            timestamp: 60,
            target: 'api-node-1',
            parameters: { intensity: 'high', duration: 120 },
            duration: 120
          },
          {
            id: 'ddos-2',
            type: 'ddos-attack',
            timestamp: 240,
            target: 'validator-5',
            parameters: { intensity: 'medium', duration: 90 },
            duration: 90
          }
        ],
        metrics: {
          collectInterval: 10,
          targets: ['tps', 'latency', 'availability', 'error-rate', 'recovery-time']
        }
      },
      {
        id: 'comprehensive-stress-test',
        name: 'Comprehensive Stress Test',
        description: 'Multiple simultaneous failure scenarios',
        duration: 900, // 15 minutes
        events: [
          {
            id: 'multi-fail-1',
            type: 'node-failure',
            timestamp: 60,
            target: 'validator-2',
            parameters: { reason: 'hardware-failure' },
            duration: 120
          },
          {
            id: 'multi-partition-1',
            type: 'network-partition',
            timestamp: 90,
            target: 'us-west',
            parameters: { isolatedRegions: ['us-west'], duration: 180 },
            duration: 180
          },
          {
            id: 'multi-spike-1',
            type: 'latency-spike',
            timestamp: 150,
            target: 'global',
            parameters: { multiplier: 4.0, duration: 60 },
            duration: 60
          },
          {
            id: 'multi-ddos-1',
            type: 'ddos-attack',
            timestamp: 300,
            target: 'api-node-3',
            parameters: { intensity: 'high', duration: 150 },
            duration: 150
          }
        ],
        metrics: {
          collectInterval: 15,
          targets: ['tps', 'latency', 'availability', 'consensus-time', 'recovery-time', 'error-rate']
        }
      }
    ];

    scenarios.forEach(scenario => {
      this.scenarios.set(scenario.id, scenario);
    });
  }

  // Public API methods
  getTopologies(): NetworkTopology[] {
    return Array.from(this.topologies.values());
  }

  getTopology(topologyId: string): NetworkTopology | undefined {
    return this.topologies.get(topologyId);
  }

  getScenarios(): SimulationScenario[] {
    return Array.from(this.scenarios.values());
  }

  getScenario(scenarioId: string): SimulationScenario | undefined {
    return this.scenarios.get(scenarioId);
  }

  async runSimulation(topologyId: string, scenarioId: string): Promise<SimulationResult> {
    const topology = this.topologies.get(topologyId);
    const scenario = this.scenarios.get(scenarioId);
    
    if (!topology) {
      throw new Error(`Topology ${topologyId} not found`);
    }
    
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    const simulationId = `sim-${Date.now()}`;
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + scenario.duration * 1000);

    const result: SimulationResult = {
      id: simulationId,
      scenarioId,
      topologyId,
      startTime,
      endTime,
      duration: scenario.duration,
      events: {
        triggered: [],
        completed: [],
        failed: []
      },
      metrics: {
        timeline: [],
        summary: {
          averageTps: 0,
          peakTps: 0,
          averageLatency: 0,
          availability: 100,
          consensusTime: 0,
          recoveryTime: 0
        },
        nodeMetrics: {},
        connectionMetrics: {}
      },
      analysis: {
        bottlenecks: [],
        failurePoints: [],
        recommendations: [],
        resilienceScore: 0
      }
    };

    this.activeSimulations.set(simulationId, result);
    this.emit('simulationStarted', result);

    // Run the simulation
    await this.executeSimulation(result, topology, scenario);

    // Calculate final results
    this.calculateSimulationResults(result, topology);

    // Store in history
    this.simulationHistory.set(simulationId, result);
    this.activeSimulations.delete(simulationId);
    this.emit('simulationCompleted', result);

    return result;
  }

  private async executeSimulation(result: SimulationResult, topology: NetworkTopology, scenario: SimulationScenario): Promise<void> {
    const startTime = result.startTime.getTime();
    const endTime = result.endTime.getTime();

    // Create a copy of the topology for simulation
    const simulatedTopology = JSON.parse(JSON.stringify(topology));
    const nodeMap = new Map<string, TopologyNode>();
    const connectionMap = new Map<string, TopologyConnection>();

    simulatedTopology.nodes.forEach((node: TopologyNode) => {
      nodeMap.set(node.id, node);
    });

    simulatedTopology.connections.forEach((conn: TopologyConnection) => {
      connectionMap.set(conn.id, conn);
    });

    // Sort events by timestamp
    const sortedEvents = [...scenario.events].sort((a, b) => a.timestamp - b.timestamp);

    // Simulation loop
    const simulationInterval = setInterval(() => {
      const currentTime = Date.now();
      const elapsedTime = (currentTime - startTime) / 1000; // in seconds

      // Process events that should be triggered
      sortedEvents.forEach(event => {
        if (event.timestamp <= elapsedTime && !result.events.triggered.find(e => e.id === event.id)) {
          this.triggerEvent(event, nodeMap, connectionMap, result);
          result.events.triggered.push(event);
        }
      });

      // Update ongoing events
      result.events.triggered.forEach(event => {
        if (event.duration && event.timestamp + event.duration <= elapsedTime) {
          if (!result.events.completed.find(e => e.id === event.id)) {
            this.completeEvent(event, nodeMap, connectionMap, result);
            result.events.completed.push(event);
          }
        }
      });

      // Collect metrics
      if (elapsedTime % scenario.metrics.collectInterval === 0) {
        this.collectMetrics(result, nodeMap, connectionMap, elapsedTime);
      }

      // Check if simulation is complete
      if (currentTime >= endTime) {
        clearInterval(simulationInterval);
      }
    }, 1000);

    // Wait for simulation completion
    await new Promise(resolve => {
      setTimeout(resolve, scenario.duration * 1000);
    });
  }

  private triggerEvent(event: SimulationEvent, nodeMap: Map<string, TopologyNode>, connectionMap: Map<string, TopologyConnection>, result: SimulationResult): void {
    switch (event.type) {
      case 'node-failure':
        this.simulateNodeFailure(event, nodeMap, result);
        break;
      case 'network-partition':
        this.simulateNetworkPartition(event, nodeMap, connectionMap, result);
        break;
      case 'latency-spike':
        this.simulateLatencySpike(event, nodeMap, connectionMap, result);
        break;
      case 'ddos-attack':
        this.simulateDdosAttack(event, nodeMap, connectionMap, result);
        break;
      default:
        console.warn(`Unknown event type: ${event.type}`);
    }
  }

  private simulateNodeFailure(event: SimulationEvent, nodeMap: Map<string, TopologyNode>, result: SimulationResult): void {
    const node = nodeMap.get(event.target);
    if (node) {
      node.status.online = false;
      node.status.uptime = 0;
      node.metrics.consensusParticipation = 0;
      
      // Disable connections to/from this node
      node.connections.forEach(connectedNodeId => {
        const connectedNode = nodeMap.get(connectedNodeId);
        if (connectedNode) {
          connectedNode.connections = connectedNode.connections.filter(id => id !== node.id);
        }
      });
      node.connections = [];
    }
  }

  private simulateNetworkPartition(event: SimulationEvent, nodeMap: Map<string, TopologyNode>, connectionMap: Map<string, TopologyConnection>, result: SimulationResult): void {
    const isolatedRegions = event.parameters.isolatedRegions;
    
    // Disable connections between isolated and non-isolated regions
    connectionMap.forEach(connection => {
      const fromNode = nodeMap.get(connection.from);
      const toNode = nodeMap.get(connection.to);
      
      if (fromNode && toNode) {
        const fromIsolated = isolatedRegions.includes(fromNode.location.region);
        const toIsolated = isolatedRegions.includes(toNode.location.region);
        
        if (fromIsolated !== toIsolated) {
          connection.status.active = false;
          connection.status.traffic.incoming = 0;
          connection.status.traffic.outgoing = 0;
        }
      }
    });
  }

  private simulateLatencySpike(event: SimulationEvent, nodeMap: Map<string, TopologyNode>, connectionMap: Map<string, TopologyConnection>, result: SimulationResult): void {
    const multiplier = event.parameters.multiplier;
    const target = event.target;
    
    if (target === 'global') {
      // Apply to all connections
      connectionMap.forEach(connection => {
        connection.properties.latency *= multiplier;
      });
    } else {
      // Apply to specific region
      nodeMap.forEach(node => {
        if (node.location.region === target) {
          node.specifications.network.latency *= multiplier;
        }
      });
    }
  }

  private simulateDdosAttack(event: SimulationEvent, nodeMap: Map<string, TopologyNode>, connectionMap: Map<string, TopologyConnection>, result: SimulationResult): void {
    const node = nodeMap.get(event.target);
    if (node) {
      const intensity = event.parameters.intensity;
      const loadMultiplier = intensity === 'high' ? 5 : intensity === 'medium' ? 3 : 2;
      
      node.status.load.cpu = Math.min(100, node.status.load.cpu * loadMultiplier);
      node.status.load.memory = Math.min(100, node.status.load.memory * loadMultiplier);
      node.status.load.network = Math.min(100, node.status.load.network * loadMultiplier);
      
      // Increase errors on connections to this node
      connectionMap.forEach(connection => {
        if (connection.from === node.id || connection.to === node.id) {
          connection.status.errors += Math.floor(Math.random() * 100);
        }
      });
    }
  }

  private completeEvent(event: SimulationEvent, nodeMap: Map<string, TopologyNode>, connectionMap: Map<string, TopologyConnection>, result: SimulationResult): void {
    switch (event.type) {
      case 'node-failure':
        this.recoverNodeFailure(event, nodeMap, result);
        break;
      case 'network-partition':
        this.recoverNetworkPartition(event, nodeMap, connectionMap, result);
        break;
      case 'latency-spike':
        this.recoverLatencySpike(event, nodeMap, connectionMap, result);
        break;
      case 'ddos-attack':
        this.recoverDdosAttack(event, nodeMap, connectionMap, result);
        break;
    }
  }

  private recoverNodeFailure(event: SimulationEvent, nodeMap: Map<string, TopologyNode>, result: SimulationResult): void {
    const node = nodeMap.get(event.target);
    if (node) {
      node.status.online = true;
      node.status.uptime = 99.9 + Math.random() * 0.1;
      node.metrics.consensusParticipation = node.type === 'validator' ? 95 + Math.random() * 5 : 0;
      
      // Re-establish connections
      this.reestablishConnections(node, nodeMap);
    }
  }

  private recoverNetworkPartition(event: SimulationEvent, nodeMap: Map<string, TopologyNode>, connectionMap: Map<string, TopologyConnection>, result: SimulationResult): void {
    // Re-enable all connections
    connectionMap.forEach(connection => {
      connection.status.active = true;
      connection.status.traffic.incoming = Math.random() * connection.properties.bandwidth * 0.3;
      connection.status.traffic.outgoing = Math.random() * connection.properties.bandwidth * 0.3;
    });
  }

  private recoverLatencySpike(event: SimulationEvent, nodeMap: Map<string, TopologyNode>, connectionMap: Map<string, TopologyConnection>, result: SimulationResult): void {
    const multiplier = event.parameters.multiplier;
    const target = event.target;
    
    if (target === 'global') {
      // Reset all connections
      connectionMap.forEach(connection => {
        connection.properties.latency /= multiplier;
      });
    } else {
      // Reset specific region
      nodeMap.forEach(node => {
        if (node.location.region === target) {
          node.specifications.network.latency /= multiplier;
        }
      });
    }
  }

  private recoverDdosAttack(event: SimulationEvent, nodeMap: Map<string, TopologyNode>, connectionMap: Map<string, TopologyConnection>, result: SimulationResult): void {
    const node = nodeMap.get(event.target);
    if (node) {
      const intensity = event.parameters.intensity;
      const loadMultiplier = intensity === 'high' ? 5 : intensity === 'medium' ? 3 : 2;
      
      node.status.load.cpu = Math.max(0, node.status.load.cpu / loadMultiplier);
      node.status.load.memory = Math.max(0, node.status.load.memory / loadMultiplier);
      node.status.load.network = Math.max(0, node.status.load.network / loadMultiplier);
    }
  }

  private reestablishConnections(node: TopologyNode, nodeMap: Map<string, TopologyNode>): void {
    // Re-establish connections based on region and type
    nodeMap.forEach(otherNode => {
      if (otherNode.id !== node.id) {
        const sameRegion = otherNode.location.region === node.location.region;
        const shouldConnect = sameRegion ? Math.random() < 0.8 : Math.random() < 0.3;
        
        if (shouldConnect && !node.connections.includes(otherNode.id)) {
          node.connections.push(otherNode.id);
          if (!otherNode.connections.includes(node.id)) {
            otherNode.connections.push(node.id);
          }
        }
      }
    });
  }

  private collectMetrics(result: SimulationResult, nodeMap: Map<string, TopologyNode>, connectionMap: Map<string, TopologyConnection>, elapsedTime: number): void {
    const metrics: { [key: string]: number } = {};
    
    // Calculate TPS (simulated)
    const onlineNodes = Array.from(nodeMap.values()).filter(node => node.status.online);
    const totalTps = onlineNodes.reduce((sum, node) => {
      return sum + (node.type === 'miner' ? 100 + Math.random() * 50 : 50 + Math.random() * 25);
    }, 0);
    metrics.tps = totalTps;
    
    // Calculate average latency
    const activeConnections = Array.from(connectionMap.values()).filter(conn => conn.status.active);
    const avgLatency = activeConnections.reduce((sum, conn) => sum + conn.properties.latency, 0) / activeConnections.length;
    metrics.latency = avgLatency;
    
    // Calculate availability
    const availability = (onlineNodes.length / nodeMap.size) * 100;
    metrics.availability = availability;
    
    // Calculate consensus time (simulated)
    metrics.consensusTime = avgLatency * 2 + Math.random() * 10;
    
    // Calculate error rate
    const totalErrors = Array.from(connectionMap.values()).reduce((sum, conn) => sum + conn.status.errors, 0);
    metrics.errorRate = totalErrors / activeConnections.length;
    
    result.metrics.timeline.push({
      timestamp: new Date(result.startTime.getTime() + elapsedTime * 1000),
      data: metrics
    });
  }

  private calculateSimulationResults(result: SimulationResult, topology: NetworkTopology): void {
    const { metrics } = result;
    
    // Calculate summary metrics
    if (metrics.timeline.length > 0) {
      const tpsValues = metrics.timeline.map(t => t.data.tps);
      const latencyValues = metrics.timeline.map(t => t.data.latency);
      const availabilityValues = metrics.timeline.map(t => t.data.availability);
      const consensusTimeValues = metrics.timeline.map(t => t.data.consensusTime);
      
      metrics.summary.averageTps = tpsValues.reduce((a, b) => a + b, 0) / tpsValues.length;
      metrics.summary.peakTps = Math.max(...tpsValues);
      metrics.summary.averageLatency = latencyValues.reduce((a, b) => a + b, 0) / latencyValues.length;
      metrics.summary.availability = availabilityValues.reduce((a, b) => a + b, 0) / availabilityValues.length;
      metrics.summary.consensusTime = consensusTimeValues.reduce((a, b) => a + b, 0) / consensusTimeValues.length;
      
      // Calculate recovery time (time to return to normal after events)
      const recoveryTimes = this.calculateRecoveryTimes(result);
      metrics.summary.recoveryTime = recoveryTimes.length > 0 ? recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length : 0;
    }
    
    // Generate analysis
    this.generateSimulationAnalysis(result, topology);
  }

  private calculateRecoveryTimes(result: SimulationResult): number[] {
    const recoveryTimes: number[] = [];
    
    result.events.completed.forEach(event => {
      const eventIndex = result.events.triggered.findIndex(e => e.id === event.id);
      if (eventIndex !== -1) {
        const triggeredTime = result.events.triggered[eventIndex].timestamp;
        const completedTime = event.timestamp + (event.duration || 0);
        recoveryTimes.push(completedTime - triggeredTime);
      }
    });
    
    return recoveryTimes;
  }

  private generateSimulationAnalysis(result: SimulationResult, topology: NetworkTopology): void {
    const { metrics, analysis } = result;
    
    // Identify bottlenecks
    if (metrics.summary.averageLatency > 100) {
      analysis.bottlenecks.push('High network latency detected');
    }
    
    if (metrics.summary.availability < 99.0) {
      analysis.bottlenecks.push('Low availability during simulation');
    }
    
    if (metrics.summary.consensusTime > 10) {
      analysis.bottlenecks.push('Slow consensus times');
    }
    
    // Identify failure points
    result.events.failed.forEach(event => {
      analysis.failurePoints.push(`Failed event: ${event.type} on ${event.target}`);
    });
    
    if (result.events.completed.length < result.events.triggered.length) {
      analysis.failurePoints.push('Some events did not complete properly');
    }
    
    // Generate recommendations
    if (analysis.bottlenecks.length > 0) {
      analysis.recommendations.push('Consider increasing network bandwidth and reducing latency');
    }
    
    if (analysis.failurePoints.length > 0) {
      analysis.recommendations.push('Implement better failure detection and recovery mechanisms');
    }
    
    if (metrics.summary.recoveryTime > 60) {
      analysis.recommendations.push('Improve automatic recovery procedures');
    }
    
    // Calculate resilience score
    const availabilityScore = Math.min(100, metrics.summary.availability);
    const recoveryScore = Math.max(0, 100 - (metrics.summary.recoveryTime / 60) * 10);
    const failureScore = Math.max(0, 100 - (result.events.failed.length / result.events.triggered.length) * 100);
    
    analysis.resilienceScore = (availabilityScore + recoveryScore + failureScore) / 3;
  }

  getSimulationHistory(): SimulationResult[] {
    return Array.from(this.simulationHistory.values());
  }

  getActiveSimulations(): SimulationResult[] {
    return Array.from(this.activeSimulations.values());
  }

  getSimulation(simulationId: string): SimulationResult | undefined {
    return this.simulationHistory.get(simulationId) || this.activeSimulations.get(simulationId);
  }

  createCustomTopology(config: {
    name: string;
    description: string;
    nodes: Partial<TopologyNode>[];
    connections: Partial<TopologyConnection>[];
    configuration: NetworkTopology['configuration'];
  }): NetworkTopology {
    const topology: NetworkTopology = {
      id: `custom-${Date.now()}`,
      name: config.name,
      description: config.description,
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      nodes: config.nodes as TopologyNode[],
      connections: config.connections as TopologyConnection[],
      properties: {
        totalNodes: 0,
        totalConnections: 0,
        averageLatency: 0,
        totalBandwidth: 0,
        redundancy: 0,
        decentralization: 0
      },
      configuration: config.configuration
    };

    this.calculateTopologyProperties(topology);
    this.topologies.set(topology.id, topology);
    this.emit('topologyCreated', topology);

    return topology;
  }

  createCustomScenario(config: {
    name: string;
    description: string;
    duration: number;
    events: SimulationEvent[];
    metrics: SimulationScenario['metrics'];
  }): SimulationScenario {
    const scenario: SimulationScenario = {
      id: `custom-${Date.now()}`,
      name: config.name,
      description: config.description,
      duration: config.duration,
      events: config.events,
      metrics: config.metrics
    };

    this.scenarios.set(scenario.id, scenario);
    this.emit('scenarioCreated', scenario);

    return scenario;
  }
}