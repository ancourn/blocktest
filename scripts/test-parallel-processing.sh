#!/bin/bash

# KALDRIX Parallel Processing Performance Test
# This script tests the parallel processing implementation and measures TPS improvements

set -e

echo "🚀 KALDRIX Parallel Processing Performance Test"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
BASE_URL="http://localhost:3000"
API_ENDPOINT="/api/parallel-processing"
TEST_TRANSACTIONS=1000
CONCURRENT_REQUESTS=50
TEST_DURATION=30000 # 30 seconds

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if service is running
print_status "Checking if parallel processing service is running..."
if ! curl -s "$BASE_URL/api/parallel-processing" > /dev/null; then
    print_error "Parallel processing service is not running"
    print_error "Please start the development server first: npm run dev"
    exit 1
fi

print_success "Parallel processing service is running"

# Get baseline metrics
print_status "Getting baseline metrics..."
BASELINE_METRICS=$(curl -s "$BASE_URL$API_ENDPOINT?action=metrics")
echo "Baseline Metrics:"
echo "$BASELINE_METRICS" | jq '.' 2>/dev/null || echo "$BASELINE_METRICS"

# Get performance summary
print_status "Getting performance summary..."
SUMMARY=$(curl -s "$BASE_URL$API_ENDPOINT?action=summary")
echo "Performance Summary:"
echo "$SUMMARY" | jq '.' 2>/dev/null || echo "$SUMMARY"

# Run performance test
print_status "Running performance test..."
print_status "Configuration:"
echo "  - Transactions: $TEST_TRANSACTIONS"
echo "  - Concurrent Requests: $CONCURRENT_REQUESTS"
echo "  - Duration: $((TEST_DURATION / 1000)) seconds"

TEST_PAYLOAD=$(cat << EOF
{
  "action": "performance_test",
  "data": {
    "transactionCount": $TEST_TRANSACTIONS,
    "concurrentRequests": $CONCURRENT_REQUESTS,
    "duration": $TEST_DURATION
  }
}
EOF
)

print_status "Executing performance test..."
TEST_START_TIME=$(date +%s)
TEST_RESULT=$(curl -s -X POST "$BASE_URL$API_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d "$TEST_PAYLOAD")
TEST_END_TIME=$(date +%s)

print_success "Performance test completed in $((TEST_END_TIME - TEST_START_TIME)) seconds"

# Parse and display results
print_status "Performance Test Results:"
echo "$TEST_RESULT" | jq '.' 2>/dev/null || echo "$TEST_RESULT"

# Extract key metrics
if command -v jq > /dev/null; then
    TOTAL_TRANSACTIONS=$(echo "$TEST_RESULT" | jq -r '.totalTransactions // 0')
    SUCCESSFUL_TRANSACTIONS=$(echo "$TEST_RESULT" | jq -r '.successfulTransactions // 0')
    FAILED_TRANSACTIONS=$(echo "$TEST_RESULT" | jq -r '.failedTransactions // 0')
    AVERAGE_TPS=$(echo "$TEST_RESULT" | jq -r '.averageTps // 0')
    PEAK_TPS=$(echo "$TEST_RESULT" | jq -r '.peakTps // 0')
    AVERAGE_LATENCY=$(echo "$TEST_RESULT" | jq -r '.averageLatency // 0')
    MIN_LATENCY=$(echo "$TEST_RESULT" | jq -r '.minLatency // 0')
    MAX_LATENCY=$(echo "$TEST_RESULT" | jq -r '.maxLatency // 0')
    
    # Display formatted results
    echo ""
    echo "📊 Test Results Summary:"
    echo "================================"
    echo "Total Transactions:    $TOTAL_TRANSACTIONS"
    echo "Successful:             $SUCCESSFUL_TRANSACTIONS"
    echo "Failed:                  $FAILED_TRANSACTIONS"
    echo "Success Rate:            $((SUCCESSFUL_TRANSACTIONS * 100 / TOTAL_TRANSACTIONS))%"
    echo ""
    echo "Performance Metrics:"
    echo "Average TPS:             $AVERAGE_TPS"
    echo "Peak TPS:                $PEAK_TPS"
    echo "Average Latency:         ${AVERAGE_LATENCY}ms"
    echo "Min Latency:             ${MIN_LATENCY}ms"
    echo "Max Latency:             ${MAX_LATENCY}ms"
    echo ""
    
    # Evaluate against targets
    INTERIM_TARGET=2000
    CURRENT_TPS=$(echo "$AVERAGE_TPS" | cut -d. -f1)
    
    echo "🎯 Target Evaluation:"
    echo "================================"
    echo "Interim Target (2,000 TPS): $INTERIM_TARGET"
    echo "Current TPS:              $CURRENT_TPS"
    
    if [ "$CURRENT_TPS" -ge "$INTERIM_TARGET" ]; then
        print_success "✅ TARGET ACHIEVED: Current TPS ($CURRENT_TPS) meets interim target ($INTERIM_TARGET)"
    else
        PROGRESS=$((CURRENT_TPS * 100 / INTERIM_TARGET))
        print_warning "🔄 TARGET IN PROGRESS: Current TPS ($CURRENT_TPS) is $PROGRESS% of interim target ($INTERIM_TARGET)"
        
        if [ "$CURRENT_TPS" -ge 1000 ]; then
            print_success "✅ GOOD PROGRESS: Achieved 50% of interim target"
        elif [ "$CURRENT_TPS" -ge 500 ]; then
            print_warning "🔄 MODERATE PROGRESS: Achieved 25% of interim target"
        else
            print_error "❌ NEEDS IMPROVEMENT: Below 25% of interim target"
        fi
    fi
    
    # Latency evaluation
    LATENCY_TARGET=100
    if (( $(echo "$AVERAGE_LATENCY < $LATENCY_TARGET" | bc -l) )); then
        print_success "✅ LATENCY TARGET MET: Average latency (${AVERAGE_LATENCY}ms) below target (${LATENCY_TARGET}ms)"
    else
        print_warning "🔄 LATENCY NEEDS IMPROVEMENT: Average latency (${AVERAGE_LATENCY}ms) above target (${LATENCY_TARGET}ms)"
    fi
    
    # Success rate evaluation
    SUCCESS_RATE_TARGET=99
    CURRENT_SUCCESS_RATE=$((SUCCESSFUL_TRANSACTIONS * 100 / TOTAL_TRANSACTIONS))
    if [ "$CURRENT_SUCCESS_RATE" -ge "$SUCCESS_RATE_TARGET" ]; then
        print_success "✅ SUCCESS RATE TARGET MET: ${CURRENT_SUCCESS_RATE}% success rate"
    else
        print_warning "🔄 SUCCESS RATE NEEDS IMPROVEMENT: ${CURRENT_SUCCESS_RATE}% success rate"
    fi
    
else
    print_warning "jq not available. Install jq for better result parsing."
fi

# Get final metrics
print_status "Getting final metrics..."
FINAL_METRICS=$(curl -s "$BASE_URL$API_ENDPOINT?action=metrics")
echo "Final Metrics:"
echo "$FINAL_METRICS" | jq '.' 2>/dev/null || echo "$FINAL_METRICS"

# Get component stats
print_status "Getting component statistics..."
COMPONENT_STATS=$(curl -s "$BASE_URL$API_ENDPOINT?action=components")
echo "Component Statistics:"
echo "$COMPONENT_STATS" | jq '.' 2>/dev/null || echo "$COMPONENT_STATS"

# Generate test report
print_status "Generating test report..."
REPORT_FILE="performance-test-$(date +%Y%m%d-%H%M%S).json"

cat > "$REPORT_FILE" << EOF
{
  "test_timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "test_configuration": {
    "base_url": "$BASE_URL",
    "api_endpoint": "$API_ENDPOINT",
    "transactions": $TEST_TRANSACTIONS,
    "concurrent_requests": $CONCURRENT_REQUESTS,
    "duration_ms": $TEST_DURATION
  },
  "baseline_metrics": $BASELINE_METRICS,
  "test_result": $TEST_RESULT,
  "final_metrics": $FINAL_METRICS,
  "component_stats": $COMPONENT_STATS,
  "test_summary": {
    "target_tps": 2000,
    "target_latency_ms": 100,
    "target_success_rate": 99,
    "test_duration_s": $((TEST_END_TIME - TEST_START_TIME))
  }
}
EOF

print_success "Test report saved to: $REPORT_FILE"

# Performance recommendations
echo ""
echo "💡 Performance Recommendations:"
echo "================================"

if command -v jq > /dev/null; then
    CURRENT_TPS=$(echo "$AVERAGE_TPS" | cut -d. -f1)
    
    if [ "$CURRENT_TPS" -lt 500 ]; then
        echo "1. 🚨 CRITICAL: TPS is significantly below target"
        echo "   - Check worker thread configuration"
        echo "   - Verify parallel processing is enabled"
        echo "   - Review batch processing settings"
    elif [ "$CURRENT_TPS" -lt 1000 ]; then
        echo "2. ⚠️  HIGH PRIORITY: TPS needs improvement"
        echo "   - Optimize worker thread pool size"
        echo "   - Increase batch size for better throughput"
        echo "   - Review load balancing strategy"
    elif [ "$CURRENT_TPS" -lt 2000 ]; then
        echo "3. 📊 MEDIUM PRIORITY: Good progress toward target"
        echo "   - Fine-tune worker allocation"
        echo "   - Optimize quantum processing overhead"
        echo "   - Consider additional worker nodes"
    else
        echo "4. ✅ EXCELLENT: Target achieved or exceeded"
        echo "   - Monitor for sustained performance"
        echo "   - Prepare for production deployment"
        echo "   - Document optimization settings"
    fi
    
    # Check latency
    if (( $(echo "$AVERAGE_LATENCY > 100" | bc -l) )); then
        echo "5. ⏱️  LATENCY OPTIMIZATION: High latency detected"
        echo "   - Review network configuration"
        echo "   - Optimize quantum algorithm processing"
        echo "   - Consider hardware acceleration"
    fi
    
    # Check success rate
    CURRENT_SUCCESS_RATE=$((SUCCESSFUL_TRANSACTIONS * 100 / TOTAL_TRANSACTIONS))
    if [ "$CURRENT_SUCCESS_RATE" -lt 95 ]; then
        echo "6. 🛡️  RELIABILITY: Low success rate detected"
        echo "   - Review error handling mechanisms"
        echo "   - Implement retry logic for failed transactions"
        echo "   - Check resource constraints"
    fi
fi

echo ""
print_success "Parallel processing performance test completed!"
print_status "Next steps:"
echo "  1. Review test results and recommendations"
echo "  2. Implement suggested optimizations"
echo "  3. Re-run test to validate improvements"
echo "  4. Update optimization plan with findings"

exit 0