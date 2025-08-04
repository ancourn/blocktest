import { EventEmitter } from 'events';

export interface FailureScenario {
  id: string;
  name: string;
  description: string;
  category: 'node' | 'network' | 'hardware' | 'software' | 'external';
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0-1
  duration: {
    min: number; // seconds
    max: number; // seconds
    distribution: 'uniform' | 'normal' | 'exponential';
  };
  impact: {
    availability: number; // 0-1 (1 = no impact)
    performance: number; // 0-1 (1 = no impact)
    reliability: number; // 0-1 (1 = no impact)
  };
  recovery: {
    automatic: boolean;
    timeToRecover: {
      min: number; // seconds
      max: number; // seconds
    };
    successRate: number; // 0-1
  };
  parameters: {
    [key: string]: any;
  };
}

export interface FailureEvent {
  id: string;
  scenarioId: string;
  timestamp: Date;
  target: string; // node ID, connection ID, or region
  status: 'triggered' | 'active' | 'recovering' | 'recovered' | 'failed';
  actualDuration?: number;
  impact: {
    affectedNodes: string[];
    affectedConnections: string[];
    performanceDegradation: number;
    availabilityLoss: number;
  };
  recovery: {
    startTime?: Date;
    endTime?: Date;
    method: 'automatic' | 'manual' | 'hybrid';
    success: boolean;
    timeTaken?: number;
  };
  metrics: {
    before: { [key: string]: number };
    during: { [key: string]: number };
    after: { [key: string]: number };
  };
}

export interface RecoveryStrategy {
  id: string;
  name: string;
  description: string;
  applicableTo: string[]; // scenario types
  steps: RecoveryStep[];
  effectiveness: number; // 0-1
  resourceRequirements: {
    cpu: number;
    memory: number;
    network: number;
    storage: number;
  };
  conditions: {
    maxConcurrentFailures: number;
    minAvailableResources: number;
  };
}

export interface RecoveryStep {
  id: string;
  name: string;
  description: string;
  type: 'detect' | 'isolate' | 'mitigate' | 'recover' | 'verify';
  duration: number; // seconds
  successRate: number; // 0-1
  dependencies: string[]; // other step IDs
  rollbackable: boolean;
  parameters: { [key: string]: any };
}

export interface ResilienceTest {
  id: string;
  name: string;
  description: string;
  scenarios: string[]; // scenario IDs
  configuration: {
    duration: number; // seconds
    intensity: 'low' | 'medium' | 'high' | 'extreme';
    parallelFailures: boolean;
    maxConcurrentFailures: number;
  };
  objectives: {
    availabilityTarget: number; // percentage
    recoveryTimeTarget: number; // seconds
    dataLossTarget: number; // percentage
  };
  successCriteria: {
    minAvailability: number;
    maxRecoveryTime: number;
    maxDataLoss: number;
  };
}

export interface ResilienceTestResult {
  id: string;
  testId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  events: FailureEvent[];
  metrics: {
    availability: {
      target: number;
      actual: number;
      achieved: boolean;
    };
    recoveryTime: {
      target: number;
      actual: number;
      achieved: boolean;
    };
    dataLoss: {
      target: number;
      actual: number;
      achieved: boolean;
    };
  };
  summary: {
    totalEvents: number;
    successfulRecoveries: number;
    failedRecoveries: number;
    averageRecoveryTime: number;
    resilienceScore: number; // 0-100
  };
  insights: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
}

export class FailureSimulator extends EventEmitter {
  private failureScenarios: Map<string, FailureScenario> = new Map();
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
  private activeEvents: Map<string, FailureEvent> = new Map();
  private eventHistory: FailureEvent[] = [];
  private resilienceTests: Map<string, ResilienceTest> = new Map();
  private testResults: Map<string, ResilienceTestResult> = new Map();

  constructor() {
    super();
    this.initializeFailureScenarios();
    this.initializeRecoveryStrategies();
    this.initializeResilienceTests();
  }

  private initializeFailureScenarios(): void {
    const scenarios: FailureScenario[] = [
      {
        id: 'node-crash',
        name: 'Node Crash',
        description: 'Sudden node failure due to hardware or software crash',
        category: 'node',
        severity: 'high',
        probability: 0.05,
        duration: { min: 30, max: 300, distribution: 'exponential' },
        impact: {
          availability: 0.1,
          performance: 0.2,
          reliability: 0.3
        },
        recovery: {
          automatic: true,
          timeToRecover: { min: 60, max: 300 },
          successRate: 0.95
        },
        parameters: {
          crashType: ['kernel-panic', 'hardware-failure', 'out-of-memory', 'segmentation-fault'],
          restartRequired: true
        }
      },
      {
        id: 'network-partition',
        name: 'Network Partition',
        description: 'Network isolation between regions or nodes',
        category: 'network',
        severity: 'critical',
        probability: 0.02,
        duration: { min: 60, max: 600, distribution: 'normal' },
        impact: {
          availability: 0.3,
          performance: 0.5,
          reliability: 0.4
        },
        recovery: {
          automatic: false,
          timeToRecover: { min: 120, max: 600 },
          successRate: 0.85
        },
        parameters: {
          partitionType: ['region-isolation', 'node-isolation', 'subnet-isolation'],
          affectedRegions: [],
          consistencyModel: 'eventual'
        }
      },
      {
        id: 'disk-failure',
        name: 'Disk Failure',
        description: 'Storage device failure causing data loss or corruption',
        category: 'hardware',
        severity: 'high',
        probability: 0.01,
        duration: { min: 300, max: 1800, distribution: 'normal' },
        impact: {
          availability: 0.2,
          performance: 0.4,
          reliability: 0.6
        },
        recovery: {
          automatic: false,
          timeToRecover: { min: 600, max: 3600 },
          successRate: 0.75
        },
        parameters: {
          failureType: ['bad-sectors', 'controller-failure', 'cable-failure'],
          dataLoss: true,
          backupAvailable: true
        }
      },
      {
        id: 'memory-leak',
        name: 'Memory Leak',
        description: 'Gradual memory consumption leading to performance degradation',
        category: 'software',
        severity: 'medium',
        probability: 0.08,
        duration: { min: 600, max: 3600, distribution: 'exponential' },
        impact: {
          availability: 0.05,
          performance: 0.7,
          reliability: 0.2
        },
        recovery: {
          automatic: true,
          timeToRecover: { min: 30, max: 180 },
          successRate: 0.98
        },
        parameters: {
          leakRate: ['slow', 'medium', 'fast'],
          affectedProcess: ['validator', 'miner', 'api-server'],
          restartRequired: true
        }
      },
      {
        id: 'ddos-attack',
        name: 'DDoS Attack',
        description: 'Distributed denial of service attack overwhelming network resources',
        category: 'external',
        severity: 'critical',
        probability: 0.03,
        duration: { min: 300, max: 1800, distribution: 'uniform' },
        impact: {
          availability: 0.4,
          performance: 0.8,
          reliability: 0.3
        },
        recovery: {
          automatic: true,
          timeToRecover: { min: 180, max: 900 },
          successRate: 0.80
        },
        parameters: {
          attackType: ['syn-flood', 'udp-flood', 'http-flood'],
          sourceIpCount: 1000,
          targetBandwidth: 10000 // Mbps
        }
      },
      {
        id: 'database-corruption',
        name: 'Database Corruption',
        description: 'Data corruption in blockchain database',
        category: 'software',
        severity: 'critical',
        probability: 0.005,
        duration: { min: 900, max: 3600, distribution: 'normal' },
        impact: {
          availability: 0.5,
          performance: 0.3,
          reliability: 0.9
        },
        recovery: {
          automatic: false,
          timeToRecover: { min: 1800, max: 7200 },
          successRate: 0.70
        },
        parameters: {
          corruptionType: ['index-corruption', 'data-corruption', 'schema-corruption'],
          backupAvailable: true,
          pointInTimeRecovery: true
        }
      },
      {
        id: 'power-outage',
        name: 'Power Outage',
        description: 'Complete power failure in datacenter or region',
        category: 'hardware',
        severity: 'critical',
        probability: 0.01,
        duration: { min: 60, max: 14400, distribution: 'exponential' },
        impact: {
          availability: 0.8,
          performance: 0.9,
          reliability: 0.7
        },
        recovery: {
          automatic: false,
          timeToRecover: { min: 300, max: 3600 },
          successRate: 0.90
        },
        parameters: {
          outageType: ['datacenter', 'region', 'rack'],
          backupPower: true,
          generatorAvailable: true
        }
      },
      {
        id: 'configuration-error',
        name: 'Configuration Error',
        description: 'Misconfiguration causing system malfunction',
        category: 'software',
        severity: 'medium',
        probability: 0.1,
        duration: { min: 30, max: 600, distribution: 'uniform' },
        impact: {
          availability: 0.1,
          performance: 0.3,
          reliability: 0.2
        },
        recovery: {
          automatic: false,
          timeToRecover: { min: 60, max: 300 },
          successRate: 0.95
        },
        parameters: {
          errorType: ['network-config', 'security-config', 'storage-config'],
          rollbackAvailable: true
        }
      }
    ];

    scenarios.forEach(scenario => {
      this.failureScenarios.set(scenario.id, scenario);
    });
  }

  private initializeRecoveryStrategies(): void {
    const strategies: RecoveryStrategy[] = [
      {
        id: 'auto-restart',
        name: 'Automatic Restart',
        description: 'Automatically restart failed services or nodes',
        applicableTo: ['node-crash', 'memory-leak', 'configuration-error'],
        steps: [
          {
            id: 'detect-failure',
            name: 'Detect Failure',
            description: 'Monitor system health and detect failures',
            type: 'detect',
            duration: 5,
            successRate: 0.99,
            dependencies: [],
            rollbackable: false,
            parameters: { monitoringInterval: 10 }
          },
          {
            id: 'isolate-node',
            name: 'Isolate Node',
            description: 'Isolate failed node from network',
            type: 'isolate',
            duration: 10,
            successRate: 0.98,
            dependencies: ['detect-failure'],
            rollbackable: true,
            parameters: { gracefulShutdown: true }
          },
          {
            id: 'restart-service',
            name: 'Restart Service',
            description: 'Restart the failed service',
            type: 'recover',
            duration: 30,
            successRate: 0.95,
            dependencies: ['isolate-node'],
            rollbackable: true,
            parameters: { timeout: 60 }
          },
          {
            id: 'verify-recovery',
            name: 'Verify Recovery',
            description: 'Verify service is functioning normally',
            type: 'verify',
            duration: 15,
            successRate: 0.99,
            dependencies: ['restart-service'],
            rollbackable: false,
            parameters: { healthCheckEndpoints: ['/health', '/status'] }
          }
        ],
        effectiveness: 0.95,
        resourceRequirements: { cpu: 5, memory: 10, network: 100, storage: 50 },
        conditions: { maxConcurrentFailures: 5, minAvailableResources: 20 }
      },
      {
        id: 'failover-cluster',
        name: 'Failover to Cluster',
        description: 'Failover to backup cluster or nodes',
        applicableTo: ['network-partition', 'power-outage', 'disk-failure'],
        steps: [
          {
            id: 'detect-outage',
            name: 'Detect Outage',
            description: 'Detect system outage or partition',
            type: 'detect',
            duration: 10,
            successRate: 0.98,
            dependencies: [],
            rollbackable: false,
            parameters: { heartbeatInterval: 5 }
          },
          {
            id: 'activate-backup',
            name: 'Activate Backup',
            description: 'Activate backup systems',
            type: 'mitigate',
            duration: 60,
            successRate: 0.90,
            dependencies: ['detect-outage'],
            rollbackable: true,
            parameters: { backupLocation: 'dr-site' }
          },
          {
            id: 'redirect-traffic',
            name: 'Redirect Traffic',
            description: 'Redirect traffic to backup systems',
            type: 'recover',
            duration: 30,
            successRate: 0.95,
            dependencies: ['activate-backup'],
            rollbackable: true,
            parameters: { dnsUpdate: true, loadBalancerUpdate: true }
          },
          {
            id: 'validate-failover',
            name: 'Validate Failover',
            description: 'Validate failover is successful',
            type: 'verify',
            duration: 20,
            successRate: 0.99,
            dependencies: ['redirect-traffic'],
            rollbackable: false,
            parameters: { validationTests: ['connectivity', 'performance', 'data'] }
          }
        ],
        effectiveness: 0.90,
        resourceRequirements: { cpu: 15, memory: 30, network: 500, storage: 200 },
        conditions: { maxConcurrentFailures: 3, minAvailableResources: 40 }
      },
      {
        id: 'data-recovery',
        name: 'Data Recovery',
        description: 'Recover data from backups or replicas',
        applicableTo: ['database-corruption', 'disk-failure'],
        steps: [
          {
            id: 'assess-damage',
            name: 'Assess Damage',
            description: 'Assess extent of data corruption or loss',
            type: 'detect',
            duration: 120,
            successRate: 0.95,
            dependencies: [],
            rollbackable: false,
            parameters: { scanDepth: 'full' }
          },
          {
            id: 'restore-backup',
            name: 'Restore Backup',
            description: 'Restore data from backup',
            type: 'recover',
            duration: 600,
            successRate: 0.85,
            dependencies: ['assess-damage'],
            rollbackable: true,
            parameters: { backupType: 'incremental', pointInTime: true }
          },
          {
            id: 'verify-integrity',
            name: 'Verify Integrity',
            description: 'Verify data integrity and consistency',
            type: 'verify',
            duration: 180,
            successRate: 0.98,
            dependencies: ['restore-backup'],
            rollbackable: false,
            parameters: { checksumValidation: true, consistencyCheck: true }
          },
          {
            id: 'resync-replicas',
            name: 'Resync Replicas',
            description: 'Resynchronize data replicas',
            type: 'recover',
            duration: 300,
            successRate: 0.95,
            dependencies: ['verify-integrity'],
            rollbackable: false,
            parameters: { syncMethod: 'incremental' }
          }
        ],
        effectiveness: 0.85,
        resourceRequirements: { cpu: 20, memory: 50, network: 1000, storage: 500 },
        conditions: { maxConcurrentFailures: 2, minAvailableResources: 60 }
      },
      {
        id: 'mitigation-ddos',
        name: 'DDoS Mitigation',
        description: 'Mitigate DDoS attacks using various techniques',
        applicableTo: ['ddos-attack'],
        steps: [
          {
            id: 'detect-attack',
            name: 'Detect Attack',
            description: 'Detect DDoS attack patterns',
            type: 'detect',
            duration: 30,
            successRate: 0.95,
            dependencies: [],
            rollbackable: false,
            parameters: { detectionMethod: 'anomaly-based' }
          },
          {
            id: 'activate-cdn',
            name: 'Activate CDN',
            description: 'Activate Content Delivery Network',
            type: 'mitigate',
            duration: 60,
            successRate: 0.90,
            dependencies: ['detect-attack'],
            rollbackable: true,
            parameters: { provider: 'cloudflare', caching: true }
          },
          {
            id: 'rate-limiting',
            name: 'Apply Rate Limiting',
            description: 'Apply rate limiting to suspicious traffic',
            type: 'mitigate',
            duration: 15,
            successRate: 0.95,
            dependencies: ['detect-attack'],
            rollbackable: true,
            parameters: { requestsPerSecond: 100, burstLimit: 1000 }
          },
          {
            id: 'block-ips',
            name: 'Block Malicious IPs',
            description: 'Block identified malicious IP addresses',
            type: 'mitigate',
            duration: 10,
            successRate: 0.98,
            dependencies: ['detect-attack'],
            rollbackable: true,
            parameters: { blockDuration: 3600, autoUnblock: true }
          },
          {
            id: 'monitor-effectiveness',
            name: 'Monitor Effectiveness',
            description: 'Monitor mitigation effectiveness',
            type: 'verify',
            duration: 300,
            successRate: 0.95,
            dependencies: ['activate-cdn', 'rate-limiting', 'block-ips'],
            rollbackable: false,
            parameters: { monitoringInterval: 30 }
          }
        ],
        effectiveness: 0.88,
        resourceRequirements: { cpu: 10, memory: 20, network: 2000, storage: 100 },
        conditions: { maxConcurrentFailures: 10, minAvailableResources: 30 }
      }
    ];

    strategies.forEach(strategy => {
      this.recoveryStrategies.set(strategy.id, strategy);
    });
  }

  private initializeResilienceTests(): void {
    const tests: ResilienceTest[] = [
      {
        id: 'basic-resilience',
        name: 'Basic Resilience Test',
        description: 'Test basic system resilience against common failures',
        scenarios: ['node-crash', 'memory-leak', 'configuration-error'],
        configuration: {
          duration: 1800,
          intensity: 'medium',
          parallelFailures: false,
          maxConcurrentFailures: 2
        },
        objectives: {
          availabilityTarget: 99.9,
          recoveryTimeTarget: 300,
          dataLossTarget: 0
        },
        successCriteria: {
          minAvailability: 99.5,
          maxRecoveryTime: 600,
          maxDataLoss: 0
        }
      },
      {
        id: 'advanced-resilience',
        name: 'Advanced Resilience Test',
        description: 'Test system resilience against complex failure scenarios',
        scenarios: ['network-partition', 'disk-failure', 'database-corruption'],
        configuration: {
          duration: 3600,
          intensity: 'high',
          parallelFailures: true,
          maxConcurrentFailures: 3
        },
        objectives: {
          availabilityTarget: 99.5,
          recoveryTimeTarget: 600,
          dataLossTarget: 0.1
        },
        successCriteria: {
          minAvailability: 99.0,
          maxRecoveryTime: 1200,
          maxDataLoss: 1.0
        }
      },
      {
        id: 'extreme-resilience',
        name: 'Extreme Resilience Test',
        description: 'Test system resilience under extreme conditions',
        scenarios: ['ddos-attack', 'power-outage', 'database-corruption'],
        configuration: {
          duration: 7200,
          intensity: 'extreme',
          parallelFailures: true,
          maxConcurrentFailures: 5
        },
        objectives: {
          availabilityTarget: 99.0,
          recoveryTimeTarget: 1800,
          dataLossTarget: 1.0
        },
        successCriteria: {
          minAvailability: 95.0,
          maxRecoveryTime: 3600,
          maxDataLoss: 5.0
        }
      }
    ];

    tests.forEach(test => {
      this.resilienceTests.set(test.id, test);
    });
  }

  // Public API methods
  getFailureScenarios(): FailureScenario[] {
    return Array.from(this.failureScenarios.values());
  }

  getFailureScenario(scenarioId: string): FailureScenario | undefined {
    return this.failureScenarios.get(scenarioId);
  }

  getRecoveryStrategies(): RecoveryStrategy[] {
    return Array.from(this.recoveryStrategies.values());
  }

  getRecoveryStrategy(strategyId: string): RecoveryStrategy | undefined {
    return this.recoveryStrategies.get(strategyId);
  }

  getResilienceTests(): ResilienceTest[] {
    return Array.from(this.resilienceTests.values());
  }

  getResilienceTest(testId: string): ResilienceTest | undefined {
    return this.resilienceTests.get(testId);
  }

  async triggerFailure(scenarioId: string, target: string, options?: {
    duration?: number;
    intensity?: number;
    parameters?: { [key: string]: any };
  }): Promise<FailureEvent> {
    const scenario = this.failureScenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Failure scenario ${scenarioId} not found`);
    }

    const eventId = `event-${Date.now()}`;
    const startTime = new Date();

    // Calculate duration based on scenario distribution
    let duration = options?.duration;
    if (!duration) {
      const { min, max, distribution } = scenario.duration;
      switch (distribution) {
        case 'uniform':
          duration = min + Math.random() * (max - min);
          break;
        case 'normal':
          duration = min + (max - min) * 0.5 + (Math.random() - 0.5) * (max - min) * 0.3;
          break;
        case 'exponential':
          duration = min + Math.log(1 + Math.random()) * (max - min);
          break;
        default:
          duration = min + Math.random() * (max - min);
      }
    }

    const event: FailureEvent = {
      id: eventId,
      scenarioId,
      timestamp: startTime,
      target,
      status: 'triggered',
      actualDuration: duration,
      impact: {
        affectedNodes: [target],
        affectedConnections: [],
        performanceDegradation: (1 - scenario.impact.performance) * 100,
        availabilityLoss: (1 - scenario.impact.availability) * 100
      },
      recovery: {
        method: 'automatic',
        success: false
      },
      metrics: {
        before: this.captureBaselineMetrics(target),
        during: {},
        after: {}
      }
    };

    this.activeEvents.set(eventId, event);
    this.emit('failureTriggered', event);

    // Simulate failure progression
    await this.simulateFailureProgression(event, scenario, options);

    return event;
  }

  private async simulateFailureProgression(event: FailureEvent, scenario: FailureScenario, options?: { parameters?: { [key: string]: any } }): Promise<void> {
    // Update event status to active
    event.status = 'active';
    this.emit('failureActive', event);

    // Capture during-failure metrics
    event.metrics.during = this.captureFailureMetrics(event.target, scenario);

    // Simulate failure duration
    await new Promise(resolve => setTimeout(resolve, (event.actualDuration || 300) * 1000));

    // Start recovery process
    await this.startRecoveryProcess(event, scenario);
  }

  private async startRecoveryProcess(event: FailureEvent, scenario: FailureScenario): Promise<void> {
    event.status = 'recovering';
    event.recovery.startTime = new Date();
    this.emit('recoveryStarted', event);

    // Find applicable recovery strategies
    const applicableStrategies = Array.from(this.recoveryStrategies.values())
      .filter(strategy => strategy.applicableTo.includes(scenario.category));

    if (applicableStrategies.length === 0) {
      // No automatic recovery strategy available
      event.recovery.method = 'manual';
      event.recovery.success = false;
      event.status = 'failed';
      this.emit('recoveryFailed', event);
      return;
    }

    // Select best strategy (simplified - in reality would be more complex)
    const strategy = applicableStrategies[0];

    // Simulate recovery process
    const recoveryTime = this.calculateRecoveryTime(strategy, scenario);
    await new Promise(resolve => setTimeout(resolve, recoveryTime * 1000));

    // Determine recovery success
    const successProbability = strategy.effectiveness * scenario.recovery.successRate;
    event.recovery.success = Math.random() < successProbability;

    event.recovery.endTime = new Date();
    event.recovery.timeTaken = recoveryTime;
    event.recovery.method = strategy.applicableTo.includes('external') ? 'hybrid' : 'automatic';

    // Capture post-recovery metrics
    event.metrics.after = this.captureRecoveryMetrics(event.target, scenario);

    // Update final status
    event.status = event.recovery.success ? 'recovered' : 'failed';
    this.activeEvents.delete(event.id);
    this.eventHistory.push(event);

    if (event.recovery.success) {
      this.emit('recoveryCompleted', event);
    } else {
      this.emit('recoveryFailed', event);
    }
  }

  private calculateRecoveryTime(strategy: RecoveryStrategy, scenario: FailureScenario): number {
    const baseTime = strategy.steps.reduce((sum, step) => sum + step.duration, 0);
    const scenarioTime = (scenario.recovery.timeToRecover.min + scenario.recovery.timeToRecover.max) / 2;
    return Math.min(baseTime, scenarioTime) * (0.8 + Math.random() * 0.4);
  }

  private captureBaselineMetrics(target: string): { [key: string]: number } {
    return {
      tps: 1000 + Math.random() * 500,
      latency: 25 + Math.random() * 15,
      availability: 100,
      errorRate: 0.1 + Math.random() * 0.5,
      cpu: 30 + Math.random() * 20,
      memory: 40 + Math.random() * 30,
      network: 20 + Math.random() * 15
    };
  }

  private captureFailureMetrics(target: string, scenario: FailureScenario): { [key: string]: number } {
    const baseline = this.captureBaselineMetrics(target);
    return {
      tps: baseline.tps * scenario.impact.performance * (0.8 + Math.random() * 0.4),
      latency: baseline.latency / scenario.impact.performance * (1.2 + Math.random() * 0.6),
      availability: baseline.availability * scenario.impact.availability,
      errorRate: baseline.errorRate * (2 + Math.random() * 3),
      cpu: Math.min(100, baseline.cpu * (1.5 + Math.random() * 1.5)),
      memory: Math.min(100, baseline.memory * (1.3 + Math.random() * 1.2)),
      network: Math.min(100, baseline.network * (1.2 + Math.random() * 1.0))
    };
  }

  private captureRecoveryMetrics(target: string, scenario: FailureScenario): { [key: string]: number } {
    const baseline = this.captureBaselineMetrics(target);
    const recoveryFactor = scenario.recovery.successRate;
    return {
      tps: baseline.tps * recoveryFactor * (0.9 + Math.random() * 0.2),
      latency: baseline.latency / recoveryFactor * (0.9 + Math.random() * 0.2),
      availability: baseline.availability * recoveryFactor,
      errorRate: baseline.errorRate / recoveryFactor * (0.8 + Math.random() * 0.4),
      cpu: baseline.cpu * (0.9 + Math.random() * 0.2),
      memory: baseline.memory * (0.9 + Math.random() * 0.2),
      network: baseline.network * (0.9 + Math.random() * 0.2)
    };
  }

  async runResilienceTest(testId: string): Promise<ResilienceTestResult> {
    const test = this.resilienceTests.get(testId);
    if (!test) {
      throw new Error(`Resilience test ${testId} not found`);
    }

    const resultId = `result-${Date.now()}`;
    const startTime = new Date();

    const result: ResilienceTestResult = {
      id: resultId,
      testId,
      startTime,
      endTime: new Date(),
      duration: 0,
      status: 'running',
      events: [],
      metrics: {
        availability: { target: test.objectives.availabilityTarget, actual: 100, achieved: false },
        recoveryTime: { target: test.objectives.recoveryTimeTarget, actual: 0, achieved: false },
        dataLoss: { target: test.objectives.dataLossTarget, actual: 0, achieved: false }
      },
      summary: {
        totalEvents: 0,
        successfulRecoveries: 0,
        failedRecoveries: 0,
        averageRecoveryTime: 0,
        resilienceScore: 0
      },
      insights: {
        strengths: [],
        weaknesses: [],
        recommendations: []
      }
    };

    this.testResults.set(resultId, result);
    this.emit('testStarted', { test, result });

    // Execute test scenarios
    await this.executeResilienceTest(test, result);

    // Calculate final results
    result.endTime = new Date();
    result.duration = (result.endTime.getTime() - result.startTime.getTime()) / 1000;
    result.status = 'completed';

    this.calculateTestResults(result, test);
    this.generateTestInsights(result, test);

    this.emit('testCompleted', result);

    return result;
  }

  private async executeResilienceTest(test: ResilienceTest, result: ResilienceTestResult): Promise<void> {
    const scenarioPromises = test.scenarios.map(async (scenarioId, index) => {
      // Add delay between scenarios if not parallel
      if (!test.configuration.parallelFailures && index > 0) {
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds between scenarios
      }

      // Select a random target for the failure
      const targets = ['node-1', 'node-2', 'node-3', 'region-us-east', 'region-eu-central'];
      const target = targets[Math.floor(Math.random() * targets.length)];

      try {
        const event = await this.triggerFailure(scenarioId, target, {
          intensity: this.getIntensityMultiplier(test.configuration.intensity)
        });

        result.events.push(event);
        result.summary.totalEvents++;

        if (event.recovery.success) {
          result.summary.successfulRecoveries++;
        } else {
          result.summary.failedRecoveries++;
        }

        if (event.recovery.timeTaken) {
          result.summary.averageRecoveryTime = 
            (result.summary.averageRecoveryTime * (result.summary.totalEvents - 1) + event.recovery.timeTaken) / result.summary.totalEvents;
        }

      } catch (error) {
        console.error(`Failed to execute scenario ${scenarioId}:`, error);
      }
    });

    await Promise.all(scenarioPromises);
  }

  private getIntensityMultiplier(intensity: string): number {
    switch (intensity) {
      case 'low': return 0.5;
      case 'medium': return 1.0;
      case 'high': return 1.5;
      case 'extreme': return 2.0;
      default: return 1.0;
    }
  }

  private calculateTestResults(result: ResilienceTestResult, test: ResilienceTest): void {
    // Calculate availability
    const totalDowntime = result.events.reduce((sum, event) => {
      return sum + (event.actualDuration || 0) * (1 - event.recovery.success ? 0 : 1);
    }, 0);
    
    const totalTestTime = result.duration;
    const availability = ((totalTestTime - totalDowntime) / totalTestTime) * 100;
    result.metrics.availability.actual = availability;
    result.metrics.availability.achieved = availability >= test.successCriteria.minAvailability;

    // Calculate recovery time
    const successfulRecoveries = result.events.filter(e => e.recovery.success && e.recovery.timeTaken);
    const avgRecoveryTime = successfulRecoveries.length > 0 
      ? successfulRecoveries.reduce((sum, e) => sum + (e.recovery.timeTaken || 0), 0) / successfulRecoveries.length
      : test.objectives.recoveryTimeTarget * 2; // Penalize for no successful recoveries
    
    result.metrics.recoveryTime.actual = avgRecoveryTime;
    result.metrics.recoveryTime.achieved = avgRecoveryTime <= test.successCriteria.maxRecoveryTime;

    // Calculate data loss (simplified)
    const dataLossEvents = result.events.filter(e => 
      ['database-corruption', 'disk-failure'].includes(e.scenarioId) && !e.recovery.success
    );
    const dataLoss = (dataLossEvents.length / result.events.length) * 10; // Max 10% data loss
    result.metrics.dataLoss.actual = dataLoss;
    result.metrics.dataLoss.achieved = dataLoss <= test.successCriteria.maxDataLoss;

    // Calculate resilience score
    const availabilityScore = Math.min(100, (availability / test.objectives.availabilityTarget) * 100);
    const recoveryScore = Math.min(100, (test.successCriteria.maxRecoveryTime / avgRecoveryTime) * 100);
    const dataLossScore = Math.min(100, ((test.successCriteria.maxDataLoss + 1) / (dataLoss + 1)) * 100);
    
    result.summary.resilienceScore = (availabilityScore + recoveryScore + dataLossScore) / 3;
  }

  private generateTestInsights(result: ResilienceTestResult, test: ResilienceTest): void {
    const insights = result.insights;

    // Generate strengths
    if (result.metrics.availability.achieved) {
      insights.strengths.push('System maintains high availability during failures');
    }
    
    if (result.metrics.recoveryTime.achieved) {
      insights.strengths.push('Recovery processes meet time targets');
    }
    
    if (result.summary.successfulRecoveries / result.summary.totalEvents > 0.9) {
      insights.strengths.push('High recovery success rate');
    }

    // Generate weaknesses
    if (!result.metrics.availability.achieved) {
      insights.weaknesses.push('Availability drops below acceptable levels during failures');
    }
    
    if (!result.metrics.recoveryTime.achieved) {
      insights.weaknesses.push('Recovery times exceed targets');
    }
    
    if (result.summary.failedRecoveries > 0) {
      insights.weaknesses.push('Some recovery processes fail to complete successfully');
    }

    // Generate recommendations
    if (result.summary.resilienceScore < 80) {
      insights.recommendations.push('Implement additional redundancy and failover mechanisms');
    }
    
    if (result.summary.averageRecoveryTime > test.objectives.recoveryTimeTarget) {
      insights.recommendations.push('Optimize recovery processes and automation');
    }
    
    if (result.metrics.dataLoss.actual > test.objectives.dataLossTarget) {
      insights.recommendations.push('Improve backup and data protection strategies');
    }
    
    insights.recommendations.push('Regular resilience testing to maintain and improve system robustness');
  }

  // Query methods
  getActiveEvents(): FailureEvent[] {
    return Array.from(this.activeEvents.values());
  }

  getEventHistory(limit?: number): FailureEvent[] {
    const history = [...this.eventHistory].reverse();
    return limit ? history.slice(0, limit) : history;
  }

  getTestResults(): ResilienceTestResult[] {
    return Array.from(this.testResults.values())
      .sort((a, b) => b.endTime.getTime() - a.endTime.getTime());
  }

  getTestResult(resultId: string): ResilienceTestResult | undefined {
    return this.testResults.get(resultId);
  }

  stopEvent(eventId: string): boolean {
    const event = this.activeEvents.get(eventId);
    if (event) {
      event.status = 'failed';
      event.recovery.method = 'manual';
      event.recovery.success = false;
      event.recovery.endTime = new Date();
      this.activeEvents.delete(eventId);
      this.eventHistory.push(event);
      this.emit('eventStopped', event);
      return true;
    }
    return false;
  }

  createCustomScenario(scenario: Omit<FailureScenario, 'id'>): FailureScenario {
    const newScenario: FailureScenario = {
      ...scenario,
      id: `custom-${Date.now()}`
    };
    this.failureScenarios.set(newScenario.id, newScenario);
    this.emit('scenarioCreated', newScenario);
    return newScenario;
  }

  createCustomStrategy(strategy: Omit<RecoveryStrategy, 'id'>): RecoveryStrategy {
    const newStrategy: RecoveryStrategy = {
      ...strategy,
      id: `custom-${Date.now()}`
    };
    this.recoveryStrategies.set(newStrategy.id, newStrategy);
    this.emit('strategyCreated', newStrategy);
    return newStrategy;
  }
}