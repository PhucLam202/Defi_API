import axios from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { BifrostRawData, TokenYield } from '../types/index.js';
import { AppError } from '../middleware/e/AppError.js';
import { ErrorCode } from '../middleware/e/ErrorCode.js';

class BifrostService {
  private readonly baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor() {
    if (!config.bifrostApiUrl) {
      throw AppError.newError500(ErrorCode.UNKNOWN_ERROR, 'Bifrost API URL is not configured');
    }
    this.baseUrl = config.bifrostApiUrl;
  }
  

  private isValidCache(cacheKey: string, ttl: number): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < ttl * 1000;
  }

  private setCache(cacheKey: string, data: any): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  private getCache(cacheKey: string): any {
    return this.cache.get(cacheKey)?.data;
  }

  async getSiteData(): Promise<BifrostRawData> {
    const cacheKey = 'site-data';
    
    if (this.isValidCache(cacheKey, config.cacheTtl.overview)) {
      logger.debug('Returning cached Bifrost site data');
      return this.getCache(cacheKey);
    }

    try {
      logger.info('Fetching fresh data from Bifrost API');
      const response = await axios.get(`${this.baseUrl}/site`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'DeFi-Data-API/1.0'
        }
      });

      this.setCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch Bifrost data', { error: (error as Error).message });
      throw AppError.newRootError502(ErrorCode.AI_SERVICE_UNAVAILABLE, 'External API unavailable', error as Error);
    }
  }

  transformToTokenYield(rawData: BifrostRawData, symbol: string): TokenYield | null {
    const tokenData = rawData[symbol];
    if (!tokenData) return null;

    // Handle different APY structures based on token type
    let apy = 0;
    let apyBase = 0;
    let apyReward = 0;
    let mevApy: number | undefined;
    let gasApy: number | undefined;

    if (symbol === 'vETH') {
      apy = parseFloat(tokenData.totalApy || '0');
      apyBase = parseFloat(tokenData.stakingApy || '0');
      mevApy = parseFloat(tokenData.mevApy || '0');
      gasApy = parseFloat(tokenData.gasFeeApy || '0');
    } else if (symbol === 'vETH2') {
      apy = parseFloat(tokenData.apy || '0');
      apyBase = parseFloat(tokenData.apyBase || '0');
      mevApy = parseFloat(tokenData.apyMev || '0');
      gasApy = parseFloat(tokenData.apyGas || '0');
    } else {
      apy = parseFloat(tokenData.apy || tokenData.apyBase || '0');
      apyBase = parseFloat(tokenData.apyBase || '0');
      apyReward = parseFloat(tokenData.apyReward || '0');
    }

    return {
      symbol: symbol.toUpperCase(),
      protocol: 'bifrost',
      network: 'polkadot',
      apy,
      apyBreakdown: {
        base: apyBase,
        reward: apyReward,
        mev: mevApy,
        gas: gasApy
      },
      tvl: tokenData.tvl || 0,
      totalValueMinted: tokenData.tvm || 0,
      totalIssuance: tokenData.totalIssuance || 0,
      holders: tokenData.holders || 0,
      price: rawData.bncPrice || 0,
      updatedAt: new Date().toISOString()
    };
  }
}

export const bifrostService = new BifrostService();