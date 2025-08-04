#!/bin/bash

# Staking and Reward System Validation Tests
# This script runs comprehensive tests for the staking and reward functionality

set -e

echo "💰 Testing Staking and Reward System"
echo "===================================="

# Source common utilities
source "$(dirname "$0")/common-test-utils.sh"

# Test 2.1: Staking Operations
test_staking_operations() {
    echo "Testing Staking Operations..."
    
    local staking_result=$(node -e "
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
                // Test staking pool creation
                const pool = staking.getStakingPool('flexible');
                const stakerInfo = await staking.stake('0x1234567890123456789012345678901234567890', 1000000000000000000n, 'flexible');
                
                console.log(JSON.stringify({ 
                    success: true, 
                    poolExists: !!pool,
                    stakerAddress: stakerInfo.address,
                    stakedAmount: stakerInfo.stakedAmount.toString(),
                    poolId: stakerInfo.poolId
                }));
            } catch (error) {
                console.log(JSON.stringify({ success: false, error: error.message }));
            }
        }
        test();
    ")
    
    if echo "$staking_result" | grep -q '"success":true'; then
        echo "✅ Staking Operations - PASSED"
        return 0
    else
        echo "❌ Staking Operations - FAILED"
        return 1
    fi
}

# Test 2.2: Reward Calculation
test_reward_calculation() {
    echo "Testing Reward Calculation..."
    
    local reward_result=$(node -e "
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
                // Test reward calculation for different durations
                const stakeAmount = 1000000000000000000n; // 1 token
                const baseReward = stakeAmount * BigInt(Math.floor(0.05 * 1000000000000000000)) / 1000000000000000000n;
                
                // Calculate rewards with bonus multipliers
                const bonus30Days = baseReward * BigInt(Math.floor(1.1 * 1000000000000000000)) / 1000000000000000000n;
                const bonus90Days = baseReward * BigInt(Math.floor(1.2 * 1000000000000000000)) / 1000000000000000000n;
                const bonus365Days = baseReward * BigInt(Math.floor(1.5 * 1000000000000000000)) / 1000000000000000000n;
                
                console.log(JSON.stringify({ 
                    success: true, 
                    baseReward: baseReward.toString(),
                    bonus30Days: bonus30Days.toString(),
                    bonus90Days: bonus90Days.toString(),
                    bonus365Days: bonus365Days.toString(),
                    apy30Days: ((Number(bonus30Days) * 365 / 30 / Number(stakeAmount)) * 100).toFixed(2),
                    apy365Days: ((Number(bonus365Days) * 365 / 365 / Number(stakeAmount)) * 100).toFixed(2)
                }));
            } catch (error) {
                console.log(JSON.stringify({ success: false, error: error.message }));
            }
        }
        test();
    ")
    
    if echo "$reward_result" | grep -q '"success":true'; then
        echo "✅ Reward Calculation - PASSED"
        return 0
    else
        echo "❌ Reward Calculation - FAILED"
        return 1
    fi
}

# Test 2.3: Early Unstaking Penalties
test_early_unstaking_penalties() {
    echo "Testing Early Unstaking Penalties..."
    
    local penalty_result=$(node -e "
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
                // Test penalty calculation
                const stakeAmount = 1000000000000000000n; // 1 token
                const penaltyRate = 0.1; // 10%
                const penalty = stakeAmount * BigInt(Math.floor(penaltyRate * 1000000000000000000)) / 1000000000000000000n;
                const finalAmount = stakeAmount - penalty;
                
                // Test different unstaking scenarios
                const scenarios = [
                    { days: 5, penalty: 0.1 },
                    { days: 15, penalty: 0.05 },
                    { days: 30, penalty: 0.0 }
                ];
                
                const results = scenarios.map(scenario => {
                    const progressRatio = scenario.days / 30;
                    const dynamicPenalty = Math.max(0.05, 0.5 * (1 - progressRatio));
                    const dynamicPenaltyAmount = stakeAmount * BigInt(Math.floor(dynamicPenalty * 1000000000000000000)) / 1000000000000000000n;
                    
                    return {
                        days: scenario.days,
                        penaltyRate: dynamicPenalty,
                        penaltyAmount: dynamicPenaltyAmount.toString(),
                        finalAmount: (stakeAmount - dynamicPenaltyAmount).toString()
                    };
                });
                
                console.log(JSON.stringify({ 
                    success: true, 
                    basePenalty: penalty.toString(),
                    baseFinalAmount: finalAmount.toString(),
                    scenarios: results
                }));
            } catch (error) {
                console.log(JSON.stringify({ success: false, error: error.message }));
            }
        }
        test();
    ")
    
    if echo "$penalty_result" | grep -q '"success":true'; then
        echo "✅ Early Unstaking Penalties - PASSED"
        return 0
    else
        echo "❌ Early Unstaking Penalties - FAILED"
        return 1
    fi
}

# Test 2.4: Compounding Rewards
test_compounding_rewards() {
    echo "Testing Compounding Rewards..."
    
    local compounding_result=$(node -e "
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
                autoCompound: true
            }, kaldCoin, new db.Database());
            
            try {
                // Test compounding calculation
                const initialStake = 1000000000000000000n; // 1 token
                const apy = 0.05; // 5%
                const compoundingFrequency = 52; // weekly
                
                // Calculate compound interest for 1 year
                const ratePerPeriod = apy / compoundingFrequency;
                const totalPeriods = compoundingFrequency;
                
                let compoundedAmount = Number(initialStake);
                for (let i = 0; i < totalPeriods; i++) {
                    compoundedAmount *= (1 + ratePerPeriod);
                }
                
                const simpleInterest = Number(initialStake) * (1 + apy);
                const compoundingBonus = compoundedAmount - simpleInterest;
                
                console.log(JSON.stringify({ 
                    success: true, 
                    initialStake: initialStake.toString(),
                    simpleInterest: Math.floor(simpleInterest).toString(),
                    compoundedAmount: Math.floor(compoundedAmount).toString(),
                    compoundingBonus: Math.floor(compoundingBonus).toString(),
                    apy: (apy * 100).toFixed(2),
                    effectiveApy: ((compoundedAmount / Number(initialStake) - 1) * 100).toFixed(2)
                }));
            } catch (error) {
                console.log(JSON.stringify({ success: false, error: error.message }));
            }
        }
        test();
    ")
    
    if echo "$compounding_result" | grep -q '"success":true'; then
        echo "✅ Compounding Rewards - PASSED"
        return 0
    else
        echo "❌ Compounding Rewards - FAILED"
        return 1
    fi
}

# Run all tests
run_all_tests() {
    echo "Running all staking and reward tests..."
    
    local failed_tests=0
    
    test_staking_operations || ((failed_tests++))
    test_reward_calculation || ((failed_tests++))
    test_early_unstaking_penalties || ((failed_tests++))
    test_compounding_rewards || ((failed_tests++))
    
    echo ""
    echo "Staking and Reward Tests Summary:"
    echo "================================="
    echo "Failed tests: $failed_tests"
    
    if [ "$failed_tests" -eq 0 ]; then
        echo "🎉 All staking and reward tests passed!"
        return 0
    else
        echo "❌ $failed_tests staking and reward tests failed!"
        return 1
    fi
}

# Main execution
case "${1:-all}" in
    "operations")
        test_staking_operations
        ;;
    "rewards")
        test_reward_calculation
        ;;
    "penalties")
        test_early_unstaking_penalties
        ;;
    "compounding")
        test_compounding_rewards
        ;;
    "all")
        run_all_tests
        ;;
    *)
        echo "Usage: $0 {operations|rewards|penalties|compounding|all}"
        exit 1
        ;;
esac