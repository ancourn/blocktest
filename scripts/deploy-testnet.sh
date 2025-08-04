#!/bin/bash

# KALDRIX Mini-Testnet Deployment Script
# This script sets up and starts a complete KALDRIX mini-testnet environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NETWORK_NAME="kaldrix-mini-testnet"
NODE_COUNT=3
BASE_PORT=3000
BASE_API_PORT=8080
BASE_WS_PORT=8081

echo -e "${BLUE}🚀 KALDRIX Mini-Testnet Deployment Script${NC}"
echo -e "${BLUE}===========================================${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js and npm are installed${NC}"

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

# Create necessary directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
mkdir -p data logs config certs

# Build the project
echo -e "${YELLOW}🔨 Building the project...${NC}"
npm run build

# Generate testnet configuration
echo -e "${YELLOW}⚙️  Generating testnet configuration...${NC}"
cat > testnet-config.json << EOF
{
  "network": {
    "name": "$NETWORK_NAME",
    "networkId": "kaldrix-test-1",
    "chainId": 1337,
    "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "nodes": []
  },
  "nodes": []
}
EOF

# Start nodes
echo -e "${YELLOW}🌐 Starting $NODE_COUNT nodes...${NC}"
NODE_PIDS=()

for i in $(seq 0 $((NODE_COUNT-1))); do
    NODE_PORT=$((BASE_PORT + i))
    API_PORT=$((BASE_API_PORT + i))
    WS_PORT=$((BASE_WS_PORT + i))
    NODE_ID="kaldrix-node-$((i+1))"
    
    # Determine node role
    case $i in
        0) ROLE="validator" ;;
        1) ROLE="miner" ;;
        *) ROLE="observer" ;;
    esac
    
    echo -e "${GREEN}🚀 Starting $NODE_ID ($ROLE) on port $NODE_PORT${NC}"
    
    # Start node in background
    NODE_CONFIG="config/node-$((i+1)).json"
    
    # Create node-specific config if it doesn't exist
    if [ ! -f "$NODE_CONFIG" ]; then
        cat > "$NODE_CONFIG" << EOF
{
  "nodeId": "$NODE_ID",
  "role": "$ROLE",
  "network": "$NETWORK_NAME",
  "port": $NODE_PORT,
  "host": "localhost",
  "dataDir": "./data/node-$((i+1))",
  "logDir": "./logs/node-$((i+1))",
  "seedNodes": [
    "localhost:$BASE_PORT",
    "localhost:$((BASE_PORT+1))",
    "localhost:$((BASE_PORT+2))"
  ],
  "api": {
    "enabled": true,
    "port": $API_PORT,
    "websocket": {
      "enabled": true,
      "port": $WS_PORT
    }
  },
  "consensus": {
    "enabled": true,
    "validator": $([ "$ROLE" = "validator" ] && echo "true" || echo "false"),
    "stake": "$([ "$ROLE" = "validator" ] && echo "10000" || echo "0")"
  },
  "mining": {
    "enabled": $([ "$ROLE" = "miner" ] && echo "true" || echo "false")
  },
  "features": {
    "gpuAcceleration": $([ "$ROLE" != "observer" ] && echo "true" || echo "false"),
    "batching": true,
    "sharding": true,
    "quantumCryptography": true
  },
  "monitoring": {
    "enabled": true,
    "metrics": true,
    "healthChecks": true,
    "alerting": true
  },
  "reliability": {
    "failoverEnabled": true,
    "healthMonitoring": true,
    "autoRecovery": true
  }
}
EOF
    fi
    
    # Create data and log directories
    mkdir -p "data/node-$((i+1))" "logs/node-$((i+1))"
    
    # Start the node
    nohup node start-node.js start \
        --port $NODE_PORT \
        --node-id $NODE_ID \
        --role $ROLE \
        --network $NETWORK_NAME \
        --config $NODE_CONFIG \
        > "logs/node-$((i+1))/node.log" 2>&1 &
    
    NODE_PID=$!
    NODE_PIDS+=($NODE_PID)
    
    # Add node to testnet config
    echo "Adding $NODE_ID to testnet configuration"
    # Update testnet-config.json with node info (simplified for bash)
    
    echo -e "${GREEN}✅ $NODE_ID started with PID $NODE_PID${NC}"
    
    # Wait a bit between node starts
    sleep 2
done

# Update testnet configuration with node information
echo -e "${YELLOW}📝 Updating testnet configuration...${NC}"
python3 -c "
import json
import sys

config = {
    'network': {
        'name': '$NETWORK_NAME',
        'networkId': 'kaldrix-test-1',
        'chainId': 1337,
        'createdAt': '$(date -u +%Y-%m-%dT%H:%M:%SZ)',
        'nodes': []
    },
    'nodes': []
}

for i in range($NODE_COUNT):
    node_port = $BASE_PORT + i
    api_port = $BASE_API_PORT + i
    ws_port = $BASE_WS_PORT + i
    node_id = f'kaldrix-node-{i+1}'
    
    roles = ['validator', 'miner', 'observer']
    role = roles[i] if i < len(roles) else 'observer'
    
    node_info = {
        'id': node_id,
        'role': role,
        'host': 'localhost',
        'port': node_port,
        'apiPort': api_port,
        'wsPort': ws_port,
        'status': 'starting'
    }
    
    config['nodes'].append(node_info)

with open('testnet-config.json', 'w') as f:
    json.dump(config, f, indent=2)

print('Testnet configuration updated')
"

# Wait for nodes to start
echo -e "${YELLOW}⏳ Waiting for nodes to start...${NC}"
sleep 10

# Check node health
echo -e "${YELLOW}🏥 Checking node health...${NC}"
HEALTHY_NODES=0

for i in "${!NODE_PIDS[@]}"; do
    NODE_PORT=$((BASE_PORT + i))
    NODE_ID="kaldrix-node-$((i+1))"
    
    if curl -s "http://localhost:$NODE_PORT/health" > /dev/null; then
        echo -e "${GREEN}✅ $NODE_ID is healthy${NC}"
        HEALTHY_NODES=$((HEALTHY_NODES + 1))
    else
        echo -e "${RED}❌ $NODE_ID is not responding${NC}"
    fi
done

# Start dashboard
echo -e "${YELLOW}📊 Starting dashboard...${NC}"
nohup node start-node.js dashboard \
    --port 3000 \
    --api-port 8080 \
    > logs/dashboard.log 2>&1 &
DASHBOARD_PID=$!

echo -e "${GREEN}✅ Dashboard started with PID $DASHBOARD_PID${NC}"

# Display status
echo -e "${BLUE}🎉 KALDRIX Mini-Testnet Deployment Complete!${NC}"
echo -e "${BLUE}===========================================${NC}"
echo -e "${GREEN}📊 Dashboard: http://localhost:3000${NC}"
echo -e "${GREEN}📡 Nodes:${NC}"
for i in $(seq 0 $((NODE_COUNT-1))); do
    NODE_PORT=$((BASE_PORT + i))
    API_PORT=$((BASE_API_PORT + i))
    NODE_ID="kaldrix-node-$((i+1))"
    echo -e "${GREEN}   $NODE_ID: http://localhost:$NODE_PORT (API: $API_PORT)${NC}"
done
echo -e "${YELLOW}📋 Testnet configuration saved to testnet-config.json${NC}"
echo -e "${YELLOW}📝 Logs available in logs/ directory${NC}"
echo -e "${BLUE}💡 To stop the testnet, run: ./scripts/stop-testnet.sh${NC}"

# Save PIDs for cleanup
echo "${NODE_PIDS[@]}" > testnet-pids.txt
echo "$DASHBOARD_PID" >> testnet-pids.txt

echo -e "${GREEN}✅ Deployment complete! $HEALTHY_NODES/$NODE_COUNT nodes are healthy.${NC}"