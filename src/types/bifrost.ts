/**
 * Unified Bifrost Types for Complete Protocol API
 * Includes yields, exchange rates, and token conversion functionality
 * Based on Bifrost documentation and real API responses
 */

// ============================================================================
// YIELDS TYPES (from yields.ts)
// ============================================================================

/// Token yield information with comprehensive APY breakdown
export interface TokenYield {
  symbol: string;
  protocol: string;
  network: string;
  apy: number;
  apyBreakdown: {
    base: number;
    reward: number;
    mev?: number;
    gas?: number;
  };
  tvl: number;
  totalValueMinted: number;
  totalIssuance: number;
  holders: number;
  price: number;
  updatedAt: string;
}

/// Raw data structure from Bifrost protocol APIs
export interface BifrostRawData {
  [key: string]: any;
  tvl: number;
  addresses: number;
  revenue: number;
  bncPrice: number;
}

// ============================================================================
// EXCHANGE RATE TYPES (enhanced)
// ============================================================================

// Enhanced token identifier for all Bifrost operations
export interface TokenIdentifier {
  symbol: string;
  network: 'bifrost' | 'moonbeam' | 'astar' | 'hydration' | 'polkadx' | 'moonriver';
  tokenId?: string | number;
  contractAddress?: string;
}

// Exchange rate with bidirectional conversion support
export interface ExchangeRate {
  baseToken: TokenIdentifier;
  vToken: TokenIdentifier;
  rate: number; // vToken to base token rate (e.g., 1 vKSM = 0.9234 KSM)
  inverseRate: number; // base token to vToken rate (e.g., 1 KSM = 1.0831 vKSM)
  timestamp: string;
  source: 'runtime' | 'frontend_api' | 'stable_pool' | 'xcm_oracle';
  confidence?: number; // 0-100, confidence level of the rate
}

// Precision-safe token amount representation
export interface TokenAmount {
  amount: string; // Use string for precision in DeFi calculations
  decimals: number;
  token: TokenIdentifier;
  usdValue?: number;
  formattedAmount?: string; // Human-readable format
}

// Exchange rate API response
export interface ExchangeRateResponse {
  success: boolean;
  data: {
    exchangeRate: ExchangeRate;
    historicalRates?: {
      rate: number;
      timestamp: string;
    }[];
    volatility?: {
      daily: number;
      weekly: number;
      monthly: number;
    };
    metadata?: {
      lastUpdate: string;
      source: string;
      blockNumber?: number;
    };
  };
  timestamp: string;
}

// Convert request parameters
export interface ConvertRequest {
  amount: string;
  fromToken: string; // token symbol
  toToken: string; // token symbol  
  network?: string;
  slippageTolerance?: number; // percentage
}

// Convert response with detailed calculation info
export interface ConvertResponse {
  success: boolean;
  data: {
    input: TokenAmount;
    output: TokenAmount;
    exchangeRate: ExchangeRate;
    calculation: {
      method: 'runtime_api' | 'frontend_api' | 'calculated';
      precision: number; // decimal precision used
      roundingApplied: boolean;
    };
    fees?: {
      swapFee: number;
      networkFee: number;
      total: number;
    };
    slippage?: number;
    minimumReceived?: TokenAmount;
    priceImpact?: number;
  };
  timestamp: string;
}

// Comprehensive vToken information (extended from existing)
export interface VTokenInfo extends TokenIdentifier {
  name: string;
  slug?: string; // URL-friendly identifier
  baseToken: TokenIdentifier;
  totalSupply: string;
  totalValueLocked: number;
  totalValueMinted: number;
  exchangeRate: ExchangeRate;
  apy: APYBreakdown;
  stakingInfo: StakingInfo;
  holders: HolderInfo;
  price: PriceInfo;
  risks: RiskInfo;
  unstakingTime: number; // seconds
  users: number; // number of stakers
  fee: number; // fee percentage
}

// APY breakdown with detailed components
export interface APYBreakdown {
  total: number;
  base: number;
  reward: number;
  mev?: number; // MEV rewards (for ETH staking)
  gas?: number; // Gas fee rewards (for ETH staking)
  fees: number; // Protocol fees deducted
  source: 'calculated' | 'api' | 'estimated';
}

// Staking-specific information
export interface StakingInfo {
  unstakingPeriod: number; // seconds
  minimumStake: string;
  maximumStake?: string;
  validatorCount?: number;
  slashingRisk: number; // percentage
  isActive: boolean;
  network: string;
}

// Holder distribution information
export interface HolderInfo {
  total: number;
  byNetwork: {
    network: string;
    holders: number;
    percentage: number;
    explorerUrl?: string;
  }[];
  topHolders?: {
    address: string;
    balance: string;
    percentage: number;
  }[];
  distribution: {
    whales: number; // holders with >1% supply
    dolphins: number; // holders with 0.1-1% supply
    retail: number; // holders with <0.1% supply
  };
}

// Price information with market data
export interface PriceInfo {
  current: number;
  change24h: number;
  change7d: number;
  change30d: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
  fullyDilutedMarketCap?: number;
}

// Risk assessment information
export interface RiskInfo {
  slashing: number; // percentage risk
  liquidity: 'high' | 'medium' | 'low';
  smartContract: 'audited' | 'unaudited' | 'partially_audited';
  centralization: number; // score 0-100 (lower is better)
  technical: {
    codeAudits: number;
    lastAuditDate?: string;
    knownVulnerabilities: number;
  };
  market: {
    volatilityScore: number; // 0-100
    liquidityScore: number; // 0-100
    correlationScore: number; // correlation with base asset
  };
}

// Runtime API specific types
export interface RuntimeApiRequest {
  method: 'getCurrencyAmountByVCurrencyAmount' | 'getVCurrencyAmountByCurrencyAmount';
  params: {
    token: number; // token index in runtime
    vtoken: number; // vtoken index in runtime
    amount: string;
  };
  network?: string;
  blockHash?: string; // Optional specific block
}

export interface RuntimeApiResponse {
  success: boolean;
  data: {
    result: string;
    blockHash: string;
    blockNumber: number;
    method: string;
    executionTime: number; // milliseconds
    chainInfo: {
      specVersion: number;
      transactionVersion: number;
      genesis: string;
    };
  };
  timestamp: string;
}

// Token index mapping for runtime API calls
export interface TokenIndex {
  symbol: string;
  index: number;
  network: string;
  type: 'native' | 'vtoken' | 'lp_token';
  decimals: number;
  isActive: boolean;
}

// Frontend API response types (matching real API structure)
export interface BifrostStakingApiResponse {
  supportedAssets: {
    symbol: string;
    slug: string;
    unstakingTime: number;
    users: number;
    apr: number;
    fee: number;
    price: number;
    exchangeRatio: number;
    supply: number;
  }[];
}

export interface BifrostSiteApiResponse {
  [tokenSymbol: string]: {
    apy?: string;
    apyBase?: string;
    apyReward?: string;
    totalApy?: string; // for vETH
    stakingApy?: string; // for vETH
    mevApy?: string; // for vETH
    gasFeeApy?: string; // for vETH
    tvl: number;
    tvm: number; // Total Value Minted
    totalIssuance: number;
    holders: number;
    price?: number;
  } | number; // Allow number values for special keys
  bncPrice: number; // BNC token price
  totalTvl: number;
  totalAddresses: number;
  totalRevenue: number;
}

// Error types for Bifrost operations
export interface BifrostError {
  code: string;
  message: string;
  type: 'VALIDATION' | 'CONVERSION' | 'NETWORK' | 'CALCULATION' | 'RUNTIME_API';
  details?: {
    network?: string;
    token?: string;
    amount?: string;
    method?: string;
    originalError?: string;
  };
}

export interface BifrostErrorResponse {
  success: false;
  error: BifrostError;
  timestamp: string;
  requestId: string;
}

// Query parameter types for API endpoints
export interface ExchangeRateQuery {
  includeHistory?: 'true' | 'false';
  historyDays?: string; // number of days
  includeVolatility?: 'true' | 'false';
  source?: 'runtime' | 'frontend' | 'auto';
}

export interface ConvertQuery {
  amount: string;
  from: string; // fromToken
  to: string; // toToken
  network?: string;
  slippage?: string; // slippage tolerance percentage
  includesFees?: 'true' | 'false';
}

// Utility types for internal operations
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  source: string;
}

export interface ConversionCache extends CacheEntry<ExchangeRate> {
  tokenPair: string; // "vKSM-KSM" format
  network: string;
}

// Type guards for runtime validation
export const isTokenIdentifier = (obj: any): obj is TokenIdentifier => {
  return obj && typeof obj.symbol === 'string' && typeof obj.network === 'string';
};

export const isExchangeRate = (obj: any): obj is ExchangeRate => {
  return obj && 
    isTokenIdentifier(obj.baseToken) && 
    isTokenIdentifier(obj.vToken) &&
    typeof obj.rate === 'number' &&
    typeof obj.inverseRate === 'number';
};

export const isTokenAmount = (obj: any): obj is TokenAmount => {
  return obj && 
    typeof obj.amount === 'string' &&
    typeof obj.decimals === 'number' &&
    isTokenIdentifier(obj.token);
};

// ============================================================================
// EXTENDED TYPES FOR NEW API ENDPOINTS
// ============================================================================

// Time series data structure for analytics
export interface TimeSeriesData {
  timestamp: string; // ISO 8601
  value: number;
  change?: number; // Change from previous period
  changePercent?: number;
}

// Pagination wrapper
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ============================================================================
// 1. GET /api/v1/bifrost/vtokens - List vTokens
// ============================================================================

export interface VTokenListResponse {
  success: boolean;
  data: {
    tokens: VTokenSummary[];
    summary: VTokenEcosystemSummary;
    networks: NetworkInfo[];
  };
  pagination: PaginationInfo;
  metadata: {
    lastUpdate: string;
    dataSource: string[];
    cacheAge: number; // seconds
  };
  timestamp: string;
}

export interface VTokenSummary {
  // Basic Info
  token: TokenIdentifier;
  baseToken: TokenIdentifier;
  
  // Financial Metrics
  exchangeRate: {
    current: number;
    change24h: number;
    change7d: number;
    lastUpdate: string;
  };
  
  apy: {
    current: number;
    average30d: number;
    min30d: number;
    max30d: number;
    trend: 'up' | 'down' | 'stable';
  };
  
  // TVL & Supply
  tvl: {
    total: number; // USD value
    change24h: number;
    change7d: number;
    rank: number; // Rank among all vTokens
  };
  
  totalSupply: {
    amount: string;
    usdValue: number;
    circulatingSupply: string;
  };
  
  // Market Data
  price: {
    current: number;
    change24h: number;
    high24h: number;
    low24h: number;
    volume24h: number;
    marketCap: number;
  };
  
  // Basic Stats
  holders: {
    total: number;
    change24h: number;
    topHolderPercentage: number;
  };
  
  // Risk & Status
  status: 'active' | 'paused' | 'deprecated';
  riskLevel: 'low' | 'medium' | 'high';
  auditStatus: 'audited' | 'unaudited' | 'pending';
  
  // Quick Access Links
  links: {
    subscan?: string;
    polkadot?: string;
    documentation?: string;
  };
}

export interface VTokenEcosystemSummary {
  totalTVL: number;
  totalTokens: number;
  totalHolders: number;
  averageAPY: number;
  totalVolume24h: number;
  
  breakdown: {
    byNetwork: {
      network: string;
      tvl: number;
      tokenCount: number;
      percentage: number;
    }[];
    
    byRiskLevel: {
      level: 'low' | 'medium' | 'high';
      count: number;
      percentage: number;
    }[];
  };
  
  trends: {
    tvlChange7d: number;
    apyChange7d: number;
    holdersChange7d: number;
  };
}

export interface NetworkInfo {
  name: string;
  status: 'active' | 'maintenance' | 'deprecated';
  latency: number; // ms
  blockHeight: number;
  lastSync: string;
  supportedTokens: string[];
}

export interface VTokenListQuery {
  page?: number;
  limit?: number;
  network?: string[];
  minApy?: number;
  maxApy?: number;
  minTvl?: number;
  sortBy?: 'apy' | 'tvl' | 'volume' | 'holders' | 'name';
  sortOrder?: 'asc' | 'desc';
  status?: 'active' | 'paused' | 'deprecated';
  riskLevel?: 'low' | 'medium' | 'high';
}

// ============================================================================
// 2. GET /api/v1/bifrost/vtokens/{symbol} - Detailed vToken
// ============================================================================

export interface VTokenDetailResponse {
  success: boolean;
  data: VTokenDetail;
  timestamp: string;
}

export interface VTokenDetail {
  // Complete Token Info
  token: TokenIdentifier;
  baseToken: TokenIdentifier;
  
  // Detailed Financial Metrics
  exchangeRate: ExchangeRateDetail;
  apy: APYBreakdownDetailed;
  
  // Comprehensive TVL Data
  tvl: TVLBreakdown;
  
  // Supply & Distribution
  supply: SupplyInfo;
  
  // Detailed Market Data
  price: PriceDetail;
  
  // Staking Information
  staking: StakingDetail;
  
  // Holder Analysis
  holders: HolderAnalysis;
  
  // Risk Assessment
  risk: RiskAssessment;
  
  // Protocol Integration
  integrations: ProtocolIntegration[];
  
  // Performance Metrics
  performance: PerformanceMetrics;
  
  // Governance & Events
  governance: GovernanceInfo;
  events: RecentEvents;
  
  // Technical Data
  technical: TechnicalInfo;
}

export interface ExchangeRateDetail {
  current: number;
  precision: number;
  history: {
    '1h': number;
    '24h': number;
    '7d': number;
    '30d': number;
  };
  
  volatility: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  
  sources: {
    primary: string;
    fallback: string[];
    confidence: number; // 0-100
  };
  
  nextUpdate: string;
}

export interface APYBreakdownDetailed extends APYBreakdown {
  components: {
    staking: number; // Base staking rewards
    liquidityMining?: number; // Additional LP rewards
    mev?: number; // MEV rewards
    fees?: number; // Protocol fees earned
    other?: number; // Other reward sources
  };
  
  fees: {
    protocol: number; // Protocol fee percentage
    validator: number; // Validator commission
    slashing: number; // Expected slashing losses
    gas: number; // Average gas costs
  };
  
  netApy: number; // APY after all fees
  
  historical: TimeSeriesData[];
  
  projections: {
    conservative: number;
    expected: number;
    optimistic: number;
    timeframe: string;
  };
}

export interface TVLBreakdown {
  total: {
    usd: number;
    native: string; // In base token
    change: {
      '1h': number;
      '24h': number;
      '7d': number;
      '30d': number;
    };
  };
  
  composition: {
    staked: number; // Actually staked amount
    unstaking: number; // Tokens in unstaking period
    liquid: number; // Available liquidity
    reserves: number; // Protocol reserves
  };
  
  distribution: {
    validators: {
      validatorId: string;
      name?: string;
      amount: string;
      percentage: number;
      commission: number;
      status: 'active' | 'inactive' | 'slashed';
    }[];
  };
  
  history: TimeSeriesData[];
  
  flows: {
    inflows24h: number;
    outflows24h: number;
    netFlow24h: number;
  };
}

export interface SupplyInfo {
  total: {
    amount: string;
    percentage: number; // Of max supply
  };
  
  circulating: {
    amount: string;
    percentage: number; // Of total supply
  };
  
  locked: {
    staking: string;
    vesting: string;
    governance: string;
    other: string;
  };
  
  inflation: {
    rate: number; // Annual inflation rate
    mechanism: string;
    nextChange: string;
  };
  
  burns: {
    total: string;
    mechanism: string;
    lastBurn: {
      amount: string;
      date: string;
      reason: string;
    };
  };
}

export interface PriceDetail {
  current: {
    usd: number;
    btc?: number;
    eth?: number;
    baseToken: number;
  };
  
  ohlc24h: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  
  volume: {
    '24h': number;
    '7d': number;
    '30d': number;
  };
  
  marketCap: {
    current: number;
    fullyDiluted: number;
    rank: number;
  };
  
  liquidity: {
    available: number;
    depth: {
      '1%': number; // Liquidity within 1% of current price
      '5%': number;
      '10%': number;
    };
  };
  
  priceFeeds: {
    source: string;
    price: number;
    weight: number;
    lastUpdate: string;
  }[];
}

export interface StakingDetail {
  parameters: {
    unstakingPeriod: number; // seconds
    minimumStake: string;
    maximumStake?: string;
    slashingConditions: string[];
  };
  
  validators: {
    total: number;
    active: number;
    avgCommission: number;
    topValidators: {
      id: string;
      name?: string;
      commission: number;
      stake: string;
      performance: number; // 0-100
      uptime: number; // 0-100
    }[];
  };
  
  rewards: {
    frequency: string; // 'block' | 'era' | 'epoch'
    lastDistribution: string;
    nextDistribution: string;
    claimable: boolean;
  };
  
  slashing: {
    events: {
      date: string;
      validator: string;
      amount: string;
      reason: string;
    }[];
    totalSlashed: string;
    riskScore: number; // 0-100
  };
}

export interface HolderAnalysis extends HolderInfo {
  distribution: {
    range: string; // e.g., "0-1", "1-10", etc.
    holders: number;
    percentage: number;
    totalValue: number;
  }[];
  
  concentration: {
    top10Percentage: number;
    top50Percentage: number;
    top100Percentage: number;
    giniCoefficient: number; // Wealth inequality measure
  };
  
  activity: {
    activeHolders24h: number;
    newHolders24h: number;
    churned24h: number;
    averageHoldTime: number; // days
  };
  
  geographic?: {
    region: string;
    percentage: number;
  }[];
}

export interface RiskAssessment {
  overall: {
    score: number; // 0-100 (higher = riskier)
    level: 'low' | 'medium' | 'high';
    lastAssessment: string;
  };
  
  categories: {
    smartContract: {
      score: number;
      audits: {
        firm: string;
        date: string;
        report: string;
        issues: {
          critical: number;
          high: number;
          medium: number;
          low: number;
        };
      }[];
      codeQuality: number;
    };
    
    centralization: {
      score: number;
      factors: {
        validatorConcentration: number;
        governanceConcentration: number;
        developmentTeam: number;
      };
    };
    
    market: {
      score: number;
      factors: {
        liquidity: number;
        volatility: number;
        correlations: {
          symbol: string;
          correlation: number;
        }[];
      };
    };
    
    operational: {
      score: number;
      factors: {
        uptime: number;
        networkStability: number;
        slashingHistory: number;
      };
    };
  };
  
  warnings: {
    type: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    since: string;
    resolved?: string;
  }[];
}

export interface ProtocolIntegration {
  protocol: string;
  type: 'dex' | 'lending' | 'farming' | 'governance';
  tvl: number;
  apy?: number;
  status: 'active' | 'deprecated';
  link?: string;
}

export interface PerformanceMetrics {
  returns: {
    '1d': number;
    '7d': number;
    '30d': number;
    '90d': number;
    '1y': number;
    sinceInception: number;
  };
  
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
  
  benchmarks: {
    name: string;
    performance: number;
    correlation: number;
  }[];
  
  efficiency: {
    capitalEfficiency: number; // TVL/rewards ratio
    costBasis: number; // Average cost to stake
    breakeven: number; // Days to break even on fees
  };
}

export interface GovernanceInfo {
  votingPower: string; // Total voting power of token
  activeProposals: {
    id: string;
    title: string;
    status: 'active' | 'passed' | 'failed';
    endTime: string;
    participation: number;
  }[];
  
  recentDecisions: {
    proposal: string;
    decision: string;
    impact: string;
    date: string;
  }[];
}

export interface RecentEvents {
  updates: {
    type: 'upgrade' | 'parameter_change' | 'incident' | 'announcement';
    title: string;
    description: string;
    date: string;
    impact: 'low' | 'medium' | 'high';
    link?: string;
  }[];
  
  milestones: {
    name: string;
    date: string;
    description: string;
  }[];
}

export interface TechnicalInfo {
  blockchain: {
    network: string;
    consensusMechanism: string;
    blockTime: number; // seconds
    finalityTime: number; // seconds
  };
  
  contracts: {
    address: string;
    version: string;
    upgradeability: boolean;
    verificationStatus: 'verified' | 'unverified';
  }[];
  
  apis: {
    rpc: string[];
    graphql?: string;
    rest?: string;
  };
  
  sdk: {
    languages: string[];
    documentation: string;
    examples: string;
  };
}

