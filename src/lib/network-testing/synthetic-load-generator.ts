import { EventEmitter } from 'events';

export interface TransactionPattern {
  id: string;
  name: string;
  description: string;
  characteristics: {
    size: {
      min: number;
      max: number;
      avg: number;
    };
    complexity: 'simple' | 'medium' | 'complex';
    type: 'transfer' | 'contract' | 'staking' | 'governance' | 'nft' | 'defi';
    frequency: {
      min: number;
      max: number;
      pattern: 'uniform' | 'burst' | 'sporadic' | 'periodic';
    };
  };
}

export interface LoadProfile {
  id: string;
  name: string;
  description: string;
  duration: number; // in seconds
  phases: {
    name: string;
    duration: number;
    targetTps: number;
    patterns: string[];
    rampUp: boolean;
    rampDown: boolean;
  }[];
  overall: {
    targetTps: number;
    totalTransactions: number;
    complexity: 'low' | 'medium' | 'high';
  };
}

export interface GeneratedTransaction {
  id: string;
  timestamp: Date;
  type: string;
  size: number;
  complexity: 'simple' | 'medium' | 'complex';
  data: {
    from: string;
    to: string;
    amount?: number;
    contract?: string;
    method?: string;
    parameters?: any;
  };
  metadata: {
    pattern: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    expectedLatency: number;
    region: string;
  };
}

export interface LoadGenerationResult {
  id: string;
  profileId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  transactions: GeneratedTransaction[];
  metrics: {
    totalGenerated: number;
    targetTps: number;
    actualTps: number;
    successRate: number;
    averageSize: number;
    complexityDistribution: {
      simple: number;
      medium: number;
      complex: number;
    };
    typeDistribution: { [type: string]: number };
    regionalDistribution: { [region: string]: number };
  };
  performance: {
    generationRate: number;
    memoryUsage: number;
    cpuUsage: number;
    errors: number;
  };
}

export interface UserBehaviorProfile {
  id: string;
  name: string;
  description: string;
  behaviors: {
    transactionFrequency: number; // transactions per hour
    preferredTypes: string[];
    timeOfDayPattern: number[]; // hourly distribution
    complexityPreference: 'simple' | 'medium' | 'complex';
    region: string;
  };
  demographics: {
    count: number;
    experience: 'beginner' | 'intermediate' | 'expert';
    category: 'retail' | 'institutional' | 'developer' | 'trader';
  };
}

export class SyntheticLoadGenerator extends EventEmitter {
  private transactionPatterns: Map<string, TransactionPattern> = new Map();
  private loadProfiles: Map<string, LoadProfile> = new Map();
  private userBehaviors: Map<string, UserBehaviorProfile> = new Map();
  private activeGenerations: Map<string, LoadGenerationResult> = new Map();
  private generationHistory: LoadGenerationResult[] = [];

  constructor() {
    super();
    this.initializeTransactionPatterns();
    this.initializeLoadProfiles();
    this.initializeUserBehaviors();
  }

  private initializeTransactionPatterns(): void {
    const patterns: TransactionPattern[] = [
      {
        id: 'simple-transfer',
        name: 'Simple Transfer',
        description: 'Basic token transfer between addresses',
        characteristics: {
          size: { min: 100, max: 500, avg: 250 },
          complexity: 'simple',
          type: 'transfer',
          frequency: { min: 10, max: 100, pattern: 'uniform' }
        }
      },
      {
        id: 'contract-call',
        name: 'Smart Contract Call',
        description: 'Execution of smart contract methods',
        characteristics: {
          size: { min: 200, max: 2000, avg: 800 },
          complexity: 'medium',
          type: 'contract',
          frequency: { min: 5, max: 50, pattern: 'sporadic' }
        }
      },
      {
        id: 'staking-operation',
        name: 'Staking Operation',
        description: 'Delegation, unbonding, or reward claiming',
        characteristics: {
          size: { min: 300, max: 800, avg: 500 },
          complexity: 'medium',
          type: 'staking',
          frequency: { min: 1, max: 10, pattern: 'periodic' }
        }
      },
      {
        id: 'governance-vote',
        name: 'Governance Vote',
        description: 'Voting on governance proposals',
        characteristics: {
          size: { min: 400, max: 1500, avg: 900 },
          complexity: 'complex',
          type: 'governance',
          frequency: { min: 1, max: 5, pattern: 'burst' }
        }
      },
      {
        id: 'nft-mint',
        name: 'NFT Minting',
        description: 'Creating new NFT tokens',
        characteristics: {
          size: { min: 1000, max: 5000, avg: 2500 },
          complexity: 'complex',
          type: 'nft',
          frequency: { min: 1, max: 20, pattern: 'burst' }
        }
      },
      {
        id: 'defi-swap',
        name: 'DeFi Swap',
        description: 'Token swaps on decentralized exchanges',
        characteristics: {
          size: { min: 500, max: 1500, avg: 1000 },
          complexity: 'medium',
          type: 'defi',
          frequency: { min: 20, max: 200, pattern: 'uniform' }
        }
      },
      {
        id: 'batch-transfer',
        name: 'Batch Transfer',
        description: 'Multiple transfers in a single transaction',
        characteristics: {
          size: { min: 1000, max: 10000, avg: 3000 },
          complexity: 'complex',
          type: 'transfer',
          frequency: { min: 1, max: 10, pattern: 'sporadic' }
        }
      },
      {
        id: 'cross-chain-transfer',
        name: 'Cross-chain Transfer',
        description: 'Token transfers across different blockchains',
        characteristics: {
          size: { min: 2000, max: 8000, avg: 4000 },
          complexity: 'complex',
          type: 'transfer',
          frequency: { min: 1, max: 5, pattern: 'periodic' }
        }
      }
    ];

    patterns.forEach(pattern => {
      this.transactionPatterns.set(pattern.id, pattern);
    });
  }

  private initializeLoadProfiles(): void {
    const profiles: LoadProfile[] = [
      {
        id: 'steady-state',
        name: 'Steady State Load',
        description: 'Consistent transaction rate over time',
        duration: 3600, // 1 hour
        phases: [
          {
            name: 'Steady Operation',
            duration: 3600,
            targetTps: 1000,
            patterns: ['simple-transfer', 'defi-swap'],
            rampUp: true,
            rampDown: true
          }
        ],
        overall: {
          targetTps: 1000,
          totalTransactions: 3600000,
          complexity: 'medium'
        }
      },
      {
        id: 'burst-pattern',
        name: 'Burst Pattern Load',
        description: 'Periodic bursts of high transaction volume',
        duration: 1800, // 30 minutes
        phases: [
          {
            name: 'Baseline',
            duration: 300,
            targetTps: 500,
            patterns: ['simple-transfer'],
            rampUp: true,
            rampDown: false
          },
          {
            name: 'Peak Burst',
            duration: 600,
            targetTps: 5000,
            patterns: ['defi-swap', 'contract-call', 'nft-mint'],
            rampUp: true,
            rampDown: true
          },
          {
            name: 'Recovery',
            duration: 300,
            targetTps: 500,
            patterns: ['simple-transfer'],
            rampUp: false,
            rampDown: true
          },
          {
            name: 'Second Burst',
            duration: 600,
            targetTps: 7500,
            patterns: ['defi-swap', 'contract-call', 'batch-transfer'],
            rampUp: true,
            rampDown: true
          }
        ],
        overall: {
          targetTps: 2500,
          totalTransactions: 4500000,
          complexity: 'high'
        }
      },
      {
        id: 'realistic-mixed',
        name: 'Realistic Mixed Load',
        description: 'Real-world transaction patterns with various types',
        duration: 7200, // 2 hours
        phases: [
          {
            name: 'Morning Activity',
            duration: 1800,
            targetTps: 800,
            patterns: ['simple-transfer', 'staking-operation'],
            rampUp: true,
            rampDown: false
          },
          {
            name: 'Business Hours',
            duration: 3600,
            targetTps: 2000,
            patterns: ['defi-swap', 'contract-call', 'governance-vote'],
            rampUp: true,
            rampDown: false
          },
          {
            name: 'Peak Trading',
            duration: 900,
            targetTps: 4000,
            patterns: ['defi-swap', 'nft-mint', 'batch-transfer'],
            rampUp: true,
            rampDown: true
          },
          {
            name: 'Evening Cool-down',
            duration: 900,
            targetTps: 1000,
            patterns: ['simple-transfer', 'staking-operation'],
            rampUp: false,
            rampDown: true
          }
        ],
        overall: {
          targetTps: 2000,
          totalTransactions: 14400000,
          complexity: 'medium'
        }
      },
      {
        id: 'stress-test',
        name: 'Stress Test Load',
        description: 'Maximum sustained load testing',
        duration: 3600, // 1 hour
        phases: [
          {
            name: 'Ramp Up',
            duration: 600,
            targetTps: 10000,
            patterns: ['simple-transfer', 'defi-swap'],
            rampUp: true,
            rampDown: false
          },
          {
            name: 'Sustained Peak',
            duration: 2400,
            targetTps: 25000,
            patterns: ['defi-swap', 'contract-call', 'batch-transfer', 'cross-chain-transfer'],
            rampUp: false,
            rampDown: false
          },
          {
            name: 'Ramp Down',
            duration: 600,
            targetTps: 5000,
            patterns: ['simple-transfer'],
            rampUp: false,
            rampDown: true
          }
        ],
        overall: {
          targetTps: 20000,
          totalTransactions: 72000000,
          complexity: 'high'
        }
      }
    ];

    profiles.forEach(profile => {
      this.loadProfiles.set(profile.id, profile);
    });
  }

  private initializeUserBehaviors(): void {
    const behaviors: UserBehaviorProfile[] = [
      {
        id: 'retail-trader',
        name: 'Retail Trader',
        description: 'Individual users trading small amounts',
        behaviors: {
          transactionFrequency: 15,
          preferredTypes: ['simple-transfer', 'defi-swap'],
          timeOfDayPattern: [0.5, 0.3, 0.2, 0.1, 0.1, 0.2, 0.8, 2.0, 3.5, 2.8, 2.2, 1.8, 1.5, 1.8, 2.2, 2.5, 3.0, 3.2, 2.8, 2.0, 1.5, 1.0, 0.8, 0.6],
          complexityPreference: 'simple',
          region: 'us-east'
        },
        demographics: {
          count: 10000,
          experience: 'beginner',
          category: 'retail'
        }
      },
      {
        id: 'institutional-trader',
        name: 'Institutional Trader',
        description: 'Large financial institutions',
        behaviors: {
          transactionFrequency: 100,
          preferredTypes: ['batch-transfer', 'defi-swap', 'cross-chain-transfer'],
          timeOfDayPattern: [1.0, 0.8, 0.6, 0.4, 0.5, 1.2, 2.5, 4.0, 5.0, 4.8, 4.5, 4.2, 4.0, 4.5, 4.8, 5.0, 4.5, 4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.2],
          complexityPreference: 'complex',
          region: 'us-east'
        },
        demographics: {
          count: 100,
          experience: 'expert',
          category: 'institutional'
        }
      },
      {
        id: 'defi-user',
        name: 'DeFi User',
        description: 'Active DeFi protocol users',
        behaviors: {
          transactionFrequency: 50,
          preferredTypes: ['defi-swap', 'contract-call', 'staking-operation'],
          timeOfDayPattern: [0.8, 0.6, 0.4, 0.3, 0.4, 0.8, 1.5, 2.8, 4.0, 4.5, 4.2, 3.8, 3.5, 3.8, 4.0, 4.2, 4.5, 4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0],
          complexityPreference: 'medium',
          region: 'eu-central'
        },
        demographics: {
          count: 5000,
          experience: 'intermediate',
          category: 'trader'
        }
      },
      {
        id: 'nft-collector',
        name: 'NFT Collector',
        description: 'Users focused on NFT activities',
        behaviors: {
          transactionFrequency: 8,
          preferredTypes: ['nft-mint', 'simple-transfer'],
          timeOfDayPattern: [0.3, 0.2, 0.1, 0.1, 0.2, 0.5, 1.2, 2.0, 2.5, 2.8, 3.0, 3.2, 3.0, 2.8, 2.5, 2.8, 3.2, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0, 0.5],
          complexityPreference: 'medium',
          region: 'asia-southeast'
        },
        demographics: {
          count: 2000,
          experience: 'intermediate',
          category: 'retail'
        }
      },
      {
        id: 'governance-participant',
        name: 'Governance Participant',
        description: 'Users involved in governance activities',
        behaviors: {
          transactionFrequency: 3,
          preferredTypes: ['governance-vote', 'staking-operation'],
          timeOfDayPattern: [0.2, 0.1, 0.1, 0.1, 0.2, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.2, 3.0, 2.8, 2.5, 2.8, 3.0, 2.5, 2.0, 1.5, 1.0, 0.8, 0.5, 0.3],
          complexityPreference: 'complex',
          region: 'us-west'
        },
        demographics: {
          count: 1000,
          experience: 'expert',
          category: 'developer'
        }
      }
    ];

    behaviors.forEach(behavior => {
      this.userBehaviors.set(behavior.id, behavior);
    });
  }

  // Public API methods
  getTransactionPatterns(): TransactionPattern[] {
    return Array.from(this.transactionPatterns.values());
  }

  getLoadProfiles(): LoadProfile[] {
    return Array.from(this.loadProfiles.values());
  }

  getUserBehaviors(): UserBehaviorProfile[] {
    return Array.from(this.userBehaviors.values());
  }

  async generateLoad(profileId: string, options?: {
    regions?: string[];
    userBehaviors?: string[];
    customPatterns?: TransactionPattern[];
    startTime?: Date;
  }): Promise<LoadGenerationResult> {
    const profile = this.loadProfiles.get(profileId);
    if (!profile) {
      throw new Error(`Load profile ${profileId} not found`);
    }

    const generationId = `gen-${Date.now()}`;
    const startTime = options?.startTime || new Date();
    const endTime = new Date(startTime.getTime() + profile.duration * 1000);

    const result: LoadGenerationResult = {
      id: generationId,
      profileId,
      startTime,
      endTime,
      duration: profile.duration,
      transactions: [],
      metrics: {
        totalGenerated: 0,
        targetTps: profile.overall.targetTps,
        actualTps: 0,
        successRate: 100,
        averageSize: 0,
        complexityDistribution: { simple: 0, medium: 0, complex: 0 },
        typeDistribution: {},
        regionalDistribution: {}
      },
      performance: {
        generationRate: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        errors: 0
      }
    };

    this.activeGenerations.set(generationId, result);
    this.emit('generationStarted', result);

    // Generate transactions based on profile
    await this.generateTransactionsFromProfile(result, profile, options);

    // Calculate final metrics
    this.calculateGenerationMetrics(result);

    // Store in history
    this.generationHistory.push(result);
    this.activeGenerations.delete(generationId);
    this.emit('generationCompleted', result);

    return result;
  }

  private async generateTransactionsFromProfile(
    result: LoadGenerationResult,
    profile: LoadProfile,
    options?: {
      regions?: string[];
      userBehaviors?: string[];
      customPatterns?: TransactionPattern[];
    }
  ): Promise<void> {
    const regions = options?.regions || ['us-east', 'eu-central', 'asia-southeast'];
    const behaviors = options?.userBehaviors || ['retail-trader', 'defi-user'];
    const patterns = options?.customPatterns || Array.from(this.transactionPatterns.values());

    let currentTime = result.startTime.getTime();
    const endTime = result.endTime.getTime();

    // Process each phase
    for (const phase of profile.phases) {
      const phaseStartTime = currentTime;
      const phaseEndTime = currentTime + phase.duration * 1000;

      // Generate transactions for this phase
      while (currentTime < phaseEndTime) {
        const transactionsInBatch = this.generateTransactionBatch(
          phase,
          patterns,
          regions,
          behaviors,
          currentTime,
          phaseStartTime,
          phaseEndTime
        );

        result.transactions.push(...transactionsInBatch);
        currentTime += 1000; // Advance by 1 second

        // Emit progress
        const progress = (currentTime - result.startTime.getTime()) / (endTime - result.startTime.getTime());
        this.emit('generationProgress', { result, progress, transactionsGenerated: result.transactions.length });

        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
  }

  private generateTransactionBatch(
    phase: LoadProfile['phases'][0],
    patterns: TransactionPattern[],
    regions: string[],
    behaviors: string[],
    currentTime: number,
    phaseStartTime: number,
    phaseEndTime: number
  ): GeneratedTransaction[] {
    const transactions: GeneratedTransaction[] = [];
    
    // Calculate current TPS based on ramp up/down
    let currentTps = phase.targetTps;
    const phaseDuration = phaseEndTime - phaseStartTime;
    const phaseProgress = (currentTime - phaseStartTime) / phaseDuration;

    if (phase.rampUp && phaseProgress < 0.2) {
      // Ramp up: 0-20% of phase
      currentTps = phase.targetTps * (phaseProgress / 0.2);
    } else if (phase.rampDown && phaseProgress > 0.8) {
      // Ramp down: 80-100% of phase
      currentTps = phase.targetTps * ((1 - phaseProgress) / 0.2);
    }

    // Add some randomness
    currentTps = currentTps * (0.9 + Math.random() * 0.2);
    const transactionCount = Math.floor(currentTps);

    // Generate transactions
    for (let i = 0; i < transactionCount; i++) {
      const transaction = this.generateSingleTransaction(patterns, regions, behaviors, currentTime);
      transactions.push(transaction);
    }

    return transactions;
  }

  private generateSingleTransaction(
    patterns: TransactionPattern[],
    regions: string[],
    behaviors: string[],
    timestamp: number
  ): GeneratedTransaction {
    // Select pattern based on phase patterns
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    // Select region
    const region = regions[Math.floor(Math.random() * regions.length)];
    
    // Generate transaction size based on pattern
    const size = Math.floor(
      Math.random() * (pattern.characteristics.size.max - pattern.characteristics.size.min) + 
      pattern.characteristics.size.min
    );

    // Generate transaction data
    const transaction: GeneratedTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(timestamp),
      type: pattern.characteristics.type,
      size,
      complexity: pattern.characteristics.complexity,
      data: {
        from: this.generateAddress(),
        to: this.generateAddress(),
        amount: pattern.characteristics.type === 'transfer' ? Math.floor(Math.random() * 10000) : undefined,
        contract: pattern.characteristics.type === 'contract' ? this.generateContractAddress() : undefined,
        method: pattern.characteristics.type === 'contract' ? this.generateMethodName() : undefined,
        parameters: this.generateTransactionParameters(pattern)
      },
      metadata: {
        pattern: pattern.id,
        priority: this.generatePriority(pattern),
        expectedLatency: this.generateExpectedLatency(region, pattern),
        region
      }
    };

    return transaction;
  }

  private generateAddress(): string {
    return '0x' + Math.random().toString(16).substr(2, 40).padStart(40, '0');
  }

  private generateContractAddress(): string {
    return '0x' + Math.random().toString(16).substr(2, 40).padStart(40, '0');
  }

  private generateMethodName(): string {
    const methods = ['transfer', 'approve', 'swap', 'stake', 'unstake', 'vote', 'mint', 'burn'];
    return methods[Math.floor(Math.random() * methods.length)];
  }

  private generateTransactionParameters(pattern: TransactionPattern): any {
    switch (pattern.characteristics.type) {
      case 'transfer':
        return { amount: Math.floor(Math.random() * 10000) };
      case 'contract':
        return { 
          inputs: Array(Math.floor(Math.random() * 5) + 1).fill(0).map(() => Math.random().toString(36).substr(2, 8))
        };
      case 'staking':
        return { amount: Math.floor(Math.random() * 100000), duration: Math.floor(Math.random() * 365) + 1 };
      case 'governance':
        return { proposalId: Math.floor(Math.random() * 1000), vote: Math.random() > 0.5 ? 'for' : 'against' };
      case 'nft':
        return { tokenId: Math.floor(Math.random() * 10000), metadata: { name: `NFT #${Math.floor(Math.random() * 10000)}` } };
      case 'defi':
        return { 
          tokenIn: this.generateAddress(), 
          tokenOut: this.generateAddress(), 
          amountIn: Math.floor(Math.random() * 10000) 
        };
      default:
        return {};
    }
  }

  private generatePriority(pattern: TransactionPattern): 'low' | 'medium' | 'high' | 'critical' {
    const priorities = ['low', 'medium', 'high', 'critical'];
    const weights = [0.4, 0.4, 0.15, 0.05]; // Most transactions are low/medium priority
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < priorities.length; i++) {
      cumulative += weights[i];
      if (random < cumulative) {
        return priorities[i] as any;
      }
    }
    
    return 'medium';
  }

  private generateExpectedLatency(region: string, pattern: TransactionPattern): number {
    const baseLatencies: { [key: string]: number } = {
      'us-east': 25,
      'us-west': 30,
      'eu-central': 35,
      'asia-southeast': 50,
      'asia-northeast': 45,
      'sa-east': 80,
      'af-south': 100,
      'me-south': 90
    };

    const complexityMultipliers = {
      'simple': 1.0,
      'medium': 1.5,
      'complex': 2.5
    };

    const baseLatency = baseLatencies[region] || 50;
    const complexityMultiplier = complexityMultipliers[pattern.characteristics.complexity];
    
    return Math.floor(baseLatency * complexityMultiplier * (0.8 + Math.random() * 0.4));
  }

  private calculateGenerationMetrics(result: LoadGenerationResult): void {
    const { transactions, metrics } = result;
    
    metrics.totalGenerated = transactions.length;
    metrics.actualTps = transactions.length / (result.duration / 1000);
    
    // Calculate average size
    const totalSize = transactions.reduce((sum, tx) => sum + tx.size, 0);
    metrics.averageSize = totalSize / transactions.length;
    
    // Calculate complexity distribution
    transactions.forEach(tx => {
      metrics.complexityDistribution[tx.complexity]++;
    });
    
    // Calculate type distribution
    transactions.forEach(tx => {
      metrics.typeDistribution[tx.type] = (metrics.typeDistribution[tx.type] || 0) + 1;
    });
    
    // Calculate regional distribution
    transactions.forEach(tx => {
      metrics.regionalDistribution[tx.metadata.region] = (metrics.regionalDistribution[tx.metadata.region] || 0) + 1;
    });
    
    // Calculate performance metrics
    metrics.performance.generationRate = metrics.actualTps;
    metrics.performance.memoryUsage = Math.floor(Math.random() * 100) + 50; // Simulated
    metrics.performance.cpuUsage = Math.floor(Math.random() * 80) + 20; // Simulated
    metrics.performance.errors = Math.floor(transactions.length * 0.001); // 0.1% error rate
  }

  getGenerationHistory(): LoadGenerationResult[] {
    return this.generationHistory;
  }

  getActiveGenerations(): LoadGenerationResult[] {
    return Array.from(this.activeGenerations.values());
  }

  getGeneration(generationId: string): LoadGenerationResult | undefined {
    return this.generationHistory.find(g => g.id === generationId) ||
           this.activeGenerations.get(generationId);
  }

  createCustomLoadProfile(config: {
    name: string;
    description: string;
    duration: number;
    phases: LoadProfile['phases'];
    overall: LoadProfile['overall'];
  }): LoadProfile {
    const profile: LoadProfile = {
      id: `custom-${Date.now()}`,
      name: config.name,
      description: config.description,
      duration: config.duration,
      phases: config.phases,
      overall: config.overall
    };

    this.loadProfiles.set(profile.id, profile);
    this.emit('profileCreated', profile);

    return profile;
  }

  analyzeTransactionPatterns(transactions: GeneratedTransaction[]): {
    patterns: { [key: string]: number };
    insights: string[];
    recommendations: string[];
  } {
    const patterns: { [key: string]: number } = {};
    const insights: string[] = [];
    const recommendations: string[] = [];

    // Analyze patterns
    transactions.forEach(tx => {
      patterns[tx.metadata.pattern] = (patterns[tx.metadata.pattern] || 0) + 1;
    });

    // Generate insights
    const totalTransactions = transactions.length;
    Object.entries(patterns).forEach(([pattern, count]) => {
      const percentage = (count / totalTransactions) * 100;
      if (percentage > 50) {
        insights.push(`${pattern} dominates with ${percentage.toFixed(1)}% of transactions`);
      }
    });

    // Generate recommendations
    const complexTransactions = transactions.filter(tx => tx.complexity === 'complex').length;
    const complexPercentage = (complexTransactions / totalTransactions) * 100;
    
    if (complexPercentage > 30) {
      recommendations.push('High percentage of complex transactions, consider optimizing smart contracts');
    }

    const avgSize = transactions.reduce((sum, tx) => sum + tx.size, 0) / transactions.length;
    if (avgSize > 2000) {
      recommendations.push('Large transaction sizes detected, consider batching or optimization');
    }

    return { patterns, insights, recommendations };
  }
}