'use client'

import { useCallback, useEffect, useState } from 'react'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance, useChainId, useDisconnect, useSwitchChain } from 'wagmi'
import type { EIP1193Provider } from 'viem'

import { PRIMARY_CHAIN_ID, getTokenSymbol } from '@/lib/chains'

interface UseWalletResult {
  address: string | null
  chainId: number | null
  balance: string | null
  tokenSymbol: string | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  walletType: string | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  refreshBalance: () => Promise<void>
  switchNetwork: (targetChainId?: number) => Promise<void>
  getProvider: () => Promise<EIP1193Provider>
}

export function useWallet(): UseWalletResult {
  const { address, status, connector } = useAccount()
  const chainId = useChainId()
  const { openConnectModal } = useConnectModal()
  const { disconnectAsync } = useDisconnect()
  const { switchChainAsync } = useSwitchChain()
  const [lastError, setLastError] = useState<string | null>(null)

  const {
    data: balanceData,
    refetch: refetchBalance
  } = useBalance({
    address,
    query: {
      enabled: Boolean(address)
    }
  })

  const connect = useCallback(async () => {
    if (!openConnectModal) {
      const message = 'Wallet modal is not available yet. Please try again in a moment.'
      setLastError(message)
      throw new Error(message)
    }

    setLastError(null)
    openConnectModal()
  }, [openConnectModal])

  const disconnect = useCallback(async () => {
    try {
      await disconnectAsync()
      setLastError(null)
    } catch (error: any) {
      const message = error?.message || 'Failed to disconnect wallet'
      setLastError(message)
      throw new Error(message)
    }
  }, [disconnectAsync])

  const refreshBalance = useCallback(async () => {
    if (!address) return

    try {
      await refetchBalance()
      setLastError(null)
    } catch (error: any) {
      const message = error?.message || 'Failed to refresh balance'
      setLastError(message)
    }
  }, [address, refetchBalance])

  const switchNetwork = useCallback(async (targetChainId: number = PRIMARY_CHAIN_ID) => {
    if (!switchChainAsync) {
      const message = 'Chain switching is not supported by the current wallet.'
      setLastError(message)
      throw new Error(message)
    }

    try {
      await switchChainAsync({ chainId: targetChainId })
      setLastError(null)
    } catch (error: any) {
      const message = error?.shortMessage || error?.message || 'Failed to switch network'
      setLastError(message)
      throw new Error(message)
    }
  }, [switchChainAsync])

  const getProvider = useCallback(async (): Promise<EIP1193Provider> => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      return (window as any).ethereum as EIP1193Provider
    }

    if (connector?.getProvider) {
      const provider = await connector.getProvider()
      if (provider) {
        return provider as EIP1193Provider
      }
    }

    const message = 'Wallet provider is not available. Please connect your wallet again.'
    setLastError(message)
    throw new Error(message)
  }, [connector])

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (status === 'connected' && address) {
      localStorage.setItem('walletConnected', 'true')
      localStorage.setItem('walletAddress', address)
      localStorage.setItem('walletType', connector?.name || 'wallet')
    } else if (status === 'disconnected') {
      localStorage.removeItem('walletConnected')
      localStorage.removeItem('walletAddress')
      localStorage.removeItem('walletType')
    }
  }, [status, address, connector?.name])

  const resolvedChainId = status === 'connected' ? chainId : null
  const tokenSymbol = resolvedChainId ? getTokenSymbol(resolvedChainId) : null

  return {
    address: address ?? null,
    chainId: resolvedChainId,
    balance: balanceData?.formatted ?? null,
    tokenSymbol,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    error: lastError,
    walletType: connector?.name ?? null,
    connect,
    disconnect,
    refreshBalance,
    switchNetwork,
    getProvider
  }
}

