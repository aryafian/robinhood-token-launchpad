'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPublicClient, http, parseAbiItem, type Address } from 'viem';
import { robinhoodTestnet } from '../config/chain';
import {
  LAUNCH_FACTORY_ADDRESS,
  FACTORY_DEPLOY_BLOCK,
  LOG_CHUNK_SIZE,
  ZERO_ADDRESS,
} from '../config/contracts';
import type { TokenLaunchInfo } from '../types';

const TOKEN_LAUNCHED_EVENT = parseAbiItem(
  'event TokenLaunched(address indexed token, address indexed curve, address indexed deployer, address pairToken, uint256 launchConfigId, uint256 graduationThreshold)'
);

const CACHE_KEY_TOKENS = 'rh_launchpad_tokens_v1';
const CACHE_KEY_BLOCK = 'rh_launchpad_last_block_v1';

export function useTokenIndexer() {
  const [tokens, setTokens] = useState<TokenLaunchInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedBlock, setScannedBlock] = useState<bigint>(FACTORY_DEPLOY_BLOCK);
  const [latestBlock, setLatestBlock] = useState<bigint>(FACTORY_DEPLOY_BLOCK);

  const clientRef = useRef(
    createPublicClient({
      chain: robinhoodTestnet,
      transport: http('https://robinhood-sepolia-rpc.publicnode.com', {
        retryCount: 3,
        retryDelay: 1000,
      }),
    })
  );

  const fetchTokens = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    }

    try {
      setError(null);
      const client = clientRef.current;
      const currentLatestBlock = await client.getBlockNumber();
      setLatestBlock(currentLatestBlock);

      // Check local cache
      let cachedTokens: TokenLaunchInfo[] = [];
      let startBlock = FACTORY_DEPLOY_BLOCK;

      if (typeof window !== 'undefined') {
        try {
          const rawTokens = localStorage.getItem(CACHE_KEY_TOKENS);
          const rawBlock = localStorage.getItem(CACHE_KEY_BLOCK);
          if (rawTokens && rawBlock) {
            const parsed = JSON.parse(rawTokens);
            cachedTokens = parsed.map((item: any) => ({
              ...item,
              launchConfigId: BigInt(item.launchConfigId),
              graduationThreshold: BigInt(item.graduationThreshold),
              blockNumber: BigInt(item.blockNumber),
            }));
            const lastSavedBlock = BigInt(rawBlock);
            if (lastSavedBlock >= FACTORY_DEPLOY_BLOCK && lastSavedBlock < currentLatestBlock) {
              startBlock = lastSavedBlock + 1n;
            } else if (lastSavedBlock >= currentLatestBlock) {
              // Already up to date
              setTokens(cachedTokens);
              setScannedBlock(lastSavedBlock);
              setIsLoading(false);
              setIsRefreshing(false);
              return;
            }
          }
        } catch (cacheErr) {
          console.warn('Could not read token cache:', cacheErr);
        }
      }

      // If we had cached tokens, display them immediately while checking new blocks
      if (cachedTokens.length > 0) {
        setTokens(cachedTokens);
      }

      // Chunked scanning
      const newTokens: TokenLaunchInfo[] = [];
      let currentFrom = startBlock;

      while (currentFrom <= currentLatestBlock) {
        let currentTo = currentFrom + LOG_CHUNK_SIZE;
        if (currentTo > currentLatestBlock) {
          currentTo = currentLatestBlock;
        }

        try {
          const logs = await client.getLogs({
            address: LAUNCH_FACTORY_ADDRESS,
            event: TOKEN_LAUNCHED_EVENT,
            fromBlock: currentFrom,
            toBlock: currentTo,
          });

          for (const log of logs) {
            if (log.args.token && log.args.curve) {
              newTokens.push({
                token: log.args.token as Address,
                curve: log.args.curve as Address,
                deployer: (log.args.deployer || ZERO_ADDRESS) as Address,
                pairToken: (log.args.pairToken || ZERO_ADDRESS) as Address,
                launchConfigId: log.args.launchConfigId ?? 1n,
                graduationThreshold: log.args.graduationThreshold ?? 0n,
                blockNumber: log.blockNumber ?? currentFrom,
                transactionHash: log.transactionHash ?? '',
              });
            }
          }
        } catch (chunkErr: any) {
          console.error(`Error scanning blocks ${currentFrom} - ${currentTo}:`, chunkErr);
          // If a chunk fails, we record error and stop scanning
          throw chunkErr;
        }

        currentFrom = currentTo + 1n;
      }

      // Merge and deduplicate by token address
      const combined = [...cachedTokens, ...newTokens];
      const seen = new Set<string>();
      const deduped: TokenLaunchInfo[] = [];

      for (const t of combined) {
        const lower = t.token.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          deduped.push(t);
        }
      }

      setTokens(deduped);
      setScannedBlock(currentLatestBlock);

      // Save to localStorage
      if (typeof window !== 'undefined') {
        try {
          const serialized = deduped.map((t) => ({
            ...t,
            launchConfigId: t.launchConfigId.toString(),
            graduationThreshold: t.graduationThreshold.toString(),
            blockNumber: t.blockNumber.toString(),
          }));
          localStorage.setItem(CACHE_KEY_TOKENS, JSON.stringify(serialized));
          localStorage.setItem(CACHE_KEY_BLOCK, currentLatestBlock.toString());
        } catch (saveErr) {
          console.warn('Could not save token cache:', saveErr);
        }
      }
    } catch (err: any) {
      console.error('Failed to index tokens:', err);
      setError(err?.message || 'Failed to fetch tokens from blockchain');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  // Periodic polling every 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTokens();
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchTokens]);

  const refresh = useCallback(() => {
    return fetchTokens(true);
  }, [fetchTokens]);

  return {
    tokens,
    isLoading,
    isRefreshing,
    error,
    scannedBlock,
    latestBlock,
    refresh,
  };
}
