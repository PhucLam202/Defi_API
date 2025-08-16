/// # Stablecoin Ecosystem Routes
/// 
/// Comprehensive route definitions for stablecoin ecosystem data endpoints.
/// Provides access to market analytics, risk assessment, and cross-chain
/// stablecoin circulation data with enterprise-grade security.
/// 
/// ## Route Responsibilities:
/// - **Market Data Access**: Comprehensive stablecoin market information
/// - **Risk Assessment**: Stability metrics and depegging monitoring
/// - **Cross-Chain Analytics**: Blockchain-specific circulation data
/// - **Market Intelligence**: Top performers and ecosystem analytics
/// 
/// ## Security Features:
/// - Rate limiting on all endpoints to prevent API abuse
/// - Comprehensive input validation and sanitization
/// - Parameter bounds checking and format validation
/// - DoS protection through result set limits
/// 
/// ## Performance Optimizations:
/// - Intelligent caching with 5-minute TTL
/// - Conditional data inclusion (chain data optional)
/// - Optimized sorting and filtering algorithms
/// - Pagination support for large datasets
/// 
/// ## Endpoint Categories:
/// 
/// ### Core Data Access:
/// ```
/// GET /                   - List all stablecoins with filtering
/// GET /symbol/{symbol}    - Get stablecoin by symbol
/// GET /id/{id}           - Get stablecoin by ID
/// ```
/// 
/// ### Analytics & Intelligence:
/// ```
/// GET /analytics         - Market analytics and breakdowns
/// GET /top              - Top stablecoins by market cap
/// GET /depegged         - Risk monitoring for depegged tokens
/// ```
/// 
/// ### Cross-Chain Analysis:
/// ```
/// GET /chain/{chain}     - Blockchain-specific stablecoin data
/// ```

import express from 'express';
import { stablecoinController } from '../../controllers/stablecoinController.js';
import { rateLimitMiddleware } from '../../middleware/rateLimiter.js';

/// ## Stablecoin Router Configuration
/// 
/// Creates router instance for stablecoin ecosystem endpoints with
/// rate limiting, controller delegation, and comprehensive Swagger documentation.
/// 
/// ### Middleware Stack:
/// 1. **Rate Limiting**: Applied to all endpoints for API protection
/// 2. **Input Validation**: Handled by individual controllers
/// 3. **Error Handling**: Centralized error middleware
/// 4. **Response Formatting**: Standardized API responses
const router: express.Router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     StablecoinAsset:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the stablecoin
 *         name:
 *           type: string
 *           description: Full name of the stablecoin
 *         symbol:
 *           type: string
 *           description: Symbol of the stablecoin
 *         geckoId:
 *           type: string
 *           description: CoinGecko ID for the stablecoin
 *         pegType:
 *           type: string
 *           description: Type of peg (USD, EUR, GBP)
 *         pegMechanism:
 *           type: string
 *           description: Mechanism used to maintain peg
 *         marketCap:
 *           type: number
 *           description: Market capitalization in USD
 *         price:
 *           type: number
 *           description: Current price in USD
 *         pegStability:
 *           type: number
 *           description: Stability percentage (0-100)
 *         circulation:
 *           type: object
 *           properties:
 *             current:
 *               type: number
 *             prevDay:
 *               type: number
 *             prevWeek:
 *               type: number
 *             prevMonth:
 *               type: number
 *         chains:
 *           type: array
 *           items:
 *             type: string
 *         riskLevel:
 *           type: string
 *           enum: [low, medium, high]
 *         growthRates:
 *           type: object
 *           properties:
 *             daily:
 *               type: number
 *             weekly:
 *               type: number
 *             monthly:
 *               type: number
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *         timestamp:
 *           type: string
 *           format: date-time
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: number
 *             limit:
 *               type: number
 *             total:
 *               type: number
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *         code:
 *           type: string
 *         timestamp:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/stablecoins:
 *   get:
 *     summary: Get all stablecoins with optional filtering
 *     tags: [Stablecoins]
 *     parameters:
 *       - in: query
 *         name: chains
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [ETH, Celo, DOT, BTC, SOL, AVAX, MATIC, BNB, ADA, LINK]
 *         style: form
 *         explode: false
 *         description: Filter by blockchain networks
 *         example: ["ETH", "AVAX"]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *           maximum: 100
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: List of stablecoins
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/StablecoinAsset'
 *       400:
 *         description: Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/// **GET /**
/// Retrieves all stablecoins with advanced filtering and pagination
/// - **Security**: Rate limiting, comprehensive input validation
/// - **Features**: Filter by peg type, mechanism, market cap, chain
/// - **Performance**: Optimized sorting, conditional chain data inclusion
/// - **Pagination**: Configurable limits (1-100) with bounds checking
router.get('/', rateLimitMiddleware, stablecoinController.getStablecoins);

/**
 * @swagger
 * /api/v1/stablecoins/symbol/{symbol}:
 *   get:
 *     summary: Get stablecoin by symbol
 *     tags: [Stablecoins]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Stablecoin symbol
 *         examples:
 *           usdt:
 *             value: USDT
 *             summary: Tether USD
 *           usdc:
 *             value: USDC
 *             summary: USD Coin
 *           busd:
 *             value: BUSD
 *             summary: Binance USD
 *           dai:
 *             value: DAI
 *             summary: Dai Stablecoin
 *           frax:
 *             value: FRAX
 *             summary: Frax
 *     responses:
 *       200:
 *         description: Stablecoin details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/StablecoinAsset'
 *       404:
 *         description: Stablecoin not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Invalid symbol format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/// **GET /symbol/{symbol}**
/// Retrieves stablecoin data by symbol with format validation
/// - **Security**: Symbol sanitization, alphanumeric validation
/// - **Features**: Case-insensitive symbol matching
/// - **Validation**: 20-character limit, injection protection
/// - **Response**: Complete stablecoin asset with risk metrics
router.get('/symbol/:symbol', rateLimitMiddleware, stablecoinController.getStablecoinBySymbol);

/**
 * @swagger
 * /api/v1/stablecoins/id/{id}:
 *   get:
 *     summary: Get stablecoin by ID
 *     tags: [Stablecoins]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Stablecoin ID
 *         example: tether
 *     responses:
 *       200:
 *         description: Stablecoin details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/StablecoinAsset'
 *       404:
 *         description: Stablecoin not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Invalid ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/// **GET /id/{id}**
/// Retrieves stablecoin data by unique identifier
/// - **Security**: ID sanitization, 50-character limit
/// - **Features**: Supports complex IDs (e.g., "dai-dai-stablecoin")
/// - **Validation**: Alphanumeric validation, injection protection
/// - **Response**: Complete stablecoin asset with all metadata
router.get('/id/:id', rateLimitMiddleware, stablecoinController.getStablecoinById);

/**
 * @swagger
 * /api/v1/stablecoins/chain/{chain}:
 *   get:
 *     summary: Get stablecoins by blockchain networks with chain-focused data structure
 *     tags: [Stablecoins]
 *     parameters:
 *       - in: path
 *         name: chain
 *         required: true
 *         schema:
 *           type: string
 *         description: Blockchain network(s) - supports single chain or comma-separated multiple chains
 *         examples:
 *           ethereum:
 *             value: ETH
 *             summary: Single Ethereum network
 *           multi_chain:
 *             value: "ETH,AVAX,MATIC"
 *             summary: Multiple networks (comma-separated)
 *           polkadot:
 *             value: DOT
 *             summary: Single Polkadot network
 *           with_spaces:
 *             value: "ETH, Celo"
 *             summary: Multiple networks with spaces (will be parsed correctly)
 *     responses:
 *       200:
 *         description: Chain-focused stablecoin data showing circulation on the specified chain
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         chain:
 *                           type: string
 *                           description: The blockchain name
 *                           example: ethereum
 *                         totalStablecoins:
 *                           type: number
 *                           description: Total number of stablecoins on this chain
 *                           example: 25
 *                         totalCirculation:
 *                           type: number
 *                           description: Total circulation on this chain in USD
 *                           example: 45000000000
 *                         stablecoins:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: tether
 *                               name:
 *                                 type: string
 *                                 example: Tether USD
 *                               symbol:
 *                                 type: string
 *                                 example: USDT
 *                               marketCap:
 *                                 type: number
 *                                 description: Total market cap across all chains
 *                                 example: 83000000000
 *                               circulation:
 *                                 type: number
 *                                 description: Circulation specifically on this chain
 *                                 example: 40000000000
 *                               price:
 *                                 type: number
 *                                 example: 1.001
 *                               pegStability:
 *                                 type: number
 *                                 example: 99.9
 *                               riskLevel:
 *                                 type: string
 *                                 enum: [low, medium, high]
 *                                 example: low
 *       400:
 *         description: Invalid chain format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/// **GET /chain/{chain}**
/// Retrieves stablecoins on specific blockchain networks with chain-focused analytics
/// - **Security**: Chain name sanitization and validation
/// - **Features**: Multi-level chain name matching, circulation totals, comma-separated multi-chain support
/// - **Analytics**: Chain-specific metrics, sorted by circulation
/// - **Response**: Simplified format focused on chain relevance
router.get('/chain/:chain', rateLimitMiddleware, stablecoinController.getStablecoinsByChain);

/**
 * @swagger
 * /api/v1/stablecoins/analytics:
 *   get:
 *     summary: Get comprehensive stablecoin market analytics and intelligence
 *     description: |
 *       Retrieves in-depth market analytics for the entire stablecoin ecosystem including:
 *       
 *       **Market Overview:**
 *       - Total market capitalization across all stablecoins
 *       - Count of active stablecoins in the ecosystem
 *       - Market concentration and diversity metrics
 *       
 *       **Peg Mechanism Analysis:**
 *       - Distribution by backing type (fiat-backed, crypto-backed, algorithmic)
 *       - Market share percentage for each mechanism
 *       - Risk assessment by mechanism type
 *       
 *       **Cross-Chain Distribution:**
 *       - Circulation breakdown by blockchain network
 *       - Chain dominance and market share analysis
 *       - Multi-chain adoption patterns
 *       
 *       **Stability & Risk Metrics:**
 *       - Average peg stability across all stablecoins
 *       - Count and analysis of depegged tokens
 *       - Risk level distribution (low/medium/high)
 *       - Volatility trends and stability indicators
 *       
 *       This endpoint provides essential data for market research, risk assessment, 
 *       and strategic analysis of the stablecoin landscape.
 *     tags: [Stablecoins]
 *     responses:
 *       200:
 *         description: Comprehensive stablecoin market analytics
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         totalMarketCap:
 *                           type: number
 *                         totalStablecoins:
 *                           type: number
 *                         mechanismBreakdown:
 *                           type: object
 *                         chainBreakdown:
 *                           type: object
 *                         stabilityMetrics:
 *                           type: object
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/// **GET /analytics**
/// Comprehensive stablecoin ecosystem analytics and market intelligence
/// - **Security**: Read-only endpoint, no user input validation needed
/// - **Features**: Market cap breakdown, mechanism analysis, chain distribution
/// - **Analytics**: Stability metrics, risk distribution, growth rates
/// - **Performance**: Cached calculations with intelligent aggregation
router.get('/analytics', rateLimitMiddleware, stablecoinController.getAnalytics);

/**
 * @swagger
 * /api/v1/stablecoins/top:
 *   get:
 *     summary: Get top-performing stablecoins ranked by market capitalization
 *     description: |
 *       Retrieves the highest market cap stablecoins with comprehensive ranking data:
 *       
 *       **Ranking Methodology:**
 *       - Sorted by total market capitalization (highest first)
 *       - Real-time market cap calculations
 *       - Verified circulation and pricing data
 *       
 *       **Key Metrics Included:**
 *       - Current market capitalization in USD
 *       - Peg stability percentage (deviation from target)
 *       - Risk assessment level (low/medium/high)
 *       - Price accuracy and peg maintenance
 *       - Growth rates (daily, weekly, monthly)
 *       
 *       **Use Cases:**
 *       - Portfolio analysis and asset selection
 *       - Market dominance tracking
 *       - Investment research and due diligence
 *       - Dashboard and widget integration
 *       - Competitive analysis for protocols
 *       
 *       **Data Quality:**
 *       - Excludes detailed chain circulation for optimal performance
 *       - Focus on essential ranking and comparison metrics
 *       - Configurable result limits (1-50 stablecoins)
 *       
 *       Perfect for applications requiring quick access to market leaders
 *       and trending stablecoins in the DeFi ecosystem.
 *     tags: [Stablecoins]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *           maximum: 50
 *         description: Number of top stablecoins to return
 *     responses:
 *       200:
 *         description: Top stablecoins by market capitalization
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/StablecoinAsset'
 *       400:
 *         description: Invalid limit parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/// **GET /top**
/// Top stablecoins ranked by market capitalization
/// - **Security**: Limit validation (1-50), bounds checking
/// - **Features**: Automatic market cap sorting, clean response format
/// - **Performance**: Optimized for ranking, removes chain data
/// - **Use Cases**: Dashboard widgets, market overview displays
router.get('/top', rateLimitMiddleware, stablecoinController.getTopStablecoins);

/**
 * @swagger
 * /api/v1/stablecoins/depegged:
 *   get:
 *     summary: Get stablecoins that have lost their peg - Critical risk monitoring
 *     description: |
 *       **Risk Monitoring Endpoint** - Identifies stablecoins that have deviated from their intended peg:
 *       
 *       **Risk Assessment Features:**
 *       - Configurable stability threshold (default: 99% peg maintenance)
 *       - Real-time peg deviation detection
 *       - Priority sorting (worst stability first for immediate attention)
 *       - Historical stability tracking
 *       
 *       **Critical Use Cases:**
 *       - **Risk Management:** Portfolio risk assessment and exposure analysis
 *       - **Alert Systems:** Automated depegging notifications and warnings
 *       - **Market Monitoring:** Real-time stability surveillance for traders
 *       - **Due Diligence:** Pre-investment stability analysis
 *       - **Protocol Safety:** DeFi protocol risk management integration
 *       
 *       **Key Stability Metrics:**
 *       - Current peg stability percentage (deviation from target value)
 *       - Risk level classification (low/medium/high)
 *       - Market capitalization impact assessment
 *       - Price volatility and recovery patterns
 *       
 *       **Threshold Configuration:**
 *       - Adjustable stability threshold (0-100%)
 *       - Default 99% threshold captures meaningful depegging events
 *       - Lower thresholds for more sensitive monitoring
 *       - Higher thresholds for only severe depegging cases
 *       
 *       **Data Optimization:**
 *       - Streamlined response excludes chain circulation details
 *       - Focus on essential risk metrics for rapid analysis
 *       - Sorted by stability (worst performers first)
 *       
 *       **Critical for:** Risk managers, traders, DeFi protocols, and anyone 
 *       requiring real-time stablecoin stability monitoring and depegging alerts.
 *     tags: [Stablecoins]
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: number
 *           default: 99
 *           minimum: 0
 *           maximum: 100
 *         description: Stability threshold percentage
 *     responses:
 *       200:
 *         description: List of depegged stablecoins
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/StablecoinAsset'
 *       400:
 *         description: Invalid threshold parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/// **GET /depegged**
/// Risk monitoring endpoint for stablecoins that have lost their peg
/// - **Security**: Threshold validation (0-100%), parameter sanitization
/// - **Features**: Configurable stability threshold, worst-first sorting
/// - **Risk Management**: Optimized for monitoring and alert systems
/// - **Use Cases**: Risk dashboards, depegging alerts, portfolio analysis
router.get('/depegged', rateLimitMiddleware, stablecoinController.getDepeggedStablecoins);

export default router;