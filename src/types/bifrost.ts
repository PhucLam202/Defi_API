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