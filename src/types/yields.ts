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

export interface BifrostRawData {
  [key: string]: any;
  tvl: number;
  addresses: number;
  revenue: number;
  bncPrice: number;
}