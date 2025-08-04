# API Documentation

## Overview

The KALDRIX Mini-Testnet provides comprehensive REST and WebSocket APIs for interacting with the blockchain network, monitoring system health, and controlling test operations.

## Base URL

- **REST API**: `http://localhost:8080/api`
- **WebSocket**: `ws://localhost:3000`

## Authentication

Currently, the API does not require authentication for local development. In production environments, JWT-based authentication can be enabled.

## REST API Endpoints

### Health & Status

#### GET /health
Basic health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "nodeId": "kaldrix-node-1",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "uptime": 3600
}
```

#### GET /node/info
Get detailed node information.

**Response:**
```json
{
  "nodeId": "kaldrix-node-1",
  "role": "validator",
  "network": "kaldrix-mini-testnet",
  "port": 3000,
  "version": "1.0.0",
  "startTime": "2024-01-15T09:30:45.123Z"
}
```

### Metrics

#### GET /api/metrics
Get all system metrics.

**Response:**
```json
{
  "cluster": {
    "totalNodes": 3,
    "activeNodes": 3,
    "healthyNodes": 3,
    "availability": 99.985,
    "nodes": [...]
  },
  "availability": {
    "metrics": {
      "uptime": 99.985,
      "downtime": 1260,
      "slaCompliance": true,
      "currentStreak": 259200
    },
    "system": {
      "overallAvailability": 99.985,
      "nodeCount": 3,
      "healthyNodes": 3,
      "averageResponseTime": 156,
      "consensusHealth": 98.5
    }
  },
  "consensus": {
    "currentHeight": 15420,
    "targetHeight": 15420,
    "syncProgress": 100,
    "isSyncing": false
  },
  "tps": {
    "currentTPS": 1250.5,
    "targetTPS": 1000,
    "efficiency": 125.05
  },
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

#### GET /api/metrics?endpoint=cluster
Get cluster-specific metrics.

#### GET /api/metrics?endpoint=availability
Get availability metrics.

#### GET /api/metrics?endpoint=consensus
Get consensus metrics.

#### GET /api/metrics?endpoint=tps
Get TPS metrics.

#### GET /api/metrics?endpoint=nodes
Get node status information.

#### GET /api/metrics?endpoint=incidents
Get incident history.

#### GET /api/metrics?endpoint=alerts
Get alert rules and active alerts.

#### GET /api/metrics?endpoint=health
Get comprehensive health status.

### Control Operations

#### POST /api/metrics
Execute control operations.

**Request Body:**
```json
{
  "action": "register_node",
  "nodeId": "kaldrix-node-4"
}
```

**Available Actions:**

##### register_node
Register a new node with the system.

**Request:**
```json
{
  "action": "register_node",
  "nodeId": "kaldrix-node-4"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Node kaldrix-node-4 registered"
}
```

##### start_scenario
Start a failure simulation scenario.

**Request:**
```json
{
  "action": "start_scenario",
  "scenarioId": "node-cascade",
  "targetNodes": ["node-1", "node-2"]
}
```

**Available Scenarios:**
- `byzantine-leader`: Byzantine leader attack
- `network-split`: Network partition simulation
- `node-cascade`: Cascading node failures
- `latency-spike`: Network latency spike
- `partial-outage`: Partial system outage

**Response:**
```json
{
  "success": true,
  "message": "Scenario node-cascade started"
}
```

##### stop_scenario
Stop a running failure scenario.

**Request:**
```json
{
  "action": "stop_scenario",
  "scenarioId": "node-cascade"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Scenario node-cascade stopped"
}
```

##### start_catchup
Start consensus catch-up process.

**Request:**
```json
{
  "action": "start_catchup",
  "fromHeight": 15000,
  "toHeight": 15420
}
```

**Response:**
```json
{
  "success": true,
  "message": "Consensus catchup started from 15000 to 15420"
}
```

##### set_tps_target
Set new TPS target.

**Request:**
```json
{
  "action": "set_tps_target",
  "target": 5000
}
```

**Response:**
```json
{
  "success": true,
  "message": "TPS target set to 5000"
}
```

##### enable_chaos / disable_chaos
Enable or disable chaos mode.

**Request:**
```json
{
  "action": "enable_chaos"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Chaos mode enabled"
}
```

### Transactions

#### POST /transactions
Submit transactions to the network.

**Request:**
```json
{
  "transactions": [
    {
      "id": "tx_001",
      "from": "0x1234567890123456789012345678901234567890",
      "to": "0x0987654321098765432109876543210987654321",
      "amount": "1000",
      "gas": "21000",
      "gasPrice": "1000000000",
      "nonce": 1,
      "data": "0x"
    }
  ]
}
```

**Response:**
```json
{
  "accepted": true,
  "count": 1,
  "batchId": "batch_1642246245123"
}
```

### Network Status

#### GET /network/status
Get overall network status.

**Response:**
```json
{
  "status": "healthy",
  "network": "kaldrix-mini-testnet",
  "totalNodes": 3,
  "activeNodes": 3,
  "consensus": "achieved",
  "lastBlock": 15420,
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

## WebSocket API

### Connection

Connect to the WebSocket server:
```javascript
const socket = io('http://localhost:3000');
```

### Subscription

Subscribe to real-time updates:

```javascript
socket.emit('subscribe', {
  channels: ['cluster', 'availability', 'consensus', 'tps', 'alerts']
});
```

**Available Channels:**
- `cluster`: Node status changes and cluster updates
- `availability`: Availability metrics and SLA compliance
- `consensus`: Consensus progress and blockchain state
- `tps`: Transaction per second metrics
- `alerts`: System alerts and notifications

### Events

#### Connected Event
```javascript
socket.on('connected', (data) => {
  console.log('Connected:', data);
});
```

**Response:**
```json
{
  "message": "Connected to KALDRIX metrics WebSocket",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "socketId": "abc123"
}
```

#### Cluster Updates
```javascript
socket.on('cluster_update', (data) => {
  console.log('Cluster update:', data);
});
```

**Response:**
```json
{
  "totalNodes": 3,
  "activeNodes": 3,
  "healthyNodes": 3,
  "availability": 99.985,
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

#### Availability Updates
```javascript
socket.on('availability_update', (data) => {
  console.log('Availability update:', data);
});
```

**Response:**
```json
{
  "uptime": 99.985,
  "downtime": 1260,
  "slaCompliance": true,
  "currentStreak": 259200,
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

#### Consensus Updates
```javascript
socket.on('consensus_update', (data) => {
  console.log('Consensus update:', data);
});
```

**Response:**
```json
{
  "currentHeight": 15420,
  "targetHeight": 15420,
  "syncProgress": 100,
  "validators": 5,
  "quorumSize": 4,
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

#### TPS Updates
```javascript
socket.on('tps_update', (data) => {
  console.log('TPS update:', data);
});
```

**Response:**
```json
{
  "currentTPS": 1250.5,
  "targetTPS": 1000,
  "efficiency": 125.05,
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

#### Alert Events
```javascript
socket.on('alert_triggered', (data) => {
  console.log('Alert triggered:', data);
});
```

**Response:**
```json
{
  "id": "alert_1642246245123",
  "type": "node_failure",
  "severity": "critical",
  "message": "Node kaldrix-node-1 has failed",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

### Custom Requests

#### Request Metrics
```javascript
socket.emit('request_metrics', {
  type: 'cluster'
});
```

**Response:**
```javascript
socket.on('metrics_response', (data) => {
  console.log('Metrics response:', data);
});
```

**Response:**
```json
{
  "type": "cluster",
  "metrics": {
    "totalNodes": 3,
    "activeNodes": 3,
    "healthyNodes": 3,
    "availability": 99.985
  },
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

#### Ping/Pong
```javascript
socket.emit('ping');
```

**Response:**
```javascript
socket.on('pong', (data) => {
  console.log('Pong response:', data);
});
```

**Response:**
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

## Error Handling

### HTTP Error Codes

- **200 OK**: Successful request
- **400 Bad Request**: Invalid request parameters
- **404 Not Found**: Endpoint not found
- **500 Internal Server Error**: Server error

### Error Response Format

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

### Common Errors

#### Invalid Action
```json
{
  "error": "Unknown action",
  "action": "invalid_action",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

#### Component Not Initialized
```json
{
  "error": "Internal server error",
  "message": "Components not initialized",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

#### Scenario Not Found
```json
{
  "error": "Internal server error",
  "message": "Failed to start scenario invalid_scenario",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:
- **Default limit**: 100 requests per minute
- **Window**: 60 seconds
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Examples

### JavaScript/Node.js

```javascript
// Get cluster status
async function getClusterStatus() {
  const response = await fetch('http://localhost:8080/api/metrics?endpoint=cluster');
  const data = await response.json();
  return data;
}

// Start failure scenario
async function startFailureScenario(scenarioId, targetNodes) {
  const response = await fetch('http://localhost:8080/api/metrics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'start_scenario',
      scenarioId,
      targetNodes
    })
  });
  return await response.json();
}

// WebSocket connection
const socket = io('http://localhost:3000');
socket.emit('subscribe', { channels: ['cluster', 'alerts'] });

socket.on('cluster_update', (data) => {
  console.log('Cluster updated:', data);
});
```

### Python

```python
import requests
import websocket
import json

# Get cluster status
def get_cluster_status():
    response = requests.get('http://localhost:8080/api/metrics?endpoint=cluster')
    return response.json()

# Start failure scenario
def start_failure_scenario(scenario_id, target_nodes):
    data = {
        'action': 'start_scenario',
        'scenarioId': scenario_id,
        'targetNodes': target_nodes
    }
    response = requests.post('http://localhost:8080/api/metrics', json=data)
    return response.json()

# WebSocket connection
def on_message(ws, message):
    data = json.loads(message)
    print(f"Received: {data}")

ws = websocket.WebSocketApp('ws://localhost:3000')
ws.on_message = on_message
ws.run_forever()
```

### curl

```bash
# Get cluster status
curl http://localhost:8080/api/metrics?endpoint=cluster

# Start failure scenario
curl -X POST http://localhost:8080/api/metrics \
  -H "Content-Type: application/json" \
  -d '{"action": "start_scenario", "scenarioId": "node-cascade"}'

# Submit transactions
curl -X POST http://localhost:8080/transactions \
  -H "Content-Type: application/json" \
  -d '{"transactions": [{"id": "tx_001", "from": "0x...", "to": "0x...", "amount": "1000"}]}'
```