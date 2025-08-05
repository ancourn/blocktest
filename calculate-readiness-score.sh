#!/bin/bash

echo "=== KALDRIX READINESS SCORE CALCULATION ==="
echo "Based on validation report: $(cat /home/z/my-project/latest-validation-report.json | jq -r '.generatedAt')"
echo ""

# Calculate readiness score based on comprehensive metrics
score=0
max_score=100

# Network Status (30 points)
network_healthy=$(cat /home/z/my-project/latest-validation-report.json | jq -r '.networkStatus.healthy')
uptime=$(cat /home/z/my-project/latest-validation-report.json | jq -r '.networkStatus.uptime')
peer_count=$(cat /home/z/my-project/latest-validation-report.json | jq -r '.networkStatus.peerCount')
sync_status=$(cat /home/z/my-project/latest-validation-report.json | jq -r '.networkStatus.syncStatus')

if [ "$network_healthy" = "true" ]; then
    score=$((score + 10))
    echo "✓ Network Health: +10 points"
fi

uptime_percent=${uptime%\%}
if [ "${uptime_percent%.*}" -ge 99 ]; then
    score=$((score + 10))
    echo "✓ High Uptime ($uptime): +10 points"
fi

if [ "$peer_count" -ge 10 ]; then
    score=$((score + 5))
    echo "✓ Good Peer Count ($peer_count): +5 points"
elif [ "$peer_count" -ge 5 ]; then
    score=$((score + 3))
    echo "✓ Adequate Peer Count ($peer_count): +3 points"
fi

if [ "$sync_status" = "SYNCED" ]; then
    score=$((score + 5))
    echo "✓ Sync Status ($sync_status): +5 points"
fi

# Performance Metrics (30 points)
current_tps=$(cat /home/z/my-project/latest-validation-report.json | jq -r '.performanceMetrics.currentTPS')
peak_tps=$(cat /home/z/my-project/latest-validation-report.json | jq -r '.performanceMetrics.peakTPS')
avg_latency=$(cat /home/z/my-project/latest-validation-report.json | jq -r '.performanceMetrics.averageLatency')
success_rate=$(cat /home/z/my-project/latest-validation-report.json | jq -r '.performanceMetrics.successRate')

if [ "${current_tps%.*}" -ge 1000 ]; then
    score=$((score + 10))
    echo "✓ High Current TPS ($current_tps): +10 points"
elif [ "${current_tps%.*}" -ge 500 ]; then
    score=$((score + 7))
    echo "✓ Good Current TPS ($current_tps): +7 points"
elif [ "${current_tps%.*}" -ge 100 ]; then
    score=$((score + 5)
    echo "✓ Adequate Current TPS ($current_tps): +5 points"
fi

if [ "${peak_tps%.*}" -ge 50000 ]; then
    score=$((score + 10))
    echo "✓ Excellent Peak TPS ($peak_tps): +10 points"
elif [ "${peak_tps%.*}" -ge 10000 ]; then
    score=$((score + 7)
    echo "✓ Good Peak TPS ($peak_tps): +7 points"
fi

if [ "${avg_latency%.*}" -le 50 ]; then
    score=$((score + 5))
    echo "✓ Low Latency (${avg_latency}ms): +5 points"
elif [ "${avg_latency%.*}" -le 100 ]; then
    score=$((score + 3))
    echo "✓ Acceptable Latency (${avg_latency}ms): +3 points"
fi

if [ "${success_rate%.*}" -ge 99 ]; then
    score=$((score + 5))
    echo "✓ High Success Rate (${success_rate}%): +5 points"
elif [ "${success_rate%.*}" -ge 95 ]; then
    score=$((score + 3)
    echo "✓ Good Success Rate (${success_rate}%): +3 points"
fi

# Economic Metrics (20 points)
total_supply=$(cat /home/z/my-project/latest-validation-report.json | jq -r '.economicMetrics.totalSupply')
circulating_supply=$(cat /home/z/my-project/latest-validation-report.json | jq -r '.economicMetrics.circulatingSupply')
staking_participants=$(cat /home/z/my-project/latest-validation-report.json | jq -r '.economicMetrics.stakingParticipants')

if [ -n "$total_supply" ] && [ "$total_supply" != "null" ]; then
    score=$((score + 5))
    echo "✓ Total Supply Available: +5 points"
fi

if [ -n "$circulating_supply" ] && [ "$circulating_supply" != "null" ]; then
    score=$((score + 5))
    echo "✓ Circulating Supply Available: +5 points"
fi

if [ "${staking_participants%.*}" -ge 100 ]; then
    score=$((score + 10))
    echo "✓ Strong Staking Participation ($staking_participants): +10 points"
elif [ "${staking_participants%.*}" -ge 50 ]; then
    score=$((score + 7)
    echo "✓ Good Staking Participation ($staking_participants): +7 points"
elif [ "${staking_participants%.*}" -ge 10 ]; then
    score=$((score + 5)
    echo "✓ Basic Staking Participation ($staking_participants): +5 points"
fi

# Security Metrics (20 points)
vulnerability_score=$(cat /home/z/my-project/latest-validation-report.json | jq -r '.securityMetrics.vulnerabilityScore')
audit_status=$(cat /home/z/my-project/latest-validation-report.json | jq -r '.securityMetrics.auditStatus')
attacks_detected=$(cat /home/z/my-project/latest-validation-report.json | jq -r '.securityMetrics.attacksDetected')

if [ "${vulnerability_score%.*}" -ge 90 ]; then
    score=$((score + 10))
    echo "✓ Excellent Vulnerability Score ($vulnerability_score): +10 points"
elif [ "${vulnerability_score%.*}" -ge 70 ]; then
    score=$((score + 7)
    echo "✓ Good Vulnerability Score ($vulnerability_score): +7 points"
elif [ "${vulnerability_score%.*}" -ge 50 ]; then
    score=$((score + 5)
    echo "✓ Acceptable Vulnerability Score ($vulnerability_score): +5 points"
fi

if [ "$audit_status" = "PASSED" ]; then
    score=$((score + 5))
    echo "✓ Audit Status ($audit_status): +5 points"
fi

if [ "$attacks_detected" = "0" ]; then
    score=$((score + 5))
    echo "✓ No Attacks Detected: +5 points"
fi

echo ""
echo "=== READINESS SCORE SUMMARY ==="
echo "Final Score: $score/$max_score"
echo "Percentage: $((score * 100 / max_score))%"

if [ $score -ge 90 ]; then
    echo "Status: 🚀 EXCELLENT - Ready for production!"
elif [ $score -ge 80 ]; then
    echo "Status: ✅ VERY GOOD - Ready for public testnet!"
elif [ $score -ge 70 ]; then
    echo "Status: ⚠️  GOOD - Minor improvements needed"
elif [ $score -ge 60 ]; then
    echo "Status: ⚠️  FAIR - Significant improvements needed"
else
    echo "Status: ❌ POOR - Not ready for deployment"
fi

echo ""
echo "=== KEY METRICS ==="
echo "Network Health: $network_healthy"
echo "Uptime: $uptime"
echo "Current TPS: $current_tps"
echo "Peak TPS: $peak_tps"
echo "Average Latency: ${avg_latency}ms"
echo "Success Rate: ${success_rate}%"
echo "Vulnerability Score: $vulnerability_score"
echo "Audit Status: $audit_status"