'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPublicClient, http, type Address } from 'viem';
import { robinhoodTestnet } from '../config/chain';
import { LAUNCH_FACTORY_ADDRESS, MULTICALL3_ADDRESS } from '../config/contracts';
import {
  launchFactoryAbi,
  bondingCurveAbi,
  launcherTokenAbi,
} from '../config/abis';
import type { TokenData, TokenLaunchInfo, CurvePhase } from '../types';
import {
  calculateGraduationProgressBps,
  calculateSpotPriceEth,
} from '../utils/curve';

export function useTokensWithData(tokenList: TokenLaunchInfo[]) {
  const [tokensData, setTokensData] = useState<TokenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef(
    createPublicClient({
      chain: robinhoodTestnet,
      transport: http('https://robinhood-sepolia-rpc.publicnode.com', {
        retryCount: 3,
        retryDelay: 1000,
      }),
    })
  );

  const fetchTokensData = useCallback(async () => {
    if (tokenList.length === 0) {
      setTokensData([]);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const client = clientRef.current;

      // Prepare multicall contract calls
      // 10 calls per token
      const calls: any[] = [];
      for (const t of tokenList) {
        calls.push(
          { address: t.token, abi: launcherTokenAbi, functionName: 'name' },
          { address: t.token, abi: launcherTokenAbi, functionName: 'symbol' },
          { address: t.token, abi: launcherTokenAbi, functionName: 'logo' },
          { address: t.token, abi: launcherTokenAbi, functionName: 'description' },
          { address: t.curve, abi: bondingCurveAbi, functionName: 'getReserves' },
          { address: t.curve, abi: bondingCurveAbi, functionName: 'realQuoteReserve' },
          { address: t.curve, abi: bondingCurveAbi, functionName: 'graduationThreshold' },
          { address: t.curve, abi: bondingCurveAbi, functionName: 'feeBps' },
          { address: t.curve, abi: bondingCurveAbi, functionName: 'creatorTaxBps' },
          {
            address: LAUNCH_FACTORY_ADDRESS,
            abi: launchFactoryAbi,
            functionName: 'getLaunchedToken',
            args: [t.token],
          }
        );
      }

      const results = await client.multicall({
        contracts: calls,
        allowFailure: true,
      });

      const updatedTokens: TokenData[] = [];
      const callsPerToken = 10;

      for (let i = 0; i < tokenList.length; i++) {
        const base = tokenList[i];
        const offset = i * callsPerToken;

        const nameRes = results[offset];
        const symbolRes = results[offset + 1];
        const logoRes = results[offset + 2];
        const descRes = results[offset + 3];
        const reservesRes = results[offset + 4];
        const realQuoteRes = results[offset + 5];
        const gradThreshRes = results[offset + 6];
        const feeBpsRes = results[offset + 7];
        const creatorTaxRes = results[offset + 8];
        const factoryTokenRes = results[offset + 9];

        const name = (nameRes?.status === 'success' && nameRes.result ? nameRes.result : 'Unknown Token') as string;
        const symbol = (symbolRes?.status === 'success' && symbolRes.result ? symbolRes.result : 'TOKEN') as string;
        const logo = (logoRes?.status === 'success' && logoRes.result ? logoRes.result : '') as string;
        const description = (descRes?.status === 'success' && descRes.result ? descRes.result : '') as string;

        let quoteReserve = 0n;
        let tokenReserve = 0n;
        if (reservesRes?.status === 'success' && Array.isArray(reservesRes.result)) {
          quoteReserve = BigInt(reservesRes.result[0] ?? 0);
          tokenReserve = BigInt(reservesRes.result[1] ?? 0);
        }

        const realQuoteReserve =
          realQuoteRes?.status === 'success' && realQuoteRes.result
            ? BigInt(realQuoteRes.result as any)
            : 0n;

        const graduationThreshold =
          gradThreshRes?.status === 'success' && gradThreshRes.result
            ? BigInt(gradThreshRes.result as any)
            : base.graduationThreshold;

        const feeBps =
          feeBpsRes?.status === 'success' && feeBpsRes.result
            ? BigInt(feeBpsRes.result as any)
            : 100n; // standard 1%

        const creatorTaxBps =
          creatorTaxRes?.status === 'success' && creatorTaxRes.result
            ? BigInt(creatorTaxRes.result as any)
            : 0n;

        let phase: CurvePhase = 0;
        let creatorFeeRecipient = base.deployer;
        let buybackEnabled = false;

        if (factoryTokenRes?.status === 'success' && factoryTokenRes.result) {
          const factoryInfo: any = factoryTokenRes.result;
          phase = (Number(factoryInfo.phase) as CurvePhase) ?? 0;
          if (factoryInfo.creatorFeeRecipient) {
            creatorFeeRecipient = factoryInfo.creatorFeeRecipient;
          }
          buybackEnabled = Boolean(factoryInfo.buybackEnabled);
        }

        const spotPriceEth = calculateSpotPriceEth(quoteReserve, tokenReserve);
        const graduationProgressBps = calculateGraduationProgressBps(realQuoteReserve, graduationThreshold);
        const graduationProgressPercent = Number(graduationProgressBps) / 100;

        updatedTokens.push({
          ...base,
          name,
          symbol,
          logo,
          description,
          quoteReserve,
          tokenReserve,
          realQuoteReserve,
          graduationThreshold,
          feeBps,
          creatorTaxBps,
          phase,
          creatorFeeRecipient,
          buybackEnabled,
          spotPriceEth,
          graduationProgressBps,
          graduationProgressPercent,
        });
      }

      setTokensData(updatedTokens);
    } catch (err: any) {
      console.error('Failed to fetch token market data via Multicall:', err);
      setError(err?.message || 'Failed to fetch token market data');
    } finally {
      setIsLoading(false);
    }
  }, [tokenList]);

  useEffect(() => {
    fetchTokensData();
  }, [fetchTokensData]);

  // Polling for live reserve changes every 12 seconds
  useEffect(() => {
    if (tokenList.length === 0) return;
    const interval = setInterval(() => {
      fetchTokensData();
    }, 12000);
    return () => clearInterval(interval);
  }, [fetchTokensData, tokenList.length]);

  return {
    tokensData,
    isLoading,
    error,
    refetch: fetchTokensData,
  };
}
