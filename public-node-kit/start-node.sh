#!/bin/bash

# KALDRIX Testnet Node Launcher
# This script launches a complete KALDRIX testnet node with monitoring

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NODE_NAME=${NODE_NAME:-"kaldrix-node-$(date +%s)"}
NETWORK_ID=${NETWORK_ID:-1337}
STAKING_AMOUNT=${STAKING_AMOUNT:-1000}
API_KEY=${API_KEY:-"test-api-key"}
GRAFANA_PASSWORD=${GRAFANA_PASSWORD:-"admin"}

echo -e "${BLUE}🚀 KALDRIX Testnet Node Launcher${NC}"
echo "=================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Create necessary directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
mkdir -p data monitoring/{prometheus,grafana/{dashboards,datasources}} nginx/{ssl,conf}

# Create monitoring configuration
echo -e "${YELLOW}⚙️  Setting up monitoring...${NC}"
cat > monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'kaldrix-node'
    static_configs:
      - targets: ['kaldrix-node:9090']
    metrics_path: '/metrics'
    scrape_interval: 5s
EOF

# Create Grafana datasource configuration
cat > monitoring/grafana/datasources/prometheus.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    orgId: 1
    url: http://metrics-collector:9090
    basicAuth: false
    isDefault: true
    version: 1
    editable: false
EOF

# Create Nginx configuration
cat > nginx/nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    upstream kaldrix_backend {
        server kaldrix-node:8545;
    }

    server {
        listen 80;
        server_name localhost;

        location / {
            proxy_pass http://kaldrix_backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        location /metrics {
            proxy_pass http://metrics-collector:9090;
        }

        location /grafana {
            proxy_pass http://grafana:3000;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        }
    }
}
EOF

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env file...${NC}"
    cat > .env << EOF
NODE_NAME=${NODE_NAME}
NETWORK_ID=${NETWORK_ID}
STAKING_AMOUNT=${STAKING_AMOUNT}
API_KEY=${API_KEY}
GRAFANA_PASSWORD=${GRAFANA_PASSWORD}
EOF
fi

# Start services
echo -e "${YELLOW}🔄 Starting KALDRIX services...${NC}"
docker-compose down 2>/dev/null || true
docker-compose up -d

# Wait for services to start
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 30

# Check if services are running
echo -e "${YELLOW}🔍 Checking service status...${NC}"
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Services started successfully!${NC}"
else
    echo -e "${RED}❌ Some services failed to start. Check logs with: docker-compose logs${NC}"
    exit 1
fi

# Display access information
echo -e "${GREEN}🎉 KALDRIX Testnet Node is running!${NC}"
echo "=================================="
echo -e "${BLUE}📊 Node Information:${NC}"
echo "  Node Name: ${NODE_NAME}"
echo "  Network ID: ${NETWORK_ID}"
echo "  Staking Amount: ${STAKING_AMOUNT} KALD"
echo ""
echo -e "${BLUE}🌐 Access URLs:${NC}"
echo "  JSON-RPC API: http://localhost:8545"
echo "  WebSocket: ws://localhost:8546"
echo "  Grafana Dashboard: http://localhost:3000 (admin/${GRAFANA_PASSWORD})"
echo "  Prometheus Metrics: http://localhost:9090"
echo ""
echo -e "${BLUE}📋 Useful Commands:${NC}"
echo "  View logs: docker-compose logs -f"
echo "  Stop services: docker-compose down"
echo "  Restart services: docker-compose restart"
echo ""
echo -e "${YELLOW}💡 Next Steps:${NC}"
echo "  1. Check your node status at http://localhost:3000"
echo "  2. Make your first transaction using the API"
echo "  3. Monitor performance metrics in Grafana"
echo "  4. Join the community and share your node!"
echo ""
echo -e "${GREEN}🚀 Happy testing with KALDRIX!${NC}"