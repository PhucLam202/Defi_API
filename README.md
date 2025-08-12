# DeFi Data API

> **Unified Bifrost Protocol API** - Comprehensive TypeScript REST API for DeFi yield farming data, vToken exchange rates, and token conversions.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue.svg)](https://typescript.org)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![Express.js](https://img.shields.io/badge/Express.js-4.18+-lightgrey.svg)](https://expressjs.com)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0-brightgreen.svg)](https://swagger.io/specification/)

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Visit API documentation
open http://localhost:3000/docs
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| **[API_INDEX.md](./API_INDEX.md)** | 📋 Quick reference and endpoint index |
| **[PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)** | 📚 Complete project documentation |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | 🏗️ System architecture and design patterns |
| **[README-swagger.md](./README-swagger.md)** | 📄 Swagger integration documentation |

## 🌟 Features

### 🔗 Unified Bifrost Protocol API
- **Yield Farming Data**: Real-time APY for 11+ liquid staking tokens
- **Exchange Rates**: vToken ↔ base token conversion rates
- **Token Conversions**: Secure amount conversions with slippage protection
- **Protocol Analytics**: TVL, validator data, ecosystem metrics

### 🛡️ Enterprise Security
- **Multi-layer Validation**: 11-layer token pair security
- **Rate Limiting**: 100 requests/15min per IP  
- **Security Headers**: Helmet + CSP + CORS
- **Input Sanitization**: XSS/injection prevention

### 📊 Developer Experience
- **OpenAPI 3.0**: Interactive Scalar documentation
- **TypeScript**: Full type safety with comprehensive interfaces
- **Hot Reload**: Instant development feedback
- **Structured Logging**: Comprehensive request/error tracking

## 🔧 API Endpoints

### Core Bifrost Protocol

```http
# Yields Management
GET /api/v1/bifrost/yields              # List all token yields
GET /api/v1/bifrost/yields/{symbol}     # Get specific token yield

# Exchange Rates & Conversions
GET /api/v1/bifrost/exchange-rates/{token}  # Get vToken exchange rate
GET /api/v1/bifrost/convert                 # Convert token amounts
GET /api/v1/bifrost/supported-tokens       # List supported tokens

# Extended vToken Management  
GET /api/v1/bifrost/vtokens                 # List all vTokens with metadata
GET /api/v1/bifrost/vtokens/{symbol}        # Detailed vToken information
```

### Documentation & Health
```http
GET /                                   # API status and links
GET /docs                              # Interactive API documentation
GET /api-docs/swagger.json             # OpenAPI specification
```

## 💡 Example Usage

### Get High-Yield Tokens
```bash
curl "http://localhost:3000/api/v1/bifrost/yields?minApy=15&sortBy=apy&limit=5"
```

### Convert vKSM to KSM
```bash
curl "http://localhost:3000/api/v1/bifrost/convert?amount=100&from=vKSM&to=KSM&slippage=0.5"
```

### Get vDOT Details
```bash
curl "http://localhost:3000/api/v1/bifrost/vtokens/vDOT"
```

## 🏗️ Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Clients   │◄──►│ Express API │◄──►│External APIs│
│             │    │             │    │             │
│• Web Apps   │    │• Security   │    │• Bifrost    │
│• Mobile     │    │• Validation │    │• Chain Data │
│• Third Party│    │• Transform  │    │• Price Feed │
└─────────────┘    └─────────────┘    └─────────────┘
```

**Tech Stack**: Node.js + TypeScript + Express.js + OpenAPI 3.0

## 🚦 Supported Tokens

**Bifrost Protocol vTokens**:
```
vDOT, vKSM, vBNC, vASTR, vMANTA, vETH, vETH2, vFIL, vPHA, vMOVR, vGLMR
```

**Supported Networks**: `bifrost`, `moonbeam`, `astar`, `hydration`, `polkadx`, `moonriver`

## 📋 Response Format

### Success Response
```json
{
  \"success\": true,
  \"data\": {
    \"symbol\": \"vDOT\",
    \"protocol\": \"bifrost\",
    \"apy\": 15.42,
    \"tvl\": 1000000
  },
  \"timestamp\": \"2024-01-01T00:00:00.000Z\"
}
```

### Error Response
```json
{
  \"success\": false,
  \"code\": 1001,
  \"msg\": \"Token not found\",
  \"data\": {
    \"message\": \"Token INVALID is not supported\",
    \"path\": \"/api/v1/bifrost/yields/INVALID\",
    \"method\": \"GET\",
    \"timestamp\": \"2024-01-01T00:00:00.000Z\"
  }
}
```

## 🛠️ Development

### Prerequisites
- **Node.js** 18+ 
- **pnpm** (recommended) or npm
- **TypeScript** 5.2+

### Commands
```bash
# Development
pnpm run dev                    # Start dev server with hot reload
pnpm run build                  # Build for production
pnpm start                      # Start production server

# Documentation
pnpm run docs:generate          # Generate API documentation
pnpm run docs:serve             # Serve documentation

# Maintenance  
pnpm run memory:update          # Update project memory
```

### Environment Variables
```bash
# .env
NODE_ENV=development
PORT=3000
API_BASE_URL=https://bifrost-api.endpoint.com
```

## 🔒 Security Features

- **✅ Input Validation**: Multi-layer parameter validation
- **✅ Rate Limiting**: API abuse prevention  
- **✅ CORS Protection**: Cross-origin request management
- **✅ Security Headers**: Helmet + CSP configuration
- **✅ Error Sanitization**: No sensitive data exposure
- **✅ Token Validation**: 11-layer security for conversions

## 📊 Performance

- **⚡ Response Time**: < 200ms average
- **🗜️ Compression**: Gzip response compression  
- **📈 Rate Limits**: 100 req/15min, 10 req/sec burst
- **💾 Caching**: Service-level caching with TTL
- **📝 Logging**: Structured logging with performance metrics

## 🧪 API Testing

### Using cURL
```bash
# Test API health
curl http://localhost:3000/

# Get all yields
curl http://localhost:3000/api/v1/bifrost/yields

# Test conversion
curl \"http://localhost:3000/api/v1/bifrost/convert?amount=1&from=vDOT&to=DOT\"
```

### Using Interactive Documentation
1. Start the development server: `pnpm run dev`
2. Open browser: `http://localhost:3000/docs`
3. Use \"Try it out\" buttons to test endpoints

## 📈 Monitoring

### Structured Logging
- **Request Logging**: Morgan middleware with custom format
- **Error Tracking**: Centralized error handling with stack traces
- **Performance Metrics**: Response times and memory usage
- **Security Events**: Rate limit violations and validation failures

### Health Checks
- **API Status**: `GET /` returns server status
- **Documentation**: `GET /docs` for interactive testing
- **OpenAPI Spec**: `GET /api-docs/swagger.json` for integration

## 🤝 Contributing

1. **Follow TypeScript best practices**
2. **Add comprehensive input validation**  
3. **Update OpenAPI documentation for new endpoints**
4. **Include error handling and logging**
5. **Follow existing code patterns and conventions**

### Code Structure
```
src/
├── app.ts              # Express app configuration
├── server.ts           # Server startup
├── routes/v1/          # API route definitions
├── controllers/        # Request handlers
├── services/           # Business logic & external APIs
├── middleware/         # Security & validation
├── types/              # TypeScript interfaces
└── utils/              # Utilities & helpers
```

## 📜 License

**MIT License** - See [package.json](./package.json) for details

## 🔗 Links

- **Interactive API Docs**: [http://localhost:3000/docs](http://localhost:3000/docs)
- **OpenAPI Specification**: [http://localhost:3000/api-docs/swagger.json](http://localhost:3000/api-docs/swagger.json)
- **GitHub Repository**: [Your Repository URL]
- **Bifrost Protocol**: [https://bifrost.finance](https://bifrost.finance)

---

**Built with ❤️ for the DeFi ecosystem**