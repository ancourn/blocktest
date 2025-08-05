#!/bin/bash

# KALDRIX Testnet Stress Test Script
# This script runs stress tests on the mini-testnet

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔥 KALDRIX Mini-Testnet Stress Test${NC}"
echo -e "${BLUE}==================================${NC}"

# Configuration
DURATION=5  # minutes
INTENSITY="MEDIUM"
TARGET_TPS=1000
API_PORT=8080

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --duration)
            DURATION="$2"
            shift 2
            ;;
        --intensity)
            INTENSITY="$2"
            shift 2
            ;;
        --target-tps)
            TARGET_TPS="$2"
            shift 2
            ;;
        --api-port)
            API_PORT="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --duration MINUTES     Test duration in minutes (default: 5)"
            echo "  --intensity LEVEL      Test intensity (LOW, MEDIUM, HIGH, EXTREME) (default: MEDIUM)"
            echo "  --target-tps TPS       Target TPS (default: 1000)"
            echo "  --api-port PORT        API port (default: 8080)"
            echo "  --help                 Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${YELLOW}⚙️  Stress Test Configuration:${NC}"
echo -e "${YELLOW}   Duration: $DURATION minutes${NC}"
echo -e "${YELLOW}   Intensity: $INTENSITY${NC}"
echo -e "${YELLOW}   Target TPS: $TARGET_TPS${NC}"
echo -e "${YELLOW}   API Port: $API_PORT${NC}"

# Check if testnet is running
echo -e "${YELLOW}🔍 Checking if testnet is running...${NC}"
if ! curl -s "http://localhost:$API_PORT/api/metrics?endpoint=health" > /dev/null; then
    echo -e "${RED}❌ Testnet is not running. Please deploy first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Testnet is running${NC}"

# Get baseline metrics
echo -e "${YELLOW}📊 Getting baseline metrics...${NC}"
BASELINE_METRICS=$(curl -s "http://localhost:$API_PORT/api/metrics" 2>/dev/null || echo "{}")
BASELINE_TPS=$(echo $BASELINE_METRICS | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tps', {}).get('currentTPS', 0))
except:
    print(0)
" 2>/dev/null || echo "0")

echo -e "${GREEN}📈 Baseline TPS: $BASELINE_TPS${NC}"

# Start stress test
echo -e "${YELLOW}🚀 Starting stress test...${NC}"
START_TIME=$(date +%s)

# Send stress test request
RESPONSE=$(curl -s -X POST "http://localhost:$API_PORT/api/metrics" \
    -H "Content-Type: application/json" \
    -d "{
        \"action\": \"start_stress\",
        \"duration\": $DURATION,
        \"intensity\": \"$INTENSITY\",
        \"targetTPS\": $TARGET_TPS
    }" 2>/dev/null || echo '{"error": "Failed to start stress test"}')

if echo "$RESPONSE" | grep -q "error"; then
    echo -e "${RED}❌ Failed to start stress test${NC}"
    echo -e "${RED}   Response: $RESPONSE${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Stress test started successfully${NC}"

# Monitor progress
echo -e "${YELLOW}📊 Monitoring test progress...${NC}"
END_TIME=$((START_TIME + DURATION * 60))

while [ $(date +%s) -lt $END_TIME ]; do
    # Get current metrics
    CURRENT_METRICS=$(curl -s "http://localhost:$API_PORT/api/metrics" 2>/dev/null || echo "{}")
    
    # Extract current TPS
    CURRENT_TPS=$(echo $CURRENT_METRICS | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tps', {}).get('currentTPS', 0))
except:
    print(0)
" 2>/dev/null || echo "0")
    
    # Extract availability
    AVAILABILITY=$(echo $CURRENT_METRICS | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('availability', {}).get('metrics', {}).get('uptime', 0))
except:
    print(0)
" 2>/dev/null || echo "0")
    
    # Calculate elapsed time
    ELAPSED=$(( $(date +%s) - START_TIME ))
    REMAINING=$((END_TIME - $(date +%s) ))
    
    # Display progress
    echo -ne "\r${GREEN}⏱️  Elapsed: ${ELAPSED}s | Remaining: ${REMAINING}s | TPS: ${CURRENT_TPS} | Availability: ${AVAILABILITY}%${NC}"
    
    sleep 5
done

echo -e "\n${YELLOW}📊 Stress test completed!${NC}"

# Get final metrics
echo -e "${YELLOW}📈 Getting final metrics...${NC}"
FINAL_METRICS=$(curl -s "http://localhost:$API_PORT/api/metrics" 2>/dev/null || echo "{}")

# Extract final metrics
FINAL_TPS=$(echo $FINAL_METRICS | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tps', {}).get('currentTPS', 0))
except:
    print(0)
" 2>/dev/null || echo "0")

FINAL_AVAILABILITY=$(echo $FINAL_METRICS | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('availability', {}).get('metrics', {}).get('uptime', 0))
except:
    print(0)
" 2>/dev/null || echo "0")

# Calculate performance metrics
TPS_IMPROVEMENT=$((FINAL_TPS - BASELINE_TPS))
TPS_EFFICIENCY=$((FINAL_TPS * 100 / TARGET_TPS))

# Display results
echo -e "${BLUE}📊 Stress Test Results${NC}"
echo -e "${BLUE}======================${NC}"
echo -e "${GREEN}📈 Baseline TPS: $BASELINE_TPS${NC}"
echo -e "${GREEN}📈 Final TPS: $FINAL_TPS${NC}"
echo -e "${GREEN}📈 TPS Improvement: $TPS_IMPROVEMENT${NC}"
echo -e "${GREEN}📈 TPS Efficiency: $TPS_EFFICIENCY%${NC}"
echo -e "${GREEN}📈 Final Availability: $FINAL_AVAILABILITY%${NC}"

# Generate report
echo -e "${YELLOW}📝 Generating test report...${NC}"
REPORT_FILE="stress-test-report-$(date +%Y%m%d-%H%M%S).json"

cat > "$REPORT_FILE" << EOF
{
  "testConfig": {
    "duration": $DURATION,
    "intensity": "$INTENSITY",
    "targetTPS": $TARGET_TPS,
    "startTime": $(date -d @$START_TIME +%s),
    "endTime": $(date +%s)
  },
  "results": {
    "baselineTPS": $BASELINE_TPS,
    "finalTPS": $FINAL_TPS,
    "tpsImprovement": $TPS_IMPROVEMENT,
    "tpsEfficiency": $TPS_EFFICIENCY,
    "finalAvailability": $FINAL_AVAILABILITY
  },
  "metrics": {
    "baseline": $BASELINE_METRICS,
    "final": $FINAL_METRICS
  },
  "summary": {
    "testPassed": $([ "$FINAL_AVAILABILITY" -ge "99.9" ] && echo "true" || echo "false"),
    "tpsTargetMet": $([ "$TPS_EFFICIENCY" -ge "80" ] && echo "true" || echo "false"),
    "recommendations": []
  }
}
EOF

echo -e "${GREEN}📄 Test report saved to: $REPORT_FILE${NC}"

# Display recommendations
echo -e "${BLUE}💡 Recommendations${NC}"
echo -e "${BLUE}================${NC}"

if [ "$FINAL_AVAILABILITY" -lt "99.9" ]; then
    echo -e "${YELLOW}⚠️  Availability below 99.9%. Consider improving failover mechanisms.${NC}"
fi

if [ "$TPS_EFFICIENCY" -lt "80" ]; then
    echo -e "${YELLOW}⚠️  TPS efficiency below 80%. Consider optimizing transaction processing.${NC}"
fi

if [ "$TPS_IMPROVEMENT" -lt "0" ]; then
    echo -e "${RED}❌ TPS decreased during stress test. Investigate performance bottlenecks.${NC}"
else
    echo -e "${GREEN}✅ TPS improved during stress test.${NC}"
fi

echo -e "${BLUE}🎉 Stress test completed successfully!${NC}"