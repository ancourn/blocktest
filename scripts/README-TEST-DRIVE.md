# KALDRIX Test Drive Script Documentation

## Overview

The KALDRIX Test Drive Script is a comprehensive validation tool designed to verify the health, performance, and security of your KALDRIX blockchain node. It performs automated tests across multiple categories and generates detailed reports.

## Features

### 🔍 Comprehensive Testing
- **Network Status Audit**: Checks RPC connectivity, peer count, sync status, and basic network parameters
- **Blockchain Parameters**: Validates gas prices, account access, and KALDRIX-specific features
- **Transaction Testing**: Tests transaction capabilities, gas estimation, and nonce management
- **Performance Stress Test**: Simulates load testing at different TPS levels
- **Security Validation**: Tests error handling, invalid input processing, and network security
- **Automated Reporting**: Generates detailed JSON reports and comprehensive logs

### 📊 Health Scoring
- Calculates overall health score (0-100%)
- Provides status classification (Excellent/Good/Fair/Poor)
- Offers actionable recommendations based on results

### 🌐 Cross-Platform Support
- **Linux/macOS**: `kaldrix-test-drive.sh` (Bash script)
- **Windows**: `kaldrix-test-drive.bat` (Batch script)
- **Consistent behavior** across all platforms

## Quick Start

### Prerequisites
- Access to a KALDRIX node RPC endpoint
- `curl` command-line tool (usually pre-installed)
- Basic command-line knowledge

### Basic Usage

#### Linux/macOS
```bash
# Basic test against localhost
./scripts/kaldrix-test-drive.sh

# Test against remote node
RPC_URL="http://your-node-ip:8545" ./scripts/kaldrix-test-drive.sh

# Custom test wallet and receiver
TEST_WALLET_PRIV="0xyourprivatekey" RECEIVER_ADDR="0xreceiveraddress" ./scripts/kaldrix-test-drive.sh
```

#### Windows
```cmd
# Basic test against localhost
scripts\kaldrix-test-drive.bat

# Test against remote node
set RPC_URL=http://your-node-ip:8545
scripts\kaldrix-test-drive.bat

# Custom test wallet and receiver
set TEST_WALLET_PRIV=0xyourprivatekey
set RECEIVER_ADDR=0xreceiveraddress
scripts\kaldrix-test-drive.bat
```

## Configuration Options

### Environment Variables

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `RPC_URL` | KALDRIX node RPC endpoint | `http://localhost:8545` |
| `TEST_WALLET_PRIV` | Test wallet private key | `0x1234...1234` (test key) |
| `RECEIVER_ADDR` | Test receiver address | `0xabcd...abcd` (test address) |

### Example Configurations

#### Local Development Node
```bash
RPC_URL="http://localhost:8545" \
./scripts/kaldrix-test-drive.sh
```

#### Remote Testnet Node
```bash
RPC_URL="https://testnet.kaldrix.network" \
./scripts/kaldrix-test-drive.sh
```

#### Custom Authentication
```bash
RPC_URL="http://user:password@node.kaldrix.network:8545" \
./scripts/kaldrix-test-drive.sh
```

## Test Categories

### 1. Network Status Audit
- **RPC Connection**: Verifies basic connectivity to the node
- **Peer Count**: Checks connected peers in the network
- **Sync Status**: Validates node synchronization state
- **Block Number**: Retrieves current blockchain height
- **Network ID**: Confirms correct network identification

### 2. Blockchain Parameters
- **Gas Price**: Retrieves current gas price in Gwei
- **Account Access**: Tests availability of wallet accounts
- **KALDRIX Consensus**: Checks for KALDRIX-specific consensus parameters
- **Supply Information**: Validates token supply data (if available)

### 3. Transaction Testing
- **Transaction Count**: Gets nonce for test address
- **Gas Estimation**: Estimates gas for sample transactions
- **Transaction Validation**: Tests basic transaction capabilities

### 4. Performance Stress Test
- **Load Simulation**: Tests performance at 10, 100, and 1000 TPS
- **Latency Measurement**: Measures response times under load
- **Resource Usage**: Monitors node performance during stress

### 5. Security Validation
- **Error Handling**: Tests proper rejection of invalid transactions
- **Input Validation**: Verifies handling of malformed requests
- **Network Security**: Checks basic security parameters

## Output Files

### Log File
- **Format**: `kaldrix-test-YYYYMMDD-HHMMSS.log`
- **Content**: Detailed test execution log with timestamps
- **Purpose**: Debugging and detailed analysis

### JSON Report
- **Format**: `kaldrix-validation-report-YYYYMMDD-HHMMSS.json`
- **Content**: Structured test results and metrics
- **Purpose**: Programmatic analysis and integration

### Sample JSON Report Structure
```json
{
  "testTimestamp": "2024-12-20T10:30:45",
  "rpcUrl": "http://localhost:8545",
  "results": {
    "rpcConnection": "PASS",
    "peerCount": "12",
    "syncStatus": "SYNCED",
    "currentBlock": "15420",
    "networkId": "1337",
    "gasPrice": "25",
    "accountCount": "3",
    "kaldrixConsensus": "AVAILABLE",
    "kaldrixSupply": "AVAILABLE",
    "transactionCount": "45",
    "estimatedGas": "21000",
    "performanceTest": "COMPLETED",
    "securityTest": "COMPLETED",
    "healthScore": 85,
    "status": "EXCELLENT",
    "testDuration": 45,
    "timestamp": "2024-12-20T10:31:30"
  }
}
```

## Health Score Calculation

### Scoring System
- **RPC Connection**: 20 points
- **Sync Status**: 20 points
- **Block Number**: 20 points
- **Gas Price**: 20 points
- **Transaction Count**: 20 points

### Status Classification
| Score Range | Status | Description |
|-------------|--------|-------------|
| 80-100% | EXCELLENT | Network performing optimally |
| 60-79% | GOOD | Network functioning well with minor issues |
| 40-59% | FAIR | Network has significant issues |
| 0-39% | POOR | Network requires immediate attention |

## Troubleshooting

### Common Issues

#### Connection Failed
```
✗ RPC Connection: Failed
```
**Solutions:**
- Verify RPC URL is correct
- Check if node is running
- Ensure firewall allows connections
- Verify authentication credentials

#### Sync Issues
```
⚠ Node Status: Syncing
```
**Solutions:**
- Wait for node to fully sync
- Check network connectivity
- Verify node configuration
- Consider resyncing if stuck

#### Missing KALDRIX Features
```
⚠ KALDRIX Consensus: Not available (standard Ethereum mode)
```
**Solutions:**
- Ensure running KALDRIX-specific node software
- Check node configuration for KALDRIX features
- Verify correct network/chain ID

#### Performance Issues
```
Health Score: POOR
```
**Solutions:**
- Check system resources (CPU, RAM, disk)
- Verify network bandwidth
- Review node logs for errors
- Consider scaling resources

### Debug Mode
For detailed debugging, run the script and examine the generated log file:
```bash
# View detailed log
cat kaldrix-test-*.log

# Filter for errors
grep -i error kaldrix-test-*.log

# View specific test results
grep -A 5 -B 5 "RPC Connection" kaldrix-test-*.log
```

## Integration Examples

### CI/CD Pipeline
```yaml
# GitHub Actions Example
name: KALDRIX Health Check
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run KALDRIX Test Drive
        run: |
          RPC_URL="${{ secrets.RPC_URL }}" \
          ./scripts/kaldrix-test-drive.sh
      - name: Upload Results
        uses: actions/upload-artifact@v2
        with:
          name: test-results
          path: kaldrix-*.json
```

### Monitoring Integration
```python
# Python example to parse JSON report
import json
import requests

def run_kaldrix_test():
    # Run the test script
    import subprocess
    result = subprocess.run(['./scripts/kaldrix-test-drive.sh'], capture_output=True, text=True)
    
    # Parse the latest report
    import glob
    report_files = glob.glob('kaldrix-validation-report-*.json')
    if report_files:
        with open(max(report_files)) as f:
            report = json.load(f)
            
        health_score = report['results']['healthScore']
        status = report['results']['status']
        
        # Send to monitoring system
        requests.post('https://monitoring.example.com/webhook', json={
            'health_score': health_score,
            'status': status,
            'timestamp': report['testTimestamp']
        })
    
    return health_score, status
```

### Automated Alerting
```bash
# Example alert script
#!/bin/bash
./scripts/kaldrix-test-drive.sh

# Parse the latest report
report_file=$(ls -t kaldrix-validation-report-*.json | head -1)
health_score=$(jq -r '.results.healthScore' "$report_file")
status=$(jq -r '.results.status' "$report_file")

# Send alert if score is low
if [ "$health_score" -lt 60 ]; then
    curl -X POST "https://hooks.slack.com/services/YOUR/WEBHOOK" \
         -H "Content-Type: application/json" \
         -d "{\"text\":\"🚨 KALDRIX Health Alert: Score $health_score% ($status)\"}"
fi
```

## Best Practices

### Regular Testing
- Run tests daily to monitor network health
- Schedule tests during low-traffic periods
- Maintain historical data for trend analysis

### Environment-Specific Testing
- **Development**: Test against local development nodes
- **Staging**: Test against staging environment
- **Production**: Test against production nodes (read-only)

### Security Considerations
- Use read-only RPC endpoints when possible
- Avoid exposing sensitive private keys
- Regularly rotate authentication credentials
- Monitor test results for anomalies

### Performance Optimization
- Run tests from multiple geographic locations
- Test during different network conditions
- Monitor resource usage during tests
- Compare results over time to identify trends

## Support

### Getting Help
- **Documentation**: https://docs.kaldrix.network
- **Community**: https://discord.gg/kaldrix
- **Issues**: https://github.com/ancourn/blocktest/issues
- **Email**: support@kaldrix.network

### Contributing
We welcome contributions to improve the test drive script:
1. Fork the repository
2. Create a feature branch
3. Add your improvements
4. Submit a pull request

### Reporting Issues
When reporting issues, please include:
- Script version
- Operating system
- Complete error messages
- Relevant log files
- Steps to reproduce

---

**Note**: This script is designed for testing and validation purposes. Always ensure you have proper authorization before testing against production nodes.