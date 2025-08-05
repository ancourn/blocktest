/**
 * KALDRIX Economic Dashboard
 * 
 * This module implements a comprehensive economic dashboard for monitoring token metrics,
 * economic health, and financial performance of the KALDRIX ecosystem.
 */

import { QuantumCrypto } from '@/lib/quantum/crypto';
import { Database } from '@/lib/db';
import { Logger } from '@/lib/utils/logger';
import { KaldNativeCoin } from './native-coin';
import { TokenomicsModel } from './tokenomics';
import { CrossChainBridge } from './cross-chain-bridge';
import { PaymentModule } from './payment-module';
import { StakingRewardsSystem } from './staking-rewards';
import { GovernanceSystem } from './governance';

export interface DashboardConfig {
  refreshInterval: number; // in milliseconds
  dataRetentionDays: number;
  alertThresholds: {
    lowLiquidity: number;
    highInflation: number;
    lowStaking: number;
    lowParticipation: number;
  };
  chartDataPoints: number;
}

export interface EconomicMetrics {
  timestamp: Date;
  totalSupply: bigint;
  circulatingSupply: bigint;
  stakedSupply: bigint;
  burnedSupply: bigint;
  marketCap: bigint;
  pricePerToken: number;
  volume24h: bigint;
  holders: number;
  transactions24h: number;
  inflationRate: number;
  stakingParticipation: number;
  governanceParticipation: number;
  bridgeVolume: bigint;
  paymentVolume: bigint;
  rewardsDistributed: bigint;
}

export interface DashboardAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  category: 'liquidity' | 'inflation' | 'staking' | 'governance' | 'performance';
  title: string;
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isResolved: boolean;
  metadata?: Record<string, any>;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
  }[];
}

export interface EconomicSummary {
  totalValueLocked: bigint;
  marketCap: bigint;
  dailyVolume: bigint;
  weeklyVolume: bigint;
  monthlyVolume: bigint;
  activeUsers: number;
  stakingAPY: number;
  inflationRate: number;
  governanceHealth: number;
  bridgeEfficiency: number;
  paymentSuccessRate: number;
  overallHealth: number;
}

export class EconomicDashboard {
  private config: DashboardConfig;
  private quantumCrypto: QuantumCrypto;
  private db: Database;
  private logger: Logger;
  private kaldCoin: KaldNativeCoin;
  private tokenomics: TokenomicsModel;
  private bridge: CrossChainBridge;
  private payments: PaymentModule;
  private staking: StakingRewardsSystem;
  private governance: GovernanceSystem;
  
  private metrics: EconomicMetrics[] = [];
  private alerts: Map<string, DashboardAlert> = new Map();
  private chartCache: Map<string, ChartData> = new Map();
  private lastUpdate: Date = new Date();

  constructor(
    config: DashboardConfig,
    kaldCoin: KaldNativeCoin,
    tokenomics: TokenomicsModel,
    bridge: CrossChainBridge,
    payments: PaymentModule,
    staking: StakingRewardsSystem,
    governance: GovernanceSystem,
    db: Database
  ) {
    this.config = {
      refreshInterval: config.refreshInterval || 30000, // 30 seconds
      dataRetentionDays: config.dataRetentionDays || 30,
      alertThresholds: {
        lowLiquidity: config.alertThresholds?.lowLiquidity || 0.1, // 10%
        highInflation: config.alertThresholds?.highInflation || 0.05, // 5%
        lowStaking: config.alertThresholds?.lowStaking || 0.1, // 10%
        lowParticipation: config.alertThresholds?.lowParticipation || 0.05 // 5%
      },
      chartDataPoints: config.chartDataPoints || 24
    };

    this.kaldCoin = kaldCoin;
    this.tokenomics = tokenomics;
    this.bridge = bridge;
    this.payments = payments;
    this.staking = staking;
    this.governance = governance;
    this.db = db;
    this.quantumCrypto = new QuantumCrypto();
    this.logger = new Logger('EconomicDashboard');
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Load historical metrics
      await this.loadHistoricalMetrics();
      
      // Load active alerts
      await this.loadAlerts();
      
      // Start background services
      this.startBackgroundServices();
      
      this.logger.info('Economic dashboard initialized successfully', {
        refreshInterval: this.config.refreshInterval,
        dataRetentionDays: this.config.dataRetentionDays
      });
    } catch (error) {
      this.logger.error('Failed to initialize economic dashboard', error);
      throw error;
    }
  }

  private async loadHistoricalMetrics(): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - this.config.dataRetentionDays * 24 * 60 * 60 * 1000);
      
      const historicalMetrics = await this.db.economicMetric.findMany({
        where: {
          timestamp: {
            gte: cutoffDate
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 1000
      });

      for (const metric of historicalMetrics) {
        this.metrics.push({
          timestamp: new Date(metric.timestamp),
          totalSupply: BigInt(metric.totalSupply),
          circulatingSupply: BigInt(metric.circulatingSupply),
          stakedSupply: BigInt(metric.stakedSupply),
          burnedSupply: BigInt(metric.burnedSupply),
          marketCap: BigInt(metric.marketCap),
          pricePerToken: metric.pricePerToken,
          volume24h: BigInt(metric.volume24h),
          holders: metric.holders,
          transactions24h: metric.transactions24h,
          inflationRate: metric.inflationRate,
          stakingParticipation: metric.stakingParticipation,
          governanceParticipation: metric.governanceParticipation,
          bridgeVolume: BigInt(metric.bridgeVolume),
          paymentVolume: BigInt(metric.paymentVolume),
          rewardsDistributed: BigInt(metric.rewardsDistributed)
        });
      }

      this.logger.info(`Loaded ${historicalMetrics.length} historical metrics`);
    } catch (error) {
      this.logger.error('Failed to load historical metrics', error);
    }
  }

  private async loadAlerts(): Promise<void> {
    try {
      const activeAlerts = await this.db.dashboardAlert.findMany({
        where: { isResolved: false }
      });

      for (const alert of activeAlerts) {
        this.alerts.set(alert.id, {
          id: alert.id,
          type: alert.type as any,
          category: alert.category as any,
          title: alert.title,
          message: alert.message,
          timestamp: new Date(alert.timestamp),
          severity: alert.severity as any,
          isResolved: alert.isResolved,
          metadata: alert.metadata
        });
      }

      this.logger.info(`Loaded ${activeAlerts.length} active alerts`);
    } catch (error) {
      this.logger.error('Failed to load alerts', error);
    }
  }

  private startBackgroundServices(): void {
    // Update metrics
    setInterval(() => this.updateMetrics(), this.config.refreshInterval);
    
    // Check for alerts
    setInterval(() => this.checkAlerts(), 60000); // 1 minute
    
    // Clean up old data
    setInterval(() => this.cleanupOldData(), 3600000); // 1 hour
    
    // Update chart cache
    setInterval(() => this.updateChartCache(), 300000); // 5 minutes
  }

  public async getCurrentMetrics(): Promise<EconomicMetrics> {
    try {
      // Get supply information
      const supplyInfo = await this.kaldCoin.getSupplyInfo();
      
      // Get economic metrics from tokenomics
      const economicMetrics = await this.tokenomics.getEconomicMetrics();
      
      // Get bridge statistics
      const bridgeStats = this.bridge.getBridgeStats();
      
      // Get payment statistics
      const paymentStats = this.payments.getPaymentStats();
      
      // Get staking statistics
      const stakingStats = this.staking.getStakingStats();
      
      // Get governance statistics
      const governanceStats = this.governance.getGovernanceStats();
      
      // Calculate inflation rate
      const tokenomicsAnalysis = await this.tokenomics.analyzeTokenomics();
      
      // Create metrics
      const metrics: EconomicMetrics = {
        timestamp: new Date(),
        totalSupply: supplyInfo.totalSupply,
        circulatingSupply: supplyInfo.circulatingSupply,
        stakedSupply: supplyInfo.stakedSupply,
        burnedSupply: supplyInfo.burnedSupply,
        marketCap: economicMetrics.marketCap,
        pricePerToken: economicMetrics.pricePerToken,
        volume24h: economicMetrics.volume24h,
        holders: economicMetrics.holders,
        transactions24h: economicMetrics.transactions24h,
        inflationRate: tokenomicsAnalysis.inflationRate === 'high' ? 0.08 : 
                       tokenomicsAnalysis.inflationRate === 'medium' ? 0.03 : 0.015,
        stakingParticipation: stakingStats.stakingParticipation,
        governanceParticipation: governanceStats.averageVoterParticipation,
        bridgeVolume: bridgeStats.totalVolume,
        paymentVolume: paymentStats.totalVolume,
        rewardsDistributed: stakingStats.totalRewards
      };

      return metrics;
    } catch (error) {
      this.logger.error('Failed to get current metrics', error);
      throw error;
    }
  }

  public async getEconomicSummary(): Promise<EconomicSummary> {
    try {
      const currentMetrics = await this.getCurrentMetrics();
      const stakingStats = this.staking.getStakingStats();
      const governanceStats = this.governance.getGovernanceStats();
      const paymentStats = this.payments.getPaymentStats();
      const bridgeStats = this.bridge.getBridgeStats();
      
      // Calculate Total Value Locked (TVL)
      const totalValueLocked = currentMetrics.stakedSupply + currentMetrics.circulatingSupply * BigInt(1000000000000000000) / 10n;
      
      // Calculate volume metrics
      const dailyVolume = currentMetrics.volume24h;
      const weeklyVolume = dailyVolume * 7n;
      const monthlyVolume = dailyVolume * 30n;
      
      // Calculate active users (simplified)
      const activeUsers = currentMetrics.holders;
      
      // Calculate staking APY
      const stakingAPY = stakingStats.dailyRewards > 0n 
        ? (Number(stakingStats.dailyRewards) * 365 / Number(currentMetrics.stakedSupply)) * 100
        : 0;
      
      // Calculate governance health
      const governanceHealth = governanceStats.averageVoterParticipation * 100;
      
      // Calculate bridge efficiency
      const bridgeEfficiency = bridgeStats.totalTransfers > 0 
        ? bridgeStats.successRate * 100
        : 0;
      
      // Calculate payment success rate
      const paymentSuccessRate = paymentStats.successRate * 100;
      
      // Calculate overall health score
      const overallHealth = this.calculateOverallHealth(
        currentMetrics,
        stakingStats,
        governanceStats,
        paymentStats,
        bridgeStats
      );

      return {
        totalValueLocked,
        marketCap: currentMetrics.marketCap,
        dailyVolume,
        weeklyVolume,
        monthlyVolume,
        activeUsers,
        stakingAPY,
        inflationRate: currentMetrics.inflationRate,
        governanceHealth,
        bridgeEfficiency,
        paymentSuccessRate,
        overallHealth
      };
    } catch (error) {
      this.logger.error('Failed to get economic summary', error);
      throw error;
    }
  }

  public async getChartData(type: string, period: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<ChartData> {
    try {
      const cacheKey = `${type}_${period}`;
      
      // Check cache first
      if (this.chartCache.has(cacheKey)) {
        return this.chartCache.get(cacheKey)!;
      }
      
      // Generate chart data
      const chartData = await this.generateChartData(type, period);
      
      // Cache the result
      this.chartCache.set(cacheKey, chartData);
      
      return chartData;
    } catch (error) {
      this.logger.error('Failed to get chart data', error);
      throw error;
    }
  }

  public async getAlerts(category?: string): Promise<DashboardAlert[]> {
    try {
      const alerts = Array.from(this.alerts.values());
      
      if (category) {
        return alerts.filter(alert => alert.category === category && !alert.isResolved);
      }
      
      return alerts.filter(alert => !alert.isResolved);
    } catch (error) {
      this.logger.error('Failed to get alerts', error);
      throw error;
    }
  }

  public async createAlert(
    type: 'warning' | 'error' | 'info',
    category: 'liquidity' | 'inflation' | 'staking' | 'governance' | 'performance',
    title: string,
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    metadata?: Record<string, any>
  ): Promise<DashboardAlert> {
    try {
      const alert: DashboardAlert = {
        id: this.generateAlertId(),
        type,
        category,
        title,
        message,
        timestamp: new Date(),
        severity,
        isResolved: false,
        metadata
      };

      this.alerts.set(alert.id, alert);
      
      // Save to database
      await this.saveAlert(alert);

      this.logger.info('Alert created', {
        alertId: alert.id,
        type,
        category,
        severity,
        title
      });

      return alert;
    } catch (error) {
      this.logger.error('Failed to create alert', error);
      throw error;
    }
  }

  public async resolveAlert(alertId: string): Promise<void> {
    try {
      const alert = this.alerts.get(alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }

      alert.isResolved = true;
      
      // Update database
      await this.updateAlert(alert);

      this.logger.info('Alert resolved', {
        alertId,
        title: alert.title
      });
    } catch (error) {
      this.logger.error('Failed to resolve alert', error);
      throw error;
    }
  }

  private async updateMetrics(): Promise<void> {
    try {
      const currentMetrics = await this.getCurrentMetrics();
      
      // Add to metrics array
      this.metrics.unshift(currentMetrics);
      
      // Keep only recent metrics
      const maxMetrics = this.config.dataRetentionDays * 24 * 60; // Assuming 1-minute intervals
      if (this.metrics.length > maxMetrics) {
        this.metrics = this.metrics.slice(0, maxMetrics);
      }
      
      // Save to database
      await this.saveMetrics(currentMetrics);
      
      // Update last update time
      this.lastUpdate = new Date();
      
      this.logger.debug('Metrics updated');
    } catch (error) {
      this.logger.error('Failed to update metrics', error);
    }
  }

  private async checkAlerts(): Promise<void> {
    try {
      const currentMetrics = await this.getCurrentMetrics();
      const stakingStats = this.staking.getStakingStats();
      const governanceStats = this.governance.getGovernanceStats();
      const bridgeStats = this.bridge.getBridgeStats();
      
      // Check liquidity alerts
      await this.checkLiquidityAlerts(currentMetrics, bridgeStats);
      
      // Check inflation alerts
      await this.checkInflationAlerts(currentMetrics);
      
      // Check staking alerts
      await this.checkStakingAlerts(currentMetrics, stakingStats);
      
      // Check governance alerts
      await this.checkGovernanceAlerts(currentMetrics, governanceStats);
      
      // Check performance alerts
      await this.checkPerformanceAlerts(currentMetrics, bridgeStats);
    } catch (error) {
      this.logger.error('Failed to check alerts', error);
    }
  }

  private async checkLiquidityAlerts(metrics: EconomicMetrics, bridgeStats: any): Promise<void> {
    // Check bridge liquidity
    const totalLiquidity = Number(bridgeStats.totalLiquidity) / 1e18;
    const totalVolume = Number(bridgeStats.totalVolume) / 1e18;
    
    if (totalLiquidity > 0 && totalVolume / totalLiquidity > 0.8) {
      await this.createAlert(
        'warning',
        'liquidity',
        'High Bridge Utilization',
        `Bridge utilization is at ${(totalVolume / totalLiquidity * 100).toFixed(1)}%. Consider adding more liquidity.`,
        'medium',
        { utilization: totalVolume / totalLiquidity }
      );
    }
  }

  private async checkInflationAlerts(metrics: EconomicMetrics): Promise<void> {
    if (metrics.inflationRate > this.config.alertThresholds.highInflation) {
      await this.createAlert(
        'warning',
        'inflation',
        'High Inflation Rate',
        `Inflation rate is ${(metrics.inflationRate * 100).toFixed(2)}%, exceeding the threshold of ${(this.config.alertThresholds.highInflation * 100).toFixed(2)}%.`,
        'high',
        { inflationRate: metrics.inflationRate }
      );
    }
  }

  private async checkStakingAlerts(metrics: EconomicMetrics, stakingStats: any): Promise<void> {
    if (metrics.stakingParticipation < this.config.alertThresholds.lowStaking) {
      await this.createAlert(
        'warning',
        'staking',
        'Low Staking Participation',
        `Staking participation is ${(metrics.stakingParticipation * 100).toFixed(1)}%, below the threshold of ${(this.config.alertThresholds.lowStaking * 100).toFixed(1)}%.`,
        'medium',
        { stakingParticipation: metrics.stakingParticipation }
      );
    }
  }

  private async checkGovernanceAlerts(metrics: EconomicMetrics, governanceStats: any): Promise<void> {
    if (metrics.governanceParticipation < this.config.alertThresholds.lowParticipation) {
      await this.createAlert(
        'warning',
        'governance',
        'Low Governance Participation',
        `Governance participation is ${(metrics.governanceParticipation * 100).toFixed(1)}%, below the threshold of ${(this.config.alertThresholds.lowParticipation * 100).toFixed(1)}%.`,
        'medium',
        { governanceParticipation: metrics.governanceParticipation }
      );
    }
  }

  private async checkPerformanceAlerts(metrics: EconomicMetrics, bridgeStats: any): Promise<void> {
    // Check bridge success rate
    if (bridgeStats.successRate < 0.95) {
      await this.createAlert(
        'error',
        'performance',
        'Low Bridge Success Rate',
        `Bridge success rate is ${(bridgeStats.successRate * 100).toFixed(1)}%, below the acceptable threshold.`,
        'high',
        { successRate: bridgeStats.successRate }
      );
    }
  }

  private async generateChartData(type: string, period: '1h' | '24h' | '7d' | '30d'): Promise<ChartData> {
    try {
      const now = new Date();
      let startTime: Date;
      let interval: number;
      let dataPoints: number;
      
      switch (period) {
        case '1h':
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
          interval = 5 * 60 * 1000; // 5 minutes
          dataPoints = 12;
          break;
        case '24h':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          interval = 60 * 60 * 1000; // 1 hour
          dataPoints = 24;
          break;
        case '7d':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          interval = 24 * 60 * 60 * 1000; // 1 day
          dataPoints = 7;
          break;
        case '30d':
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          interval = 24 * 60 * 60 * 1000; // 1 day
          dataPoints = 30;
          break;
      }
      
      // Filter metrics for the period
      const periodMetrics = this.metrics.filter(m => m.timestamp >= startTime);
      
      // Generate labels
      const labels: string[] = [];
      for (let i = 0; i < dataPoints; i++) {
        const time = new Date(startTime.getTime() + i * interval);
        labels.push(time.toLocaleTimeString());
      }
      
      // Generate data based on type
      switch (type) {
        case 'price':
          return this.generatePriceChart(labels, periodMetrics);
        case 'volume':
          return this.generateVolumeChart(labels, periodMetrics);
        case 'staking':
          return this.generateStakingChart(labels, periodMetrics);
        case 'supply':
          return this.generateSupplyChart(labels, periodMetrics);
        case 'inflation':
          return this.generateInflationChart(labels, periodMetrics);
        default:
          throw new Error('Unknown chart type');
      }
    } catch (error) {
      this.logger.error('Failed to generate chart data', error);
      throw error;
    }
  }

  private generatePriceChart(labels: string[], metrics: EconomicMetrics[]): ChartData {
    const data = metrics.map(m => m.pricePerToken);
    
    return {
      labels,
      datasets: [{
        label: 'Price (USD)',
        data,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true
      }]
    };
  }

  private generateVolumeChart(labels: string[], metrics: EconomicMetrics[]): ChartData {
    const data = metrics.map(m => Number(m.volume24h) / 1e18);
    
    return {
      labels,
      datasets: [{
        label: 'Volume (USD)',
        data,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true
      }]
    };
  }

  private generateStakingChart(labels: string[], metrics: EconomicMetrics[]): ChartData {
    const data = metrics.map(m => m.stakingParticipation * 100);
    
    return {
      labels,
      datasets: [{
        label: 'Staking Participation (%)',
        data,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true
      }]
    };
  }

  private generateSupplyChart(labels: string[], metrics: EconomicMetrics[]): ChartData {
    const circulatingData = metrics.map(m => Number(m.circulatingSupply) / 1e18);
    const stakedData = metrics.map(m => Number(m.stakedSupply) / 1e18);
    
    return {
      labels,
      datasets: [
        {
          label: 'Circulating Supply',
          data: circulatingData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: false
        },
        {
          label: 'Staked Supply',
          data: stakedData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: false
        }
      ]
    };
  }

  private generateInflationChart(labels: string[], metrics: EconomicMetrics[]): ChartData {
    const data = metrics.map(m => m.inflationRate * 100);
    
    return {
      labels,
      datasets: [{
        label: 'Inflation Rate (%)',
        data,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true
      }]
    };
  }

  private calculateOverallHealth(
    metrics: EconomicMetrics,
    stakingStats: any,
    governanceStats: any,
    paymentStats: any,
    bridgeStats: any
  ): number {
    let healthScore = 0;
    
    // Inflation health (0-20 points)
    if (metrics.inflationRate <= 0.02) healthScore += 20;
    else if (metrics.inflationRate <= 0.05) healthScore += 15;
    else if (metrics.inflationRate <= 0.08) healthScore += 10;
    else healthScore += 5;
    
    // Staking health (0-20 points)
    if (metrics.stakingParticipation >= 0.5) healthScore += 20;
    else if (metrics.stakingParticipation >= 0.3) healthScore += 15;
    else if (metrics.stakingParticipation >= 0.1) healthScore += 10;
    else healthScore += 5;
    
    // Governance health (0-20 points)
    if (metrics.governanceParticipation >= 0.3) healthScore += 20;
    else if (metrics.governanceParticipation >= 0.1) healthScore += 15;
    else if (metrics.governanceParticipation >= 0.05) healthScore += 10;
    else healthScore += 5;
    
    // Payment health (0-20 points)
    if (paymentStats.successRate >= 0.99) healthScore += 20;
    else if (paymentStats.successRate >= 0.95) healthScore += 15;
    else if (paymentStats.successRate >= 0.9) healthScore += 10;
    else healthScore += 5;
    
    // Bridge health (0-20 points)
    if (bridgeStats.successRate >= 0.99) healthScore += 20;
    else if (bridgeStats.successRate >= 0.95) healthScore += 15;
    else if (bridgeStats.successRate >= 0.9) healthScore += 10;
    else healthScore += 5;
    
    return Math.min(100, healthScore);
  }

  private async cleanupOldData(): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - this.config.dataRetentionDays * 24 * 60 * 60 * 1000);
      
      // Clean up old metrics
      await this.db.economicMetric.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      });
      
      // Clean up old alerts
      await this.db.dashboardAlert.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          },
          isResolved: true
        }
      });
      
      this.logger.info('Cleaned up old data');
    } catch (error) {
      this.logger.error('Failed to cleanup old data', error);
    }
  }

  private async updateChartCache(): Promise<void> {
    try {
      // Clear cache
      this.chartCache.clear();
      
      this.logger.debug('Chart cache updated');
    } catch (error) {
      this.logger.error('Failed to update chart cache', error);
    }
  }

  private async saveMetrics(metrics: EconomicMetrics): Promise<void> {
    await this.db.economicMetric.create({
      data: {
        timestamp: metrics.timestamp,
        totalSupply: metrics.totalSupply.toString(),
        circulatingSupply: metrics.circulatingSupply.toString(),
        stakedSupply: metrics.stakedSupply.toString(),
        burnedSupply: metrics.burnedSupply.toString(),
        marketCap: metrics.marketCap.toString(),
        pricePerToken: metrics.pricePerToken,
        volume24h: metrics.volume24h.toString(),
        holders: metrics.holders,
        transactions24h: metrics.transactions24h,
        inflationRate: metrics.inflationRate,
        stakingParticipation: metrics.stakingParticipation,
        governanceParticipation: metrics.governanceParticipation,
        bridgeVolume: metrics.bridgeVolume.toString(),
        paymentVolume: metrics.paymentVolume.toString(),
        rewardsDistributed: metrics.rewardsDistributed.toString()
      }
    });
  }

  private async saveAlert(alert: DashboardAlert): Promise<void> {
    await this.db.dashboardAlert.create({
      data: {
        id: alert.id,
        type: alert.type,
        category: alert.category,
        title: alert.title,
        message: alert.message,
        timestamp: alert.timestamp,
        severity: alert.severity,
        isResolved: alert.isResolved,
        metadata: alert.metadata
      }
    });
  }

  private async updateAlert(alert: DashboardAlert): Promise<void> {
    await this.db.dashboardAlert.update({
      where: { id: alert.id },
      data: {
        isResolved: alert.isResolved
      }
    });
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getLastUpdateTime(): Date {
    return this.lastUpdate;
  }

  public getConfig(): DashboardConfig {
    return { ...this.config };
  }
}