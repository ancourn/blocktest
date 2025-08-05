# 🔧 KALDRIX Blockchain Test Drive Script

A comprehensive testing suite for validating KALDRIX blockchain network functionality, performance, and security.

## 📋 Overview

The Test Drive Script provides automated testing capabilities for the KALDRIX quantum DAG blockchain, allowing developers, node operators, and system administrators to:

- Validate network connectivity and status
- Test blockchain parameters and RPC functionality
- Perform transaction testing and gas estimation
- Run performance stress tests
- Execute security scenario validations
- Generate comprehensive validation reports

## 🚀 Quick Start

### Prerequisites

- **Curl**: For making HTTP requests to RPC endpoints
- **Bash** (Linux/Mac) or **Command Prompt** (Windows)
- **Access to KALDRIX RPC endpoint** (default: `http://localhost:8545`)
- **Basic understanding of blockchain concepts**

### Running the Test

#### Linux/Mac
```bash
# Basic usage
./scripts/kaldrix-test-drive.sh

# Custom RPC endpoint
RPC_URL="http://your-node:8545" ./scripts/kaldrix-test-drive.sh

# Custom test wallet (optional)
TEST_WALLET_PRIV="0xyourprivatekey" ./scripts/kaldrix-test-drive.sh

# Custom receiver address (optional)
RECEIVER_ADDR="0xreceiveraddress" ./scripts/kaldrix-test-drive.sh
```

#### Windows
```cmd
# Basic usage
scripts\kaldrix-test-drive.bat

# Custom RPC endpoint
set RPC_URL=http://your-node:8545
scripts\kaldrix-test-drive.bat

# Custom test wallet (optional)
set TEST_WALLET_PRIV=0xyourprivatekey
scripts\kaldrix-test-drive.bat

# Custom receiver address (optional)
set RECEIVER_ADDR=0xreceiveraddress
scripts\kaldrix-test-drive.bat
```

## 📊 Test Categories

### 1. Network Status Audit
- **RPC Connection**: Verifies connectivity to the blockchain node
- **Peer Count**: Checks number of connected peers
- **Sync Status**: Validates node synchronization state
- **Block Number**: Retrieves current block height
- **Network ID**: Confirms correct network identification

### 2. Blockchain Parameters
- **Gas Price**: Retrieves current gas pricing
- **Account Access**: Tests account availability
- **KALDRIX Consensus**: Checks for KALDRIX-specific consensus parameters
- **Supply Information**: Validates token supply data (if available)

### 3. Transaction Testing
- **Transaction Count**: Retrieves nonce for test addresses
- **Gas Estimation**: Tests gas calculation for transactions
- **Transaction Simulation**: Validates transaction structure (without broadcasting)

### 4. Performance Stress Test
- **Multi-TPS Testing**: Simulates load at 10, 100, and 1000 TPS
- **Latency Measurement**: Measures response times under load
- **Concurrent Requests**: Tests handling of multiple simultaneous requests

### 5. Security Scenario Testing
- **Invalid Transaction Handling**: Tests rejection of malformed transactions
- **Invalid Block Access**: Validates proper error handling for invalid blocks
- **Network Security**: Checks basic network security parameters

### 6. Comprehensive Reporting
- **Health Score Calculation**: Overall network health assessment
- **JSON Report Generation**: Machine-readable test results
- **Detailed Logging**: Step-by-step test execution logs
- **Recommendations**: Automated suggestions based on test results

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `RPC_URL` | KALDRIX RPC endpoint URL | `http://localhost:8545` |
| `TEST_WALLET_PRIV` | Private key for testing (hex) | `0x1234...1234` |
| `RECEIVER_ADDR` | Receiver address for tests | `0xabcd...abcd` |

### Configuration File (Optional)

Create a `.env` file in the scripts directory:

```env
RPC_URL=http://localhost:8545
TEST_WALLET_PRIV=0x1234567890123456789012345678901234567890123456789012345678901234
RECEIVER_ADDR=0xabcdefabcdefabcdefabcdefabcdefabcdefabcd
```

## 📈 Output and Reports

### Console Output

The script provides real-time feedback with color-coded output:

- 🟢 **Green**: Successful tests and positive results
- 🟡 **Yellow**: Warnings and partial successes
- 🔴 **Red**: Failed tests and errors
- 🔵 **Blue**: Informational messages and headers

### Log Files

- **Detailed Log**: `kaldrix-test-YYYYMMDD-HHMMSS.log`
  - Step-by-step test execution
  - Raw RPC responses
  - Error messages and debugging information

### JSON Report

- **Validation Report**: `kaldrix-validation-report-YYYYMMDD-HHMMSS.json`
  - Machine-readable test results
  - Health scores and metrics
  - Structured data for integration

#### Sample JSON Output
```json
{
  "testTimestamp": "2024-12-19T15:30:45",
  "rpcUrl": "http://localhost:8545",
  "results": {
    "rpcConnection": "PASS",
    "peerCount": "12",
    "syncStatus": "SYNCED",
    "currentBlock": "15420",
    "networkId": "1337",
    "gasPrice": "20",
    "accountCount": "3",
    "kaldrixConsensus": "AVAILABLE",
    "kaldrixSupply": "AVAILABLE",
    "transactionCount": "45",
    "estimatedGas": "21000",
    "performanceTest": "COMPLETED",
    "securityTest": "COMPLETED",
    "healthScore": 85,
    "status": "GOOD",
    "testDuration": 45,
    "timestamp": "2024-12-19T15:31:30"
  }
}
```

## 🎯 Health Score System

The script calculates an overall health score based on test results:

| Score Range | Status | Description |
|-------------|--------|-------------|
| 80-100% | EXCELLENT | Network performing optimally |
| 60-79% | GOOD | Network functioning well with minor issues |
| 40-59% | FAIR | Network has noticeable issues |
| 0-39% | POOR | Network has significant problems |

### Scoring Criteria

- **RPC Connection** (20 points): Successful node connectivity
- **Sync Status** (20 points): Proper synchronization state
- **Block Access** (20 points): Ability to retrieve blockchain data
- **Gas Price** (20 points): Economic parameter availability
- **Transaction Functions** (20 points): Transaction-related operations

## 🔧 Advanced Usage

### Custom Test Sequences

Create custom test scripts by leveraging the individual test functions:

```bash
# Test only network status
source scripts/kaldrix-test-drive.sh
test_network_status

# Test only transaction functionality
test_transaction_capabilities

# Test only security scenarios
test_security_scenarios
```

### Integration with CI/CD

```yaml
# GitHub Actions example
name: KALDRIX Network Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run KALDRIX Test Drive
        run: |
          chmod +x scripts/kaldrix-test-drive.sh
          ./scripts/kaldrix-test-drive.sh
      - name: Upload Test Results
        uses: actions/upload-artifact@v2
        with:
          name: test-results
          path: |
            *.log
            *.json
```

### Monitoring Integration

Parse the JSON output for monitoring systems:

```python
import json
import requests

def run_kaldrix_test():
    result = subprocess.run(['./scripts/kaldrix-test-drive.sh'], capture_output=True)
    
    # Parse the latest JSON report
    report_files = [f for f in os.listdir('.') if f.startswith('kaldrix-validation-report-')]
    if report_files:
        with open(report_files[-1], 'r') as f:
            report = json.load(f)
            
        health_score = report['results']['healthScore']
        status = report['results']['status']
        
        # Send to monitoring system
        send_to_monitoring(health_score, status)
```

## 🐛 Troubleshooting

### Common Issues

#### 1. "Connection Failed" Errors
```bash
# Check if RPC endpoint is accessible
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"net_listening","params":[],"id":1}' \
  http://localhost:8545

# Common solutions:
# - Verify node is running: docker-compose ps
# - Check port availability: netstat -tulpn | grep 8545
# - Verify firewall settings
# - Check RPC endpoint configuration
```

#### 2. Permission Denied (Linux/Mac)
```bash
# Make script executable
chmod +x scripts/kaldrix-test-drive.sh

# Or run with bash
bash scripts/kaldrix-test-drive.sh
```

#### 3. Curl Not Found (Windows)
```bash
# Install curl or use Windows version
# Download from: https://curl.se/windows/
# Or use Windows Subsystem for Linux (WSL)
```

#### 4. Timeouts and Slow Responses
```bash
# Increase timeout by modifying the script
# Look for curl commands and add:
curl --max-time 30 ...

# Or check node performance:
docker-compose logs kaldrix-node
```

### Debug Mode

Enable verbose logging by setting environment variables:

```bash
# Enable debug output
DEBUG=1 ./scripts/kaldrix-test-drive.sh

# Save all RPC responses
SAVE_RESPONSES=1 ./scripts/kaldrix-test-drive.sh
```

## 📝 Test Results Interpretation

### Excellent Score (80-100%)
- **Indicates**: Network is healthy and performing optimally
- **Actions**: Regular monitoring, continue normal operations
- **Confidence**: High reliability for production use

### Good Score (60-79%)
- **Indicates**: Network is functional with minor issues
- **Actions**: Monitor closely, investigate minor issues, optimize configuration
- **Confidence**: Suitable for production with attention

### Fair Score (40-59%)
- **Indicates**: Network has noticeable performance or reliability issues
- **Actions**: Immediate investigation required, configuration review, scaling considerations
- **Confidence**: Not recommended for production without fixes

### Poor Score (0-39%)
- **Indicates**: Significant network problems
- **Actions**: Critical attention required, potential service disruption
- **Confidence**: Not suitable for production use

## 🔄 Continuous Testing

### Automated Scheduled Testing

```bash
# Add to crontab (Linux/Mac)
# Run every hour
0 * * * * /path/to/kaldrix-test-drive.sh

# Run every 6 hours
0 */6 * * * /path/to/kaldrix-test-drive.sh

# Windows Task Scheduler
# Create scheduled task to run the batch file
```

### Log Rotation

```bash
# Clean up old log files (add to crontab)
0 0 * * * find /path/to/logs -name "kaldrix-test-*.log" -mtime +7 -delete
0 0 * * * find /path/to/logs -name "kaldrix-validation-report-*.json" -mtime +30 -delete
```

## 🤝 Contributing

### Adding New Tests

1. **Create Test Function**:
```bash
test_new_feature() {
    log "Testing new feature..."
    result=$(rpc_call "new_method" "[]" "100")
    if echo "$result" | grep -q "expected_result"; then
        log "${GREEN}✓ New Feature: Working${NC}"
        echo '"newFeature": "PASS",' >> "$REPORT_FILE"
    else
        log "${RED}✗ New Feature: Failed${NC}"
        echo '"newFeature": "FAIL",' >> "$REPORT_FILE"
    fi
}
```

2. **Update Health Score**:
```bash
# Add to scoring section
if echo "$result" | grep -q "expected_result"; then
    health_score=$((health_score + 10))
fi
total_tests=$((total_tests + 1))
```

3. **Update Documentation**:
- Add test description to README
- Update scoring criteria
- Document new environment variables

### Reporting Issues

When reporting issues, please include:

1. **Environment**: OS, version, curl version
2. **Configuration**: RPC URL, environment variables
3. **Error Messages**: Complete error output
4. **Log Files**: Attach generated log and JSON files
5. **Steps to Reproduce**: Detailed reproduction steps

## 📄 License

This test drive script is part of the KALDRIX blockchain project and is released under the MIT License.

## 🆘 Support

For support and questions:

- **Documentation**: [KALDRIX Docs](https://docs.kaldrix.network)
- **Community**: [Discord Server](https://discord.gg/kaldrix)
- **Issues**: [GitHub Issues](https://github.com/ancourn/blocktest/issues)
- **Email**: [support@kaldrix.network](mailto:support@kaldrix.network)

---

**Happy testing with KALDRIX! 🚀**