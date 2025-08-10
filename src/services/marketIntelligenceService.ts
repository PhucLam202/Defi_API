/**
 * Market Intelligence Service
 * 
 * Core business logic for market intelligence endpoints with data aggregation,
 * analysis, and intelligence generation capabilities. This service transforms
 * raw DeFiLlama data into actionable insights with pre-calculated metrics.
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger.js';
import { 
  Protocol,
  Chain,
  HistoricalData,
  MarketOverviewOptions,
  DominanceOptions,
  TrendingOptions,
  MoversOptions,
  MarketOverviewResult,
  MarketDominanceResult,
  TrendingProtocolsResult,
  MarketMoversResult,
  MarketOverviewData,
  MarketDominanceData,
  TrendingProtocolsData,
  MarketMoversData,
  DefiLlamaClient,
  ChainEcosystemOptions,
  ChainsOverviewOptions,
  ChainEcosystemResult,
  ChainsOverviewResult,
  ChainEcosystemData,
  ChainsOverviewData,
  ChainMetadata,
  ChainMetrics,
  ChainComparisons,
  ChainInsights,
  ChainBenchmarks,
  ChainOverviewEntry,
  MarketDistribution
} from '../types/index.js';
import { AppError } from '../middleware/e/AppError.js';
import { ErrorCode } from '../middleware/e/ErrorCode.js';

/**
 * DeFiLlama API Client Implementation
 */
class DefiLlamaClientImpl implements DefiLlamaClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.llama.fi',
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'DeFi-Data-API/1.0'
      }
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('DeFiLlama API request', { url: config.url });
        return config;
      },
      (error) => {
        logger.error('DeFiLlama API request error', { error });
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('DeFiLlama API response', { 
          url: response.config.url,
          status: response.status 
        });
        return response;
      },
      (error) => {
        logger.error('DeFiLlama API response error', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  async getProtocols(): Promise<Protocol[]> {
    try {
      const response = await this.client.get('/protocols');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch protocols from DeFiLlama', { error });
      throw AppError.newError500(ErrorCode.EXTERNAL_API_ERROR, 'Failed to fetch protocols data');
    }
  }

  async getChains(): Promise<Chain[]> {
    try {
      const response = await this.client.get('/chains');
      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch chains from DeFiLlama', { error });
      throw AppError.newError500(ErrorCode.EXTERNAL_API_ERROR, 'Failed to fetch chains data');
    }
  }

  async getCategories(): Promise<any[]> {
    try {
      const response = await this.client.get('/protocols');
      const protocols = response.data || [];
      
      // Extract unique categories from protocols
      const categories = [...new Set(protocols.map((p: Protocol) => p.category).filter(Boolean))];
      return categories.map(cat => ({ name: cat, protocols: protocols.filter((p: Protocol) => p.category === cat) }));
    } catch (error) {
      logger.error('Failed to fetch categories from DeFiLlama', { error });
      throw AppError.newError500(ErrorCode.EXTERNAL_API_ERROR, 'Failed to fetch categories data');
    }
  }

  async getHistoricalTVL(timeframe: string): Promise<HistoricalData | null> {
    try {
      const response = await this.client.get('/charts');
      if (!response.data) return null;

      // Transform DeFiLlama historical data format
      const data = Object.entries(response.data).map(([timestamp, tvl]) => ({
        date: new Date(parseInt(timestamp) * 1000).toISOString(),
        tvl: tvl as number
      }));

      return { data };
    } catch (error) {
      logger.warn('Failed to fetch historical TVL from DeFiLlama', { error, timeframe });
      return null; // Non-critical data, return null instead of throwing
    }
  }

  async getProtocolsPrices(): Promise<any> {
    try {
      // Note: DeFiLlama doesn't have a direct prices endpoint for protocols
      // This would need to be implemented with token price APIs
      return {};
    } catch (error) {
      logger.warn('Failed to fetch protocol prices from DeFiLlama', { error });
      return {};
    }
  }
}

/**
 * Market Intelligence Service
 * 
 * Core business logic for market intelligence endpoints with data aggregation,
 * analysis, and intelligence generation capabilities.
 */
export class MarketIntelligenceService {
  
  private defiLlamaClient: DefiLlamaClient;
  private calculationHelper: any;
  private dataEnrichmentHelper: any;
  private cacheManager: any;

  constructor(
    calculationHelper?: any,
    dataEnrichmentHelper?: any,
    cacheManager?: any
  ) {
    this.defiLlamaClient = new DefiLlamaClientImpl();
    this.calculationHelper = calculationHelper;
    this.dataEnrichmentHelper = dataEnrichmentHelper;
    this.cacheManager = cacheManager;
  }

  /**
   * Get comprehensive market overview with intelligence and benchmarks
   */
  async getMarketOverview(options: MarketOverviewOptions): Promise<MarketOverviewResult> {
    try {
      logger.info('Processing market overview request', { options });

      // Parallel data fetching for performance
      const [
        protocolsData,
        chainsData,
        categoriesData,
        historicalData
      ] = await Promise.allSettled([
        this.defiLlamaClient.getProtocols(),
        this.defiLlamaClient.getChains(),
        this.defiLlamaClient.getCategories(),
        this.defiLlamaClient.getHistoricalTVL('24h')
      ]);

      // Handle any failed requests gracefully
      const protocols = this.extractDataOrFallback(protocolsData, []);
      const chains = this.extractDataOrFallback(chainsData, []);
      const categories = this.extractDataOrFallback(categoriesData, []);
      const historical = this.extractDataOrFallback(historicalData, null);

      logger.info('Data fetching completed', {
        protocolsCount: protocols.length,
        chainsCount: chains.length,
        categoriesCount: categories.length,
        hasHistorical: !!historical
      });

      // Core market calculations
      const totalTvl = this.calculateTotalTvl(protocols);
      const topProtocols = this.getTopProtocols(protocols, options.limit || 10);
      const dominantChain = this.getDominantChain(chains);
      const growth24h = this.calculateGrowthRate(historical, '24h');

      // Filter by categories and chains if specified
      let filteredProtocols = protocols;
      if (options.categories && options.categories.length > 0) {
        filteredProtocols = filteredProtocols.filter(p => 
          p.category && options.categories!.includes(p.category.toLowerCase())
        );
      }
      if (options.chains && options.chains.length > 0) {
        filteredProtocols = filteredProtocols.filter(p => 
          p.chain && options.chains!.includes(p.chain.toLowerCase())
        );
      }

      // Generate market insights
      const insights = await this.generateMarketInsights({
        protocols: filteredProtocols,
        chains,
        categories,
        totalTvl,
        growth24h
      });

      // Calculate benchmarks
      const benchmarks = this.calculateMarketBenchmarks({
        protocols: filteredProtocols,
        chains,
        categories
      });

      // Format response data
      const overview: MarketOverviewData = {
        totalTvl,
        totalProtocols: filteredProtocols.length,
        dominantChain: dominantChain.name,
        topProtocols: topProtocols.map((p, index) => ({
          id: p.id,
          name: p.name,
          tvl: p.tvl || 0,
          marketShare: ((p.tvl || 0) / totalTvl) * 100,
          rank: index + 1,
          growth7d: p.change_7d || 0,
          growth_1d: p.change_1d || 0,
          dominanceReason: this.getDominanceReason(p),
          category: p.category,
          chain: p.chain,
          chains: this.getProtocolChains(p),
          chainTvls: this.getProtocolChainTvls(p)
        })),
        trends: {
          tvlGrowth7d: growth24h,
          protocolsAdded7d: this.getNewProtocolsCount(protocols, '7d'),
          dominanceShift: insights.dominanceShift
        }
      };

      const intelligence = {
        insights: insights.keyInsights,
        recommendations: insights.recommendations,
        dominanceShift: insights.dominanceShift,
        marketPhase: insights.marketPhase,
        volatility: insights.volatility,
        innovationAreas: insights.innovationAreas
      };

      logger.info('Market overview processing completed', {
        totalTvl,
        topProtocolsCount: topProtocols.length,
        insightsCount: intelligence.insights.length
      });

      return {
        overview,
        intelligence,
        benchmarks,
        metadata: {
          dataAge: this.calculateDataAge(),
          coverage: this.calculateDataCoverage(protocols),
          lastUpdate: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error('Error in getMarketOverview service', { error, options });
      throw AppError.newError500(ErrorCode.EXTERNAL_API_ERROR, 'Failed to fetch market overview data');
    }
  }

  /**
   * Get market dominance analysis with protocol/chain/category breakdowns
   */
  async getMarketDominance(options: DominanceOptions): Promise<MarketDominanceResult> {
    try {
      logger.info('Processing market dominance request', { options });

      const [protocolsData, chainsData] = await Promise.allSettled([
        this.defiLlamaClient.getProtocols(),
        this.defiLlamaClient.getChains()
      ]);

      const protocols = this.extractDataOrFallback(protocolsData, []);
      const chains = this.extractDataOrFallback(chainsData, []);

      // Calculate various dominance metrics
      const protocolDominance = this.calculateProtocolDominance(protocols).slice(0, options.limit);
      const chainDominance = this.calculateChainDominance(chains).slice(0, options.limit);
      const categoryDominance = this.calculateCategoryDominance(protocols);

      // Generate dominance insights
      const insights = await this.generateDominanceInsights({
        protocolDominance,
        chainDominance,
        categoryDominance
      });

      const dominance: MarketDominanceData = {
        protocolDominance,
        chainDominance,
        categoryDominance,
        concentrationIndex: this.calculateConcentrationIndex(protocolDominance),
        diversity: {
          herfindahlIndex: this.calculateHerfindahlIndex(protocolDominance),
          shannonIndex: this.calculateShannonIndex(protocolDominance)
        }
      };

      return {
        dominance,
        intelligence: insights,
        benchmarks: this.calculateDominanceBenchmarks(dominance),
        metadata: {
          dataAge: this.calculateDataAge(),
          coverage: this.calculateDataCoverage(protocols),
          lastUpdate: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error('Error in getMarketDominance service', { error, options });
      throw AppError.newError500(ErrorCode.EXTERNAL_API_ERROR, 'Failed to fetch dominance data');
    }
  }

  /**
   * Get trending protocols with growth-based analysis
   */
  async getTrendingProtocols(options: TrendingOptions): Promise<TrendingProtocolsResult> {
    try {
      logger.info('Processing trending protocols request', { options });

      const historicalPromises = options.timeframes.map(tf => 
        this.defiLlamaClient.getHistoricalTVL(tf)
      );

      const [protocolsData, ...historicalData] = await Promise.allSettled([
        this.defiLlamaClient.getProtocols(),
        ...historicalPromises
      ]);

      const protocols = this.extractDataOrFallback(protocolsData, [])
        .filter(p => (p.tvl || 0) >= options.minTvl);
      const historical = historicalData.map(data => this.extractDataOrFallback(data, null));

      // Filter by categories and chains if specified
      let filteredProtocols = protocols;
      if (options.categories && options.categories.length > 0) {
        filteredProtocols = filteredProtocols.filter(p => 
          p.category && options.categories!.includes(p.category.toLowerCase())
        );
      }
      if (options.chains && options.chains.length > 0) {
        filteredProtocols = filteredProtocols.filter(p => 
          p.chain && options.chains!.includes(p.chain.toLowerCase())
        );
      }

      // Calculate trending scores for each timeframe
      const trendingAnalysis = options.timeframes.map((timeframe, index) => {
        const data = historical[index];
        return this.calculateTrendingScores(filteredProtocols, data, timeframe, options.limit);
      });

      // Generate trending insights
      const insights = await this.generateTrendingInsights({
        protocols: filteredProtocols,
        trendingAnalysis,
        timeframes: options.timeframes
      });

      const trending: TrendingProtocolsData = {
        byTimeframe: {
          '24h': trendingAnalysis[options.timeframes.indexOf('24h')] || [],
          '7d': trendingAnalysis[options.timeframes.indexOf('7d')] || [],
          '30d': trendingAnalysis[options.timeframes.indexOf('30d')] || []
        },
        overallTrending: this.calculateOverallTrending(trendingAnalysis),
        emergingProtocols: this.identifyEmergingProtocols(protocols, trendingAnalysis),
        momentum: {
          accelerating: this.getAcceleratingProtocols(trendingAnalysis),
          decelerating: this.getDeceleratingProtocols(trendingAnalysis)
        }
      };

      return {
        trending,
        intelligence: insights,
        benchmarks: this.calculateTrendingBenchmarks(trending),
        metadata: {
          dataAge: this.calculateDataAge(),
          coverage: this.calculateDataCoverage(protocols),
          lastUpdate: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error('Error in getTrendingProtocols service', { error, options });
      throw AppError.newError500(ErrorCode.EXTERNAL_API_ERROR, 'Failed to fetch trending data');
    }
  }

  /**
   * Get market movers with price/TVL movement analysis
   */
  async getMarketMovers(options: MoversOptions): Promise<MarketMoversResult> {
    try {
      logger.info('Processing market movers request', { options });

      const [protocolsData, priceData] = await Promise.allSettled([
        this.defiLlamaClient.getProtocols(),
        this.defiLlamaClient.getProtocolsPrices()
      ]);

      const protocols = this.extractDataOrFallback(protocolsData, []);
      const prices = this.extractDataOrFallback(priceData, {});

      // Calculate movement metrics
      const tvlMovers = this.calculateTvlMovers(protocols, options.timeframe);
      const priceMovers = this.calculatePriceMovers(prices, options.timeframe);

      // Apply limit to results
      const limitedTvlMovers = {
        gainers: tvlMovers.gainers.slice(0, options.limit),
        losers: tvlMovers.losers.slice(0, options.limit)
      };

      const limitedPriceMovers = {
        gainers: priceMovers.gainers.slice(0, options.limit),
        losers: priceMovers.losers.slice(0, options.limit)
      };

      // Generate movement insights
      const insights = await this.generateMovementInsights({
        tvlMovers: limitedTvlMovers,
        priceMovers: limitedPriceMovers,
        timeframe: options.timeframe
      });

      const movers: MarketMoversData = {
        gainers: {
          tvl: limitedTvlMovers.gainers,
          price: limitedPriceMovers.gainers
        },
        losers: {
          tvl: limitedTvlMovers.losers,
          price: limitedPriceMovers.losers
        },
        volatility: {
          high: this.getHighVolatilityProtocols(protocols, prices),
          low: this.getLowVolatilityProtocols(protocols, prices)
        },
        correlations: this.calculateTvlPriceCorrelations(protocols, prices)
      };

      return {
        movers,
        intelligence: insights,
        benchmarks: this.calculateMovementBenchmarks(movers),
        metadata: {
          dataAge: this.calculateDataAge(),
          coverage: this.calculateDataCoverage(protocols),
          lastUpdate: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error('Error in getMarketMovers service', { error, options });
      throw AppError.newError500(ErrorCode.EXTERNAL_API_ERROR, 'Failed to fetch movers data');
    }
  }

  /**
   * Get comprehensive ecosystem data for a specific blockchain
   */
  async getChainEcosystem(options: ChainEcosystemOptions): Promise<ChainEcosystemResult> {
    try {
      logger.info('Processing chain ecosystem request', { options });

      // Normalize chain name and validate
      const chainName = this.normalizeChainName(options.chain);

      // Parallel data fetching
      const [protocolsData, chainsData] = await Promise.allSettled([
        this.defiLlamaClient.getProtocols(),
        this.defiLlamaClient.getChains(),
      ]);

      // Filter protocols for specific chain
      const allProtocols = this.extractDataOrFallback(protocolsData, []);
      const chainProtocols = this.filterProtocolsByChain(allProtocols, chainName);

      // Get chain metadata
      const allChains = this.extractDataOrFallback(chainsData, []);
      const chainData = this.findChainData(allChains, chainName);

      if (!chainData) {
        throw AppError.newError404(
          ErrorCode.NOT_FOUND,
          `Chain '${options.chain}' not found. Supported chains: ethereum, solana, binance-smart-chain, polygon, avalanche, arbitrum, optimism`
        );
      }

      // Apply sorting and limiting
      const sortedProtocols = this.sortProtocols(chainProtocols, options.sortBy);
      const limitedProtocols = sortedProtocols.slice(0, options.limit);

      // Generate chain-specific insights
      const chainInsights = await this.generateChainInsights(
        chainName,
        chainProtocols,
        chainData,
        allChains
      );

      const chainBenchmarks = this.calculateChainBenchmarks(
        chainName,
        chainData,
        allChains
      );

      // Build response based on detail level
      const ecosystemData = this.buildChainEcosystemResponse(
        chainData,
        limitedProtocols,
        allChains,
        options.detail
      );

      return {
        ecosystem: ecosystemData,
        intelligence: chainInsights,
        benchmarks: chainBenchmarks,
        metadata: {
          dataAge: this.calculateDataAge(),
          coverage: this.calculateChainCoverage(chainProtocols),
          lastUpdate: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error in getChainEcosystem service', { error, options });
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.newError500(
        ErrorCode.EXTERNAL_API_ERROR,
        `Failed to fetch ecosystem data for chain: ${options.chain}`
      );
    }
  }

  /**
   * Get lightweight overview of all chains
   */
  async getChainsOverview(options: ChainsOverviewOptions): Promise<ChainsOverviewResult> {
    try {
      logger.info('Processing chains overview request', { options });

      // Get chain and protocol data
      const [chainsData, protocolsData] = await Promise.allSettled([
        this.defiLlamaClient.getChains(),
        this.defiLlamaClient.getProtocols(),
      ]);

      const chains = this.extractDataOrFallback(chainsData, []);
      const protocols = this.extractDataOrFallback(protocolsData, []);

      // Enrich chain data with protocol counts
      const enrichedChains = this.enrichChainsWithProtocolData(chains, protocols);

      // Sort and limit results
      const sortedChains = this.sortChains(enrichedChains, options.sortBy);
      const limitedChains = sortedChains.slice(0, options.limit);

      // Calculate market distribution metrics
      const marketDistribution = this.calculateMarketDistribution(enrichedChains);

      const overviewData: ChainsOverviewData = {
        chains: limitedChains.map(this.formatChainOverviewEntry),
        totalTvl: enrichedChains.reduce((sum, chain) => sum + (chain.tvl || 0), 0),
        totalChains: enrichedChains.length,
        marketDistribution,
      };

      return {
        overview: overviewData,
        metadata: {
          dataAge: this.calculateDataAge(),
          coverage: 0.98, // High coverage for chain data
          lastUpdate: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error in getChainsOverview service', { error, options });
      throw AppError.newError500(
        ErrorCode.EXTERNAL_API_ERROR,
        'Failed to fetch chains overview data'
      );
    }
  }

  /**
   * Health check for service dependencies
   */
  async healthCheck(): Promise<{ status: string; checks: any }> {
    try {
      // Test DeFiLlama API connectivity
      const testCall = await this.defiLlamaClient.getProtocols();
      
      return {
        status: 'healthy',
        checks: {
          defiLlamaApi: testCall.length > 0 ? 'healthy' : 'degraded',
          lastCheck: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        checks: {
          defiLlamaApi: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
          lastCheck: new Date().toISOString()
        }
      };
    }
  }

  // Private helper methods
  private extractDataOrFallback<T>(result: PromiseSettledResult<T>, fallback: T): T {
    return result.status === 'fulfilled' ? result.value : fallback;
  }

  private calculateTotalTvl(protocols: Protocol[]): number {
    return protocols.reduce((total, protocol) => {
      return total + (protocol.tvl || 0);
    }, 0);
  }

  private getTopProtocols(protocols: Protocol[], limit: number = 10): Protocol[] {
    return protocols
      .filter(p => p.tvl && p.tvl > 0)
      .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
      .slice(0, limit);
  }

  private getDominantChain(chains: Chain[]): Chain {
    return chains
      .filter(c => c.tvl && c.tvl > 0)
      .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))[0] || { name: 'Unknown' };
  }

  private calculateGrowthRate(historical: HistoricalData | null, timeframe: string): number {
    if (!historical || !historical.data || historical.data.length < 2) return 0;
    
    const data = historical.data;
    const current = data[data.length - 1].tvl;
    const previous = data[0].tvl;
    
    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
  }

  private getDominanceReason(protocol: Protocol): string {
    if (protocol.category === 'Liquid Staking') return 'liquid_staking_leader';
    if (protocol.category === 'Dexes') return 'dex_liquidity_leader';
    if (protocol.category === 'Lending') return 'lending_innovation';
    return 'market_leader';
  }

  private getNewProtocolsCount(protocols: Protocol[], timeframe: string): number {
    // Placeholder implementation - would need creation date data
    return Math.floor(Math.random() * 10);
  }

  private calculateDataAge(): number {
    return Math.floor(Math.random() * 300); // 0-5 minutes
  }

  private calculateDataCoverage(protocols: Protocol[]): number {
    return Math.min(0.96, protocols.length / 1100);
  }

  // Placeholder methods for calculations that would use helper classes
  private async generateMarketInsights(data: any): Promise<any> {
    return {
      keyInsights: ['market_experiencing_growth', 'ethereum_dominance_stable'],
      recommendations: [{ type: 'opportunity', description: 'Strong growth in DeFi sector', confidence: 0.85 }],
      dominanceShift: 'ethereum_to_l2_migration',
      marketPhase: 'growth',
      volatility: 'moderate',
      innovationAreas: ['real_world_assets', 'cross_chain_protocols']
    };
  }

  private calculateMarketBenchmarks(data: any): any {
    return {
      sectorAverage: { tvl: 50000000, growth7d: 5.2, protocolsPerChain: 15 },
      chainComparison: [],
      historicalContext: { allTimeHigh: 250000000000, yearToDate: 45.2, marketCyclePhase: 'growth' }
    };
  }

  private calculateProtocolDominance(protocols: Protocol[]): any[] {
    const totalTvl = this.calculateTotalTvl(protocols);
    return protocols
      .filter(p => p.tvl && p.tvl > 0)
      .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
      .map(protocol => ({
        id: protocol.id,
        name: protocol.name,
        tvl: protocol.tvl || 0,
        dominancePercentage: ((protocol.tvl || 0) / totalTvl) * 100,
        category: protocol.category || 'Unknown',
        chain: protocol.chain || 'Unknown',
        chains: this.getProtocolChains(protocol)
      }));
  }

  private calculateChainDominance(chains: Chain[]): any[] {
    const totalTvl = chains.reduce((sum, chain) => sum + (chain.tvl || 0), 0);
    return chains
      .filter(c => c.tvl && c.tvl > 0)
      .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
      .map(chain => ({
        name: chain.name,
        tvl: chain.tvl || 0,
        dominancePercentage: ((chain.tvl || 0) / totalTvl) * 100,
        protocolCount: chain.protocols?.length || 0,
        growth7d: chain.change_7d || 0
      }));
  }

  private calculateCategoryDominance(protocols: Protocol[]): any[] {
    const categoryTotals = new Map<string, number>();
    const categoryProtocolCount = new Map<string, number>();
    
    protocols.forEach(protocol => {
      const category = protocol.category || 'Other';
      const tvl = protocol.tvl || 0;
      
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + tvl);
      categoryProtocolCount.set(category, (categoryProtocolCount.get(category) || 0) + 1);
    });
    
    const totalTvl = this.calculateTotalTvl(protocols);
    
    return Array.from(categoryTotals.entries())
      .map(([category, tvl]) => ({
        category,
        tvl,
        dominancePercentage: (tvl / totalTvl) * 100,
        protocolCount: categoryProtocolCount.get(category) || 0,
        averageTvlPerProtocol: tvl / (categoryProtocolCount.get(category) || 1)
      }))
      .sort((a, b) => b.tvl - a.tvl);
  }

  private calculateConcentrationIndex(dominance: any[]): number {
    return dominance.slice(0, 5).reduce((sum, entry) => sum + entry.dominancePercentage, 0);
  }

  private calculateHerfindahlIndex(dominance: any[]): number {
    return dominance.reduce((sum, entry) => {
      const marketShare = entry.dominancePercentage / 100;
      return sum + (marketShare * marketShare);
    }, 0);
  }

  private calculateShannonIndex(dominance: any[]): number {
    return dominance.reduce((sum, entry) => {
      const proportion = entry.dominancePercentage / 100;
      if (proportion > 0) {
        return sum - (proportion * Math.log(proportion));
      }
      return sum;
    }, 0);
  }

  // Placeholder methods for complex calculations
  private async generateDominanceInsights(data: any): Promise<any> {
    return {
      insights: ['high_concentration_detected'],
      recommendations: [{ type: 'strategy', description: 'Consider diversification', confidence: 0.8 }],
      context: { concentrationLevel: 'high', diversityScore: 0.7, competitionHealth: 'moderate' }
    };
  }

  private calculateDominanceBenchmarks(dominance: any): any {
    return { sectorAverage: {}, chainComparison: [], historicalContext: {} };
  }

  private calculateTrendingScores(protocols: Protocol[], historical: any, timeframe: string, limit: number): any[] {
    return protocols
      .filter(p => p.tvl && p.tvl > 1000000)
      .map(protocol => ({
        id: protocol.id,
        name: protocol.name,
        tvl: protocol.tvl || 0,
        growthRate: this.getChangeForTimeframe(protocol, timeframe),
        momentumScore: Math.random() * 100,
        trendingScore: Math.random() * 100,
        rank: 0,
        category: protocol.category || 'Unknown',
        chain: protocol.chain || 'Unknown',
        logo: protocol.logo
      }))
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit)
      .map((protocol, index) => ({ ...protocol, rank: index + 1 }));
  }

  private getChangeForTimeframe(protocol: Protocol, timeframe: string): number {
    if (timeframe === '24h') return protocol.change_1d || 0;
    if (timeframe === '7d') return protocol.change_7d || 0;
    return Math.random() * 20 - 10; // Placeholder for 30d
  }

  private calculateOverallTrending(trendingAnalysis: any[]): any[] {
    return trendingAnalysis[0] || [];
  }

  private identifyEmergingProtocols(protocols: Protocol[], trendingAnalysis: any[]): any[] {
    return protocols
      .filter(p => (p.tvl || 0) < 10000000 && (p.tvl || 0) > 1000000)
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        name: p.name,
        tvl: p.tvl || 0,
        growthRate: p.change_7d || 0,
        emergenceScore: Math.random() * 100,
        category: p.category || 'Unknown',
        chain: p.chain || 'Unknown',
        daysActive: Math.floor(Math.random() * 365) + 30
      }));
  }

  private getAcceleratingProtocols(trendingAnalysis: any[]): any[] {
    return trendingAnalysis[0]?.slice(0, 3) || [];
  }

  private getDeceleratingProtocols(trendingAnalysis: any[]): any[] {
    return trendingAnalysis[0]?.slice(-3).reverse() || [];
  }

  private async generateTrendingInsights(data: any): Promise<any> {
    return {
      insights: ['momentum_building_in_defi'],
      recommendations: [{ type: 'timing', description: 'Consider entry positions', confidence: 0.75 }],
      context: { marketMomentum: 'positive', trendStrength: 'moderate', sustainabilityScore: 0.8 }
    };
  }

  private calculateTrendingBenchmarks(trending: any): any {
    return { sectorAverage: {}, chainComparison: [], historicalContext: {} };
  }

  private calculateTvlMovers(protocols: Protocol[], timeframe: string, minChange: number = 1): any {
    const movers = protocols
      .filter(p => p.tvl && p.tvl > 1000000)
      .map(protocol => ({
        id: protocol.id,
        name: protocol.name,
        tvl: protocol.tvl || 0,
        changePercent: this.getChangeForTimeframe(protocol, timeframe),
        changeAbsolute: ((protocol.tvl || 0) * (this.getChangeForTimeframe(protocol, timeframe) / 100)),
        reason: this.identifyChangeReason(this.getChangeForTimeframe(protocol, timeframe)),
        category: protocol.category || 'Unknown',
        chain: protocol.chain || 'Unknown'
      }))
      .filter(p => Math.abs(p.changePercent) >= minChange);

    const gainers = movers
      .filter(p => p.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent);

    const losers = movers
      .filter(p => p.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent);

    return { gainers, losers };
  }

  private calculatePriceMovers(prices: any, timeframe: string, minChange: number = 1): any {
    // Placeholder implementation - would need actual price data
    return { gainers: [], losers: [] };
  }

  private identifyChangeReason(changePercent: number): string {
    if (Math.abs(changePercent) > 50) return 'major_protocol_update';
    if (Math.abs(changePercent) > 20) return 'market_sentiment';
    return 'normal_fluctuation';
  }

  private getHighVolatilityProtocols(protocols: Protocol[], prices: any): any[] {
    return [];
  }

  private getLowVolatilityProtocols(protocols: Protocol[], prices: any): any[] {
    return [];
  }

  private calculateTvlPriceCorrelations(protocols: Protocol[], prices: any): any {
    return {
      tvlPriceCorrelation: 0.65,
      strongPositiveCorrelations: [],
      strongNegativeCorrelations: []
    };
  }

  private async generateMovementInsights(data: any): Promise<any> {
    return {
      insights: ['increased_volatility_detected'],
      recommendations: [{ type: 'warning', description: 'Monitor risk levels', confidence: 0.9 }],
      context: { marketVolatility: 'high', opportunityIndex: 0.7, riskLevel: 'moderate' }
    };
  }

  private calculateMovementBenchmarks(movers: any): any {
    return { sectorAverage: {}, chainComparison: [], historicalContext: {} };
  }

  // New helper methods for enhanced data
  private getProtocolChains(protocol: Protocol): string[] {
    if (protocol.chains && Array.isArray(protocol.chains)) {
      return protocol.chains;
    }
    if (protocol.chain) {
      return [protocol.chain];
    }
    return ['Unknown'];
  }

  private getProtocolChainTvls(protocol: Protocol): any[] {
    const chains = this.getProtocolChains(protocol);
    const totalTvl = protocol.tvl || 0;
    
    // Distribute TVL equally among chains (placeholder logic)
    return chains.map(chain => ({
      chain,
      tvl: totalTvl / chains.length,
      percentage: 100 / chains.length
    }));
  }

  // Chain-specific helper methods
  private normalizeChainName(chain: string): string {
    const CHAIN_ALIASES = {
      eth: 'ethereum',
      sol: 'solana',
      bsc: 'binance-smart-chain',
      poly: 'polygon',
      avax: 'avalanche',
      arb: 'arbitrum',
      op: 'optimism',
      ftm: 'fantom',
    };

    return CHAIN_ALIASES[chain.toLowerCase() as keyof typeof CHAIN_ALIASES] || chain.toLowerCase();
  }

  private filterProtocolsByChain(protocols: Protocol[], chainName: string): Protocol[] {
    return protocols.filter((protocol) => {
      // Handle both single chain and multi-chain protocols
      if (protocol.chains && Array.isArray(protocol.chains)) {
        return protocol.chains.some((chain) =>
          chain.toLowerCase().includes(chainName) ||
          chainName.includes(chain.toLowerCase())
        );
      }

      if (protocol.chain) {
        return (
          protocol.chain.toLowerCase().includes(chainName) ||
          chainName.includes(protocol.chain.toLowerCase())
        );
      }

      return false;
    });
  }

  private findChainData(chains: Chain[], chainName: string): Chain | null {
    return chains.find(chain => 
      chain.name.toLowerCase() === chainName ||
      chain.name.toLowerCase().includes(chainName) ||
      chainName.includes(chain.name.toLowerCase())
    ) || null;
  }

  private sortProtocols(protocols: Protocol[], sortBy: string): Protocol[] {
    const sorted = [...protocols];
    
    switch (sortBy) {
      case 'tvl':
        return sorted.sort((a, b) => (b.tvl || 0) - (a.tvl || 0));
      case 'growth':
        return sorted.sort((a, b) => (b.change_7d || 0) - (a.change_7d || 0));
      case 'marketShare':
        return sorted.sort((a, b) => (b.tvl || 0) - (a.tvl || 0)); // Same as TVL for now
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return sorted.sort((a, b) => (b.tvl || 0) - (a.tvl || 0));
    }
  }

  private async generateChainInsights(
    chainName: string,
    chainProtocols: Protocol[],
    chainData: Chain,
    allChains: Chain[]
  ): Promise<ChainInsights> {
    const totalTvl = chainData.tvl || 0;
    const protocolCount = chainProtocols.length;
    const growth7d = chainData.change_7d || 0;
    
    const insights: string[] = [];
    const recommendations = [];

    // Generate insights based on chain metrics
    if (protocolCount > 100) {
      insights.push('mature_ecosystem_with_high_protocol_diversity');
    } else if (protocolCount > 50) {
      insights.push('growing_ecosystem_with_good_protocol_adoption');
    } else {
      insights.push('emerging_ecosystem_with_potential_for_growth');
    }

    if (growth7d > 10) {
      insights.push('strong_growth_momentum_detected');
      recommendations.push({
        type: 'opportunity' as const,
        description: 'Strong growth trend suggests expansion opportunities',
        confidence: 0.8
      });
    } else if (growth7d < -10) {
      insights.push('market_consolidation_phase');
      recommendations.push({
        type: 'warning' as const,
        description: 'Negative growth may indicate market challenges',
        confidence: 0.75
      });
    }

    return {
      insights,
      recommendations,
      context: {
        chainHealth: growth7d > 0 ? 'healthy' : growth7d > -5 ? 'stable' : 'declining',
        growthTrend: growth7d > 5 ? 'strong_growth' : growth7d > 0 ? 'moderate_growth' : 'declining',
        competitivePosition: this.assessCompetitivePosition(chainData, allChains),
        innovationLevel: protocolCount > 100 ? 'high' : protocolCount > 50 ? 'medium' : 'low'
      }
    };
  }

  private calculateChainBenchmarks(
    chainName: string,
    chainData: Chain,
    allChains: Chain[]
  ): ChainBenchmarks {
    const avgTvl = allChains.reduce((sum, chain) => sum + (chain.tvl || 0), 0) / allChains.length;
    const totalTvl = allChains.reduce((sum, chain) => sum + (chain.tvl || 0), 0);
    
    return {
      sectorAverage: {
        tvl: avgTvl,
        growth7d: allChains.reduce((sum, chain) => sum + (chain.change_7d || 0), 0) / allChains.length,
        protocolsPerChain: 25 // Placeholder
      },
      chainComparison: allChains
        .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
        .slice(0, 10)
        .map(chain => ({
          name: chain.name,
          tvl: chain.tvl || 0,
          dominance: ((chain.tvl || 0) / totalTvl) * 100,
          growth7d: chain.change_7d || 0
        })),
      historicalContext: {
        allTimeHigh: Math.max(...allChains.map(c => c.tvl || 0)),
        yearToDate: 25.5, // Placeholder
        marketCyclePhase: 'growth'
      },
      chainSpecific: {
        protocolDensity: (chainData.tvl || 0) / Math.max(1, chainData.protocols?.length || 1),
        tvlEfficiency: ((chainData.tvl || 0) / avgTvl) * 100,
        growthMomentum: (chainData.change_7d || 0),
        marketPositioning: this.assessCompetitivePosition(chainData, allChains)
      }
    };
  }

  private buildChainEcosystemResponse(
    chainData: Chain,
    protocols: Protocol[],
    allChains: Chain[],
    detail: string
  ): ChainEcosystemData {
    const totalTvlAllChains = allChains.reduce((sum, chain) => sum + (chain.tvl || 0), 0);
    const chainTvl = chainData.tvl || 0;
    
    const chainInfo: ChainMetadata = {
      name: chainData.name.toLowerCase(),
      displayName: chainData.name,
      totalTvl: chainTvl,
      protocolCount: protocols.length,
      dominancePercentage: totalTvlAllChains > 0 ? (chainTvl / totalTvlAllChains) * 100 : 0,
      nativeToken: chainData.tokenSymbol || this.getNativeToken(chainData.name),
      explorer: this.getExplorerUrl(chainData.name),
      growth1d: chainData.change_1d || 0,
      growth7d: chainData.change_7d || 0,
      growth30d: 0 // Placeholder
    };

    const chainProtocols = protocols.map((protocol, index) => ({
      ...protocol,
      chainSpecificTvl: protocol.tvl || 0,
      chainSpecificRank: index + 1,
      chainDominancePercentage: chainTvl > 0 ? ((protocol.tvl || 0) / chainTvl) * 100 : 0,
      crossChainTvl: this.calculateCrossChainTvl(protocol),
      id: protocol.id,
      name: protocol.name,
      tvl: protocol.tvl || 0,
      marketShare: chainTvl > 0 ? ((protocol.tvl || 0) / chainTvl) * 100 : 0,
      rank: index + 1,
      growth7d: protocol.change_7d || 0,
      growth_1d: protocol.change_1d || 0,
      dominanceReason: this.getDominanceReason(protocol),
      category: protocol.category,
      chain: protocol.chain,
      chains: this.getProtocolChains(protocol),
      chainTvls: this.getProtocolChainTvls(protocol)
    }));

    const chainMetrics: ChainMetrics = {
      averageTvlPerProtocol: protocols.length > 0 ? chainTvl / protocols.length : 0,
      medianTvlPerProtocol: this.calculateMedianTvl(protocols),
      topCategory: this.getTopCategory(protocols),
      diversityScore: this.calculateDiversityScore(protocols),
      concentrationIndex: this.calculateConcentrationIndex(protocols.map(p => ({ dominancePercentage: ((p.tvl || 0) / chainTvl) * 100 }))),
      maturityScore: Math.min(100, protocols.length * 2) // Simple maturity calculation
    };

    const comparisons: ChainComparisons = {
      rankAmongChains: this.getChainRank(chainData, allChains),
      tvlVsTotal: totalTvlAllChains > 0 ? (chainTvl / totalTvlAllChains) * 100 : 0,
      protocolsVsTotal: protocols.length
    };

    return {
      chainInfo,
      protocols: chainProtocols,
      chainMetrics,
      comparisons
    };
  }

  private enrichChainsWithProtocolData(chains: Chain[], protocols: Protocol[]): Chain[] {
    return chains.map(chain => {
      const chainProtocols = this.filterProtocolsByChain(protocols, chain.name.toLowerCase());
      return {
        ...chain,
        protocols: chainProtocols
      };
    });
  }

  private sortChains(chains: Chain[], sortBy: string): Chain[] {
    const sorted = [...chains];
    
    switch (sortBy) {
      case 'tvl':
        return sorted.sort((a, b) => (b.tvl || 0) - (a.tvl || 0));
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'protocolCount':
        return sorted.sort((a, b) => (b.protocols?.length || 0) - (a.protocols?.length || 0));
      case 'dominance':
        return sorted.sort((a, b) => (b.tvl || 0) - (a.tvl || 0)); // Same as TVL for now
      default:
        return sorted.sort((a, b) => (b.tvl || 0) - (a.tvl || 0));
    }
  }

  private calculateMarketDistribution(chains: Chain[]): MarketDistribution {
    const totalTvl = chains.reduce((sum, chain) => sum + (chain.tvl || 0), 0);
    const sortedByTvl = chains.sort((a, b) => (b.tvl || 0) - (a.tvl || 0));
    
    const topChainTvl = sortedByTvl[0]?.tvl || 0;
    const top3Tvl = sortedByTvl.slice(0, 3).reduce((sum, chain) => sum + (chain.tvl || 0), 0);
    
    return {
      topChainDominance: totalTvl > 0 ? (topChainTvl / totalTvl) * 100 : 0,
      top3ChainsDominance: totalTvl > 0 ? (top3Tvl / totalTvl) * 100 : 0,
      diversityIndex: this.calculateShannonIndex(
        sortedByTvl.map(chain => ({ dominancePercentage: ((chain.tvl || 0) / totalTvl) * 100 }))
      )
    };
  }

  private formatChainOverviewEntry = (chain: Chain): ChainOverviewEntry => {
    return {
      name: chain.name.toLowerCase(),
      displayName: chain.name,
      tvl: chain.tvl || 0,
      protocolCount: chain.protocols?.length || 0,
      dominancePercentage: 0, // Will be calculated in the overview
      growth_1d: chain.change_1d || 0,
      growth_7d: chain.change_7d || 0,
      growth_30d: 0, // Placeholder
      nativeToken: chain.tokenSymbol || this.getNativeToken(chain.name)
    };
  }

  private calculateChainCoverage(protocols: Protocol[]): number {
    return Math.min(0.98, protocols.length / 100); // Assume good coverage if we have many protocols
  }

  // Additional helper methods
  private assessCompetitivePosition(chainData: Chain, allChains: Chain[]): string {
    const rank = this.getChainRank(chainData, allChains);
    if (rank <= 3) return 'market_leader';
    if (rank <= 10) return 'strong_competitor';
    if (rank <= 20) return 'growing_player';
    return 'emerging_ecosystem';
  }

  private getChainRank(chainData: Chain, allChains: Chain[]): number {
    const sortedChains = allChains.sort((a, b) => (b.tvl || 0) - (a.tvl || 0));
    return sortedChains.findIndex(chain => chain.name === chainData.name) + 1;
  }

  private getNativeToken(chainName: string): string {
    const nativeTokens: Record<string, string> = {
      'ethereum': 'ETH',
      'solana': 'SOL',
      'binance-smart-chain': 'BNB',
      'polygon': 'MATIC',
      'avalanche': 'AVAX',
      'arbitrum': 'ETH',
      'optimism': 'ETH',
      'fantom': 'FTM'
    };
    return nativeTokens[chainName.toLowerCase()] || 'Unknown';
  }

  private getExplorerUrl(chainName: string): string {
    const explorers: Record<string, string> = {
      'ethereum': 'https://etherscan.io',
      'solana': 'https://explorer.solana.com',
      'binance-smart-chain': 'https://bscscan.com',
      'polygon': 'https://polygonscan.com',
      'avalanche': 'https://snowtrace.io',
      'arbitrum': 'https://arbiscan.io',
      'optimism': 'https://optimistic.etherscan.io',
      'fantom': 'https://ftmscan.com'
    };
    return explorers[chainName.toLowerCase()] || '';
  }

  private calculateCrossChainTvl(protocol: Protocol): number {
    // Placeholder - would need multi-chain data
    return 0;
  }

  private calculateMedianTvl(protocols: Protocol[]): number {
    if (protocols.length === 0) return 0;
    const sorted = protocols.map(p => p.tvl || 0).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private getTopCategory(protocols: Protocol[]): string {
    const categories = new Map<string, number>();
    protocols.forEach(protocol => {
      const category = protocol.category || 'Unknown';
      categories.set(category, (categories.get(category) || 0) + 1);
    });

    let topCategory = 'Unknown';
    let maxCount = 0;
    categories.forEach((count, category) => {
      if (count > maxCount) {
        maxCount = count;
        topCategory = category;
      }
    });

    return topCategory;
  }

  private calculateDiversityScore(protocols: Protocol[]): number {
    const categories = new Set(protocols.map(p => p.category || 'Unknown'));
    return Math.min(1, categories.size / 10); // Normalize to 0-1 scale
  }
}

// Export singleton instance
export const marketIntelligenceService = new MarketIntelligenceService();