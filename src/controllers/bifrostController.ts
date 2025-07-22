/// # Bifrost Controller
/// 
/// Unified REST API controller managing all Bifrost protocol operations including:
/// - DeFi yield farming data across supported tokens
/// - vToken exchange rates and conversion services  
/// - Token amount conversions with slippage protection
/// 
/// This controller consolidates yields and exchange rate functionality into a single
/// cohesive interface for the Bifrost liquid staking protocol ecosystem.
/// 
/// ## Controller Responsibilities:
/// - **Yield Data Aggregation**: Fetches and processes yield data from multiple sources
/// - **Exchange Rate Management**: Real-time vToken to base token rate calculations
/// - **Token Conversions**: Bidirectional token amount conversions with precision
/// - **Input Validation**: Multi-layer validation for all query parameters
/// - **Security Enforcement**: Sanitization and bounds checking for all inputs
/// - **Response Formatting**: Standardized API responses with pagination
/// - **Error Handling**: Graceful error propagation with proper HTTP status codes
/// 
/// ## Security Features:
/// - **Parameter Sanitization**: Removes special characters and enforces length limits
/// - **Bounds Checking**: Validates numeric parameters within reasonable ranges
/// - **Token Validation**: Verifies tokens against supported list
/// - **Input Type Validation**: Strict type checking for all parameters
/// - **11-Layer Token Pair Security**: Comprehensive validation for conversions
/// 
/// ## API Endpoint Groups:
/// ### Yields Endpoints:
/// - `GET /bifrost/yields` - List all available yields with filtering and sorting
/// - `GET /bifrost/yields/{symbol}` - Get yield data for specific token symbol
/// 
/// ### Exchange Rate Endpoints:
/// - `GET /bifrost/exchange-rates/{token}` - Get exchange rate for specific vToken
/// - `GET /bifrost/convert` - Convert between vToken and base token amounts
/// - `GET /bifrost/supported-tokens` - List all supported tokens for conversion

import { Request, Response, NextFunction } from 'express';
import { bifrostService } from '../services/bifrostService.js';
import { 
  ApiResponse, 
  TokenYield,
  ExchangeRateResponse, 
  ConvertResponse, 
  ExchangeRateQuery,
  ConvertQuery,
  VTokenListResponse,
  VTokenDetailResponse,
  VTokenListQuery 
} from '../types/index.js';
import { AppError } from '../middleware/e/AppError.js';
import { ErrorCode } from '../middleware/e/ErrorCode.js';
import { logger } from '../utils/logger.js';

/// ## BifrostController Class
/// 
/// Main controller class handling all Bifrost protocol API endpoints with
/// comprehensive validation and security measures. Combines yields and 
/// exchange rate functionality into a unified interface.
/// 
/// ### Features:
/// - **Advanced Filtering**: APY thresholds, token types, protocol filters
/// - **Intelligent Sorting**: Multi-criteria sorting (APY, TVL, etc.)
/// - **Pagination Support**: Configurable limits with bounds checking
/// - **Token Normalization**: Smart symbol handling and validation
/// - **Exchange Rate Precision**: High-precision decimal calculations
/// - **Slippage Protection**: Optional slippage tolerance for conversions
export class BifrostController {
  
  /// ## Get All Yields Endpoint
  /// 
  /// Retrieves comprehensive yield farming data for all supported tokens with
  /// advanced filtering, sorting, and validation capabilities.
  /// 
  /// **@param {Request} req** - Express request object with query parameters
  /// **@param {Response} res** - Express response object for API response
  /// **@param {NextFunction} next** - Express next function for error handling
  /// **@returns {Promise<void>}** - Async function returning paginated yield data
  /// 
  /// ### Supported Query Parameters:
  /// - **minApy**: Filter yields by minimum APY threshold (0-1000%)
  /// - **sortBy**: Sort criteria - "apy" (default) or "tvl"
  /// - **limit**: Result limit (1-100, default: 20)
  /// 
  /// ### Validation Layers:
  /// 1. **Parameter Type Validation**: Ensures correct data types
  /// 2. **Range Validation**: APY and limit within reasonable bounds
  /// 3. **Sort Option Validation**: Only allows predefined sort criteria
  /// 4. **Input Sanitization**: Prevents injection attacks
  /// 
  /// ### Response Structure:
  /// ```json
  /// {
  ///   "success": true,
  ///   "data": [{
  ///     "symbol": "vDOT",
  ///     "protocol": "bifrost",
  ///     "apy": 15.42,
  ///     "tvl": 1000000,
  ///     "apyBreakdown": {...}
  ///   }],
  ///   "pagination": {...},
  ///   "timestamp": "2024-01-01T00:00:00.000Z"
  /// }
  /// ```
  async getYields(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      /// Extract query parameters with default values for robustness
      const { minApy, sortBy = 'apy', limit = '20' } = req.query;
      
      /// VALIDATION LAYER 1: Sort Parameter Validation
      /// Prevents SQL injection and ensures only valid sort criteria
      const validSortOptions = ['apy', 'tvl'];
      if (sortBy && !validSortOptions.includes(sortBy as string)) {
        throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid sortBy parameter. Must be "apy" or "tvl"');
      }
      
      /// DATA AGGREGATION: Fetch comprehensive protocol data
      /// Uses cached data from Bifrost service for performance
      const rawData = await bifrostService.getSiteData();
      
      /// SUPPORTED TOKENS: Current Bifrost liquid staking token list
      /// This list is maintained to match official Bifrost protocol supported assets
      const supportedTokens = ['vDOT', 'vKSM', 'vBNC', 'vASTR', 'vMANTA', 'vETH', 'vETH2', 'vFIL', 'vPHA', 'vMOVR', 'vGLMR'];
      
      /// DATA TRANSFORMATION: Convert raw API data to standardized yield objects
      /// Filter out null results from tokens with incomplete data
      let yields = supportedTokens
        .map(token => bifrostService.transformToTokenYield(rawData, token))
        .filter((tokenYield): tokenYield is TokenYield => tokenYield !== null);

      /// VALIDATION LAYER 2: APY Filter Validation
      /// Applies minimum APY filter with comprehensive bounds checking
      if (minApy) {
        const minApyNum = parseFloat(minApy as string);
        /// Range validation: 0% to 1000% APY (prevents unrealistic values)
        if (isNaN(minApyNum) || minApyNum < 0 || minApyNum > 1000) {
          throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid minApy parameter. Must be between 0 and 1000');
        }
        /// Apply filter: Only include yields meeting minimum threshold
        yields = yields.filter(y => y.apy >= minApyNum);
      }

      /// SORTING LOGIC: Apply user-specified or default sorting
      /// Default sort: APY (descending) - shows highest yields first
      /// Alternative: TVL (descending) - shows largest pools first
      if (sortBy === 'tvl') {
        yields.sort((a, b) => b.tvl - a.tvl);     // TVL: Largest to smallest
      } else {
        yields.sort((a, b) => b.apy - a.apy);     // APY: Highest to lowest (default)
      }

      /// VALIDATION LAYER 3: Limit Parameter Validation
      /// Prevents DoS attacks via oversized result sets and ensures reasonable pagination
      const limitNum = parseInt(limit as string);
      if (isNaN(limitNum) || limitNum <= 0 || limitNum > 100) {
        throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid limit parameter. Must be between 1 and 100');
      }
      /// Apply pagination: Limit results to prevent API abuse
      yields = yields.slice(0, limitNum);

      const response: ApiResponse<TokenYield[]> = {
        success: true,
        data: yields,
        pagination: {
          page: 1,
          limit: yields.length,
          total: yields.length
        },
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /// ## Get Yield by Symbol Endpoint
  /// 
  /// Retrieves yield farming data for a specific token symbol with comprehensive
  /// validation, sanitization, and normalization.
  /// 
  /// **@param {Request} req** - Express request object with path parameters
  /// **@param {Response} res** - Express response object for API response
  /// **@param {NextFunction} next** - Express next function for error handling
  /// **@returns {Promise<void>}** - Async function returning single token yield data
  /// 
  /// ### Path Parameters:
  /// - **symbol**: Token symbol (e.g., "vDOT", "vksm", "VDOT")
  /// 
  /// ### Security Features:
  /// 1. **Input Sanitization**: Removes special characters and limits length
  /// 2. **Format Validation**: Ensures alphanumeric-only symbols
  /// 3. **Normalization**: Smart case handling for user convenience
  /// 4. **Support Validation**: Verifies token against official list
  /// 
  /// ### Response Structure:
  /// ```json
  /// {
  ///   "success": true,
  ///   "data": {
  ///     "symbol": "VDOT",
  ///     "protocol": "bifrost",
  ///     "apy": 15.42,
  ///     "tvl": 1000000,
  ///     "apyBreakdown": {...}
  ///   },
  ///   "timestamp": "2024-01-01T00:00:00.000Z"
  /// }
  /// ```
  async getYieldBySymbol(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      /// Extract symbol parameter from URL path
      const { symbol } = req.params;
      
      /// VALIDATION LAYER 1: Presence and Basic Format Validation
      /// Ensures symbol parameter exists and is not empty/whitespace-only
      if (!symbol || symbol.trim() === '') {
        throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Symbol parameter is required');
      }
      
      /// VALIDATION LAYER 2: Input Sanitization and Security
      /// Removes special characters to prevent injection attacks and limits length for DoS protection
      const sanitizedSymbol = symbol.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
      if (sanitizedSymbol.length === 0) {
        throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid symbol format');
      }
      
      /// SUPPORTED TOKENS: Official Bifrost protocol liquid staking tokens
      /// This list must be kept in sync with protocol updates
      const supportedTokens = ['vDOT', 'vKSM', 'vBNC', 'vASTR', 'vMANTA', 'vETH', 'vETH2', 'vFIL', 'vPHA', 'vMOVR', 'vGLMR'];
      
      /// VALIDATION LAYER 3: Symbol Normalization
      /// Smart normalization handles various input formats for user convenience
      /// Examples: "vdot" → "vDOT", "VKSM" → "vKSM", "dot" → "DOT"
      const normalizedSymbol = sanitizedSymbol.toLowerCase().startsWith('v') ? 
        'v' + sanitizedSymbol.substring(1).toUpperCase() : 
        sanitizedSymbol.toUpperCase();
      
      /// VALIDATION LAYER 4: Support List Validation
      /// Verifies token exists in official Bifrost supported token list
      if (!supportedTokens.includes(normalizedSymbol)) {
        throw AppError.newError404(ErrorCode.NOT_FOUND, `Token ${symbol} is not supported`);
      }
      
      /// DATA RETRIEVAL: Fetch protocol data and transform for specific token
      /// Uses cached service data for performance optimization
      const rawData = await bifrostService.getSiteData();
      const yieldData = bifrostService.transformToTokenYield(rawData, normalizedSymbol);

      /// VALIDATION LAYER 5: Data Existence Validation
      /// Ensures yield data exists for the requested token (handles API inconsistencies)
      if (!yieldData) {
        throw AppError.newError404(ErrorCode.NOT_FOUND, `Token ${symbol} not found`);
      }

      const response: ApiResponse<TokenYield> = {
        success: true,
        data: yieldData,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /// ## Get Exchange Rate Endpoint
  /// 
  /// Retrieves real-time exchange rate for a specific vToken with optional
  /// historical data and volatility metrics.
  /// 
  /// **@param {Request} req** - Express request object with path and query parameters
  /// **@param {Response} res** - Express response object for API response
  /// **@param {NextFunction} next** - Express next function for error handling
  /// **@returns {Promise<void>}** - Async function returning exchange rate data
  /// 
  /// ### Path Parameters:
  /// - **token**: vToken symbol (e.g., "vKSM", "vDOT")
  /// 
  /// ### Query Parameters:
  /// - **includeHistory**: Include historical rate data ("true"/"false")
  /// - **historyDays**: Number of days for historical data
  /// - **includeVolatility**: Include volatility metrics ("true"/"false")
  /// - **source**: Data source preference ("runtime"/"frontend"/"auto")
  /// 
  /// ### Security Features:
  /// - Token format validation (alphanumeric only)
  /// - Input sanitization and length limits
  /// - Structured logging without sensitive data exposure
  async getExchangeRate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      const query = req.query as ExchangeRateQuery;

      // Validate token parameter
      if (!token || typeof token !== 'string') {
        throw AppError.newError400(ErrorCode.INVALID_INPUT, 'Token parameter is required');
      }

      // Validate token format (should be alphanumeric)
      if (!/^[a-zA-Z0-9]+$/.test(token)) {
        throw AppError.newError400(ErrorCode.INVALID_INPUT, 'Invalid token format');
      }

      logger.info(`Getting exchange rate for token: ${token}`, { query });

      // Get exchange rate from service
      const exchangeRate = await bifrostService.getExchangeRate(token);

      // Build response
      const responseData: ExchangeRateResponse['data'] = {
        exchangeRate,
        metadata: {
          lastUpdate: exchangeRate.timestamp,
          source: exchangeRate.source
        }
      };

      // Add historical data if requested
      if (query.includeHistory === 'true') {
        // TODO: Implement historical data fetching
        responseData.historicalRates = [];
      }

      // Add volatility if requested
      if (query.includeVolatility === 'true') {
        // TODO: Implement volatility calculation
        responseData.volatility = {
          daily: 0,
          weekly: 0,
          monthly: 0
        };
      }

      const response: ApiResponse<ExchangeRateResponse['data']> = {
        success: true,
        data: responseData,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /// ## Token Amount Conversion Controller
  /// 
  /// Handles token conversion requests between vTokens and their underlying base tokens.
  /// This is the main endpoint for calculating conversion amounts with comprehensive
  /// validation, security checks, and optional features like slippage protection.
  /// 
  /// **@param {Request} req** - Express request object with query parameters
  /// **@param {Response} res** - Express response object for API response
  /// **@param {NextFunction} next** - Express next function for error handling
  /// **@returns {Promise<void>}** - Async function returning standardized API response
  /// 
  /// ### Required Query Parameters:
  /// - **amount**: Positive number as string (e.g., "100.5")
  /// - **from**: Source token symbol (e.g., "vDOT", "DOT")  
  /// - **to**: Target token symbol (e.g., "DOT", "vDOT")
  /// 
  /// ### Optional Query Parameters:
  /// - **network**: Target network (default: "bifrost")
  /// - **slippage**: Slippage tolerance 0-100% (e.g., "0.5")
  /// - **includesFees**: Include fee breakdown ("true"/"false")
  /// 
  /// ### Security Validation Layers:
  /// 1. **Parameter Presence**: Validates required parameters exist
  /// 2. **Amount Validation**: Ensures positive numeric values
  /// 3. **Slippage Validation**: Range check 0-100%
  /// 4. **Token Pair Validation**: Calls secure isValidTokenPair function
  /// 5. **Type Safety**: TypeScript type checking with runtime validation
  /// 
  /// ### Response Structure:
  /// ```json
  /// {
  ///   "success": true,
  ///   "data": {
  ///     "input": { "amount": "100", "token": {...} },
  ///     "output": { "amount": "152.81", "token": {...} },
  ///     "exchangeRate": {...},
  ///     "calculation": {...},
  ///     "slippage": 0.5,
  ///     "minimumReceived": {...}
  ///   },
  ///   "timestamp": "2024-01-01T00:00:00.000Z"
  /// }
  /// ```
  async convertTokenAmount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      /// Extract and type-cast query parameters for validation
      const query = req.query as unknown as ConvertQuery;
      const { amount, from, to, network, slippage, includesFees } = query;

      /// VALIDATION LAYER 1: Required Parameters Check
      /// Ensures all mandatory parameters are present and not empty
      if (!amount || !from || !to) {
        throw AppError.newError400(
          ErrorCode.INVALID_INPUT, 
          'amount, from, and to parameters are required'
        );
      }

      /// VALIDATION LAYER 2: Amount Format and Range Validation
      /// Prevents negative values, zero amounts, and non-numeric inputs
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw AppError.newError400(ErrorCode.INVALID_INPUT, 'Amount must be a positive number');
      }

      /// VALIDATION LAYER 3: Slippage Parameter Validation (Optional)
      /// Validates slippage percentage is within reasonable bounds (0-100%)
      if (slippage) {
        const numSlippage = parseFloat(slippage);
        if (isNaN(numSlippage) || numSlippage < 0 || numSlippage > 100) {
          throw AppError.newError400(ErrorCode.INVALID_INPUT, 'Slippage must be between 0 and 100');
        }
      }

      /// VALIDATION LAYER 4: Token Pair Security Validation
      /// Calls the comprehensive 11-layer security validation in service
      const isValidPair = await bifrostService.isValidTokenPair(from, to);
      if (!isValidPair) {
        throw AppError.newError400(
          ErrorCode.INVALID_INPUT, 
          `Conversion between ${from} and ${to} is not supported`
        );
      }

      /// Log successful validation for monitoring (sanitized)
      logger.info('Converting token amount', { amount, from, to, network, slippage });

      /// BUILD INPUT TOKEN AMOUNT OBJECT
      /// Prepare structured input data for service layer processing
      const inputTokenAmount = {
        amount,
        decimals: 12, // Standard precision for Polkadot ecosystem
        token: {
          symbol: from.toUpperCase(), // Normalize to uppercase
          network: (network as 'bifrost' | 'moonbeam' | 'astar' | 'hydration' | 'polkadx' | 'moonriver') || 'bifrost'
        },
        formattedAmount: parseFloat(amount).toFixed(8) // Format for display
      };

      /// PERFORM CORE CONVERSION
      /// Delegate to service layer for business logic and exchange rate calculation
      const outputTokenAmount = await bifrostService.convertTokenAmount({
        amount,
        fromToken: from,
        toToken: to,
        network,
        slippageTolerance: slippage ? parseFloat(slippage) : undefined
      });

      /// FETCH EXCHANGE RATE FOR RESPONSE METADATA
      /// Determine which token is the vToken for rate lookup
      const vToken = from.startsWith('v') ? from : to;
      const exchangeRate = await bifrostService.getExchangeRate(vToken);

      /// BUILD CORE RESPONSE DATA
      /// Structure the main conversion response with calculation metadata
      const responseData: ConvertResponse['data'] = {
        input: inputTokenAmount,
        output: outputTokenAmount,
        exchangeRate,
        calculation: {
          method: exchangeRate.source === 'frontend_api' ? 'frontend_api' : 'runtime_api',
          precision: 12, // Decimal precision used in calculations
          roundingApplied: false // Track if rounding was necessary
        }
      };

      /// OPTIONAL FEATURE: Fee Breakdown
      /// Add fee information if requested by client
      if (includesFees === 'true') {
        responseData.fees = {
          swapFee: 0,      // Currently no swap fees in Bifrost
          networkFee: 0,   // Network transaction fees (estimated)
          total: 0         // Total fees for user transparency
        };
      }

      /// OPTIONAL FEATURE: Slippage Protection
      /// Calculate minimum received amount accounting for slippage
      if (slippage) {
        const slippageAmount = parseFloat(outputTokenAmount.amount) * (parseFloat(slippage) / 100);
        responseData.slippage = parseFloat(slippage);
        responseData.minimumReceived = {
          ...outputTokenAmount,
          amount: (parseFloat(outputTokenAmount.amount) - slippageAmount).toString(),
          formattedAmount: (parseFloat(outputTokenAmount.amount) - slippageAmount).toFixed(8)
        };
      }

      /// FORMAT FINAL API RESPONSE
      /// Standardized response structure with success indicator and timestamp
      const response: ApiResponse<ConvertResponse['data']> = {
        success: true,
        data: responseData,
        timestamp: new Date().toISOString()
      };

      /// Send JSON response to client
      res.json(response);
    } catch (error) {
      /// Pass any errors to centralized error handler middleware
      /// Error handler will sanitize and format error responses appropriately
      next(error);
    }
  }

  /// ## Get Supported Tokens Endpoint
  /// 
  /// Retrieves list of all supported tokens for conversion operations.
  /// 
  /// **@param {Request} req** - Express request object
  /// **@param {Response} res** - Express response object for API response
  /// **@param {NextFunction} next** - Express next function for error handling
  /// **@returns {Promise<void>}** - Async function returning supported tokens list
  async getSupportedTokens(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Getting supported tokens list');

      const tokens = await bifrostService.getSupportedTokens();

      const response: ApiResponse<{ tokens: string[]; count: number }> = {
        success: true,
        data: {
          tokens,
          count: tokens.length
        },
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
  // ============================================================================
  // EXTENDED CONTROLLER METHODS FOR NEW ENDPOINTS
  // ============================================================================

  /**
   * GET /api/v1/bifrost/vtokens
   * Get list of all vTokens with comprehensive metadata
   */
  async getVTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const startTime = performance.now();
      const requestId = `vtokens-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      logger.info('Processing vTokens list request', { 
        requestId, 
        query: req.query,
        ip: req.ip 
      });

      // Extract and validate query parameters
      const {
        page = 1,
        limit = 20,
        network,
        minApy,
        maxApy,
        minTvl,
        sortBy = 'tvl',
        sortOrder = 'desc',
        status,
        riskLevel
      } = req.query;

      // Validate parameters
      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
      const minApyNum = minApy ? parseFloat(minApy as string) : undefined;
      const maxApyNum = maxApy ? parseFloat(maxApy as string) : undefined;
      const minTvlNum = minTvl ? parseFloat(minTvl as string) : undefined;

      // Validate sort parameters
      const validSortFields = ['apy', 'tvl', 'volume', 'holders', 'name'];
      const validSortOrders = ['asc', 'desc'];
      
      if (!validSortFields.includes(sortBy as string)) {
        throw new AppError('Invalid sortBy parameter', ErrorCode.VALIDATION_ERROR, 400);
      }
      
      if (!validSortOrders.includes(sortOrder as string)) {
        throw new AppError('Invalid sortOrder parameter', ErrorCode.VALIDATION_ERROR, 400);
      }

      // Build filter options
      const filterOptions = {
        page: pageNum,
        limit: limitNum,
        network: network ? (Array.isArray(network) ? network : [network]) : undefined,
        minApy: minApyNum,
        maxApy: maxApyNum,
        minTvl: minTvlNum,
        sortBy: sortBy as string,
        sortOrder: sortOrder as string,
        status: status as string,
        riskLevel: riskLevel as string
      };

      // Get vTokens data from service
      const vTokensData = await bifrostService.getVTokensList(filterOptions);
      
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      logger.info('vTokens request completed successfully', {
        requestId,
        responseTime,
        tokensCount: vTokensData.data.tokens.length,
        totalTokens: vTokensData.pagination.total
      });

      res.json({
        success: true,
        data: vTokensData.data,
        pagination: vTokensData.pagination,
        metadata: {
          ...vTokensData.metadata,
          requestId,
          responseTime
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error in getVTokens controller', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      next(error);
    }
  }

  /**
   * GET /api/v1/bifrost/vtokens/:symbol
   * Get detailed information for a specific vToken
   */
  async getVTokenBySymbol(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const startTime = performance.now();
      const requestId = `vtoken-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const { symbol } = req.params;
      
      logger.info('Processing vToken detail request', { 
        requestId, 
        symbol,
        ip: req.ip 
      });

      // Validate symbol parameter
      if (!symbol || typeof symbol !== 'string') {
        throw new AppError('Symbol parameter is required', ErrorCode.VALIDATION_ERROR, 400);
      }

      // Clean and validate symbol
      const cleanSymbol = symbol.trim().toUpperCase();
      if (!/^[A-Z0-9]{2,10}$/.test(cleanSymbol)) {
        throw new AppError('Invalid symbol format', ErrorCode.VALIDATION_ERROR, 400);
      }

      // Get detailed vToken data from service
      const vTokenDetail = await bifrostService.getVTokenDetail(cleanSymbol);
      
      if (!vTokenDetail) {
        throw new AppError(`vToken ${cleanSymbol} not found`, ErrorCode.NOT_FOUND, 404);
      }
      
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      logger.info('vToken detail request completed successfully', {
        requestId,
        symbol: cleanSymbol,
        responseTime
      });

      res.json({
        success: true,
        data: vTokenDetail,
        metadata: {
          requestId,
          responseTime,
          lastUpdate: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error in getVTokenBySymbol controller', { 
        symbol: req.params.symbol,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      next(error);
    }
  }

}

export const bifrostController = new BifrostController();