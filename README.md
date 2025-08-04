# KALDRIX Quantum DAG Blockchain - Mini-Testnet Kit

🚀 A complete mini-testnet implementation of the KALDRIX quantum-resistant DAG blockchain system with real-time monitoring, stress testing, and reliability features.

## 🌟 Features

### Core Blockchain Features
- **Quantum-Resistant Cryptography**: ML-DSA, SPHINCS+, Falcon, and Bulletproofs
- **DAG Architecture**: Directed Acyclic Graph for high throughput and scalability
- **Multi-Shard Processing**: Parallel transaction validation across multiple shards
- **GPU Acceleration**: Hardware acceleration for cryptographic operations
- **Transaction Batching**: Efficient batch processing with signature aggregation

### Reliability & Availability
- **Automatic Failover**: Node failure detection and automatic recovery
- **Consensus Catch-up**: Blockchain state synchronization and recovery
- **Failure Simulation**: Chaos engineering with predefined failure scenarios
- **99.99% SLA**: Comprehensive availability monitoring and alerting
- **Stress Testing**: Load testing with configurable intensity levels

### Monitoring & Dashboard
- **Real-time Dashboard**: Live metrics and system health visualization
- **WebSocket API**: Real-time updates for all metrics
- **REST API**: Comprehensive HTTP API for all operations
- **Performance Metrics**: TPS, latency, availability, and resource usage
- **Alert System**: Configurable alerts and notifications

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Python 3 (for configuration scripts)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/ancourn/blocktest.git
cd blocktest
```

2. **Install dependencies**
```bash
npm install
```

3. **Deploy the mini-testnet**
```bash
./scripts/deploy-testnet.sh
```

4. **Access the dashboard**
Open your browser and navigate to `http://localhost:3000`

### Manual Setup

If you prefer manual setup:

1. **Start individual nodes**
```bash
# Terminal 1 - Validator Node
npm run start -- --port 3000 --node-id kaldrix-validator-1 --role validator

# Terminal 2 - Miner Node  
npm run start -- --port 3001 --node-id kaldrix-miner-1 --role miner

# Terminal 3 - Observer Node
npm run start -- --port 3002 --node-id kaldrix-observer-1 --role observer
```

2. **Start the dashboard**
```bash
npm run dashboard
```

## 📊 Dashboard Features

The real-time dashboard provides:

### Key Metrics
- **Network Availability**: Real-time uptime and SLA compliance
- **Active Nodes**: Node health and connectivity status
- **Transactions Per Second**: Current TPS vs target TPS
- **Consensus Health**: Blockchain consensus status and sync progress

### Real-time Charts
- **Network Performance**: TPS and availability over time
- **Resource Usage**: CPU, memory, network, and storage utilization
- **Node Status**: Individual node health metrics

### Control Panel
- **Start/Stop Nodes**: Dynamic node management
- **Testnet Control**: Start and stop the entire testnet
- **Failure Simulation**: Inject failures for testing
- **Stress Testing**: Run load tests with configurable parameters

### Alerts & Notifications
- **Real-time Alerts**: Instant notifications for system events
- **Incident Tracking**: Complete incident lifecycle management
- **Severity Levels**: Critical, warning, and info alerts

## 🔧 Configuration

### Network Configuration
Edit `config/network.json` to customize:
- Network parameters and genesis settings
- Consensus algorithm configuration
- Sharding and quantum cryptography settings
- GPU acceleration and batching options

### Node Configuration
Individual node configurations are in `config/node-*.json`:
- Node roles (validator, miner, observer)
- API and WebSocket ports
- Data directories and logging
- Feature flags and monitoring settings

### Environment Variables
Key environment variables:
```bash
KALDRIX_NETWORK_NAME=kaldrix-mini-testnet
KALDRIX_NODE_ID=kaldrix-node-1
KALDRIX_ROLE=validator
KALDRIX_PORT=3000
KALDRIX_DATA_DIR=./data
KALDRIX_LOG_LEVEL=info
```

## 🧪 Testing

### Health Check
```bash
./scripts/health-check.sh
```

### Stress Testing
```bash
# Basic stress test
./scripts/stress-test.sh

# Custom stress test
./scripts/stress-test.sh --duration 10 --intensity HIGH --target-tps 5000
```

### Failure Simulation
```bash
# Simulate node failure
curl -X POST http://localhost:8080/api/metrics \
  -H "Content-Type: application/json" \
  -d '{"action": "start_scenario", "scenarioId": "node-cascade", "targetNodes": ["node-1"]}'

# Simulate network partition
curl -X POST http://localhost:8080/api/metrics \
  -H "Content-Type: application/json" \
  -d '{"action": "start_scenario", "scenarioId": "network-split"}'
```

## 📡 API Reference

### REST API Endpoints

#### Health & Status
- `GET /health` - Basic health check
- `GET /node/info` - Node information
- `GET /metrics` - All metrics
- `GET /metrics?endpoint=health` - Health metrics
- `GET /metrics?endpoint=cluster` - Cluster status
- `GET /metrics?endpoint=availability` - Availability metrics
- `GET /metrics?endpoint=consensus` - Consensus status
- `GET /metrics?endpoint=tps` - TPS metrics

#### Control Operations
- `POST /api/metrics` - Control operations
  ```json
  {
    "action": "register_node",
    "nodeId": "kaldrix-node-4"
  }
  ```

#### Transaction Submission
- `POST /transactions` - Submit transactions
  ```json
  {
    "transactions": [
      {
        "id": "tx_001",
        "from": "0x...",
        "to": "0x...",
        "amount": "1000",
        "gas": "21000"
      }
    ]
  }
  ```

### WebSocket API

Connect to `ws://localhost:3000` for real-time updates:

#### Subscribe to Channels
```javascript
const socket = io('http://localhost:3000');
socket.emit('subscribe', {
  channels: ['cluster', 'availability', 'consensus', 'tps', 'alerts']
});
```

#### Real-time Events
- `cluster_update` - Node status changes
- `availability_update` - Availability metrics
- `consensus_update` - Consensus progress
- `tps_update` - TPS metrics
- `alert_triggered` - System alerts

## 🏗️ Architecture

### Node Types

#### Validator Nodes
- Participate in consensus
- Validate transactions and blocks
- Earn staking rewards
- Required: 10,000 tokens stake

#### Miner Nodes
- Create new blocks
- Participate in mining
- Earn block rewards
- Configurable hash power

#### Observer Nodes
- Read-only access
- API endpoints for data
- No consensus participation
- Full data retention

### Components

#### Core Components
- **Failover Manager**: Node health monitoring and automatic failover
- **Consensus Catch-up**: Blockchain state synchronization
- **Multi-Shard Processor**: Parallel transaction validation
- **GPU Accelerator**: Hardware-accelerated cryptography
- **Transaction Batcher**: Efficient batch processing

#### Reliability Components
- **Failure Simulator**: Chaos engineering and testing
- **Availability Monitor**: SLA monitoring and alerting
- **Stress Test Environment**: Load testing framework
- **TPS Target Manager**: Performance scaling management

## 🔒 Security Features

### Quantum Resistance
- **ML-DSA**: Module-Lattice-Based Digital Signature Algorithm
- **SPHINCS+**: Stateless Hash-Based Digital Signature Scheme
- **Falcon**: Fast Fourier lattice-based compact signatures
- **Bulletproofs**: Non-interactive zero-knowledge proofs

### Network Security
- **TLS Encryption**: Secure communication between nodes
- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **Rate Limiting**: API rate limiting and DDoS protection

### Data Security
- **Encryption-at-Rest**: Encrypted storage
- **Backup & Recovery**: Automated backup system
- **Audit Logging**: Comprehensive audit trails
- **Key Management**: Secure key rotation and backup

## 📈 Performance

### Benchmarks
- **Target TPS**: 75,000 transactions per second
- **Latency**: <100ms average confirmation time
- **Availability**: 99.99% uptime SLA
- **Scalability**: Linear scaling with node count

### Optimization Features
- **GPU Acceleration**: 10-50x speedup for cryptographic operations
- **Transaction Batching**: 90% reduction in cryptographic overhead
- **Multi-Shard Processing**: Parallel validation across 4+ shards
- **Signature Aggregation**: Efficient batch signature verification

## 🛠️ Development

### Building from Source
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Start development server
npm run dev
```

### Code Structure
```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── reliability/      # Reliability dashboard
│   ├── performance/      # Performance dashboard
│   └── ui/               # UI components
├── lib/                  # Core libraries
│   ├── reliability/      # Reliability components
│   ├── sharding/         # Multi-shard processing
│   ├── gpu/              # GPU acceleration
│   ├── batching/         # Transaction batching
│   └── tps/              # TPS management
├── config/               # Configuration files
├── scripts/              # Deployment and utility scripts
└── public/               # Static assets
```

### Testing
```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Run performance tests
npm run test:performance
```

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### Node Won't Start
```bash
# Check logs
tail -f logs/node-1/node.log

# Check configuration
node start-node.js --validate-config config/node-1.json
```

#### Dashboard Not Loading
```bash
# Check if dashboard is running
curl http://localhost:3000

# Restart dashboard
npm run dashboard
```

#### Low TPS
```bash
# Check system resources
htop

# Run performance diagnostics
npm run diagnostics

# Optimize configuration
./scripts/optimize-config.sh
```

### Log Files
- Node logs: `logs/node-*/node.log`
- Dashboard logs: `logs/dashboard.log`
- API logs: `logs/api.log`
- System logs: `logs/system.log`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Add tests for new features
- Update documentation
- Use conventional commits
- Ensure code passes linting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Quantum Resistance**: Based on NIST post-quantum cryptography standards
- **DAG Architecture**: Inspired by modern DAG-based blockchain implementations
- **GPU Computing**: CUDA and OpenCL acceleration frameworks
- **Monitoring**: Prometheus and Grafana-inspired metrics collection

## 📞 Support

- **Documentation**: [Wiki](https://github.com/ancourn/blocktest/wiki)
- **Issues**: [GitHub Issues](https://github.com/ancourn/blocktest/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ancourn/blocktest/discussions)
- **Discord**: [Community Server](https://discord.gg/kaldrix)

---

🚀 **Happy testing with KALDRIX Mini-Testnet!** 🚀