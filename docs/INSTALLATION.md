# Installation Guide

## Prerequisites

Before installing the KALDRIX Mini-Testnet, ensure your system meets the following requirements:

### System Requirements
- **Operating System**: Linux, macOS, or Windows (WSL2 recommended for Windows)
- **RAM**: Minimum 4GB, recommended 8GB+
- **Storage**: Minimum 2GB free space
- **Network**: Internet connection for dependency installation

### Software Requirements
- **Node.js**: Version 16.0 or higher
- **npm**: Version 7.0 or higher (comes with Node.js)
- **Python**: Version 3.7 or higher (for configuration scripts)
- **Git**: For cloning the repository

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/ancourn/blocktest.git
cd blocktest
```

### 2. Verify Node.js Installation

Check if Node.js and npm are installed:

```bash
node --version
npm --version
```

You should see versions like:
```
v18.17.0
9.6.7
```

If Node.js is not installed, download it from [nodejs.org](https://nodejs.org/) or use a version manager:

**macOS (using Homebrew):**
```bash
brew install node
```

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows:**
Download and install from [nodejs.org](https://nodejs.org/)

### 3. Install Dependencies

Install the required npm packages:

```bash
npm install
```

This will install all dependencies listed in `package.json`, including:
- Core blockchain components
- WebSocket and HTTP servers
- Dashboard UI components
- Testing and development tools

### 4. Verify Python Installation (Optional)

Python is required for some configuration scripts:

```bash
python3 --version
```

If Python is not installed:

**macOS (using Homebrew):**
```bash
brew install python
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install python3 python3-pip
```

**Windows:**
Download from [python.org](https://python.org/)

### 5. Create Required Directories

The installation script will create necessary directories, but you can create them manually:

```bash
mkdir -p data logs config certs
```

## Configuration

### 1. Network Configuration

The default network configuration is in `config/network.json`. You can customize:

- Network name and ID
- Genesis block settings
- Consensus parameters
- Sharding configuration
- Quantum cryptography settings

### 2. Node Configuration

Individual node configurations are in `config/node-*.json`. The default setup includes:
- `node-1.json`: Validator node
- `node-2.json`: Miner node  
- `node-3.json`: Observer node

### 3. Environment Variables (Optional)

Create a `.env` file for environment-specific settings:

```bash
# Network Configuration
KALDRIX_NETWORK_NAME=kaldrix-mini-testnet
KALDRIX_NETWORK_ID=kaldrix-test-1
KALDRIX_CHAIN_ID=1337

# Node Configuration
KALDRIX_NODE_ID=kaldrix-node-1
KALDRIX_ROLE=validator
KALDRIX_PORT=3000

# Data Directories
KALDRIX_DATA_DIR=./data
KALDRIX_LOG_DIR=./logs

# API Configuration
KALDRIX_API_ENABLED=true
KALDRIX_API_PORT=8080
KALDRIX_WS_PORT=8081

# Logging
KALDRIX_LOG_LEVEL=info
```

## Running the Testnet

### Quick Start (Recommended)

Use the automated deployment script:

```bash
./scripts/deploy-testnet.sh
```

This will:
- Install dependencies
- Create necessary directories
- Generate configuration files
- Start 3 nodes (validator, miner, observer)
- Start the monitoring dashboard
- Run health checks

### Manual Start

If you prefer manual setup:

#### 1. Start Individual Nodes

Open separate terminal windows for each node:

**Terminal 1 - Validator Node:**
```bash
npm run start -- --port 3000 --node-id kaldrix-validator-1 --role validator
```

**Terminal 2 - Miner Node:**
```bash
npm run start -- --port 3001 --node-id kaldrix-miner-1 --role miner
```

**Terminal 3 - Observer Node:**
```bash
npm run start -- --port 3002 --node-id kaldrix-observer-1 --role observer
```

#### 2. Start the Dashboard

In another terminal:

```bash
npm run dashboard
```

#### 3. Verify Installation

Check if all components are running:

```bash
./scripts/health-check.sh
```

## Accessing the Dashboard

Once the testnet is running, access the dashboard at:

**Main Dashboard**: http://localhost:3000

**API Endpoints**:
- Node 1 API: http://localhost:8080/api
- Node 2 API: http://localhost:8081/api  
- Node 3 API: http://localhost:8082/api

## Testing the Installation

### 1. Health Check

Run the health check script:

```bash
./scripts/health-check.sh
```

You should see all nodes reporting as healthy.

### 2. API Test

Test the API endpoints:

```bash
# Test health endpoint
curl http://localhost:8080/health

# Test metrics endpoint
curl http://localhost:8080/api/metrics?endpoint=health

# Test node info
curl http://localhost:8080/node/info
```

### 3. Stress Test

Run a stress test to verify performance:

```bash
./scripts/stress-test.sh --duration 2 --intensity MEDIUM
```

### 4. Failure Simulation

Test failure simulation:

```bash
curl -X POST http://localhost:8080/api/metrics \
  -H "Content-Type: application/json" \
  -d '{"action": "start_scenario", "scenarioId": "node-cascade"}'
```

## Troubleshooting

### Port Already in Use

If you get a "port already in use" error:

```bash
# Find process using the port
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Dependencies Not Installing

If npm install fails:

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install
```

### Python Script Errors

If Python scripts fail:

```bash
# Ensure Python 3 is installed
python3 --version

# Install required Python packages
pip3 install requests websocket-client

# Make scripts executable
chmod +x scripts/*.sh
```

### Dashboard Not Loading

If the dashboard doesn't load:

```bash
# Check if the process is running
ps aux | grep "node.*dashboard"

# Check logs
tail -f logs/dashboard.log

# Restart dashboard
npm run dashboard
```

### Nodes Not Connecting

If nodes can't connect to each other:

```bash
# Check node logs
tail -f logs/node-1/node.log
tail -f logs/node-2/node.log
tail -f logs/node-3/node.log

# Verify network connectivity
telnet localhost 3000
telnet localhost 3001
telnet localhost 3002

# Check firewall settings
sudo ufw status
```

### Low Performance

If performance is poor:

```bash
# Check system resources
htop
df -h
free -m

# Check Node.js memory usage
node --inspect node start-node.js start

# Run diagnostics
npm run diagnostics
```

## Advanced Configuration

### Custom Network Setup

To create a custom network configuration:

1. Copy the default configuration:
```bash
cp config/network.json config/custom-network.json
```

2. Edit the configuration file:
```json
{
  "network": {
    "name": "my-custom-network",
    "networkId": "custom-test-1",
    "chainId": 1338,
    "genesis": {
      "timestamp": 1640995200000,
      "validators": ["my-validator-1", "my-validator-2"]
    }
  }
}
```

3. Use the custom configuration:
```bash
npm run start -- --config config/custom-network.json
```

### GPU Acceleration

To enable GPU acceleration:

1. Install CUDA Toolkit (NVIDIA) or OpenCL (AMD/Intel)

2. Update node configuration:
```json
{
  "features": {
    "gpuAcceleration": true,
    "gpu": {
      "enabled": true,
      "maxConcurrentTasks": 8,
      "memoryLimit": 4096,
      "preferredDevice": 0
    }
  }
}
```

### Production Deployment

For production deployment:

1. **Environment Variables**:
```bash
export NODE_ENV=production
export KALDRIX_LOG_LEVEL=warn
export KALDRIX_API_RATE_LIMIT_ENABLED=true
```

2. **Process Management**:
Use PM2 or systemd for process management:

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start start-node.js --name kaldrix-validator-1 -- start -- --port 3000 --role validator
pm2 start start-node.js --name kaldrix-miner-1 -- start -- --port 3001 --role miner
pm2 start start-node.js --name kaldrix-dashboard -- dashboard

# Save PM2 configuration
pm2 save
pm2 startup
```

3. **Reverse Proxy**:
Set up Nginx or Apache as a reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Uninstallation

To completely remove the KALDRIX Mini-Testnet:

```bash
# Stop all processes
./scripts/stop-testnet.sh

# Remove node_modules and dependencies
rm -rf node_modules package-lock.json

# Remove generated files
rm -rf data logs testnet-config.json testnet-pids.txt

# Remove the cloned repository (optional)
cd ..
rm -rf blocktest
```

## Next Steps

After successful installation:

1. **Explore the Dashboard**: Visit http://localhost:3000 to monitor your testnet
2. **Run Tests**: Execute the stress test and failure simulation scripts
3. **Read the Documentation**: Check the API documentation and developer guides
4. **Join the Community**: Participate in discussions and report issues

## Support

If you encounter any issues during installation:

1. **Check the logs**: Look at the log files in the `logs/` directory
2. **Run health check**: Execute `./scripts/health-check.sh`
3. **Check known issues**: Review the GitHub Issues page
4. **Create an issue**: Report new problems with detailed information

For additional help:
- **Documentation**: [Wiki](https://github.com/ancourn/blocktest/wiki)
- **Issues**: [GitHub Issues](https://github.com/ancourn/blocktest/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ancourn/blocktest/discussions)