import axios from 'axios';
import { logger } from '../utils/logger.js';
import { 
  DeFiLlamaStablecoinResponse, 
  DeFiLlamaStablecoin, 
  StablecoinAsset, 
  StablecoinFilters, 
  StablecoinAnalytics 
} from '../types/index.js';
import { AppError } from '../middleware/e/AppError.js';
import { ErrorCode } from '../middleware/e/ErrorCode.js';

class StablecoinService {
  private readonly baseUrl = 'https://stablecoins.llama.fi';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly cacheTtl = 300; // 5 minutes

  private isValidCache(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < this.cacheTtl * 1000;
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

  private sanitizeApiResponse(data: any): DeFiLlamaStablecoinResponse {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid API response format');
    }

    // Ensure peggedAssets is an array
    if (!Array.isArray(data.peggedAssets)) {
      throw new Error('Invalid peggedAssets format');
    }

    // Sanitize each asset
    const sanitizedAssets = data.peggedAssets.map((asset: any): any => {
      if (!asset || typeof asset !== 'object') {
        return null;
      }

      // Validate required fields
      if (!asset.id || !asset.name || !asset.symbol) {
        return null;
      }

      return {
        id: String(asset.id).substring(0, 100),
        name: String(asset.name).substring(0, 200),
        symbol: String(asset.symbol).substring(0, 20),
        gecko_id: asset.gecko_id ? String(asset.gecko_id).substring(0, 100) : undefined,
        pegType: String(asset.pegType || 'unknown').substring(0, 50),
        pegMechanism: String(asset.pegMechanism || 'unknown').substring(0, 50),
        priceSource: asset.priceSource ? String(asset.priceSource).substring(0, 100) : undefined,
        circulating: {
          peggedUSD: Math.max(0, parseFloat(asset.circulating?.peggedUSD || '0') || 0)
        },
        circulatingPrevDay: asset.circulatingPrevDay ? {
          peggedUSD: Math.max(0, parseFloat(asset.circulatingPrevDay.peggedUSD || '0') || 0)
        } : undefined,
        circulatingPrevWeek: asset.circulatingPrevWeek ? {
          peggedUSD: Math.max(0, parseFloat(asset.circulatingPrevWeek.peggedUSD || '0') || 0)
        } : undefined,
        circulatingPrevMonth: asset.circulatingPrevMonth ? {
          peggedUSD: Math.max(0, parseFloat(asset.circulatingPrevMonth.peggedUSD || '0') || 0)
        } : undefined,
        chainCirculating: this.sanitizeChainCirculating(asset.chainCirculating),
        chains: Array.isArray(asset.chains) 
          ? asset.chains.filter((chain: any) => typeof chain === 'string').slice(0, 20)
          : [],
        price: Math.max(0, parseFloat(asset.price || '0') || 0)
      };
    }).filter((asset: any) => asset !== null);

    return {
      peggedAssets: sanitizedAssets
    };
  }

  private sanitizeChainCirculating(chainData: any): any {
    if (!chainData || typeof chainData !== 'object') {
      return {};
    }

    const sanitized: any = {};
    
    // Limit to 50 chains to prevent memory issues
    const chainKeys = Object.keys(chainData).slice(0, 50);
    
    for (const chainName of chainKeys) {
      const chain = chainData[chainName];
      if (chain && typeof chain === 'object') {
        sanitized[chainName] = {
          current: {
            peggedUSD: Math.max(0, parseFloat(chain.current?.peggedUSD || '0') || 0)
          },
          circulatingPrevDay: chain.circulatingPrevDay ? {
            peggedUSD: Math.max(0, parseFloat(chain.circulatingPrevDay.peggedUSD || '0') || 0)
          } : undefined,
          circulatingPrevWeek: chain.circulatingPrevWeek ? {
            peggedUSD: Math.max(0, parseFloat(chain.circulatingPrevWeek.peggedUSD || '0') || 0)
          } : undefined,
          circulatingPrevMonth: chain.circulatingPrevMonth ? {
            peggedUSD: Math.max(0, parseFloat(chain.circulatingPrevMonth.peggedUSD || '0') || 0)
          } : undefined,
        };
      }
    }

    return sanitized;
  }

  async fetchStablecoinsData(): Promise<DeFiLlamaStablecoinResponse> {
    const cacheKey = 'stablecoins-data';
    
    if (this.isValidCache(cacheKey)) {
      logger.debug('Returning cached stablecoin data');
      return this.getCache(cacheKey);
    }

    try {
      logger.info('Fetching fresh data from DeFiLlama stablecoins API');
      
      // Enhanced security for external API calls
      const response = await axios.get(`${this.baseUrl}/stablecoins`, {
        timeout: 10000, // Reduced timeout to prevent resource exhaustion
        maxRedirects: 3, // Limit redirects to prevent redirect loops
        maxContentLength: 10 * 1024 * 1024, // 10MB limit
        maxBodyLength: 10 * 1024 * 1024, // 10MB limit
        validateStatus: (status) => status >= 200 && status < 300, // Only accept 2xx status codes
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'DeFi-Data-API/1.0.0',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache',
          'Connection': 'close'
        },
        params: {
          includePrices: 'true'
        },
        // Enhanced security options
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: true, // Validate SSL certificates
          secureProtocol: 'TLSv1_2_method', // Use TLS 1.2 minimum
          ciphers: 'HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA' // Strong ciphers only
        })
      });

      // Validate response structure
      if (!response.data || !response.data.peggedAssets || !Array.isArray(response.data.peggedAssets)) {
        throw new Error('Invalid response structure from DeFiLlama API');
      }

      // Sanitize response data
      const sanitizedData = this.sanitizeApiResponse(response.data);
      
      this.setCache(cacheKey, sanitizedData);
      return sanitizedData;
    } catch (error) {
      logger.error('Failed to fetch stablecoin data', { 
        error: (error as Error).message,
        url: `${this.baseUrl}/stablecoins`,
        timeout: 10000
      });
      
      // Return cached data if available as fallback
      if (this.cache.has(cacheKey)) {
        logger.warn('Returning stale cached data due to API failure');
        return this.getCache(cacheKey);
      }
      
      throw AppError.newRootError502(ErrorCode.AI_SERVICE_UNAVAILABLE, 'DeFiLlama API unavailable', error as Error);
    }
  }

  private calculatePegStability(price: number, pegType: string): number {
    if (!price) return 0;
    
    let targetPrice = 1;
    if (pegType.includes('EUR')) targetPrice = 1.1; // Approximate EUR/USD
    else if (pegType.includes('GBP')) targetPrice = 1.25; // Approximate GBP/USD
    
    const deviation = Math.abs(price - targetPrice) / targetPrice;
    const stability = Math.max(0, Math.min(100, 100 - (deviation * 10000)));
    
    return Math.round(stability * 100) / 100;
  }

  private calculateRiskLevel(mechanism: string, stability: number, marketCap: number): 'low' | 'medium' | 'high' {
    if (mechanism === 'fiat-backed' && stability > 99.5 && marketCap > 1000000000) return 'low';
    if (mechanism === 'crypto-backed' && stability > 98 && marketCap > 100000000) return 'low';
    if (mechanism === 'algorithmic' || stability < 95) return 'high';
    return 'medium';
  }

  private calculateGrowthRates(current: number, prevDay?: number, prevWeek?: number, prevMonth?: number) {
    return {
      daily: prevDay ? ((current - prevDay) / prevDay) * 100 : undefined,
      weekly: prevWeek ? ((current - prevWeek) / prevWeek) * 100 : undefined,
      monthly: prevMonth ? ((current - prevMonth) / prevMonth) * 100 : undefined,
    };
  }

  private transformStablecoin(rawStablecoin: DeFiLlamaStablecoin): StablecoinAsset {
    const marketCap = rawStablecoin.circulating.peggedUSD;
    const pegStability = this.calculatePegStability(rawStablecoin.price, rawStablecoin.pegType);
    const riskLevel = this.calculateRiskLevel(rawStablecoin.pegMechanism, pegStability, marketCap);
    const growthRates = this.calculateGrowthRates(
      marketCap,
      rawStablecoin.circulatingPrevDay?.peggedUSD,
      rawStablecoin.circulatingPrevWeek?.peggedUSD,
      rawStablecoin.circulatingPrevMonth?.peggedUSD
    );

    return {
      id: rawStablecoin.id,
      name: rawStablecoin.name,
      symbol: rawStablecoin.symbol,
      geckoId: rawStablecoin.gecko_id,
      pegType: rawStablecoin.pegType,
      pegMechanism: rawStablecoin.pegMechanism,
      priceSource: rawStablecoin.priceSource,
      marketCap,
      price: rawStablecoin.price,
      pegStability,
      circulation: {
        current: marketCap,
        prevDay: rawStablecoin.circulatingPrevDay?.peggedUSD,
        prevWeek: rawStablecoin.circulatingPrevWeek?.peggedUSD,
        prevMonth: rawStablecoin.circulatingPrevMonth?.peggedUSD,
      },
      chains: rawStablecoin.chains,
      chainCirculating: rawStablecoin.chainCirculating,
      riskLevel,
      growthRates,
      updatedAt: new Date().toISOString()
    };
  }

  async getStablecoins(filters: StablecoinFilters = {}): Promise<StablecoinAsset[]> {
    const rawData = await this.fetchStablecoinsData();
    let stablecoins = rawData.peggedAssets.map(asset => this.transformStablecoin(asset));

    // Apply filters
    if (filters.pegType) {
      stablecoins = stablecoins.filter(s => s.pegType.toLowerCase().includes(filters.pegType!.toLowerCase()));
    }

    if (filters.mechanism) {
      stablecoins = stablecoins.filter(s => s.pegMechanism.toLowerCase().includes(filters.mechanism!.toLowerCase()));
    }

    if (filters.minMarketCap) {
      stablecoins = stablecoins.filter(s => s.marketCap >= filters.minMarketCap!);
    }

    if (filters.chain) {
      stablecoins = stablecoins.filter(s => 
        s.chains.some(chain => chain.toLowerCase().includes(filters.chain!.toLowerCase()))
      );
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'id';
    const sortOrder = filters.sortOrder || 'asc';
    
    stablecoins.sort((a, b) => {
      let valueA: number;
      let valueB: number;
      
      switch (sortBy) {
        case 'id':
          // Smart ID comparison: numeric IDs sorted numerically, non-numeric alphabetically
          const aIsNumeric = /^\d+$/.test(a.id);
          const bIsNumeric = /^\d+$/.test(b.id);
          
          if (aIsNumeric && bIsNumeric) {
            // Both are numeric, sort as numbers
            const aNum = parseInt(a.id, 10);
            const bNum = parseInt(b.id, 10);
            return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
          } else if (aIsNumeric && !bIsNumeric) {
            // Numeric IDs come first
            return sortOrder === 'asc' ? -1 : 1;
          } else if (!aIsNumeric && bIsNumeric) {
            // Numeric IDs come first
            return sortOrder === 'asc' ? 1 : -1;
          } else {
            // Both are non-numeric, sort alphabetically
            return sortOrder === 'asc' 
              ? a.id.localeCompare(b.id)
              : b.id.localeCompare(a.id);
          }
        case 'stability':
          valueA = a.pegStability;
          valueB = b.pegStability;
          break;
        case 'growth':
          valueA = a.growthRates.daily || 0;
          valueB = b.growthRates.daily || 0;
          break;
        case 'name':
          return sortOrder === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        default: // marketCap
          valueA = a.marketCap;
          valueB = b.marketCap;
      }
      
      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    });

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    
    return stablecoins.slice(offset, offset + limit);
  }

  async getStablecoinBySymbol(symbol: string): Promise<StablecoinAsset | null> {
    const rawData = await this.fetchStablecoinsData();
    const found = rawData.peggedAssets.find(asset => 
      asset.symbol.toLowerCase() === symbol.toLowerCase()
    );
    
    return found ? this.transformStablecoin(found) : null;
  }

  async getStablecoinById(id: string): Promise<StablecoinAsset | null> {
    const rawData = await this.fetchStablecoinsData();
    const found = rawData.peggedAssets.find(asset => asset.id === id);
    
    return found ? this.transformStablecoin(found) : null;
  }

  async getStablecoinsByChain(chainName: string): Promise<StablecoinAsset[]> {
    const allStablecoins = await this.getStablecoins();
    return allStablecoins.filter(stablecoin => 
      stablecoin.chains.some(chain => 
        chain.toLowerCase().includes(chainName.toLowerCase())
      )
    );
  }

  async getAnalytics(): Promise<StablecoinAnalytics> {
    const allStablecoins = await this.getStablecoins({ limit: 1000 });
    
    const totalMarketCap = allStablecoins.reduce((sum, s) => sum + s.marketCap, 0);
    const totalStablecoins = allStablecoins.length;

    // Mechanism breakdown
    const mechanismBreakdown: { [key: string]: { count: number; marketCap: number; percentage: number } } = {};
    allStablecoins.forEach(s => {
      if (!mechanismBreakdown[s.pegMechanism]) {
        mechanismBreakdown[s.pegMechanism] = { count: 0, marketCap: 0, percentage: 0 };
      }
      mechanismBreakdown[s.pegMechanism].count++;
      mechanismBreakdown[s.pegMechanism].marketCap += s.marketCap;
    });

    Object.keys(mechanismBreakdown).forEach(mechanism => {
      mechanismBreakdown[mechanism].percentage = 
        (mechanismBreakdown[mechanism].marketCap / totalMarketCap) * 100;
    });

    // Chain breakdown
    const chainBreakdown: { [key: string]: { stablecoins: number; totalCirculation: number; percentage: number } } = {};
    allStablecoins.forEach(s => {
      s.chains.forEach(chain => {
        if (!chainBreakdown[chain]) {
          chainBreakdown[chain] = { stablecoins: 0, totalCirculation: 0, percentage: 0 };
        }
        chainBreakdown[chain].stablecoins++;
        
        const chainData = s.chainCirculating[chain];
        if (chainData) {
          chainBreakdown[chain].totalCirculation += chainData.current.peggedUSD;
        }
      });
    });

    Object.keys(chainBreakdown).forEach(chain => {
      chainBreakdown[chain].percentage = 
        (chainBreakdown[chain].totalCirculation / totalMarketCap) * 100;
    });

    // Stability metrics
    const averageStability = allStablecoins.reduce((sum, s) => sum + s.pegStability, 0) / totalStablecoins;
    const depeggedCount = allStablecoins.filter(s => s.pegStability < 99).length;
    
    const riskDistribution = {
      low: allStablecoins.filter(s => s.riskLevel === 'low').length,
      medium: allStablecoins.filter(s => s.riskLevel === 'medium').length,
      high: allStablecoins.filter(s => s.riskLevel === 'high').length,
    };

    return {
      totalMarketCap,
      totalStablecoins,
      mechanismBreakdown,
      chainBreakdown,
      stabilityMetrics: {
        averageStability,
        depeggedCount,
        riskDistribution
      },
      updatedAt: new Date().toISOString()
    };
  }
}

export const stablecoinService = new StablecoinService();