'use client';

import { useState } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { robinhoodTestnet } from '../config/chain';

export function useNetworkManager() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const isWrongNetwork = isConnected && chainId !== robinhoodTestnet.id;

  const switchToRobinhood = async () => {
    setIsSwitching(true);
    setSwitchError(null);

    try {
      if (switchChainAsync) {
        await switchChainAsync({ chainId: robinhoodTestnet.id });
        return;
      }

      // Direct fallback via window.ethereum
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const ethereum = (window as any).ethereum;
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${robinhoodTestnet.id.toString(16)}` }],
          });
        } catch (switchErr: any) {
          // Error 4902 means chain has not been added yet
          if (switchErr?.code === 4902 || switchErr?.message?.includes('Unrecognized')) {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${robinhoodTestnet.id.toString(16)}`,
                  chainName: robinhoodTestnet.name,
                  nativeCurrency: robinhoodTestnet.nativeCurrency,
                  rpcUrls: robinhoodTestnet.rpcUrls.default.http,
                  blockExplorerUrls: [robinhoodTestnet.blockExplorers.default.url],
                },
              ],
            });
          } else {
            throw switchErr;
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to switch network:', err);
      setSwitchError(err?.message || 'Failed to switch to Robinhood Testnet');
    } finally {
      setIsSwitching(false);
    }
  };

  return {
    chainId,
    isWrongNetwork,
    isSwitching,
    switchError,
    switchToRobinhood,
    targetChain: robinhoodTestnet,
  };
}
