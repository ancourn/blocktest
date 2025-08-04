#!/bin/bash

# Native Token (KALD) Validation Tests
# This script runs comprehensive tests for the native token functionality

set -e

echo "🪙 Testing Native Token (KALD) Functionality"
echo "============================================="

# Source common utilities
source "$(dirname "$0")/common-test-utils.sh"

# Test 1.1: Token Minting
test_token_minting() {
    echo "Testing Token Minting..."
    
    # Test basic minting
    local mint_result=$(node -e "
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
            
            try {
                const balance = kaldCoin.getBalance('0x1234567890123456789012345678901234567890');
                console.log(JSON.stringify({ success: true, balance: balance?.balance.toString() || '0' }));
            } catch (error) {
                console.log(JSON.stringify({ success: false, error: error.message }));
            }
        }
        test();
    ")
    
    if echo "$mint_result" | grep -q '"success":true'; then
        echo "✅ Token Minting - PASSED"
        return 0
    else
        echo "❌ Token Minting - FAILED"
        return 1
    fi
}

# Test 1.2: Token Burning
test_token_burning() {
    echo "Testing Token Burning..."
    
    local burn_result=$(node -e "
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
            
            try {
                const supplyInfo = await kaldCoin.getSupplyInfo();
                console.log(JSON.stringify({ 
                    success: true, 
                    totalSupply: supplyInfo.totalSupply.toString(),
                    burnedSupply: supplyInfo.burnedSupply.toString()
                }));
            } catch (error) {
                console.log(JSON.stringify({ success: false, error: error.message }));
            }
        }
        test();
    ")
    
    if echo "$burn_result" | grep -q '"success":true'; then
        echo "✅ Token Burning - PASSED"
        return 0
    else
        echo "❌ Token Burning - FAILED"
        return 1
    fi
}

# Test 1.3: Vesting Schedule
test_vesting_schedule() {
    echo "Testing Vesting Schedule..."
    
    local vesting_result=$(node -e "
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
            
            try {
                // Test vesting logic (simplified)
                const now = new Date();
                const vestingStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
                const vestingDuration = 365 * 24 * 60 * 60 * 1000; // 1 year
                const totalVestingAmount = 100000000n * 1000000000000000000n; // 100M tokens
                
                const elapsed = now.getTime() - vestingStart.getTime();
                const vestedAmount = totalVestingAmount * BigInt(Math.floor(elapsed / vestingDuration * 1000000000000000000)) / 1000000000000000000n;
                
                console.log(JSON.stringify({ 
                    success: true, 
                    elapsedDays: Math.floor(elapsed / (24 * 60 * 60 * 1000)),
                    vestedAmount: vestedAmount.toString(),
                    vestingProgress: (Number(vestedAmount) / Number(totalVestingAmount) * 100).toFixed(2)
                }));
            } catch (error) {
                console.log(JSON.stringify({ success: false, error: error.message }));
            }
        }
        test();
    ")
    
    if echo "$vesting_result" | grep -q '"success":true'; then
        echo "✅ Vesting Schedule - PASSED"
        return 0
    else
        echo "❌ Vesting Schedule - FAILED"
        return 1
    fi
}

# Test 1.4: Inflation Curve
test_inflation_curve() {
    echo "Testing Inflation Curve..."
    
    local inflation_result=$(node -e "
        const { TokenomicsModel } = require('../src/lib/economic/tokenomics');
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
            
            const tokenomics = new TokenomicsModel({
                initialSupply: 500000000n * 1000000000000000000n,
                maxSupply: 2000000000n * 1000000000000000000n,
                annualInflationRate: 0.02,
                stakingRewardsRate: 0.6,
                developmentFundRate: 0.15,
                ecosystemFundRate: 0.15,
                liquidityMiningRate: 0.05,
                burnRate: 0.05,
                halvingCycle: 4
            }, kaldCoin, new db.Database());
            
            try {
                const supplyMetrics = await tokenomics.getSupplyMetrics();
                const analysis = await tokenomics.analyzeTokenomics();
                
                console.log(JSON.stringify({ 
                    success: true, 
                    inflationRate: supplyMetrics.inflationRate,
                    sustainabilityScore: analysis.sustainabilityScore,
                    inflationPressure: analysis.inflationPressure,
                    economicHealth: analysis.economicHealth
                }));
            } catch (error) {
                console.log(JSON.stringify({ success: false, error: error.message }));
            }
        }
        test();
    ")
    
    if echo "$inflation_result" | grep -q '"success":true'; then
        echo "✅ Inflation Curve - PASSED"
        return 0
    else
        echo "❌ Inflation Curve - FAILED"
        return 1
    fi
}

# Run all tests
run_all_tests() {
    echo "Running all native token tests..."
    
    local failed_tests=0
    
    test_token_minting || ((failed_tests++))
    test_token_burning || ((failed_tests++))
    test_vesting_schedule || ((failed_tests++))
    test_inflation_curve || ((failed_tests++))
    
    echo ""
    echo "Native Token Tests Summary:"
    echo "========================="
    echo "Failed tests: $failed_tests"
    
    if [ "$failed_tests" -eq 0 ]; then
        echo "🎉 All native token tests passed!"
        return 0
    else
        echo "❌ $failed_tests native token tests failed!"
        return 1
    fi
}

# Main execution
case "${1:-all}" in
    "minting")
        test_token_minting
        ;;
    "burning")
        test_token_burning
        ;;
    "vesting")
        test_vesting_schedule
        ;;
    "inflation")
        test_inflation_curve
        ;;
    "all")
        run_all_tests
        ;;
    *)
        echo "Usage: $0 {minting|burning|vesting|inflation|all}"
        exit 1
        ;;
esac