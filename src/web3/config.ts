import { defineChain } from 'viem';
import { createConfig, http } from 'wagmi';
import { mainnet, base, arbitrum } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { createStorage, cookieStorage } from 'wagmi';

export const apeChain = defineChain({
  id: 33139,
  name: 'ApeChain',
  nativeCurrency: { name: 'ApeCoin', symbol: 'APE', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.apechain.com'] } },
  blockExplorers: { default: { name: 'Apescan', url: 'https://apescan.io' } },
});

export const curtis = defineChain({
  id: 33111,
  name: 'Curtis (ApeChain testnet)',
  nativeCurrency: { name: 'ApeCoin', symbol: 'APE', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.curtis.apechain.com'] } },
  blockExplorers: { default: { name: 'Curtis Explorer', url: 'https://curtis.apescan.io' } },
  testnet: true,
});

const wcProjectId = import.meta.env.VITE_WC_PROJECT_ID as string | undefined;

export const wagmiConfig = createConfig({
  chains: [apeChain, curtis, mainnet, base, arbitrum],
  connectors: [
    injected(),
    ...(wcProjectId ? [walletConnect({ projectId: wcProjectId })] : []),
  ],
  storage: createStorage({ storage: cookieStorage }),
  transports: {
    [apeChain.id]: http(),
    [curtis.id]: http(),
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
  },
});
