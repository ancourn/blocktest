# KALDRIX Blockchain WebSocket API Schema

## Overview
This document describes the WebSocket API schema for real-time communication with the KALDRIX blockchain. The WebSocket API provides real-time updates on blockchain events, transactions, blocks, and consensus activities.

## Connection
- **URL**: `ws://localhost:3001` (development) or `wss://api.kaldrix.io` (production)
- **Protocol**: Socket.IO
- **Authentication**: JWT token required for most operations

## Event Schema

### 1. Connection Events

#### `connect`
Emitted when client successfully connects to the server.

**Client Event**: `connect`
```typescript
// No payload
```

**Server Response**: `welcome`
```typescript
{
  "message": "Connected to KALDRIX Blockchain WebSocket API",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "supported_events": [
    "authenticate",
    "subscribe",
    "unsubscribe",
    "get_subscriptions",
    "request_data",
    "submit_transaction",
    "get_status",
    "ping"
  ]
}
```

#### `disconnect`
Emitted when client disconnects from the server.

**Client Event**: `disconnect`
```typescript
{
  "reason": "client namespace disconnect"
}
```

### 2. Authentication Events

#### `authenticate`
Authenticate the client with a JWT token.

**Client Event**: `authenticate`
```typescript
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Server Response**: `authenticated`
```typescript
{
  "success": true,
  "userId": "user_123456789",
  "permissions": ["read", "write"]
}
```

**Error Response**:
```typescript
{
  "success": false,
  "error": "Invalid token"
}
```

### 3. Subscription Events

#### `subscribe`
Subscribe to real-time updates for specific event types.

**Client Event**: `subscribe`
```typescript
{
  "type": "dag" | "transactions" | "consensus" | "blocks" | "wallet" | "validator",
  "filter?: {
    // Optional filters based on subscription type
    "address"?: "kx1q9f5j8g7h6d5s4a3z2x1c9v8b7n6m5k4j3i2h1g",
    "validatorId"?: "validator_123",
    "walletId"?: "wallet_456"
  }
}
```

**Server Response**: `subscribed`
```typescript
{
  "type": "dag",
  "success": true
}
```

**Initial Data Response** (based on subscription type):

**DAG Initial Data**: `dag:init`
```typescript
{
  "nodes": [
    {
      "id": "block_123",
      "transactions": ["tx_456", "tx_789"],
      "timestamp": "2024-01-15T10:30:00Z",
      "validator": "kx1v1l2i3d4a5t6o7r8a9d0d1r2e3s4s5i6g7n8a9t0u",
      "signature": "0x123abc...",
      "parents": ["block_122"],
      "height": 12345
    }
  ],
  "total": 1,
  "tips": ["tx_789"],
  "metrics": {
    "totalNodes": 12345,
    "totalTransactions": 98765,
    "confirmationTime": 2.5,
    "throughput": 1500
  }
}
```

**Transactions Initial Data**: `transactions:init`
```typescript
{
  "transactions": [
    {
      "id": "tx_789",
      "sender": "kx1q9f5j8g7h6d5s4a3z2x1c9v8b7n6m5k4j3i2h1g",
      "receiver": "kx1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t",
      "amount": 100.5,
      "timestamp": "2024-01-15T10:30:00Z",
      "signature": "0x123abc...",
      "parents": ["tx_456"],
      "status": "pending",
      "fee": 0.001
    }
  ],
  "count": 1,
  "totalFees": 0.001,
  "oldestTransaction": "2024-01-15T10:30:00Z"
}
```

**Consensus Initial Data**: `consensus:init`
```typescript
{
  "algorithm": "PBFT",
  "status": "active",
  "round": 123,
  "phase": "commit",
  "validators": {
    "total": 21,
    "active": 20,
    "required": 15
  },
  "lastBlock": "block_123",
  "timestamp": "2024-01-15T10:30:00Z",
  "metrics": {
    "blockTime": 2.5,
    "finalityTime": 5.0,
    "throughput": 1500,
    "successRate": 99.9
  }
}
```

#### `unsubscribe`
Unsubscribe from specific event types.

**Client Event**: `unsubscribe`
```typescript
{
  "type": "dag" | "transactions" | "consensus" | "blocks" | "wallet" | "validator"
}
```

**Server Response**: `unsubscribed`
```typescript
{
  "type": "dag",
  "success": true
}
```

#### `get_subscriptions`
Get current active subscriptions.

**Client Event**: `get_subscriptions`
```typescript
// No payload
```

**Server Response**: `subscriptions`
```typescript
{
  "subscriptions": ["dag", "transactions", "consensus"]
}
```

### 4. Real-time Update Events

#### `transaction:new`
Emitted when a new transaction is created.

**Server Event**: `transaction:new`
```typescript
{
  "id": "tx_789",
  "sender": "kx1q9f5j8g7h6d5s4a3z2x1c9v8b7n6m5k4j3i2h1g",
  "receiver": "kx1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t",
  "amount": 100.5,
  "timestamp": "2024-01-15T10:30:00Z",
  "signature": "0x123abc...",
  "parents": ["tx_456"],
  "status": "pending",
  "fee": 0.001,
  "data": {}
}
```

#### `block:new`
Emitted when a new block is created.

**Server Event**: `block:new`
```typescript
{
  "id": "block_123",
  "transactions": ["tx_456", "tx_789"],
  "timestamp": "2024-01-15T10:30:00Z",
  "validator": "kx1v1l2i3d4a5t6o7r8a9d0d1r2e3s4s5i6g7n8a9t0u",
  "signature": "0x123abc...",
  "parents": ["block_122"],
  "height": 12345,
  "hash": "0x123abc456def789ghi012jkl345mno678pqr901stu",
  "merkleRoot": "0x123abc456def789ghi012jkl345mno678pqr901stu",
  "nonce": 42
}
```

#### `consensus:event`
Emitted when consensus-related events occur.

**Server Event**: `consensus:event`
```typescript
{
  "type": "round_complete" | "phase_change" | "validator_elected" | "fork_detected",
  "round": 123,
  "phase": "commit" | "prepare" | "pre-prepare",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    // Event-specific data
    "validatorId": "validator_123",
    "blockId": "block_123",
    "votes": {
      "approve": 15,
      "reject": 0,
      "abstain": 5
    }
  }
}
```

#### `dag:update`
Emitted when DAG structure changes.

**Server Event**: `dag:update`
```typescript
{
  "type": "block" | "transaction",
  "data": {
    // Block or transaction data
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### `validator:event`
Emitted when validator-related events occur.

**Server Event**: `validator:event`
```typescript
{
  "type": "elected" | "slashed" | "rewarded" | "status_change",
  "validatorId": "validator_123",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "amount": 100.0,
    "reason": "block_production",
    "newStatus": "active"
  }
}
```

#### `status:update`
Emitted periodically with blockchain status updates.

**Server Event**: `status:update`
```typescript
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "metrics": {
    "totalNodes": 12345,
    "totalTransactions": 98765,
    "confirmedTransactions": 98700,
    "pendingTransactions": 65,
    "networkThroughput": 1500,
    "averageConfirmationTime": 2.5,
    "activeValidators": 20,
    "quantumSecurity": true
  },
  "version": "1.0.0"
}
```

### 5. Data Request Events

#### `request_data`
Request specific data from the blockchain.

**Client Event**: `request_data`
```typescript
{
  "type": "dag" | "transaction" | "transactions" | "consensus" | "validators" | "wallet",
  "params": {
    "limit": 10,
    "offset": 0,
    "filters": {},
    "transactionId": "tx_123",
    "walletId": "wallet_456",
    "detailed": true,
    "active": true
  }
}
```

**Server Response**: `data_response`
```typescript
{
  "type": "dag",
  "data": {
    // Requested data based on type
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 6. Transaction Events

#### `submit_transaction`
Submit a transaction via WebSocket.

**Client Event**: `submit_transaction`
```typescript
{
  "sender": "kx1q9f5j8g7h6d5s4a3z2x1c9v8b7n6m5k4j3i2h1g",
  "receiver": "kx1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t",
  "amount": 100.5,
  "data": {},
  "privateKey": "0x123abc..." // Optional
}
```

**Server Response**: `transaction_submitted`
```typescript
{
  "success": true,
  "transactionId": "tx_789",
  "status": "pending",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 7. Status Events

#### `get_status`
Request current blockchain status.

**Client Event**: `get_status`
```typescript
// No payload
```

**Server Response**: `status`
```typescript
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "metrics": {
    "totalNodes": 12345,
    "totalTransactions": 98765,
    "confirmedTransactions": 98700,
    "pendingTransactions": 65,
    "networkThroughput": 1500,
    "averageConfirmationTime": 2.5,
    "activeValidators": 20,
    "quantumSecurity": true
  },
  "version": "1.0.0"
}
```

### 8. Health Check Events

#### `ping`
Ping the server for connection health.

**Client Event**: `ping`
```typescript
// No payload
```

**Server Response**: `pong`
```typescript
{
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 9. Room Management Events

#### `join_room`
Join a specific room for targeted updates.

**Client Event**: `join_room`
```typescript
{
  "room": "validators" | "transactions" | "blocks" | "custom_room_name"
}
```

**Server Response**: `joined_room`
```typescript
{
  "room": "validators",
  "success": true
}
```

#### `leave_room`
Leave a specific room.

**Client Event**: `leave_room`
```typescript
{
  "room": "validators"
}
```

**Server Response**: `left_room`
```typescript
{
  "room": "validators",
  "success": true
}
```

#### `get_rooms`
Get current room memberships.

**Client Event**: `get_rooms`
```typescript
// No payload
```

**Server Response**: `rooms`
```typescript
{
  "rooms": ["validators", "transactions"]
}
```

### 10. Error Events

#### `error`
Emitted when an error occurs.

**Server Event**: `error`
```typescript
{
  "message": "Authentication required",
  "details": "Detailed error information",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Event Types Reference

### Subscription Types
- `dag`: DAG structure and node updates
- `transactions`: Transaction creation and status updates
- `consensus`: Consensus mechanism events
- `blocks`: Block creation and updates
- `wallet`: Wallet-specific updates (requires filter)
- `validator`: Validator-specific updates (requires filter)

### Consensus Event Types
- `round_complete`: Consensus round completed
- `phase_change`: Consensus phase changed
- `validator_elected`: New validator elected
- `fork_detected`: Fork detected in consensus

### Validator Event Types
- `elected`: Validator elected for consensus
- `slashed`: Validator slashed for misbehavior
- `rewarded`: Validator received rewards
- `status_change`: Validator status changed

## Error Codes

| Code | Description |
|------|-------------|
| 401 | Authentication required |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

## Rate Limiting
- WebSocket connections are limited to 100 messages per minute per client
- Subscription requests are limited to 10 per minute
- Data requests are limited to 60 per minute

## Security Considerations
1. Always use HTTPS/WSS in production
2. Validate all incoming data
3. Implement proper authentication and authorization
4. Use rate limiting to prevent abuse
5. Monitor connection health and handle disconnections gracefully
6. Implement proper error handling and logging

## Example Usage

### Basic Connection and Authentication
```javascript
const io = require('socket.io-client');

const socket = io('ws://localhost:3001');

socket.on('connect', () => {
  console.log('Connected to KALDRIX WebSocket API');
  
  // Authenticate
  socket.emit('authenticate', {
    token: 'your-jwt-token'
  });
});

socket.on('authenticated', (data) => {
  console.log('Authenticated:', data);
  
  // Subscribe to DAG updates
  socket.emit('subscribe', { type: 'dag' });
  
  // Subscribe to transaction updates
  socket.emit('subscribe', { type: 'transactions' });
});

socket.on('transaction:new', (transaction) => {
  console.log('New transaction:', transaction);
});

socket.on('block:new', (block) => {
  console.log('New block:', block);
});
```