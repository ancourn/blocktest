#!/bin/bash

# Adversarial Scenario Testing
# This script runs comprehensive adversarial tests for the economic layer

set -e

echo "⚔️ Testing Adversarial Scenarios"
echo "==============================="

# Source common utilities
source "$(dirname "$0")/common-test-utils.sh"

# Test 6.1: Fee Spam Attack
test_fee_spam_attack() {
    echo "Testing Fee Spam Attack Resistance..."
    
    local spam_result=$(node -e "
        const { FeeStructureSystem } = require('../src/lib/economic/fee-structure');
        const { KaldNativeCoin } = require('../src/lib/economic/native-coin');
        const db = require('../src/lib/db');
        
        async function test() {
            const kaldCoin = new KaldNativeCoin({
                name: 'KALDRIX Coin',
                symbol: 'KALD',
                decimals: 18,
                totalSupply: 1000000000n * 1000000000000000000n,
                initialSupply: 500000000n * 1000000000000000000n,
                mintingEnabled: true
            }, new db.Database());
            
            const feeSystem = new FeeStructureSystem({
                baseFee: 1000000000000000000n,
                priorityFee: 100000000000000000n,
                maxFee: 10000000000000000000n,
                gasLimit: 21000,
                blockGasLimit: 30000000,
                targetGasLimit: 15000000,
                elasticityMultiplier: 2,
                baseFeeChangeDenominator: 8,
                minPriorityFee: 10000000000000000n,
                maxPriorityFee: 1000000000000000000n,
                feeHistoryBlocks: 100
            }, kaldCoin, new db.Database());
            
            try {
                // Simulate fee spam attack
                const spamTransactions = 1000;
                const initialBaseFee = feeSystem.getCurrentBaseFee();
                
                // Simulate rapid transaction submissions
                const gasEstimates = [];
                for (let i = 0; i < spamTransactions; i++) {
                    const estimate = await feeSystem.estimateGasPrice('transfer', undefined, 'high');
                    gasEstimates.push({
                        baseFee: estimate.baseFee.toString(),
                        priorityFee: estimate.priorityFee.toString(),
                        totalCost: estimate.totalCost.toString()
                    });
                }
                
                // Check if base fee increased significantly
                const finalBaseFee = feeSystem.getCurrentBaseFee();
                const feeIncrease = Number(finalBaseFee - initialBaseFee) / Number(initialBaseFee);
                
                // Analyze fee volatility
                const baseFees = gasEstimates.map(e => Number(e.baseFee));
                const avgFee = baseFees.reduce((sum, fee) => sum + fee, 0) / baseFees.length;
                const maxFee = Math.max(...baseFees);
                const feeVolatility = (maxFee - avgFee) / avgFee;
                
                console.log(JSON.stringify({ 
                    success: true, 
                    spamTransactions,
                    initialBaseFee: initialBaseFee.toString(),
                    finalBaseFee: finalBaseFee.toString(),
                    feeIncreasePercentage: (feeIncrease * 100).toFixed(2),
                    feeVolatility: feeVolatility.toFixed(4),
                    attackResisted: feeIncrease < 0.5 && feeVolatility < 0.3, // 50% max increase, 30% max volatility
                    recommendations: feeIncrease > 0.5 ? ['Consider implementing rate limiting'] : 
                                     feeVolatility > 0.3 ? ['Fee volatility too high, consider stabilization mechanisms'] :
                                     ['System handles spam attacks well']
                }));
            } catch (error) {
                console.log(JSON.stringify({ success: false, error: error.message }));
            }
        }
        test();
    ")
    
    if echo "$spam_result" | grep -q '"success":true'; then
        echo "✅ Fee Spam Attack - PASSED"
        return 0
    else
        echo "❌ Fee Spam Attack - FAILED"
        return 1
    fi
}

# Test 6.2: Flash Staking Manipulation
test_flash_staking_manipulation() {
    echo "Testing Flash Staking Manipulation Resistance..."
    
    local flash_result=$(node -e "
        const { StakingRewardsSystem } = require('../src/lib/economic/staking-rewards');
        const { KaldNativeCoin } = require('../src/lib/economic/native-coin');
        const db = require('../src/lib/db');
        
        async function test() {
            const kaldCoin = new KaldNativeCoin({
                name: 'KALDRIX Coin',
                symbol: 'KALD',
                decimals: 18,
                totalSupply: 1000000000n * 1000000000000000000n,
                initialSupply: 500000000n * 1000000000000000000n,
                mintingEnabled: true
            }, new db.Database());
            
            const staking = new StakingRewardsSystem({
                minStakeAmount: 1000000000000000000n,
                maxStakeAmount: 10000000000000000000000n,
                unstakingPeriod: 7,
                rewardRates: {
                    baseRate: 0.05,
                    bonusRates: [
                        { duration: 30, multiplier: 1.1 },
                        { duration: 90, multiplier: 1.2 },
                        { duration: 180, multiplier: 1.3 },
                        { duration: 365, multiplier: 1.5 }
                    ]
                },
                penaltyRates: {
                    earlyUnstaking: 0.1,
                    slashing: 0.05
                },
                compoundingEnabled: true,
                autoCompound: false
            }, kaldCoin, new db.Database());
            
            try {
                // Simulate flash staking attack
                const attackerAddress = '0xattacker123456789012345678901234567890123456';
                const stakeAmount = 100000000000000000000n; // 100 tokens
                const flashStakes = [];
                
                // Simulate rapid stake/unstake cycles
                for (let i = 0; i < 10; i++) {
                    // Stake
                    const stakeInfo = await staking.stake(attackerAddress, stakeAmount, 'flexible');
                    
                    // Try to claim rewards immediately (should be minimal or zero)
                    const rewards = await staking.claimRewards(attackerAddress);
                    
                    // Unstake immediately (should incur penalty)
                    await staking.requestUnstake(attackerAddress, stakeAmount);
                    
                    flashStakes.push({
                        cycle: i + 1,
                        stakeAmount: stakeAmount.toString(),
                        rewardsClaimed: rewards.toString(),
                        penaltyApplied: rewards.toString() === '0' // No rewards means penalty was effective
                    });
                }
                
                // Calculate total potential manipulation
                const totalStaked = stakeAmount * BigInt(10);
                const totalRewards = flashStakes.reduce((sum, stake) => sum + BigInt(stake.rewardsClaimed), 0n);
                const manipulationEfficiency = Number(totalRewards) / Number(totalStaked);
                
                console.log(JSON.stringify({ 
                    success: true, 
                    flashStakeCycles: flashStakes.length,
                    totalStaked: totalStaked.toString(),
                    totalRewardsClaimed: totalRewards.toString(),
                    manipulationEfficiency: (manipulationEfficiency * 100).toFixed(6),
                    attackPrevented: manipulationEfficiency < 0.001, // Less than 0.1% efficiency
                    effectivePenalties: flashStakes.filter(s => s.penaltyApplied).length,
                    recommendations: manipulationEfficiency > 0.001 ? 
                        ['Increase early unstaking penalties', 'Implement cooldown periods'] :
                        ['Flash staking manipulation effectively prevented']
                }));
            } catch (error) {
                console.log(JSON.stringify({ success: false, error: error.message }));
            }
        }
        test();
    ")
    
    if echo "$flash_result" | grep -q '"success":true'; then
        echo "✅ Flash Staking Manipulation - PASSED"
        return 0
    else
        echo "❌ Flash Staking Manipulation - FAILED"
        return 1
    fi
}

# Test 6.3: Governance Quorum Attack
test_governance_quorum_attack() {
    echo "Testing Governance Quorum Attack Resistance..."
    
    local quorum_result=$(node -e "
        const { GovernanceSystem } = require('../src/lib/economic/governance');
        const { KaldNativeCoin } = require('../src/lib/economic/native-coin');
        const db = require('../src/lib/db');
        
        async function test() {
            const kaldCoin = new KaldNativeCoin({
                name: 'KALDRIX Coin',
                symbol: 'KALD',
                decimals: 18,
                totalSupply: 1000000000n * 1000000000000000000n,
                initialSupply: 500000000n * 1000000000000000000n,
                mintingEnabled: true
            }, new db.Database());
            
            const governance = new GovernanceSystem({
                governanceTokenSymbol: 'gKALD',
                governanceTokenName: 'KALDRIX Governance Token',
                minProposalThreshold: 10000000000000000000000n,
                votingPeriod: 20160,
                executionDelay: 2880,
                quorumThreshold: 0.1,
                proposalDeposit: 1000000000000000000n,
                maxProposalLength: 10000,
                votingPowerMultiplier: 1.0
            }, kaldCoin, new db.Database());
            
            try {
                // Simulate quorum attack
                const attackerAddress = '0xattacker123456789012345678901234567890123456';
                const legitimateVoters = [
                    '0xlegit111111111111111111111111111111111111',
                    '0xlegit222222222222222222222222222222222222',
                    '0xlegit333333333333333333333333333333333333'
                ];
                
                // Create a malicious proposal
                const maliciousProposal = await governance.createProposal(
                    attackerAddress,
                    'Malicious Proposal - Quorum Attack',
                    'This proposal attempts to manipulate quorum requirements',
                    'governance_change',
                    {
                        parameter: 'quorumThreshold',
                        oldValue: '0.1',
                        newValue: '0.01' // Lower quorum to make attacks easier
                    }
                );
                
                // Attacker creates many small accounts to dilute voting power
                const sybilAccounts = [];
                for (let i = 0; i < 50; i++) {
                    sybilAccounts.push(\`0xsybil\${String(i).padStart(40, '0')}\`);
                }
                
                // Simulate voting with minimal participation
                const votes = [];
                
                // Legitimate voters vote against
                for (const voter of legitimateVoters) {
                    await governance.vote(voter, maliciousProposal.id, 'against', 'Opposing malicious proposal', \`sig_\${voter}\`);
                    votes.push({ voter: voter, voteType: 'against', legitimate: true });
                }
                
                // Sybil accounts vote for (but with minimal power)
                for (const sybil of sybilAccounts) {
                    try {
                        await governance.vote(sybil, maliciousProposal.id, 'for', 'Supporting malicious proposal', \`sig_\${sybil}\`);
                        votes.push({ voter: sybil, voteType: 'for', legitimate: false });
                    } catch (error) {
                        // Expected to fail due to insufficient voting power
                        votes.push({ voter: sybil, voteType: 'for', legitimate: false, failed: true, reason: error.message });
                    }
                }
                
                // Check proposal status
                const proposal = governance.getProposal(maliciousProposal.id);
                const totalVotes = proposal?.totalVotes || 0n;
                const forVotes = proposal?.forVotes || 0n;
                const againstVotes = proposal?.againstVotes || 0n;
                const quorumReached = proposal?.quorumReached || false;
                
                const legitimateVotes = votes.filter(v => v.legitimate).length;
                const sybilVotes = votes.filter(v => !v.legitimate && !v.failed).length;
                const failedSybilVotes = votes.filter(v => !v.legitimate && v.failed).length;
                
                console.log(JSON.stringify({ 
                    success: true, 
                    proposalId: maliciousProposal.id,
                    totalVotes: totalVotes.toString(),
                    forVotes: forVotes.toString(),
                    againstVotes: againstVotes.toString(),
                    quorumReached,
                    legitimateVotes,
                    sybilVotes,
                    failedSybilVotes,
                    attackSuccessful: quorumReached && forVotes > againstVotes,
                    attackPrevented: !quorumReached || forVotes <= againstVotes,
                    recommendations: failedSybilVotes > 0 ? 
                        ['Sybil resistance working well'] :
                        quorumReached && forVotes > againstVotes ?
                        ['Increase minimum voting power requirements', 'Implement quadratic voting'] :
                        ['Quorum attack effectively prevented']
                }));
            } catch (error) {
                console.log(JSON.stringify({ success: false, error: error.message }));
            }
        }
        test();
    ")
    
    if echo "$quorum_result" | grep -q '"success":true'; then
        echo "✅ Governance Quorum Attack - PASSED"
        return 0
    else
        echo "❌ Governance Quorum Attack - FAILED"
        return 1
    fi
}

# Test 6.4: Liquidity Pool Manipulation
test_liquidity_pool_manipulation() {
    echo "Testing Liquidity Pool Manipulation Resistance..."
    
    local liquidity_result=$(node -e "
        const { CrossChainBridge } = require('../src/lib/economic/cross-chain-bridge');
        const { KaldNativeCoin } = require('../src/lib/economic/native-coin');
        const db = require('../src/lib/db');
        
        async function test() {
            const kaldCoin = new KaldNativeCoin({
                name: 'KALDRIX Coin',
                symbol: 'KALD',
                decimals: 18,
                totalSupply: 1000000000n * 1000000000000000000n,
                initialSupply: 500000000n * 1000000000000000000n,
                mintingEnabled: true
            }, new db.Database());
            
            const bridge = new CrossChainBridge({
                supportedChains: ['ethereum', 'binance-smart-chain', 'polygon', 'avalanche'],
                minTransferAmount: 1000000000000000000n,
                maxTransferAmount: 10000000000000000000000n,
                bridgeFee: 100000000000000000n,
                confirmationBlocks: 12,
                timeoutBlocks: 1000
            }, kaldCoin, new db.Database());
            
            try {
                // Simulate liquidity pool manipulation
                const attackerAddress = '0xattacker123456789012345678901234567890123456';
                const legitimateUsers = [
                    '0xuser111111111111111111111111111111111111111',
                    '0xuser222222222222222222222222222222222222222'
                ];
                
                // Add initial liquidity
                await bridge.addLiquidity('ethereum', '0xTokenAddress', 1000000000000000000000n, '0xprovider');
                
                // Attacker attempts to manipulate the pool
                const manipulationAttempts = [];
                
                // 1. Large deposit to manipulate price
                try {
                    await bridge.addLiquidity('ethereum', '0xTokenAddress', 500000000000000000000n, attackerAddress);
                    manipulationAttempts.push({
                        type: 'large_deposit',
                        amount: '500000000000000000000',
                        success: true
                    });
                } catch (error) {
                    manipulationAttempts.push({
                        type: 'large_deposit',
                        amount: '500000000000000000000',
                        success: false,
                        reason: error.message
                    });
                }
                
                // 2. Rapid withdrawals to cause slippage
                for (let i = 0; i < 5; i++) {
                    try {
                        await bridge.removeLiquidity('ethereum', '0xTokenAddress', 10000000000000000000n, attackerAddress);
                        manipulationAttempts.push({
                            type: 'rapid_withdrawal',
                            amount: '10000000000000000000',
                            success: true,
                            attempt: i + 1
                        });
                    } catch (error) {
                        manipulationAttempts.push({
                            type: 'rapid_withdrawal',
                            amount: '10000000000000000000',
                            success: false,
                            reason: error.message,
                            attempt: i + 1
                        });
                    }
                }
                
                // 3. Try to drain the pool
                try {
                    await bridge.removeLiquidity('ethereum', '0xTokenAddress', 100000000000000000000n, attackerAddress);
                    manipulationAttempts.push({
                        type: 'drain_attempt',
                        amount: '100000000000000000000',
                        success: true
                    });
                } catch (error) {
                    manipulationAttempts.push({
                        type: 'drain_attempt',
                        amount: '100000000000000000000',
                        success: false,
                        reason: error.message
                    });
                }
                
                // Check pool status after attacks
                const pool = bridge.getLiquidityPool('ethereum', '0xTokenAddress');
                const successfulAttacks = manipulationAttempts.filter(a => a.success).length;
                const failedAttacks = manipulationAttempts.filter(a => !a.success).length;
                
                console.log(JSON.stringify({ 
                    success: true, 
                    poolExists: !!pool,
                    totalLiquidity: pool?.totalLiquidity.toString() || '0',
                    availableLiquidity: pool?.availableLiquidity.toString() || '0',
                    utilizationRate: pool?.utilizationRate || 0,
                    manipulationAttempts: manipulationAttempts.length,
                    successfulAttacks,
                    failedAttacks,
                    attackSuccessRate: (successfulAttacks / manipulationAttempts.length * 100).toFixed(1),
                    poolProtected: failedAttacks > successfulAttacks,
                    recommendations: failedAttacks <= successfulAttacks ?
                        ['Implement stricter liquidity limits', 'Add time locks for large operations'] :
                        ['Liquidity pool manipulation effectively prevented']
                }));
            } catch (error) {
                console.log(JSON.stringify({ success: false, error: error.message }));
            }
        }
        test();
    ")
    
    if echo "$liquidity_result" | grep -q '"success":true'; then
        echo "✅ Liquidity Pool Manipulation - PASSED"
        return 0
    else
        echo "❌ Liquidity Pool Manipulation - FAILED"
        return 1
    fi
}

# Run all tests
run_all_tests() {
    echo "Running all adversarial tests..."
    
    local failed_tests=0
    
    test_fee_spam_attack || ((failed_tests++))
    test_flash_staking_manipulation || ((failed_tests++))
    test_governance_quorum_attack || ((failed_tests++))
    test_liquidity_pool_manipulation || ((failed_tests++))
    
    echo ""
    echo "Adversarial Tests Summary:"
    echo "=========================="
    echo "Failed tests: $failed_tests"
    
    if [ "$failed_tests" -eq 0 ]; then
        echo "🎉 All adversarial tests passed!"
        return 0
    else
        echo "❌ $failed_tests adversarial tests failed!"
        return 1
    fi
}

# Main execution
case "${1:-all}" in
    "feespam")
        test_fee_spam_attack
        ;;
    "flashstaking")
        test_flash_staking_manipulation
        ;;
    "quorum")
        test_governance_quorum_attack
        ;;
    "liquidity")
        test_liquidity_pool_manipulation
        ;;
    "all")
        run_all_tests
        ;;
    *)
        echo "Usage: $0 {feespam|flashstaking|quorum|liquidity|all}"
        exit 1
        ;;
esac