'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Wallet, ExternalLink, CheckCircle, AlertCircle, Loader2, Shield, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectWallet: () => void
  isConnecting: boolean
}

export default function WalletModal({ isOpen, onClose, onSelectWallet, isConnecting }: WalletModalProps) {
  const [hasMetaMask, setHasMetaMask] = useState(false)
  const [isDetecting, setIsDetecting] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkMetaMask = () => {
        const hasEthereum = typeof window.ethereum !== 'undefined'
        const isMetaMask = hasEthereum && window.ethereum?.isMetaMask
        setHasMetaMask(!!isMetaMask)
        setIsDetecting(false)
      }
      
      checkMetaMask()
      
      // Check again after a short delay in case MetaMask is loading
      const timer = setTimeout(checkMetaMask, 500)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleConnect = () => {
    if (!hasMetaMask) {
      window.open('https://metamask.io/download/', '_blank')
      return
    }
    onSelectWallet()
  }

  const features = [
    { icon: Shield, text: 'Secure & Private' },
    { icon: Zap, text: 'Fast Transactions' },
    { icon: Wallet, text: 'Full Control' }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-40"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 max-w-lg w-full border border-white/10 shadow-2xl relative overflow-hidden">
              {/* Background gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 pointer-events-none" />
              
              {/* Content */}
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-lg opacity-50" />
                      <div className="relative p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl">
                        <Wallet className="w-7 h-7 text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                        Connect Wallet
                      </h2>
                      <p className="text-sm text-gray-400 mt-0.5">Connect to PolyOne with MetaMask</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors group"
                    disabled={isConnecting}
                  >
                    <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  </button>
                </div>

                {/* MetaMask Card */}
                <motion.div
                  whileHover={hasMetaMask && !isConnecting ? { scale: 1.02 } : {}}
                  whileTap={hasMetaMask && !isConnecting ? { scale: 0.98 } : {}}
                  className={`relative mb-6 overflow-hidden rounded-2xl border-2 transition-all ${
                    hasMetaMask
                      ? 'border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:border-purple-400 hover:from-purple-500/20 hover:to-pink-500/20 cursor-pointer'
                      : 'border-yellow-500/30 bg-yellow-500/5'
                  } ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* MetaMask Icon */}
                      <div className="relative flex-shrink-0">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-3xl shadow-lg">
                          🦊
                        </div>
                        {hasMetaMask && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-gray-900"
                          >
                            <CheckCircle className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold">MetaMask</h3>
                          {isDetecting && (
                            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                          )}
                          {!isDetecting && hasMetaMask && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-green-500/20 text-green-400 rounded-full">
                              Detected
                            </span>
                          )}
                          {!isDetecting && !hasMetaMask && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-yellow-500/20 text-yellow-400 rounded-full">
                              Not Installed
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-400 mb-4">
                          {hasMetaMask
                            ? 'Connect your MetaMask wallet to get started with PolyOne'
                            : 'Install MetaMask browser extension to connect your wallet'
                          }
                        </p>

                        {hasMetaMask ? (
                          <button
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isConnecting ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Connecting...</span>
                              </>
                            ) : (
                              <>
                                <Wallet className="w-5 h-5" />
                                <span>Connect MetaMask</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={handleConnect}
                            className="w-full px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                          >
                            <ExternalLink className="w-5 h-5" />
                            <span>Install MetaMask</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Features */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {features.map((feature, index) => {
                    const Icon = feature.icon
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-3 bg-white/5 rounded-xl border border-white/10 text-center"
                      >
                        <Icon className="w-5 h-5 mx-auto mb-2 text-purple-400" />
                        <p className="text-xs text-gray-400">{feature.text}</p>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-300">
                      <p className="font-semibold text-blue-400 mb-1">New to MetaMask?</p>
                      <p className="text-gray-400">
                        MetaMask is a crypto wallet that lets you manage your digital assets and interact with blockchain applications safely and securely.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-xs text-gray-500 text-center">
                  By connecting, you agree to PolyOne's{' '}
                  <a href="#" className="text-purple-400 hover:text-purple-300 underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-purple-400 hover:text-purple-300 underline">Privacy Policy</a>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

