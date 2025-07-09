import { Request, Response, NextFunction } from 'express';
import { bifrostService } from '../services/bifrostService';
import { ApiResponse, TokenYield } from '../types';
import { AppError } from '../middleware/e/AppError';
import { ErrorCode } from '../middleware/e/ErrorCode';

export class YieldsController {
  
  async getYields(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { minApy, sortBy = 'apy', limit = '20' } = req.query;
      
      // Input validation and sanitization
      const validSortOptions = ['apy', 'tvl'];
      if (sortBy && !validSortOptions.includes(sortBy as string)) {
        throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid sortBy parameter. Must be "apy" or "tvl"');
      }
      
      const rawData = await bifrostService.getSiteData();
      const supportedTokens = ['vDOT', 'vKSM', 'vBNC', 'vASTR', 'vMANTA', 'vETH', 'vETH2', 'vFIL', 'vPHA', 'vMOVR', 'vGLMR'];
      
      let yields = supportedTokens
        .map(token => bifrostService.transformToTokenYield(rawData, token))
        .filter((tokenYield): tokenYield is TokenYield => tokenYield !== null);

      // Apply filters with proper validation
      if (minApy) {
        const minApyNum = parseFloat(minApy as string);
        if (isNaN(minApyNum) || minApyNum < 0 || minApyNum > 1000) {
          throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid minApy parameter. Must be between 0 and 1000');
        }
        yields = yields.filter(y => y.apy >= minApyNum);
      }

      // Apply sorting
      if (sortBy === 'tvl') {
        yields.sort((a, b) => b.tvl - a.tvl);
      } else {
        yields.sort((a, b) => b.apy - a.apy);
      }

      // Apply limit with bounds checking
      const limitNum = parseInt(limit as string);
      if (isNaN(limitNum) || limitNum <= 0 || limitNum > 100) {
        throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid limit parameter. Must be between 1 and 100');
      }
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

  async getYieldBySymbol(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { symbol } = req.params;
      
      // Input validation and sanitization
      if (!symbol || symbol.trim() === '') {
        throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Symbol parameter is required');
      }
      
      // Sanitize symbol input - remove special characters and limit length
      const sanitizedSymbol = symbol.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
      if (sanitizedSymbol.length === 0) {
        throw AppError.newError400(ErrorCode.VALIDATION_ERROR, 'Invalid symbol format');
      }
      
      // Validate against supported tokens
      const supportedTokens = ['vDOT', 'vKSM', 'vBNC', 'vASTR', 'vMANTA', 'vETH', 'vETH2', 'vFIL', 'vPHA', 'vMOVR', 'vGLMR'];
      
      // Normalize symbol to match API format (vDOT, vKSM, etc.)
      const normalizedSymbol = sanitizedSymbol.toLowerCase().startsWith('v') ? 
        'v' + sanitizedSymbol.substring(1).toUpperCase() : 
        sanitizedSymbol.toUpperCase();
      
      if (!supportedTokens.includes(normalizedSymbol)) {
        throw AppError.newError404(ErrorCode.NOT_FOUND, `Token ${symbol} is not supported`);
      }
      
      const rawData = await bifrostService.getSiteData();
      const yieldData = bifrostService.transformToTokenYield(rawData, normalizedSymbol);

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
}

export const yieldsController = new YieldsController();