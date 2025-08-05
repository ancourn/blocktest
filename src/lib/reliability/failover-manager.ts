import { EventEmitter } from 'events';

export interface NodeStatus {
  id: string;
  isHealthy: boolean;
  lastHeartbeat: Date;
  responseTime: number;
  consensusProgress: number;
  isActive: boolean;
}

export interface FailoverConfig {
  heartbeatInterval: number;
  responseTimeout: number;
  maxRetries: number;
  failoverThreshold: number;
  consensusCatchupTimeout: number;
}

export interface ConsensusState {
  currentHeight: number;
  targetHeight: number;
  syncProgress: number;
  lastBlockHash: string;
  validators: string[];
  quorumSize: number;
}

export class FailoverManager extends EventEmitter {
  private nodes: Map<string, NodeStatus> = new Map();
  private activeNodes: Set<string> = new Set();
  private config: FailoverConfig;
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();
  private consensusState: ConsensusState;
  private isRunning: boolean = false;

  constructor(config: FailoverConfig) {
    super();
    this.config = config;
    this.consensusState = {
      currentHeight: 0,
      targetHeight: 0,
      syncProgress: 0,
      lastBlockHash: '',
      validators: [],
      quorumSize: 0
    };
  }

  async initialize(): Promise<void> {
    this.isRunning = true;
    this.startHealthMonitoring();
    this.startConsensusMonitoring();
    console.log('Failover manager initialized');
  }

  registerNode(nodeId: string): void {
    const nodeStatus: NodeStatus = {
      id: nodeId,
      isHealthy: true,
      lastHeartbeat: new Date(),
      responseTime: 0,
      consensusProgress: 100,
      isActive: true
    };

    this.nodes.set(nodeId, nodeStatus);
    this.activeNodes.add(nodeId);
    this.startNodeHeartbeat(nodeId);
    
    this.emit('nodeRegistered', { nodeId, status: nodeStatus });
    console.log(`Node ${nodeId} registered with failover system`);
  }

  unregisterNode(nodeId: string): void {
    this.nodes.delete(nodeId);
    this.activeNodes.delete(nodeId);
    this.stopNodeHeartbeat(nodeId);
    
    this.emit('nodeUnregistered', { nodeId });
    console.log(`Node ${nodeId} unregistered from failover system`);
  }

  private startNodeHeartbeat(nodeId: string): void {
    const interval = setInterval(async () => {
      await this.checkNodeHealth(nodeId);
    }, this.config.heartbeatInterval);

    this.heartbeatIntervals.set(nodeId, interval);
  }

  private stopNodeHeartbeat(nodeId: string): void {
    const interval = this.heartbeatIntervals.get(nodeId);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(nodeId);
    }
  }

  private async checkNodeHealth(nodeId: string): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    try {
      const startTime = Date.now();
      const isHealthy = await this.performHealthCheck(nodeId);
      const responseTime = Date.now() - startTime;

      const updatedNode: NodeStatus = {
        ...node,
        isHealthy,
        lastHeartbeat: new Date(),
        responseTime,
        consensusProgress: await this.getConsensusProgress(nodeId)
      };

      this.nodes.set(nodeId, updatedNode);

      if (!isHealthy && node.isActive) {
        await this.handleNodeFailure(nodeId);
      } else if (isHealthy && !node.isActive) {
        await this.handleNodeRecovery(nodeId);
      }

    } catch (error) {
      console.error(`Health check failed for node ${nodeId}:`, error);
      await this.handleNodeFailure(nodeId);
    }
  }

  private async performHealthCheck(nodeId: string): Promise<boolean> {
    // Simulate health check - in real implementation, this would make HTTP/gRPC calls
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    // Simulate occasional failures for testing
    if (Math.random() < 0.01) { // 1% chance of simulated failure
      return false;
    }

    return true;
  }

  private async getConsensusProgress(nodeId: string): Promise<number> {
    // Simulate consensus progress check
    const node = this.nodes.get(nodeId);
    if (!node) return 0;

    // Simulate nodes that might be behind in consensus
    const baseProgress = node.isActive ? 100 : 0;
    const variation = Math.random() * 10 - 5; // ±5% variation
    return Math.max(0, Math.min(100, baseProgress + variation));
  }

  private async handleNodeFailure(nodeId: string): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    console.warn(`Node ${nodeId} failure detected, initiating failover...`);

    // Mark node as inactive
    node.isActive = false;
    node.isHealthy = false;
    this.nodes.set(nodeId, node);
    this.activeNodes.delete(nodeId);

    // Emit failure event
    this.emit('nodeFailed', { nodeId, status: node });

    // Initiate consensus catch-up
    await this.initiateConsensusCatchup(nodeId);

    // Check if we need to promote standby nodes
    await this.checkAndPromoteStandbyNodes();
  }

  private async handleNodeRecovery(nodeId: string): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    console.log(`Node ${nodeId} recovered, reintegrating into cluster...`);

    // Mark node as active
    node.isActive = true;
    node.isHealthy = true;
    this.nodes.set(nodeId, node);
    this.activeNodes.add(nodeId);

    // Emit recovery event
    this.emit('nodeRecovered', { nodeId, status: node });

    // Initiate consensus sync for recovered node
    await this.initiateConsensusSync(nodeId);
  }

  private async initiateConsensusCatchup(nodeId: string): Promise<void> {
    console.log(`Initiating consensus catch-up for node ${nodeId}`);

    const startTime = Date.now();
    let progress = 0;

    const catchupInterval = setInterval(() => {
      progress += Math.random() * 20; // Simulate progress
      progress = Math.min(100, progress);

      this.emit('consensusCatchupProgress', { nodeId, progress });

      if (progress >= 100 || Date.now() - startTime > this.config.consensusCatchupTimeout) {
        clearInterval(catchupInterval);
        
        if (progress >= 100) {
          console.log(`Consensus catch-up completed for node ${nodeId}`);
          this.emit('consensusCatchupCompleted', { nodeId, success: true });
        } else {
          console.error(`Consensus catch-up timed out for node ${nodeId}`);
          this.emit('consensusCatchupCompleted', { nodeId, success: false });
        }
      }
    }, 1000);
  }

  private async initiateConsensusSync(nodeId: string): Promise<void> {
    console.log(`Initiating consensus sync for recovered node ${nodeId}`);

    const startTime = Date.now();
    let progress = 0;

    const syncInterval = setInterval(() => {
      progress += Math.random() * 30; // Simulate faster sync for recovered nodes
      progress = Math.min(100, progress);

      this.emit('consensusSyncProgress', { nodeId, progress });

      if (progress >= 100 || Date.now() - startTime > this.config.consensusCatchupTimeout / 2) {
        clearInterval(syncInterval);
        
        if (progress >= 100) {
          console.log(`Consensus sync completed for node ${nodeId}`);
          this.emit('consensusSyncCompleted', { nodeId, success: true });
        } else {
          console.error(`Consensus sync timed out for node ${nodeId}`);
          this.emit('consensusSyncCompleted', { nodeId, success: false });
        }
      }
    }, 800);
  }

  private async checkAndPromoteStandbyNodes(): Promise<void> {
    const activeCount = this.activeNodes.size;
    const minimumNodes = Math.max(3, Math.floor(this.nodes.size * 0.6));

    if (activeCount < minimumNodes) {
      console.log(`Active nodes (${activeCount}) below minimum (${minimumNodes}), promoting standby nodes`);

      // Find inactive but healthy nodes to promote
      const standbyNodes = Array.from(this.nodes.values()).filter(
        node => !node.isActive && node.isHealthy
      );

      for (const node of standbyNodes.slice(0, minimumNodes - activeCount)) {
        await this.promoteNode(node.id);
      }
    }
  }

  private async promoteNode(nodeId: string): Promise<void> {
    console.log(`Promoting node ${nodeId} to active status`);

    const node = this.nodes.get(nodeId);
    if (!node) return;

    node.isActive = true;
    this.nodes.set(nodeId, node);
    this.activeNodes.add(nodeId);

    // Initiate consensus sync for promoted node
    await this.initiateConsensusSync(nodeId);

    this.emit('nodePromoted', { nodeId, status: node });
  }

  private startHealthMonitoring(): void {
    setInterval(() => {
      this.checkClusterHealth();
    }, this.config.heartbeatInterval * 2);
  }

  private startConsensusMonitoring(): void {
    setInterval(() => {
      this.updateConsensusState();
    }, 5000);
  }

  private checkClusterHealth(): void {
    const totalNodes = this.nodes.size;
    const activeNodes = this.activeNodes.size;
    const healthyNodes = Array.from(this.nodes.values()).filter(n => n.isHealthy).length;

    const availability = totalNodes > 0 ? (activeNodes / totalNodes) * 100 : 0;
    const healthScore = totalNodes > 0 ? (healthyNodes / totalNodes) * 100 : 0;

    this.emit('clusterHealthUpdate', {
      totalNodes,
      activeNodes,
      healthyNodes,
      availability,
      healthScore
    });

    if (availability < 99.99) {
      console.warn(`Cluster availability below target: ${availability.toFixed(4)}%`);
    }
  }

  private updateConsensusState(): void {
    const activeNodes = Array.from(this.nodes.values()).filter(n => n.isActive);
    const avgProgress = activeNodes.length > 0 
      ? activeNodes.reduce((sum, node) => sum + node.consensusProgress, 0) / activeNodes.length 
      : 0;

    this.consensusState = {
      ...this.consensusState,
      currentHeight: Math.floor(Math.random() * 1000) + 5000, // Simulated block height
      targetHeight: Math.floor(Math.random() * 1000) + 5000,
      syncProgress: avgProgress,
      validators: activeNodes.map(n => n.id),
      quorumSize: Math.ceil(activeNodes.length * 0.67) // 2/3 majority
    };

    this.emit('consensusStateUpdate', this.consensusState);
  }

  getClusterStatus(): {
    totalNodes: number;
    activeNodes: number;
    healthyNodes: number;
    availability: number;
    nodes: NodeStatus[];
    consensusState: ConsensusState;
  } {
    const totalNodes = this.nodes.size;
    const activeNodes = this.activeNodes.size;
    const healthyNodes = Array.from(this.nodes.values()).filter(n => n.isHealthy).length;
    const availability = totalNodes > 0 ? (activeNodes / totalNodes) * 100 : 0;

    return {
      totalNodes,
      activeNodes,
      healthyNodes,
      availability,
      nodes: Array.from(this.nodes.values()),
      consensusState: this.consensusState
    };
  }

  async shutdown(): Promise<void> {
    this.isRunning = false;
    
    // Clear all heartbeat intervals
    for (const interval of this.heartbeatIntervals.values()) {
      clearInterval(interval);
    }
    this.heartbeatIntervals.clear();

    console.log('Failover manager shutdown complete');
  }
}