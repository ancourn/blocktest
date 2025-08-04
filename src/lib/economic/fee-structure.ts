/**
 * KALDRIX Fee Structure and Gas Optimization System
 * 
 * This module implements a comprehensive fee structure and gas optimization system
 * for the KALDRIX blockchain. It includes dynamic fee calculation, gas limit optimization,
 * priority fee management, and transaction cost prediction.
 */

import { QuantumCrypto } from '@/lib/quantum/crypto';
import { Database } from '@/lib/db';
import { Logger } from '@/lib/utils/logger';
import { KaldNativeCoin } from './native-coin';

export interface FeeConfig {
  baseFee: bigint;
  priorityFee: bigint;
  maxFee: bigint;
  gasLimit: number;
  blockGasLimit: number;
  targetGasLimit: number;
  elasticityMultiplier: number;
  baseFeeChangeDenominator: number;
  minPriorityFee: bigint;
  maxPriorityFee: bigint;
  feeHistoryBlocks: number;
}

export interface GasPrice {
  baseFee: bigint;
  priorityFee: bigint;
  maxFee: bigint;
  estimatedGas: number;
  totalCost: bigint;
  confidence: number;
  timestamp: Date;
}

export interface FeeHistory {
  blockNumber: number;
  baseFee: bigint;
  priorityFee: bigint;
  gasUsed: number;
  gasLimit: number;
  timestamp: Date;
}

export interface TransactionType {
  type: 'transfer' | 'contract_deploy' | 'contract_call' | 'stake' | 'unstake' | 'governance' | 'bridge';
  baseGasLimit: number;
  priorityMultiplier: number;
  complexityFactor: number;
}

export interface FeeOptimization {
  originalGasLimit: number;
  optimizedGasLimit: number;
  originalFee: bigint;
  optimizedFee: bigint;
  savings: bigint;
  savingsPercentage: number;
  recommendations: string[];
  optimizationMethod: string;
}

export interface FeeStats {
  averageBaseFee: bigint;
  averagePriorityFee: bigint;
  averageGasUsed: number;
  averageGasLimit: number;
  feeVolatility: number;
  gasEfficiency: number;
  optimizationSavings: bigint;
  totalTransactions: number;
  failedTransactions: number;
}

export class FeeStructureSystem {
  private config: FeeConfig;
  private quantumCrypto: QuantumCrypto;
  private db: Database;
  private logger: Logger;
  private kaldCoin: KaldNativeCoin;
  private feeHistory: FeeHistory[] = [];
  private transactionTypes: Map<string, TransactionType> = new Map();
  private feeStats: FeeStats;
  private lastBaseFee: bigint;
  private currentBlockGasUsed: number = 0;

  constructor(config: FeeConfig, kaldCoin: KaldNativeCoin, db: Database) {
    this.config = {
      baseFee: config.baseFee || 1000000000000000000n, // 1 token
      priorityFee: config.priorityFee || 100000000000000000n, // 0.1 tokens
      maxFee: config.maxFee || 10000000000000000000n, // 10 tokens
      gasLimit: config.gasLimit || 21000,
      blockGasLimit: config.blockGasLimit || 30000000,
      targetGasLimit: config.targetGasLimit || 15000000,
      elasticityMultiplier: config.elasticityMultiplier || 2,
      baseFeeChangeDenominator: config.baseFeeChangeDenominator || 8,
      minPriorityFee: config.minPriorityFee || 10000000000000000n, // 0.01 tokens
      maxPriorityFee: config.maxPriorityFee || 1000000000000000000n, // 1 token
      feeHistoryBlocks: config.feeHistoryBlocks || 100
    };

    this.kaldCoin = kaldCoin;
    this.db = db;
    this.quantumCrypto = new QuantumCrypto();
    this.logger = new Logger('FeeStructureSystem');
    
    this.lastBaseFee = this.config.baseFee;
    
    this.feeStats = {
      averageBaseFee: 0n,
      averagePriorityFee: 0n,
      averageGasUsed: 0,
      averageGasLimit: 0,
      feeVolatility: 0,
      gasEfficiency: 0,
      optimizationSavings: 0n,
      totalTransactions: 0,
      failedTransactions: 0
    };
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize transaction types
      await this.initializeTransactionTypes();
      
      // Load fee history
      await this.loadFeeHistory();
      
      // Load fee statistics
      await this.loadFeeStats();
      
      // Start background services
      this.startBackgroundServices();
      
      this.logger.info('Fee structure system initialized successfully', {
        baseFee: this.config.baseFee.toString(),
        priorityFee: this.config.priorityFee.toString(),
        maxFee: this.config.maxFee.toString(),
        gasLimit: this.config.gasLimit
      });
    } catch (error) {
      this.logger.error('Failed to initialize fee structure system', error);
      throw error;
    }
  }

  private async initializeTransactionTypes(): Promise<void> {
    try {
      const types: TransactionType[] = [
        {
          type: 'transfer',
          baseGasLimit: 21000,
          priorityMultiplier: 1.0,
          complexityFactor: 1.0
        },
        {
          type: 'contract_deploy',
          baseGasLimit: 2000000,
          priorityMultiplier: 1.5,
          complexityFactor: 2.0
        },
        {
          type: 'contract_call',
          baseGasLimit: 50000,
          priorityMultiplier: 1.2,
          complexityFactor: 1.5
        },
        {
          type: 'stake',
          baseGasLimit: 80000,
          priorityMultiplier: 1.1,
          complexityFactor: 1.2
        },
        {
          type: 'unstake',
          baseGasLimit: 90000,
          priorityMultiplier: 1.1,
          complexityFactor: 1.2
        },
        {
          type: 'governance',
          baseGasLimit: 150000,
          priorityMultiplier: 1.3,
          complexityFactor: 1.8
        },
        {
          type: 'bridge',
          baseGasLimit: 300000,
          priorityMultiplier: 1.4,
          complexityFactor: 2.5
        }
      ];

      for (const type of types) {
        this.transactionTypes.set(type.type, type);
      }

      this.logger.info(`Initialized ${types.length} transaction types`);
    } catch (error) {
      this.logger.error('Failed to initialize transaction types', error);
    }
  }

  private async loadFeeHistory(): Promise<void> {
    try {
      const history = await this.db.feeHistory.findMany({
        orderBy: { blockNumber: 'desc' },
        take: this.config.feeHistoryBlocks
      });

      for (const record of history) {
        this.feeHistory.push({
          blockNumber: record.blockNumber,
          baseFee: BigInt(record.baseFee),
          priorityFee: BigInt(record.priorityFee),
          gasUsed: record.gasUsed,
          gasLimit: record.gasLimit,
          timestamp: new Date(record.timestamp)
        });
      }

      this.logger.info(`Loaded ${history.length} fee history records`);
    } catch (error) {
      this.logger.error('Failed to load fee history', error);
    }
  }

  private async loadFeeStats(): Promise<void> {
    try {
      const stats = await this.db.feeStats.findFirst({
        orderBy: { timestamp: 'desc' }
      });

      if (stats) {
        this.feeStats = {
          averageBaseFee: BigInt(stats.averageBaseFee),
          averagePriorityFee: BigInt(stats.averagePriorityFee),
          averageGasUsed: stats.averageGasUsed,
          averageGasLimit: stats.averageGasLimit,
          feeVolatility: stats.feeVolatility,
          gasEfficiency: stats.gasEfficiency,
          optimizationSavings: BigInt(stats.optimizationSavings),
          totalTransactions: stats.totalTransactions,
          failedTransactions: stats.failedTransactions
        };
      }

      this.logger.info('Fee statistics loaded');
    } catch (error) {
      this.logger.error('Failed to load fee statistics', error);
    }
  }

  private startBackgroundServices(): void {
    // Update base fee
    setInterval(() => this.updateBaseFee(), 15000); // 15 seconds
    
    // Update fee statistics
    setInterval(() => this.updateFeeStats(), 300000); // 5 minutes
    
    // Clean up old history
    setInterval(() => this.cleanupOldHistory(), 3600000); // 1 hour
  }

  public async estimateGasPrice(
    transactionType: string,
    data?: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<GasPrice> {
    try {
      const txType = this.transactionTypes.get(transactionType);
      if (!txType) {
        throw new Error('Unknown transaction type');
      }

      // Calculate base gas limit
      let gasLimit = txType.baseGasLimit;
      
      // Adjust for data size
      if (data) {
        const dataSize = data.length / 2; // Hex string length
        gasLimit += Math.floor(dataSize * 16); // 16 gas per byte
      }
      
      // Apply complexity factor
      gasLimit = Math.floor(gasLimit * txType.complexityFactor);
      
      // Calculate fees
      const baseFee = this.lastBaseFee;
      const priorityFee = this.calculatePriorityFee(priority);
      const maxFee = baseFee + priorityFee;
      
      // Calculate total cost
      const totalCost = baseFee * BigInt(gasLimit) + priorityFee * BigInt(gasLimit);
      
      // Calculate confidence based on recent blocks
      const confidence = this.calculateConfidence(baseFee, priorityFee);
      
      const gasPrice: GasPrice = {
        baseFee,
        priorityFee,
        maxFee,
        estimatedGas: gasLimit,
        totalCost,
        confidence,
        timestamp: new Date()
      };

      this.logger.debug('Gas price estimated', {
        transactionType,
        gasLimit,
        baseFee: baseFee.toString(),
        priorityFee: priorityFee.toString(),
        totalCost: totalCost.toString(),
        confidence
      });

      return gasPrice;
    } catch (error) {
      this.logger.error('Failed to estimate gas price', error);
      throw error;
    }
  }

  public async optimizeTransaction(
    transactionType: string,
    data?: string,
    originalGasLimit?: number,
    originalFee?: bigint
  ): Promise<FeeOptimization> {
    try {
      const txType = this.transactionTypes.get(transactionType);
      if (!txType) {
        throw new Error('Unknown transaction type');
      }

      // Get current gas estimate
      const currentEstimate = await this.estimateGasPrice(transactionType, data);
      
      // Use provided values or defaults
      const originalGas = originalGasLimit || currentEstimate.estimatedGas;
      const originalCost = originalFee || currentEstimate.totalCost;
      
      // Apply optimization strategies
      const optimization = await this.applyOptimizationStrategies(
        transactionType,
        data,
        originalGas,
        originalCost,
        currentEstimate
      );

      this.logger.info('Transaction optimized', {
        transactionType,
        originalGasLimit: optimization.originalGasLimit,
        optimizedGasLimit: optimization.optimizedGasLimit,
        originalFee: optimization.originalFee.toString(),
        optimizedFee: optimization.optimizedFee.toString(),
        savings: optimization.savings.toString(),
        savingsPercentage: optimization.savingsPercentage
      });

      return optimization;
    } catch (error) {
      this.logger.error('Failed to optimize transaction', error);
      throw error;
    }
  }

  private async applyOptimizationStrategies(
    transactionType: string,
    data: string | undefined,
    originalGasLimit: number,
    originalFee: bigint,
    currentEstimate: GasPrice
  ): Promise<FeeOptimization> {
    const recommendations: string[] = [];
    let optimizedGasLimit = originalGasLimit;
    let optimizedFee = originalFee;
    let optimizationMethod = 'none';

    // Strategy 1: Gas limit optimization
    const gasOptimization = this.optimizeGasLimit(transactionType, data, originalGasLimit);
    if (gasOptimization.savings > 0) {
      optimizedGasLimit = gasOptimization.gasLimit;
      recommendations.push(...gasOptimization.recommendations);
      optimizationMethod = 'gas_limit';
    }

    // Strategy 2: Fee optimization
    const feeOptimization = this.optimizeFee(originalFee, currentEstimate);
    if (feeOptimization.savings > 0) {
      optimizedFee = feeOptimization.fee;
      recommendations.push(...feeOptimization.recommendations);
      optimizationMethod = optimizationMethod === 'none' ? 'fee' : 'combined';
    }

    // Calculate savings
    const savings = originalFee - optimizedFee;
    const savingsPercentage = originalFee > 0n ? Number(savings * 10000n / originalFee) / 100 : 0;

    return {
      originalGasLimit,
      optimizedGasLimit,
      originalFee,
      optimizedFee,
      savings,
      savingsPercentage,
      recommendations,
      optimizationMethod
    };
  }

  private optimizeGasLimit(
    transactionType: string,
    data: string | undefined,
    originalGasLimit: number
  ): { gasLimit: number; savings: number; recommendations: string[] } {
    const recommendations: string[] = [];
    let gasLimit = originalGasLimit;

    // Analyze historical gas usage for similar transactions
    const historicalGas = this.getHistoricalGasUsage(transactionType);
    if (historicalGas.length > 0) {
      const avgGas = historicalGas.reduce((sum, gas) => sum + gas, 0) / historicalGas.length;
      const stdDev = Math.sqrt(historicalGas.reduce((sum, gas) => sum + Math.pow(gas - avgGas, 2), 0) / historicalGas.length);
      
      // Suggest gas limit based on historical data
      const suggestedGas = Math.floor(avgGas + stdDev * 2); // 2 standard deviations
      if (suggestedGas < originalGasLimit) {
        gasLimit = suggestedGas;
        recommendations.push(`Reduced gas limit from ${originalGasLimit} to ${gasLimit} based on historical usage`);
      }
    }

    // Optimize for data compression
    if (data && data.length > 1000) {
      const potentialSavings = Math.floor(data.length * 4); // Assume 4 gas per byte saved
      if (potentialSavings > 1000) {
        gasLimit -= potentialSavings;
        recommendations.push(`Consider data compression to save ~${potentialSavings} gas`);
      }
    }

    return {
      gasLimit,
      savings: originalGasLimit - gasLimit,
      recommendations
    };
  }

  private optimizeFee(
    originalFee: bigint,
    currentEstimate: GasPrice
  ): { fee: bigint; savings: bigint; recommendations: string[] } {
    const recommendations: string[] = [];
    let fee = originalFee;

    // Analyze fee history for optimal timing
    const optimalFee = this.findOptimalFeeTiming();
    if (optimalFee.fee < originalFee) {
      fee = optimalFee.fee;
      recommendations.push(`Consider waiting ${optimalFee.waitTime} for lower fees`);
    }

    // Suggest priority fee adjustment
    if (currentEstimate.priorityFee > this.config.minPriorityFee * 2n) {
      const reducedPriorityFee = currentEstimate.priorityFee / 2n;
      const potentialSavings = reducedPriorityFee * BigInt(currentEstimate.estimatedGas);
      if (potentialSavings > this.config.minPriorityFee) {
        fee -= potentialSavings;
        recommendations.push(`Reduce priority fee to save ${potentialSavings.toString()} tokens`);
      }
    }

    return {
      fee,
      savings: originalFee - fee,
      recommendations
    };
  }

  private getHistoricalGasUsage(transactionType: string): number[] {
    // Get recent gas usage for similar transactions
    return this.feeHistory
      .filter(h => h.gasUsed > 0)
      .map(h => h.gasUsed)
      .slice(0, 50); // Last 50 transactions
  }

  private findOptimalFeeTiming(): { fee: bigint; waitTime: string } {
    // Analyze fee history to find optimal timing
    if (this.feeHistory.length < 10) {
      return { fee: this.lastBaseFee, waitTime: '0 minutes' };
    }

    const recentFees = this.feeHistory.slice(0, 24); // Last 24 blocks
    const avgFee = recentFees.reduce((sum, h) => sum + h.baseFee, 0n) / BigInt(recentFees.length);
    
    // Find the lowest fee in the last 6 hours (assuming 15s blocks)
    const sixHourBlocks = 6 * 60 * 60 / 15;
    const recentSixHours = this.feeHistory.slice(0, Math.min(sixHourBlocks, this.feeHistory.length));
    const minFee = recentSixHours.reduce((min, h) => h.baseFee < min ? h.baseFee : min, recentSixHours[0].baseFee);
    
    if (minFee < avgFee * 8n / 10n) { // If min fee is 20% lower than average
      const waitTime = '1-2 hours';
      return { fee: minFee, waitTime };
    }

    return { fee: avgFee, waitTime: '0 minutes' };
  }

  private calculatePriorityFee(priority: 'low' | 'medium' | 'high'): bigint {
    const basePriority = this.config.minPriorityFee;
    
    switch (priority) {
      case 'low':
        return basePriority;
      case 'medium':
        return basePriority * 2n;
      case 'high':
        return basePriority * 4n;
      default:
        return basePriority * 2n;
    }
  }

  private calculateConfidence(baseFee: bigint, priorityFee: bigint): number {
    // Calculate confidence based on recent fee history
    if (this.feeHistory.length < 5) {
      return 0.5; // Low confidence with limited history
    }

    const recentFees = this.feeHistory.slice(0, 10);
    const avgBaseFee = recentFees.reduce((sum, h) => sum + h.baseFee, 0n) / BigInt(recentFees.length);
    const avgPriorityFee = recentFees.reduce((sum, h) => sum + h.priorityFee, 0n) / BigInt(recentFees.length);
    
    // Calculate deviation from averages
    const baseDeviation = Number(baseFee - avgBaseFee) / Number(avgBaseFee);
    const priorityDeviation = Number(priorityFee - avgPriorityFee) / Number(avgPriorityFee);
    
    // Higher confidence when fees are close to recent averages
    const confidence = Math.max(0, 1 - Math.abs(baseDeviation) - Math.abs(priorityDeviation));
    
    return Math.min(1, Math.max(0, confidence));
  }

  private async updateBaseFee(): Promise<void> {
    try {
      // Get current block gas usage
      const gasTargetRatio = this.currentBlockGasUsed / this.config.targetGasLimit;
      
      // Calculate new base fee using EIP-1559 formula
      let newBaseFee: bigint;
      if (gasTargetRatio > 1) {
        // Block is full, increase base fee
        const feeIncrease = this.lastBaseFee * BigInt(Math.floor(gasTargetRatio * this.config.elasticityMultiplier * 1000000000000000000)) / BigInt(this.config.baseFeeChangeDenominator * 1000000000000000000);
        newBaseFee = this.lastBaseFee + feeIncrease;
      } else {
        // Block has space, decrease base fee
        const feeDecrease = this.lastBaseFee * BigInt(Math.floor((1 - gasTargetRatio) * this.config.elasticityMultiplier * 1000000000000000000)) / BigInt(this.config.baseFeeChangeDenominator * 1000000000000000000);
        newBaseFee = this.lastBaseFee - feeDecrease;
      }
      
      // Ensure base fee stays within bounds
      newBaseFee = BigInt(Math.max(Number(this.config.baseFee), Math.min(Number(this.config.maxFee), Number(newBaseFee))));
      
      this.lastBaseFee = newBaseFee;
      
      // Reset block gas usage
      this.currentBlockGasUsed = 0;
      
      this.logger.debug('Base fee updated', {
        newBaseFee: newBaseFee.toString(),
        gasTargetRatio,
        previousBaseFee: (this.lastBaseFee).toString()
      });
    } catch (error) {
      this.logger.error('Failed to update base fee', error);
    }
  }

  public async recordTransaction(
    blockNumber: number,
    gasUsed: number,
    gasLimit: number,
    baseFee: bigint,
    priorityFee: bigint,
    transactionType: string,
    success: boolean
  ): Promise<void> {
    try {
      // Update current block gas usage
      this.currentBlockGasUsed += gasUsed;
      
      // Add to fee history
      const historyRecord: FeeHistory = {
        blockNumber,
        baseFee,
        priorityFee,
        gasUsed,
        gasLimit,
        timestamp: new Date()
      };
      
      this.feeHistory.unshift(historyRecord);
      
      // Keep only recent history
      if (this.feeHistory.length > this.config.feeHistoryBlocks) {
        this.feeHistory = this.feeHistory.slice(0, this.config.feeHistoryBlocks);
      }
      
      // Save to database
      await this.saveFeeHistory(historyRecord);
      
      // Update statistics
      this.feeStats.totalTransactions++;
      if (!success) {
        this.feeStats.failedTransactions++;
      }
      
      this.logger.debug('Transaction recorded', {
        blockNumber,
        gasUsed,
        gasLimit,
        baseFee: baseFee.toString(),
        priorityFee: priorityFee.toString(),
        transactionType,
        success
      });
    } catch (error) {
      this.logger.error('Failed to record transaction', error);
    }
  }

  private async updateFeeStats(): Promise<void> {
    try {
      if (this.feeHistory.length === 0) {
        return;
      }
      
      // Calculate averages
      const avgBaseFee = this.feeHistory.reduce((sum, h) => sum + h.baseFee, 0n) / BigInt(this.feeHistory.length);
      const avgPriorityFee = this.feeHistory.reduce((sum, h) => sum + h.priorityFee, 0n) / BigInt(this.feeHistory.length);
      const avgGasUsed = this.feeHistory.reduce((sum, h) => sum + h.gasUsed, 0) / this.feeHistory.length;
      const avgGasLimit = this.feeHistory.reduce((sum, h) => sum + h.gasLimit, 0) / this.feeHistory.length;
      
      // Calculate fee volatility
      const baseFees = this.feeHistory.map(h => Number(h.baseFee));
      const mean = baseFees.reduce((sum, fee) => sum + fee, 0) / baseFees.length;
      const variance = baseFees.reduce((sum, fee) => sum + Math.pow(fee - mean, 2), 0) / baseFees.length;
      const feeVolatility = Math.sqrt(variance) / mean;
      
      // Calculate gas efficiency
      const gasEfficiency = avgGasLimit > 0 ? avgGasUsed / avgGasLimit : 0;
      
      // Update statistics
      this.feeStats = {
        ...this.feeStats,
        averageBaseFee: avgBaseFee,
        averagePriorityFee: avgPriorityFee,
        averageGasUsed: avgGasUsed,
        averageGasLimit: avgGasLimit,
        feeVolatility,
        gasEfficiency
      };
      
      // Save to database
      await this.saveFeeStats();
      
      this.logger.info('Fee statistics updated');
    } catch (error) {
      this.logger.error('Failed to update fee statistics', error);
    }
  }

  private async cleanupOldHistory(): Promise<void> {
    try {
      const cutoffBlock = Math.max(0, (await this.getCurrentBlock()) - this.config.feeHistoryBlocks * 2);
      
      // Clean up old history from database
      await this.db.feeHistory.deleteMany({
        where: {
          blockNumber: {
            lt: cutoffBlock
          }
        }
      });
      
      // Clean up memory
      this.feeHistory = this.feeHistory.filter(h => h.blockNumber >= cutoffBlock);
      
      this.logger.info('Cleaned up old fee history');
    } catch (error) {
      this.logger.error('Failed to cleanup old history', error);
    }
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

  private async saveFeeHistory(history: FeeHistory): Promise<void> {
    await this.db.feeHistory.create({
      data: {
        blockNumber: history.blockNumber,
        baseFee: history.baseFee.toString(),
        priorityFee: history.priorityFee.toString(),
        gasUsed: history.gasUsed,
        gasLimit: history.gasLimit,
        timestamp: history.timestamp
      }
    });
  }

  private async saveFeeStats(): Promise<void> {
    await this.db.feeStats.create({
      data: {
        timestamp: new Date(),
        averageBaseFee: this.feeStats.averageBaseFee.toString(),
        averagePriorityFee: this.feeStats.averagePriorityFee.toString(),
        averageGasUsed: this.feeStats.averageGasUsed,
        averageGasLimit: this.feeStats.averageGasLimit,
        feeVolatility: this.feeStats.feeVolatility,
        gasEfficiency: this.feeStats.gasEfficiency,
        optimizationSavings: this.feeStats.optimizationSavings.toString(),
        totalTransactions: this.feeStats.totalTransactions,
        failedTransactions: this.feeStats.failedTransactions
      }
    });
  }

  public getCurrentBaseFee(): bigint {
    return this.lastBaseFee;
  }

  public getFeeHistory(): FeeHistory[] {
    return [...this.feeHistory];
  }

  public getFeeStats(): FeeStats {
    return { ...this.feeStats };
  }

  public getTransactionType(type: string): TransactionType | undefined {
    return this.transactionTypes.get(type);
  }

  public getConfig(): FeeConfig {
    return { ...this.config };
  }
}