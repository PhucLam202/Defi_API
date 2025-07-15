export interface ChainCirculating {
  [chainName: string]: {
    current: {
      peggedUSD: number;
    };
    circulatingPrevDay?: {
      peggedUSD: number;
    };
    circulatingPrevWeek?: {
      peggedUSD: number;
    };
    circulatingPrevMonth?: {
      peggedUSD: number;
    };
  };
}

export interface StablecoinAsset {
  id: string;
  name: string;
  symbol: string;
  geckoId?: string;
  pegType: 'peggedUSD' | 'peggedEUR' | 'peggedGBP' | string;
  pegMechanism: 'fiat-backed' | 'crypto-backed' | 'algorithmic' | string;
  priceSource?: string;
  marketCap: number;
  price: number;
  pegStability: number;
  circulation: {
    current: number;
    prevDay?: number;
    prevWeek?: number;
    prevMonth?: number;
  };
  chains: string[];
  chainCirculating: ChainCirculating;
  riskLevel: 'low' | 'medium' | 'high';
  growthRates: {
    daily?: number;
    weekly?: number;
    monthly?: number;
  };
  updatedAt: string;
}

export interface StablecoinFilters {
  pegType?: string;
  mechanism?: string;
  minMarketCap?: number;
  chain?: string;
  sortBy?: 'marketCap' | 'stability' | 'growth' | 'name';
  sortOrder?: 'asc' | 'desc';
  includeChainData?: boolean;
  limit?: number;
  offset?: number;
}

export interface StablecoinAnalytics {
  totalMarketCap: number;
  totalStablecoins: number;
  mechanismBreakdown: {
    [mechanism: string]: {
      count: number;
      marketCap: number;
      percentage: number;
    };
  };
  chainBreakdown: {
    [chain: string]: {
      stablecoins: number;
      totalCirculation: number;
      percentage: number;
    };
  };
  stabilityMetrics: {
    averageStability: number;
    depeggedCount: number;
    riskDistribution: {
      low: number;
      medium: number;
      high: number;
    };
  };
  updatedAt: string;
}

export interface DeFiLlamaStablecoinResponse {
  peggedAssets: DeFiLlamaStablecoin[];
}

export interface DeFiLlamaStablecoin {
  id: string;
  name: string;
  symbol: string;
  gecko_id?: string;
  pegType: string;
  pegMechanism: string;
  priceSource?: string;
  circulating: {
    peggedUSD: number;
  };
  circulatingPrevDay?: {
    peggedUSD: number;
  };
  circulatingPrevWeek?: {
    peggedUSD: number;
  };
  circulatingPrevMonth?: {
    peggedUSD: number;
  };
  chainCirculating: ChainCirculating;
  chains: string[];
  price: number;
}