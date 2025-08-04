# 🚀 KALDRIX Testnet Node Runner Kit

Welcome to the KALDRIX Quantum DAG Blockchain Testnet! This kit contains everything you need to run a testnet node and participate in the future of blockchain technology.

## 📋 What's Included

- **Pre-configured Docker Services**: Node, metrics collector, API gateway, and monitoring dashboard
- **One-Command Launch**: Simple scripts to get your node running in minutes
- **Real-time Monitoring**: Grafana dashboard for performance metrics
- **Cross-Platform Support**: Works on Windows, Mac, and Linux

## 🎯 Quick Start (5 Minutes)

### Option 1: Shell Script (Recommended for Linux/Mac)

```bash
# 1. Download and extract the kit
wget https://github.com/ancourn/blocktest/raw/main/public-node-kit/kaldrix-node-kit.tar.gz
tar -xzf kaldrix-node-kit.tar.gz
cd kaldrix-node-kit

# 2. Make the script executable
chmod +x start-node.sh

# 3. Launch your node!
./start-node.sh
```

### Option 2: Node.js Script (Cross-Platform)

```bash
# 1. Install Node.js if you haven't already
# Visit: https://nodejs.org/

# 2. Download and extract the kit
# (Same as above)

# 3. Launch your node!
node start-node.js
```

### Option 3: Manual Docker Compose

```bash
# 1. Copy the example configuration
cp .env.example .env

# 2. Edit .env with your settings
nano .env

# 3. Start the services
docker-compose up -d
```

## 🔧 Configuration

### Environment Variables

Edit the `.env` file to customize your node:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_NAME` | Unique name for your node | `kaldrix-node-{timestamp}` |
| `NETWORK_ID` | Testnet network ID | `1337` |
| `STAKING_AMOUNT` | Amount to stake (testnet KALD) | `1000` |
| `API_KEY` | Your API key for services | `test-api-key` |
| `GRAFANA_PASSWORD` | Password for Grafana dashboard | `admin` |

### Custom Ports

You can customize ports by uncommenting and editing these variables in `.env`:

```env
JSON_RPC_PORT=8545
WEBSOCKET_PORT=8546
GRAFANA_PORT=3000
PROMETHEUS_PORT=9090
```

## 🌐 Access Your Node

Once running, you can access your node through these URLs:

| Service | URL | Credentials |
|---------|-----|-------------|
| JSON-RPC API | http://localhost:8545 | None |
| WebSocket | ws://localhost:8546 | None |
| Grafana Dashboard | http://localhost:3000 | admin/[your-password] |
| Prometheus Metrics | http://localhost:9090 | None |

## 📊 Monitoring Your Node

### Grafana Dashboard

The Grafana dashboard provides real-time metrics about:

- **TPS (Transactions Per Second)**: Network throughput
- **Latency**: Transaction confirmation times
- **Node Status**: Uptime and health
- **Staking**: Your staking rewards and participation
- **Network**: Connected peers and network health

### Key Metrics to Watch

1. **Node Health**: Should show "Up" status
2. **TPS**: Should be > 0 when network is active
3. **Latency**: Should be < 100ms for optimal performance
4. **Staking Rewards**: Should increase over time
5. **Peer Count**: Should be > 0 for network participation

## 💸 Making Transactions

### Using curl

```bash
# Check node status
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Send a test transaction
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_sendTransaction","params":[{"from":"0x...","to":"0x...","value":"0x..."}],"id":1}'
```

### Using Web3.js

```javascript
const Web3 = require('web3');
const web3 = new Web3('http://localhost:8545');

// Check connection
web3.eth.getBlockNumber().then(console.log);

// Get account balance
web3.eth.getBalance('0x...').then(balance => {
  console.log('Balance:', web3.utils.fromWei(balance, 'ether'));
});
```

## 🎁 Incentives and Rewards

### Testnet Rewards

- **First 100 Transactions**: Get 100 testnet KALD each
- **Referral Program**: Invite friends and earn 50 KALD per referral
- **Staking Rewards**: Earn 5% APY on staked tokens
- **Uptime Rewards**: Earn 10 KALD per day for maintaining 99%+ uptime

### Leaderboard

Check the public dashboard to see:
- Top stakers
- Most active nodes
- Referral champions
- Uptime leaders

## 🔍 Troubleshooting

### Common Issues

#### 1. Docker not installed
**Error**: `docker: command not found`

**Solution**:
- **Ubuntu/Debian**: `sudo apt update && sudo apt install docker.io docker-compose`
- **CentOS/RHEL**: `sudo yum install docker docker-compose`
- **Mac**: Download Docker Desktop from https://www.docker.com/products/docker-desktop
- **Windows**: Download Docker Desktop from https://www.docker.com/products/docker-desktop

#### 2. Port already in use
**Error**: `Bind for 0.0.0.0:8545 failed: port is already allocated`

**Solution**:
- Check what's using the port: `netstat -tulpn | grep :8545`
- Change the port in `.env` file
- Stop the conflicting service

#### 3. Node not syncing
**Symptom**: Block number not increasing

**Solution**:
```bash
# Check node logs
docker-compose logs kaldrix-node

# Restart the node
docker-compose restart kaldrix-node

# Check network connectivity
docker-compose exec kaldrix-node ping 8.8.8.8
```

#### 4. Grafana not accessible
**Symptom**: Can't access http://localhost:3000

**Solution**:
```bash
# Check Grafana logs
docker-compose logs grafana

# Restart Grafana
docker-compose restart grafana

# Check if port is available
netstat -tulpn | grep :3000
```

#### 5. Low TPS
**Symptom**: TPS < 1000

**Solution**:
- Check your internet connection
- Verify node is properly synced
- Check system resources (CPU, RAM)
- Restart the node if needed

### Getting Help

If you encounter issues not covered here:

1. **Check the logs**: `docker-compose logs -f`
2. **Visit our dashboard**: [Public Dashboard URL]
3. **Join our community**: [Community Links]
4. **Create an issue**: [GitHub Issues]

## 📈 Success Metrics

Track your node's performance with these key metrics:

| Metric | Target | How to Check |
|--------|---------|---------------|
| Uptime | > 99% | Grafana dashboard |
| TPS | > 1000 | Grafana dashboard |
| Latency | < 100ms | Grafana dashboard |
| Staking Rewards | Increasing | Grafana dashboard |
| Peer Count | > 5 | Node logs |

## 🚀 Next Steps

1. **Join the Community**: Connect with other node operators
2. **Monitor Performance**: Keep an eye on your metrics
3. **Participate in Governance**: Vote on network proposals
4. **Refer Friends**: Earn referral rewards
5. **Provide Feedback**: Help us improve the network

## 📞 Support

- **Documentation**: [Docs URL]
- **Community**: [Discord/Telegram]
- **Issues**: [GitHub Issues]
- **Email**: support@kaldrix.network

## 🔒 Security Notes

- This is a testnet - use testnet tokens only
- Never share your private keys
- Use strong passwords for Grafana
- Keep your system updated
- Monitor your node for unusual activity

---

**Happy testing with KALDRIX! 🎉**

Built with ❤️ by the KALDRIX team