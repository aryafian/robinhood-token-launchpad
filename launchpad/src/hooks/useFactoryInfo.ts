'use client';

import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { LAUNCH_FACTORY_ADDRESS } from '../config/contracts';
import { launchFactoryAbi } from '../config/abis';

export function useFactoryInfo() {
  const { data: launchFeeWei, isLoading, error, refetch } = useReadContract({
    address: LAUNCH_FACTORY_ADDRESS,
    abi: launchFactoryAbi,
    functionName: 'launchFee',
  });

  const launchFeeEth = launchFeeWei ? formatEther(launchFeeWei as bigint) : '0';

  return {
    launchFeeWei: (launchFeeWei as bigint | undefined) ?? 0n,
    launchFeeEth,
    isLoading,
    error,
    refetch,
  };
}
