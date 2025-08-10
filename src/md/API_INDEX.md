# DeFi Data API - Quick Reference Index

## 🚀 Quick Start

**Base URL**: `http://localhost:3000`  
**Documentation**: [http://localhost:3000/docs](http://localhost:3000/docs)  
**OpenAPI Spec**: [http://localhost:3000/api-docs/swagger.json](http://localhost:3000/api-docs/swagger.json)

## 📋 API Endpoint Index

### 🏠 System Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API status and documentation links |  
| `GET` | `/docs` | Interactive Scalar API documentation |
| `GET` | `/api-docs/swagger.json` | OpenAPI 3.0 specification |

### 💰 Bifrost Protocol - Yields
| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| `GET` | `/api/v1/bifrost/yields` | List all token yields | `minApy`, `sortBy`, `limit` |
| `GET` | `/api/v1/bifrost/yields/{symbol}` | Get yield for specific token | - |

### 🔄 Bifrost Protocol - Exchange Rates  
| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| `GET` | `/api/v1/bifrost/exchange-rates/{token}` | Get vToken exchange rate | `includeHistory`, `historyDays`, `includeVolatility`, `source` |
| `GET` | `/api/v1/bifrost/convert` | Convert token amounts | `amount`*, `from`*, `to`*, `network`, `slippage`, `includesFees` |
| `GET` | `/api/v1/bifrost/supported-tokens` | List supported tokens | - |

### 🪙 Bifrost Protocol - vTokens (Extended)
| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| `GET` | `/api/v1/bifrost/vtokens` | List all vTokens with metadata | `page`, `limit`, `network`, `minApy`, `maxApy`, `minTvl`, `sortBy`, `sortOrder`, `status`, `riskLevel` |
| `GET` | `/api/v1/bifrost/vtokens/{symbol}` | Detailed vToken information | - |

### 🏛️ Legacy Stablecoin Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/stablecoins/*` | Legacy stablecoin data endpoints |

*Required parameters

## 🔗 Quick Navigation

### 📖 Documentation Files
- **[PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)** - Complete project documentation
- **[README-swagger.md](./README-swagger.md)** - Swagger integration documentation  
- **[API_INDEX.md](./API_INDEX.md)** - This quick reference (current file)

### 🏗️ Key Source Files
- **[src/app.ts](./src/app.ts)** - Express application configuration
- **[src/server.ts](./src/server.ts)** - Server startup and lifecycle
- **[src/routes/v1/bifrost.ts](./src/routes/v1/bifrost.ts)** - Main Bifrost protocol routes
- **[src/controllers/bifrostController.ts](./src/controllers/bifrostController.ts)** - Bifrost API controller
- **[src/config/swagger.config.ts](./src/config/swagger.config.ts)** - OpenAPI specification

### ⚙️ Configuration Files
- **[package.json](./package.json)** - Dependencies and scripts
- **[tsconfig.json](./tsconfig.json)** - TypeScript configuration
- **[nodemon.json](./nodemon.json)** - Development server configuration

## 📊 Supported Tokens

**Bifrost Protocol vTokens**:
```
vDOT, vKSM, vBNC, vASTR, vMANTA, vETH, vETH2, vFIL, vPHA, vMOVR, vGLMR
```

**Token Conversion Pairs**:
- vToken ↔ Base Token (e.g., vDOT ↔ DOT)
- Supported Networks: `bifrost`, `moonbeam`, `astar`, `hydration`, `polkadx`, `moonriver`

## 🛠️ Development Commands

```bash
# Start development server
pnpm run dev

# Build for production  
pnpm run build

# Start production server
pnpm start

# Generate documentation
pnpm run docs:generate
```

## 📋 Common Query Examples

### Get High-Yield Tokens
```http
GET /api/v1/bifrost/yields?minApy=15&sortBy=apy&limit=10
```

### Get vDOT Yield Data
```http
GET /api/v1/bifrost/yields/vDOT
```

### Get vKSM Exchange Rate
```http
GET /api/v1/bifrost/exchange-rates/vKSM
```

### Convert vKSM to KSM
```http
GET /api/v1/bifrost/convert?amount=100&from=vKSM&to=KSM&slippage=0.5
```

### List All vTokens (Paginated)
```http
GET /api/v1/bifrost/vtokens?page=1&limit=20&sortBy=tvl&sortOrder=desc
```

### Get Detailed vDOT Information
```http
GET /api/v1/bifrost/vtokens/vDOT
```

## 🔒 Security Notes

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Multi-layer validation for all parameters  
- **CORS**: Configured for development environments
- **Security Headers**: Helmet middleware with CSP
- **Error Sanitization**: No sensitive data in error responses

## 📞 Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response payload */ },
  "pagination": { /* if applicable */ },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "code": 1001,
  "msg": "Error description",
  "data": {
    "message": "Detailed error message",
    "path": "/api/v1/endpoint",
    "method": "GET",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🚦 HTTP Status Codes

- **200** - Success
- **400** - Bad Request (validation errors)
- **404** - Not Found (token/resource not found)  
- **429** - Too Many Requests (rate limit exceeded)
- **500** - Internal Server Error

---

**Last Updated**: 2024-01-01  
**API Version**: v1.0.0  
**Documentation Version**: 1.0.0