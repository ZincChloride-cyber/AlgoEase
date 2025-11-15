'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Globe,
  Activity,
  Copy,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react'
import Link from 'next/link'
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

export default function MyChainsPage() {
  const router = useRouter()
  const { address, isConnected, chainId, getProvider } = useWallet()
  const [chains, setChains] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingOnChain, setLoadingOnChain] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    loadChains()
    if (isConnected && address) {
      loadChainsFromBlockchain()
    }
  }, [isConnected, address, chainId, getProvider])

  const loadChains = () => {
    try {
      const storedChains = localStorage.getItem('userChains')
      if (storedChains) {
        const localChains = JSON.parse(storedChains)
        setChains(localChains)
      }
    } catch (error) {
      console.error('Error loading chains:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadChainsFromBlockchain = async () => {
    if (!address) return
    
    const contractAddress = process.env.NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS
    if (!contractAddress || !ethers.isAddress(contractAddress)) {
      console.warn('ChainFactory contract address not configured')
      return
    }

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
      
      const chainIds = await contract.getUserChains(address)
      
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
              blockchainTxHash: null,
              blockchainChainId: chainId
            }
          } catch (error) {
            console.error(`Error fetching chain ${chainId}:`, error)
            return null
          }
        })
      )

      const validBlockchainChains = blockchainChains.filter(c => c !== null)
      const localChains = JSON.parse(localStorage.getItem('userChains') || '[]')
      const mergedChains = [...validBlockchainChains]
      
      localChains.forEach((localChain: any) => {
        if (!localChain.onChainRegistered || !validBlockchainChains.find(bc => bc.id === localChain.id)) {
          mergedChains.push({
            ...localChain,
            onChainRegistered: localChain.onChainRegistered || false
          })
        }
      })

      setChains(mergedChains)
    } catch (error) {
      console.error('Error loading chains from blockchain:', error)
      loadChains()
    } finally {
      setLoadingOnChain(false)
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setLoadingOnChain(true)
    loadChains()
    if (isConnected && address) {
      await loadChainsFromBlockchain()
    }
    setLoadingOnChain(false)
    toast.success('Chains refreshed!')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const filteredChains = chains.filter(chain => {
    const matchesSearch = chain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         chain.chainId?.toString().includes(searchQuery) ||
                         chain.chainType?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'active' && (chain.status === 'active' || chain.isActive)) ||
                         (filterStatus === 'inactive' && chain.status !== 'active' && !chain.isActive)
    
    return matchesSearch && matchesFilter
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Globe className="w-8 h-8 text-purple-400" />
              My Chains
            </h1>
            <p className="text-gray-400">Manage and monitor all your blockchain networks</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={loadingOnChain}
              className="px-4 py-2 rounded-xl border border-purple-400/40 hover:border-purple-300/70 hover:bg-purple-500/15 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loadingOnChain ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              href="/dashboard/create"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create New
            </Link>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search chains by name, ID, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500/50 transition-all"
            >
              <option value="all">All Chains</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="relative bg-gradient-to-br from-white/12 via-purple-500/10 to-white/5 backdrop-blur-2xl rounded-2xl p-4 border border-purple-500/25 hover:border-purple-400/60 transition-all group overflow-hidden shadow-[0_12px_35px_rgba(109,40,217,0.25)]"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
              initial={false}
            />
            <div className="relative z-10">
              <motion.div 
                className="text-2xl font-bold mb-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
              >
                {chains.length}
              </motion.div>
              <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Total Chains</div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="relative bg-gradient-to-br from-white/12 via-purple-500/10 to-white/5 backdrop-blur-2xl rounded-2xl p-4 border border-purple-500/25 hover:border-purple-400/60 transition-all group overflow-hidden shadow-[0_12px_35px_rgba(109,40,217,0.25)]"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-purple-500/15 to-fuchsia-500/15 opacity-0 group-hover:opacity-100 transition-opacity"
              initial={false}
            />
            <div className="relative z-10">
              <motion.div 
                className="text-2xl font-bold mb-1 text-purple-200"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                {chains.filter(c => c.status === 'active' || c.isActive).length}
              </motion.div>
              <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Active</div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="relative bg-gradient-to-br from-white/12 via-purple-500/10 to-white/5 backdrop-blur-2xl rounded-2xl p-4 border border-purple-500/25 hover:border-purple-400/60 transition-all group overflow-hidden shadow-[0_12px_35px_rgba(109,40,217,0.25)]"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-indigo-500/15 to-purple-500/15 opacity-0 group-hover:opacity-100 transition-opacity"
              initial={false}
            />
            <div className="relative z-10">
              <motion.div 
                className="text-2xl font-bold mb-1 text-purple-200"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                {chains.filter(c => c.onChainRegistered).length}
              </motion.div>
              <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">On-Chain</div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="relative bg-gradient-to-br from-white/12 via-purple-500/10 to-white/5 backdrop-blur-2xl rounded-2xl p-4 border border-purple-500/25 hover:border-purple-400/60 transition-all group overflow-hidden shadow-[0_12px_35px_rgba(109,40,217,0.25)]"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/15 to-purple-500/15 opacity-0 group-hover:opacity-100 transition-opacity"
              initial={false}
            />
            <div className="relative z-10">
              <motion.div 
                className="text-2xl font-bold mb-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
              >
                {chains.reduce((acc, c) => acc + (parseInt(c.validators || c.initialValidators || '0')), 0)}
              </motion.div>
              <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Validators</div>
            </div>
          </motion.div>
        </div>

        {/* Chains List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        ) : filteredChains.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Globe className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">
              {searchQuery || filterStatus !== 'all' ? 'No chains found' : 'No Chains Yet'}
            </h3>
            <p className="text-gray-400 mb-8">
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first blockchain to get started'}
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <Link
                href="/dashboard/create"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold transition-all"
              >
                <Plus className="w-5 h-5" />
                Launch Your First Chain
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="flex flex-col gap-4 sm:gap-6">
            {filteredChains.map((chain, i) => (
              <motion.div
                key={chain.id || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -5, scale: 1.01 }}
                className="relative bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-[28px] p-4 sm:p-6 border border-white/10 hover:border-purple-500/50 transition-all group cursor-pointer overflow-hidden shadow-[0_20px_50px_rgba(109,40,217,0.25)]"
                onClick={() => {
                  const safeId = encodeURIComponent(String(chain.id || ''))
                  router.push(`/dashboard/chains/${safeId}`)
                }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={false}
                />
                <motion.div
                  className="pointer-events-none absolute top-4 left-6 right-6 h-px bg-gradient-to-r from-transparent via-purple-200/25 to-transparent rounded-full"
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="pointer-events-none absolute bottom-4 left-6 right-6 h-px bg-gradient-to-r from-transparent via-fuchsia-200/25 to-transparent rounded-full"
                  animate={{ opacity: [0.2, 0.45, 0.2], scaleX: [0.9, 1, 0.9] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
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
                        <Link href={`/dashboard/chains/${encodeURIComponent(String(chain.id || ''))}`} onClick={(e) => e.stopPropagation()}>
                          <h3 className="text-base sm:text-lg font-bold hover:text-purple-400 transition-colors">
                            {chain.name}
                          </h3>
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
                        <span className="px-2 py-1 rounded-md bg-purple-500/25 text-purple-200 capitalize">
                          {chain.chainType}
                        </span>
                        <span className="px-2 py-1 rounded-md bg-indigo-500/25 text-indigo-200">
                          {chain.rollupType}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline">{chain.gasToken} Gas Token</span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs mb-2">
                        <div>
                          <span className="text-gray-500">Chain ID:</span>
                          <span className="text-white ml-1 font-semibold">{chain.chainId || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Validators:</span>
                          <span className="text-white ml-1 font-semibold">
                            {chain.validators || chain.initialValidators || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <span className={`ml-1 font-semibold ${
                            chain.status === 'active' || chain.isActive ? 'text-green-400' : 'text-gray-400'
                          }`}>
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
                    <Link href={`/dashboard/chains/${encodeURIComponent(String(chain.id || ''))}`} onClick={(e) => e.stopPropagation()}>
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
                    {chain.explorerUrl && (
                      <a
                        href={chain.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 sm:px-4 py-2 rounded-xl border border-white/20 hover:bg-white/5 transition-all text-xs sm:text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

