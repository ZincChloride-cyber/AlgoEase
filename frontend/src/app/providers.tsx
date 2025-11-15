'use client'

import '@rainbow-me/rainbowkit/styles.css'

import { RainbowKitProvider, darkTheme, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'
import { WagmiProvider } from 'wagmi'

import { supportedChains } from '@/lib/chains'

interface ProvidersProps {
  children: ReactNode
}

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '00000000000000000000000000000000'

const wagmiConfig = getDefaultConfig({
  appName: 'PolyOne',
  projectId,
  chains: supportedChains,
  ssr: true
})

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient())

  if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
    // eslint-disable-next-line no-console
    console.warn('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. WalletConnect may not function as expected.')
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#a855f7',
            borderRadius: 'large'
          })}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}


