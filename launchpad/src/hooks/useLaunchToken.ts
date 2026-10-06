'use client';

import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import {
  createPublicClient,
  http,
  bytesToHex,
  decodeEventLog,
  type Address,
  type Hash,
} from 'viem';
import { robinhoodTestnet } from '../config/chain';
import { LAUNCH_FACTORY_ADDRESS, ZERO_ADDRESS } from '../config/contracts';
import { launchFactoryAbi } from '../config/abis';

export interface LaunchTokenFormInput {
  name: string;
  symbol: string;
  logo: string;
  description: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  website?: string;
  farcaster?: string;
  creatorTaxPercent?: number; // 0% to 10%
}

export type LaunchStep =
  | 'idle'
  | 'checking'
  | 'waiting_wallet'
  | 'submitted'
  | 'success'
  | 'rejected'
  | 'error';

export interface LaunchState {
  step: LaunchStep;
  txHash: Hash | null;
  newTokenAddress: Address | null;
  newCurveAddress: Address | null;
  errorMessage: string | null;
}

export function useLaunchToken() {
  const { address: userAddress, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [launchState, setLaunchState] = useState<LaunchState>({
    step: 'idle',
    txHash: null,
    newTokenAddress: null,
    newCurveAddress: null,
    errorMessage: null,
  });

  const resetLaunchState = () => {
    setLaunchState({
      step: 'idle',
      txHash: null,
      newTokenAddress: null,
      newCurveAddress: null,
      errorMessage: null,
    });
  };

  const launchToken = async (
    form: LaunchTokenFormInput,
    onSuccessCallback?: (token: Address, curve: Address) => void
  ) => {
    if (!isConnected || !userAddress || !walletClient) {
      setLaunchState({
        step: 'error',
        txHash: null,
        newTokenAddress: null,
        newCurveAddress: null,
        errorMessage: 'Please connect your wallet first',
      });
      return;
    }

    try {
      setLaunchState({
        step: 'checking',
        txHash: null,
        newTokenAddress: null,
        newCurveAddress: null,
        errorMessage: null,
      });

      const publicClient = createPublicClient({
        chain: robinhoodTestnet,
        transport: http('https://robinhood-sepolia-rpc.publicnode.com'),
      });

      // 1. Check canLaunch
      const canLaunch = await publicClient.readContract({
        address: LAUNCH_FACTORY_ADDRESS,
        abi: launchFactoryAbi,
        functionName: 'canLaunch',
        args: [userAddress],
      });

      if (!canLaunch) {
        throw new Error('Your wallet address is not authorized to launch tokens yet (canLaunch check failed).');
      }

      // 2. Read launchFee
      const launchFee = await publicClient.readContract({
        address: LAUNCH_FACTORY_ADDRESS,
        abi: launchFactoryAbi,
        functionName: 'launchFee',
      });

      // 3. Read expectedEconomics from previewLaunchEconomics(1, address(0))
      const expectedEconomics = await publicClient.readContract({
        address: LAUNCH_FACTORY_ADDRESS,
        abi: launchFactoryAbi,
        functionName: 'previewLaunchEconomics',
        args: [1n, ZERO_ADDRESS],
      });

      // 4. Generate random 32-byte salt
      const saltBytes = new Uint8Array(32);
      if (typeof window !== 'undefined' && window.crypto) {
        window.crypto.getRandomValues(saltBytes);
      } else {
        for (let i = 0; i < 32; i++) saltBytes[i] = Math.floor(Math.random() * 256);
      }
      const salt = bytesToHex(saltBytes) as Hash;

      // 5. Creator tax bps (0 to 1000 = 0% to 10%)
      const creatorTaxBps = Math.min(
        1000,
        Math.max(0, Math.round((form.creatorTaxPercent || 0) * 100))
      );

      const params = {
        name: form.name.trim().slice(0, 64),
        symbol: form.symbol.trim().toUpperCase().slice(0, 16),
        logo: form.logo.trim(),
        description: form.description.trim(),
        socials: {
          twitter: form.twitter?.trim() || '',
          telegram: form.telegram?.trim() || '',
          discord: form.discord?.trim() || '',
          website: form.website?.trim() || '',
          farcaster: form.farcaster?.trim() || '',
        },
        creatorFeeRecipient: ZERO_ADDRESS, // defaults to msg.sender
        creatorTaxBps,
        buybackEnabled: false,
        expectedEconomics,
        salt,
      };

      setLaunchState({
        step: 'waiting_wallet',
        txHash: null,
        newTokenAddress: null,
        newCurveAddress: null,
        errorMessage: null,
      });

      // 6. Call launchToken(params, 1, address(0))
      const hash = await walletClient.writeContract({
        address: LAUNCH_FACTORY_ADDRESS,
        abi: launchFactoryAbi,
        functionName: 'launchToken',
        args: [params, 1n, ZERO_ADDRESS],
        value: launchFee,
      });

      setLaunchState({
        step: 'submitted',
        txHash: hash,
        newTokenAddress: null,
        newCurveAddress: null,
        errorMessage: null,
      });

      // 7. Wait for receipt
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      if (receipt.status !== 'success') {
        throw new Error('Launch transaction reverted on-chain');
      }

      // Parse TokenLaunched event
      let createdToken: Address | null = null;
      let createdCurve: Address | null = null;

      for (const log of receipt.logs) {
        try {
          if (log.address.toLowerCase() === LAUNCH_FACTORY_ADDRESS.toLowerCase()) {
            const decoded = decodeEventLog({
              abi: launchFactoryAbi,
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === 'TokenLaunched') {
              createdToken = (decoded.args as any).token;
              createdCurve = (decoded.args as any).curve;
              break;
            }
          }
        } catch {
          // skip
        }
      }

      setLaunchState({
        step: 'success',
        txHash: hash,
        newTokenAddress: createdToken,
        newCurveAddress: createdCurve,
        errorMessage: null,
      });

      if (createdToken && createdCurve && onSuccessCallback) {
        onSuccessCallback(createdToken, createdCurve);
      }
    } catch (err: any) {
      console.error('Launch token error:', err);
      const isRejection =
        err?.code === 4001 ||
        err?.message?.toLowerCase().includes('user rejected');

      setLaunchState({
        step: isRejection ? 'rejected' : 'error',
        txHash: null,
        newTokenAddress: null,
        newCurveAddress: null,
        errorMessage: err?.shortMessage || err?.message || 'Failed to launch token',
      });
    }
  };

  return {
    launchState,
    launchToken,
    resetLaunchState,
  };
}
