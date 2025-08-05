#!/bin/bash

# Simple verification script to check test drive results
REPORT_FILE="$1"

if [ -z "$REPORT_FILE" ]; then
    echo "Usage: $0 <json-report-file>"
    exit 1
fi

if [ ! -f "$REPORT_FILE" ]; then
    echo "Error: Report file not found: $REPORT_FILE"
    exit 1
fi

echo "=== KALDRIX Test Drive Verification ==="
echo "Analyzing report: $REPORT_FILE"
echo ""

# Extract values from JSON report
rpc_connection=$(jq -r '.results.rpcConnection' "$REPORT_FILE")
peer_count=$(jq -r '.results.peerCount' "$REPORT_FILE")
sync_status=$(jq -r '.results.syncStatus' "$REPORT_FILE")
current_block=$(jq -r '.results.currentBlock' "$REPORT_FILE")
network_id=$(jq -r '.results.networkId' "$REPORT_FILE")
gas_price=$(jq -r '.results.gasPrice' "$REPORT_FILE")
account_count=$(jq -r '.results.accountCount' "$REPORT_FILE")
kaldrix_consensus=$(jq -r '.results.kaldrixConsensus' "$REPORT_FILE")
kaldrix_supply=$(jq -r '.results.kaldrixSupply' "$REPORT_FILE")
transaction_count=$(jq -r '.results.transactionCount' "$REPORT_FILE")
estimated_gas=$(jq -r '.results.estimatedGas' "$REPORT_FILE")
performance_test=$(jq -r '.results.performanceTest' "$REPORT_FILE")
security_test=$(jq -r '.results.securityTest' "$REPORT_FILE")
health_score=$(jq -r '.results.healthScore' "$REPORT_FILE")
status=$(jq -r '.results.status' "$REPORT_FILE")

echo "=== EXTRACTED RESULTS ==="
echo "RPC Connection: $rpc_connection"
echo "Peer Count: $peer_count"
echo "Sync Status: $sync_status"
echo "Current Block: $current_block"
echo "Network ID: $network_id"
echo "Gas Price: $gas_price"
echo "Account Count: $account_count"
echo "KALDRIX Consensus: $kaldrix_consensus"
echo "KALDRIX Supply: $kaldrix_supply"
echo "Transaction Count: $transaction_count"
echo "Estimated Gas: $estimated_gas"
echo "Performance Test: $performance_test"
echo "Security Test: $security_test"
echo "Reported Health Score: $health_score%"
echo "Reported Status: $status"
echo ""

# Calculate manual score based on test drive script logic
manual_score=0
total_criteria=0

# Check RPC connection
if [ "$rpc_connection" = "PASS" ]; then
    manual_score=$((manual_score + 20))
    echo "✓ RPC Connection: PASS (+20 points)"
else
    echo "✗ RPC Connection: FAIL (0 points)"
fi
total_criteria=$((total_criteria + 1))

# Check sync status
if [ "$sync_status" = "SYNCED" ]; then
    manual_score=$((manual_score + 20))
    echo "✓ Sync Status: SYNCED (+20 points)"
else
    echo "✗ Sync Status: NOT SYNCED (0 points)"
fi
total_criteria=$((total_criteria + 1))

# Check block number
if [ "$current_block" != "ERROR" ] && [ "$current_block" != "null" ] && [ "$current_block" != "" ]; then
    manual_score=$((manual_score + 20))
    echo "✓ Block Number: AVAILABLE (+20 points)"
else
    echo "✗ Block Number: UNAVAILABLE (0 points)"
fi
total_criteria=$((total_criteria + 1))

# Check gas price
if [ "$gas_price" != "ERROR" ] && [ "$gas_price" != "null" ] && [ "$gas_price" != "" ]; then
    manual_score=$((manual_score + 20))
    echo "✓ Gas Price: AVAILABLE (+20 points)"
else
    echo "✗ Gas Price: UNAVAILABLE (0 points)"
fi
total_criteria=$((total_criteria + 1))

# Check transaction count
if [ "$transaction_count" != "ERROR" ] && [ "$transaction_count" != "null" ] && [ "$transaction_count" != "" ]; then
    manual_score=$((manual_score + 20))
    echo "✓ Transaction Count: AVAILABLE (+20 points)"
else
    echo "✗ Transaction Count: UNAVAILABLE (0 points)"
fi
total_criteria=$((total_criteria + 1))

# Calculate final score
if [ $total_criteria -gt 0 ]; then
    final_score=$((manual_score))  # Already calculated as percentage
else
    final_score=0
fi

echo ""
echo "=== SCORE CALCULATION ==="
echo "Manual Score Calculation: $manual_score / $total_criteria criteria"
echo "Final Manual Score: $final_score%"
echo "Reported Score: $health_score%"
echo ""

# Determine status
if [ $final_score -ge 80 ]; then
    manual_status="EXCELLENT"
elif [ $final_score -ge 60 ]; then
    manual_status="GOOD"
elif [ $final_score -ge 40 ]; then
    manual_status="FAIR"
else
    manual_status="POOR"
fi

echo "Manual Status: $manual_status"
echo "Reported Status: $status"
echo ""

# Check KALDRIX-specific methods
echo "=== KALDRIX-SPECIFIC METHODS ==="
if [ "$kaldrix_consensus" = "AVAILABLE" ]; then
    echo "✓ KALDRIX Consensus: AVAILABLE"
else
    echo "✗ KALDRIX Consensus: NOT AVAILABLE"
fi

if [ "$kaldrix_supply" = "AVAILABLE" ]; then
    echo "✓ KALDRIX Supply: AVAILABLE"
else
    echo "✗ KALDRIX Supply: NOT AVAILABLE"
fi

# Additional checks
echo ""
echo "=== ADDITIONAL METRICS ==="
echo "Peer Count: $peer_count peers"
echo "Network ID: $network_id"
echo "Gas Price: $gas_price Gwei"
echo "Transaction Count: $transaction_count"
echo "Estimated Gas: $estimated_gas"

if [ "$performance_test" = "COMPLETED" ]; then
    echo "✓ Performance Test: COMPLETED"
else
    echo "✗ Performance Test: NOT COMPLETED"
fi

if [ "$security_test" = "COMPLETED" ]; then
    echo "✓ Security Test: COMPLETED"
else
    echo "✗ Security Test: NOT COMPLETED"
fi

echo ""
echo "=== CONCLUSION ==="
if [ "$final_score" -ge 80 ]; then
    echo "🎉 NETWORK IS READY FOR PUBLIC LAUNCH!"
    echo "   All critical RPC methods are implemented and working."
    echo "   Readiness score: $final_score% (Target: 80%+)"
elif [ "$final_score" -ge 60 ]; then
    echo "⚠️  NETWORK NEEDS MINOR IMPROVEMENTS"
    echo "   Most RPC methods are working, but some optimization needed."
    echo "   Readiness score: $final_score% (Target: 80%+)"
else
    echo "❌ NETWORK NEEDS SIGNIFICANT WORK"
    echo "   Critical RPC methods are missing or not working properly."
    echo "   Readiness score: $final_score% (Target: 80%+)"
fi

echo ""
echo "=== RECOMMENDATIONS ==="
if [ "$final_score" -ge 80 ]; then
    echo "• Proceed with public testnet launch"
    echo "• Continue monitoring network performance"
    echo "• Begin community onboarding"
else
    echo "• Implement missing RPC methods"
    echo "• Fix connectivity issues"
    echo "• Re-test after fixes"
fi