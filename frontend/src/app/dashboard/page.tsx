'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Rocket, 
  Activity, 
  Zap, 
  Copy, 
  ExternalLink,
  Plus,
  TrendingUp,
  Users,
  Globe,
  ChevronRight,
  Wallet,
  LogOut,
  ArrowUpRight,
  CheckCircle2,
  BarChart3,
  Cpu,
  Network,
  Layers
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'
import { useWallet } from '@/hooks/useWallet'
import { PRIMARY_CHAIN_ID, polygonMainnet } from '@/lib/chains'
import { ethers } from 'ethers'

const CHAIN_FACTORY_ABI = [
  "function getChain(uint256 _chainId) external view returns (tuple(uint256 id, address owner, string name, string chainType, string rollupType, string gasToken, uint256 validators, uint256 createdAt, bool isActive, string rpcUrl, string explorerUrl))",
  "function getUserChains(address _user) external view returns (uint256[])",
  "function getTotalChains() external view returns (uint256)"
]

export default function DashboardPage() {
  const router = useRouter()
  const { address, isConnected, balance, disconnect, chainId, tokenSymbol, getProvider } = useWallet()
  const [chains, setChains] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingOnChain, setLoadingOnChain] = useState(false)

  useEffect(() => {
    // Load chains from localStorage
    loadChains()
    // Load chains from blockchain if wallet is connected
    if (isConnected && address) {
      loadChainsFromBlockchain()
    }
  }, [router, isConnected, address, chainId, getProvider])

  const loadChains = () => {
    try {
      const storedChains = localStorage.getItem('userChains')
      if (storedChains) {
        const localChains = JSON.parse(storedChains)
        setChains(localChains)
      }
    } catch (error) {
      console.error('Error loading chains:', error)
    }
  }

  const loadChainsFromBlockchain = async () => {
    if (!address) return
    
    const contractAddress = process.env.NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS
    if (!contractAddress || !ethers.isAddress(contractAddress)) {
      console.warn('ChainFactory contract address not configured')
      return
    }

    // Only load from blockchain if on Polygon network
    if (chainId !== polygonMainnet.id && chainId !== PRIMARY_CHAIN_ID) {
      return
    }

    setLoadingOnChain(true)
    try {
      const eip1193Provider = await getProvider()
      const provider = new ethers.BrowserProvider(eip1193Provider)

      const code = await provider.getCode(contractAddress)
      if (!code || code === '0x' || code === '0x0') {
        console.warn('ChainFactory contract not found at configured address. Skipping on-chain sync.')
        setLoading(false)
        setLoadingOnChain(false)
        return
      }

      const contract = new ethers.Contract(contractAddress, CHAIN_FACTORY_ABI, provider)
      
      // Get user's chain IDs from blockchain
      const chainIds = await contract.getUserChains(address)
      
      // Fetch details for each chain
      const blockchainChains = await Promise.all(
        chainIds.map(async (chainId: bigint) => {
          try {
            const chainData = await contract.getChain(chainId)
            return {
              id: `chain-${chainId.toString()}`,
              chainId: chainId.toString(),
              name: chainData.name,
              chainType: chainData.chainType,
              rollupType: chainData.rollupType,
              gasToken: chainData.gasToken,
              validators: chainData.validators.toString(),
              owner: chainData.owner,
              isActive: chainData.isActive,
              rpcUrl: chainData.rpcUrl,
              explorerUrl: chainData.explorerUrl,
              createdAt: new Date(Number(chainData.createdAt) * 1000).toISOString(),
              status: chainData.isActive ? 'active' : 'inactive',
              onChainRegistered: true,
              blockchainTxHash: null, // We don't have this from the contract
              blockchainChainId: chainId
            }
          } catch (error) {
            console.error(`Error fetching chain ${chainId}:`, error)
            return null
          }
        })
      )

      // Filter out nulls and merge with local chains
      const validBlockchainChains = blockchainChains.filter(c => c !== null)
      
      // Merge with local chains, prioritizing blockchain data but preserving local metadata
      const localChains = JSON.parse(localStorage.getItem('userChains') || '[]')
      const mergedChains = validBlockchainChains.map((blockchainChain: any) => {
        // Find matching local chain to preserve metadata like polygonScanUrl and blockchainTxHash
        const matchingLocalChain = localChains.find((lc: any) => {
          const lcId = String(lc.id || '')
          const bcId = String(blockchainChain.id || '')
          return lcId === bcId || 
                 lcId === `chain-${blockchainChain.blockchainChainId?.toString()}` ||
                 lc.blockchainChainId?.toString() === blockchainChain.blockchainChainId?.toString()
        })
        
        if (matchingLocalChain) {
          // Merge blockchain data with local metadata
          return {
            ...blockchainChain,
            polygonScanUrl: matchingLocalChain.polygonScanUrl || blockchainChain.polygonScanUrl,
            blockchainTxHash: matchingLocalChain.blockchainTxHash || blockchainChain.blockchainTxHash,
            transactions: matchingLocalChain.transactions || blockchainChain.transactions
          }
        }
        return blockchainChain
      })
      
      // Add local chains that aren't on blockchain
      localChains.forEach((localChain: any) => {
        if (!localChain.onChainRegistered || !validBlockchainChains.find(bc => {
          const bcId = String(bc.id || '')
          const lcId = String(localChain.id || '')
          return bcId === lcId || 
                 bcId === `chain-${localChain.blockchainChainId?.toString()}` ||
                 bc.blockchainChainId?.toString() === localChain.blockchainChainId?.toString()
        })) {
          mergedChains.push({
            ...localChain,
            onChainRegistered: localChain.onChainRegistered || false
          })
        }
      })

      setChains(mergedChains)
    } catch (error) {
      console.error('Error loading chains from blockchain:', error)
      // Fallback to local chains only
      loadChains()
    } finally {
      setLoadingOnChain(false)
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (isConnected) {
      try {
        await disconnect()
        toast.success('Wallet disconnected')
      } catch (error: any) {
        toast.error(error?.message || 'Failed to disconnect wallet')
      }
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!', {
      icon: '📋',
    })
  }

  const getPolygonScanUrl = (txHash: string) => {
    if (chainId === polygonMainnet.id) {
      return `https://polygonscan.com/tx/${txHash}`
    } else if (chainId === PRIMARY_CHAIN_ID) {
      return `https://amoy.polygonscan.com/tx/${txHash}`
    }
    return null
  }

  const handleExternalLink = (chain: any, e: React.MouseEvent) => {
    e.stopPropagation()
    
    // If chain has a polygonScanUrl, use it
    if (chain.polygonScanUrl) {
      window.open(chain.polygonScanUrl, '_blank', 'noopener,noreferrer')
      return
    }
    
    // If chain has a blockchainTxHash, construct the Polyscan URL
    if (chain.blockchainTxHash) {
      const scanUrl = getPolygonScanUrl(chain.blockchainTxHash)
      if (scanUrl) {
        window.open(scanUrl, '_blank', 'noopener,noreferrer')
        return
      }
    }
    
    // If chain has an explorerUrl, use it
    if (chain.explorerUrl) {
      window.open(chain.explorerUrl, '_blank', 'noopener,noreferrer')
      return
    }
    
    // If chain has a blockchainChainId, try to construct a Polyscan chain ID URL
    if (chain.blockchainChainId) {
      const chainIdNum = typeof chain.blockchainChainId === 'bigint' 
        ? Number(chain.blockchainChainId) 
        : parseInt(chain.blockchainChainId)
      
      if (chainId === polygonMainnet.id) {
        window.open(`https://polygonscan.com/address/${chainIdNum}`, '_blank', 'noopener,noreferrer')
      } else if (chainId === PRIMARY_CHAIN_ID) {
        window.open(`https://amoy.polygonscan.com/address/${chainIdNum}`, '_blank', 'noopener,noreferrer')
      }
    }
  }

  const stats = [
    {
      label: 'Total Chains',
      value: chains.length,
      icon: <Network className="w-5 h-5 sm:w-6 sm:h-6" />,
      gradient: 'from-[#6d28d9] to-[#a855f7]',
      change: `${chains.filter(c => c.onChainRegistered).length} On-Chain`
    },
    {
      label: 'Active Chains',
      value: chains.filter(c => c.status === 'active' || c.isActive).length,
      icon: <Activity className="w-5 h-5 sm:w-6 sm:h-6" />,
      gradient: 'from-[#8b5cf6] to-[#ec4899]',
      change: `${chains.filter(c => (c.status === 'active' || c.isActive) && c.onChainRegistered).length} On-Chain`
    },
    {
      label: 'On-Chain Registered',
      value: chains.filter(c => c.onChainRegistered).length,
      icon: <Layers className="w-5 h-5 sm:w-6 sm:h-6" />,
      gradient: 'from-[#7c3aed] to-[#c026d3]',
      change: `${chains.filter(c => !c.onChainRegistered).length} Local Only`
    },
    {
      label: 'Total Validators',
      value: chains.reduce((acc, c) => acc + (parseInt(c.validators || c.initialValidators || '0')), 0),
      icon: <Cpu className="w-5 h-5 sm:w-6 sm:h-6" />,
      gradient: 'from-[#4c1d95] to-[#9333ea]',
      change: `${chains.filter(c => c.onChainRegistered).reduce((acc, c) => acc + (parseInt(c.validators || '0')), 0)} On-Chain`
    }
  ]


  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8 relative">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(120% 120% at 10% -10%, rgba(109, 40, 217, 0.35) 0%, transparent 60%), radial-gradient(120% 120% at 90% 0%, rgba(236, 72, 153, 0.28) 0%, transparent 65%), radial-gradient(100% 100% at 50% 120%, rgba(55, 48, 163, 0.25) 0%, transparent 70%)'
            }}
            animate={{ opacity: [0.5, 0.85, 0.5] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-0 opacity-50"
            animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            style={{
              backgroundImage:
                'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, transparent 35%, transparent 65%, rgba(236, 72, 153, 0.15) 100%), linear-gradient(225deg, rgba(91, 33, 182, 0.12) 0%, transparent 45%, rgba(147, 51, 234, 0.12) 55%, transparent 100%)',
              backgroundSize: '220% 220%'
            }}
          />
          <motion.div
            className="absolute -top-24 left-10 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl"
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-[-18rem] right-[-6rem] w-[28rem] h-[28rem] bg-fuchsia-500/25 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.35, 0.6, 0.35] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative">
              <motion.div
                className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-purple-500 via-fuchsia-500 to-indigo-500 rounded-full"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 relative">
                Welcome to{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-purple-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent animate-gradient font-mono tracking-tight">
                    PolyOne Labs
                  </span>
                  <motion.div
                  className="absolute -right-8 top-0 w-6 h-6 border-2 border-purple-300/60 rounded"
                    animate={{
                      rotate: [0, 90, 180, 270, 360],
                    borderColor: ['rgba(192, 132, 252, 0.6)', 'rgba(217, 70, 239, 0.6)', 'rgba(99, 102, 241, 0.6)', 'rgba(192, 132, 252, 0.6)'],
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  />
                </span>
              </h1>
              <p className="text-sm sm:text-base text-gray-300 flex items-center gap-2 font-mono">
                <Network className="w-4 h-4 text-purple-300" />
                <span>Manage your blockchain networks</span>
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-purple-300"
                >
                  •
                </motion.span>
                <span className="text-purple-200 font-semibold">{chains.length} chains deployed</span>
              </p>
            </div>
            {isConnected && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                <button
                  onClick={handleDisconnect}
                  className="group px-4 py-2 rounded-xl border border-white/20 hover:border-red-500/50 hover:bg-red-500/10 transition-all flex items-center gap-2 text-sm"
                >
                  <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  <span className="hidden sm:inline">Disconnect</span>
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Wallet Status */}
        {isConnected ? (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group overflow-hidden"
          >
            {/* Animated gradient background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-fuchsia-500/10 to-indigo-500/10 rounded-3xl blur-2xl opacity-60"
              animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.08, 1] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div
              className="relative bg-gradient-to-br from-white/8 via-purple-500/10 to-white/4 backdrop-blur-2xl rounded-[36px] p-5 sm:p-6 border border-white/8 group-hover:border-purple-300/60 transition-all overflow-hidden shadow-[0_28px_70px_rgba(109,40,217,0.28)]"
              style={{ maskImage: 'radial-gradient(150% 150% at 50% 0%, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)', WebkitMaskImage: 'radial-gradient(150% 150% at 50% 0%, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)' }}
            >
              <motion.div
                className="absolute inset-0 bg-[linear-gradient(to_right,rgba(168,85,247,0.35)_0.5px,transparent_0.5px),linear-gradient(to_bottom,rgba(236,72,153,0.35)_0.5px,transparent_0.5px)] bg-[size:22px_22px] opacity-10"
                animate={{ backgroundPosition: ['0% 0%', '40% 40%'] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              />

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 relative z-10">
                <motion.div 
                  className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-indigo-500 flex items-center justify-center flex-shrink-0 overflow-hidden border border-purple-400/40 shadow-[0_15px_30px_rgba(168,85,247,0.4)]"
                  whileHover={{ scale: 1.08 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                  />
                  <Wallet className="w-6 h-6 sm:w-8 sm:h-8 relative z-10 text-white" />
                  <motion.div
                    className="absolute -inset-2 bg-purple-500/50 rounded-2xl blur-lg"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.25, 0.6, 0.25],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs sm:text-sm text-purple-100/70 font-mono">Connected Wallet</span>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-purple-200" />
                    </motion.div>
                  </div>
                  <div className="font-mono text-sm sm:text-base lg:text-lg font-semibold truncate bg-gradient-to-r from-purple-200 via-fuchsia-200 to-indigo-200 bg-clip-text text-transparent">
                    {address}
                  </div>
                  {balance && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="text-xs sm:text-sm text-purple-100/70 font-mono">
                        Balance: <span className="text-purple-200 font-semibold">{parseFloat(balance).toFixed(4)}</span> {tokenSymbol ?? 'POL'}
                      </div>
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="w-3 h-3 border-2 border-purple-300 border-t-transparent rounded-full"
                      />
                    </div>
                  )}
                </div>
                <motion.button
                  onClick={() => address && copyToClipboard(address)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="self-start sm:self-center px-4 py-2 rounded-xl border border-purple-400/40 hover:border-purple-400/80 hover:bg-purple-500/15 transition-all flex items-center gap-2 text-sm group/btn font-mono backdrop-blur"
                >
                  <Copy className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                  <span className="hidden sm:inline">Copy</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-orange-500/20"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base sm:text-lg mb-1">Wallet Not Connected</h3>
                <p className="text-xs sm:text-sm text-gray-400">Connect your wallet to interact with blockchain features</p>
              </div>
              <Link
                href="/"
                className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold transition-all whitespace-nowrap text-sm"
              >
                Connect Wallet
              </Link>
            </div>
          </motion.div>
        )}

        {/* Stats Array */}
        <div className="grid gap-3 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, i) => {
            const percentage = chains.length > 0 
              ? Math.min(100, (stat.value / Math.max(...stats.map(s => s.value))) * 100)
              : 0
            
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, scale: 1.03 }}
                className="relative group overflow-hidden"
              >
                <motion.div
                  className="pointer-events-none absolute -inset-[1px] rounded-[26px] opacity-40"
                  style={{
                    background: `radial-gradient(80% 80% at 20% 20%, rgba(168,85,247,0.35), transparent 70%)`
                  }}
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                />
                <div
                  className="relative rounded-[28px] border border-white/8 bg-gradient-to-br from-white/9 via-purple-500/6 to-white/4 backdrop-blur-2xl p-5 sm:p-6 overflow-hidden shadow-[0_18px_55px_rgba(109,40,217,0.22)]"
                  style={{ maskImage: 'radial-gradient(140% 140% at 50% 0%, rgba(0,0,0,1) 68%, rgba(0,0,0,0) 100%)', WebkitMaskImage: 'radial-gradient(140% 140% at 50% 0%, rgba(0,0,0,1) 68%, rgba(0,0,0,0) 100%)' }}
                >
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: `linear-gradient(135deg, rgba(168,85,247,0.18) 0%, transparent 55%, rgba(236,72,153,0.18) 100%)`
                    }}
                  />
                  <motion.div
                    className={`absolute inset-x-6 bottom-3 h-[2px] rounded-full bg-gradient-to-r ${stat.gradient}`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: percentage / 100 }}
                    transition={{ delay: i * 0.1 + 0.4, duration: 0.9, ease: 'easeOut' }}
                    style={{ transformOrigin: 'left center' }}
                  />
                  <motion.div
                    className="pointer-events-none absolute top-4 left-6 right-6 h-px bg-gradient-to-r from-transparent via-purple-200/25 to-transparent"
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
                  />
                  <div className="relative z-10 space-y-3">
                    <div className="flex items-center justify-between">
                      <motion.div
                        className={`w-12 h-12 rounded-[18px] bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-[0_10px_25px_rgba(109,40,217,0.35)]`}
                        whileHover={{ scale: 1.1, rotate: [0, -4, 4, 0] }}
                        transition={{ duration: 0.6 }}
                      >
                        {stat.icon}
                      </motion.div>
                      <motion.span className="text-xs sm:text-sm text-purple-200 font-semibold flex items-center gap-1 font-mono">
                        <ArrowUpRight className="w-3 h-3" />
                        {stat.change}
                      </motion.span>
                    </div>
                    <motion.div
                      className="text-2xl sm:text-3xl font-bold text-white"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.1 + 0.2, type: 'spring', stiffness: 220 }}
                    >
                      {stat.value}
                    </motion.div>
                    <div className="text-xs sm:text-sm text-gray-300 flex items-center gap-2 font-mono">
                      {stat.label}
                      <motion.span
                        className="w-1 h-1 rounded-full bg-purple-300"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
          <Link href="/dashboard/create">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative group overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-purple-500/25 via-fuchsia-500/20 to-indigo-500/25 rounded-3xl blur-2xl opacity-0 group-hover:opacity-60"
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />

              <div
                className="relative bg-gradient-to-br from-white/12 via-purple-500/12 to-white/5 backdrop-blur-2xl rounded-[32px] p-6 sm:p-8 border border-white/12 hover:border-purple-400/60 transition-all cursor-pointer overflow-hidden shadow-[0_28px_70px_rgba(109,40,217,0.35)]"
                style={{ maskImage: 'radial-gradient(135% 135% at 50% 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)', WebkitMaskImage: 'radial-gradient(135% 135% at 50% 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)' }}
              >
                <motion.div
                  className="absolute inset-0 bg-[linear-gradient(to_right,rgba(168,85,247,0.35)_0.5px,transparent_0.5px),linear-gradient(to_bottom,rgba(236,72,153,0.35)_0.5px,transparent_0.5px)] bg-[size:20px_20px] opacity-10"
                  animate={{ backgroundPosition: ['0% 0%', '30% 30%'] }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="pointer-events-none absolute top-5 left-8 right-8 h-px rounded-full bg-gradient-to-r from-transparent via-purple-200/30 to-transparent"
                  animate={{ opacity: [0.2, 0.55, 0.2] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="pointer-events-none absolute bottom-5 left-8 right-8 h-px rounded-full bg-gradient-to-r from-transparent via-fuchsia-200/25 to-transparent"
                  animate={{ opacity: [0.2, 0.45, 0.2], scaleX: [0.9, 1, 0.9] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                />

                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-60 transition-opacity"
                  initial={false}
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <motion.div 
                      className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-indigo-500 flex items-center justify-center shadow-[0_10px_30px_rgba(168,85,247,0.45)] border border-purple-400/40"
                      whileHover={{ scale: 1.08 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-2xl"
                        animate={{
                          x: ['-100%', '100%'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                      />
                      <Plus className="w-6 h-6 sm:w-8 sm:h-8 relative z-10 text-white drop-shadow-lg" />
                      <motion.div
                        className="absolute -inset-2 bg-purple-500/30 rounded-2xl blur"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 0, 0.3],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                      />
                    </motion.div>
                    <motion.div
                      className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/40 font-mono"
                      whileHover={{ x: 5, scale: 1.06 }}
                    >
                      <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-purple-200" />
                    </motion.div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 group-hover:text-purple-200 transition-colors flex items-center gap-2 font-mono">
                    Launch New Chain
                    <Rocket className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-xs sm:text-sm text-purple-100/70 group-hover:text-purple-100 transition-colors font-mono">
                    Deploy a custom Polygon-based blockchain in minutes
                  </p>
                  
                  {/* Progress indicator - Tech style */}
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-purple-900/40 rounded-full overflow-hidden border border-purple-500/25">
                      <motion.div
                        className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: '60%' }}
                        transition={{ delay: 0.5, duration: 1 }}
                      />
                    </div>
                    <span className="text-xs text-purple-200 font-semibold font-mono">Quick Start</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>

          <Link href="/dashboard/analytics">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative group overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-indigo-500/25 via-purple-500/20 to-fuchsia-500/25 rounded-3xl blur-2xl opacity-0 group-hover:opacity-60"
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              />

              <div
                className="relative bg-gradient-to-br from-white/12 via-indigo-500/12 to-white/5 backdrop-blur-2xl rounded-[32px] p-6 sm:p-8 border border-white/12 hover:border-indigo-400/60 transition-all cursor-pointer overflow-hidden shadow-[0_28px_70px_rgba(76,29,149,0.35)]"
                style={{ maskImage: 'radial-gradient(135% 135% at 50% 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)', WebkitMaskImage: 'radial-gradient(135% 135% at 50% 0%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)' }}
              >
                <motion.div
                  className="absolute inset-0 bg-[linear-gradient(to_right,rgba(129,140,248,0.35)_0.5px,transparent_0.5px),linear-gradient(to_bottom,rgba(192,132,252,0.35)_0.5px,transparent_0.5px)] bg-[size:20px_20px] opacity-10"
                  animate={{ backgroundPosition: ['0% 0%', '30% 30%'] }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="pointer-events-none absolute top-5 left-8 right-8 h-px rounded-full bg-gradient-to-r from-transparent via-indigo-200/30 to-transparent"
                  animate={{ opacity: [0.2, 0.55, 0.2] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                />
                <motion.div
                  className="pointer-events-none absolute bottom-5 left-8 right-8 h-px rounded-full bg-gradient-to-r from-transparent via-purple-200/25 to-transparent"
                  animate={{ opacity: [0.2, 0.45, 0.2], scaleX: [0.9, 1, 0.9] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
                />

                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-fuchsia-500/20 opacity-0 group-hover:opacity-60 transition-opacity"
                  initial={false}
                />

                <div className="absolute top-0 right-0 w-24 h-24 border-t-2 border-r-2 border-indigo-400/25 rounded-bl-3xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 border-b-2 border-l-2 border-indigo-400/25 rounded-tr-3xl" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <motion.div 
                      className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-[0_10px_30px_rgba(76,29,149,0.45)] border border-indigo-400/40"
                      whileHover={{ scale: 1.08 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-2xl"
                        animate={{
                          x: ['-100%', '100%'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                      />
                      <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 relative z-10 text-white drop-shadow-lg" />
                      <motion.div
                        className="absolute -inset-2 bg-indigo-500/30 rounded-2xl blur"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 0, 0.3],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                      />
                    </motion.div>
                    <motion.div
                      className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/40 font-mono"
                      whileHover={{ x: 5, scale: 1.06 }}
                    >
                      <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-200" />
                    </motion.div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 group-hover:text-indigo-200 transition-colors flex items-center gap-2 font-mono">
                    View Analytics
                    <TrendingUp className="w-4 h-4 group-hover:translate-y-[-2px] transition-transform" />
                  </h3>
                  <p className="text-xs sm:text-sm text-indigo-100/70 group-hover:text-indigo-100 transition-colors font-mono">
                    Monitor your chains' performance and metrics
                  </p>

                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-1 px-2 py-1 rounded border border-indigo-500/30 bg-indigo-500/10">
                      <Activity className="w-3 h-3 text-indigo-200" />
                      <span className="text-xs text-indigo-100 font-mono">Live Data</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded border border-fuchsia-500/30 bg-fuchsia-500/10">
                      <Zap className="w-3 h-3 text-fuchsia-200" />
                      <span className="text-xs text-fuchsia-100 font-mono">Real-time</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>
        </div>

        {/* Your Chains */}
        <div>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">Your Blockchains</h2>
            <div className="flex items-center gap-2">
              {loadingOnChain && (
                <div className="text-xs text-gray-400 flex items-center gap-2">
                  <motion.div
                    className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Loading from blockchain...
                </div>
              )}
              <button
                onClick={() => {
                  if (isConnected && address) {
                    loadChainsFromBlockchain()
                  } else {
                    loadChains()
                  }
                }}
                className="text-purple-400 hover:text-purple-300 flex items-center gap-2 text-sm sm:text-base transition-colors"
                disabled={loadingOnChain}
              >
                <Activity className="w-4 h-4" />
                Refresh
              </button>
              <Link 
                href="/dashboard/create"
                className="text-purple-400 hover:text-purple-300 flex items-center gap-2 text-sm sm:text-base transition-colors"
              >
                Create New
                <Plus className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 sm:py-20">
              <motion.div
                className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-purple-500 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          ) : chains.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 sm:py-20"
            >
              <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <Rocket className="w-8 h-8 sm:w-12 sm:h-12 text-gray-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">No Chains Yet</h3>
              <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8">Create your first blockchain to get started</p>
              <Link
                href="/dashboard/create"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold transition-all text-sm sm:text-base"
              >
                <Rocket className="w-4 h-4 sm:w-5 sm:h-5" />
                Launch Your First Chain
              </Link>
            </motion.div>
        ) : (
          <div className="grid gap-4 sm:gap-6">
              {chains.map((chain, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5, scale: 1.01 }}
                  className="relative bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/10 hover:border-purple-500/50 transition-all group cursor-pointer overflow-hidden"
                  onClick={() => {
                    const safeId = encodeURIComponent(String(chain.id || ''))
                    router.push(`/dashboard/chains/${safeId}`)
                  }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={false}
                  />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <motion.div 
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 relative overflow-hidden"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          animate={{
                            x: ['-100%', '100%'],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 2,
                          }}
                        />
                        <Globe className="w-6 h-6 sm:w-8 sm:h-8 relative z-10" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link href={`/dashboard/chains/${encodeURIComponent(String(chain.id || ''))}`}>
                            <h3 className="text-base sm:text-lg font-bold hover:text-purple-400 transition-colors">{chain.name}</h3>
                          </Link>
                          {chain.onChainRegistered && (
                            <span className="px-2 py-0.5 rounded-md bg-green-500/20 text-green-400 text-xs font-semibold">
                              ✓ On-Chain
                            </span>
                          )}
                          {!chain.onChainRegistered && (
                            <span className="px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-400 text-xs font-semibold">
                              Local Only
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-300 mb-2">
                          <span className="px-2 py-1 rounded-md bg-purple-500/20 text-purple-400 capitalize">
                            {chain.chainType}
                          </span>
                          <span className="px-2 py-1 rounded-md bg-purple-500/20 text-purple-200">
                            {chain.rollupType}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline">{chain.gasToken} Gas Token</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2 text-xs">
                          <div>
                            <span className="text-gray-500">Chain ID:</span>
                            <span className="text-white ml-1 font-semibold">{chain.chainId || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Validators:</span>
                            <span className="text-white ml-1 font-semibold">{chain.validators || chain.initialValidators || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Status:</span>
                            <span className={`ml-1 font-semibold ${chain.status === 'active' || chain.isActive ? 'text-green-400' : 'text-gray-400'}`}>
                              {chain.status === 'active' || chain.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          {chain.transactions !== undefined && (
                            <div>
                              <span className="text-gray-500">TXs:</span>
                              <span className="text-white ml-1 font-semibold">{chain.transactions || 0}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Created {new Date(chain.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Link 
                        href={`/dashboard/chains/${encodeURIComponent(String(chain.id || ''))}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button className="px-3 sm:px-4 py-2 rounded-xl border border-white/20 hover:bg-white/5 transition-all text-xs sm:text-sm">
                          <Activity className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          copyToClipboard(chain.rpcUrl || 'https://rpc.example.com')
                        }}
                        className="px-3 sm:px-4 py-2 rounded-xl border border-white/20 hover:bg-white/5 transition-all text-xs sm:text-sm"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => handleExternalLink(chain, e)}
                        className="px-3 sm:px-4 py-2 rounded-xl border border-white/20 hover:bg-white/5 transition-all text-xs sm:text-sm"
                        disabled={!chain.polygonScanUrl && !chain.blockchainTxHash && !chain.explorerUrl && !chain.blockchainChainId}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
