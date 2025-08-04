#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  log(colors.blue, '🚀 KALDRIX Testnet Node Launcher');
  log(colors.blue, '==================================');
  console.log('');

  // Get user input
  const nodeName = await question(`Node Name [kaldrix-node-${Date.now()}]: `) || `kaldrix-node-${Date.now()}`;
  const networkId = await question('Network ID [1337]: ') || '1337';
  const stakingAmount = await question('Staking Amount [1000]: ') || '1000';
  const apiKey = await question('API Key [test-api-key]: ') || 'test-api-key';
  const grafanaPassword = await question('Grafana Password [admin]: ') || 'admin';

  console.log('');
  log(colors.yellow, '📁 Creating directories...');

  // Create necessary directories
  const dirs = ['data', 'monitoring/prometheus', 'monitoring/grafana/dashboards', 'monitoring/grafana/datasources', 'nginx/ssl', 'nginx/conf'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Create monitoring configuration
  log(colors.yellow, '⚙️  Setting up monitoring...');
  const prometheusConfig = `global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'kaldrix-node'
    static_configs:
      - targets: ['kaldrix-node:9090']
    metrics_path: '/metrics'
    scrape_interval: 5s
`;

  fs.writeFileSync('monitoring/prometheus.yml', prometheusConfig);

  // Create Grafana datasource configuration
  const grafanaDatasource = `apiVersion: 1

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
`;

  fs.writeFileSync('monitoring/grafana/datasources/prometheus.yml', grafanaDatasource);

  // Create Nginx configuration
  const nginxConfig = `events {
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
`;

  fs.writeFileSync('nginx/nginx.conf', nginxConfig);

  // Create .env file
  log(colors.yellow, '📝 Creating .env file...');
  const envContent = `NODE_NAME=${nodeName}
NETWORK_ID=${networkId}
STAKING_AMOUNT=${stakingAmount}
API_KEY=${apiKey}
GRAFANA_PASSWORD=${grafanaPassword}
`;

  fs.writeFileSync('.env', envContent);

  // Check Docker and Docker Compose
  try {
    execSync('docker --version', { stdio: 'ignore' });
    execSync('docker-compose --version', { stdio: 'ignore' });
  } catch (error) {
    log(colors.red, '❌ Docker or Docker Compose is not installed. Please install them first.');
    process.exit(1);
  }

  // Start services
  log(colors.yellow, '🔄 Starting KALDRIX services...');
  try {
    execSync('docker-compose down 2>/dev/null || true', { stdio: 'pipe' });
    execSync('docker-compose up -d', { stdio: 'pipe' });
  } catch (error) {
    log(colors.red, '❌ Failed to start services. Check Docker installation.');
    process.exit(1);
  }

  // Wait for services to start
  log(colors.yellow, '⏳ Waiting for services to start...');
  await new Promise(resolve => setTimeout(resolve, 30000));

  // Check service status
  log(colors.yellow, '🔍 Checking service status...');
  try {
    const result = execSync('docker-compose ps', { encoding: 'utf8' });
    if (result.includes('Up')) {
      log(colors.green, '✅ Services started successfully!');
    } else {
      log(colors.red, '❌ Some services failed to start. Check logs with: docker-compose logs');
      process.exit(1);
    }
  } catch (error) {
    log(colors.red, '❌ Failed to check service status.');
    process.exit(1);
  }

  // Display access information
  log(colors.green, '🎉 KALDRIX Testnet Node is running!');
  log(colors.blue, '==================================');
  log(colors.blue, '📊 Node Information:');
  console.log(`  Node Name: ${nodeName}`);
  console.log(`  Network ID: ${networkId}`);
  console.log(`  Staking Amount: ${stakingAmount} KALD`);
  console.log('');
  log(colors.blue, '🌐 Access URLs:');
  console.log('  JSON-RPC API: http://localhost:8545');
  console.log('  WebSocket: ws://localhost:8546');
  console.log(`  Grafana Dashboard: http://localhost:3000 (admin/${grafanaPassword})`);
  console.log('  Prometheus Metrics: http://localhost:9090');
  console.log('');
  log(colors.blue, '📋 Useful Commands:');
  console.log('  View logs: docker-compose logs -f');
  console.log('  Stop services: docker-compose down');
  console.log('  Restart services: docker-compose restart');
  console.log('');
  log(colors.yellow, '💡 Next Steps:');
  console.log('  1. Check your node status at http://localhost:3000');
  console.log('  2. Make your first transaction using the API');
  console.log('  3. Monitor performance metrics in Grafana');
  console.log('  4. Join the community and share your node!');
  console.log('');
  log(colors.green, '🚀 Happy testing with KALDRIX!');

  rl.close();
}

main().catch(error => {
  log(colors.red, `❌ Error: ${error.message}`);
  process.exit(1);
});