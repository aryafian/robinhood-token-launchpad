import type { CurveBuyCalculation, CurveSellCalculation } from '../types';

const BPS_DENOMINATOR = 10000n;

/**
 * Calculate tokens out for buying with quoteIn (ETH) using the exact curve formula:
 * fee        = quoteIn * feeBps / 10000
 * creatorTax = quoteIn * creatorTaxBps / 10000
 * net        = quoteIn - fee - creatorTax
 * tokensOut  = net * tokenReserve / (quoteReserve + net)
 * minTokensOut = tokensOut * (10000 - slippageBps) / 10000
 */
export function calculateCurveBuy(
  quoteIn: bigint,
  quoteReserve: bigint,
  tokenReserve: bigint,
  feeBps: bigint,
  creatorTaxBps: bigint,
  slippageBps = 100n // default 1% = 100 bps
): CurveBuyCalculation {
  if (quoteIn <= 0n || quoteReserve <= 0n || tokenReserve <= 0n) {
    return {
      quoteIn: 0n,
      fee: 0n,
      creatorTax: 0n,
      net: 0n,
      tokensOut: 0n,
      minTokensOut: 0n,
      effectivePriceEth: 0,
      priceImpactPercent: 0,
    };
  }

  const fee = (quoteIn * feeBps) / BPS_DENOMINATOR;
  const creatorTax = (quoteIn * creatorTaxBps) / BPS_DENOMINATOR;
  const net = quoteIn - fee - creatorTax;

  if (net <= 0n) {
    return {
      quoteIn,
      fee,
      creatorTax,
      net: 0n,
      tokensOut: 0n,
      minTokensOut: 0n,
      effectivePriceEth: 0,
      priceImpactPercent: 0,
    };
  }

  const denominator = quoteReserve + net;
  const tokensOut = (net * tokenReserve) / denominator;

  // Slippage protection
  const slippageFactor = BPS_DENOMINATOR - slippageBps;
  const minTokensOut = (tokensOut * (slippageFactor > 0n ? slippageFactor : 0n)) / BPS_DENOMINATOR;

  // Effective price: quoteIn / tokensOut
  const spotPrice = Number(quoteReserve) / Number(tokenReserve);
  const effectivePrice = tokensOut > 0n ? Number(quoteIn) / Number(tokensOut) : spotPrice;
  const priceImpact = spotPrice > 0 ? Math.max(0, ((effectivePrice - spotPrice) / spotPrice) * 100) : 0;

  return {
    quoteIn,
    fee,
    creatorTax,
    net,
    tokensOut,
    minTokensOut,
    effectivePriceEth: effectivePrice,
    priceImpactPercent: priceImpact,
  };
}

/**
 * Calculate quote out for selling tokensIn:
 * grossQuoteOut = tokensIn * quoteReserve / (tokenReserve + tokensIn)
 * fee           = grossQuoteOut * feeBps / 10000
 * creatorTax    = grossQuoteOut * creatorTaxBps / 10000
 * netQuoteOut   = grossQuoteOut - fee - creatorTax
 * minQuoteOut   = netQuoteOut * (10000 - slippageBps) / 10000
 */
export function calculateCurveSell(
  tokensIn: bigint,
  quoteReserve: bigint,
  tokenReserve: bigint,
  feeBps: bigint,
  creatorTaxBps: bigint,
  slippageBps = 100n
): CurveSellCalculation {
  if (tokensIn <= 0n || quoteReserve <= 0n || tokenReserve <= 0n) {
    return {
      tokensIn: 0n,
      grossQuoteOut: 0n,
      fee: 0n,
      creatorTax: 0n,
      netQuoteOut: 0n,
      minQuoteOut: 0n,
      effectivePriceEth: 0,
      priceImpactPercent: 0,
    };
  }

  const denominator = tokenReserve + tokensIn;
  const grossQuoteOut = (tokensIn * quoteReserve) / denominator;
  const fee = (grossQuoteOut * feeBps) / BPS_DENOMINATOR;
  const creatorTax = (grossQuoteOut * creatorTaxBps) / BPS_DENOMINATOR;
  const netQuoteOut = grossQuoteOut > fee + creatorTax ? grossQuoteOut - fee - creatorTax : 0n;

  const slippageFactor = BPS_DENOMINATOR - slippageBps;
  const minQuoteOut = (netQuoteOut * (slippageFactor > 0n ? slippageFactor : 0n)) / BPS_DENOMINATOR;

  const spotPrice = Number(quoteReserve) / Number(tokenReserve);
  const effectivePrice = tokensIn > 0n ? Number(netQuoteOut) / Number(tokensIn) : spotPrice;
  const priceImpact = spotPrice > 0 ? Math.max(0, ((spotPrice - effectivePrice) / spotPrice) * 100) : 0;

  return {
    tokensIn,
    grossQuoteOut,
    fee,
    creatorTax,
    netQuoteOut,
    minQuoteOut,
    effectivePriceEth: effectivePrice,
    priceImpactPercent: priceImpact,
  };
}

/**
 * Calculate graduation progress in basis points (0 to 10000)
 */
export function calculateGraduationProgressBps(
  realQuoteReserve: bigint,
  graduationThreshold: bigint
): bigint {
  if (graduationThreshold <= 0n) return 10000n;
  const bps = (realQuoteReserve * BPS_DENOMINATOR) / graduationThreshold;
  return bps > BPS_DENOMINATOR ? BPS_DENOMINATOR : bps;
}

/**
 * Calculate spot price in ETH per token
 */
export function calculateSpotPriceEth(quoteReserve: bigint, tokenReserve: bigint): number {
  if (quoteReserve <= 0n || tokenReserve <= 0n) return 0;
  return Number(quoteReserve) / Number(tokenReserve);
}
