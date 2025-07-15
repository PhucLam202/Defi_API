import { Request, Response, NextFunction } from 'express';
import { stablecoinService } from '../services/stablecoinService';
import { ApiResponse, StablecoinAsset, StablecoinFilters, StablecoinAnalytics } from '../types';
import { AppError } from '../middleware/e/AppError';
import { ErrorCode } from '../middleware/e/ErrorCode';

export class StablecoinController {
  
  /**
   * @swagger
   * components:
   *   schemas:
   *     StablecoinAsset:
   *       type: object
   *       required:
   *         - id
   *         - name
   *         - symbol
   *         - pegType
   *         - pegMechanism
   *         - marketCap
   *         - price
   *         - pegStability
   *         - chains
   *         - riskLevel
   *         - updatedAt
   *       properties:
   *         id:
   *           type: string
   *           description: Unique identifier for the stablecoin
   *           example: "tether"
   *         name:
   *           type: string
   *           description: Full name of the stablecoin
   *           example: "Tether USD"
   *         symbol:
   *           type: string
   *           description: Symbol of the stablecoin
   *           example: "USDT"
   *         geckoId:
   *           type: string
   *           description: CoinGecko ID for the stablecoin
   *           example: "tether"
   *         pegType:
   *           type: string
   *           description: Type of peg (USD, EUR, GBP)
   *           example: "peggedUSD"
   *         pegMechanism:
   *           type: string
   *           description: Mechanism used to maintain peg
   *           example: "fiat-backed"
   *         marketCap:
   *           type: number
   *           description: Market capitalization in USD
   *           example: 83000000000
   *         price:
   *           type: number
   *           description: Current price in USD
   *           example: 1.001
   *         pegStability:
   *           type: number
   *           description: Stability percentage (0-100)
   *           example: 99.9
   *         circulation:
   *           type: object
   *           properties:
   *             current:
   *               type: number
   *               example: 83000000000
   *             prevDay:
   *               type: number
   *               example: 82500000000
   *             prevWeek:
   *               type: number
   *               example: 81000000000
   *             prevMonth:
   *               type: number
   *               example: 80000000000
   *         chains:
   *           type: array
   *           items:
   *             type: string
   *           example: ["ethereum", "tron", "bsc"]
   *         riskLevel:
   *           type: string
   *           enum: [low, medium, high]
   *           example: "low"
   *         growthRates:
   *           type: object
   *           properties:
   *             daily:
   *               type: number
   *               example: 0.6
   *             weekly:
   *               type: number
   *               example: 2.5
   *             monthly:
   *               type: number
   *               example: 3.8
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           example: "2023-12-01T10:30:00Z"
   */

  /**
   * Get all stablecoins with optional filtering and pagination
   * @route GET /api/v1/stablecoins
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  async getStablecoins(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        pegType, 
        mechanism, 
        minMarketCap, 
        chain, 
        sortBy = 'marketCap', 
        sortOrder = 'desc',
        includeChainData = 'false',
        limit = '50',
        offset = '0'
      } = req.query;
      
      // Input validation
      const validSortOptions = ['marketCap', 'stability', 'growth', 'name'];
      if (sortBy && !validSortOptions.includes(sortBy as string)) {
        throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid sortBy parameter. Must be "marketCap", "stability", "growth", or "name"');
      }

      const validSortOrders = ['asc', 'desc'];
      if (sortOrder && !validSortOrders.includes(sortOrder as string)) {
        throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid sortOrder parameter. Must be "asc" or "desc"');
      }

      // Validate and parse minMarketCap
      let minMarketCapNum: number | undefined;
      if (minMarketCap) {
        minMarketCapNum = parseFloat(minMarketCap as string);
        if (isNaN(minMarketCapNum) || minMarketCapNum < 0) {
          throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid minMarketCap parameter. Must be a positive number');
        }
      }

      // Validate and parse limit
      const limitNum = parseInt(limit as string);
      if (isNaN(limitNum) || limitNum <= 0 || limitNum > 100) {
        throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid limit parameter. Must be between 1 and 100');
      }

      // Validate and parse offset
      const offsetNum = parseInt(offset as string);
      if (isNaN(offsetNum) || offsetNum < 0) {
        throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid offset parameter. Must be a non-negative number');
      }

      const filters: StablecoinFilters = {
        pegType: pegType as string,
        mechanism: mechanism as string,
        minMarketCap: minMarketCapNum,
        chain: chain as string,
        sortBy: sortBy as 'marketCap' | 'stability' | 'growth' | 'name',
        sortOrder: sortOrder as 'asc' | 'desc',
        includeChainData: includeChainData === 'true',
        limit: limitNum,
        offset: offsetNum
      };

      const stablecoins = await stablecoinService.getStablecoins(filters);

      // Remove chain circulating data if not requested
      const responseData = filters.includeChainData 
        ? stablecoins 
        : stablecoins.map(({ chainCirculating, ...rest }) => rest);

      const response: ApiResponse<any[]> = {
        success: true,
        data: responseData,
        pagination: {
          page: Math.floor(offsetNum / limitNum) + 1,
          limit: limitNum,
          total: stablecoins.length
        },
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getStablecoinBySymbol(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { symbol } = req.params;
      
      // Input validation
      if (!symbol || symbol.trim() === '') {
        throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Symbol parameter is required');
      }
      
      // Sanitize symbol input
      const sanitizedSymbol = symbol.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
      if (sanitizedSymbol.length === 0) {
        throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid symbol format');
      }
      
      const stablecoin = await stablecoinService.getStablecoinBySymbol(sanitizedSymbol);

      if (!stablecoin) {
        throw AppError.newError404(ErrorCode.NOT_FOUND, `Stablecoin with symbol ${symbol} not found`);
      }

      const response: ApiResponse<StablecoinAsset> = {
        success: true,
        data: stablecoin,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getStablecoinById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      // Input validation
      if (!id || id.trim() === '') {
        throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'ID parameter is required');
      }
      
      // Sanitize ID input
      const sanitizedId = id.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
      if (sanitizedId.length === 0) {
        throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid ID format');
      }
      
      const stablecoin = await stablecoinService.getStablecoinById(sanitizedId);

      if (!stablecoin) {
        throw AppError.newError404(ErrorCode.NOT_FOUND, `Stablecoin with ID ${id} not found`);
      }

      const response: ApiResponse<StablecoinAsset> = {
        success: true,
        data: stablecoin,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getStablecoinsByChain(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { chain } = req.params;
      
      // Input validation
      if (!chain || chain.trim() === '') {
        throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Chain parameter is required');
      }
      
      // Sanitize chain input
      const sanitizedChain = chain.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 50);
      if (sanitizedChain.length === 0) {
        throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid chain format');
      }
      
      const stablecoins = await stablecoinService.getStablecoinsByChain(sanitizedChain);

      const response: ApiResponse<StablecoinAsset[]> = {
        success: true,
        data: stablecoins,
        pagination: {
          page: 1,
          limit: stablecoins.length,
          total: stablecoins.length
        },
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = await stablecoinService.getAnalytics();

      const response: ApiResponse<StablecoinAnalytics> = {
        success: true,
        data: analytics,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getTopStablecoins(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit = '10' } = req.query;
      
      // Validate limit
      const limitNum = parseInt(limit as string);
      if (isNaN(limitNum) || limitNum <= 0 || limitNum > 50) {
        throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid limit parameter. Must be between 1 and 50');
      }

      const filters: StablecoinFilters = {
        sortBy: 'marketCap',
        sortOrder: 'desc',
        limit: limitNum,
        offset: 0
      };

      const topStablecoins = await stablecoinService.getStablecoins(filters);

      // Remove chain circulating data for cleaner response
      const responseData = topStablecoins.map(({ chainCirculating, ...rest }) => rest);

      const response: ApiResponse<any[]> = {
        success: true,
        data: responseData,
        pagination: {
          page: 1,
          limit: limitNum,
          total: responseData.length
        },
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getDepeggedStablecoins(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { threshold = '99' } = req.query;
      
      // Validate threshold
      const thresholdNum = parseFloat(threshold as string);
      if (isNaN(thresholdNum) || thresholdNum < 0 || thresholdNum > 100) {
        throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid threshold parameter. Must be between 0 and 100');
      }

      const allStablecoins = await stablecoinService.getStablecoins({ limit: 1000 });
      const depeggedStablecoins = allStablecoins.filter(s => s.pegStability < thresholdNum);

      // Sort by stability (worst first)
      depeggedStablecoins.sort((a, b) => a.pegStability - b.pegStability);

      // Remove chain circulating data for cleaner response
      const responseData = depeggedStablecoins.map(({ chainCirculating, ...rest }) => rest);

      const response: ApiResponse<any[]> = {
        success: true,
        data: responseData,
        pagination: {
          page: 1,
          limit: responseData.length,
          total: responseData.length
        },
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const stablecoinController = new StablecoinController();