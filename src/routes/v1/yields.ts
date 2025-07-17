import express, { Router } from 'express';
import { yieldsController } from '../../controllers/yieldsController.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     Yield:
 *       type: object
 *       properties:
 *         symbol:
 *           type: string
 *           description: Yield symbol
 *         apy:
 *           type: number
 *           description: Annual Percentage Yield
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last updated date
 */

/**
 * @swagger
 * components:
 *   schemas:
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

const router: express.Router = Router();

/**
 * @swagger
 * /api/v1/yields:
 *   get:
 *     summary: Get all yields
 *     tags: [Yields]
 *     responses:
 *       200:
 *         description: List of yields
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Yield'
 *       400:
 *         description: Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       502:
 *         description: External API error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: System error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', yieldsController.getYields.bind(yieldsController));

/**
 * @swagger
 * /api/v1/yields/{symbol}:
 *   get:
 *     summary: Get yield by symbol
 *     tags: [Yields]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         description: Symbol của yield
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Yield found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Yield'
 *             example:
 *               success: true
 *               data:
 *                 symbol: "vDOT"
 *                 apy: 12.5
 *                 tvl: 1000000
 *                 updatedAt: "2025-07-15T05:57:21.243Z"
 *               timestamp: "2025-07-15T05:57:21.243Z"
 *       400:
 *         description: Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Yield not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       502:
 *         description: External API error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: System error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:symbol', yieldsController.getYieldBySymbol.bind(yieldsController));

export default router;