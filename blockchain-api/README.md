# KALDRIX Blockchain API

A comprehensive REST and WebSocket API layer for the KALDRIX blockchain, providing secure and scalable access to blockchain operations including DAG management, quantum-resistant cryptography, and PBFT consensus mechanisms.

## 🚀 Features

### Core Features
- **REST API**: Full RESTful API for blockchain operations
- **WebSocket API**: Real-time event streaming and updates
- **Authentication**: JWT and API key-based authentication
- **Security**: Rate limiting, CORS, CSRF protection, input validation
- **Documentation**: OpenAPI 3.0 and WebSocket schema documentation
- **Type Safety**: 100% TypeScript coverage with strict typing

### Blockchain Operations
- **DAG Management**: Query DAG state, nodes, tips, and history
- **Transactions**: Submit, validate, and track transactions
- **Wallet Management**: Create, import, and manage wallets
- **Consensus**: Monitor consensus status, validators, and proposals
- **Quantum Security**: Quantum-resistant cryptographic operations

### Real-time Features
- **Live Updates**: Real-time transaction and block notifications
- **Event Streaming**: Subscribe to blockchain events
- **Room Management**: Targeted updates for specific resources
- **Connection Management**: Robust connection handling and health checks

## 📋 Requirements

- Node.js >= 18.0.0
- npm >= 8.0.0
- TypeScript >= 5.0.0

## 🛠️ Installation

### Clone the Repository
```bash
git clone https://github.com/kaldrix/kaldrix-blockchain-api.git
cd kaldrix-blockchain-api
```

### Install Dependencies
```bash
npm install
```

### Environment Configuration
Create a `.env` file in the root directory:
```env
# Server Configuration
API_PORT=3001
API_HOST=0.0.0.0

# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=1m

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
CORS_CREDENTIALS=true

# Blockchain Core (if running locally)
BLOCKCHAIN_CORE_URL=http://localhost:3002
```

## 🚀 Usage

### Development Mode
```bash
npm run dev
```

The API server will start at `http://localhost:3001`

### Production Mode
```bash
npm run build
npm start
```

### API Documentation
- **Swagger UI**: `http://localhost:3001/docs`
- **OpenAPI Spec**: `/docs/openapi.yaml`
- **WebSocket Schema**: `/docs/websocket-schema.md`

## 📚 API Documentation

### REST API Endpoints

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - User logout
- `POST /auth/api-keys` - Generate API key
- `GET /auth/api-keys` - List API keys
- `DELETE /auth/api-keys/:keyName` - Revoke API key

#### Blockchain Operations
- `GET /api/v1/blockchain/dag` - Get DAG state
- `GET /api/v1/blockchain/dag/nodes/:nodeId` - Get specific node
- `GET /api/v1/blockchain/dag/tips` - Get DAG tips
- `GET /api/v1/blockchain/status` - Get blockchain status
- `GET /api/v1/blockchain/network` - Get network info
- `GET /api/v1/blockchain/quantum-security` - Get quantum security status

#### Transactions
- `POST /api/v1/transactions/submit` - Submit transaction
- `GET /api/v1/transactions/:transactionId` - Get transaction
- `GET /api/v1/transactions/` - Get transactions
- `POST /api/v1/transactions/validate` - Validate transaction
- `GET /api/v1/transactions/address/:address` - Get address history
- `GET /api/v1/transactions/pending` - Get pending transactions
- `GET /api/v1/transactions/fees` - Get transaction fees

#### Wallet Management
- `POST /api/v1/wallet/create` - Create wallet
- `POST /api/v1/wallet/import` - Import wallet
- `GET /api/v1/wallet/:walletId` - Get wallet
- `PUT /api/v1/wallet/:walletId` - Update wallet
- `GET /api/v1/wallet/:walletId/balance` - Get wallet balance
- `POST /api/v1/wallet/:walletId/sign` - Sign transaction
- `POST /api/v1/wallet/:walletId/export` - Export wallet
- `GET /api/v1/wallet/` - List wallets
- `DELETE /api/v1/wallet/:walletId` - Delete wallet

#### Consensus
- `GET /api/v1/consensus/status` - Get consensus status
- `GET /api/v1/consensus/validators` - Get validators
- `GET /api/v1/consensus/validators/:validatorId` - Get validator
- `GET /api/v1/consensus/metrics` - Get consensus metrics
- `GET /api/v1/consensus/proposals` - Get proposals
- `POST /api/v1/consensus/vote` - Submit vote
- `GET /api/v1/consensus/history` - Get consensus history
- `GET /api/v1/consensus/forks` - Get fork information
- `GET /api/v1/consensus/rewards` - Get validator rewards

### WebSocket Events

#### Connection Events
- `connect` - Connection established
- `disconnect` - Connection closed
- `welcome` - Welcome message with supported events

#### Authentication
- `authenticate` - Authenticate with JWT token
- `authenticated` - Authentication response

#### Subscriptions
- `subscribe` - Subscribe to event types
- `unsubscribe` - Unsubscribe from event types
- `get_subscriptions` - Get active subscriptions
- `subscribed` - Subscription confirmation
- `unsubscribed` - Unsubscription confirmation

#### Real-time Updates
- `transaction:new` - New transaction created
- `block:new` - New block created
- `consensus:event` - Consensus event
- `dag:update` - DAG structure update
- `validator:event` - Validator event
- `status:update` - Status update

#### Data Requests
- `request_data` - Request specific data
- `data_response` - Data response
- `submit_transaction` - Submit transaction via WebSocket
- `transaction_submitted` - Transaction submission response
- `get_status` - Get blockchain status
- `status` - Status response

#### Room Management
- `join_room` - Join a room
- `leave_room` - Leave a room
- `get_rooms` - Get room memberships
- `joined_room` - Room join confirmation
- `left_room` - Room leave confirmation

#### Health Checks
- `ping` - Connection health check
- `pong` - Health check response

#### Error Handling
- `error` - Error event

## 🔒 Security

### Authentication
- **JWT Tokens**: Stateless authentication with configurable expiration
- **API Keys**: Alternative authentication method for automated systems
- **Role-based Access**: Permission-based access control
- **Token Refresh**: Secure token refresh mechanism

### Security Features
- **Rate Limiting**: Configurable rate limits per endpoint
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers for protection against common vulnerabilities
- **Input Validation**: Comprehensive input validation and sanitization
- **HTTPS**: SSL/TLS encryption for all communications

### Best Practices
1. Always use HTTPS/WSS in production
2. Implement proper key rotation for JWT secrets
3. Use strong password policies for user accounts
4. Monitor and audit API access logs
5. Implement proper error handling to avoid information leakage

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
└── fixtures/      # Test fixtures and mocks
```

### Test Coverage
- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **WebSocket Tests**: Real-time event testing
- **Security Tests**: Authentication and authorization testing
- **Performance Tests**: Load and stress testing

## 📊 Monitoring

### Logging
- **Structured Logging**: JSON-formatted logs for easy parsing
- **Log Levels**: Debug, info, warn, error levels
- **Request Logging**: Detailed request/response logging
- **Error Tracking**: Comprehensive error tracking and reporting

### Metrics
- **Performance Metrics**: Response times, throughput, error rates
- **Blockchain Metrics**: Transaction rates, block times, consensus metrics
- **Connection Metrics**: WebSocket connections, subscriptions, room usage
- **Security Metrics**: Authentication attempts, rate limiting events

### Health Checks
- **Server Health**: Application health and resource usage
- **Blockchain Health**: Blockchain connectivity and status
- **Database Health**: Database connectivity and performance
- **Network Health**: Network connectivity and latency

## 🚀 Deployment

### Docker Deployment
```bash
# Build Docker image
docker build -t kaldrix-blockchain-api .

# Run container
docker run -p 3001:3001 kaldrix-blockchain-api
```

### Environment Variables
```env
# Production Configuration
NODE_ENV=production
API_PORT=3001
API_HOST=0.0.0.0
JWT_SECRET=your-production-jwt-secret
CORS_ORIGIN=https://yourdomain.com
BLOCKCHAIN_CORE_URL=https://blockchain.yourdomain.com
```

### Scaling Considerations
- **Horizontal Scaling**: Load balancer with multiple API instances
- **Database Scaling**: Read replicas for query performance
- **Caching**: Redis for session management and rate limiting
- **Monitoring**: Comprehensive monitoring and alerting

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Style
- Use TypeScript with strict type checking
- Follow ESLint configuration
- Write comprehensive tests
- Update documentation for new features
- Use conventional commit messages

### Pull Request Process
1. Ensure all tests pass
2. Update documentation if necessary
3. Add test coverage for new features
4. Request code review from maintainers
5. Address review feedback
6. Merge after approval

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- KALDRIX Core Team for the blockchain implementation
- Open source community for the tools and libraries used
- Contributors who have helped improve this project

## 📞 Support

- **Documentation**: [API Documentation](docs/)
- **Issues**: [GitHub Issues](https://github.com/kaldrix/kaldrix-blockchain-api/issues)
- **Discussions**: [GitHub Discussions](https://github.com/kaldrix/kaldrix-blockchain-api/discussions)
- **Email**: api@kaldrix.io

## 🔗 Related Projects

- [KALDRIX Blockchain Core](https://github.com/kaldrix/kaldrix-blockchain-core)
- [KALDRIX Web Wallet](https://github.com/kaldrix/kaldrix-web-wallet)
- [KALDRIX Explorer](https://github.com/kaldrix/kaldrix-explorer)

---

Built with ❤️ by the KALDRIX Team