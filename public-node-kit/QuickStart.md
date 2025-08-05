# 🚀 KALDRIX Testnet Quick Start Guide

**Get your node running in 5 minutes - No technical experience required!**

---

## 📋 What You'll Need

Before you start, make sure you have:
- ✅ A computer (Windows, Mac, or Linux)
- ✅ Internet connection
- ✅ 10 minutes of your time
- ✅ That's it! No coding knowledge required

---

## 🎯 Quick Start (3 Simple Steps)

### Step 1: Download the Node Kit

**Windows Users:**
```bash
# Open PowerShell (Press Win+X, then click "Windows PowerShell")
# Copy and paste this command:
Invoke-WebRequest -Uri "https://github.com/ancourn/blocktest/raw/main/public-node-kit/kaldrix-node-kit.zip" -OutFile "kaldrix-node-kit.zip"
Expand-Archive -Path "kaldrix-node-kit.zip" -DestinationPath "."
cd kaldrix-node-kit
```

**Mac Users:**
```bash
# Open Terminal (Press Cmd+Space, type "Terminal", press Enter)
# Copy and paste these commands:
curl -L -o kaldrix-node-kit.tar.gz https://github.com/ancourn/blocktest/raw/main/public-node-kit/kaldrix-node-kit.tar.gz
tar -xzf kaldrix-node-kit.tar.gz
cd kaldrix-node-kit
```

**Linux Users:**
```bash
# Open Terminal (Ctrl+Alt+T)
# Copy and paste these commands:
wget https://github.com/ancourn/blocktest/raw/main/public-node-kit/kaldrix-node-kit.tar.gz
tar -xzf kaldrix-node-kit.tar.gz
cd kaldrix-node-kit
```

### Step 2: Configure Your Node

**Create your configuration file:**
```bash
# Copy the example configuration
cp .env.example .env
```

**Edit the configuration (optional but recommended):**
```bash
# Windows (in PowerShell):
notepad .env

# Mac/Linux:
nano .env
```

**Change these values (keep the rest as-is):**
```
NODE_NAME=My-KALDRIX-Node          # Give your node a unique name
STAKING_AMOUNT=1000               # Amount to stake (1000 is good for starters)
API_KEY=my-secret-api-key          # Create your own API key
GRAFANA_PASSWORD=my-password       # Choose a password for your dashboard
```

**Save the file and close the editor.**

### Step 3: Launch Your Node!

**One command to start everything:**
```bash
# Windows:
.\start-node.bat

# Mac/Linux:
./start-node.sh
```

**🎉 That's it! Your node is now running!**

---

## 🔍 How to Check if Your Node is Working

### Method 1: Check the Dashboard

Open your web browser and go to: `http://localhost:3000`

You should see:
- ✅ Grafana login screen
- Use username: `admin`
- Use password: (what you set in GRAFANA_PASSWORD)

### Method 2: Quick Health Check

Open a new terminal/command prompt and run:
```bash
# Check if services are running
docker-compose ps
```

You should see:
```
Name                 Command               State   Ports
------------------------------------------------------------------------
kaldrix-grafana      /run.sh                Up      0.0.0.0:3000->3000/tcp
kaldrix-metrics      /bin/prometheus ...    Up      0.0.0.0:9090->9090/tcp
kaldrix-node         /app/start-node.sh     Up      0.0.0.0:8545-8546->8545-8546/tcp
kaldrix-gateway      nginx -g daemon off    Up      0.0.0.0:80->80/tcp
```

### Method 3: Test the API

```bash
# Test if your node is responding
curl -X POST http://localhost:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

If you get a response like `{"jsonrpc":"2.0","id":1,"result":"0x1"}` - your node is working! 🎉

---

## 💸 Making Your First Transaction

### Using the Web Interface

1. Open your browser to: `http://localhost:8545`
2. You'll see a simple web interface
3. Click "Create Account" to get your test address
4. Click "Send Transaction" to make your first test transaction

### Using Command Line (Advanced)

```bash
# Check your balance
curl -X POST http://localhost:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xYourAddress", "latest"],"id":1}'

# Send a test transaction
curl -X POST http://localhost:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_sendTransaction","params":[{"from":"0xYourAddress","to":"0xRecipientAddress","value":"0x1000"}],"id":1}'
```

---

## 🎁 Claiming Your Rewards

### Check Your Rewards

1. Go to the public dashboard: `https://kaldrix.network/public-dashboard`
2. Look for your address in the leaderboard
3. Your rewards will appear automatically as you participate

### Reward Programs

- **First 100 Transactions**: Get 100 KALD for your first 100 transactions
- **Referral Program**: Earn 50 KALD for each friend you refer
- **Uptime Rewards**: Earn 10 KALD per day for keeping your node online
- **Staking Rewards**: Earn up to 18.2% APY on staked tokens

### How to Refer Friends

1. Get your referral link from the dashboard
2. Share it with friends
3. When they join using your link, you both get rewards!

---

## 📊 Monitoring Your Node

### Access Your Dashboard

- **Grafana Dashboard**: `http://localhost:3000`
  - Username: `admin`
  - Password: (what you set in .env)

### Key Metrics to Watch

1. **Node Health**: Should show "Up" status
2. **TPS**: Transactions per second (should be > 0)
3. **Latency**: Should be under 100ms
4. **Uptime**: Should be 99%+
5. **Staking Rewards**: Should increase over time

### Mobile Monitoring

You can access your dashboard from your phone:
1. Make sure your computer is running and connected to internet
2. Find your computer's local IP address:
   ```bash
   # Windows:
   ipconfig
   
   # Mac/Linux:
   ifconfig
   ```
3. On your phone, visit: `http://YOUR_IP:3000`

---

## 🔧 Common Issues & Solutions

### Problem: "Docker not found"
**Solution**: Install Docker first
- **Windows**: Download from [docker.com](https://docker.com)
- **Mac**: Download Docker Desktop
- **Linux**: Run `sudo apt install docker.io docker-compose`

### Problem: "Port already in use"
**Solution**: Change the ports in `.env` file
```
# Add these lines to .env:
JSON_RPC_PORT=8546
WEBSOCKET_PORT=8547
GRAFANA_PORT=3001
```

### Problem: "Node not syncing"
**Solution**: Restart your node
```bash
docker-compose restart kaldrix-node
```

### Problem: "Can't access dashboard"
**Solution**: Check if Grafana is running
```bash
docker-compose logs grafana
```

### Problem: "Low TPS"
**Solution**: This is normal for testnet. Real TPS will be higher in mainnet.

---

## 📞 Need Help?

### Quick Help Resources

1. **Documentation**: [kaldrix.network/docs](https://kaldrix.network/docs)
2. **Community Chat**: [Discord Server](https://discord.gg/kaldrix)
3. **FAQ**: Check the README.md file in your node kit
4. **Video Tutorial**: [YouTube Guide](https://youtube.com/kaldrix)

### Getting Personal Help

If you're stuck:
1. **Join our Discord**: We have 24/7 support
2. **Create a GitHub Issue**: [Report Problems](https://github.com/ancourn/blocktest/issues)
3. **Email us**: support@kaldrix.network

### What to Include When Asking for Help

```
My System: [Windows/Mac/Linux]
Docker Version: [run 'docker --version']
Error Message: [Copy the exact error]
What I tried: [Describe what you did]
```

---

## 🚀 What's Next?

### Day 1: ✅ Get Your Node Running
- [ ] Download and extract node kit
- [ ] Configure your settings
- [ ] Launch your node
- [ ] Verify it's working

### Day 2: 📊 Explore and Monitor
- [ ] Check your dashboard
- [ ] Make your first transaction
- [ ] Monitor your node's performance
- [ ] Join the community

### Day 3: 🎁 Participate and Earn
- [ ] Make 100 transactions (earn 100 KALD)
- [ ] Refer friends (earn 50 KALD each)
- [ ] Keep your node online (earn 10 KALD/day)
- [ ] Check the leaderboard

### Week 1: 🌟 Become a Pro
- [ ] Stake your tokens (earn up to 18.2% APY)
- [ ] Participate in governance
- [ ] Help other new users
- [ ] Provide feedback to the team

---

## 🎯 Success Checklist

**Your node is successful when:**
- ✅ It's been running for 24+ hours
- ✅ You've made 100+ transactions
- ✅ You're on the leaderboard
- ✅ You've earned rewards
- ✅ You've referred at least one friend

**You're a KALDRIX pro when:**
- ✅ You can explain how DAG works
- ✅ You've helped someone else set up a node
- ✅ You're staking tokens
- ✅ You're participating in governance
- ✅ You're earning consistent rewards

---

## 🏆 Congratulations!

**You're now part of the KALDRIX testnet!** 🎉

### What You've Accomplished:
- ✅ Set up a blockchain node
- ✅ Joined a cutting-edge quantum DAG network
- ✅ Started earning crypto rewards
- ✅ Contributed to blockchain technology
- ✅ Positioned yourself for future opportunities

### What This Means:
- You're now running real blockchain infrastructure
- You're earning real (testnet) crypto rewards
- You're gaining valuable blockchain experience
- You're part of a revolutionary technology
- You're helping build the future of finance

---

## 📈 Stay Connected

**Don't miss out on important updates:**

- **Twitter**: [@KALDRIX](https://twitter.com/kaldrix) - Daily updates
- **Discord**: [Community Server](https://discord.gg/kaldrix) - Chat with the team
- **GitHub**: [Source Code](https://github.com/ancourn/blocktest) - Technical updates
- **Newsletter**: [Subscribe](https://kaldrix.network/newsletter) - Weekly summary

---

## 🎉 Final Words

**Thank you for joining the KALDRIX testnet!** 

You're not just running a node - you're helping build the future of blockchain technology. Every transaction you make, every block you validate, and every piece of feedback you provide helps make KALDRIX better.

**Remember:**
- This is a testnet - have fun and experiment
- Your feedback is valuable - share your experience
- You're part of a community - help others
- The future is quantum - you're at the forefront

**Happy testing! 🚀**

---

*Need help? We're here for you 24/7 in Discord or at support@kaldrix.network*