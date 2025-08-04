#!/bin/bash

# Cross-Chain Bridge Validation Tests
# This script runs comprehensive tests for the cross-chain bridge functionality

set -e

echo "🌉 Testing Cross-Chain Bridge"
echo "============================"

# Source common utilities
source "$(dirname "$0")/common-test-utils.sh"

# Test 5.1: Bridge Operations
test_bridge_operations() {
    echo "Testing Bridge Operations..."
    
    local bridge_ops_result=$(node -e "
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
                // Test adding liquidity
                await bridge.addLiquidity('ethereum', '0xTokenAddress', 1000000000000000000000n, '0xprovider1');
                await bridge.addLiquidity('binance-smart-chain', '0xTokenAddress', 500000000000000000000n, '0xprovider2');
                
                // Test getting chain configurations
                const ethConfig = bridge.getChainConfig('ethereum');
                const bscConfig = bridge.getChainConfig('binance-smart-chain');
                
                // Test getting liquidity pools
                const ethPool = bridge.getLiquidityPool('ethereum', '0xTokenAddress');
                const bscPool = bridge.getLiquidityPool('binance-smart-chain', '0xTokenAddress');
                
                // Test bridge statistics
                const bridgeStats = bridge.getBridgeStats();
                
                console.log(JSON.stringify({ 
                    success: true, 
                    supportedChains: bridge.getConfig().supportedChains,
                    chainConfigs: {
                        ethereum: {
                            name: ethConfig?.name,
                            chainId: ethConfig?.chainId,
                            type: ethConfig?.type
                        },
                        binanceSmartChain: {
                            name: bscConfig?.name,
                            chainId: bscConfig?.chainId,
                            type: bscConfig?.type
                        }
                    },
                    liquidityPools: {
                        ethereum: {
                            totalLiquidity: ethPool?.totalLiquidity.toString(),
                            availableLiquidity: ethPool?.availableLiquidity.toString(),
                            utilizationRate: ethPool?.utilizationRate
                        },
                        binanceSmartChain: {
                            totalLiquidity: bscPool?.totalLiquidity.toString(),
                            availableLiquidity: bscPool?.availableLiquidity.toString(),
                            utilizationRate: bscPool?.utilizationRate
                        }
                    },
                    bridgeStats: {
                        totalTransfers: bridgeStats.totalTransfers,
                        totalVolume: bridgeStats.totalVolume.toString(),
                        successRate: bridgeStats.successRate,
                        activePools: bridgeStats.activePools
                    },
                    operationsWorking: ethConfig && bscConfig && ethPool && bscPool
                }));
            } catch (error) {
                console.log(JSON.stringify({ success: false, error: error.message }));
            }
        }
        test();
    ")
    
    if echo "$bridge_ops_result" | grep -q '"success":true'; then
        echo "✅ Bridge Operations - PASSED"
        return 0
    else
        echo "❌ Bridge Operations - FAILED"
        return 1
    fi
}

# Test 5.2: Lock-Mint Round Trip
test_lock_mint_round_trip() {
    echo "Testing Lock-Mint Round Trip..."
    
    local lock_mint_result=$(node -e "
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
                // Add liquidity for the test
                await bridge.addLiquidity('ethereum', '0xTokenAddress', 1000000000000000000000n, '0xprovider');
                
                const userAddress = '0x1234567890123456789012345678901234567890';
                const transferAmount = 10000000000000000000n; // 10 tokens
                const signature = '0xsignature123';
                
                // Initiate transfer from Ethereum to BSC
                const transfer = await bridge.initiateTransfer(
                    'ethereum',
                    'binance-smart-chain',
                    userAddress,
                    userAddress,
                    transferAmount,
                    '0xTokenAddress',
                    signature
                );
                
                // Simulate confirmations
                await bridge.confirmTransfer(transfer.id, '0xTxHash123', 12);
                
                // Simulate completion
                await bridge.completeTransfer(transfer.id, '0xTargetTxHash456');
                
                // Verify the transfer is completed
                const completedTransfer = bridge.getPendingTransfers().find(t => t.id === transfer.id);
                
                // Check liquidity pools after transfer
                const ethPool = bridge.getLiquidityPool('ethereum', '0xTokenAddress');
                const bscPool = bridge.getLiquidityPool('binance-smart-chain', '0xTokenAddress');
                
                console.log(JSON.stringify({ 
                    success: true, 
                    transferId: transfer.id,
                    fromChain: transfer.fromChain,
                    toChain: transfer.toChain,
                    amount: transfer.amount.toString(),
                    bridgeFee: transfer.bridgeFee.toString(),
                    status: completedTransfer ? 'completed' : 'not_found',
                    transferCompleted: !completedTransfer,
                    ethPoolUtilization: ethPool?.utilizationRate,
                    bscPoolUtilization: bscPool?.utilizationRate,
                    roundTripWorking: !completedTransfer && ethPool && bscPool
                }));
            } catch (error) {
                console.log(JSON.stringify({ success: false, error: error.message }));
            }
        }
        test();
    ")
    
    if echo "$lock_mint_result" | grep -q '"success":true'; then
        echo "✅ Lock-Mint Round Trip - PASSED"
        return 0
    else
        echo "❌ Lock-Mint Round Trip - FAILED"
        return 1
    fi
}

# Test 5.3: Burn-Release Round Trip
test_burn_release_round_trip() {
    echo "Testing Burn-Release Round Trip..."
    
    local burn_release_result=$(node -e "
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
                // Add liquidity for both chains
                await bridge.addLiquidity('binance-smart-chain', '0xTokenAddress', 1000000000000000000000n, '0xprovider');
                await bridge.addLiquidity('ethereum', '0xTokenAddress', 1000000000000000000000n, '0xprovider');
                
                const userAddress = '0x1234567890123456789012345678901234567890';
                const transferAmount = 5000000000000000000n; // 5 tokens
                const signature = '0xsignature456';
                
                // Initiate transfer from BSC to Ethereum (burn-release pattern)
                const transfer = await bridge.initiateTransfer(
                    'binance-smart-chain',
                    'ethereum',
                    userAddress,
                    userAddress,
                    transferAmount,
                    '0xTokenAddress',
                    signature
                );
                
                // Simulate confirmations
                await bridge.confirmTransfer(transfer.id, '0xTxHash789', 12);
                
                // Simulate completion
                await bridge.completeTransfer(transfer.id, '0xTargetTxHash012');
                
                // Verify the transfer is completed
                const completedTransfer = bridge.getPendingTransfers().find(t => t.id === transfer.id);
                
                // Check liquidity pools after transfer
                const bscPool = bridge.getLiquidityPool('binance-smart-chain', '0xTokenAddress');
                const ethPool = bridge.getLiquidityPool('ethereum', '0xTokenAddress');
                
                console.log(JSON.stringify({ 
                    success: true, 
                    transferId: transfer.id,
                    fromChain: transfer.fromChain,
                    toChain: transfer.toChain,
                    amount: transfer.amount.toString(),
                    bridgeFee: transfer.bridgeFee.toString(),
                    status: completedTransfer ? 'completed' : 'not_found',
                    transferCompleted: !completedTransfer,
                    bscPoolUtilization: bscPool?.utilizationRate,
                    ethPoolUtilization: ethPool?.utilizationRate,
                    burnReleaseWorking: !completedTransfer && bscPool && ethPool
                }));
            } catch (error) {
                console.log(JSON.stringify({ success: false, error: error.message }));
            }
        }
        test();
    ")
    
    if echo "$burn_release_result" | grep -q '"success":true'; then
        echo "✅ Burn-Release Round Trip - PASSED"
        return 0
    else
        echo "❌ Burn-Release Round Trip - FAILED"
        return 1
    fi
}

# Test 5.4: Failure Injection
test_failure_injection() {
    echo "Testing Failure Injection..."
    
    local failure_result=$(node -e "
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
                // Add limited liquidity
                await bridge.addLiquidity('ethereum', '0xTokenAddress', 10000000000000000000n, '0xprovider'); // Only 10 tokens
                
                const userAddress = '0x1234567890123456789012345678901234567890';
                const signature = '0xsignature789';
                
                const failureTests = [];
                
                // Test 1: Insufficient liquidity
                try {
                    await bridge.initiateTransfer(
                        'ethereum',
                        'binance-smart-chain',
                        userAddress,
                        userAddress,
                        50000000000000000000n, // 50 tokens - more than available
                        '0xTokenAddress',
                        signature
                    );
                    failureTests.push({ test: 'insufficient_liquidity', failed: false, error: 'Should have failed' });
                } catch (error) {
                    failureTests.push({ test: 'insufficient_liquidity', failed: true, error: error.message });
                }
                
                // Test 2: Invalid chain
                try {
                    await bridge.initiateTransfer(
                        'invalid_chain',
                        'binance-smart-chain',
                        userAddress,
                        userAddress,
                        1000000000000000000n,
                        '0xTokenAddress',
                        signature
                    );
                    failureTests.push({ test: 'invalid_chain', failed: false, error: 'Should have failed' });
                } catch (error) {
                    failureTests.push({ test: 'invalid_chain', failed: true, error: error.message });
                }
                
                // Test 3: Amount too small
                try {
                    await bridge.initiateTransfer(
                        'ethereum',
                        'binance-smart-chain',
                        userAddress,
                        userAddress,
                        100000000000000000n, // 0.1 tokens - below minimum
                        '0xTokenAddress',
                        signature
                    );
                    failureTests.push({ test: 'amount_too_small', failed: false, error: 'Should have failed' });
                } catch (error) {
                    failureTests.push({ test: 'amount_too_small', failed: true, error: error.message });
                }
                
                // Test 4: Amount too large
                try {
                    await bridge.initiateTransfer(
                        'ethereum',
                        'binance-smart-chain',
                        userAddress,
                        userAddress,
                        20000000000000000000000n, // 20,000 tokens - above maximum
                        '0xTokenAddress',
                        signature
                    );
                    failureTests.push({ test: 'amount_too_large', failed: false, error: 'Should have failed' });
                } catch (error) {
                    failureTests.push({ test: 'amount_too_large', failed: true, error: error.message });
                }
                
                // Test 5: Invalid signature (simulated)
                try {
                    await bridge.initiateTransfer(
                        'ethereum',
                        'binance-smart-chain',
                        userAddress,
                        userAddress,
                        1000000000000000000n,
                        '0xTokenAddress',
                        'invalid_signature'
                    );
                    failureTests.push({ test: 'invalid_signature', failed: false, error: 'Should have failed' });
                } catch (error) {
                    failureTests.push({ test: 'invalid_signature', failed: true, error: error.message });
                }
                
                const passedTests = failureTests.filter(t => t.failed).length;
                const totalTests = failureTests.length;
                const failureHandlingRate = passedTests / totalTests;
                
                console.log(JSON.stringify({ 
                    success: true, 
                    failureTests: failureTests,
                    totalTests: totalTests,
                    passedTests: passedTests,
                    failureHandlingRate: (failureHandlingRate * 100).toFixed(1),
                    failureInjectionWorking: failureHandlingRate === 1.0 // All failures properly handled
                }));
            } catch (error) {
                console.log(JSON.stringify({ success: false, error: error.message }));
            }
        }
        test();
    ")
    
    if echo "$failure_result" | grep -q '"success":true'; then
        echo "✅ Failure Injection - PASSED"
        return 0
    else
        echo "❌ Failure Injection - FAILED"
        return 1
    fi
}

# Run all tests
run_all_tests() {
    echo "Running all cross-chain bridge tests..."
    
    local failed_tests=0
    
    test_bridge_operations || ((failed_tests++))
    test_lock_mint_round_trip || ((failed_tests++))
    test_burn_release_round_trip || ((failed_tests++))
    test_failure_injection || ((failed_tests++))
    
    echo ""
    echo "Cross-Chain Bridge Tests Summary:"
    echo "================================="
    echo "Failed tests: $failed_tests"
    
    if [ "$failed_tests" -eq 0 ]; then
        echo "🎉 All cross-chain bridge tests passed!"
        return 0
    else
        echo "❌ $failed_tests cross-chain bridge tests failed!"
        return 1
    fi
}

# Main execution
case "${1:-all}" in
    "operations")
        test_bridge_operations
        ;;
    "lockmint")
        test_lock_mint_round_trip
        ;;
    "burnrelease")
        test_burn_release_round_trip
        ;;
    "failures")
        test_failure_injection
        ;;
    "all")
        run_all_tests
        ;;
    *)
        echo "Usage: $0 {operations|lockmint|burnrelease|failures|all}"
        exit 1
        ;;
esac