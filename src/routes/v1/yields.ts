import { Router } from 'express';
import { yieldsController } from '../../controllers/yieldsController';

const router = Router();

/**
 * @swagger
 * /api/v1/yields:
 *   get:
 *     summary: Get all token yields
 *     tags: [Yields]
 *     description: Retrieve yield information for all supported tokens with optional filtering and sorting
 *     parameters:
 *       - in: query
 *         name: minApy
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 1000
 *         description: Minimum APY filter (0-1000)
 *         example: 5.0
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [apy, tvl]
 *         description: Sort results by APY or TVL
 *         example: apy
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of results to return (1-100)
 *         example: 20
 *     responses:
 *       200:
 *         description: List of token yields
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
 *                         $ref: '#/components/schemas/TokenYield'
 *             example:
 *               success: true
 *               data:
 *                 - symbol: vDOT
 *                   protocol: Bifrost
 *                   network: Polkadot
 *                   apy: 12.5
 *                   apyBreakdown:
 *                     base: 10.0
 *                     reward: 2.5
 *                   tvl: 1000000.0
 *                   totalValueMinted: 500000.0
 *                   totalIssuance: 1000000.0
 *                   holders: 1500
 *                   price: 5.25
 *                   updatedAt: '2023-10-20T10:30:00.000Z'
 *               pagination:
 *                 page: 1
 *                 limit: 20
 *                 total: 20
 *               timestamp: '2023-10-20T10:30:00.000Z'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', yieldsController.getYields.bind(yieldsController));

/**
 * @swagger
 * /api/v1/yields/{symbol}:
 *   get:
 *     summary: Get yield information for a specific token
 *     tags: [Yields]
 *     description: Retrieve yield information for a specific token by symbol
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-zA-Z0-9]+$'
 *         description: Token symbol (e.g., vDOT, vKSM, vBNC)
 *         example: vDOT
 *     responses:
 *       200:
 *         description: Token yield information
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/TokenYield'
 *             example:
 *               success: true
 *               data:
 *                 symbol: vDOT
 *                 protocol: Bifrost
 *                 network: Polkadot
 *                 apy: 12.5
 *                 apyBreakdown:
 *                   base: 10.0
 *                   reward: 2.5
 *                 tvl: 1000000.0
 *                 totalValueMinted: 500000.0
 *                 totalIssuance: 1000000.0
 *                 holders: 1500
 *                 price: 5.25
 *                 updatedAt: '2023-10-20T10:30:00.000Z'
 *               timestamp: '2023-10-20T10:30:00.000Z'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:symbol', yieldsController.getYieldBySymbol.bind(yieldsController));

export default router;