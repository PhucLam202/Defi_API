/// # Unified Bifrost Protocol Routes
/// 
/// Complete route definitions for Bifrost liquid staking protocol endpoints.
/// Consolidates yields and exchange rate functionality into a unified API.
/// 
/// ## Route Responsibilities:
/// - **Yield Data Management**: DeFi yield farming data with advanced filtering
/// - **Exchange Rate Management**: Real-time vToken to base token exchange rates
/// - **Token Conversion**: Secure token amount conversions with validation
/// - **Protocol Discovery**: Supported token lists and protocol metadata
/// - **Security Enforcement**: Input validation and rate limiting
/// 
/// ## Security Features:
/// - All routes use comprehensive input validation from controllers
/// - Token pair validation prevents unsupported conversions
/// - Rate limiting applied to prevent API abuse
/// - Error handling with sanitized responses
/// 
/// ## Endpoint Overview:
/// ```
/// # Yields Endpoints
/// GET /yields                - List all available yields with filtering
/// GET /yields/{symbol}       - Get yield data for specific token
/// 
/// # Exchange Rate Endpoints
/// GET /exchange-rates/{token} - Get exchange rate for specific vToken
/// GET /convert               - Convert between vToken and base token
/// GET /supported-tokens      - List all supported tokens
/// ```
/// 
/// ## Integration:
/// - Uses unified bifrostController for all business logic
/// - Delegates to bifrostService for external API integration
/// - Implements comprehensive error handling and validation

import { Router, type Router as ExpressRouter } from 'express';
import { bifrostController } from '../../controllers/bifrostController.js';

/// ## Unified Bifrost Router Configuration
/// 
/// Creates router instance for complete Bifrost protocol endpoints with
/// yields and exchange rate functionality consolidated.
const router: ExpressRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Bifrost Protocol
 *   description: Complete Bifrost liquid staking protocol API including yields and exchange rates
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     TokenYield:
 *       type: object
 *       properties:
 *         symbol:
 *           type: string
 *           description: Token symbol
 *           example: vDOT
 *         protocol:
 *           type: string
 *           description: Protocol name
 *           example: bifrost
 *         apy:
 *           type: number
 *           description: Annual Percentage Yield
 *           example: 15.42
 *         tvl:
 *           type: number
 *           description: Total Value Locked
 *           example: 1000000
 *         apyBreakdown:
 *           type: object
 *           properties:
 *             base:
 *               type: number
 *             reward:
 *               type: number
 *             mev:
 *               type: number
 *             gas:
 *               type: number
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         code:
 *           type: integer
 *           example: 1001
 *         msg:
 *           type: string
 *           example: Resource not found
 *         data:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *             path:
 *               type: string
 *             method:
 *               type: string
 *             timestamp:
 *               type: string
 *               format: date-time
 */

// ============================================================================
// YIELDS ENDPOINTS
// ============================================================================

/**
 * @swagger
 * /api/v1/bifrost/yields:
 *   get:
 *     summary: Get all available yields
 *     tags: [Bifrost Protocol]
 *     parameters:
 *       - in: query
 *         name: minApy
 *         schema:
 *           type: number
 *         description: Minimum APY filter (0-1000%)
 *         example: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [apy, tvl]
 *         description: Sort criteria
 *         example: apy
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Result limit
 *         example: 20
 *     responses:
 *       200:
 *         description: List of available yields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TokenYield'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/// **GET /yields**
/// Retrieves all available yields with filtering and sorting capabilities
/// - **Security**: Query parameter validation, APY/limit bounds checking
/// - **Features**: Filtering by minApy, sorting by apy/tvl, pagination
/// - **Validation**: Multi-layer input validation and sanitization
/// - **Performance**: Cached data with intelligent transformation
router.get('/yields', bifrostController.getYields.bind(bifrostController));

/**
 * @swagger
 * /api/v1/bifrost/yields/{symbol}:
 *   get:
 *     summary: Get yield data for specific token symbol
 *     tags: [Bifrost Protocol]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         description: Token symbol (e.g., vDOT, vKSM)
 *         schema:
 *           type: string
 *         example: vDOT
 *     responses:
 *       200:
 *         description: Yield data for specific token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TokenYield'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid token symbol
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Token not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/// **GET /yields/{symbol}**
/// Retrieves yield data for a specific token symbol
/// - **Security**: Symbol sanitization, format validation, support verification
/// - **Features**: Smart symbol normalization (handles case variations)
/// - **Validation**: 5-layer validation including existence checks
/// - **Performance**: Efficient single-token data extraction
router.get('/yields/:symbol', bifrostController.getYieldBySymbol.bind(bifrostController));

// ============================================================================
// EXCHANGE RATE ENDPOINTS
// ============================================================================

/**
 * @swagger
 * /api/v1/bifrost/exchange-rates/{token}:
 *   get:
 *     summary: Get exchange rate for a specific vToken
 *     tags: [Bifrost Protocol]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: vToken symbol (e.g., vKSM, vDOT)
 *         example: vKSM
 *       - in: query
 *         name: includeHistory
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Include historical rate data
 *         example: false
 *       - in: query
 *         name: historyDays
 *         schema:
 *           type: string
 *         description: Number of days for historical data (1-365)
 *         example: "7"
 *       - in: query
 *         name: includeVolatility
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Include volatility metrics
 *         example: false
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [runtime, frontend, auto]
 *         description: Data source preference
 *         example: auto
 *     responses:
 *       200:
 *         description: Exchange rate retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     exchangeRate:
 *                       type: object
 *                       properties:
 *                         baseToken:
 *                           type: object
 *                           properties:
 *                             symbol:
 *                               type: string
 *                               example: KSM
 *                             network:
 *                               type: string
 *                               example: bifrost
 *                         vToken:
 *                           type: object
 *                           properties:
 *                             symbol:
 *                               type: string
 *                               example: vKSM
 *                             network:
 *                               type: string
 *                               example: bifrost
 *                         rate:
 *                           type: number
 *                           example: 0.9234
 *                           description: vToken to base token rate
 *                         inverseRate:
 *                           type: number
 *                           example: 1.0831
 *                           description: base token to vToken rate
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                         source:
 *                           type: string
 *                           example: frontend_api
 *                         confidence:
 *                           type: number
 *                           example: 95
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         lastUpdate:
 *                           type: string
 *                           format: date-time
 *                         source:
 *                           type: string
 *                     historicalRates:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           rate:
 *                             type: number
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                     volatility:
 *                       type: object
 *                       properties:
 *                         daily:
 *                           type: number
 *                         weekly:
 *                           type: number
 *                         monthly:
 *                           type: number
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid token symbol or parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Token not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/// **GET /exchange-rates/{token}**
/// Retrieves current exchange rate for a specific vToken
/// - **Security**: Token format validation, supported token verification
/// - **Features**: Historical data, volatility metrics (optional)
/// - **Caching**: 5-minute cache TTL for performance
router.get('/exchange-rates/:token', bifrostController.getExchangeRate.bind(bifrostController));

/**
 * @swagger
 * /api/v1/bifrost/convert:
 *   get:
 *     summary: Convert between vToken and base token amounts
 *     tags: [Bifrost Protocol]
 *     parameters:
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: string
 *         description: Amount to convert (positive number)
 *         example: "100"
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *         description: Source token symbol
 *         example: vKSM
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *         description: Target token symbol
 *         example: KSM
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [bifrost, moonbeam, astar, hydration, polkadx, moonriver]
 *         description: Network to use for conversion
 *         example: bifrost
 *       - in: query
 *         name: slippage
 *         schema:
 *           type: string
 *         description: Slippage tolerance percentage (0-100)
 *         example: "0.5"
 *       - in: query
 *         name: includesFees
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Include fee calculations in response
 *         example: false
 *     responses:
 *       200:
 *         description: Conversion calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     input:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: string
 *                           example: "100"
 *                         decimals:
 *                           type: number
 *                           example: 12
 *                         token:
 *                           type: object
 *                           properties:
 *                             symbol:
 *                               type: string
 *                               example: vKSM
 *                             network:
 *                               type: string
 *                               example: bifrost
 *                         formattedAmount:
 *                           type: string
 *                           example: "100.00000000"
 *                     output:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: string
 *                           example: "92.34"
 *                         decimals:
 *                           type: number
 *                           example: 12
 *                         token:
 *                           type: object
 *                           properties:
 *                             symbol:
 *                               type: string
 *                               example: KSM
 *                             network:
 *                               type: string
 *                               example: bifrost
 *                         formattedAmount:
 *                           type: string
 *                           example: "92.34000000"
 *                     exchangeRate:
 *                       type: object
 *                       description: Exchange rate used for conversion
 *                       properties:
 *                         rate:
 *                           type: number
 *                           example: 0.9234
 *                         inverseRate:
 *                           type: number
 *                           example: 1.0831
 *                         source:
 *                           type: string
 *                           example: frontend_api
 *                     calculation:
 *                       type: object
 *                       properties:
 *                         method:
 *                           type: string
 *                           example: frontend_api
 *                         precision:
 *                           type: number
 *                           example: 12
 *                         roundingApplied:
 *                           type: boolean
 *                           example: false
 *                     fees:
 *                       type: object
 *                       properties:
 *                         swapFee:
 *                           type: number
 *                           example: 0
 *                         networkFee:
 *                           type: number
 *                           example: 0
 *                         total:
 *                           type: number
 *                           example: 0
 *                     slippage:
 *                       type: number
 *                       example: 0.5
 *                     minimumReceived:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: string
 *                           example: "91.88"
 *                         formattedAmount:
 *                           type: string
 *                           example: "91.88000000"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid conversion parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Token pair not supported
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/// **GET /convert**
/// Converts token amounts between vTokens and base tokens
/// - **Security**: 11-layer validation including token pair verification
/// - **Features**: Slippage protection, fee breakdown (optional)
/// - **Validation**: Amount, token pair, and parameter validation
router.get('/convert', bifrostController.convertTokenAmount.bind(bifrostController));

/**
 * @swagger
 * /api/v1/bifrost/supported-tokens:
 *   get:
 *     summary: Get list of supported tokens for conversion
 *     tags: [Bifrost Protocol]
 *     responses:
 *       200:
 *         description: List of supported tokens retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     tokens:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["vKSM", "vDOT", "vBNC", "vETH", "vMANTA", "vASTR", "vETH2", "vFIL", "vPHA", "vMOVR", "vGLMR"]
 *                       description: Array of supported vToken symbols
 *                     count:
 *                       type: number
 *                       example: 11
 *                       description: Total number of supported tokens
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T00:00:00.000Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/// **GET /supported-tokens**
/// Lists all supported tokens for conversions
/// - **Security**: No user input, read-only endpoint
/// - **Features**: Token count, protocol metadata
/// - **Caching**: Service-level caching for performance
router.get('/supported-tokens', bifrostController.getSupportedTokens.bind(bifrostController));

export default router;