'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Terminal,
  Box,
  Plus,
  Settings,
  LogOut,
  Menu,
  X,
  FileText,
  HelpCircle,
  Home,
  Wallet
} from 'lucide-react'
import { useWallet } from '@/hooks/useWallet'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { address, isConnected, disconnect, balance, chainId, tokenSymbol } = useWallet()

  const handleDisconnect = () => {
    if (isConnected) {
      disconnect().catch((error) => {
        console.warn('Failed to disconnect wallet:', error)
      })
    }
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My Chains', href: '/dashboard/chains', icon: Box },
    { name: 'Launch Chain', href: '/dashboard/create', icon: Plus },
    { name: 'Documentation', href: '/docs', icon: FileText },
    { name: 'Support', href: '/support', icon: HelpCircle },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1b0b33,#050012)] text-white font-mono relative overflow-hidden">
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-60"
        animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
        transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
        style={{
          backgroundImage:
            'linear-gradient(135deg, rgba(124, 58, 237, 0.18) 0%, transparent 45%, transparent 55%, rgba(236, 72, 153, 0.18) 100%), linear-gradient(225deg, rgba(99, 102, 241, 0.15) 0%, transparent 40%, rgba(168, 85, 247, 0.15) 55%, transparent 100%)',
          backgroundSize: '260% 260%'
        }}
      />
      <motion.div
        className="absolute -top-40 -left-32 w-[28rem] h-[28rem] bg-purple-500/25 rounded-full blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-18rem] right-[-8rem] w-[32rem] h-[32rem] bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none"
        animate={{ scale: [1.05, 1.2, 1.05], opacity: [0.25, 0.5, 0.25] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-4 left-4 z-40 h-[calc(100vh-2rem)] w-64 
        bg-[rgba(15,4,36,0.78)] border border-purple-500/25 backdrop-blur-2xl rounded-3xl
        transform transition-transform duration-300 ease-in-out shadow-[0_25px_80px_rgba(109,40,217,0.35)]
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)] lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-purple-500/20">
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity group">
              <motion.div
                whileHover={{ rotate: 6, scale: 1.08 }}
                className="relative"
              >
                <Terminal className="w-5 h-5 relative z-10" />
                <motion.div
                  className="absolute inset-0 bg-purple-500/30 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                />
              </motion.div>
              <span className="font-semibold tracking-tight bg-gradient-to-r from-purple-200 via-fuchsia-200 to-indigo-200 bg-clip-text text-transparent group-hover:from-purple-100 group-hover:to-indigo-100 transition-all">
                PolyOne Labs
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <motion.div
                  key={item.name}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href={item.href}
                    className={`
                      relative flex items-center gap-3 px-4 py-3 transition-all font-medium text-sm overflow-hidden rounded-2xl
                      ${isActive 
                        ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 text-white shadow-[0_10px_25px_rgba(109,40,217,0.35)]' 
                        : 'text-white/60 hover:text-white hover:bg-white/5/0 hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5'
                      }
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {isActive && (
                      <motion.div
                        className="absolute left-1 top-1 bottom-1 w-1 rounded-full bg-gradient-to-b from-purple-200 to-fuchsia-300"
                        layoutId="activeIndicator"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">{item.name}</span>
                  </Link>
                </motion.div>
              )
            })}
          </nav>

          {/* Wallet section */}
          <div className="p-4 border-t border-purple-500/20 bg-white/5/0">
            {isConnected && address && (
              <div className="border border-purple-500/30 p-4 mb-3 rounded-2xl bg-gradient-to-br from-white/10 via-purple-500/10 to-white/5 backdrop-blur-xl shadow-[0_10px_35px_rgba(109,40,217,0.25)]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 border border-purple-400/40 flex items-center justify-center font-bold text-xs rounded-xl bg-gradient-to-br from-purple-500/30 to-fuchsia-500/30">
                    {address.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">
                      Connected Wallet
                    </div>
                    <div className="text-xs text-white/60 truncate font-mono">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </div>
                  </div>
                </div>
                
                {/* Balance Display */}
                {balance !== null && chainId && (
                  <div className="mb-3 p-3 rounded-xl border border-purple-500/25 bg-purple-500/10/0 bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-purple-200" />
                        <span className="text-xs text-white/70">Balance</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm">
                          {parseFloat(balance).toFixed(4)}
                        </div>
                        <div className="text-xs text-white/60">
                          {tokenSymbol ?? 'ETH'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <motion.button
                  onClick={handleDisconnect}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-purple-400/40 bg-white/5/0 hover:bg-gradient-to-r hover:from-purple-500 hover:to-fuchsia-500 hover:text-white transition-all text-sm rounded-xl"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Disconnect</span>
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-[18rem]">
        {/* Mobile header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-[rgba(15,4,36,0.9)] backdrop-blur-xl border-b border-purple-500/20">
          <div className="flex items-center justify-between p-4">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Terminal className="w-5 h-5" />
              <span className="font-bold">PolyOne Labs</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/5 transition-all"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="relative z-10 p-6 md:p-12 pt-20 lg:pt-12 min-h-screen w-full max-w-6xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
