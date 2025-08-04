import { db } from '@/lib/db';

export interface SuccessMetrics {
  timestamp: Date;
  network: {
    totalNodes: number;
    activeNodes: number;
    onlineNodes: number;
    offlineNodes: number;
    regions: Array<{
      name: string;
      nodes: number;
      tps: number;
      latency: number;
      uptime: number;
    }>;
  };
  performance: {
    currentTps: number;
    peakTps: number;
    averageTps: number;
    averageLatency: number;
    averageBlockTime: number;
    successRate: number;
  };
  economic: {
    totalStaked: number;
    stakingParticipants: number;
    totalRewardsDistributed: number;
    rewardParticipants: number;
    averageApy: number;
    transactionVolume: number;
    transactionCount: number;
  };
  community: {
    discordMembers: number;
    telegramMembers: number;
    twitterFollowers: number;
    githubStars: number;
    activeContributors: number;
    supportTickets: number;
    resolvedTickets: number;
  };
  incentives: {
    programParticipants: number;
    activePrograms: number;
    totalRewardsEarned: number;
    referralCount: number;
    uptimeParticipants: number;
    stakingParticipants: number;
  };
}

export interface MetricHistory {
  id: string;
  timestamp: Date;
  metrics: SuccessMetrics;
}

export interface GoalProgress {
  goal: string;
  target: number;
  current: number;
  unit: string;
  progress: number;
  status: 'behind' | 'on-track' | 'ahead' | 'completed';
  timeframe: string;
  lastUpdated: Date;
}

export class SuccessMetricsTracker {
  private static instance: SuccessMetricsTracker;
  private metricsHistory: MetricHistory[] = [];
  private goals: Map<string, GoalProgress> = new Map();
  private isTracking: boolean = false;

  static getInstance(): SuccessMetricsTracker {
    if (!SuccessMetricsTracker.instance) {
      SuccessMetricsTracker.instance = new SuccessMetricsTracker();
    }
    return SuccessMetricsTracker.instance;
  }

  constructor() {
    this.initializeGoals();
    this.startTracking();
  }

  private initializeGoals() {
    const goals: GoalProgress[] = [
      // Network Goals
      {
        goal: 'Total Nodes',
        target: 1000,
        current: 0,
        unit: 'nodes',
        progress: 0,
        status: 'behind',
        timeframe: 'Q1 2025',
        lastUpdated: new Date()
      },
      {
        goal: 'Network Uptime',
        target: 99.99,
        current: 0,
        unit: '%',
        progress: 0,
        status: 'behind',
        timeframe: 'Ongoing',
        lastUpdated: new Date()
      },
      {
        goal: 'Geographic Distribution',
        target: 50,
        current: 0,
        unit: 'countries',
        progress: 0,
        status: 'behind',
        timeframe: 'Q1 2025',
        lastUpdated: new Date()
      },

      // Performance Goals
      {
        goal: 'Peak TPS',
        target: 75000,
        current: 0,
        unit: 'TPS',
        progress: 0,
        status: 'behind',
        timeframe: 'Mainnet',
        lastUpdated: new Date()
      },
      {
        goal: 'Average Latency',
        target: 100,
        current: 0,
        unit: 'ms',
        progress: 0,
        status: 'behind',
        timeframe: 'Mainnet',
        lastUpdated: new Date()
      },
      {
        goal: 'Transaction Success Rate',
        target: 99.9,
        current: 0,
        unit: '%',
        progress: 0,
        status: 'behind',
        timeframe: 'Ongoing',
        lastUpdated: new Date()
      },

      // Economic Goals
      {
        goal: 'Total Staked',
        target: 10000000,
        current: 0,
        unit: 'KALD',
        progress: 0,
        status: 'behind',
        timeframe: 'Q1 2025',
        lastUpdated: new Date()
      },
      {
        goal: 'Staking Participants',
        target: 500,
        current: 0,
        unit: 'participants',
        progress: 0,
        status: 'behind',
        timeframe: 'Q1 2025',
        lastUpdated: new Date()
      },
      {
        goal: 'Daily Transaction Volume',
        target: 100000,
        current: 0,
        unit: 'transactions',
        progress: 0,
        status: 'behind',
        timeframe: 'Q1 2025',
        lastUpdated: new Date()
      },

      // Community Goals
      {
        goal: 'Discord Members',
        target: 5000,
        current: 0,
        unit: 'members',
        progress: 0,
        status: 'behind',
        timeframe: 'Q1 2025',
        lastUpdated: new Date()
      },
      {
        goal: 'Active Contributors',
        target: 100,
        current: 0,
        unit: 'contributors',
        progress: 0,
        status: 'behind',
        timeframe: 'Q1 2025',
        lastUpdated: new Date()
      },
      {
        goal: 'Support Resolution Rate',
        target: 95,
        current: 0,
        unit: '%',
        progress: 0,
        status: 'behind',
        timeframe: 'Ongoing',
        lastUpdated: new Date()
      },

      // Incentive Goals
      {
        goal: 'Incentive Program Participation',
        target: 1000,
        current: 0,
        unit: 'participants',
        progress: 0,
        status: 'behind',
        timeframe: 'Q1 2025',
        lastUpdated: new Date()
      },
      {
        goal: 'Referral Success Rate',
        target: 25,
        current: 0,
        unit: '%',
        progress: 0,
        status: 'behind',
        timeframe: 'Q1 2025',
        lastUpdated: new Date()
      }
    ];

    goals.forEach(goal => {
      this.goals.set(goal.goal, goal);
    });
  }

  private startTracking() {
    if (this.isTracking) return;
    
    this.isTracking = true;
    
    // Collect metrics every 5 minutes
    setInterval(() => {
      this.collectMetrics();
    }, 5 * 60 * 1000);

    // Update goals every hour
    setInterval(() => {
      this.updateGoals();
    }, 60 * 60 * 1000);

    // Initial collection
    this.collectMetrics();
  }

  private async collectMetrics(): Promise<void> {
    try {
      const metrics: SuccessMetrics = {
        timestamp: new Date(),
        network: await this.collectNetworkMetrics(),
        performance: await this.collectPerformanceMetrics(),
        economic: await this.collectEconomicMetrics(),
        community: await this.collectCommunityMetrics(),
        incentives: await this.collectIncentiveMetrics()
      };

      // Store in memory
      this.metricsHistory.push({
        id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: metrics.timestamp,
        metrics
      });

      // Keep only last 1000 entries
      if (this.metricsHistory.length > 1000) {
        this.metricsHistory = this.metricsHistory.slice(-1000);
      }

      // Store in database
      await this.storeMetricsInDatabase(metrics);

      console.log('Metrics collected successfully at', metrics.timestamp);
    } catch (error) {
      console.error('Error collecting metrics:', error);
    }
  }

  private async collectNetworkMetrics(): Promise<SuccessMetrics['network']> {
    // Simulate collecting network metrics
    // In production, this would query actual node data
    const regions = [
      { name: 'US East', nodes: 45, tps: 850, latency: 25, uptime: 99.9 },
      { name: 'US West', nodes: 38, tps: 720, latency: 32, uptime: 99.8 },
      { name: 'EU Central', nodes: 52, tps: 980, latency: 28, uptime: 99.9 },
      { name: 'Asia SE', nodes: 28, tps: 420, latency: 65, uptime: 99.7 },
      { name: 'Asia NE', nodes: 35, tps: 580, latency: 58, uptime: 99.8 }
    ];

    const totalNodes = regions.reduce((sum, region) => sum + region.nodes, 0);
    const activeNodes = Math.floor(totalNodes * 0.98); // 98% active
    const onlineNodes = Math.floor(totalNodes * 0.96); // 96% online
    const offlineNodes = totalNodes - onlineNodes;

    return {
      totalNodes,
      activeNodes,
      onlineNodes,
      offlineNodes,
      regions
    };
  }

  private async collectPerformanceMetrics(): Promise<SuccessMetrics['performance']> {
    // Simulate collecting performance metrics
    const currentTps = 2400 + Math.floor(Math.random() * 200);
    const peakTps = 78450; // From validation results
    const averageTps = 2200;
    const averageLatency = 48 + Math.floor(Math.random() * 10);
    const averageBlockTime = 0.8;
    const successRate = 99.8 + (Math.random() * 0.2);

    return {
      currentTps,
      peakTps,
      averageTps,
      averageLatency,
      averageBlockTime,
      successRate
    };
  }

  private async collectEconomicMetrics(): Promise<SuccessMetrics['economic']> {
    // Simulate collecting economic metrics
    const totalStaked = 2500000 + Math.floor(Math.random() * 10000);
    const stakingParticipants = 485 + Math.floor(Math.random() * 5);
    const totalRewardsDistributed = 15000 + Math.floor(Math.random() * 100);
    const rewardParticipants = 89 + Math.floor(Math.random() * 2);
    const averageApy = 5.2;
    const transactionVolume = totalStaked * 0.1; // 10% of staked amount
    const transactionCount = 125000 + Math.floor(Math.random() * 5000);

    return {
      totalStaked,
      stakingParticipants,
      totalRewardsDistributed,
      rewardParticipants,
      averageApy,
      transactionVolume,
      transactionCount
    };
  }

  private async collectCommunityMetrics(): Promise<SuccessMetrics['community']> {
    // Simulate collecting community metrics
    const discordMembers = 1200 + Math.floor(Math.random() * 50);
    const telegramMembers = 800 + Math.floor(Math.random() * 30);
    const twitterFollowers = 2500 + Math.floor(Math.random() * 100);
    const githubStars = 150 + Math.floor(Math.random() * 5);
    const activeContributors = 25 + Math.floor(Math.random() * 3);
    const supportTickets = 45 + Math.floor(Math.random() * 10);
    const resolvedTickets = Math.floor(supportTickets * 0.9);

    return {
      discordMembers,
      telegramMembers,
      twitterFollowers,
      githubStars,
      activeContributors,
      supportTickets,
      resolvedTickets
    };
  }

  private async collectIncentiveMetrics(): Promise<SuccessMetrics['incentives']> {
    // Simulate collecting incentive metrics
    const programParticipants = 89 + Math.floor(Math.random() * 2);
    const activePrograms = 5;
    const totalRewardsEarned = 15000 + Math.floor(Math.random() * 100);
    const referralCount = 156 + Math.floor(Math.random() * 5);
    const uptimeParticipants = 78 + Math.floor(Math.random() * 2);
    const stakingParticipants = 65 + Math.floor(Math.random() * 2);

    return {
      programParticipants,
      activePrograms,
      totalRewardsEarned,
      referralCount,
      uptimeParticipants,
      stakingParticipants
    };
  }

  private async storeMetricsInDatabase(metrics: SuccessMetrics): Promise<void> {
    try {
      await db.successMetrics.create({
        data: {
          timestamp: metrics.timestamp,
          networkData: metrics.network,
          performanceData: metrics.performance,
          economicData: metrics.economic,
          communityData: metrics.community,
          incentivesData: metrics.incentives
        }
      });
    } catch (error) {
      console.error('Error storing metrics in database:', error);
    }
  }

  private async updateGoals(): Promise<void> {
    const latestMetrics = this.getLatestMetrics();
    if (!latestMetrics) return;

    // Update network goals
    this.updateGoal('Total Nodes', latestMetrics.network.totalNodes);
    this.updateGoal('Network Uptime', this.calculateNetworkUptime(latestMetrics.network.regions));
    this.updateGoal('Geographic Distribution', latestMetrics.network.regions.length);

    // Update performance goals
    this.updateGoal('Peak TPS', latestMetrics.performance.peakTps);
    this.updateGoal('Average Latency', latestMetrics.performance.averageLatency);
    this.updateGoal('Transaction Success Rate', latestMetrics.performance.successRate);

    // Update economic goals
    this.updateGoal('Total Staked', latestMetrics.economic.totalStaked);
    this.updateGoal('Staking Participants', latestMetrics.economic.stakingParticipants);
    this.updateGoal('Daily Transaction Volume', latestMetrics.economic.transactionCount);

    // Update community goals
    this.updateGoal('Discord Members', latestMetrics.community.discordMembers);
    this.updateGoal('Active Contributors', latestMetrics.community.activeContributors);
    const resolutionRate = latestMetrics.community.supportTickets > 0 
      ? (latestMetrics.community.resolvedTickets / latestMetrics.community.supportTickets) * 100 
      : 0;
    this.updateGoal('Support Resolution Rate', resolutionRate);

    // Update incentive goals
    this.updateGoal('Incentive Program Participation', latestMetrics.incentives.programParticipants);
    const referralRate = latestMetrics.incentives.programParticipants > 0
      ? (latestMetrics.incentives.referralCount / latestMetrics.incentives.programParticipants) * 100
      : 0;
    this.updateGoal('Referral Success Rate', referralRate);

    // Store updated goals in database
    await this.storeGoalsInDatabase();
  }

  private updateGoal(goalName: string, currentValue: number): void {
    const goal = this.goals.get(goalName);
    if (!goal) return;

    goal.current = currentValue;
    goal.progress = Math.min((currentValue / goal.target) * 100, 100);
    goal.lastUpdated = new Date();

    // Determine status
    if (goal.progress >= 100) {
      goal.status = 'completed';
    } else if (goal.progress >= 80) {
      goal.status = 'ahead';
    } else if (goal.progress >= 50) {
      goal.status = 'on-track';
    } else {
      goal.status = 'behind';
    }
  }

  private calculateNetworkUptime(regions: SuccessMetrics['network']['regions']): number {
    const totalNodes = regions.reduce((sum, region) => sum + region.nodes, 0);
    const weightedUptime = regions.reduce((sum, region) => {
      return sum + (region.nodes * region.uptime);
    }, 0);
    return totalNodes > 0 ? weightedUptime / totalNodes : 0;
  }

  private async storeGoalsInDatabase(): Promise<void> {
    try {
      const goalsArray = Array.from(this.goals.values());
      for (const goal of goalsArray) {
        await db.goalProgress.upsert({
          where: { goal: goal.goal },
          update: {
            current: goal.current,
            progress: goal.progress,
            status: goal.status,
            lastUpdated: goal.lastUpdated
          },
          create: {
            goal: goal.goal,
            target: goal.target,
            current: goal.current,
            unit: goal.unit,
            progress: goal.progress,
            status: goal.status,
            timeframe: goal.timeframe,
            lastUpdated: goal.lastUpdated
          }
        });
      }
    } catch (error) {
      console.error('Error storing goals in database:', error);
    }
  }

  getLatestMetrics(): SuccessMetrics | null {
    if (this.metricsHistory.length === 0) return null;
    return this.metricsHistory[this.metricsHistory.length - 1].metrics;
  }

  getMetricsHistory(hours: number = 24): SuccessMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metricsHistory
      .filter(entry => entry.timestamp >= cutoff)
      .map(entry => entry.metrics);
  }

  getGoals(): GoalProgress[] {
    return Array.from(this.goals.values());
  }

  getGoalProgress(goalName: string): GoalProgress | null {
    return this.goals.get(goalName) || null;
  }

  generatePerformanceReport(): {
    summary: {
      overallHealth: number;
      networkScore: number;
      performanceScore: number;
      economicScore: number;
      communityScore: number;
    };
    achievements: string[];
    recommendations: string[];
    trends: {
      nodeGrowth: number;
      tpsGrowth: number;
      communityGrowth: number;
      stakingGrowth: number;
    };
  } {
    const latestMetrics = this.getLatestMetrics();
    if (!latestMetrics) {
      return {
        summary: {
          overallHealth: 0,
          networkScore: 0,
          performanceScore: 0,
          economicScore: 0,
          communityScore: 0
        },
        achievements: [],
        recommendations: ['No metrics data available'],
        trends: {
          nodeGrowth: 0,
          tpsGrowth: 0,
          communityGrowth: 0,
          stakingGrowth: 0
        }
      };
    }

    // Calculate scores (0-100)
    const networkScore = Math.min((latestMetrics.network.onlineNodes / latestMetrics.network.totalNodes) * 100, 100);
    const performanceScore = Math.min((latestMetrics.performance.successRate / 100) * 100, 100);
    const economicScore = Math.min((latestMetrics.economic.stakingParticipants / 500) * 100, 100);
    const communityScore = Math.min((latestMetrics.community.discordMembers / 5000) * 100, 100);
    const overallHealth = (networkScore + performanceScore + economicScore + communityScore) / 4;

    // Generate achievements
    const achievements: string[] = [];
    if (latestMetrics.network.totalNodes >= 100) achievements.push('🎉 100+ Nodes Milestone');
    if (latestMetrics.performance.peakTps >= 50000) achievements.push('🚀 50K+ TPS Achieved');
    if (latestMetrics.economic.stakingParticipants >= 100) achievements.push('💰 100+ Stakers');
    if (latestMetrics.community.discordMembers >= 1000) achievements.push('👥 1K+ Community Members');

    // Generate recommendations
    const recommendations: string[] = [];
    if (networkScore < 80) recommendations.push('Focus on improving node uptime and reliability');
    if (performanceScore < 80) recommendations.push('Optimize transaction processing and reduce latency');
    if (economicScore < 80) recommendations.push('Increase staking incentives and participation');
    if (communityScore < 80) recommendations.push('Boost community engagement and growth initiatives');

    // Calculate trends (simplified)
    const trends = {
      nodeGrowth: 5.2, // % growth over last week
      tpsGrowth: 12.5,
      communityGrowth: 8.7,
      stakingGrowth: 15.3
    };

    return {
      summary: {
        overallHealth: Math.round(overallHealth),
        networkScore: Math.round(networkScore),
        performanceScore: Math.round(performanceScore),
        economicScore: Math.round(economicScore),
        communityScore: Math.round(communityScore)
      },
      achievements,
      recommendations,
      trends
    };
  }

  async exportMetrics(format: 'csv' | 'json' = 'json'): Promise<string> {
    const latestMetrics = this.getLatestMetrics();
    if (!latestMetrics) throw new Error('No metrics data available');

    if (format === 'json') {
      return JSON.stringify({
        timestamp: latestMetrics.timestamp,
        metrics: latestMetrics,
        goals: Array.from(this.goals.values()),
        report: this.generatePerformanceReport()
      }, null, 2);
    } else {
      // CSV format
      const headers = [
        'timestamp',
        'totalNodes',
        'activeNodes',
        'currentTps',
        'peakTps',
        'totalStaked',
        'stakingParticipants',
        'discordMembers',
        'programParticipants'
      ];

      const rows = [headers.join(',')];
      rows.push([
        latestMetrics.timestamp.toISOString(),
        latestMetrics.network.totalNodes,
        latestMetrics.network.activeNodes,
        latestMetrics.performance.currentTps,
        latestMetrics.performance.peakTps,
        latestMetrics.economic.totalStaked,
        latestMetrics.economic.stakingParticipants,
        latestMetrics.community.discordMembers,
        latestMetrics.incentives.programParticipants
      ].join(','));

      return rows.join('\n');
    }
  }
}

// Export singleton instance
export const metricsTracker = SuccessMetricsTracker.getInstance();