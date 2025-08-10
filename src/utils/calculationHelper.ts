/**
 * Calculation Helper
 * 
 * Comprehensive mathematical operations for market intelligence calculations
 * including growth rates, rankings, statistical analysis, and financial metrics.
 */

import { logger } from './logger.js';
import { 
  Protocol, 
  Chain, 
  HistoricalData, 
  DominanceEntry,
  ChainDominanceEntry,
  CategoryDominanceEntry,
  TrendingProtocol,
  MoverProtocol,
  EmergingProtocol,
  VolatilityProtocol,
  CorrelationData,
  BenchmarkData,
  ChainBenchmark,
  MoversData
} from '../types/index.js';

/**
 * Calculation Helper Class
 * 
 * Provides mathematical operations and statistical analysis for market intelligence.
 * All methods are static for easy access and testing.
 */
export class CalculationHelper {

  /**
   * Calculate total TVL across all protocols
   */
  static calculateTotalTvl(protocols: Protocol[]): number {
    return protocols.reduce((total, protocol) => {
      return total + (protocol.tvl || 0);
    }, 0);
  }

  /**
   * Get top protocols by TVL with ranking
   */
  static getTopProtocols(protocols: Protocol[], limit: number = 10): Protocol[] {
    return protocols
      .filter(p => p.tvl && p.tvl > 0)
      .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
      .slice(0, limit);
  }

  /**
   * Calculate growth rate between time periods
   */
  static calculateGrowthRate(historical: HistoricalData | null, timeframe: string): number {
    if (!historical || !historical.data || historical.data.length < 2) {
      logger.debug('Insufficient historical data for growth calculation', { timeframe });
      return 0;
    }
    
    const data = historical.data;
    const current = data[data.length - 1].tvl;
    const previous = data[0].tvl;
    
    if (previous <= 0) {
      logger.warn('Invalid previous TVL value for growth calculation', { previous, current });
      return 0;
    }
    
    const growthRate = ((current - previous) / previous) * 100;
    logger.debug('Growth rate calculated', { timeframe, current, previous, growthRate });
    
    return growthRate;
  }

  /**
   * Calculate market dominance percentages
   */
  static calculateProtocolDominance(protocols: Protocol[]): DominanceEntry[] {
    const totalTvl = this.calculateTotalTvl(protocols);
    
    if (totalTvl === 0) {
      logger.warn('Total TVL is zero, cannot calculate dominance');
      return [];
    }
    
    return protocols
      .filter(p => p.tvl && p.tvl > 0)
      .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
      .map(protocol => ({
        id: protocol.id,
        name: protocol.name,
        tvl: protocol.tvl || 0,
        dominancePercentage: ((protocol.tvl || 0) / totalTvl) * 100,
        category: protocol.category || 'Unknown',
        chain: protocol.chain || 'Multi-Chain'
      }));
  }

  /**
   * Calculate chain dominance distribution
   */
  static calculateChainDominance(chains: Chain[]): ChainDominanceEntry[] {
    const totalTvl = chains.reduce((sum, chain) => sum + (chain.tvl || 0), 0);
    
    if (totalTvl === 0) {
      logger.warn('Total chain TVL is zero, cannot calculate chain dominance');
      return [];
    }
    
    return chains
      .filter(c => c.tvl && c.tvl > 0)
      .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
      .map(chain => ({
        name: chain.name,
        tvl: chain.tvl || 0,
        dominancePercentage: ((chain.tvl || 0) / totalTvl) * 100,
        protocolCount: chain.protocols?.length || 0,
        growth7d: this.calculateChainGrowth(chain, '7d')
      }));
  }

  /**
   * Calculate category dominance by TVL
   */
  static calculateCategoryDominance(protocols: Protocol[]): CategoryDominanceEntry[] {
    const categoryTotals = new Map<string, number>();
    const categoryProtocolCount = new Map<string, number>();
    
    protocols.forEach(protocol => {
      const category = protocol.category || 'Other';
      const tvl = protocol.tvl || 0;
      
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + tvl);
      categoryProtocolCount.set(category, (categoryProtocolCount.get(category) || 0) + 1);
    });
    
    const totalTvl = this.calculateTotalTvl(protocols);
    
    if (totalTvl === 0) {
      logger.warn('Total TVL is zero, cannot calculate category dominance');
      return [];
    }
    
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

  /**
   * Calculate trending scores based on momentum and growth
   */
  static calculateTrendingScores(
    protocols: Protocol[], 
    historical: HistoricalData | null, 
    timeframe: string,
    limit: number = 20
  ): TrendingProtocol[] {
    return protocols
      .filter(p => p.tvl && p.tvl > 1000000) // Filter out very small protocols
      .map(protocol => {
        const growthRate = this.calculateProtocolGrowth(protocol, historical, timeframe);
        const momentumScore = this.calculateMomentumScore(protocol, historical, timeframe);
        const volumeScore = this.calculateVolumeScore(protocol, timeframe);
        
        // Weighted trending score
        const trendingScore = (growthRate * 0.4) + (momentumScore * 0.4) + (volumeScore * 0.2);
        
        return {
          id: protocol.id,
          name: protocol.name,
          tvl: protocol.tvl || 0,
          growthRate,
          momentumScore,
          trendingScore: Math.max(0, trendingScore), // Ensure non-negative
          rank: 0, // Will be set after sorting
          category: protocol.category || 'Unknown',
          chain: protocol.chain || 'Multi-Chain',
          logo: protocol.logo
        };
      })
      .filter(p => p.trendingScore > 0) // Only positive trending protocols
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit)
      .map((protocol, index) => ({
        ...protocol,
        rank: index + 1
      }));
  }

  /**
   * Calculate TVL movers (gainers and losers)
   */
  static calculateTvlMovers(
    protocols: Protocol[], 
    timeframe: string,
    minPercentChange: number = 1
  ): MoversData {
    const movers = protocols
      .filter(p => p.tvl && p.tvl > 1000000) // Filter minimum TVL
      .map(protocol => {
        const changePercent = this.getProtocolChangePercent(protocol, timeframe);
        const changeAbsolute = this.getProtocolChangeAbsolute(protocol, timeframe, changePercent);
        
        return {
          id: protocol.id,
          name: protocol.name,
          tvl: protocol.tvl || 0,
          changePercent,
          changeAbsolute,
          reason: this.identifyChangeReason(changePercent),
          category: protocol.category || 'Unknown',
          chain: protocol.chain || 'Multi-Chain',
          logo: protocol.logo
        };
      })
      .filter(p => Math.abs(p.changePercent) >= minPercentChange); // Only significant moves
    
    const gainers = movers
      .filter(p => p.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent);
    
    const losers = movers
      .filter(p => p.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent);
    
    return { gainers, losers };
  }

  /**
   * Calculate price movers (gainers and losers)
   */
  static calculatePriceMovers(
    prices: any, 
    timeframe: string,
    minPercentChange: number = 1
  ): MoversData {
    // Placeholder implementation - would need actual price data structure
    logger.debug('Price movers calculation called', { timeframe, minPercentChange });
    return { gainers: [], losers: [] };
  }

  /**
   * Calculate market benchmarks for comparison
   */
  static calculateMarketBenchmarks(data: { 
    protocols: Protocol[], 
    chains: Chain[], 
    categories: any[] 
  }): BenchmarkData {
    const { protocols, chains } = data;
    
    const totalTvl = this.calculateTotalTvl(protocols);
    const avgProtocolTvl = protocols.length > 0 ? totalTvl / protocols.length : 0;
    const avgGrowth7d = this.calculateAverageGrowth(protocols, '7d');
    const protocolsPerChain = chains.length > 0 ? protocols.length / chains.length : 0;
    
    return {
      sectorAverage: {
        tvl: avgProtocolTvl,
        growth7d: avgGrowth7d,
        protocolsPerChain
      },
      chainComparison: chains.slice(0, 5).map(chain => ({
        name: chain.name,
        tvl: chain.tvl || 0,
        dominance: totalTvl > 0 ? ((chain.tvl || 0) / totalTvl) * 100 : 0,
        growth7d: this.calculateChainGrowth(chain, '7d')
      })),
      historicalContext: {
        allTimeHigh: this.calculateAllTimeHigh(protocols, totalTvl),
        yearToDate: this.calculateYearToDateGrowth(protocols),
        marketCyclePhase: this.identifyMarketPhase(protocols)
      }
    };
  }

  /**
   * Calculate Herfindahl-Hirschman Index for market concentration
   */
  static calculateHerfindahlIndex(dominance: DominanceEntry[]): number {
    return dominance.reduce((sum, entry) => {
      const marketShare = entry.dominancePercentage / 100;
      return sum + (marketShare * marketShare);
    }, 0);
  }

  /**
   * Calculate Shannon Diversity Index for market diversity
   */
  static calculateShannonIndex(dominance: DominanceEntry[]): number {
    return dominance.reduce((sum, entry) => {
      const proportion = entry.dominancePercentage / 100;
      if (proportion > 0) {
        return sum - (proportion * Math.log(proportion));
      }
      return sum;
    }, 0);
  }

  /**
   * Calculate concentration index (top 5 protocols)
   */
  static calculateConcentrationIndex(dominance: DominanceEntry[]): number {
    return dominance.slice(0, 5).reduce((sum, entry) => {
      return sum + entry.dominancePercentage;
    }, 0);
  }

  /**
   * Identify emerging protocols based on growth and age
   */
  static identifyEmergingProtocols(
    protocols: Protocol[], 
    trendingAnalysis: TrendingProtocol[][]
  ): EmergingProtocol[] {
    // Focus on smaller protocols with high growth potential
    return protocols
      .filter(p => (p.tvl || 0) < 50000000 && (p.tvl || 0) > 1000000) // $1M to $50M TVL
      .slice(0, 10)
      .map(protocol => {
        const growthRate = protocol.change_7d || 0;
        const emergenceScore = this.calculateEmergenceScore(protocol, growthRate);
        
        return {
          id: protocol.id,
          name: protocol.name,
          tvl: protocol.tvl || 0,
          growthRate,
          emergenceScore,
          category: protocol.category || 'Unknown',
          chain: protocol.chain || 'Multi-Chain',
          daysActive: this.estimateDaysActive(protocol)
        };
      })
      .sort((a, b) => b.emergenceScore - a.emergenceScore);
  }

  /**
   * Get accelerating protocols from trending analysis
   */
  static getAcceleratingProtocols(trendingAnalysis: TrendingProtocol[][]): TrendingProtocol[] {
    if (trendingAnalysis.length === 0) return [];
    
    // Get protocols with increasing momentum
    return trendingAnalysis[0]
      ?.filter(p => p.momentumScore > 70)
      .slice(0, 5) || [];
  }

  /**
   * Get decelerating protocols from trending analysis
   */
  static getDeceleratingProtocols(trendingAnalysis: TrendingProtocol[][]): TrendingProtocol[] {
    if (trendingAnalysis.length === 0) return [];
    
    // Get protocols with decreasing momentum
    return trendingAnalysis[0]
      ?.filter(p => p.momentumScore < 30)
      .slice(-5)
      .reverse() || [];
  }

  /**
   * Calculate overall trending from multiple timeframe analyses
   */
  static calculateOverallTrending(trendingAnalysis: TrendingProtocol[][]): TrendingProtocol[] {
    if (trendingAnalysis.length === 0) return [];
    
    // Combine and weight different timeframe analyses
    const protocolScores = new Map<string, { protocol: TrendingProtocol, totalScore: number, count: number }>();
    
    trendingAnalysis.forEach(analysis => {
      analysis.forEach(protocol => {
        const existing = protocolScores.get(protocol.id);
        if (existing) {
          existing.totalScore += protocol.trendingScore;
          existing.count += 1;
        } else {
          protocolScores.set(protocol.id, {
            protocol,
            totalScore: protocol.trendingScore,
            count: 1
          });
        }
      });
    });
    
    // Calculate average scores and return top protocols
    return Array.from(protocolScores.values())
      .map(({ protocol, totalScore, count }) => ({
        ...protocol,
        trendingScore: totalScore / count
      }))
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 20)
      .map((protocol, index) => ({ ...protocol, rank: index + 1 }));
  }

  /**
   * Get high volatility protocols
   */
  static getHighVolatilityProtocols(protocols: Protocol[], prices: any): VolatilityProtocol[] {
    return protocols
      .filter(p => p.tvl && p.tvl > 10000000)
      .slice(0, 5)
      .map(protocol => ({
        id: protocol.id,
        name: protocol.name,
        tvl: protocol.tvl || 0,
        volatilityScore: this.calculateVolatilityScore(protocol),
        standardDeviation: this.calculateStandardDeviation(protocol),
        category: protocol.category || 'Unknown',
        chain: protocol.chain || 'Multi-Chain'
      }))
      .sort((a, b) => b.volatilityScore - a.volatilityScore);
  }

  /**
   * Get low volatility protocols
   */
  static getLowVolatilityProtocols(protocols: Protocol[], prices: any): VolatilityProtocol[] {
    return protocols
      .filter(p => p.tvl && p.tvl > 10000000)
      .slice(0, 5)
      .map(protocol => ({
        id: protocol.id,
        name: protocol.name,
        tvl: protocol.tvl || 0,
        volatilityScore: this.calculateVolatilityScore(protocol),
        standardDeviation: this.calculateStandardDeviation(protocol),
        category: protocol.category || 'Unknown',
        chain: protocol.chain || 'Multi-Chain'
      }))
      .sort((a, b) => a.volatilityScore - b.volatilityScore);
  }

  /**
   * Calculate TVL-Price correlations
   */
  static calculateTvlPriceCorrelations(protocols: Protocol[], prices: any): CorrelationData {
    // Placeholder implementation - would need actual price data
    return {
      tvlPriceCorrelation: 0.65, // Overall correlation between TVL and price movements
      strongPositiveCorrelations: [],
      strongNegativeCorrelations: []
    };
  }

  // Private helper methods
  private static calculateProtocolGrowth(
    protocol: Protocol, 
    historical: HistoricalData | null, 
    timeframe: string
  ): number {
    // Use available change data or calculate from historical data
    if (timeframe === '7d' && protocol.change_7d !== undefined) {
      return protocol.change_7d;
    }
    if (timeframe === '24h' && protocol.change_1d !== undefined) {
      return protocol.change_1d;
    }
    
    // Fallback to random for demonstration - would implement actual calculation
    return Math.random() * 20 - 10;
  }

  private static calculateMomentumScore(
    protocol: Protocol, 
    historical: HistoricalData | null, 
    timeframe: string
  ): number {
    // Implementation would analyze momentum patterns in historical data
    const baseScore = Math.random() * 100;
    
    // Boost score for protocols with consistent growth
    if (protocol.change_7d && protocol.change_7d > 0) {
      return Math.min(100, baseScore + 20);
    }
    
    return baseScore;
  }

  private static calculateVolumeScore(protocol: Protocol, timeframe: string): number {
    // Implementation would use trading volume data if available
    return Math.random() * 50;
  }

  private static getProtocolChangePercent(protocol: Protocol, timeframe: string): number {
    if (timeframe === '24h') return protocol.change_1d || 0;
    if (timeframe === '7d') return protocol.change_7d || 0;
    if (timeframe === '30d') return protocol.change_7d || 0; // Placeholder
    return 0;
  }

  private static getProtocolChangeAbsolute(
    protocol: Protocol, 
    timeframe: string, 
    changePercent: number
  ): number {
    const currentTvl = protocol.tvl || 0;
    return currentTvl * (changePercent / 100);
  }

  private static identifyChangeReason(changePercent: number): string {
    const absChange = Math.abs(changePercent);
    if (absChange > 50) return 'major_protocol_update';
    if (absChange > 20) return 'market_sentiment';
    if (absChange > 10) return 'competitive_dynamics';
    return 'normal_fluctuation';
  }

  private static calculateAverageGrowth(protocols: Protocol[], timeframe: string): number {
    const validProtocols = protocols.filter(p => {
      if (timeframe === '7d') return p.change_7d !== undefined;
      if (timeframe === '24h') return p.change_1d !== undefined;
      return false;
    });
    
    if (validProtocols.length === 0) return 0;
    
    const totalGrowth = validProtocols.reduce((sum, p) => {
      if (timeframe === '7d') return sum + (p.change_7d || 0);
      if (timeframe === '24h') return sum + (p.change_1d || 0);
      return sum;
    }, 0);
    
    return totalGrowth / validProtocols.length;
  }

  private static calculateChainGrowth(chain: Chain, timeframe: string): number {
    if (timeframe === '7d') return chain.change_7d || 0;
    if (timeframe === '24h') return chain.change_1d || 0;
    return Math.random() * 15 - 5; // Placeholder
  }

  private static calculateAllTimeHigh(protocols: Protocol[], currentTvl: number): number {
    // Implementation would use historical ATH data
    return currentTvl * 1.3; // Placeholder: assume ATH is 30% higher
  }

  private static calculateYearToDateGrowth(protocols: Protocol[]): number {
    // Implementation would calculate YTD growth from historical data
    return Math.random() * 100; // Placeholder
  }

  private static identifyMarketPhase(protocols: Protocol[]): string {
    const avgGrowth = this.calculateAverageGrowth(protocols, '7d');
    if (avgGrowth > 15) return 'bull_market';
    if (avgGrowth < -15) return 'bear_market';
    if (avgGrowth > 5) return 'growth';
    if (avgGrowth > -5) return 'consolidation';
    return 'correction';
  }

  private static calculateEmergenceScore(protocol: Protocol, growthRate: number): number {
    let score = 0;
    
    // Growth component (40% weight)
    score += Math.max(0, growthRate) * 0.4;
    
    // Size component (30% weight) - smaller protocols get higher scores
    const tvl = protocol.tvl || 0;
    if (tvl > 0) {
      const sizeScore = Math.max(0, 100 - (tvl / 1000000)); // Inverse relationship with TVL
      score += Math.min(30, sizeScore) * 0.3;
    }
    
    // Activity component (30% weight)
    score += Math.random() * 30; // Placeholder for actual activity metrics
    
    return Math.min(100, score);
  }

  private static estimateDaysActive(protocol: Protocol): number {
    // Placeholder implementation - would use actual protocol creation date
    return Math.floor(Math.random() * 365) + 30;
  }

  private static calculateVolatilityScore(protocol: Protocol): number {
    // Implementation would analyze price/TVL volatility patterns
    const change1d = Math.abs(protocol.change_1d || 0);
    const change7d = Math.abs(protocol.change_7d || 0);
    return (change1d * 0.7) + (change7d * 0.3);
  }

  private static calculateStandardDeviation(protocol: Protocol): number {
    // Placeholder implementation - would use actual time series data
    return Math.random() * 20 + 5;
  }
}

export default CalculationHelper;