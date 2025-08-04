/**
 * KALDRIX Native Coin (KALD) Implementation
 * 
 * This module implements the native cryptocurrency for the KALDRIX quantum DAG blockchain.
 * KALD serves as the primary utility token for network operations, staking, governance,
 * and economic activities within the ecosystem.
 */

import { QuantumCrypto } from '@/lib/quantum/crypto';
import { Database } from '@/lib/db';
import { Logger } from '@/lib/utils/logger';

export interface KaldCoinConfig {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  initialSupply: bigint;
  mintingEnabled: boolean;
  maxSupply?: bigint;
  inflationRate?: number;
}

export interface KaldBalance {
  address: string;
  balance: bigint;
  staked: bigint;
  locked: bigint;
  lastUpdated: Date;
}

export interface KaldTransaction {
  id: string;
  from: string;
  to: string;
  amount: bigint;
  fee: bigint;
  timestamp: Date;
  nonce: number;
  signature: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockHeight?: number;
  gasUsed?: number;
}

export interface StakingInfo {
  address: string;
  amount: bigint;
  startTime: Date;
  endTime?: Date;
  rewardRate: number;
  accumulatedRewards: bigint;
  isActive: boolean;
}

export class KaldNativeCoin {
  private config: KaldCoinConfig;
  private quantumCrypto: QuantumCrypto;
  private db: Database;
  private logger: Logger;
  private balances: Map<string, KaldBalance> = new Map();
  private pendingTransactions: Map<string, KaldTransaction> = new Map();
  private stakingContracts: Map<string, StakingInfo> = new Map();
  private totalStaked: bigint = 0n;

  constructor(config: KaldCoinConfig, db: Database) {
    this.config = {
      name: config.name || 'KALDRIX Coin',
      symbol: config.symbol || 'KALD',
      decimals: config.decimals || 18,
      totalSupply: config.totalSupply || 1000000000n * 1000000000000000000n, // 1B with 18 decimals
      initialSupply: config.initialSupply || 500000000n * 1000000000000000000n, // 500M initially
      mintingEnabled: config.mintingEnabled ?? true,
      maxSupply: config.maxSupply || 2000000000n * 1000000000000000000n, // 2B max
      inflationRate: config.inflationRate || 0.02 // 2% annual inflation
    };

    this.quantumCrypto = new QuantumCrypto();
    this.db = db;
    this.logger = new Logger('KaldNativeCoin');
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Load existing balances from database
      await this.loadBalances();
      
      // Load staking contracts
      await this.loadStakingContracts();
      
      // Initialize genesis accounts
      await this.initializeGenesisAccounts();
      
      this.logger.info('KALD native coin initialized successfully', {
        totalSupply: this.config.totalSupply.toString(),
        initialSupply: this.config.initialSupply.toString(),
        decimals: this.config.decimals
      });
    } catch (error) {
      this.logger.error('Failed to initialize KALD native coin', error);
      throw error;
    }
  }

  private async loadBalances(): Promise<void> {
    try {
      const balances = await this.db.kaldBalance.findMany();
      
      for (const balance of balances) {
        this.balances.set(balance.address, {
          address: balance.address,
          balance: BigInt(balance.balance),
          staked: BigInt(balance.staked),
          locked: BigInt(balance.locked),
          lastUpdated: new Date(balance.lastUpdated)
        });
      }
      
      this.logger.info(`Loaded ${balances.length} account balances`);
    } catch (error) {
      this.logger.error('Failed to load balances from database', error);
    }
  }

  private async loadStakingContracts(): Promise<void> {
    try {
      const contracts = await this.db.stakingContract.findMany();
      
      for (const contract of contracts) {
        this.stakingContracts.set(contract.address, {
          address: contract.address,
          amount: BigInt(contract.amount),
          startTime: new Date(contract.startTime),
          endTime: contract.endTime ? new Date(contract.endTime) : undefined,
          rewardRate: contract.rewardRate,
          accumulatedRewards: BigInt(contract.accumulatedRewards),
          isActive: contract.isActive
        });
        
        if (contract.isActive) {
          this.totalStaked += BigInt(contract.amount);
        }
      }
      
      this.logger.info(`Loaded ${contracts.length} staking contracts`);
    } catch (error) {
      this.logger.error('Failed to load staking contracts from database', error);
    }
  }

  private async initializeGenesisAccounts(): Promise<void> {
    const genesisAddress = '0x0000000000000000000000000000000000000000';
    
    if (!this.balances.has(genesisAddress)) {
      const genesisBalance: KaldBalance = {
        address: genesisAddress,
        balance: this.config.initialSupply,
        staked: 0n,
        locked: 0n,
        lastUpdated: new Date()
      };
      
      this.balances.set(genesisAddress, genesisBalance);
      
      // Save to database
      await this.db.kaldBalance.create({
        data: {
          address: genesisAddress,
          balance: genesisBalance.balance.toString(),
          staked: genesisBalance.staked.toString(),
          locked: genesisBalance.locked.toString(),
          lastUpdated: genesisBalance.lastUpdated
        }
      });
      
      this.logger.info('Genesis account initialized', {
        address: genesisAddress,
        balance: genesisBalance.balance.toString()
      });
    }
  }

  public getBalance(address: string): KaldBalance | undefined {
    return this.balances.get(address);
  }

  public async transfer(
    from: string,
    to: string,
    amount: bigint,
    fee: bigint,
    signature: string
  ): Promise<KaldTransaction> {
    try {
      // Validate inputs
      if (amount <= 0n) {
        throw new Error('Transfer amount must be positive');
      }
      
      if (fee < 0n) {
        throw new Error('Fee cannot be negative');
      }
      
      // Verify signature
      const isValid = await this.quantumCrypto.verifySignature(
        `${from}:${to}:${amount}:${fee}`,
        signature,
        from
      );
      
      if (!isValid) {
        throw new Error('Invalid signature');
      }
      
      // Check balance
      const fromBalance = this.balances.get(from);
      if (!fromBalance || fromBalance.balance < amount + fee) {
        throw new Error('Insufficient balance');
      }
      
      // Create transaction
      const transaction: KaldTransaction = {
        id: this.generateTransactionId(),
        from,
        to,
        amount,
        fee,
        timestamp: new Date(),
        nonce: await this.getNextNonce(from),
        signature,
        status: 'pending'
      };
      
      // Update balances
      fromBalance.balance -= amount + fee;
      fromBalance.lastUpdated = new Date();
      
      let toBalance = this.balances.get(to);
      if (!toBalance) {
        toBalance = {
          address: to,
          balance: 0n,
          staked: 0n,
          locked: 0n,
          lastUpdated: new Date()
        };
        this.balances.set(to, toBalance);
      }
      
      toBalance.balance += amount;
      toBalance.lastUpdated = new Date();
      
      // Store transaction
      this.pendingTransactions.set(transaction.id, transaction);
      
      // Save to database
      await this.saveTransaction(transaction);
      await this.updateBalanceInDB(fromBalance);
      await this.updateBalanceInDB(toBalance);
      
      this.logger.info('Transfer completed', {
        transactionId: transaction.id,
        from,
        to,
        amount: amount.toString(),
        fee: fee.toString()
      });
      
      return transaction;
    } catch (error) {
      this.logger.error('Transfer failed', error);
      throw error;
    }
  }

  public async stake(
    address: string,
    amount: bigint,
    duration: number // Duration in days
  ): Promise<StakingInfo> {
    try {
      if (amount <= 0n) {
        throw new Error('Staking amount must be positive');
      }
      
      if (duration < 1) {
        throw new Error('Staking duration must be at least 1 day');
      }
      
      const balance = this.balances.get(address);
      if (!balance || balance.balance < amount) {
        throw new Error('Insufficient balance for staking');
      }
      
      // Calculate reward rate based on duration
      const rewardRate = this.calculateRewardRate(duration);
      
      // Create staking contract
      const stakingInfo: StakingInfo = {
        address,
        amount,
        startTime: new Date(),
        endTime: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
        rewardRate,
        accumulatedRewards: 0n,
        isActive: true
      };
      
      // Update balance
      balance.balance -= amount;
      balance.staked += amount;
      balance.lastUpdated = new Date();
      
      // Store staking contract
      this.stakingContracts.set(address, stakingInfo);
      this.totalStaked += amount;
      
      // Save to database
      await this.db.stakingContract.create({
        data: {
          address: stakingInfo.address,
          amount: stakingInfo.amount.toString(),
          startTime: stakingInfo.startTime,
          endTime: stakingInfo.endTime,
          rewardRate: stakingInfo.rewardRate,
          accumulatedRewards: stakingInfo.accumulatedRewards.toString(),
          isActive: stakingInfo.isActive
        }
      });
      
      await this.updateBalanceInDB(balance);
      
      this.logger.info('Staking completed', {
        address,
        amount: amount.toString(),
        duration,
        rewardRate
      });
      
      return stakingInfo;
    } catch (error) {
      this.logger.error('Staking failed', error);
      throw error;
    }
  }

  public async unstake(address: string): Promise<bigint> {
    try {
      const stakingInfo = this.stakingContracts.get(address);
      if (!stakingInfo) {
        throw new Error('No active staking contract found');
      }
      
      if (!stakingInfo.isActive) {
        throw new Error('Staking contract is not active');
      }
      
      const now = new Date();
      if (stakingInfo.endTime && now < stakingInfo.endTime) {
        // Early unstaking with penalty
        const penalty = this.calculateEarlyUnstakingPenalty(stakingInfo);
        const finalAmount = stakingInfo.amount - penalty;
        
        // Update staking contract
        stakingInfo.isActive = false;
        stakingInfo.endTime = now;
        
        // Update balance
        const balance = this.balances.get(address);
        if (balance) {
          balance.balance += finalAmount;
          balance.staked -= stakingInfo.amount;
          balance.lastUpdated = new Date();
          
          await this.updateBalanceInDB(balance);
        }
        
        this.totalStaked -= stakingInfo.amount;
        
        // Update database
        await this.db.stakingContract.update({
          where: { address },
          data: {
            isActive: false,
            endTime: now,
            accumulatedRewards: stakingInfo.accumulatedRewards.toString()
          }
        });
        
        this.logger.info('Early unstaking completed with penalty', {
          address,
          amount: stakingInfo.amount.toString(),
          penalty: penalty.toString(),
          finalAmount: finalAmount.toString()
        });
        
        return finalAmount;
      } else {
        // Normal unstaking
        const rewards = this.calculateRewards(stakingInfo);
        const finalAmount = stakingInfo.amount + rewards;
        
        // Update staking contract
        stakingInfo.isActive = false;
        stakingInfo.accumulatedRewards = rewards;
        
        // Update balance
        const balance = this.balances.get(address);
        if (balance) {
          balance.balance += finalAmount;
          balance.staked -= stakingInfo.amount;
          balance.lastUpdated = new Date();
          
          await this.updateBalanceInDB(balance);
        }
        
        this.totalStaked -= stakingInfo.amount;
        
        // Update database
        await this.db.stakingContract.update({
          where: { address },
          data: {
            isActive: false,
            endTime: now,
            accumulatedRewards: rewards.toString()
          }
        });
        
        this.logger.info('Unstaking completed', {
          address,
          amount: stakingInfo.amount.toString(),
          rewards: rewards.toString(),
          finalAmount: finalAmount.toString()
        });
        
        return finalAmount;
      }
    } catch (error) {
      this.logger.error('Unstaking failed', error);
      throw error;
    }
  }

  private calculateRewardRate(duration: number): number {
    // Base reward rate: 5% APY
    const baseRate = 0.05;
    
    // Bonus for longer durations
    if (duration >= 365) return baseRate * 1.5; // 7.5% for 1+ year
    if (duration >= 180) return baseRate * 1.3; // 6.5% for 6+ months
    if (duration >= 90) return baseRate * 1.2; // 6% for 3+ months
    if (duration >= 30) return baseRate * 1.1; // 5.5% for 1+ month
    
    return baseRate;
  }

  private calculateRewards(stakingInfo: StakingInfo): bigint {
    const now = new Date();
    const stakingDuration = (now.getTime() - stakingInfo.startTime.getTime()) / (1000 * 60 * 60 * 24 * 365); // in years
    
    const rewards = stakingInfo.amount * BigInt(Math.floor(stakingDuration * stakingInfo.rewardRate * 1000000000000000000));
    
    return rewards / 1000000000000000000n;
  }

  private calculateEarlyUnstakingPenalty(stakingInfo: StakingInfo): bigint {
    const now = new Date();
    const totalDuration = stakingInfo.endTime!.getTime() - stakingInfo.startTime.getTime();
    const elapsedDuration = now.getTime() - stakingInfo.startTime.getTime();
    const progressRatio = elapsedDuration / totalDuration;
    
    // Penalty decreases as we get closer to end date
    const penaltyRate = Math.max(0.1, 0.5 * (1 - progressRatio)); // 10% to 50% penalty
    
    return stakingInfo.amount * BigInt(Math.floor(penaltyRate * 1000000000000000000)) / 1000000000000000000n;
  }

  private async saveTransaction(transaction: KaldTransaction): Promise<void> {
    await this.db.kaldTransaction.create({
      data: {
        id: transaction.id,
        from: transaction.from,
        to: transaction.to,
        amount: transaction.amount.toString(),
        fee: transaction.fee.toString(),
        timestamp: transaction.timestamp,
        nonce: transaction.nonce,
        signature: transaction.signature,
        status: transaction.status,
        blockHeight: transaction.blockHeight,
        gasUsed: transaction.gasUsed
      }
    });
  }

  private async updateBalanceInDB(balance: KaldBalance): Promise<void> {
    await this.db.kaldBalance.upsert({
      where: { address: balance.address },
      update: {
        balance: balance.balance.toString(),
        staked: balance.staked.toString(),
        locked: balance.locked.toString(),
        lastUpdated: balance.lastUpdated
      },
      create: {
        address: balance.address,
        balance: balance.balance.toString(),
        staked: balance.staked.toString(),
        locked: balance.locked.toString(),
        lastUpdated: balance.lastUpdated
      }
    });
  }

  private async getNextNonce(address: string): Promise<number> {
    const lastTransaction = await this.db.kaldTransaction.findFirst({
      where: { from: address },
      orderBy: { nonce: 'desc' }
    });
    
    return lastTransaction ? lastTransaction.nonce + 1 : 0;
  }

  private generateTransactionId(): string {
    return `kald_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getConfig(): KaldCoinConfig {
    return { ...this.config };
  }

  public getTotalStaked(): bigint {
    return this.totalStaked;
  }

  public getStakingInfo(address: string): StakingInfo | undefined {
    return this.stakingContracts.get(address);
  }

  public async getTransactionHistory(address: string, limit: number = 50): Promise<KaldTransaction[]> {
    const transactions = await this.db.kaldTransaction.findMany({
      where: {
        OR: [
          { from: address },
          { to: address }
        ]
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
    
    return transactions.map(tx => ({
      id: tx.id,
      from: tx.from,
      to: tx.to,
      amount: BigInt(tx.amount),
      fee: BigInt(tx.fee),
      timestamp: new Date(tx.timestamp),
      nonce: tx.nonce,
      signature: tx.signature,
      status: tx.status as any,
      blockHeight: tx.blockHeight,
      gasUsed: tx.gasUsed
    }));
  }

  public async getSupplyInfo(): Promise<{
    totalSupply: bigint;
    circulatingSupply: bigint;
    stakedSupply: bigint;
    burnedSupply: bigint;
  }> {
    const totalSupply = this.config.totalSupply;
    let circulatingSupply = 0n;
    let stakedSupply = 0n;
    let burnedSupply = 0n;
    
    for (const balance of this.balances.values()) {
      if (balance.address !== '0x0000000000000000000000000000000000000000') {
        circulatingSupply += balance.balance;
        stakedSupply += balance.staked;
      }
    }
    
    burnedSupply = totalSupply - circulatingSupply - stakedSupply;
    
    return {
      totalSupply,
      circulatingSupply,
      stakedSupply,
      burnedSupply
    };
  }
}