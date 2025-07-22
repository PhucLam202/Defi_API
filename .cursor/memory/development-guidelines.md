# Development Guidelines - DeFi Data API

## Code Style & Standards

### TypeScript Configuration
- **Strict Mode**: Always enabled for maximum type safety
- **ES Modules**: Use `import/export` syntax (no CommonJS `require`)
- **Type Annotations**: Explicit types for function parameters and returns
- **Interface Definitions**: Prefer interfaces over types for object shapes

```typescript
// ✅ Good
interface TokenYield {
  symbol: string;
  apy: number;
  protocol: string;
}

// ✅ Good - explicit return type
async function getYields(): Promise<TokenYield[]> {
  // implementation
}

// ❌ Avoid - missing types
function processData(data) {
  return data.map(item => item.value);
}
```

### Naming Conventions
- **Files**: kebab-case (`token-service.ts`, `api-response.ts`)
- **Functions**: camelCase (`getTokenYields`, `validateInput`)
- **Classes**: PascalCase (`BifrostService`, `TokenValidator`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `CACHE_TTL`)
- **Interfaces**: PascalCase with descriptive names (`ApiResponse<T>`, `ErrorResponse`)

### File Organization Patterns

#### Service Files
```typescript
// Standard service structure
import { dependencies } from './path';
import { Types } from '../types';

class ServiceName {
  private readonly property: Type;
  private cache: Map<string, CacheItem> = new Map();

  constructor() {
    // initialization
  }

  async publicMethod(): Promise<ReturnType> {
    // implementation
  }

  private helperMethod(): void {
    // implementation
  }
}

export const serviceName = new ServiceName();
```

#### Controller Files
```typescript
// Standard controller structure
import { Request, Response, NextFunction } from 'express';
import { serviceName } from '../services';
import { ApiResponse } from '../types';

export const controllerMethod = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // controller logic
    const result = await serviceName.method();
    
    const response: ApiResponse<ResultType> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
};
```

## Error Handling Standards

### Custom Error Creation
```typescript
// Use AppError for consistent error handling
import { AppError } from '../middleware/e/AppError.js';
import { ErrorCode } from '../middleware/e/ErrorCode.js';

// ✅ Good - specific error with context
throw AppError.newError400(ErrorCode.INVALID_INPUT, 'Symbol must be provided');

// ✅ Good - wrapping external errors
throw AppError.newRootError502(ErrorCode.AI_SERVICE_UNAVAILABLE, 'External API unavailable', externalError);
```

### Controller Error Handling
```typescript
// Always use try-catch with next() for async controllers
export const controllerMethod = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // controller logic
  } catch (error) {
    next(error); // Let centralized error handler process
  }
};
```

## API Design Standards

### Response Format Consistency
```typescript
// All successful responses should follow this structure
interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  pagination?: PaginationInfo;
}

// All error responses should follow this structure
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  timestamp: string;
}
```

### Route Organization
- **Versioning**: All routes under `/api/v1/...`
- **Resource Naming**: Plural nouns (`/yields`, `/tokens`)
- **RESTful Patterns**: Use standard HTTP methods appropriately
- **Query Parameters**: Use camelCase (`minApy`, `sortBy`)

### Input Validation
```typescript
// Validate inputs early in controllers
export const getYields = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { minApy, limit } = req.query;
    
    // Validate and sanitize inputs
    const validatedLimit = Math.min(parseInt(limit as string) || 10, 100);
    const validatedMinApy = parseFloat(minApy as string) || 0;
    
    // Continue with validated data
  } catch (error) {
    next(error);
  }
};
```

## Documentation Standards

### JSDoc Comments
```typescript
/**
 * Retrieves yield data for all supported tokens
 * @param filters - Optional filtering parameters
 * @returns Promise resolving to array of token yields
 * @throws {AppError} When external API is unavailable
 */
async function getTokenYields(filters?: YieldFilters): Promise<TokenYield[]> {
  // implementation
}
```

### OpenAPI/Swagger Documentation
- **Complete Schemas**: Document all request/response types
- **Examples**: Provide realistic example data
- **Status Codes**: Document all possible HTTP responses
- **Parameter Descriptions**: Clear parameter explanations

## Security Guidelines

### Input Sanitization
- **Always validate** user inputs before processing
- **Use TypeScript types** for compile-time validation
- **Sanitize strings** to prevent injection attacks
- **Limit payload sizes** (currently 10mb limit)

### Environment Variables
```typescript
// ✅ Good - validate required env vars
if (!process.env.BIFROST_API_URL) {
  throw new Error('BIFROST_API_URL is required');
}

// ❌ Avoid - using env vars directly without validation
const url = process.env.BIFROST_API_URL; // might be undefined
```

### API Security
- **Rate Limiting**: Implement for production
- **CORS Configuration**: Environment-specific settings
- **Security Headers**: Use helmet middleware
- **API Key Validation**: For protected endpoints

## Performance Guidelines

### Caching Strategy
```typescript
// Implement caching for expensive operations
class ServiceClass {
  private cache: Map<string, CacheItem> = new Map();
  
  async expensiveOperation(key: string): Promise<Data> {
    if (this.isValidCache(key, ttl)) {
      return this.getCache(key);
    }
    
    const result = await performExpensiveOperation();
    this.setCache(key, result);
    return result;
  }
}
```

### Database Queries (Future)
- **Indexing**: Plan database indexes for query patterns
- **Pagination**: Always implement for list endpoints
- **Connection Pooling**: Use connection pools for database access

## Testing Standards (Future Implementation)

### Unit Tests
```typescript
// Test structure pattern
describe('BifrostService', () => {
  describe('getSiteData', () => {
    it('should return cached data when cache is valid', async () => {
      // Arrange
      // Act
      // Assert
    });
    
    it('should fetch fresh data when cache is expired', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### Integration Tests
- **API Endpoint Testing**: Test complete request/response cycles
- **Error Scenarios**: Test error handling paths
- **Authentication**: Test protected endpoints

## Development Workflow

### Branch Management
- **Feature Branches**: `feat-description` or `feat_description`
- **Hotfix Branches**: `hotfix-description`
- **Pull Requests**: Required for main branch
- **Commit Messages**: Descriptive and consistent

### Pre-commit Checklist
- [ ] TypeScript compilation passes
- [ ] ESLint passes without errors
- [ ] Code follows naming conventions
- [ ] Error handling is implemented
- [ ] Documentation is updated
- [ ] No secrets in code

### Local Development Setup
```bash
# Development server with hot reload
npm run dev

# TypeScript compilation
npm run build

# API documentation
# Available at http://localhost:3000/docs
```

## Deployment Considerations

### Environment Configuration
- **Development**: Full logging, relaxed CORS
- **Production**: Minimal logging, strict CORS, rate limiting
- **Environment Variables**: All configuration externalized

### Performance Monitoring
- **Response Times**: Monitor API response times
- **Error Rates**: Track error frequency
- **Cache Hit Rates**: Monitor caching effectiveness

## Code Review Guidelines

### What to Look For
- **Type Safety**: All functions properly typed
- **Error Handling**: Proper error propagation
- **Security**: No hardcoded secrets or unsafe practices
- **Performance**: Efficient algorithms and caching
- **Documentation**: Code is self-documenting or commented

### Review Process
1. **Code Quality**: Meets style guidelines
2. **Functionality**: Solves the intended problem
3. **Security**: No security vulnerabilities
4. **Performance**: No obvious performance issues
5. **Documentation**: Adequate documentation provided