# DeFi Data API - Project Documentation

## Table of Contents
- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Setup & Development](#setup--development)
- [Security Features](#security-features)
- [API Reference](#api-reference)

## Project Overview

**DeFi Data API** is a comprehensive Node.js/TypeScript REST API that provides unified access to Bifrost protocol data, including:

- **Yield Farming Data**: Real-time APY information for liquid staking tokens
- **Exchange Rates**: vToken to base token conversion rates  
- **Token Conversions**: Secure token amount conversions with slippage protection
- **Protocol Analytics**: TVL, validator data, and ecosystem metrics

### Key Features
- ✅ **TypeScript**: Full type safety with comprehensive interfaces
- ✅ **OpenAPI/Swagger**: Interactive API documentation with Scalar UI
- ✅ **Security**: Helmet, CORS, rate limiting, input validation
- ✅ **Performance**: Compression, caching, efficient data transformation
- ✅ **Monitoring**: Structured logging with Morgan and custom logger
- ✅ **Developer Experience**: Hot reload, comprehensive error handling

## Architecture

### Tech Stack
- **Runtime**: Node.js with TypeScript
- **Web Framework**: Express.js with security middleware
- **Documentation**: OpenAPI 3.0 with Swagger UI and Scalar
- **Data Sources**: Bifrost protocol APIs
- **Development**: Nodemon, ESLint, Prettier

### Design Patterns
- **MVC Architecture**: Controllers, Services, and Route separation
- **Middleware Chain**: Security, validation, error handling
- **Unified Response Format**: Standardized API responses
- **Service Layer**: Business logic abstraction

## API Endpoints

### Core Bifrost Protocol Endpoints

#### Yields Management
```http
GET /api/v1/bifrost/yields
GET /api/v1/bifrost/yields/{symbol}
```

#### Exchange Rates & Conversions  
```http
GET /api/v1/bifrost/exchange-rates/{token}
GET /api/v1/bifrost/convert
GET /api/v1/bifrost/supported-tokens
```

#### Extended vToken Management
```http
GET /api/v1/bifrost/vtokens
GET /api/v1/bifrost/vtokens/{symbol}
```

#### Legacy Stablecoin Endpoints
```http
GET /api/v1/stablecoins/*
```

### Documentation Endpoints
```http
GET /docs                    # Scalar API documentation
GET /api-docs/swagger.json   # OpenAPI spec export
GET /                        # API status and documentation links
```

## Project Structure

```
defi-data-api/
├── src/
│   ├── app.ts                    # Express app configuration
│   ├── server.ts                 # Server startup and lifecycle
│   ├── config/
│   │   ├── index.ts              # Environment configuration
│   │   └── swagger.config.ts     # OpenAPI specification
│   ├── controllers/
│   │   ├── bifrostController.ts  # Main Bifrost protocol controller
│   │   └── stablecoinController.ts # Legacy stablecoin controller
│   ├── routes/
│   │   └── v1/
│   │       ├── index.ts          # Route aggregation
│   │       ├── bifrost.ts        # Bifrost protocol routes
│   │       └── stablecoin.ts     # Legacy stablecoin routes
│   ├── services/
│   │   ├── bifrostService.ts     # Bifrost API integration
│   │   └── stablecoinService.ts  # Legacy stablecoin service
│   ├── middleware/
│   │   ├── errorHandler.ts       # Centralized error handling
│   │   ├── rateLimiter.ts        # API rate limiting
│   │   ├── requestValidator.ts   # Input validation
│   │   └── securityHeaders.ts    # Security headers
│   ├── types/
│   │   ├── index.ts              # Main type exports
│   │   ├── common.ts             # Shared interfaces
│   │   └── *.ts                  # Domain-specific types
│   └── utils/
│       ├── logger.ts             # Structured logging
│       └── inputValidator.ts     # Validation utilities
├── dist/                         # Compiled TypeScript output
├── scripts/
│   └── generate-docs.ts          # Documentation generation
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── nodemon.json                  # Development server config
└── README-swagger.md             # Swagger integration docs
```

## Setup & Development

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation & Running
```bash
# Install dependencies
pnpm install

# Development server (hot reload)
pnpm run dev

# Production build
pnpm run build
pnpm start

# Generate documentation
pnpm run docs:generate
```

### Environment Configuration
```bash
# .env file
NODE_ENV=development
PORT=3000
API_BASE_URL=https://bifrost-api.endpoint.com
```

### Development URLs
- **API Server**: http://localhost:3000
- **API Documentation**: http://localhost:3000/docs
- **OpenAPI Spec**: http://localhost:3000/api-docs/swagger.json

## Security Features

### Input Validation & Sanitization
- **Multi-layer Validation**: Parameter presence, type, format, and range checks
- **Sanitization**: Special character removal and length limits
- **Token Validation**: Alphanumeric-only symbols with support list verification
- **Rate Limiting**: API abuse prevention

### Security Headers & Middleware
- **Helmet**: Security headers (CSP, HSTS, X-Frame-Options)
- **CORS**: Cross-origin request management
- **Compression**: Response compression with security considerations
- **Error Handling**: Sanitized error responses without sensitive data

### API Security
- **11-Layer Token Pair Validation**: Comprehensive conversion security
- **Bounds Checking**: Numeric parameter limits (APY 0-1000%, limit 1-100)
- **Input Normalization**: Smart case handling and format standardization
- **Structured Logging**: Security event monitoring without sensitive data

## API Reference

### Standard Response Format

All API endpoints return responses in this standardized format:

```typescript
{
  success: boolean;
  data: T;                    // Response payload
  pagination?: {              // For paginated endpoints
    page: number;
    limit: number; 
    total: number;
  };
  timestamp: string;          // ISO 8601 timestamp
}
```

### Error Response Format

```typescript
{
  success: false;
  code: number;               // Internal error code
  msg: string;                // Error message
  data: {
    message: string;
    path: string;             // Request path
    method: string;           // HTTP method
    timestamp: string;
  };
}
```

### Core Data Types

#### TokenYield
```typescript
{
  symbol: string;             // Token symbol (e.g., "vDOT")
  protocol: string;           // Protocol name ("bifrost")
  apy: number;                // Annual Percentage Yield
  tvl: number;                // Total Value Locked (USD)
  apyBreakdown: {
    base: number;
    reward: number;
    mev: number;
    gas: number;
  };
  updatedAt: string;          // Last update timestamp
}
```

#### ExchangeRate
```typescript
{
  baseToken: {
    symbol: string;           // Base token (e.g., "KSM")
    network: string;
  };
  vToken: {
    symbol: string;           // vToken (e.g., "vKSM")
    network: string;
  };
  rate: number;               // vToken to base token rate
  inverseRate: number;        // Base token to vToken rate
  timestamp: string;
  source: string;             // Data source
  confidence: number;         // Confidence score (0-100)
}
```

### Query Parameters

#### Yields Endpoints
- **minApy**: `number` - Minimum APY filter (0-1000)
- **sortBy**: `"apy" | "tvl"` - Sort criteria  
- **limit**: `number` - Result limit (1-100)

#### Exchange Rate Endpoints
- **includeHistory**: `"true" | "false"` - Include historical data
- **historyDays**: `string` - Historical period (1-365 days)
- **includeVolatility**: `"true" | "false"` - Include volatility metrics
- **source**: `"runtime" | "frontend" | "auto"` - Data source preference

#### Conversion Endpoints
- **amount**: `string` - Amount to convert (required)
- **from**: `string` - Source token symbol (required)
- **to**: `string` - Target token symbol (required)
- **network**: `string` - Target network (default: "bifrost")
- **slippage**: `string` - Slippage tolerance 0-100% (optional)
- **includesFees**: `"true" | "false"` - Include fee breakdown

### Supported Tokens

Current Bifrost protocol supported tokens:
```
vDOT, vKSM, vBNC, vASTR, vMANTA, vETH, vETH2, vFIL, vPHA, vMOVR, vGLMR
```

### Rate Limits
- **Default**: 100 requests per 15 minutes per IP
- **Burst**: 10 requests per second per IP

### HTTP Status Codes
- **200**: Success
- **400**: Bad Request (validation errors)
- **404**: Not Found (token/resource not found)
- **429**: Too Many Requests (rate limit exceeded)
- **500**: Internal Server Error

---

## Contributing

1. Follow TypeScript best practices
2. Add comprehensive input validation
3. Update OpenAPI documentation for new endpoints
4. Include error handling and logging
5. Add appropriate tests
6. Follow existing code patterns and conventions

## License

MIT License - See package.json for details