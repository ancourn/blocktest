/**
 * KALDRIX Tokenomics Model
 * 
 * This module implements a comprehensive economic model for the KALDRIX ecosystem,
 * including supply dynamics, inflation control, reward mechanisms, and economic
 * sustainability analysis.
 */

import { KaldNativeCoin } from './native-coin';
import { Database } from '@/lib/db';
import { Logger } from '@/lib/utils/logger';

export interface TokenomicsConfig {
  initialSupply: bigint;
  maxSupply: bigint;
  annualInflationRate: number;
  stakingRewardsRate: number;
  developmentFundRate: number;
  ecosystemFundRate: number;
  liquidityMiningRate: number;
  burnRate: number;
  halvingCycle: number; // in years
}

export interface SupplyMetrics {
  totalSupply: bigint;
  circulatingSupply: bigint;
  stakedSupply: bigint;
  burnedSupply: bigint;
  inflationRate: number;
  annualInflation: bigint;
  nextHalving: Date;
  blocksUntilHalving: number;
}

export interface RewardDistribution {
  stakingRewards: bigint;
  developmentFund: bigint;
  ecosystemFund: bigint;
  liquidityMining: bigint;
  burnAmount: bigint;
  totalRewards: bigint;
}

export interface EconomicMetrics {
  marketCap: bigint;
  pricePerToken: number;
  volume24h: bigint;
  marketCapRank: number;
  liquidity: bigint;
  holders: number;
  transactions24h: number;
}

export interface TokenomicsAnalysis {
  sustainabilityScore: number;
  inflationPressure: 'low' | 'medium' | 'high';
  stakingParticipation: number;
  economicHealth: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
}

export class TokenomicsModel {
  private config: TokenomicsConfig;
  private kaldCoin: KaldNativeCoin;
  private db: Database;
  private logger: Logger;
  private startTime: Date;
  private blockTime: number; // in seconds
  private blocksPerYear: number;

  constructor(config: TokenomicsConfig, kaldCoin: KaldNativeCoin, db: Database) {
    this.config = {
      initialSupply: config.initialSupply || 500000000n * 1000000000000000000n, // 500M
      maxSupply: config.maxSupply || 2000000000n * 1000000000000000000n, // 2B
      annualInflationRate: config.annualInflationRate || 0.02, // 2%
      stakingRewardsRate: config.stakingRewardsRate || 0.6, // 60%
      developmentFundRate: config.developmentFundRate || 0.15, // 15%
      ecosystemFundRate: config.ecosystemFundRate || 0.15, // 15%
      liquidityMiningRate: config.liquidityMiningRate || 0.05, // 5%
      burnRate: config.burnRate || 0.05, // 5%
      halvingCycle: config.halvingCycle || 4 // 4 years
    };

    this.kaldCoin = kaldCoin;
    this.db = db;
    this.logger = new Logger('TokenomicsModel');
    this.startTime = new Date();
    this.blockTime = 0.5; // 500ms block time
    this.blocksPerYear = (365 * 24 * 60 * 60) / this.blockTime;
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Load historical data
      await this.loadHistoricalData();
      
      // Initialize tokenomics tracking
      await this.initializeTokenomicsTracking();
      
      this.logger.info('Tokenomics model initialized successfully', {
        initialSupply: this.config.initialSupply.toString(),
        maxSupply: this.config.maxSupply.toString(),
        annualInflationRate: this.config.annualInflationRate,
        halvingCycle: this.config.halvingCycle
      });
    } catch (error) {
      this.logger.error('Failed to initialize tokenomics model', error);
      throw error;
    }
  }

  private async loadHistoricalData(): Promise<void> {
    try {
      // Load historical supply data
      const historicalData = await this.db.tokenomicsHistory.findMany({
        orderBy: { timestamp: 'desc' },
        take: 1000
      });
      
      this.logger.info(`Loaded ${historicalData.length} historical data points`);
    } catch (error) {
      this.logger.error('Failed to load historical data', error);
    }
  }

  private async initializeTokenomicsTracking(): Promise<void> {
    try {
      // Create initial tokenomics snapshot
      const supplyInfo = await this.kaldCoin.getSupplyInfo();
      
      await this.db.tokenomicsHistory.create({
        data: {
          timestamp: new Date(),
          totalSupply: supplyInfo.totalSupply.toString(),
          circulatingSupply: supplyInfo.circulatingSupply.toString(),
          stakedSupply: supplyInfo.stakedSupply.toString(),
          burnedSupply: supplyInfo.burnedSupply.toString(),
          inflationRate: this.config.annualInflationRate,
          marketCap: '0',
          pricePerToken: 0,
          volume24h: '0',
          holders: 0,
          transactions24h: 0
        }
      });
      
      this.logger.info('Tokenomics tracking initialized');
    } catch (error) {
      this.logger.error('Failed to initialize tokenomics tracking', error);
    }
  }

  public async getSupplyMetrics(): Promise<SupplyMetrics> {
    try {
      const supplyInfo = await this.kaldCoin.getSupplyInfo();
      const currentBlock = await this.getCurrentBlock();
      
      // Calculate inflation
      const inflationRate = this.calculateCurrentInflationRate();
      const annualInflation = supplyInfo.circulatingSupply * BigInt(Math.floor(inflationRate * 1000000000000000000)) / 1000000000000000000n;
      
      // Calculate next halving
      const nextHalving = this.calculateNextHalving();
      const blocksUntilHalving = Math.max(0, this.blocksPerYear * this.config.halvingCycle - (currentBlock % (this.blocksPerYear * this.config.halvingCycle)));
      
      return {
        totalSupply: supplyInfo.totalSupply,
        circulatingSupply: supplyInfo.circulatingSupply,
        stakedSupply: supplyInfo.stakedSupply,
        burnedSupply: supplyInfo.burnedSupply,
        inflationRate,
        annualInflation,
        nextHalving,
        blocksUntilHalving
      };
    } catch (error) {
      this.logger.error('Failed to get supply metrics', error);
      throw error;
    }
  }

  public async calculateRewardDistribution(blockReward: bigint): Promise<RewardDistribution> {
    try {
      const stakingRewards = blockReward * BigInt(Math.floor(this.config.stakingRewardsRate * 1000000000000000000)) / 1000000000000000000n;
      const developmentFund = blockReward * BigInt(Math.floor(this.config.developmentFundRate * 1000000000000000000)) / 1000000000000000000n;
      const ecosystemFund = blockReward * BigInt(Math.floor(this.config.ecosystemFundRate * 1000000000000000000)) / 1000000000000000000n;
      const liquidityMining = blockReward * BigInt(Math.floor(this.config.liquidityMiningRate * 1000000000000000000)) / 1000000000000000000n;
      const burnAmount = blockReward * BigInt(Math.floor(this.config.burnRate * 1000000000000000000)) / 1000000000000000000n;
      
      return {
        stakingRewards,
        developmentFund,
        ecosystemFund,
        liquidityMining,
        burnAmount,
        totalRewards: blockReward
      };
    } catch (error) {
      this.logger.error('Failed to calculate reward distribution', error);
      throw error;
    }
  }

  public async getEconomicMetrics(): Promise<EconomicMetrics> {
    try {
      // Get basic metrics
      const supplyInfo = await this.kaldCoin.getSupplyInfo();
      
      // Get market data (simplified - in production would integrate with external APIs)
      const marketData = await this.getMarketData();
      
      // Get transaction data
      const transactions24h = await this.getTransactions24h();
      
      // Get holder count
      const holders = await this.getHolderCount();
      
      return {
        marketCap: marketData.marketCap,
        pricePerToken: marketData.pricePerToken,
        volume24h: marketData.volume24h,
        marketCapRank: marketData.marketCapRank,
        liquidity: marketData.liquidity,
        holders,
        transactions24h
      };
    } catch (error) {
      this.logger.error('Failed to get economic metrics', error);
      throw error;
    }
  }

  public async analyzeTokenomics(): Promise<TokenomicsAnalysis> {
    try {
      const supplyMetrics = await this.getSupplyMetrics();
      const economicMetrics = await this.getEconomicMetrics();
      
      // Calculate sustainability score
      const sustainabilityScore = this.calculateSustainabilityScore(supplyMetrics, economicMetrics);
      
      // Determine inflation pressure
      const inflationPressure = this.determineInflationPressure(supplyMetrics.inflationRate);
      
      // Calculate staking participation
      const stakingParticipation = supplyMetrics.stakedSupply > 0n 
        ? Number(supplyMetrics.stakedSupply) / Number(supplyMetrics.circulatingSupply) 
        : 0;
      
      // Determine economic health
      const economicHealth = this.determineEconomicHealth(sustainabilityScore, inflationPressure, stakingParticipation);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(supplyMetrics, economicMetrics, stakingParticipation);
      
      return {
        sustainabilityScore,
        inflationPressure,
        stakingParticipation,
        economicHealth,
        recommendations
      };
    } catch (error) {
      this.logger.error('Failed to analyze tokenomics', error);
      throw error;
    }
  }

  private calculateCurrentInflationRate(): number {
    const currentBlock = this.getCurrentBlockSync();
    const halvings = Math.floor(currentBlock / (this.blocksPerYear * this.config.halvingCycle));
    
    return this.config.annualInflationRate * Math.pow(0.5, halvings);
  }

  private calculateNextHalving(): Date {
    const currentBlock = this.getCurrentBlockSync();
    const blocksUntilNextHalving = this.blocksPerYear * this.config.halvingCycle - (currentBlock % (this.blocksPerYear * this.config.halvingCycle));
    
    return new Date(Date.now() + blocksUntilNextHalving * this.blockTime * 1000);
  }

  private async getCurrentBlock(): Promise<number> {
    try {
      const latestBlock = await this.db.block.findFirst({
        orderBy: { height: 'desc' }
      });
      
      return latestBlock?.height || 0;
    } catch (error) {
      this.logger.error('Failed to get current block', error);
      return 0;
    }
  }

  private getCurrentBlockSync(): number {
    // Simplified version for synchronous calculations
    const elapsed = (Date.now() - this.startTime.getTime()) / 1000;
    return Math.floor(elapsed / this.blockTime);
  }

  private async getMarketData(): Promise<{
    marketCap: bigint;
    pricePerToken: number;
    volume24h: bigint;
    marketCapRank: number;
    liquidity: bigint;
  }> {
    // In production, this would integrate with external APIs like CoinGecko, CoinMarketCap
    // For now, return simulated data
    return {
      marketCap: 1000000000n * 1000000000000000000n, // $1B market cap
      pricePerToken: 2.0, // $2.00 per token
      volume24h: 50000000n * 1000000000000000000n, // $50M 24h volume
      marketCapRank: 150,
      liquidity: 100000000n * 1000000000000000000n // $100M liquidity
    };
  }

  private async getTransactions24h(): Promise<number> {
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const count = await this.db.kaldTransaction.count({
        where: {
          timestamp: {
            gte: yesterday
          }
        }
      });
      
      return count;
    } catch (error) {
      this.logger.error('Failed to get 24h transaction count', error);
      return 0;
    }
  }

  private async getHolderCount(): Promise<number> {
    try {
      const count = await this.db.kaldBalance.count({
        where: {
          balance: {
            gt: '0'
          }
        }
      });
      
      return count;
    } catch (error) {
      this.logger.error('Failed to get holder count', error);
      return 0;
    }
  }

  private calculateSustainabilityScore(
    supplyMetrics: SupplyMetrics,
    economicMetrics: EconomicMetrics
  ): number {
    let score = 0;
    
    // Inflation rate score (0-30 points)
    if (supplyMetrics.inflationRate <= 0.02) score += 30;
    else if (supplyMetrics.inflationRate <= 0.05) score += 20;
    else if (supplyMetrics.inflationRate <= 0.10) score += 10;
    
    // Staking participation score (0-25 points)
    const stakingParticipation = Number(supplyMetrics.stakedSupply) / Number(supplyMetrics.circulatingSupply);
    if (stakingParticipation >= 0.5) score += 25;
    else if (stakingParticipation >= 0.3) score += 20;
    else if (stakingParticipation >= 0.1) score += 15;
    else if (stakingParticipation >= 0.05) score += 10;
    else score += 5;
    
    // Market cap score (0-20 points)
    const marketCap = Number(economicMetrics.marketCap) / 1e18;
    if (marketCap >= 1000000000) score += 20; // $1B+
    else if (marketCap >= 100000000) score += 15; // $100M+
    else if (marketCap >= 10000000) score += 10; // $10M+
    else score += 5;
    
    // Transaction volume score (0-15 points)
    const volume24h = Number(economicMetrics.volume24h) / 1e18;
    if (volume24h >= 100000000) score += 15; // $100M+
    else if (volume24h >= 10000000) score += 10; // $10M+
    else if (volume24h >= 1000000) score += 5; // $1M+
    
    // Holder count score (0-10 points)
    if (economicMetrics.holders >= 100000) score += 10;
    else if (economicMetrics.holders >= 10000) score += 7;
    else if (economicMetrics.holders >= 1000) score += 5;
    else if (economicMetrics.holders >= 100) score += 3;
    else score += 1;
    
    return Math.min(100, score);
  }

  private determineInflationPressure(inflationRate: number): 'low' | 'medium' | 'high' {
    if (inflationRate <= 0.02) return 'low';
    if (inflationRate <= 0.05) return 'medium';
    return 'high';
  }

  private determineEconomicHealth(
    sustainabilityScore: number,
    inflationPressure: 'low' | 'medium' | 'high',
    stakingParticipation: number
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    if (sustainabilityScore >= 80 && inflationPressure === 'low' && stakingParticipation >= 0.3) {
      return 'excellent';
    } else if (sustainabilityScore >= 60 && inflationPressure !== 'high' && stakingParticipation >= 0.1) {
      return 'good';
    } else if (sustainabilityScore >= 40 && stakingParticipation >= 0.05) {
      return 'fair';
    } else {
      return 'poor';
    }
  }

  private generateRecommendations(
    supplyMetrics: SupplyMetrics,
    economicMetrics: EconomicMetrics,
    stakingParticipation: number
  ): string[] {
    const recommendations: string[] = [];
    
    // Inflation recommendations
    if (supplyMetrics.inflationRate > 0.05) {
      recommendations.push('Consider reducing inflation rate through increased burn mechanisms');
    }
    
    // Staking recommendations
    if (stakingParticipation < 0.1) {
      recommendations.push('Increase staking rewards to encourage more token staking');
    }
    
    // Market cap recommendations
    const marketCap = Number(economicMetrics.marketCap) / 1e18;
    if (marketCap < 100000000) {
      recommendations.push('Focus on marketing and partnerships to increase market capitalization');
    }
    
    // Volume recommendations
    const volume24h = Number(economicMetrics.volume24h) / 1e18;
    if (volume24h < 1000000) {
      recommendations.push('Implement liquidity mining programs to increase trading volume');
    }
    
    // Holder recommendations
    if (economicMetrics.holders < 1000) {
      recommendations.push('Launch community airdrop campaigns to increase token distribution');
    }
    
    return recommendations;
  }

  public async updateTokenomicsData(): Promise<void> {
    try {
      const supplyMetrics = await this.getSupplyMetrics();
      const economicMetrics = await this.getEconomicMetrics();
      
      // Save to database
      await this.db.tokenomicsHistory.create({
        data: {
          timestamp: new Date(),
          totalSupply: supplyMetrics.totalSupply.toString(),
          circulatingSupply: supplyMetrics.circulatingSupply.toString(),
          stakedSupply: supplyMetrics.stakedSupply.toString(),
          burnedSupply: supplyMetrics.burnedSupply.toString(),
          inflationRate: supplyMetrics.inflationRate,
          marketCap: economicMetrics.marketCap.toString(),
          pricePerToken: economicMetrics.pricePerToken,
          volume24h: economicMetrics.volume24h.toString(),
          holders: economicMetrics.holders,
          transactions24h: economicMetrics.transactions24h
        }
      });
      
      this.logger.info('Tokenomics data updated successfully');
    } catch (error) {
      this.logger.error('Failed to update tokenomics data', error);
    }
  }

  public getConfig(): TokenomicsConfig {
    return { ...this.config };
  }
}