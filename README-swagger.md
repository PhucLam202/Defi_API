# Swagger UI Integration cho DeFi Data API

## Tổng quan
Đã tích hợp thành công Swagger UI vào dự án DeFi Data API với các tính năng tối ưu:

## Tính năng chính
- **Swagger UI**: Giao diện web tương tác để test API
- **OpenAPI 3.0**: Spec hoàn chỉnh với schemas và examples
- **Auto-generated Documentation**: Từ JSDoc comments trong code
- **TypeScript Support**: Tích hợp với existing types
- **Try-it-out**: Test API trực tiếp từ web interface

## Endpoints Documentation

### Swagger UI
- **URL**: `http://localhost:3000/api-docs`
- **Features**: Interactive API testing, request/response examples, schema validation

### Swagger JSON
- **URL**: `http://localhost:3000/api-docs.json`
- **Purpose**: Export OpenAPI spec for other tools

## API Endpoints đã được document:

### 1. Root Endpoint
- **GET** `/` - API information và links

### 2. Yields Endpoints
- **GET** `/api/v1/yields` - Danh sách tất cả token yields
  - Query parameters: `minApy`, `sortBy`, `limit`
  - Filtering và sorting support
  - Pagination support

- **GET** `/api/v1/yields/{symbol}` - Yield data cho token cụ thể
  - Path parameter: `symbol` (vDOT, vKSM, etc.)
  - Validation và error handling

## Schemas được định nghĩa:

### Core Schemas
- `ApiResponse<T>` - Standard response wrapper
- `ErrorResponse` - Error response format
- `TokenYield` - Token yield data structure

### Response Components
- `BadRequest` (400)
- `NotFound` (404)
- `InternalServerError` (500)

## Cấu hình tối ưu:

### UI Customization
- Hide top bar
- Custom site title
- Persistent authorization
- Request duration display
- Filter support
- Try-it-out enabled

### Development Features
- Auto-reload với nodemon
- TypeScript compilation
- Error handling integration
- Validation support

## Sử dụng:

1. **Start development server**:
   ```bash
   npm run dev
   ```

2. **Truy cập Swagger UI**:
   ```
   http://localhost:3000/api-docs
   ```

3. **Test API endpoints**:
   - Click "Try it out" button
   - Nhập parameters
   - Click "Execute"
   - Xem response data

## Lợi ích:
- ✅ Interactive API testing
- ✅ Automatic documentation sync với code
- ✅ Request/response validation
- ✅ Examples và schemas rõ ràng
- ✅ Developer-friendly interface
- ✅ Export OpenAPI spec cho integration tools
- ✅ Tích hợp với existing error handling
- ✅ TypeScript type safety

## Lưu ý:
- Swagger UI chỉ available trong development mode
- Documentation tự động update khi code thay đổi
- Support tất cả HTTP methods và response codes
- Validation theo OpenAPI 3.0 specification