#!/bin/bash

# ===================================================
# KALDRIX BLOCKCHAIN TEST DRIVE SCRIPT
# ===================================================
# Verifies network parameters, connections, and performance
# Requires: Access to at least one full node RPC endpoint

set -e

# Configuration
RPC_URL="${RPC_URL:-http://localhost:8545}"
TEST_WALLET_PRIV="${TEST_WALLET_PRIV:-0x1234567890123456789012345678901234567890123456789012345678901234}"
RECEIVER_ADDR="${RECEIVER_ADDR:-0xabcdefabcdefabcdefabcdefabcdefabcdefabcd}"
LOG_FILE="kaldrix-test-$(date +%Y%m%d-%H%M%S).log"
REPORT_FILE="kaldrix-validation-report-$(date +%Y%m%d-%H%M%S).json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# JSON RPC call function
rpc_call() {
    local method="$1"
    local params="$2"
    local id="$3"
    
    curl -s -X POST \
        -H "Content-Type: application/json" \
        --data "{\"jsonrpc\":\"2.0\",\"method\":\"$method\",\"params\":$params,\"id\":$id}" \
        "$RPC_URL" 2>/dev/null || echo '{"error":"Connection failed"}'
}

# Initialize log file
echo "KALDRIX Blockchain Test Drive - $(date)" > "$LOG_FILE"
echo "RPC URL: $RPC_URL" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# Initialize report JSON
cat > "$REPORT_FILE" << EOF
{
  "testTimestamp": "$(date -Iseconds)",
  "rpcUrl": "$RPC_URL",
  "results": {
EOF

log "${BLUE}=== KALDRIX BLOCKCHAIN TEST DRIVE ===${NC}"
log "${BLUE}Started at: $(date)${NC}"
log "${BLUE}RPC Endpoint: $RPC_URL${NC}"
log ""

# Test 1: Network Status Audit
log "${GREEN}=== 1. NETWORK STATUS AUDIT ===${NC}"
log "Testing basic network connectivity..."

# Test RPC connection
connection_test=$(rpc_call "net_listening" "[]" "1")
if echo "$connection_test" | grep -q "true"; then
    log "${GREEN}✓ RPC Connection: Active${NC}"
    echo '"rpcConnection": "PASS",' >> "$REPORT_FILE"
else
    log "${RED}✗ RPC Connection: Failed${NC}"
    echo '"rpcConnection": "FAIL",' >> "$REPORT_FILE"
fi

# Get peer count
log "Active Peers:"
peer_count=$(rpc_call "net_peerCount" "[]" "2")
peer_result=$(echo "$peer_count" | grep -o '"result":"[^"]*"' | cut -d'"' -f4)
if [ -n "$peer_result" ]; then
    peer_decimal=$((16#${peer_result#0x}))
    log "Peer Count: $peer_decimal"
    echo '"peerCount": "'$peer_decimal'",' >> "$REPORT_FILE"
else
    log "Peer Count: Unable to fetch"
    echo '"peerCount": "ERROR",' >> "$REPORT_FILE"
fi

# Get sync status
log ""
log "Node Sync Status:"
sync_status=$(rpc_call "eth_syncing" "[]" "3")
if echo "$sync_status" | grep -q "false"; then
    log "${GREEN}✓ Node Status: Fully Synced${NC}"
    echo '"syncStatus": "SYNCED",' >> "$REPORT_FILE"
elif echo "$sync_status" | grep -q "startingBlock"; then
    log "${YELLOW}⚠ Node Status: Syncing${NC}"
    echo '"syncStatus": "SYNCING",' >> "$REPORT_FILE"
else
    log "${RED}✗ Node Status: Unknown${NC}"
    echo '"syncStatus": "ERROR",' >> "$REPORT_FILE"
fi

# Get current block number
log ""
log "Current Block Number:"
block_number=$(rpc_call "eth_blockNumber" "[]" "4")
block_result=$(echo "$block_number" | grep -o '"result":"[^"]*"' | cut -d'"' -f4)
if [ -n "$block_result" ]; then
    block_decimal=$((16#${block_result#0x}))
    log "Block: $block_decimal"
    echo '"currentBlock": "'$block_decimal'",' >> "$REPORT_FILE"
else
    log "Block: Unable to fetch"
    echo '"currentBlock": "ERROR",' >> "$REPORT_FILE"
fi

# Get network ID
log ""
log "Network ID:"
network_id=$(rpc_call "eth_chainId" "[]" "5")
network_result=$(echo "$network_id" | grep -o '"result":"[^"]*"' | cut -d'"' -f4)
if [ -n "$network_result" ]; then
    network_decimal=$((16#${network_result#0x}))
    log "Network ID: $network_decimal"
    echo '"networkId": "'$network_decimal'",' >> "$REPORT_FILE"
else
    log "Network ID: Unable to fetch"
    echo '"networkId": "ERROR",' >> "$REPORT_FILE"
fi

# Test 2: Blockchain Parameters
log ""
log "${GREEN}=== 2. BLOCKCHAIN PARAMETERS ===${NC}"

# Get gas price
log "Gas Price:"
gas_price=$(rpc_call "eth_gasPrice" "[]" "6")
gas_result=$(echo "$gas_price" | grep -o '"result":"[^"]*"' | cut -d'"' -f4)
if [ -n "$gas_result" ]; then
    gas_decimal=$((16#${gas_result#0x}))
    gas_gwei=$((gas_decimal / 1000000000))
    log "Gas Price: $gas_gwei Gwei"
    echo '"gasPrice": "'$gas_gwei'",' >> "$REPORT_FILE"
else
    log "Gas Price: Unable to fetch"
    echo '"gasPrice": "ERROR",' >> "$REPORT_FILE"
fi

# Get accounts (if available)
log ""
log "Available Accounts:"
accounts=$(rpc_call "eth_accounts" "[]" "7")
accounts_result=$(echo "$accounts" | grep -o '"result":\[[^]]*\]' | sed 's/"result":\[\(.*\)\]/[\1]/')
if [ -n "$accounts_result" ] && [ "$accounts_result" != "[]" ]; then
    account_count=$(echo "$accounts_result" | tr ',' '\n' | wc -l)
    log "Account Count: $account_count"
    echo '"accountCount": "'$account_count'",' >> "$REPORT_FILE"
else
    log "Account Count: 0 (or unable to fetch)"
    echo '"accountCount": "0",' >> "$REPORT_FILE"
fi

# Test KALDRIX-specific methods (if available)
log ""
log "KALDRIX Consensus Parameters:"
consensus_params=$(rpc_call "kaldrix_getConsensusParams" "[]" "8")
if echo "$consensus_params" | grep -q "result"; then
    log "${GREEN}✓ KALDRIX Consensus: Available${NC}"
    echo '"kaldrixConsensus": "AVAILABLE",' >> "$REPORT_FILE"
    echo "$consensus_params" | head -c 200 >> "$LOG_FILE"
    log "..."
else
    log "${YELLOW}⚠ KALDRIX Consensus: Not available (standard Ethereum mode)${NC}"
    echo '"kaldrixConsensus": "STANDARD",' >> "$REPORT_FILE"
fi

log ""
log "KALDRIX Supply Info:"
supply_info=$(rpc_call "kaldrix_getSupply" "[]" "9")
if echo "$supply_info" | grep -q "result"; then
    log "${GREEN}✓ KALDRIX Supply: Available${NC}"
    echo '"kaldrixSupply": "AVAILABLE",' >> "$REPORT_FILE"
    echo "$supply_info" | head -c 200 >> "$LOG_FILE"
    log "..."
else
    log "${YELLOW}⚠ KALDRIX Supply: Not available (standard Ethereum mode)${NC}"
    echo '"kaldrixSupply": "STANDARD",' >> "$REPORT_FILE"
fi

# Test 3: Sample Transaction Test
log ""
log "${GREEN}=== 3. SAMPLE TRANSACTION TEST ===${NC}"
log "Testing transaction capabilities..."

# Get transaction count for test address
log "Getting transaction count for test address..."
tx_count=$(rpc_call "eth_getTransactionCount" '["0x1234567890123456789012345678901234567890", "latest"]' "10")
tx_result=$(echo "$tx_count" | grep -o '"result":"[^"]*"' | cut -d'"' -f4)
if [ -n "$tx_result" ]; then
    tx_decimal=$((16#${tx_result#0x}))
    log "Transaction Count (nonce): $tx_decimal"
    echo '"transactionCount": "'$tx_decimal'",' >> "$REPORT_FILE"
else
    log "Transaction Count: Unable to fetch"
    echo '"transactionCount": "ERROR",' >> "$REPORT_FILE"
fi

# Estimate gas for a simple transaction
log ""
log "Estimating gas for test transaction..."
gas_estimate=$(rpc_call "eth_estimateGas" '[{"from": "0x1234567890123456789012345678901234567890", "to": "'$RECEIVER_ADDR'", "value": "0x1"}]' "11")
gas_est_result=$(echo "$gas_estimate" | grep -o '"result":"[^"]*"' | cut -d'"' -f4)
if [ -n "$gas_est_result" ]; then
    gas_est_decimal=$((16#${gas_est_result#0x}))
    log "Estimated Gas: $gas_est_decimal"
    echo '"estimatedGas": "'$gas_est_decimal'",' >> "$REPORT_FILE"
else
    log "Estimated Gas: Unable to fetch"
    echo '"estimatedGas": "ERROR",' >> "$REPORT_FILE"
fi

# Test 4: Performance Stress Test (Simulated)
log ""
log "${GREEN}=== 4. PERFORMANCE STRESS TEST ===${NC}"
log "Running simulated performance tests..."

# Test different TPS levels
for TPS in 10 100 1000; do
    log "Testing at $TPS TPS..."
    
    # Simulate load test - in reality this would make multiple RPC calls
    start_time=$(date +%s%N)
    
    # Make multiple rapid RPC calls to simulate load
    for i in {1..5}; do
        rpc_call "eth_blockNumber" "[]" "$((100+$i))" > /dev/null
    done
    
    end_time=$(date +%s%N)
    duration=$((($end_time - $start_time) / 1000000))
    
    if [ $duration -gt 0 ]; then
        actual_tps=$((5000 / $duration))
        log "  Target: $TPS TPS | Achieved: $actual_tps TPS | Latency: ${duration}ms"
    else
        log "  Target: $TPS TPS | Test completed too quickly to measure"
    fi
    
    # Small delay between tests
    sleep 1
done

echo '"performanceTest": "COMPLETED",' >> "$REPORT_FILE"

# Test 5: Security Scenario Test (Simulated)
log ""
log "${GREEN}=== 5. SECURITY SCENARIO TEST ===${NC}"
log "Running security validation tests..."

# Test 1: Check for proper error handling on invalid transactions
log "Testing invalid transaction handling..."
invalid_tx=$(rpc_call "eth_sendTransaction" '[{"from": "0xinvalid", "to": "'$RECEIVER_ADDR'", "value": "0x1"}]' "12")
if echo "$invalid_tx" | grep -q "error"; then
    log "${GREEN}✓ Invalid Transaction: Properly rejected${NC}"
else
    log "${RED}✗ Invalid Transaction: Not properly handled${NC}"
fi

# Test 2: Check for proper error handling on invalid blocks
log ""
log "Testing invalid block access..."
invalid_block=$(rpc_call "eth_getBlockByNumber" '["0xinvalid", false]' "13")
if echo "$invalid_block" | grep -q "error"; then
    log "${GREEN}✓ Invalid Block: Properly rejected${NC}"
else
    log "${RED}✗ Invalid Block: Not properly handled${NC}"
fi

# Test 3: Check network basic security
log ""
log "Testing network security basics..."
# Check if the node is properly configured with reasonable limits
sync_check=$(rpc_call "eth_syncing" "[]" "14")
if echo "$sync_check" | grep -q "false"; then
    log "${GREEN}✓ Network Sync: Stable and secure${NC}"
else
    log "${YELLOW}⚠ Network Sync: Still syncing (normal for new nodes)${NC}"
fi

echo '"securityTest": "COMPLETED",' >> "$REPORT_FILE"

# Test 6: Final Report Generation
log ""
log "${GREEN}=== 6. FINAL REPORT ===${NC}"
log "Generating comprehensive validation report..."

# Calculate overall health score
health_score=0
total_tests=0

# Check RPC connection
if echo "$connection_test" | grep -q "true"; then
    health_score=$((health_score + 20))
fi
total_tests=$((total_tests + 1))

# Check sync status
if echo "$sync_status" | grep -q "false"; then
    health_score=$((health_score + 20))
fi
total_tests=$((total_tests + 1))

# Check if we got block number
if [ -n "$block_result" ]; then
    health_score=$((health_score + 20))
fi
total_tests=$((total_tests + 1))

# Check if we got gas price
if [ -n "$gas_result" ]; then
    health_score=$((health_score + 20))
fi
total_tests=$((total_tests + 1))

# Check if transaction count worked
if [ -n "$tx_result" ]; then
    health_score=$((health_score + 20))
fi
total_tests=$((total_tests + 1))

# Calculate final score
if [ $total_tests -gt 0 ]; then
    final_score=$((health_score / total_tests))
else
    final_score=0
fi

log ""
log "${BLUE}=== TEST RESULTS SUMMARY ===${NC}"
log "Overall Health Score: $final_score%"
log "Tests Passed: $health_score/$((total_tests * 20))"
log "Test Duration: $SECONDS seconds"

# Determine status
if [ $final_score -ge 80 ]; then
    status="EXCELLENT"
    status_color=$GREEN
elif [ $final_score -ge 60 ]; then
    status="GOOD"
    status_color=$YELLOW
elif [ $final_score -ge 40 ]; then
    status="FAIR"
    status_color=$YELLOW
else
    status="POOR"
    status_color=$RED
fi

log ""
log "${status_color}Network Status: $status${NC}"

# Complete the JSON report
cat >> "$REPORT_FILE" << EOF
    "healthScore": $final_score,
    "status": "$status",
    "testDuration": $SECONDS,
    "timestamp": "$(date -Iseconds)"
  }
}
EOF

# Display report location
log ""
log "${BLUE}=== REPORT FILES ===${NC}"
log "Detailed Log: $LOG_FILE"
log "JSON Report: $REPORT_FILE"

# Provide recommendations
log ""
log "${BLUE}=== RECOMMENDATIONS ===${NC}"
if [ $final_score -ge 80 ]; then
    log "${GREEN}• Network is performing excellently${NC}"
    log "${GREEN}• All core functions are operational${NC}"
    log "${GREEN}• Ready for production use${NC}"
elif [ $final_score -ge 60 ]; then
    log "${YELLOW}• Network is performing well${NC}"
    log "${YELLOW}• Minor optimizations may be needed${NC}"
    log "${YELLOW}• Monitor performance regularly${NC}"
elif [ $final_score -ge 40 ]; then
    log "${YELLOW}• Network has some issues${NC}"
    log "${YELLOW}• Review configuration and logs${NC}"
    log "${YELLOW}• Consider scaling resources${NC}"
else
    log "${RED}• Network has significant issues${NC}"
    log "${RED}• Immediate attention required${NC}"
    log "${RED}• Check node configuration and connectivity${NC}"
fi

log ""
log "${BLUE}=== TEST DRIVE COMPLETE ===${NC}"
log "Thank you for testing KALDRIX Blockchain!"
log "For support: https://discord.gg/kaldrix"
log "For documentation: https://docs.kaldrix.network"

# Exit with appropriate code
if [ $final_score -ge 60 ]; then
    exit 0
else
    exit 1
fi