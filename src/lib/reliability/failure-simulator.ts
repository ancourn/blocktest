import { EventEmitter } from 'events';

export interface FailureScenario {
  id: string;
  name: string;
  description: string;
  type: 'BYZANTINE' | 'NETWORK_PARTITION' | 'NODE_DROP' | 'PARTIAL_OUTAGE' | 'LATENCY_SPIKE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  duration: number; // in seconds
  targetNodes: string[];
  isActive: boolean;
  startTime?: Date;
  endTime?: Date;
}

export interface NetworkPartition {
  partitionId: string;
  isolatedNodes: string[];
  remainingNodes: string[];
  latency: number; // ms between partitions
  packetLoss: number; // percentage
  isActive: boolean;
}

export interface ByzantineNode {
  nodeId: string;
  behavior: 'MALICIOUS_PROPOSAL' | 'DOUBLE_SIGN' | 'WITHHOLD_VOTES' | 'SEND_INVALID_MESSAGES' | 'CORRUPT_DATA';
  isActive: boolean;
  targetHeight?: number;
}

export interface FailureMetrics {
  totalScenarios: number;
  activeScenarios: number;
  failedNodes: number;
  partitionedNodes: number;
  byzantineNodes: number;
  systemAvailability: number;
  consensusHealth: number;
  recoveryTime: number; // average recovery time in seconds
}

export interface SimulationConfig {
  maxConcurrentScenarios: number;
  autoRecovery: boolean;
  recoveryDelay: number;
  monitoringInterval: number;
  chaosEnabled: boolean;
}

export class FailureSimulator extends EventEmitter {
  private scenarios: Map<string, FailureScenario> = new Map();
  private networkPartitions: Map<string, NetworkPartition> = new Map();
  private byzantineNodes: Map<string, ByzantineNode> = new Map();
  private config: SimulationConfig;
  private isRunning: boolean = false;
  private scenarioTimers: Map<string, NodeJS.Timeout> = new Map();
  private metrics: FailureMetrics;

  constructor(config: SimulationConfig) {
    super();
    this.config = config;
    this.metrics = {
      totalScenarios: 0,
      activeScenarios: 0,
      failedNodes: 0,
      partitionedNodes: 0,
      byzantineNodes: 0,
      systemAvailability: 100,
      consensusHealth: 100,
      recoveryTime: 0
    };
  }

  async initialize(): Promise<void> {
    this.isRunning = true;
    this.startMonitoring();
    console.log('Failure simulator initialized');
  }

  // Predefined failure scenarios
  getPredefinedScenarios(): FailureScenario[] {
    return [
      {
        id: 'byzantine-leader',
        name: 'Byzantine Leader Attack',
        description: 'Leader node starts sending malicious proposals',
        type: 'BYZANTINE',
        severity: 'HIGH',
        duration: 300,
        targetNodes: [],
        isActive: false
      },
      {
        id: 'network-split',
        name: 'Network Partition',
        description: 'Network splits into two isolated partitions',
        type: 'NETWORK_PARTITION',
        severity: 'CRITICAL',
        duration: 180,
        targetNodes: [],
        isActive: false
      },
      {
        id: 'node-cascade',
        name: 'Cascading Node Failures',
        description: 'Multiple nodes fail in sequence',
        type: 'NODE_DROP',
        severity: 'HIGH',
        duration: 240,
        targetNodes: [],
        isActive: false
      },
      {
        id: 'latency-spike',
        name: 'Network Latency Spike',
        description: 'Network latency increases dramatically',
        type: 'LATENCY_SPIKE',
        severity: 'MEDIUM',
        duration: 120,
        targetNodes: [],
        isActive: false
      },
      {
        id: 'partial-outage',
        name: 'Partial System Outage',
        description: 'Subset of nodes become unavailable',
        type: 'PARTIAL_OUTAGE',
        severity: 'MEDIUM',
        duration: 150,
        targetNodes: [],
        isActive: false
      }
    ];
  }

  async startScenario(scenarioId: string, targetNodes: string[] = []): Promise<boolean> {
    if (this.scenarios.size >= this.config.maxConcurrentScenarios) {
      console.warn('Maximum concurrent scenarios reached');
      return false;
    }

    const predefinedScenarios = this.getPredefinedScenarios();
    const scenarioTemplate = predefinedScenarios.find(s => s.id === scenarioId);
    
    if (!scenarioTemplate) {
      console.error(`Unknown scenario: ${scenarioId}`);
      return false;
    }

    const scenario: FailureScenario = {
      ...scenarioTemplate,
      targetNodes: targetNodes.length > 0 ? targetNodes : scenarioTemplate.targetNodes,
      isActive: true,
      startTime: new Date()
    };

    this.scenarios.set(scenarioId, scenario);
    this.metrics.totalScenarios++;
    this.metrics.activeScenarios++;

    console.log(`Starting failure scenario: ${scenario.name}`);

    // Execute scenario-specific logic
    switch (scenario.type) {
      case 'BYZANTINE':
        await this.executeByzantineScenario(scenario);
        break;
      case 'NETWORK_PARTITION':
        await this.executeNetworkPartitionScenario(scenario);
        break;
      case 'NODE_DROP':
        await this.executeNodeDropScenario(scenario);
        break;
      case 'LATENCY_SPIKE':
        await this.executeLatencySpikeScenario(scenario);
        break;
      case 'PARTIAL_OUTAGE':
        await this.executePartialOutageScenario(scenario);
        break;
    }

    // Set up scenario timeout
    const timeout = setTimeout(() => {
      this.stopScenario(scenarioId);
    }, scenario.duration * 1000);

    this.scenarioTimers.set(scenarioId, timeout);

    this.emit('scenarioStarted', { scenario });
    this.updateMetrics();
    
    return true;
  }

  async stopScenario(scenarioId: string): Promise<void> {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) return;

    console.log(`Stopping failure scenario: ${scenario.name}`);

    // Clean up scenario-specific resources
    switch (scenario.type) {
      case 'BYZANTINE':
        this.cleanupByzantineScenario(scenario);
        break;
      case 'NETWORK_PARTITION':
        this.cleanupNetworkPartitionScenario(scenario);
        break;
      case 'NODE_DROP':
        this.cleanupNodeDropScenario(scenario);
        break;
      case 'LATENCY_SPIKE':
        this.cleanupLatencySpikeScenario(scenario);
        break;
      case 'PARTIAL_OUTAGE':
        this.cleanupPartialOutageScenario(scenario);
        break;
    }

    // Clear timeout
    const timeout = this.scenarioTimers.get(scenarioId);
    if (timeout) {
      clearTimeout(timeout);
      this.scenarioTimers.delete(scenarioId);
    }

    // Update scenario
    scenario.isActive = false;
    scenario.endTime = new Date();
    this.scenarios.set(scenarioId, scenario);
    this.metrics.activeScenarios--;

    // Auto-recovery if enabled
    if (this.config.autoRecovery) {
      setTimeout(() => {
        this.performRecovery(scenarioId);
      }, this.config.recoveryDelay * 1000);
    }

    this.emit('scenarioStopped', { scenario });
    this.updateMetrics();
  }

  private async executeByzantineScenario(scenario: FailureScenario): Promise<void> {
    const targetNodes = scenario.targetNodes.length > 0 ? scenario.targetNodes : ['node-1', 'node-2'];
    
    for (const nodeId of targetNodes) {
      const behaviors: ByzantineNode['behavior'][] = [
        'MALICIOUS_PROPOSAL',
        'DOUBLE_SIGN',
        'WITHHOLD_VOTES',
        'SEND_INVALID_MESSAGES',
        'CORRUPT_DATA'
      ];
      
      const behavior = behaviors[Math.floor(Math.random() * behaviors.length)];
      
      const byzantineNode: ByzantineNode = {
        nodeId,
        behavior,
        isActive: true,
        targetHeight: Math.floor(Math.random() * 1000) + 5000
      };

      this.byzantineNodes.set(nodeId, byzantineNode);
      this.metrics.byzantineNodes++;

      console.log(`Node ${nodeId} exhibiting Byzantine behavior: ${behavior}`);
    }

    this.emit('byzantineNodesActivated', { nodes: Array.from(this.byzantineNodes.values()) });
  }

  private async executeNetworkPartitionScenario(scenario: FailureScenario): Promise<void> {
    // Create two partitions
    const allNodes = ['node-1', 'node-2', 'node-3', 'node-4', 'node-5', 'node-6', 'node-7'];
    const partitionSize = Math.ceil(allNodes.length / 2);
    
    const partition1 = allNodes.slice(0, partitionSize);
    const partition2 = allNodes.slice(partitionSize);

    const networkPartition: NetworkPartition = {
      partitionId: `partition_${Date.now()}`,
      isolatedNodes: partition1,
      remainingNodes: partition2,
      latency: 1000 + Math.random() * 2000, // 1-3 seconds latency
      packetLoss: Math.random() * 50, // 0-50% packet loss
      isActive: true
    };

    this.networkPartitions.set(networkPartition.partitionId, networkPartition);
    this.metrics.partitionedNodes = partition1.length + partition2.length;

    console.log(`Network partition created: ${partition1.join(', ')} isolated from ${partition2.join(', ')}`);
    this.emit('networkPartitionCreated', { partition: networkPartition });
  }

  private async executeNodeDropScenario(scenario: FailureScenario): Promise<void> {
    const targetNodes = scenario.targetNodes.length > 0 ? scenario.targetNodes : ['node-3', 'node-4'];
    
    // Simulate cascading failures
    for (let i = 0; i < targetNodes.length; i++) {
      setTimeout(() => {
        const nodeId = targetNodes[i];
        this.metrics.failedNodes++;
        
        console.log(`Node ${nodeId} dropped from network`);
        this.emit('nodeDropped', { nodeId, cascade: i > 0 });
      }, i * 5000); // 5 second intervals
    }
  }

  private async executeLatencySpikeScenario(scenario: FailureScenario): Promise<void> {
    const targetNodes = scenario.targetNodes.length > 0 ? scenario.targetNodes : ['node-1', 'node-2', 'node-3'];
    
    console.log(`Latency spike affecting nodes: ${targetNodes.join(', ')}`);
    this.emit('latencySpikeStarted', { nodes: targetNodes, duration: scenario.duration });
  }

  private async executePartialOutageScenario(scenario: FailureScenario): Promise<void> {
    const targetNodes = scenario.targetNodes.length > 0 ? scenario.targetNodes : ['node-2', 'node-5'];
    
    for (const nodeId of targetNodes) {
      this.metrics.failedNodes++;
      console.log(`Node ${nodeId} experiencing partial outage`);
    }

    this.emit('partialOutageStarted', { nodes: targetNodes });
  }

  private cleanupByzantineScenario(scenario: FailureScenario): void {
    for (const [nodeId, byzantineNode] of this.byzantineNodes) {
      if (scenario.targetNodes.includes(nodeId) || scenario.targetNodes.length === 0) {
        this.byzantineNodes.delete(nodeId);
      }
    }
    this.metrics.byzantineNodes = this.byzantineNodes.size;
    this.emit('byzantineNodesDeactivated', { remainingNodes: Array.from(this.byzantineNodes.values()) });
  }

  private cleanupNetworkPartitionScenario(scenario: FailureScenario): void {
    for (const [partitionId, partition] of this.networkPartitions) {
      if (partition.isActive) {
        partition.isActive = false;
        this.networkPartitions.set(partitionId, partition);
      }
    }
    this.metrics.partitionedNodes = 0;
    this.emit('networkPartitionResolved', { partitions: Array.from(this.networkPartitions.values()) });
  }

  private cleanupNodeDropScenario(scenario: FailureScenario): void {
    this.metrics.failedNodes = Math.max(0, this.metrics.failedNodes - scenario.targetNodes.length);
    this.emit('nodesRecovered', { nodes: scenario.targetNodes });
  }

  private cleanupLatencySpikeScenario(scenario: FailureScenario): void {
    this.emit('latencySpikeEnded', { nodes: scenario.targetNodes });
  }

  private cleanupPartialOutageScenario(scenario: FailureScenario): void {
    this.metrics.failedNodes = Math.max(0, this.metrics.failedNodes - scenario.targetNodes.length);
    this.emit('partialOutageResolved', { nodes: scenario.targetNodes });
  }

  private performRecovery(scenarioId: string): void {
    console.log(`Performing recovery for scenario: ${scenarioId}`);
    
    // Simulate recovery process
    const recoveryTime = Math.random() * 30 + 10; // 10-40 seconds
    
    setTimeout(() => {
      this.metrics.recoveryTime = (this.metrics.recoveryTime + recoveryTime) / 2; // Average recovery time
      this.emit('recoveryCompleted', { scenarioId, recoveryTime });
      console.log(`Recovery completed for scenario: ${scenarioId}`);
    }, recoveryTime * 1000);
  }

  private startMonitoring(): void {
    setInterval(() => {
      this.updateMetrics();
      this.emit('metricsUpdate', this.metrics);
    }, this.config.monitoringInterval * 1000);
  }

  private updateMetrics(): void {
    // Calculate system availability based on active failures
    const totalNodes = 7; // Assume 7 nodes in the system
    const availableNodes = totalNodes - this.metrics.failedNodes - this.metrics.partitionedNodes;
    this.metrics.systemAvailability = (availableNodes / totalNodes) * 100;

    // Calculate consensus health based on Byzantine nodes
    const byzantineThreshold = Math.floor(totalNodes / 3); // 1/3 tolerance
    const consensusImpact = Math.min(100, (this.metrics.byzantineNodes / byzantineThreshold) * 100);
    this.metrics.consensusHealth = Math.max(0, 100 - consensusImpact);

    // If chaos mode is enabled, randomly start scenarios
    if (this.config.chaosEnabled && this.scenarios.size < this.config.maxConcurrentScenarios) {
      if (Math.random() < 0.1) { // 10% chance per interval
        const scenarios = this.getPredefinedScenarios();
        const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
        this.startScenario(randomScenario.id);
      }
    }
  }

  getActiveScenarios(): FailureScenario[] {
    return Array.from(this.scenarios.values()).filter(s => s.isActive);
  }

  getMetrics(): FailureMetrics {
    return { ...this.metrics };
  }

  getAllScenarios(): FailureScenario[] {
    return Array.from(this.scenarios.values());
  }

  getNetworkPartitions(): NetworkPartition[] {
    return Array.from(this.networkPartitions.values());
  }

  getByzantineNodes(): ByzantineNode[] {
    return Array.from(this.byzantineNodes.values());
  }

  async shutdown(): Promise<void> {
    this.isRunning = false;
    
    // Stop all active scenarios
    for (const scenarioId of this.scenarios.keys()) {
      await this.stopScenario(scenarioId);
    }

    // Clear all timers
    for (const timeout of this.scenarioTimers.values()) {
      clearTimeout(timeout);
    }
    this.scenarioTimers.clear();

    console.log('Failure simulator shutdown complete');
  }
}