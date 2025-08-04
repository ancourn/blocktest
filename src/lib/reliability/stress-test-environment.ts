import { EventEmitter } from 'events';
import { FailoverManager } from './failover-manager';
import { ConsensusCatchup } from './consensus-catchup';
import { FailureSimulator } from './failure-simulator';
import { AvailabilityMonitor } from './availability-monitor';

export interface StressTestConfig {
  duration: number; // minutes
  intensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  targetTPS: number;
  nodeCount: number;
  failureRate: number; // failures per minute
  autoScale: boolean;
  metricsInterval: number; // seconds
}

export interface StressTestMetrics {
  testId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // seconds
  targetTPS: number;
  actualTPS: number;
  tpsEfficiency: number; // percentage
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageLatency: number; // ms
  p95Latency: number; // ms
  p99Latency: number; // ms
  availability: number;
  nodeFailures: number;
  recoveryTime: number; // average in seconds
  consensusHealth: number;
  testStatus: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'STOPPED';
}

export interface LoadGenerator {
  id: string;
  tps: number;
  isActive: boolean;
  transactionType: 'PAYMENT' | 'SMART_CONTRACT' | 'CROSS_SHARD' | 'GOVERNANCE';
  successRate: number;
  averageLatency: number;
}

export interface SimulationEnvironment {
  id: string;
  name: string;
  nodes: string[];
  loadGenerators: LoadGenerator[];
  activeScenarios: string[];
  isRunning: boolean;
  startTime?: Date;
  endTime?: Date;
}

export class StressTestEnvironment extends EventEmitter {
  private config: StressTestConfig;
  private failoverManager: FailoverManager;
  private consensusCatchup: ConsensusCatchup;
  private failureSimulator: FailureSimulator;
  private availabilityMonitor: AvailabilityMonitor;
  private environment: SimulationEnvironment;
  private metrics: StressTestMetrics;
  private isRunning: boolean = false;
  private metricsInterval?: NodeJS.Timeout;
  private loadGenerators: Map<string, LoadGenerator> = new Map();
  private transactionCounters: {
    total: number;
    successful: number;
    failed: number;
    latencies: number[];
  };

  constructor(config: StressTestConfig) {
    super();
    this.config = config;
    this.transactionCounters = {
      total: 0,
      successful: 0,
      failed: 0,
      latencies: []
    };

    // Initialize environment
    this.environment = {
      id: `stress_test_${Date.now()}`,
      name: `Stress Test ${config.intensity} Intensity`,
      nodes: [],
      loadGenerators: [],
      activeScenarios: [],
      isRunning: false
    };

    // Initialize metrics
    this.metrics = {
      testId: this.environment.id,
      startTime: new Date(),
      duration: 0,
      targetTPS: config.targetTPS,
      actualTPS: 0,
      tpsEfficiency: 0,
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      averageLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
      availability: 100,
      nodeFailures: 0,
      recoveryTime: 0,
      consensusHealth: 100,
      testStatus: 'RUNNING'
    };

    // Initialize subsystems
    this.failoverManager = new FailoverManager({
      heartbeatInterval: 5000,
      responseTimeout: 10000,
      maxRetries: 3,
      failoverThreshold: 2,
      consensusCatchupTimeout: 30000
    });

    this.consensusCatchup = new ConsensusCatchup({
      maxBatchSize: 100,
      syncTimeout: 30000,
      retryAttempts: 3,
      parallelSyncs: 5,
      validationDepth: 50
    });

    this.failureSimulator = new FailureSimulator({
      maxConcurrentScenarios: 3,
      autoRecovery: true,
      recoveryDelay: 30,
      monitoringInterval: 10,
      chaosEnabled: config.intensity === 'EXTREME'
    });

    this.availabilityMonitor = new AvailabilityMonitor({
      slaTarget: 99.99,
      checkInterval: 5,
      incidentTimeout: 300,
      alertCooldown: 60,
      retentionPeriod: 7,
      enableNotifications: true
    });
  }

  async initialize(): Promise<void> {
    console.log(`Initializing stress test environment: ${this.environment.name}`);

    // Initialize all subsystems
    await this.failoverManager.initialize();
    await this.consensusCatchup.initialize();
    await this.failureSimulator.initialize();
    await this.availabilityMonitor.initialize();

    // Setup event listeners
    this.setupEventListeners();

    // Create test nodes
    await this.createTestNodes();

    // Setup load generators
    await this.setupLoadGenerators();

    console.log('Stress test environment initialized successfully');
  }

  private async createTestNodes(): Promise<void> {
    const nodePrefix = 'stress-node-';
    
    for (let i = 1; i <= this.config.nodeCount; i++) {
      const nodeId = `${nodePrefix}${i}`;
      this.environment.nodes.push(nodeId);
      
      // Register with all subsystems
      this.failoverManager.registerNode(nodeId);
      this.availabilityMonitor.registerNode(nodeId);
    }

    console.log(`Created ${this.config.nodeCount} test nodes`);
  }

  private async setupLoadGenerators(): Promise<void> {
    const generatorTypes: LoadGenerator['transactionType'][] = [
      'PAYMENT', 'SMART_CONTRACT', 'CROSS_SHARD', 'GOVERNANCE'
    ];

    const intensityMultiplier = {
      'LOW': 0.25,
      'MEDIUM': 0.5,
      'HIGH': 0.75,
      'EXTREME': 1.0
    };

    const multiplier = intensityMultiplier[this.config.intensity];
    const baseTPS = this.config.targetTPS / generatorTypes.length;

    for (let i = 0; i < generatorTypes.length; i++) {
      const generatorId = `load-gen-${i + 1}`;
      const tps = Math.floor(baseTPS * multiplier);

      const generator: LoadGenerator = {
        id: generatorId,
        tps,
        isActive: false,
        transactionType: generatorTypes[i],
        successRate: 100,
        averageLatency: 0
      };

      this.loadGenerators.set(generatorId, generator);
      this.environment.loadGenerators.push(generator);
    }

    console.log(`Setup ${generatorTypes.length} load generators`);
  }

  private setupEventListeners(): void {
    // Listen for failover events
    this.failoverManager.on('nodeFailed', (data) => {
      this.metrics.nodeFailures++;
      this.emit('nodeFailure', data);
    });

    this.failoverManager.on('nodeRecovered', (data) => {
      this.emit('nodeRecovery', data);
    });

    // Listen for failure simulation events
    this.failureSimulator.on('scenarioStarted', (data) => {
      this.environment.activeScenarios.push(data.scenario.id);
      this.emit('scenarioStarted', data);
    });

    this.failureSimulator.on('scenarioStopped', (data) => {
      this.environment.activeScenarios = this.environment.activeScenarios.filter(
        id => id !== data.scenario.id
      );
      this.emit('scenarioStopped', data);
    });

    // Listen for availability events
    this.availabilityMonitor.on('incidentStarted', (data) => {
      this.emit('incidentStarted', data);
    });

    this.availabilityMonitor.on('alertTriggered', (data) => {
      this.emit('alertTriggered', data);
    });

    // Listen for consensus events
    this.consensusCatchup.on('catchupProgress', (data) => {
      this.emit('consensusProgress', data);
    });
  }

  async startTest(): Promise<void> {
    if (this.isRunning) {
      console.warn('Stress test is already running');
      return;
    }

    console.log(`Starting stress test: ${this.environment.name}`);
    this.isRunning = true;
    this.environment.isRunning = true;
    this.environment.startTime = new Date();
    this.metrics.startTime = new Date();
    this.metrics.testStatus = 'RUNNING';

    // Start load generators
    for (const generator of this.loadGenerators.values()) {
      generator.isActive = true;
      this.startLoadGenerator(generator);
    }

    // Start failure simulation based on intensity
    if (this.config.failureRate > 0) {
      this.startFailureSimulation();
    }

    // Start metrics collection
    this.startMetricsCollection();

    // Set test duration timeout
    setTimeout(() => {
      this.stopTest();
    }, this.config.duration * 60 * 1000);

    this.emit('testStarted', { environment: this.environment, config: this.config });
  }

  private startLoadGenerator(generator: LoadGenerator): void {
    const interval = setInterval(() => {
      if (!generator.isActive || !this.isRunning) {
        clearInterval(interval);
        return;
      }

      // Generate transactions
      const transactionsToGenerate = Math.ceil(generator.tps / 10); // Generate 1/10th per 100ms
      for (let i = 0; i < transactionsToGenerate; i++) {
        this.generateTransaction(generator);
      }
    }, 100);

    // Store interval ID for cleanup
    (generator as any).intervalId = interval;
  }

  private generateTransaction(generator: LoadGenerator): void {
    const startTime = Date.now();
    
    // Simulate transaction processing
    const isSuccess = Math.random() < (generator.successRate / 100);
    const latency = Math.random() * 500 + 50; // 50-550ms latency

    this.transactionCounters.total++;
    this.transactionCounters.latencies.push(latency);

    if (isSuccess) {
      this.transactionCounters.successful++;
    } else {
      this.transactionCounters.failed++;
    }

    // Update generator metrics
    generator.averageLatency = (generator.averageLatency * 0.9) + (latency * 0.1);
    generator.successRate = (this.transactionCounters.successful / this.transactionCounters.total) * 100;

    // Keep only recent latencies for percentile calculation
    if (this.transactionCounters.latencies.length > 1000) {
      this.transactionCounters.latencies = this.transactionCounters.latencies.slice(-1000);
    }

    // Emit transaction event
    this.emit('transactionGenerated', {
      generatorId: generator.id,
      type: generator.transactionType,
      success: isSuccess,
      latency,
      timestamp: new Date()
    });
  }

  private startFailureSimulation(): void {
    const scenarios = this.failureSimulator.getPredefinedScenarios();
    
    const failureInterval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(failureInterval);
        return;
      }

      // Randomly select and start a scenario
      if (Math.random() < (this.config.failureRate / 60)) { // Convert to per-second probability
        const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
        const targetNodes = this.getRandomNodes(Math.floor(Math.random() * 3) + 1);
        
        this.failureSimulator.startScenario(randomScenario.id, targetNodes);
      }
    }, 1000);

    // Store interval ID for cleanup
    (this as any).failureIntervalId = failureInterval;
  }

  private getRandomNodes(count: number): string[] {
    const shuffled = [...this.environment.nodes].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
    }, this.config.metricsInterval * 1000);
  }

  private updateMetrics(): void {
    const now = new Date();
    this.metrics.duration = (now.getTime() - this.metrics.startTime.getTime()) / 1000;

    // Calculate TPS
    const timeWindow = Math.min(this.metrics.duration, 60); // Use last 60 seconds
    this.metrics.actualTPS = this.transactionCounters.total / Math.max(timeWindow, 1);
    this.metrics.tpsEfficiency = (this.metrics.actualTPS / this.metrics.targetTPS) * 100;

    // Update transaction counts
    this.metrics.totalTransactions = this.transactionCounters.total;
    this.metrics.successfulTransactions = this.transactionCounters.successful;
    this.metrics.failedTransactions = this.transactionCounters.failed;

    // Calculate latency percentiles
    if (this.transactionCounters.latencies.length > 0) {
      const sortedLatencies = [...this.transactionCounters.latencies].sort((a, b) => a - b);
      this.metrics.averageLatency = sortedLatencies.reduce((sum, lat) => sum + lat, 0) / sortedLatencies.length;
      this.metrics.p95Latency = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)];
      this.metrics.p99Latency = sortedLatencies[Math.floor(sortedLatencies.length * 0.99)];
    }

    // Get availability and consensus metrics
    const availabilityMetrics = this.availabilityMonitor.getAvailabilityMetrics();
    const systemMetrics = this.availabilityMonitor.getSystemMetrics();
    
    this.metrics.availability = availabilityMetrics.uptime;
    this.metrics.consensusHealth = systemMetrics.consensusHealth;

    // Calculate recovery time
    const failureMetrics = this.failureSimulator.getMetrics();
    this.metrics.recoveryTime = failureMetrics.recoveryTime;

    this.emit('metricsUpdated', this.metrics);
  }

  async stopTest(): Promise<void> {
    if (!this.isRunning) return;

    console.log('Stopping stress test');
    this.isRunning = false;
    this.environment.isRunning = false;
    this.environment.endTime = new Date();
    this.metrics.endTime = new Date();
    this.metrics.testStatus = 'COMPLETED';

    // Stop load generators
    for (const generator of this.loadGenerators.values()) {
      generator.isActive = false;
      if ((generator as any).intervalId) {
        clearInterval((generator as any).intervalId);
      }
    }

    // Stop failure simulation
    if ((this as any).failureIntervalId) {
      clearInterval((this as any).failureIntervalId);
    }

    // Stop all active scenarios
    for (const scenarioId of this.environment.activeScenarios) {
      await this.failureSimulator.stopScenario(scenarioId);
    }

    // Stop metrics collection
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    // Final metrics update
    this.updateMetrics();

    this.emit('testCompleted', { environment: this.environment, metrics: this.metrics });
    console.log('Stress test completed');
  }

  getEnvironment(): SimulationEnvironment {
    return { ...this.environment };
  }

  getMetrics(): StressTestMetrics {
    return { ...this.metrics };
  }

  getLoadGenerators(): LoadGenerator[] {
    return Array.from(this.loadGenerators.values());
  }

  getSubsystemStatus(): {
    failoverManager: any;
    consensusCatchup: any;
    failureSimulator: any;
    availabilityMonitor: any;
  } {
    return {
      failoverManager: this.failoverManager.getClusterStatus(),
      consensusCatchup: this.consensusCatchup.getSyncState(),
      failureSimulator: this.failureSimulator.getMetrics(),
      availabilityMonitor: {
        availability: this.availabilityMonitor.getAvailabilityMetrics(),
        system: this.availabilityMonitor.getSystemMetrics()
      }
    };
  }

  async shutdown(): Promise<void> {
    if (this.isRunning) {
      await this.stopTest();
    }

    await this.failoverManager.shutdown();
    await this.consensusCatchup.shutdown();
    await this.failureSimulator.shutdown();
    await this.availabilityMonitor.shutdown();

    console.log('Stress test environment shutdown complete');
  }
}