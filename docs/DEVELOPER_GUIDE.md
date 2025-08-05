# KALDRIX Developer Guide

## 🚀 Introduction

Welcome to the KALDRIX Public Testnet! This guide provides everything you need to start building on the KALDRIX Quantum DAG Blockchain.

### Quick Start
- **Network Name:** KALDRIX Public Testnet
- **Chain ID:** 61
- **RPC Endpoint:** `http://localhost:4000/rpc`
- **Explorer:** `http://localhost:4000/explorer.html`
- **Faucet:** `https://faucet.kaldrix.network`

## 🔗 Network Configuration

### RPC Endpoints
```json
{
  "name": "KALDRIX Testnet",
  "chainId": 61,
  "rpcUrls": {
    "http": "http://localhost:4000/rpc",
    "ws": "ws://localhost:4000"
  },
  "nativeCurrency": {
    "name": "KALD",
    "symbol": "KALD",
    "decimals": 18
  },
  "blockExplorerUrls": ["http://localhost:4000/explorer.html"]
}
```

### Boot Nodes
```
enode://1234567890abcdef@bootnode1.kaldrix.network:30303
enode://abcdef1234567890@bootnode2.kaldrix.network:30303
enode://fedcba9876543210@bootnode3.kaldrix.network:30303
```

## 💻 Working with RPC Methods

### Standard Ethereum Methods

#### Basic Network Information
```javascript
// Get current block number
const response = await fetch('http://localhost:4000/rpc', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_blockNumber',
    params: [],
    id: 1
  })
});
const result = await response.json();
console.log('Current block:', result.result); // "0x3c1c"
```

#### Account Operations
```javascript
// Get account balance
const balanceResponse = await fetch('http://localhost:4000/rpc', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_getBalance',
    params: ['0x742d35Cc6634C0532925a3b844Bc9e7595f8d934', 'latest'],
    id: 2
  })
});

// Get transaction count (nonce)
const nonceResponse = await fetch('http://localhost:4000/rpc', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_getTransactionCount',
    params: ['0x742d35Cc6634C0532925a3b844Bc9e7595f8d934', 'latest'],
    id: 3
  })
});
```

#### Transaction Operations
```javascript
// Estimate gas for transaction
const gasEstimate = await fetch('http://localhost:4000/rpc', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_estimateGas',
    params: [{
      from: '0x742d35Cc6634C0532925a3b844Bc9e7595f8d934',
      to: '0x742d35Cc6634C0532925a3b844Bc9e7595f8d934',
      value: '0x56bc75e2d63100000' // 1 ETH in wei
    }],
    id: 4
  })
});

// Send raw transaction
const txResponse = await fetch('http://localhost:4000/rpc', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_sendRawTransaction',
    params: ['0x...'], // Signed transaction hex
    id: 5
  })
});
```

### KALDRIX Specific Methods

#### Get Consensus Parameters
```javascript
const consensusParams = await fetch('http://localhost:4000/rpc', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'kaldrix_getConsensusParams',
    params: [],
    id: 6
  })
});

// Response
{
  "consensusType": "QuantumDAG",
  "shardCount": 16,
  "targetBlockTime": 800,
  "maxBlockSize": 2000000,
  "minGasPrice": 1000000000,
  "maxGasLimit": 30000000,
  "validators": {
    "minValidators": 4,
    "maxValidators": 100,
    "stakeThreshold": "1000000000000000000000"
  }
}
```

#### Get Token Supply Information
```javascript
const supplyInfo = await fetch('http://localhost:4000/rpc', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'kaldrix_getSupply',
    params: [],
    id: 7
  })
});

// Response
{
  "totalSupply": "10000000000000000000000000000",
  "circulatingSupply": "2500000000000000000000000000",
  "burnedSupply": "0",
  "stakedSupply": "2500000000000000000000000000",
  "decimals": 18,
  "symbol": "KALD"
}
```

#### Run Load Test
```javascript
const loadTest = await fetch('http://localhost:4000/rpc', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'kaldrix_runLoadTest',
    params: [],
    id: 8
  })
});

// Response
{
  "testId": "load_1628160000000",
  "status": "completed",
  "duration": 30,
  "tps": 156,
  "latency": 32,
  "successRate": 99.8,
  "transactions": 4680
}
```

#### Run Security Test
```javascript
const securityTest = await fetch('http://localhost:4000/rpc', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'kaldrix_runSecurityTest',
    params: [],
    id: 9
  })
});

// Response
{
  "testId": "security_1628160000000",
  "status": "completed",
  "tests": [
    { "name": "invalid_transaction", "result": "passed" },
    { "name": "invalid_block", "result": "passed" },
    { "name": "network_attack", "result": "passed" },
    { "name": "consensus_attack", "result": "passed" }
  ],
  "score": 95
}
```

#### Generate Validation Report
```javascript
const validationReport = await fetch('http://localhost:4000/rpc', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'kaldrix_generateValidationReport',
    params: [],
    id: 10
  })
});

// Response
{
  "reportId": "validation_1628160000000",
  "timestamp": "2025-08-05T05:35:20.000Z",
  "networkStatus": {
    "healthy": true,
    "uptime": "99.9%",
    "peerCount": 12,
    "blockHeight": 15372,
    "syncStatus": "SYNCED"
  },
  "performanceMetrics": {
    "currentTPS": 2400,
    "peakTPS": 78450,
    "averageLatency": 23.5,
    "successRate": 99.8
  },
  "readinessScore": 100
}
```

## 🏗️ Smart Contract Development

### Setting Up Development Environment

#### Install Required Tools
```bash
# Install Node.js and npm
# Install Hardhat
npm install --save-dev hardhat

# Initialize Hardhat project
npx hardhat init

# Install OpenZeppelin contracts
npm install @openzeppelin/contracts
```

#### Configure Hardhat for KALDRIX
```javascript
// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.19",
  networks: {
    kaldrix: {
      url: "http://localhost:4000/rpc",
      chainId: 61,
      accounts: ["0x..."] // Your private key
    }
  }
};
```

### Example Smart Contract

#### Simple Token Contract
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract KaldrixToken is ERC20, Ownable {
    constructor() ERC20("KALDRIX Test Token", "KTEST") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10**18);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}
```

#### Staking Contract
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract KaldrixStaking is Ownable {
    IERC20 public immutable stakingToken;
    
    struct Stake {
        uint256 amount;
        uint256 timestamp;
        uint256 rewardDebt;
    }
    
    mapping(address => Stake) public stakes;
    uint256 public totalStaked;
    uint256 public rewardRate = 100; // 1% annual reward
    
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    
    constructor(address _stakingToken) {
        stakingToken = IERC20(_stakingToken);
    }
    
    function stake(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        
        // Update rewards first
        updateReward(msg.sender);
        
        // Transfer tokens from user
        require(stakingToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Update stake
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].timestamp = block.timestamp;
        totalStaked += amount;
        
        emit Staked(msg.sender, amount);
    }
    
    function unstake(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(stakes[msg.sender].amount >= amount, "Insufficient stake");
        
        // Update rewards first
        updateReward(msg.sender);
        
        // Update stake
        stakes[msg.sender].amount -= amount;
        totalStaked -= amount;
        
        // Transfer tokens back to user
        require(stakingToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit Unstaked(msg.sender, amount);
    }
    
    function updateReward(address user) internal {
        uint256 reward = calculateReward(user);
        if (reward > 0) {
            stakes[user].rewardDebt += reward;
            emit RewardPaid(user, reward);
        }
        stakes[user].timestamp = block.timestamp;
    }
    
    function calculateReward(address user) public view returns (uint256) {
        Stake memory stake = stakes[user];
        if (stake.amount == 0) return 0;
        
        uint256 timeStaked = block.timestamp - stake.timestamp;
        uint256 annualReward = (stake.amount * rewardRate) / 100;
        return (annualReward * timeStaked) / 365 days;
    }
    
    function getStakeInfo(address user) external view returns (Stake memory) {
        return stakes[user];
    }
}
```

### Deploying Contracts

#### Deployment Script
```javascript
// scripts/deploy.js
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy Token Contract
  const KaldrixToken = await ethers.getContractFactory("KaldrixToken");
  const token = await KaldrixToken.deploy();
  await token.deployed();

  console.log("Token deployed to:", token.address);

  // Deploy Staking Contract
  const KaldrixStaking = await ethers.getContractFactory("KaldrixStaking");
  const staking = await KaldrixStaking.deploy(token.address);
  await staking.deployed();

  console.log("Staking contract deployed to:", staking.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

#### Run Deployment
```bash
# Deploy to KALDRIX testnet
npx hardhat run scripts/deploy.js --network kaldrix
```

## 💰 Staking and Rewards

### Becoming a Validator

#### Minimum Requirements
- **Minimum Stake:** 1,000 KALD
- **Technical Requirements:** 
  - 24/7 node uptime
  - Stable internet connection
  - Minimum 8GB RAM
  - 100GB storage space

#### Validator Setup
```bash
# Clone validator repository
git clone https://github.com/kaldrix-network/validator.git
cd validator

# Install dependencies
npm install

# Configure validator
cp config.example.json config.json
# Edit config.json with your settings

# Start validator
npm start
```

#### Staking Commands
```javascript
// Stake tokens
const stakeAmount = ethers.utils.parseEther("1000"); // 1000 KALD
await stakingContract.stake(stakeAmount);

// Unstake tokens
const unstakeAmount = ethers.utils.parseEther("500"); // 500 KALD
await stakingContract.unstake(unstakeAmount);

// Claim rewards
await stakingContract.claimRewards();

// Get stake information
const stakeInfo = await stakingContract.getStakeInfo(yourAddress);
console.log("Staked amount:", ethers.utils.formatEther(stakeInfo.amount));
console.log("Rewards:", ethers.utils.formatEther(stakeInfo.rewardDebt));
```

### Reward Structure

#### Validator Rewards
- **Base Reward:** 5% annual staking reward
- **Performance Bonus:** Up to 2% additional for high uptime
- **Consensus Reward:** Variable based on block production

#### Delegator Rewards
- **Base Reward:** 4% annual staking reward
- **Validator Commission:** 1-10% (set by validator)

## ⛽ Gas Model

### Gas Prices
- **Minimum Gas Price:** 1 Gwei
- **Recommended Gas Price:** 20 Gwei
- **Maximum Gas Limit:** 30,000,000

### Gas Estimation
```javascript
// Estimate gas for contract deployment
const deploymentGas = await ethers.provider.estimateGas({
  data: tokenBytecode,
  from: deployer.address
});

// Estimate gas for transaction
const txGas = await ethers.provider.estimateGas({
  from: sender.address,
  to: receiver.address,
  value: ethers.utils.parseEther("1")
});
```

### Optimizing Gas Usage
```solidity
// Use uint256 instead of smaller types when possible
// Use fixed-size arrays instead of dynamic arrays
// Minimize storage operations
// Use events instead of storage for logging
// Batch operations when possible
```

## 🛠️ Development Tools

### Web3 Integration

#### Using Ethers.js
```javascript
import { ethers } from 'ethers';

// Connect to KALDRIX network
const provider = new ethers.providers.JsonRpcProvider('http://localhost:4000/rpc');
const signer = new ethers.Wallet('0x...', provider);

// Create contract instance
const tokenContract = new ethers.Contract(
  tokenAddress,
  tokenABI,
  signer
);

// Interact with contract
const balance = await tokenContract.balanceOf(signer.getAddress());
console.log('Balance:', ethers.utils.formatEther(balance));
```

#### Using Web3.js
```javascript
const Web3 = require('web3');
const web3 = new Web3('http://localhost:4000/rpc');

// Create account
const account = web3.eth.accounts.create();
console.log('Address:', account.address);
console.log('Private key:', account.privateKey);

// Send transaction
const tx = {
  from: account.address,
  to: '0x742d35Cc6634C0532925a3b844Bc9e7595f8d934',
  value: web3.utils.toWei('1', 'ether'),
  gas: 21000,
  gasPrice: web3.utils.toWei('20', 'gwei')
};

const signedTx = await web3.eth.accounts.signTransaction(tx, account.privateKey);
const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
```

### Testing Framework

#### Writing Tests with Hardhat
```javascript
// test/KaldrixToken.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("KaldrixToken", function () {
  let KaldrixToken;
  let token;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    KaldrixToken = await ethers.getContractFactory("KaldrixToken");
    token = await KaldrixToken.deploy();
    await token.deployed();
  });

  it("Should have correct initial supply", async function () {
    const balance = await token.balanceOf(owner.address);
    expect(await ethers.utils.formatEther(balance)).to.equal("1000000.0");
  });

  it("Should allow minting by owner", async function () {
    await token.mint(addr1.address, ethers.utils.parseEther("100"));
    const balance = await token.balanceOf(addr1.address);
    expect(await ethers.utils.formatEther(balance)).to.equal("100.0");
  });
});
```

#### Run Tests
```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/KaldrixToken.test.js

# Run tests with coverage
npx hardhat coverage
```

## 🔍 Monitoring and Debugging

### Network Monitoring
```javascript
// Monitor block production
provider.on('block', (blockNumber) => {
  console.log('New block:', blockNumber);
});

// Monitor pending transactions
provider.on('pending', (txHash) => {
  console.log('Pending transaction:', txHash);
});
```

### Debugging Transactions
```javascript
// Get transaction details
const tx = await provider.getTransaction(txHash);
console.log('Transaction:', tx);

// Get transaction receipt
const receipt = await provider.getTransactionReceipt(txHash);
console.log('Receipt:', receipt);

// Trace transaction
const trace = await provider.send('debug_traceTransaction', [txHash]);
console.log('Trace:', trace);
```

## 📚 Additional Resources

### Documentation
- [API Reference](./API.md)
- [Smart Contract Best Practices](https://docs.openzeppelin.com/contracts)
- [Security Guidelines](./SECURITY.md)

### Community
- [Discord](https://discord.gg/kaldrix)
- [GitHub](https://github.com/kaldrix-network)
- [Twitter](https://twitter.com/kaldrix_network)

### Tools
- [KALDRIX Faucet](https://faucet.kaldrix.network)
- [Block Explorer](http://localhost:4000/explorer.html)
- [Network Stats](http://localhost:4000/network)

## 🚀 Getting Help

If you need help with development on KALDRIX:

1. **Check the documentation** - Most questions are answered here
2. **Join our Discord** - Get help from the community
3. **Create a GitHub issue** - Report bugs or request features
4. **Contact the team** - For partnership or integration inquiries

---

Happy building on KALDRIX! 🎉