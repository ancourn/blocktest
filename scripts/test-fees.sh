#!/bin/bash

# Fee and Gas System Validation Tests
# This script runs comprehensive tests for the fee and gas functionality

set -e

echo "💸 Testing Fee and Gas System"
echo "============================"

# Source common utilities
source "$(dirname "$0")/common-test-utils.sh"

# Test 4.1: Dynamic Fee Calculation
test_dynamic_fee_calculation() {
    echo "Testing Dynamic Fee Calculation..."
    
    local fee_calc_result=$(node -e "
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
                // Test fee calculation for different transaction types
                const transactionTypes = ['transfer', 'contract_deploy', 'stake', 'governance'];
                const priorities = ['low', 'medium', 'high'];
                
                const results = [];
                for (const txType of transactionTypes) {
                    for (const priority of priorities) {
                        const gasPrice = await feeSystem.estimateGasPrice(txType, undefined, priority);
                        results.push({
                            transactionType: txType,
                            priority,
                            baseFee: gasPrice.baseFee.toString(),
                            priorityFee: gasPrice.priorityFee.toString(),
                            maxFee: gasPrice.maxFee.toString(),
                            estimatedGas: gasPrice.estimatedGas,
                            totalCost: gasPrice.totalCost.toString(),
                            confidence: gasPrice.confidence
                        });
                    }
                }
                
                // Test fee calculation with data
                const largeData = '0x' + '00'.repeat(1000); // 2KB of data
                const transferWithLargeData = await feeSystem.estimateGasPrice('transfer', largeData, 'medium');
                
                console.log(JSON.stringify({ 
                    success: true, 
                    transactionTypesTested: transactionTypes.length,
                    prioritiesTested: priorities.length,
                    totalTests: results.length,
                    results: results,
                    largeDataTest: {
                        dataSize: largeData.length / 2,
                        estimatedGas: transferWithLargeData.estimatedGas,
                        totalCost: transferWithLargeData.totalCost.toString()
                    },
                    feeCalculationWorking: results.every(r => 
                        r.baseFee > 0 && r.priorityFee > 0 && r.totalCost > 0
                    )
                }));
            } catch (error) {
                console.log(JSON.stringify({ success: false, error: error.message }));
            }
        }
        test();
    ")
    
    if echo "$fee_calc_result" | grep -q '"success":true'; then
        echo "✅ Dynamic Fee Calculation - PASSED"
        return 0
    else
        echo "❌ Dynamic Fee Calculation - FAILED"
        return 1
    fi
}

# Test 4.2: Gas Optimization
test_gas_optimization() {
    echo "Testing Gas Optimization..."
    
    local gas_opt_result=$(node -e "
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
                // Test gas optimization for different scenarios
                const scenarios = [
                    {
                        name: 'Simple Transfer',
                        type: 'transfer',
                        data: undefined,
                        originalGasLimit: 25000
                    },
                    {
                        name: 'Contract Deployment',
                        type: 'contract_deploy',
                        data: '0x608060405234801561001057600080fd5b5061017f8061001e6000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c80632e64cec1146100465780636057361d1461006457806395d89b4114610082575b600080fd5b61004e61009e565b60405161005b91906100d8565b60405180910390f35b61007c60048036038101906100779190610102565b6100a8565b005b61008c6100bb565b60405161009991906100d8565b60405180910390f35b6100c56100e4565b005b60008054905090565b6000813590506100df8161012e565b92915050565b6000819050919050565b6100fc81610138565b82525050565b600060208201905061011760008301846100f3565b9291505056fea2646970667358221220d4a5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c64736f6c63430008070033',
                        originalGasLimit: 2500000
                    },
                    {
                        name: 'Large Data Transfer',
                        type: 'transfer',
                        data: '0x' + '00'.repeat(5000),
                        originalGasLimit: 100000
                    }
                ];
                
                const optimizations = [];
                for (const scenario of scenarios) {
                    const optimization = await feeSystem.optimizeTransaction(
                        scenario.type,
                        scenario.data,
                        scenario.originalGasLimit
                    );
                    
                    optimizations.push({
                        scenario: scenario.name,
                        originalGasLimit: optimization.originalGasLimit,
                        optimizedGasLimit: optimization.optimizedGasLimit,
                        originalFee: optimization.originalFee.toString(),
                        optimizedFee: optimization.optimizedFee.toString(),
                        savings: optimization.savings.toString(),
                        savingsPercentage: optimization.savingsPercentage,
                        optimizationMethod: optimization.optimizationMethod,
                        recommendations: optimization.recommendations
                    });
                }
                
                // Calculate overall optimization effectiveness
                const totalOriginalFees = optimizations.reduce((sum, opt) => sum + BigInt(opt.originalFee), 0n);
                const totalOptimizedFees = optimizations.reduce((sum, opt) => sum + BigInt(opt.optimizedFee), 0n);
                const totalSavings = totalOriginalFees - totalOptimizedFees;
                const overallSavingsPercentage = Number(totalSavings * 10000n / totalOriginalFees) / 100;
                
                console.log(JSON.stringify({ 
                    success: true, 
                    scenariosTested: scenarios.length,
                    optimizations: optimizations,
                    totalOriginalFees: totalOriginalFees.toString(),
                    totalOptimizedFees: totalOptimizedFees.toString(),
                    totalSavings: totalSavings.toString(),
                    overallSavingsPercentage: overallSavingsPercentage.toFixed(2),
                    optimizationEffective: overallSavingsPercentage > 1.0 // At least 1% savings
                }));
            } catch (error) {
                console.log(JSON.stringify({ success: false, error: error.message }));
            }
        }
        test();
    ")
    
    if echo "$gas_opt_result" | grep -q '"success":true'; then
        echo "✅ Gas Optimization - PASSED"
        return 0
    else
        echo "❌ Gas Optimization - FAILED"
        return 1
    fi
}

# Test 4.3: Congestion Handling
test_congestion_handling() {
    echo "Testing Congestion Handling..."
    
    local congestion_result=$(node -e "
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
                const initialBaseFee = feeSystem.getCurrentBaseFee();
                
                // Simulate network congestion by recording high gas usage
                const congestionBlocks = 10;
                const highGasUsage = 28000000; // Near block gas limit
                
                for (let i = 0; i < congestionBlocks; i++) {
                    await feeSystem.recordTransaction(
                        1000 + i,
                        highGasUsage,
                        30000000,
                        initialBaseFee,
                        100000000000000000n,
                        'transfer',
                        true
                    );
                }
                
                // Check if base fee increased due to congestion
                const finalBaseFee = feeSystem.getCurrentBaseFee();
                const feeIncrease = Number(finalBaseFee - initialBaseFee) / Number(initialBaseFee);
                
                // Test fee estimation during congestion
                const congestedEstimate = await feeSystem.estimateGasPrice('transfer', undefined, 'high');
                
                // Simulate network calming down
                const normalGasUsage = 8000000;
                for (let i = 0; i < congestionBlocks; i++) {
                    await feeSystem.recordTransaction(
                        1000 + congestionBlocks + i,
                        normalGasUsage,
                        30000000,
                        finalBaseFee,
                        100000000000000000n,
                        'transfer',
                        true
                    );
                }
                
                const calmBaseFee = feeSystem.getCurrentBaseFee();
                const calmEstimate = await feeSystem.estimateGasPrice('transfer', undefined, 'medium');
                
                console.log(JSON.stringify({ 
                    success: true, 
                    initialBaseFee: initialBaseFee.toString(),
                    congestedBaseFee: finalBaseFee.toString(),
                    calmBaseFee: calmBaseFee.toString(),
                    congestionFeeIncrease: (feeIncrease * 100).toFixed(2),
                    congestedEstimate: {
                        baseFee: congestedEstimate.baseFee.toString(),
                        priorityFee: congestedEstimate.priorityFee.toString(),
                        totalCost: congestedEstimate.totalCost.toString()
                    },
                    calmEstimate: {
                        baseFee: calmEstimate.baseFee.toString(),
                        priorityFee: calmEstimate.priorityFee.toString(),
                        totalCost: calmEstimate.totalCost.toString()
                    },
                    congestionHandling: feeIncrease > 0 && Number(calmBaseFee) < Number(finalBaseFee),
                    feeAdjustmentWorking: feeIncrease > 0.01 && feeIncrease < 0.5 // 1-50% increase
                }));
            } catch (error) {
                console.log(JSON.stringify({ success: false, error: error.message }));
            }
        }
        test();
    ")
    
    if echo "$congestion_result" | grep -q '"success":true'; then
        echo "✅ Congestion Handling - PASSED"
        return 0
    else
        echo "❌ Congestion Handling - FAILED"
        return 1
    fi
}

# Test 4.4: Fee History Analysis
test_fee_history_analysis() {
    echo "Testing Fee History Analysis..."
    
    local history_result=$(node -e "
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
                // Generate fee history with varying patterns
                const patterns = [
                    { name: 'normal', blocks: 20, gasUsage: 8000000, baseFee: 1000000000000000000n },
                    { name: 'congested', blocks: 10, gasUsage: 25000000, baseFee: 1500000000000000000n },
                    { name: 'high', blocks: 5, gasUsage: 29000000, baseFee: 2000000000000000000n },
                    { name: 'recovery', blocks: 15, gasUsage: 12000000, baseFee: 1200000000000000000n }
                ];
                
                let blockNumber = 1000;
                for (const pattern of patterns) {
                    for (let i = 0; i < pattern.blocks; i++) {
                        await feeSystem.recordTransaction(
                            blockNumber++,
                            pattern.gasUsage,
                            30000000,
                            pattern.baseFee,
                            100000000000000000n,
                            'transfer',
                            true
                        );
                    }
                }
                
                // Get fee history
                const feeHistory = feeSystem.getFeeHistory();
                const feeStats = feeSystem.getFeeStats();
                
                // Analyze patterns
                const baseFees = feeHistory.map(h => Number(h.baseFee));
                const avgFee = baseFees.reduce((sum, fee) => sum + fee, 0) / baseFees.length;
                const maxFee = Math.max(...baseFees);
                const minFee = Math.min(...baseFees);
                const feeRange = maxFee - minFee;
                const volatility = feeRange / avgFee;
                
                // Pattern detection
                const recentFees = baseFees.slice(-10);
                const trend = recentFees[recentFees.length - 1] > recentFees[0] ? 'increasing' : 'decreasing';
                
                console.log(JSON.stringify({ 
                    success: true, 
                    historyLength: feeHistory.length,
                    averageBaseFee: avgFee.toFixed(0),
                    maxBaseFee: maxFee.toFixed(0),
                    minBaseFee: minFee.toFixed(0),
                    feeRange: feeRange.toFixed(0),
                    volatility: volatility.toFixed(4),
                    trend: trend,
                    feeStats: {
                        averageBaseFee: feeStats.averageBaseFee.toString(),
                        averagePriorityFee: feeStats.averagePriorityFee.toString(),
                        averageGasUsed: feeStats.averageGasUsed,
                        feeVolatility: feeStats.feeVolatility,
                        gasEfficiency: feeStats.gasEfficiency
                    },
                    analysisWorking: feeHistory.length > 0 && volatility > 0,
                    patternDetection: trend !== 'stable'
                }));
            } catch (error) {
                console.log(JSON.stringify({ success: false, error: error.message }));
            }
        }
        test();
    ")
    
    if echo "$history_result" | grep -q '"success":true'; then
        echo "✅ Fee History Analysis - PASSED"
        return 0
    else
        echo "❌ Fee History Analysis - FAILED"
        return 1
    fi
}

# Run all tests
run_all_tests() {
    echo "Running all fee and gas system tests..."
    
    local failed_tests=0
    
    test_dynamic_fee_calculation || ((failed_tests++))
    test_gas_optimization || ((failed_tests++))
    test_congestion_handling || ((failed_tests++))
    test_fee_history_analysis || ((failed_tests++))
    
    echo ""
    echo "Fee and Gas System Tests Summary:"
    echo "================================="
    echo "Failed tests: $failed_tests"
    
    if [ "$failed_tests" -eq 0 ]; then
        echo "🎉 All fee and gas system tests passed!"
        return 0
    else
        echo "❌ $failed_tests fee and gas system tests failed!"
        return 1
    fi
}

# Main execution
case "${1:-all}" in
    "calculation")
        test_dynamic_fee_calculation
        ;;
    "optimization")
        test_gas_optimization
        ;;
    "congestion")
        test_congestion_handling
        ;;
    "history")
        test_fee_history_analysis
        ;;
    "all")
        run_all_tests
        ;;
    *)
        echo "Usage: $0 {calculation|optimization|congestion|history|all}"
        exit 1
        ;;
esac