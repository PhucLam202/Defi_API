# DeFi Data API - Project Brief

## Project Overview
**Name**: DeFi Data API  
**Type**: Backend API Service  
**Domain**: Decentralized Finance (DeFi) Data Aggregation  
**Stack**: Node.js + Express.js + TypeScript  

## Core Purpose
Provides standardized API endpoints for accessing DeFi yield data, specifically focused on Bifrost network tokens and liquid staking derivatives.

## Key Features
- **Yield Data Aggregation**: Collects and serves yield/APY data for various DeFi tokens
- **Bifrost Integration**: Primary focus on Bifrost network (vDOT, vKSM tokens)
- **RESTful API**: Clean, versioned API endpoints (v1)
- **Interactive Documentation**: Swagger UI integration for API testing
- **Security & Performance**: Rate limiting, API key auth, CORS, compression

## Architecture Highlights
- **Modular Structure**: Controllers, Services, Middleware, Types
- **Type Safety**: Full TypeScript implementation
- **API Versioning**: Structured v1 routing
- **Error Handling**: Centralized error management
- **Documentation**: Auto-generated Swagger docs

## Current API Endpoints
### Core Endpoints
- `GET /` - API information and status
- `GET /api/v1/yields` - List all token yields with filtering
- `GET /api/v1/yields/{symbol}` - Specific token yield data
- `GET /api-docs` - Interactive Swagger UI

### Query Features
- **Filtering**: `minApy`, `sortBy`, `limit` parameters
- **Validation**: Input validation and error responses
- **Pagination**: Built-in pagination support

## Technology Stack
### Backend Core
- **Runtime**: Node.js with ES modules
- **Framework**: Express.js
- **Language**: TypeScript (strict mode)
- **Package Manager**: pnpm

### Key Dependencies
- **API Documentation**: swagger-jsdoc, swagger-ui-express
- **Security**: helmet, cors, rate limiting
- **Performance**: compression, morgan logging
- **HTTP Client**: axios for external API calls

### Development Tools
- **Build**: TypeScript compiler
- **Dev Server**: nodemon with ts-node
- **Code Quality**: ESLint, Prettier
- **Documentation**: Auto-generated from JSDoc

## Current Development State
- ✅ Basic API structure implemented
- ✅ Swagger documentation integrated
- ✅ Security middleware configured
- ✅ Bifrost service integration
- 🔄 Active development on additional endpoints
- 📋 Pool entry flow planning (in .cursor/rules/)

## Business Context
- **Target Users**: DeFi developers, yield farmers, portfolio trackers
- **Use Cases**: Yield comparison, portfolio management, DeFi analytics
- **Integration**: Designed for consumption by frontend apps and other services

## Technical Goals
- **Scalability**: Modular architecture for easy expansion
- **Reliability**: Comprehensive error handling and validation
- **Developer Experience**: Interactive docs and clear API design
- **Performance**: Optimized for fast response times

## Future Roadmap Considerations
- Additional DeFi protocols integration
- Real-time data streaming
- Historical yield data tracking
- Enhanced filtering and analytics features