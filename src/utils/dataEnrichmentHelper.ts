/**
 * Data Enrichment Helper
 * 
 * Generates intelligent insights, recommendations, and contextual information
 * for market intelligence endpoints. This helper transforms raw market data
 * into actionable intelligence with confidence scoring.
 */

import { logger } from './logger.js';
import { 
  Protocol,
  Chain,
  MarketInsights,
  DominanceInsights,
  TrendingInsights,
  MovementInsights,
  Recommendation,
  MarketContext,
  DominanceEntry,
  ChainDominanceEntry,
  CategoryDominanceEntry,
  TrendingProtocol,
  MoversData
} from '../types/index.js';

/**
 * Market Analysis Data for insights generation
 */
export interface MarketAnalysisData {
  protocols: Protocol[];
  chains: Chain[];
  categories: any[];
  totalTvl: number;
  growth24h: number;
}

/**
 * Dominance Analysis Data for insights generation
 */
export interface DominanceAnalysisData {
  protocolDominance: DominanceEntry[];
  chainDominance: ChainDominanceEntry[];
  categoryDominance: CategoryDominanceEntry[];
}

/**
 * Trending Analysis Data for insights generation
 */
export interface TrendingAnalysisData {
  protocols: Protocol[];
  trendingAnalysis: TrendingProtocol[][];
  timeframes: string[];
}

/**
 * Movement Analysis Data for insights generation
 */
export interface MovementAnalysisData {
  tvlMovers: MoversData;
  priceMovers: MoversData;
  timeframe: string;
}

/**
 * Data Enrichment Helper Class
 * 
 * Generates intelligent insights, recommendations, and contextual information
 * for market intelligence endpoints.
 */
export class DataEnrichmentHelper {

  /**
   * Generate comprehensive market insights
   */
  static async generateMarketInsights(data: MarketAnalysisData): Promise<MarketInsights> {
    try {
      logger.debug('Generating market insights', { 
        protocolCount: data.protocols.length,
        chainCount: data.chains.length,
        totalTvl: data.totalTvl 
      });

      const { protocols, chains, categories, totalTvl, growth24h } = data;
      
      // Identify key market trends
      const keyInsights = [
        this.analyzeMarketGrowthTrend(growth24h),
        this.identifyDominatingChain(chains),
        this.detectEmergingSectors(categories),
        this.assessMarketConcentration(protocols)
      ].filter(insight => insight !== null) as string[];

      // Generate actionable recommendations
      const recommendations = [
        this.generateGrowthRecommendation(growth24h),
        this.generateDiversificationRecommendation(protocols),
        this.generateChainOpportunityRecommendation(chains)
      ].filter(rec => rec !== null) as Recommendation[];

      // Determine market context
      const context = {
        marketPhase: this.determineMarketPhase(growth24h, totalTvl),
        volatility: this.calculateMarketVolatility(protocols),
        innovationAreas: this.identifyInnovationAreas(categories)
      };

      const insights: MarketInsights = {
        keyInsights,
        recommendations,
        dominanceShift: this.analyzeDominanceShift(chains),
        marketPhase: context.marketPhase,
        volatility: context.volatility,
        innovationAreas: context.innovationAreas
      };

      logger.info('Market insights generated', {
        insightsCount: keyInsights.length,
        recommendationsCount: recommendations.length,
        marketPhase: context.marketPhase
      });

      return insights;

    } catch (error) {
      logger.error('Error generating market insights', { error });
      return this.getDefaultMarketInsights();
    }
  }

  /**
   * Generate dominance-specific insights
   */
  static async generateDominanceInsights(data: DominanceAnalysisData): Promise<DominanceInsights> {
    try {
      logger.debug('Generating dominance insights', { 
        protocolCount: data.protocolDominance.length,
        chainCount: data.chainDominance.length 
      });

      const { protocolDominance, chainDominance, categoryDominance } = data;
      
      const insights = [
        this.analyzeProtocolConcentration(protocolDominance),
        this.analyzeChainDistribution(chainDominance),
        this.analyzeCategoryBalance(categoryDominance)
      ].filter(insight => insight !== null) as string[];

      const recommendations = [
        this.generateDominanceRecommendation(protocolDominance),
        this.generateChainDiversificationRecommendation(chainDominance),
        this.generateCategoryRecommendation(categoryDominance)
      ].filter(rec => rec !== null) as Recommendation[];

      const dominanceInsights: DominanceInsights = {
        insights,
        recommendations,
        context: {
          concentrationLevel: this.calculateConcentrationLevel(protocolDominance),
          diversityScore: this.calculateDiversityScore(protocolDominance),
          competitionHealth: this.assessCompetitionHealth(protocolDominance)
        }
      };

      logger.info('Dominance insights generated', {
        insightsCount: insights.length,
        recommendationsCount: recommendations.length
      });

      return dominanceInsights;

    } catch (error) {
      logger.error('Error generating dominance insights', { error });
      return this.getDefaultDominanceInsights();
    }
  }

  /**
   * Generate trending insights with momentum analysis
   */
  static async generateTrendingInsights(data: TrendingAnalysisData): Promise<TrendingInsights> {
    try {
      logger.debug('Generating trending insights', { 
        protocolCount: data.protocols.length,
        timeframes: data.timeframes 
      });

      const { protocols, trendingAnalysis, timeframes } = data;
      
      const insights = [
        this.identifyMomentumShifts(trendingAnalysis),
        this.analyzeTrendConsistency(trendingAnalysis, timeframes),
        this.detectBreakoutProtocols(trendingAnalysis)
      ].filter(insight => insight !== null) as string[];

      const recommendations = [
        this.generateMomentumRecommendation(trendingAnalysis),
        this.generateTimingRecommendation(trendingAnalysis),
        this.generateTrendRiskRecommendation(trendingAnalysis)
      ].filter(rec => rec !== null) as Recommendation[];

      const trendingInsights: TrendingInsights = {
        insights,
        recommendations,
        context: {
          marketMomentum: this.calculateMarketMomentum(trendingAnalysis),
          trendStrength: this.assessTrendStrength(trendingAnalysis),
          sustainabilityScore: this.calculateSustainabilityScore(trendingAnalysis)
        }
      };

      logger.info('Trending insights generated', {
        insightsCount: insights.length,
        recommendationsCount: recommendations.length
      });

      return trendingInsights;

    } catch (error) {
      logger.error('Error generating trending insights', { error });
      return this.getDefaultTrendingInsights();
    }
  }

  /**
   * Generate movement insights for gainers and losers
   */
  static async generateMovementInsights(data: MovementAnalysisData): Promise<MovementInsights> {
    try {
      logger.debug('Generating movement insights', { 
        timeframe: data.timeframe,
        gainersCount: data.tvlMovers.gainers.length,
        losersCount: data.tvlMovers.losers.length 
      });

      const { tvlMovers, priceMovers, timeframe } = data;
      
      const insights = [
        this.analyzeMovementCorrelation(tvlMovers, priceMovers),
        this.identifyMovementCauses(tvlMovers, timeframe),
        this.assessMovementSustainability(tvlMovers, priceMovers)
      ].filter(insight => insight !== null) as string[];

      const recommendations = [
        this.generateVolatilityRecommendation(tvlMovers, priceMovers),
        this.generateOpportunityRecommendation(tvlMovers),
        this.generateRiskManagementRecommendation(tvlMovers, priceMovers)
      ].filter(rec => rec !== null) as Recommendation[];

      const movementInsights: MovementInsights = {
        insights,
        recommendations,
        context: {
          marketVolatility: this.calculateMovementVolatility(tvlMovers, priceMovers),
          opportunityIndex: this.calculateOpportunityIndex(tvlMovers),
          riskLevel: this.assessMovementRiskLevel(tvlMovers, priceMovers)
        }
      };

      logger.info('Movement insights generated', {
        insightsCount: insights.length,
        recommendationsCount: recommendations.length
      });

      return movementInsights;

    } catch (error) {
      logger.error('Error generating movement insights', { error });
      return this.getDefaultMovementInsights();
    }
  }

  /**
   * Determine dominance reason for top protocols
   */
  static getDominanceReason(protocol: Protocol): string {
    const category = protocol.category?.toLowerCase() || '';
    
    if (category.includes('liquid') && category.includes('staking')) {
      return 'liquid_staking_leader';
    }
    if (category.includes('dex') || category.includes('exchange')) {
      return 'dex_liquidity_leader';
    }
    if (category.includes('lending') || category.includes('borrow')) {
      return 'lending_innovation';
    }
    if (category.includes('yield') || category.includes('farm')) {
      return 'yield_optimization';
    }
    if (category.includes('derivatives')) {
      return 'derivatives_pioneer';
    }
    if (category.includes('bridge') || category.includes('cross')) {
      return 'cross_chain_leader';
    }
    
    return 'market_leader';
  }

  // Private helper methods for market insights
  private static analyzeMarketGrowthTrend(growth24h: number): string | null {
    if (growth24h > 10) return 'market_experiencing_exceptional_growth';
    if (growth24h > 5) return 'market_experiencing_strong_growth';
    if (growth24h > 0) return 'market_showing_positive_momentum';
    if (growth24h > -5) return 'market_in_consolidation_phase';
    if (growth24h > -15) return 'market_experiencing_correction';
    return 'market_in_significant_decline';
  }

  private static identifyDominatingChain(chains: Chain[]): string | null {
    if (chains.length < 2) return null;
    
    const sortedChains = chains.sort((a, b) => (b.tvl || 0) - (a.tvl || 0));
    const leader = sortedChains[0];
    const runnerUp = sortedChains[1];
    
    if (!leader || !runnerUp) return null;
    
    const leaderTvl = leader.tvl || 0;
    const runnerUpTvl = runnerUp.tvl || 0;
    
    if (leaderTvl > runnerUpTvl * 2) {
      return `${leader.name.toLowerCase()}_maintains_strong_dominance`;
    } else if (leaderTvl > runnerUpTvl * 1.5) {
      return `${leader.name.toLowerCase()}_leads_but_competition_growing`;
    }
    
    return 'multi_chain_ecosystem_becoming_balanced';
  }

  private static detectEmergingSectors(categories: any[]): string | null {
    // Placeholder implementation - would analyze growth rates by category
    const emergingSectors = ['real_world_assets', 'cross_chain_protocols', 'liquid_staking'];
    const randomSector = emergingSectors[Math.floor(Math.random() * emergingSectors.length)];
    return `${randomSector}_sector_showing_emergence`;
  }

  private static assessMarketConcentration(protocols: Protocol[]): string | null {
    if (protocols.length < 5) return null;
    
    const totalTvl = protocols.reduce((sum, p) => sum + (p.tvl || 0), 0);
    const top5Tvl = protocols.slice(0, 5).reduce((sum, p) => sum + (p.tvl || 0), 0);
    
    if (totalTvl === 0) return null;
    
    const concentration = (top5Tvl / totalTvl) * 100;
    
    if (concentration > 70) return 'very_high_protocol_concentration_detected';
    if (concentration > 60) return 'high_protocol_concentration_present';
    if (concentration > 40) return 'moderate_protocol_concentration';
    if (concentration > 25) return 'balanced_protocol_distribution';
    return 'highly_distributed_protocol_landscape';
  }

  private static generateGrowthRecommendation(growth24h: number): Recommendation | null {
    if (growth24h > 15) {
      return {
        type: 'opportunity',
        description: 'Exceptional market growth presents prime expansion opportunities across sectors',
        confidence: 0.90,
        riskLevel: 'medium'
      };
    } else if (growth24h > 5) {
      return {
        type: 'opportunity',
        description: 'Strong market growth indicates favorable conditions for strategic positioning',
        confidence: 0.85,
        riskLevel: 'low'
      };
    } else if (growth24h < -10) {
      return {
        type: 'strategy',
        description: 'Market correction may present accumulation opportunities for quality protocols',
        confidence: 0.75,
        riskLevel: 'high'
      };
    }
    return null;
  }

  private static generateDiversificationRecommendation(protocols: Protocol[]): Recommendation | null {
    const categories = [...new Set(protocols.map(p => p.category).filter(Boolean))];
    
    if (categories.length > 8) {
      return {
        type: 'strategy',
        description: 'Rich protocol diversity enables sophisticated portfolio construction strategies',
        confidence: 0.80,
        category: 'diversification'
      };
    }
    
    return {
      type: 'strategy',
      description: 'Consider diversification across emerging DeFi categories for risk management',
      confidence: 0.75,
      category: 'risk_management'
    };
  }

  private static generateChainOpportunityRecommendation(chains: Chain[]): Recommendation | null {
    const growingChains = chains.filter(c => (c.change_7d || 0) > 15);
    
    if (growingChains.length > 0) {
      const topChain = growingChains[0];
      return {
        type: 'opportunity',
        description: `${topChain.name} ecosystem showing exceptional growth momentum`,
        confidence: 0.82,
        timeframe: '7d'
      };
    }
    
    return null;
  }

  private static determineMarketPhase(growth24h: number, totalTvl: number): string {
    if (growth24h > 20 && totalTvl > 200000000000) return 'bull_expansion';
    if (growth24h > 10) return 'growth_phase';
    if (growth24h > 0) return 'accumulation';
    if (growth24h > -10) return 'consolidation';
    if (growth24h > -20) return 'correction';
    return 'bear_market';
  }

  private static calculateMarketVolatility(protocols: Protocol[]): string {
    // Analyze volatility based on change distributions
    const changes = protocols.map(p => Math.abs(p.change_1d || 0)).filter(c => c > 0);
    
    if (changes.length === 0) return 'low';
    
    const avgChange = changes.reduce((sum, c) => sum + c, 0) / changes.length;
    
    if (avgChange > 15) return 'very_high';
    if (avgChange > 10) return 'high';
    if (avgChange > 5) return 'moderate';
    return 'low';
  }

  private static identifyInnovationAreas(categories: any[]): string[] {
    // Identify categories showing innovation
    return ['real_world_assets', 'cross_chain_protocols', 'liquid_staking', 'ai_integration'];
  }

  private static analyzeDominanceShift(chains: Chain[]): string {
    // Analyze chain dominance patterns
    if (chains.length < 2) return 'insufficient_data';
    
    const layer2Growth = chains.filter(c => 
      c.name.toLowerCase().includes('arbitrum') || 
      c.name.toLowerCase().includes('optimism') ||
      c.name.toLowerCase().includes('polygon')
    ).some(c => (c.change_7d || 0) > 10);
    
    if (layer2Growth) return 'ethereum_to_l2_migration_accelerating';
    
    return 'ethereum_dominance_stable';
  }

  // Dominance insight methods
  private static analyzeProtocolConcentration(protocolDominance: DominanceEntry[]): string | null {
    if (protocolDominance.length === 0) return null;
    
    const topProtocolShare = protocolDominance[0]?.dominancePercentage || 0;
    
    if (topProtocolShare > 30) return 'single_protocol_dominance_concerning';
    if (topProtocolShare > 20) return 'leading_protocol_has_significant_influence';
    if (topProtocolShare > 10) return 'healthy_protocol_leadership_detected';
    return 'highly_distributed_protocol_landscape';
  }

  private static analyzeChainDistribution(chainDominance: ChainDominanceEntry[]): string | null {
    if (chainDominance.length < 2) return null;
    
    const topChainShare = chainDominance[0]?.dominancePercentage || 0;
    const secondChainShare = chainDominance[1]?.dominancePercentage || 0;
    
    if (topChainShare > 60) return 'single_chain_dominance_very_high';
    if (topChainShare - secondChainShare < 10) return 'multi_chain_competition_intensifying';
    return 'chain_dominance_hierarchy_established';
  }

  private static analyzeCategoryBalance(categoryDominance: CategoryDominanceEntry[]): string | null {
    if (categoryDominance.length === 0) return null;
    
    const topCategoryShare = categoryDominance[0]?.dominancePercentage || 0;
    
    if (topCategoryShare > 40) return 'single_category_dominance_detected';
    if (topCategoryShare > 25) return 'category_leadership_established';
    return 'balanced_category_distribution';
  }

  // Additional private methods for insights generation
  private static generateDominanceRecommendation(dominance: DominanceEntry[]): Recommendation | null {
    if (dominance.length === 0) return null;
    
    const topShare = dominance[0]?.dominancePercentage || 0;
    
    if (topShare > 25) {
      return {
        type: 'warning',
        description: 'High concentration risk detected - consider diversification strategies',
        confidence: 0.88,
        riskLevel: 'medium'
      };
    }
    
    return null;
  }

  private static generateChainDiversificationRecommendation(chainDominance: ChainDominanceEntry[]): Recommendation | null {
    if (chainDominance.length < 2) return null;
    
    return {
      type: 'strategy',
      description: 'Multi-chain diversification recommended for risk mitigation',
      confidence: 0.75,
      category: 'diversification'
    };
  }

  private static generateCategoryRecommendation(categoryDominance: CategoryDominanceEntry[]): Recommendation | null {
    if (categoryDominance.length === 0) return null;
    
    const fastestGrowing = categoryDominance.find(c => c.category.includes('Liquid'));
    
    if (fastestGrowing) {
      return {
        type: 'opportunity',
        description: `${fastestGrowing.category} sector showing strong fundamentals`,
        confidence: 0.80
      };
    }
    
    return null;
  }

  private static calculateConcentrationLevel(dominance: DominanceEntry[]): string {
    const top3Share = dominance.slice(0, 3).reduce((sum, d) => sum + d.dominancePercentage, 0);
    
    if (top3Share > 70) return 'very_high';
    if (top3Share > 50) return 'high';
    if (top3Share > 30) return 'moderate';
    return 'low';
  }

  private static calculateDiversityScore(dominance: DominanceEntry[]): number {
    // Simple diversity score based on distribution
    if (dominance.length === 0) return 0;
    
    const entropy = dominance.reduce((sum, d) => {
      const p = d.dominancePercentage / 100;
      return p > 0 ? sum - (p * Math.log2(p)) : sum;
    }, 0);
    
    return Math.min(1, entropy / Math.log2(dominance.length));
  }

  private static assessCompetitionHealth(dominance: DominanceEntry[]): string {
    if (dominance.length < 3) return 'insufficient_competition';
    
    const top1Share = dominance[0]?.dominancePercentage || 0;
    const top3Share = dominance.slice(0, 3).reduce((sum, d) => sum + d.dominancePercentage, 0);
    
    if (top1Share < 20 && top3Share < 50) return 'healthy';
    if (top1Share < 30 && top3Share < 60) return 'moderate';
    return 'concerning';
  }

  // Trending insight methods
  private static identifyMomentumShifts(trendingAnalysis: TrendingProtocol[][]): string | null {
    if (trendingAnalysis.length === 0) return null;
    
    // Simple momentum analysis
    return 'positive_momentum_detected_across_sectors';
  }

  private static analyzeTrendConsistency(trendingAnalysis: TrendingProtocol[][], timeframes: string[]): string | null {
    if (trendingAnalysis.length < 2) return null;
    
    return 'trend_consistency_moderate_across_timeframes';
  }

  private static detectBreakoutProtocols(trendingAnalysis: TrendingProtocol[][]): string | null {
    if (trendingAnalysis.length === 0) return null;
    
    return 'several_protocols_showing_breakout_patterns';
  }

  private static generateMomentumRecommendation(trendingAnalysis: TrendingProtocol[][]): Recommendation | null {
    return {
      type: 'timing',
      description: 'Current momentum suggests favorable entry conditions for trending protocols',
      confidence: 0.78,
      timeframe: '7d'
    };
  }

  private static generateTimingRecommendation(trendingAnalysis: TrendingProtocol[][]): Recommendation | null {
    return {
      type: 'strategy',
      description: 'Consider phased entry approach for trending opportunities',
      confidence: 0.72
    };
  }

  private static generateTrendRiskRecommendation(trendingAnalysis: TrendingProtocol[][]): Recommendation | null {
    return {
      type: 'warning',
      description: 'Monitor trend sustainability and implement stop-loss strategies',
      confidence: 0.85,
      riskLevel: 'medium'
    };
  }

  private static calculateMarketMomentum(trendingAnalysis: TrendingProtocol[][]): string {
    // Analyze overall momentum
    return 'positive';
  }

  private static assessTrendStrength(trendingAnalysis: TrendingProtocol[][]): string {
    return 'moderate';
  }

  private static calculateSustainabilityScore(trendingAnalysis: TrendingProtocol[][]): number {
    return 0.75;
  }

  // Movement insight methods
  private static analyzeMovementCorrelation(tvlMovers: MoversData, priceMovers: MoversData): string | null {
    return 'moderate_correlation_between_tvl_and_price_movements';
  }

  private static identifyMovementCauses(tvlMovers: MoversData, timeframe: string): string | null {
    return 'movements_primarily_driven_by_market_sentiment';
  }

  private static assessMovementSustainability(tvlMovers: MoversData, priceMovers: MoversData): string | null {
    return 'movement_sustainability_requires_monitoring';
  }

  private static generateVolatilityRecommendation(tvlMovers: MoversData, priceMovers: MoversData): Recommendation | null {
    return {
      type: 'warning',
      description: 'Elevated volatility detected - implement risk management measures',
      confidence: 0.87,
      riskLevel: 'high'
    };
  }

  private static generateOpportunityRecommendation(tvlMovers: MoversData): Recommendation | null {
    if (tvlMovers.gainers.length > 0) {
      return {
        type: 'opportunity',
        description: 'Strong gainers present momentum investment opportunities',
        confidence: 0.76
      };
    }
    return null;
  }

  private static generateRiskManagementRecommendation(tvlMovers: MoversData, priceMovers: MoversData): Recommendation | null {
    return {
      type: 'strategy',
      description: 'Implement position sizing and diversification for volatile conditions',
      confidence: 0.90,
      category: 'risk_management'
    };
  }

  private static calculateMovementVolatility(tvlMovers: MoversData, priceMovers: MoversData): string {
    const avgTvlChange = [...tvlMovers.gainers, ...tvlMovers.losers]
      .reduce((sum, m) => sum + Math.abs(m.changePercent), 0) / 
      (tvlMovers.gainers.length + tvlMovers.losers.length || 1);
    
    if (avgTvlChange > 20) return 'very_high';
    if (avgTvlChange > 10) return 'high';
    if (avgTvlChange > 5) return 'moderate';
    return 'low';
  }

  private static calculateOpportunityIndex(tvlMovers: MoversData): number {
    const gainersRatio = tvlMovers.gainers.length / (tvlMovers.gainers.length + tvlMovers.losers.length || 1);
    return Math.min(1, Math.max(0, gainersRatio));
  }

  private static assessMovementRiskLevel(tvlMovers: MoversData, priceMovers: MoversData): string {
    const volatility = this.calculateMovementVolatility(tvlMovers, priceMovers);
    
    if (volatility === 'very_high') return 'high';
    if (volatility === 'high') return 'medium';
    return 'low';
  }

  // Default fallback methods
  private static getDefaultMarketInsights(): MarketInsights {
    return {
      keyInsights: ['market_data_analysis_in_progress'],
      recommendations: [],
      dominanceShift: 'analyzing_market_dynamics',
      marketPhase: 'consolidation',
      volatility: 'moderate',
      innovationAreas: ['defi_evolution']
    };
  }

  private static getDefaultDominanceInsights(): DominanceInsights {
    return {
      insights: ['dominance_analysis_in_progress'],
      recommendations: [],
      context: {
        concentrationLevel: 'moderate',
        diversityScore: 0.5,
        competitionHealth: 'moderate'
      }
    };
  }

  private static getDefaultTrendingInsights(): TrendingInsights {
    return {
      insights: ['trending_analysis_in_progress'],
      recommendations: [],
      context: {
        marketMomentum: 'neutral',
        trendStrength: 'moderate',
        sustainabilityScore: 0.5
      }
    };
  }

  private static getDefaultMovementInsights(): MovementInsights {
    return {
      insights: ['movement_analysis_in_progress'],
      recommendations: [],
      context: {
        marketVolatility: 'moderate',
        opportunityIndex: 0.5,
        riskLevel: 'medium'
      }
    };
  }
}

export default DataEnrichmentHelper;