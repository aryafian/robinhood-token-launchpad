import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { robinhoodTestnet } from './chain';

export const wagmiConfig = createConfig({
  chains: [robinhoodTestnet],
  connectors: [
    injected({
      target: 'metaMask',
    }),
  ],
  transports: {
    [robinhoodTestnet.id]: http('https://robinhood-sepolia-rpc.publicnode.com'),
  },
  ssr: true,
});
