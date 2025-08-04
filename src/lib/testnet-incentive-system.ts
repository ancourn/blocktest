import { db } from '@/lib/db';

export interface IncentiveProgram {
  id: string;
  name: string;
  description: string;
  type: 'transaction' | 'referral' | 'uptime' | 'staking' | 'governance';
  rewardAmount: number;
  maxParticipants?: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  requirements: {
    minTransactions?: number;
    minUptime?: number;
    minStake?: number;
    referralCount?: number;
  };
}

export interface Participant {
  id: string;
  address: string;
  nodeId?: string;
  joinDate: Date;
  totalRewards: number;
  transactionCount: number;
  uptime: number;
  referrals: string[];
  stakedAmount: number;
  isActive: boolean;
}

export interface RewardTransaction {
  id: string;
  participantId: string;
  programId: string;
  amount: number;
  type: 'earned' | 'claimed';
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  processedAt?: Date;
  txHash?: string;
}

export class TestnetIncentiveSystem {
  private static instance: TestnetIncentiveSystem;
  private programs: Map<string, IncentiveProgram> = new Map();
  private participants: Map<string, Participant> = new Map();
  private rewards: Map<string, RewardTransaction> = new Map();

  static getInstance(): TestnetIncentiveSystem {
    if (!TestnetIncentiveSystem.instance) {
      TestnetIncentiveSystem.instance = new TestnetIncentiveSystem();
    }
    return TestnetIncentiveSystem.instance;
  }

  constructor() {
    this.initializeDefaultPrograms();
  }

  private initializeDefaultPrograms() {
    const defaultPrograms: IncentiveProgram[] = [
      {
        id: 'first-100-tx',
        name: 'First 100 Transactions',
        description: 'Get 100 KALD for your first 100 transactions',
        type: 'transaction',
        rewardAmount: 100,
        maxParticipants: 100,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true,
        requirements: {
          minTransactions: 100
        }
      },
      {
        id: 'referral-program',
        name: 'Referral Program',
        description: 'Earn 50 KALD for each successful referral',
        type: 'referral',
        rewardAmount: 50,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        isActive: true,
        requirements: {
          referralCount: 1
        }
      },
      {
        id: 'uptime-rewards',
        name: 'Uptime Rewards',
        description: 'Earn 10 KALD per day for maintaining 99%+ uptime',
        type: 'uptime',
        rewardAmount: 10,
        startDate: new Date(),
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days
        isActive: true,
        requirements: {
          minUptime: 99
        }
      },
      {
        id: 'staking-bonus',
        name: 'Staking Bonus',
        description: 'Extra 5% bonus on staking rewards for testnet participants',
        type: 'staking',
        rewardAmount: 5, // 5% bonus
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        isActive: true,
        requirements: {
          minStake: 1000
        }
      },
      {
        id: 'governance-participation',
        name: 'Governance Participation',
        description: 'Earn 25 KALD for voting on governance proposals',
        type: 'governance',
        rewardAmount: 25,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        isActive: true,
        requirements: {}
      }
    ];

    defaultPrograms.forEach(program => {
      this.programs.set(program.id, program);
    });
  }

  async registerParticipant(address: string, nodeId?: string): Promise<Participant> {
    const existingParticipant = this.participants.get(address);
    if (existingParticipant) {
      return existingParticipant;
    }

    const participant: Participant = {
      id: `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      address,
      nodeId,
      joinDate: new Date(),
      totalRewards: 0,
      transactionCount: 0,
      uptime: 100,
      referrals: [],
      stakedAmount: 0,
      isActive: true
    };

    this.participants.set(address, participant);

    // Store in database
    try {
      await db.participant.create({
        data: {
          address,
          nodeId,
          joinDate: participant.joinDate,
          totalRewards: 0,
          transactionCount: 0,
          uptime: 100,
          referrals: [],
          stakedAmount: 0,
          isActive: true
        }
      });
    } catch (error) {
      console.error('Error storing participant in database:', error);
    }

    return participant;
  }

  async trackTransaction(address: string): Promise<void> {
    const participant = this.participants.get(address);
    if (!participant) {
      await this.registerParticipant(address);
      return;
    }

    participant.transactionCount++;

    // Check for transaction-based rewards
    await this.checkTransactionRewards(participant);

    // Update database
    try {
      await db.participant.update({
        where: { address },
        data: { transactionCount: participant.transactionCount }
      });
    } catch (error) {
      console.error('Error updating transaction count:', error);
    }
  }

  async trackReferral(referrerAddress: string, referredAddress: string): Promise<boolean> {
    const referrer = this.participants.get(referrerAddress);
    if (!referrer) {
      await this.registerParticipant(referrerAddress);
      return false;
    }

    // Check if already referred
    if (referrer.referrals.includes(referredAddress)) {
      return false;
    }

    referrer.referrals.push(referredAddress);

    // Check for referral rewards
    await this.checkReferralRewards(referrer);

    // Update database
    try {
      await db.participant.update({
        where: { address: referrerAddress },
        data: { referrals: referrer.referrals }
      });
    } catch (error) {
      console.error('Error updating referrals:', error);
    }

    return true;
  }

  async trackUptime(nodeId: string, uptime: number): Promise<void> {
    // Find participant by nodeId
    let participant: Participant | undefined;
    for (const [address, p] of this.participants) {
      if (p.nodeId === nodeId) {
        participant = p;
        break;
      }
    }

    if (!participant) {
      return;
    }

    participant.uptime = uptime;

    // Check for uptime rewards
    await this.checkUptimeRewards(participant);

    // Update database
    try {
      await db.participant.update({
        where: { address: participant.address },
        data: { uptime }
      });
    } catch (error) {
      console.error('Error updating uptime:', error);
    }
  }

  async trackStaking(address: string, amount: number): Promise<void> {
    const participant = this.participants.get(address);
    if (!participant) {
      await this.registerParticipant(address);
      return;
    }

    participant.stakedAmount = amount;

    // Check for staking rewards
    await this.checkStakingRewards(participant);

    // Update database
    try {
      await db.participant.update({
        where: { address },
        data: { stakedAmount: amount }
      });
    } catch (error) {
      console.error('Error updating staking amount:', error);
    }
  }

  private async checkTransactionRewards(participant: Participant): Promise<void> {
    const program = this.programs.get('first-100-tx');
    if (!program || !program.isActive) return;

    // Check if participant has already received this reward
    const hasReceived = Array.from(this.rewards.values()).some(
      reward => reward.participantId === participant.id && reward.programId === program.id
    );

    if (hasReceived) return;

    // Check requirements
    if (participant.transactionCount >= program.requirements.minTransactions!) {
      await this.awardReward(participant, program);
    }
  }

  private async checkReferralRewards(participant: Participant): Promise<void> {
    const program = this.programs.get('referral-program');
    if (!program || !program.isActive) return;

    // Award for each referral
    const referralCount = participant.referrals.length;
    const existingRewards = Array.from(this.rewards.values()).filter(
      reward => reward.participantId === participant.id && reward.programId === program.id
    );

    const rewardsToAward = referralCount - existingRewards.length;
    for (let i = 0; i < rewardsToAward; i++) {
      await this.awardReward(participant, program);
    }
  }

  private async checkUptimeRewards(participant: Participant): Promise<void> {
    const program = this.programs.get('uptime-rewards');
    if (!program || !program.isActive) return;

    // Check if uptime requirement is met
    if (participant.uptime >= program.requirements.minUptime!) {
      // Award daily (simplified - in production would track actual uptime periods)
      const today = new Date().toDateString();
      const hasRewardToday = Array.from(this.rewards.values()).some(
        reward => 
          reward.participantId === participant.id && 
          reward.programId === program.id &&
          reward.createdAt.toDateString() === today
      );

      if (!hasRewardToday) {
        await this.awardReward(participant, program);
      }
    }
  }

  private async checkStakingRewards(participant: Participant): Promise<void> {
    const program = this.programs.get('staking-bonus');
    if (!program || !program.isActive) return;

    if (participant.stakedAmount >= program.requirements.minStake!) {
      // This would be calculated based on actual staking rewards
      // For now, we'll award a fixed bonus
      const hasReceived = Array.from(this.rewards.values()).some(
        reward => reward.participantId === participant.id && reward.programId === program.id
      );

      if (!hasReceived) {
        await this.awardReward(participant, program);
      }
    }
  }

  private async awardReward(participant: Participant, program: IncentiveProgram): Promise<void> {
    const reward: RewardTransaction = {
      id: `reward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      participantId: participant.id,
      programId: program.id,
      amount: program.rewardAmount,
      type: 'earned',
      status: 'pending',
      createdAt: new Date()
    };

    this.rewards.set(reward.id, reward);
    participant.totalRewards += program.rewardAmount;

    // Process the reward (in production, this would involve actual blockchain transactions)
    await this.processReward(reward);

    // Update database
    try {
      await db.rewardTransaction.create({
        data: {
          participantId: participant.id,
          programId: program.id,
          amount: program.rewardAmount,
          type: 'earned',
          status: 'pending',
          createdAt: reward.createdAt
        }
      });

      await db.participant.update({
        where: { address: participant.address },
        data: { totalRewards: participant.totalRewards }
      });
    } catch (error) {
      console.error('Error storing reward in database:', error);
    }

    console.log(`Awarded ${program.rewardAmount} KALD to ${participant.address} for ${program.name}`);
  }

  private async processReward(reward: RewardTransaction): Promise<void> {
    // Simulate processing delay
    setTimeout(async () => {
      reward.status = 'completed';
      reward.processedAt = new Date();
      reward.txHash = `0x${Math.random().toString(16).substr(2, 64)}`;

      // Update database
      try {
        await db.rewardTransaction.update({
          where: { id: reward.id },
          data: {
            status: 'completed',
            processedAt: reward.processedAt,
            txHash: reward.txHash
          }
        });
      } catch (error) {
        console.error('Error updating reward status:', error);
      }
    }, 5000); // 5 second processing time
  }

  async getLeaderboard(limit: number = 10): Promise<Array<{
    rank: number;
    address: string;
    rewards: number;
    transactions: number;
    uptime: number;
  }>> {
    const participants = Array.from(this.participants.values())
      .filter(p => p.isActive)
      .sort((a, b) => b.totalRewards - a.totalRewards)
      .slice(0, limit);

    return participants.map((participant, index) => ({
      rank: index + 1,
      address: participant.address,
      rewards: participant.totalRewards,
      transactions: participant.transactionCount,
      uptime: participant.uptime
    }));
  }

  async getParticipantStats(address: string): Promise<{
    participant: Participant | null;
    eligiblePrograms: IncentiveProgram[];
    recentRewards: RewardTransaction[];
  }> {
    const participant = this.participants.get(address) || null;
    
    const eligiblePrograms = Array.from(this.programs.values())
      .filter(program => program.isActive && this.isEligibleForProgram(participant, program));

    const recentRewards = Array.from(this.rewards.values())
      .filter(reward => reward.participantId === participant?.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    return {
      participant,
      eligiblePrograms,
      recentRewards
    };
  }

  private isEligibleForProgram(participant: Participant | null, program: IncentiveProgram): boolean {
    if (!participant) return false;

    switch (program.type) {
      case 'transaction':
        return participant.transactionCount >= (program.requirements.minTransactions || 0);
      case 'referral':
        return participant.referrals.length >= (program.requirements.referralCount || 0);
      case 'uptime':
        return participant.uptime >= (program.requirements.minUptime || 0);
      case 'staking':
        return participant.stakedAmount >= (program.requirements.minStake || 0);
      case 'governance':
        return true; // Anyone can participate
      default:
        return false;
    }
  }

  async getProgramStats(): Promise<{
    totalParticipants: number;
    totalRewardsDistributed: number;
    activePrograms: number;
    programBreakdown: Array<{
      programId: string;
      programName: string;
      participants: number;
      rewardsDistributed: number;
    }>;
  }> {
    const totalParticipants = this.participants.size;
    const totalRewardsDistributed = Array.from(this.rewards.values())
      .filter(reward => reward.status === 'completed')
      .reduce((sum, reward) => sum + reward.amount, 0);

    const activePrograms = Array.from(this.programs.values()).filter(p => p.isActive).length;

    const programBreakdown = Array.from(this.programs.values()).map(program => {
      const programRewards = Array.from(this.rewards.values())
        .filter(reward => reward.programId === program.id && reward.status === 'completed');
      
      return {
        programId: program.id,
        programName: program.name,
        participants: new Set(programRewards.map(r => r.participantId)).size,
        rewardsDistributed: programRewards.reduce((sum, reward) => sum + reward.amount, 0)
      };
    });

    return {
      totalParticipants,
      totalRewardsDistributed,
      activePrograms,
      programBreakdown
    };
  }

  async generateReferralLink(address: string): Promise<string> {
    await this.registerParticipant(address);
    const referralCode = Buffer.from(address).toString('base64').substr(0, 16);
    return `https://kaldrix.network/join?ref=${referralCode}`;
  }

  async processReferral(referralCode: string, newAddress: string): Promise<boolean> {
    try {
      const referrerAddress = Buffer.from(referralCode, 'base64').toString('utf-8');
      return await this.trackReferral(referrerAddress, newAddress);
    } catch (error) {
      console.error('Error processing referral:', error);
      return false;
    }
  }
}

// Export singleton instance
export const incentiveSystem = TestnetIncentiveSystem.getInstance();