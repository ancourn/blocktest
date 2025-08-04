#!/bin/bash

# KALDRIX Economic Layer Validation Automation Script
# This script runs comprehensive validation of the economic layer components

set -e

echo "🚀 Starting KALDRIX Economic Layer Validation"
echo "================================================="

# Configuration
VALIDATION_DIR="/tmp/kaldrix-validation"
LOG_FILE="$VALIDATION_DIR/validation.log"
REPORT_FILE="$VALIDATION_DIR/validation-report.md"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Create validation directory
mkdir -p "$VALIDATION_DIR"

# Initialize log file
echo "KALDRIX Economic Layer Validation - $TIMESTAMP" > "$LOG_FILE"
echo "=============================================" >> "$LOG_FILE"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to run validation test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    log "Running test: $test_name"
    
    if eval "$test_command" >> "$LOG_FILE" 2>&1; then
        log "✅ $test_name - PASSED"
        return 0
    else
        log "❌ $test_name - FAILED"
        return 1
    fi
}

# Function to create markdown report section
create_report_section() {
    local section_title="$1"
    local section_content="$2"
    
    echo "## $section_title" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "$section_content" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
}

# Initialize markdown report
cat > "$REPORT_FILE" << EOF
# KALDRIX Economic Layer Validation Report

**Date:** $TIMESTAMP  
**Environment:** $(node -p "process.env.NODE_ENV || 'development'")  
**Version:** $(cat package.json | grep version | head -1 | awk -F: '{print $2}' | sed 's/[", ]//g')

## Executive Summary

This report provides a comprehensive validation of the KALDRIX economic layer components, including native token operations, staking mechanisms, governance systems, fee structures, and cross-chain bridge functionality.

EOF

# 1. Native Token Validation
log "Starting Native Token Validation..."

native_token_results="### Test Results\n\n"
native_token_results+="| Test | Status | Details |\n"
native_token_results+="|------|--------|---------|\n"

# Test 1.1: Token Minting
if run_test "Token Minting" "npm run test:economic:native:mint"; then
    native_token_results+="| Token Minting | ✅ Passed | Successfully minted tokens with proper supply limits |\n"
else
    native_token_results+="| Token Minting | ❌ Failed | Token minting validation failed |\n"
fi

# Test 1.2: Token Burning
if run_test "Token Burning" "npm run test:economic:native:burn"; then
    native_token_results+="| Token Burning | ✅ Passed | Token burning mechanism working correctly |\n"
else
    native_token_results+="| Token Burning | ❌ Failed | Token burning validation failed |\n"
fi

# Test 1.3: Vesting Schedule
if run_test "Vesting Schedule" "npm run test:economic:native:vesting"; then
    native_token_results+="| Vesting Schedule | ✅ Passed | Token vesting schedules are properly enforced |\n"
else
    native_token_results+="| Vesting Schedule | ❌ Failed | Vesting schedule validation failed |\n"
fi

# Test 1.4: Inflation Curve
if run_test "Inflation Curve" "npm run test:economic:native:inflation"; then
    native_token_results+="| Inflation Curve | ✅ Passed | Inflation curve follows expected parameters |\n"
else
    native_token_results+="| Inflation Curve | ❌ Failed | Inflation curve validation failed |\n"
fi

create_report_section "Native Token (KALD) Validation" "$native_token_results"

# 2. Staking and Reward Validation
log "Starting Staking and Reward Validation..."

staking_results="### Test Results\n\n"
staking_results+="| Test | Status | Details |\n"
staking_results+="|------|--------|---------|\n"

# Test 2.1: Staking Operations
if run_test "Staking Operations" "npm run test:economic:staking:operations"; then
    staking_results+="| Staking Operations | ✅ Passed | Basic staking operations working correctly |\n"
else
    staking_results+="| Staking Operations | ❌ Failed | Staking operations validation failed |\n"
fi

# Test 2.2: Reward Calculation
if run_test "Reward Calculation" "npm run test:economic:staking:rewards"; then
    staking_results+="| Reward Calculation | ✅ Passed | Reward calculations are accurate |\n"
else
    staking_results+="| Reward Calculation | ❌ Failed | Reward calculation validation failed |\n"
fi

# Test 2.3: Early Unstaking Penalties
if run_test "Early Unstaking Penalties" "npm run test:economic:staking:penalties"; then
    staking_results+="| Early Unstaking Penalties | ✅ Passed | Early unstaking penalties applied correctly |\n"
else
    staking_results+="| Early Unstaking Penalties | ❌ Failed | Early unstaking penalty validation failed |\n"
fi

# Test 2.4: Compounding Rewards
if run_test "Compounding Rewards" "npm run test:economic:staking:compounding"; then
    staking_results+="| Compounding Rewards | ✅ Passed | Reward compounding mechanism working |\n"
else
    staking_results+="| Compounding Rewards | ❌ Failed | Reward compounding validation failed |\n"
fi

create_report_section "Staking and Reward System Validation" "$staking_results"

# 3. Governance System Validation
log "Starting Governance System Validation..."

governance_results="### Test Results\n\n"
governance_results+="| Test | Status | Details |\n"
governance_results+="|------|--------|---------|\n"

# Test 3.1: Proposal Creation
if run_test "Proposal Creation" "npm run test:economic:governance:proposals"; then
    governance_results+="| Proposal Creation | ✅ Passed | Proposal creation workflow working |\n"
else
    governance_results+="| Proposal Creation | ❌ Failed | Proposal creation validation failed |\n"
fi

# Test 3.2: Voting Mechanism
if run_test "Voting Mechanism" "npm run test:economic:governance:voting"; then
    governance_results+="| Voting Mechanism | ✅ Passed | Voting system functioning correctly |\n"
else
    governance_results+="| Voting Mechanism | ❌ Failed | Voting mechanism validation failed |\n"
fi

# Test 3.3: Delegation System
if run_test "Delegation System" "npm run test:economic:governance:delegation"; then
    governance_results+="| Delegation System | ✅ Passed | Vote delegation working properly |\n"
else
    governance_results+="| Delegation System | ❌ Failed | Delegation system validation failed |\n"
fi

# Test 3.4: Proposal Execution
if run_test "Proposal Execution" "npm run test:economic:governance:execution"; then
    governance_results+="| Proposal Execution | ✅ Passed | Proposal execution mechanism working |\n"
else
    governance_results+="| Proposal Execution | ❌ Failed | Proposal execution validation failed |\n"
fi

create_report_section "Governance System Validation" "$governance_results"

# 4. Fee and Gas System Validation
log "Starting Fee and Gas System Validation..."

fee_results="### Test Results\n\n"
fee_results+="| Test | Status | Details |\n"
fee_results+="|------|--------|---------|\n"

# Test 4.1: Dynamic Fee Calculation
if run_test "Dynamic Fee Calculation" "npm run test:economic:fees:calculation"; then
    fee_results+="| Dynamic Fee Calculation | ✅ Passed | Fee calculation algorithm working |\n"
else
    fee_results+="| Dynamic Fee Calculation | ❌ Failed | Fee calculation validation failed |\n"
fi

# Test 4.2: Gas Optimization
if run_test "Gas Optimization" "npm run test:economic:fees:optimization"; then
    fee_results+="| Gas Optimization | ✅ Passed | Gas optimization strategies effective |\n"
else
    fee_results+="| Gas Optimization | ❌ Failed | Gas optimization validation failed |\n"
fi

# Test 4.3: Congestion Handling
if run_test "Congestion Handling" "npm run test:economic:fees:congestion"; then
    fee_results+="| Congestion Handling | ✅ Passed | System handles network congestion properly |\n"
else
    fee_results+="| Congestion Handling | ❌ Failed | Congestion handling validation failed |\n"
fi

# Test 4.4: Fee History Analysis
if run_test "Fee History Analysis" "npm run test:economic:fees:history"; then
    fee_results+="| Fee History Analysis | ✅ Passed | Fee history tracking and analysis working |\n"
else
    fee_results+="| Fee History Analysis | ❌ Failed | Fee history analysis validation failed |\n"
fi

create_report_section "Fee and Gas System Validation" "$fee_results"

# 5. Cross-Chain Bridge Validation
log "Starting Cross-Chain Bridge Validation..."

bridge_results="### Test Results\n\n"
bridge_results+="| Test | Status | Details |\n"
bridge_results+="|------|--------|---------|\n"

# Test 5.1: Bridge Operations
if run_test "Bridge Operations" "npm run test:economic:bridge:operations"; then
    bridge_results+="| Bridge Operations | ✅ Passed | Basic bridge operations working |\n"
else
    bridge_results+="| Bridge Operations | ❌ Failed | Bridge operations validation failed |\n"
fi

# Test 5.2: Lock-Mint Round Trip
if run_test "Lock-Mint Round Trip" "npm run test:economic:bridge:lockmint"; then
    bridge_results+="| Lock-Mint Round Trip | ✅ Passed | Lock-mint mechanism working correctly |\n"
else
    bridge_results+="| Lock-Mint Round Trip | ❌ Failed | Lock-mint validation failed |\n"
fi

# Test 5.3: Burn-Release Round Trip
if run_test "Burn-Release Round Trip" "npm run test:economic:bridge:burnrelease"; then
    bridge_results+="| Burn-Release Round Trip | ✅ Passed | Burn-release mechanism working correctly |\n"
else
    bridge_results+="| Burn-Release Round Trip | ❌ Failed | Burn-release validation failed |\n"
fi

# Test 5.4: Failure Injection
if run_test "Failure Injection" "npm run test:economic:bridge:failures"; then
    bridge_results+="| Failure Injection | ✅ Passed | System handles bridge failures gracefully |\n"
else
    bridge_results+="| Failure Injection | ❌ Failed | Bridge failure injection validation failed |\n"
fi

create_report_section "Cross-Chain Bridge Validation" "$bridge_results"

# 6. Adversarial Scenario Testing
log "Starting Adversarial Scenario Testing..."

adversarial_results="### Test Results\n\n"
adversarial_results+="| Test | Status | Details |\n"
adversarial_results+="|------|--------|---------|\n"

# Test 6.1: Fee Spam Attack
if run_test "Fee Spam Attack" "npm run test:economic:adversarial:feespam"; then
    adversarial_results+="| Fee Spam Attack | ✅ Passed | System resists fee spam attacks |\n"
else
    adversarial_results+="| Fee Spam Attack | ❌ Failed | Fee spam attack resistance failed |\n"
fi

# Test 6.2: Flash Staking Manipulation
if run_test "Flash Staking Manipulation" "npm run test:economic:adversarial:flashstaking"; then
    adversarial_results+="| Flash Staking Manipulation | ✅ Passed | System prevents flash staking manipulation |\n"
else
    adversarial_results+="| Flash Staking Manipulation | ❌ Failed | Flash staking manipulation test failed |\n"
fi

# Test 6.3: Governance Quorum Attack
if run_test "Governance Quorum Attack" "npm run test:economic:adversarial:quorum"; then
    adversarial_results+="| Governance Quorum Attack | ✅ Passed | System resists governance quorum attacks |\n"
else
    adversarial_results+="| Governance Quorum Attack | ❌ Failed | Governance quorum attack test failed |\n"
fi

# Test 6.4: Liquidity Pool Manipulation
if run_test "Liquidity Pool Manipulation" "npm run test:economic:adversarial:liquidity"; then
    adversarial_results+="| Liquidity Pool Manipulation | ✅ Passed | System prevents liquidity pool manipulation |\n"
else
    adversarial_results+="| Liquidity Pool Manipulation | ❌ Failed | Liquidity manipulation test failed |\n"
fi

create_report_section "Adversarial Scenario Testing" "$adversarial_results"

# 7. Performance and Load Testing
log "Starting Performance and Load Testing..."

performance_results="### Test Results\n\n"
performance_results+="| Test | Status | Details |\n"
performance_results+="|------|--------|---------|\n"

# Test 7.1: High Throughput
if run_test "High Throughput" "npm run test:economic:performance:throughput"; then
    performance_results+="| High Throughput | ✅ Passed | System handles high transaction throughput |\n"
else
    performance_results+="| High Throughput | ❌ Failed | High throughput test failed |\n"
fi

# Test 7.2: Memory Usage
if run_test "Memory Usage" "npm run test:economic:performance:memory"; then
    performance_results+="| Memory Usage | ✅ Passed | Memory usage within acceptable limits |\n"
else
    performance_results+="| Memory Usage | ❌ Failed | Memory usage test failed |\n"
fi

# Test 7.3: Response Time
if run_test "Response Time" "npm run test:economic:performance:response"; then
    performance_results+="| Response Time | ✅ Passed | Response times meet requirements |\n"
else
    performance_results+="| Response Time | ❌ Failed | Response time test failed |\n"
fi

# Test 7.4: Resource Utilization
if run_test "Resource Utilization" "npm run test:economic:performance:resources"; then
    performance_results+="| Resource Utilization | ✅ Passed | Resource utilization optimized |\n"
else
    performance_results+="| Resource Utilization | ❌ Failed | Resource utilization test failed |\n"
fi

create_report_section "Performance and Load Testing" "$performance_results"

# Generate Summary Statistics
log "Generating Summary Statistics..."

summary_stats="### Key Metrics\n\n"
summary_stats+="| Metric | Value | Status |\n"
summary_stats+="|--------|-------|--------|\n"

# Count total tests
total_tests=$(grep -c "✅ Passed\|❌ Failed" "$REPORT_FILE")
passed_tests=$(grep -c "✅ Passed" "$REPORT_FILE")
failed_tests=$(grep -c "❌ Failed" "$REPORT_FILE")
success_rate=$(echo "scale=2; $passed_tests * 100 / $total_tests" | bc)

summary_stats+="| Total Tests | $total_tests | ✅ |\n"
summary_stats+="| Passed Tests | $passed_tests | ✅ |\n"
summary_stats+="| Failed Tests | $failed_tests | "
if [ "$failed_tests" -eq 0 ]; then
    summary_stats+="✅ |\n"
else
    summary_stats+="❌ |\n"
fi
summary_stats+="| Success Rate | ${success_rate}% | "
if (( $(echo "$success_rate >= 95" | bc -l) )); then
    summary_stats+="✅ |\n"
else
    summary_stats+="❌ |\n"
fi

# Add validation timestamp
summary_stats+="| Validation Duration | $(($SECONDS / 60)) minutes | ✅ |\n"
summary_stats+="| Environment | $(node -p "process.env.NODE_ENV || 'development'") | ✅ |\n"

create_report_section "Summary Statistics" "$summary_stats"

# Add Recommendations
recommendations="## Recommendations\n\n"

if [ "$failed_tests" -gt 0 ]; then
    recommendations+="### 🔴 Critical Issues\n\n"
    recommendations+="The following critical issues were identified and require immediate attention:\n\n"
    recommendations+="- Review and fix failed test cases\n"
    recommendations+="- Conduct additional security audits\n"
    recommendations+="- Implement fallback mechanisms for failed components\n\n"
fi

if (( $(echo "$success_rate < 99" | bc -l) )); then
    recommendations+="### 🟡 Performance Improvements\n\n"
    recommendations+="Consider the following performance improvements:\n\n"
    recommendations+="- Optimize gas usage for high-frequency operations\n"
    recommendations+="- Implement caching mechanisms for frequently accessed data\n"
    recommendations+="- Add additional monitoring and alerting\n\n"
fi

recommendations+="### 🟢 Optimization Opportunities\n\n"
recommendations+="Further optimization opportunities:\n\n"
recommendations+="- Implement advanced fee prediction algorithms\n"
recommendations+="- Add more sophisticated adversarial scenario testing\n"
recommendations+="- Enhance cross-chain bridge security measures\n"
recommendations+="- Develop more comprehensive economic modeling tools\n\n"

recommendations+="### 🔵 Future Enhancements\n\n"
recommendations+="Planned future enhancements:\n\n"
recommendations+="- Integration with additional blockchain networks\n"
recommendations+="- Implementation of advanced DeFi primitives\n"
recommendations+="- Enhanced governance mechanisms with quadratic voting\n"
recommendations+="- Advanced economic simulation and stress testing\n"

echo "$recommendations" >> "$REPORT_FILE"

# Final summary
log "Validation completed successfully!"
log "Total tests: $total_tests"
log "Passed: $passed_tests"
log "Failed: $failed_tests"
log "Success rate: ${success_rate}%"
log "Report generated at: $REPORT_FILE"

# Display summary
echo ""
echo "🎯 Validation Summary"
echo "=================="
echo "Total Tests: $total_tests"
echo "Passed: $passed_tests ✅"
echo "Failed: $failed_tests ❌"
echo "Success Rate: ${success_rate}%"
echo ""
echo "📄 Full Report: $REPORT_FILE"
echo "📋 Log File: $LOG_FILE"
echo ""

# Exit with appropriate code
if [ "$failed_tests" -gt 0 ]; then
    exit 1
else
    exit 0
fi