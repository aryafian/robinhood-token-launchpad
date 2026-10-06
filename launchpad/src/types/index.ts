import type { Address } from 'viem';
export type { Address };

export type CurvePhase = 0 | 1 | 2 | 3;

export interface TokenSocials {
  twitter: string;
  telegram: string;
  discord: string;
  website: string;
  farcaster: string;
}

export interface TokenLaunchInfo {
  token: Address;
  curve: Address;
  deployer: Address;
  pairToken: Address;
  launchConfigId: bigint;
  graduationThreshold: bigint;
  blockNumber: bigint;
  transactionHash: string;
}

export interface TokenData extends TokenLaunchInfo {
  name: string;
  symbol: string;
  logo: string;
  description: string;
  socials?: TokenSocials;
  quoteReserve: bigint;
  tokenReserve: bigint;
  realQuoteReserve: bigint;
  feeBps: bigint;
  creatorTaxBps: bigint;
  phase: CurvePhase;
  creatorFeeRecipient: Address;
  buybackEnabled: boolean;
  spotPriceEth: number;
  graduationProgressBps: bigint; // basis points (0 - 10000 = 0% - 100%)
  graduationProgressPercent: number;
}

export interface CurveBuyCalculation {
  quoteIn: bigint;
  fee: bigint;
  creatorTax: bigint;
  net: bigint;
  tokensOut: bigint;
  minTokensOut: bigint;
  effectivePriceEth: number;
  priceImpactPercent: number;
}

export interface CurveSellCalculation {
  tokensIn: bigint;
  grossQuoteOut: bigint;
  fee: bigint;
  creatorTax: bigint;
  netQuoteOut: bigint;
  minQuoteOut: bigint;
  effectivePriceEth: number;
  priceImpactPercent: number;
}

export interface TradeHistoryItem {
  id: string;
  type: 'buy' | 'sell';
  trader: Address;
  quoteAmount: bigint;
  tokenAmount: bigint;
  fee: bigint;
  tax: bigint;
  transactionHash: string;
  blockNumber: bigint;
  timestamp?: number;
}
