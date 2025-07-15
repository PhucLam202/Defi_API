import express, { Router } from 'express';
import { yieldsController } from '../../controllers/yieldsController';

/**
 * @swagger
 * components:
 *   schemas:
 *     Yield:
 *       type: object
 *       properties:
 *         symbol:
 *           type: string
 *           description: Symbol của yield
 *         apy:
 *           type: number
 *           description: Annual Percentage Yield
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Ngày cập nhật
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
 *     summary: Lấy danh sách tất cả yields
 *     tags: [Yields]
 *     responses:
 *       200:
 *         description: Danh sách yields
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Yield'
 *       400:
 *         description: Tham số không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       502:
 *         description: Lỗi từ API bên ngoài
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Lỗi hệ thống
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
 *     summary: Lấy yield theo symbol
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
 *         description: Yield tìm thấy
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
 *         description: Tham số không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Không tìm thấy yield
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       502:
 *         description: Lỗi từ API bên ngoài
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Lỗi hệ thống
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:symbol', yieldsController.getYieldBySymbol.bind(yieldsController));

export default router;