#!/bin/bash

# KALDRIX Health Check Script
# This script checks the health of all nodes in the testnet

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏥 KALDRIX Mini-Testnet Health Check${NC}"
echo -e "${BLUE}====================================${NC}"

# Configuration
BASE_PORT=3000
NODE_COUNT=3

# Check if testnet config exists
if [ ! -f "testnet-config.json" ]; then
    echo -e "${RED}❌ Testnet configuration not found. Please deploy first.${NC}"
    exit 1
fi

# Load testnet configuration
echo -e "${YELLOW}📋 Loading testnet configuration...${NC}"
NODES=$(python3 -c "
import json
with open('testnet-config.json', 'r') as f:
    config = json.load(f)
for node in config['nodes']:
    print(f'{node[\"id\"]}:{node[\"port\"]}:{node[\"apiPort\"]}')
")

HEALTHY_NODES=0
TOTAL_NODES=0

# Check each node
echo -e "${YELLOW}🔍 Checking node health...${NC}"
for NODE_INFO in $NODES; do
    TOTAL_NODES=$((TOTAL_NODES + 1))
    NODE_ID=$(echo $NODE_INFO | cut -d: -f1)
    NODE_PORT=$(echo $NODE_INFO | cut -d: -f2)
    API_PORT=$(echo $NODE_INFO | cut -d: -f3)
    
    echo -e "${BLUE}📡 Checking $NODE_ID (port $NODE_PORT)...${NC}"
    
    # Check HTTP health endpoint
    if curl -s "http://localhost:$NODE_PORT/health" > /dev/null; then
        echo -e "${GREEN}✅ HTTP health check passed${NC}"
        
        # Get detailed health info
        HEALTH_INFO=$(curl -s "http://localhost:$NODE_PORT/health" 2>/dev/null || echo "{}")
        
        # Check API endpoint
        if curl -s "http://localhost:$API_PORT/api/metrics?endpoint=health" > /dev/null; then
            echo -e "${GREEN}✅ API health check passed${NC}"
            HEALTHY_NODES=$((HEALTHY_NODES + 1))
        else
            echo -e "${RED}❌ API health check failed${NC}"
        fi
    else
        echo -e "${RED}❌ HTTP health check failed${NC}"
    fi
    
    # Check WebSocket connection
    echo -e "${BLUE}🔌 Checking WebSocket connection...${NC}"
    if timeout 5 bash -c "</dev/tcp/localhost/$((NODE_PORT + 1000))" 2>/dev/null; then
        echo -e "${GREEN}✅ WebSocket connection available${NC}"
    else
        echo -e "${YELLOW}⚠️  WebSocket connection not available${NC}"
    fi
    
    echo -e "${BLUE}---${NC}"
done

# Check dashboard
echo -e "${YELLOW}📊 Checking dashboard...${NC}"
if curl -s "http://localhost:3000/" > /dev/null; then
    echo -e "${GREEN}✅ Dashboard is accessible${NC}"
else
    echo -e "${RED}❌ Dashboard is not accessible${NC}"
fi

# Display summary
echo -e "${BLUE}📊 Health Check Summary${NC}"
echo -e "${BLUE}========================${NC}"
echo -e "${GREEN}✅ Healthy nodes: $HEALTHY_NODES/$TOTAL_NODES${NC}"
echo -e "${GREEN}✅ Overall health: $((HEALTHY_NODES * 100 / TOTAL_NODES))%${NC}"

if [ $HEALTHY_NODES -eq $TOTAL_NODES ]; then
    echo -e "${GREEN}🎉 All nodes are healthy!${NC}"
    exit 0
elif [ $HEALTHY_NODES -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Some nodes are degraded${NC}"
    exit 1
else
    echo -e "${RED}❌ No healthy nodes found${NC}"
    exit 2
fi