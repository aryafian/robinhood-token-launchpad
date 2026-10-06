'use client';

import { useState, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import {
  createPublicClient,
  http,
  decodeEventLog,
  type Address,
  type Hash,
} from 'viem';
import { robinhoodTestnet } from '../config/chain';
import { bondingCurveAbi, launcherTokenAbi } from '../config/abis';

export type TradeStep =
  | 'idle'
  | 'waiting_wallet'
  | 'submitted'
  | 'success'
  | 'rejected'
  | 'error';

export interface TradeState {
  step: TradeStep;
  txHash: Hash | null;
  tokensReceived: bigint | null;
  quoteReceived: bigint | null;
  errorMessage: string | null;
}

export function useCurveTrade() {
  const { address: userAddress, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [tradeState, setTradeState] = useState<TradeState>({
    step: 'idle',
    txHash: null,
    tokensReceived: null,
    quoteReceived: null,
    errorMessage: null,
  });

  const resetState = useCallback(() => {
    setTradeState({
      step: 'idle',
      txHash: null,
      tokensReceived: null,
      quoteReceived: null,
      errorMessage: null,
    });
  }, []);

  const decodeCustomError = (err: any): string => {
    const errorStr = (err?.message || err?.shortMessage || err?.data || '').toString().toLowerCase();

    if (
      err?.code === 4001 ||
      errorStr.includes('user rejected') ||
      errorStr.includes('user denied')
    ) {
      return 'Transaction rejected in wallet';
    }

    if (errorStr.includes('slippageexceeded') || errorStr.includes('0x808b26f5')) {
      return 'Slippage exceeded: price moved during transaction. Try increasing slippage tolerance (e.g. 2%-5%).';
    }

    if (errorStr.includes('curvegraduated') || errorStr.includes('0x34460a80')) {
      return 'Curve graduated: this token has graduated to Uniswap v4 and is no longer traded on the bonding curve.';
    }

    if (errorStr.includes('insufficient funds') || errorStr.includes('exceeds balance')) {
      return 'Insufficient ETH balance in your wallet to cover purchase and gas fee.';
    }

    if (err?.shortMessage) {
      return err.shortMessage;
    }

    return err?.message || 'Transaction failed on Robinhood Testnet';
  };

  /**
   * Execute BUY on Bonding Curve:
   * buy(uint256 quoteIn, uint256 minTokensOut, address recipient) payable
   */
  const executeBuy = async (
    curveAddress: Address,
    quoteIn: bigint,
    minTokensOut: bigint,
    onSuccessCallback?: () => void
  ) => {
    if (!isConnected || !userAddress) {
      setTradeState({
        step: 'error',
        txHash: null,
        tokensReceived: null,
        quoteReceived: null,
        errorMessage: 'Please connect your wallet first',
      });
      return;
    }

    if (!walletClient) {
      setTradeState({
        step: 'error',
        txHash: null,
        tokensReceived: null,
        quoteReceived: null,
        errorMessage: 'Wallet client not ready. Ensure MetaMask is unlocked.',
      });
      return;
    }

    setTradeState({
      step: 'waiting_wallet',
      txHash: null,
      tokensReceived: null,
      quoteReceived: null,
      errorMessage: null,
    });

    try {
      // Send transaction
      const hash = await walletClient.writeContract({
        address: curveAddress,
        abi: bondingCurveAbi,
        functionName: 'buy',
        args: [quoteIn, minTokensOut, userAddress],
        value: quoteIn,
      });

      setTradeState({
        step: 'submitted',
        txHash: hash,
        tokensReceived: null,
        quoteReceived: null,
        errorMessage: null,
      });

      // Wait for receipt
      const publicClient = createPublicClient({
        chain: robinhoodTestnet,
        transport: http('https://robinhood-sepolia-rpc.publicnode.com'),
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      if (receipt.status !== 'success') {
        throw new Error('Transaction reverted on-chain');
      }

      // Parse CurveBuy event from receipt logs
      let exactTokensOut = minTokensOut;
      for (const log of receipt.logs) {
        try {
          if (log.address.toLowerCase() === curveAddress.toLowerCase()) {
            const decoded = decodeEventLog({
              abi: bondingCurveAbi,
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === 'CurveBuy') {
              exactTokensOut = (decoded.args as any).tokensOut;
              break;
            }
          }
        } catch {
          // not this event
        }
      }

      setTradeState({
        step: 'success',
        txHash: hash,
        tokensReceived: exactTokensOut,
        quoteReceived: null,
        errorMessage: null,
      });

      if (onSuccessCallback) {
        onSuccessCallback();
      }
    } catch (err: any) {
      console.error('Buy transaction error:', err);
      const isRejection =
        err?.code === 4001 ||
        err?.message?.toLowerCase().includes('user rejected') ||
        err?.message?.toLowerCase().includes('user denied');

      setTradeState({
        step: isRejection ? 'rejected' : 'error',
        txHash: null,
        tokensReceived: null,
        quoteReceived: null,
        errorMessage: decodeCustomError(err),
      });
    }
  };

  /**
   * Execute SELL on Bonding Curve (Bonus):
   * approve(curve, tokensIn) then sell(tokensIn, minQuoteOut, recipient)
   */
  const executeSell = async (
    tokenAddress: Address,
    curveAddress: Address,
    tokensIn: bigint,
    minQuoteOut: bigint,
    onSuccessCallback?: () => void
  ) => {
    if (!isConnected || !userAddress || !walletClient) {
      setTradeState({
        step: 'error',
        txHash: null,
        tokensReceived: null,
        quoteReceived: null,
        errorMessage: 'Please connect your wallet first',
      });
      return;
    }

    setTradeState({
      step: 'waiting_wallet',
      txHash: null,
      tokensReceived: null,
      quoteReceived: null,
      errorMessage: null,
    });

    try {
      const publicClient = createPublicClient({
        chain: robinhoodTestnet,
        transport: http('https://robinhood-sepolia-rpc.publicnode.com'),
      });

      // 1. Check Allowance
      const allowance = await publicClient.readContract({
        address: tokenAddress,
        abi: launcherTokenAbi,
        functionName: 'allowance',
        args: [userAddress, curveAddress],
      });

      if (allowance < tokensIn) {
        // Request Approval
        const approveHash = await walletClient.writeContract({
          address: tokenAddress,
          abi: launcherTokenAbi,
          functionName: 'approve',
          args: [curveAddress, tokensIn * 10n], // approve generous amount
        });

        await publicClient.waitForTransactionReceipt({
          hash: approveHash,
          confirmations: 1,
        });
      }

      // 2. Call sell()
      const sellHash = await walletClient.writeContract({
        address: curveAddress,
        abi: bondingCurveAbi,
        functionName: 'sell',
        args: [tokensIn, minQuoteOut, userAddress],
      });

      setTradeState({
        step: 'submitted',
        txHash: sellHash,
        tokensReceived: null,
        quoteReceived: null,
        errorMessage: null,
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: sellHash,
        confirmations: 1,
      });

      if (receipt.status !== 'success') {
        throw new Error('Sell transaction reverted on-chain');
      }

      // Parse CurveSell event
      let exactQuoteOut = minQuoteOut;
      for (const log of receipt.logs) {
        try {
          if (log.address.toLowerCase() === curveAddress.toLowerCase()) {
            const decoded = decodeEventLog({
              abi: bondingCurveAbi,
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === 'CurveSell') {
              exactQuoteOut = (decoded.args as any).quoteOut;
              break;
            }
          }
        } catch {
          // not this event
        }
      }

      setTradeState({
        step: 'success',
        txHash: sellHash,
        tokensReceived: null,
        quoteReceived: exactQuoteOut,
        errorMessage: null,
      });

      if (onSuccessCallback) {
        onSuccessCallback();
      }
    } catch (err: any) {
      console.error('Sell transaction error:', err);
      const isRejection =
        err?.code === 4001 ||
        err?.message?.toLowerCase().includes('user rejected');

      setTradeState({
        step: isRejection ? 'rejected' : 'error',
        txHash: null,
        tokensReceived: null,
        quoteReceived: null,
        errorMessage: decodeCustomError(err),
      });
    }
  };

  return {
    tradeState,
    executeBuy,
    executeSell,
    resetState,
  };
}
