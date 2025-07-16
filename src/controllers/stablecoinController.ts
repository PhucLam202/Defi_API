import { Request, Response, NextFunction } from 'express';
import { stablecoinService } from '../services/stablecoinService';
import { ApiResponse, StablecoinAsset, StablecoinFilters, StablecoinAnalytics, ChainStablecoinResponse } from '../types';
import { AppError } from '../middleware/e/AppError';
import { ErrorCode } from '../middleware/e/ErrorCode';
import { InputValidator } from '../utils/inputValidator';

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
        sortBy = 'id', 
        sortOrder = 'asc',
        includeChainData = 'false',
        limit = '50',
        offset = '0'
      } = req.query;
      
      // Enhanced input validation and sanitization
      const validatedSortBy = InputValidator.validateSortBy(sortBy as string);
      const validatedSortOrder = InputValidator.validateSortOrder(sortOrder as string);
      const validatedIncludeChainData = InputValidator.validateBoolean(includeChainData as string);
      const validatedLimit = InputValidator.validateInteger(limit as string, 'limit', 1, 100);
      const validatedOffset = InputValidator.validateInteger(offset as string, 'offset', 0);
      
      // Validate and sanitize optional parameters
      let validatedPegType: string | undefined;
      if (pegType) {
        validatedPegType = InputValidator.validatePegType(pegType as string);
      }
      
      let validatedMechanism: string | undefined;
      if (mechanism) {
        validatedMechanism = InputValidator.validateMechanism(mechanism as string);
      }
      
      let validatedMinMarketCap: number | undefined;
      if (minMarketCap) {
        validatedMinMarketCap = InputValidator.validatePositiveNumber(minMarketCap as string, 'minMarketCap');
      }
      
      let validatedChain: string | undefined;
      if (chain) {
        validatedChain = InputValidator.sanitizeChainName(chain as string);
      }

      const filters: StablecoinFilters = {
        pegType: validatedPegType,
        mechanism: validatedMechanism,
        minMarketCap: validatedMinMarketCap,
        chain: validatedChain,
        sortBy: validatedSortBy,
        sortOrder: validatedSortOrder,
        includeChainData: validatedIncludeChainData,
        limit: validatedLimit,
        offset: validatedOffset
      };

      const stablecoins = await stablecoinService.getStablecoins(filters);

      // Remove chain circulating data if not requested
      const responseData = validatedIncludeChainData
        ? stablecoins 
        : stablecoins.map(({ chainCirculating, ...rest }) => rest);

      const response: ApiResponse<any[]> = {
        success: true,
        data: responseData,
        pagination: {
          page: Math.floor(validatedOffset / validatedLimit) + 1,
          limit: validatedLimit,
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
      
      // Enhanced input validation and sanitization
      const validatedSymbol = InputValidator.sanitizeAlphanumeric(symbol, 20);
      
      const stablecoin = await stablecoinService.getStablecoinBySymbol(validatedSymbol);

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
      
      // Enhanced input validation and sanitization
      const validatedId = InputValidator.sanitizeAlphanumeric(id, 50);
      
      const stablecoin = await stablecoinService.getStablecoinById(validatedId);

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
      
      // Enhanced input validation and sanitization
      const validatedChain = InputValidator.sanitizeChainName(chain);
      
      const stablecoins = await stablecoinService.getStablecoinsByChain(validatedChain);

      // Calculate chain-specific metrics
      const totalCirculation = stablecoins.reduce((sum, stablecoin) => {
        // Get circulation for this specific chain if available
        const chainData = stablecoin.chainCirculating[validatedChain] || 
                         stablecoin.chainCirculating[chain.toLowerCase()] ||
                         stablecoin.chainCirculating[Object.keys(stablecoin.chainCirculating).find(key => 
                           key.toLowerCase().includes(validatedChain.toLowerCase())
                         ) || ''];
        
        return sum + (chainData?.current?.peggedUSD || 0);
      }, 0);

      // Transform stablecoins to chain-focused format
      const chainStablecoins = stablecoins.map(stablecoin => {
        const chainData = stablecoin.chainCirculating[validatedChain] || 
                         stablecoin.chainCirculating[chain.toLowerCase()] ||
                         stablecoin.chainCirculating[Object.keys(stablecoin.chainCirculating).find(key => 
                           key.toLowerCase().includes(validatedChain.toLowerCase())
                         ) || ''];

        return {
          id: stablecoin.id,
          name: stablecoin.name,
          symbol: stablecoin.symbol,
          marketCap: stablecoin.marketCap,
          circulation: chainData?.current?.peggedUSD || 0,
          price: stablecoin.price,
          pegStability: stablecoin.pegStability,
          riskLevel: stablecoin.riskLevel
        };
      }).sort((a, b) => b.circulation - a.circulation); // Sort by circulation on this chain

      const chainResponse: ChainStablecoinResponse = {
        chain: chain,
        totalStablecoins: stablecoins.length,
        totalCirculation: totalCirculation,
        stablecoins: chainStablecoins
      };

      const response: ApiResponse<ChainStablecoinResponse> = {
        success: true,
        data: chainResponse,
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
      
      // Enhanced input validation
      const validatedLimit = InputValidator.validateInteger(limit as string, 'limit', 1, 50);

      const filters: StablecoinFilters = {
        sortBy: 'marketCap',
        sortOrder: 'desc',
        limit: validatedLimit,
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
          limit: validatedLimit,
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
      
      // Enhanced input validation
      const validatedThreshold = InputValidator.validateThreshold(threshold as string);

      const allStablecoins = await stablecoinService.getStablecoins({ limit: 1000 });
      const depeggedStablecoins = allStablecoins.filter(s => s.pegStability < validatedThreshold);

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