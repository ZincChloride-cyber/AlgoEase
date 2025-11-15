import { defineChain } from 'viem'

export const polygonMainnet = defineChain({
  id: 137,
  name: 'Polygon',
  network: 'polygon',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18
  },
  rpcUrls: {
    default: { http: ['https://polygon-rpc.com'] },
    public: { http: ['https://polygon-rpc.com'] }
  },
  blockExplorers: {
    default: { name: 'Polygonscan', url: 'https://polygonscan.com' }
  }
})

export const polygonAmoy = defineChain({
  id: 80002,
  name: 'Polygon Amoy',
  network: 'polygon-amoy',
  nativeCurrency: {
    name: 'POL',
    symbol: 'POL',
    decimals: 18
  },
  rpcUrls: {
    default: { http: ['https://rpc-amoy.polygon.technology'] },
    public: { http: ['https://rpc-amoy.polygon.technology'] }
  },
  blockExplorers: {
    default: { name: 'Polygonscan', url: 'https://amoy.polygonscan.com' }
  },
  testnet: true
})

export const polygonZkEvm = defineChain({
  id: 1101,
  name: 'Polygon zkEVM',
  network: 'polygon-zkevm',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: {
    default: { http: ['https://zkevm-rpc.com'] },
    public: { http: ['https://zkevm-rpc.com'] }
  },
  blockExplorers: {
    default: { name: 'Polygonscan', url: 'https://zkevm.polygonscan.com' }
  }
})

export const polygonZkEvmTestnet = defineChain({
  id: 1442,
  name: 'Polygon zkEVM Testnet',
  network: 'polygon-zkevm-testnet',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: {
    default: { http: ['https://rpc.public.zkevm-test.net'] },
    public: { http: ['https://rpc.public.zkevm-test.net'] }
  },
  blockExplorers: {
    default: { name: 'Polygonscan', url: 'https://testnet-zkevm.polygonscan.com' }
  },
  testnet: true
})

export const supportedChains = [
  polygonMainnet,
  polygonAmoy,
  polygonZkEvm,
  polygonZkEvmTestnet
] as const

export const PRIMARY_CHAIN_ID = polygonAmoy.id

export function getTokenSymbol(chainId: number): string {
  if (chainId === polygonAmoy.id) return 'POL'
  if (chainId === polygonMainnet.id) return 'MATIC'
  if (chainId === polygonZkEvm.id || chainId === polygonZkEvmTestnet.id) return 'ETH'
  return 'ETH'
}

export function getChainById(chainId: number) {
  return supportedChains.find((chain) => chain.id === chainId)
}


