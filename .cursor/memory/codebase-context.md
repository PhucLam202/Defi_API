# Codebase Context - DeFi Data API

## Architecture Overview

### Project Structure
```
src/
├── app.ts              # Express app setup & middleware configuration
├── server.ts           # Server startup and configuration
├── config/
│   ├── index.ts        # Environment configuration
│   └── swagger.config.ts # OpenAPI/Swagger configuration
├── controllers/        # Request handlers and business logic
├── middleware/         # Express middleware (auth, validation, errors)
├── routes/v1/          # API route definitions (versioned)
├── services/           # External API integrations & business logic
├── types/              # TypeScript type definitions
└── utils/              # Utility functions and helpers
```

## Core Architectural Patterns

### 1. Layered Architecture
- **Controllers**: Handle HTTP requests/responses, input validation
- **Services**: Business logic, external API calls, data transformation
- **Middleware**: Cross-cutting concerns (auth, logging, error handling)
- **Types**: TypeScript interfaces for type safety

### 2. DeFi-Specific Patterns (New)
- **Multi-Source Data Integration**: Combine Staking + Site APIs for accuracy
- **Precision-Safe Calculations**: String-based amounts for financial operations
- **Exchange Rate Caching**: Separate cache with shorter TTL for volatile data
- **Token Pair Validation**: Runtime validation of supported conversion pairs

### 3. Express.js Setup (`src/app.ts`)
**Middleware Stack Order:**
1. Security headers (helmet)
2. CORS configuration
3. Compression
4. Request logging (morgan)
5. Body parsing (JSON/URL-encoded)
6. API documentation (Scalar)
7. Route handlers
8. Error handling (404 + global error handler)

**Key Configurations:**
- CSP headers for security
- Development vs production CORS
- JSON payload limit: 10mb
- Comprehensive error handling

### 4. Service Layer Pattern (`src/services/bifrostService.ts`)
**Core Features:**
- **Caching**: In-memory cache with TTL
- **Error Handling**: Custom AppError with proper HTTP codes
- **Data Transformation**: Raw API data → standardized TokenYield format
- **Timeout Handling**: 10s timeout for external calls
- **Logging**: Structured logging throughout

**Enhanced Features (Exchange Rates):**
- **Multi-Source Integration**: Staking API + Site API fallback
- **Exchange Rate Caching**: Separate cache for volatile financial data
- **Precision Calculations**: String-based arithmetic for DeFi operations
- **Token Validation**: Runtime validation of supported token pairs

**Cache Strategy:**
- General data: 'site-data' key, configurable TTL
- Exchange rates: 5-minute TTL for volatility
- Staking data: 5-minute TTL for user counts/APR updates
- Memory-based with timestamp validation

### 5. Type System (`src/types/`)
**Core Interfaces:**
- `ApiResponse<T>`: Standard response wrapper
- `ErrorResponse`: Standardized error format
- `TokenYield`: DeFi yield data structure
- `BifrostRawData`: External API response type

**Enhanced DeFi Types (`src/types/bifrost.ts`):**
- `ExchangeRate`: Bidirectional rate with confidence levels
- `TokenAmount`: Precision-safe amount representation
- `ConvertRequest/Response`: Token conversion operations
- `VTokenInfo`: Comprehensive vToken metadata
- `BifrostStakingApiResponse`: Real API response structure

**Type Safety Features:**
- Strict TypeScript configuration
- Generic response types
- Separation of external vs internal types
- Runtime type guards for financial operations
- String-based amount handling for precision

## API Design Patterns

### 1. Versioning Strategy
- **Route Structure**: `/api/v1/...`
- **Future-proofing**: Versioned directories (`routes/v1/`)
- **Backward Compatibility**: Ability to maintain multiple versions

**Current Route Namespaces:**
- `/api/v1/yields` - General DeFi yield data
- `/api/v1/stablecoins` - Stablecoin information
- `/api/v1/bifrost/*` - Bifrost-specific operations (NEW)
  - `/exchange-rate/{token}` - Get exchange rates
  - `/convert` - Convert token amounts
  - `/supported-tokens` - List supported tokens

### 2. Response Format Standardization
```typescript
// Success Response
{
  success: true,
  data: T,
  timestamp: string,
  pagination?: PaginationInfo
}

// Error Response
{
  success: false,
  error: string,
  code?: string,
  timestamp: string
}
```

### 3. Error Handling Strategy
- **Custom AppError**: Structured error creation
- **Error Codes**: Enumerated error types
- **HTTP Status Mapping**: Proper status codes
- **Centralized Handler**: Single error processing point

## Configuration Management

### Environment Configuration (`src/config/index.ts`)
- **Environment-based**: Development vs production settings
- **Type-safe**: TypeScript interfaces for config
- **Centralized**: Single configuration entry point
- **Validation**: Required environment variables checking

### Key Configuration Areas:
- **Server**: Port, host settings
- **Cache**: TTL configurations
- **External APIs**: Bifrost API URL
- **Security**: CORS, rate limiting settings

## Documentation Strategy

### 1. OpenAPI/Swagger Integration
- **Auto-generation**: From JSDoc comments
- **Interactive UI**: Scalar API reference
- **Type Integration**: Uses TypeScript types for schemas
- **Live Testing**: Try-it-out functionality

### 2. Documentation Locations:
- **`/docs`**: Scalar API reference interface
- **`/api-docs/swagger.json`**: Raw OpenAPI spec
- **JSDoc**: Inline code documentation

## Security Patterns

### 1. Security Headers (Helmet)
- **CSP**: Content Security Policy configuration
- **XSS Protection**: Cross-site scripting prevention
- **Content Type**: MIME type sniffing prevention

### 2. Input Validation
- **Request Validation**: Middleware-based validation
- **Type Checking**: TypeScript compile-time safety
- **Sanitization**: Input cleaning and validation

## Performance Optimizations

### 1. Caching Strategy
- **In-memory**: Fast access for frequently requested data
- **TTL-based**: Automatic cache invalidation
- **Configurable**: Environment-specific cache duration

### 2. Compression & Optimization
- **Gzip Compression**: Automatic response compression
- **Request Logging**: Development vs production modes
- **Timeout Management**: Prevent hanging requests

## Integration Patterns

### External API Integration (Bifrost)
- **Service Abstraction**: Dedicated service classes
- **Error Mapping**: External errors → internal error format
- **Data Transformation**: Raw data → standardized format
- **Resilience**: Timeout, retry, error handling

### Future Integration Considerations:
- **Database**: Ready for DB service layer addition
- **Authentication**: Middleware structure supports JWT/API keys
- **Rate Limiting**: Infrastructure ready for implementation

## Development Workflow

### Build & Development
- **TypeScript**: Strict compilation
- **Hot Reload**: nodemon + ts-node for development
- **ES Modules**: Modern module system
- **Package Management**: pnpm for efficiency

### Code Quality
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript Strict**: Maximum type safety

## Scalability Considerations

### Current Architecture Benefits:
- **Modular**: Easy to add new services/endpoints
- **Typed**: Compile-time error catching
- **Layered**: Clear separation of concerns
- **Cacheable**: Built-in caching infrastructure

### Future Scaling Opportunities:
- **Database Integration**: Ready for persistent storage
- **Microservices**: Service layer can be extracted
- **Horizontal Scaling**: Stateless design supports clustering
- **API Gateway**: Structured for gateway integration