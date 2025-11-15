'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Activity,
  Zap,
  Users,
  TrendingUp,
  RefreshCw,
  Globe,
  BarChart3,
  LineChart as LineChartIcon,
  Network,
  Cpu,
  Layers
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

export default function AnalyticsPage() {
  const router = useRouter()
  const [chains, setChains] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadChains()
    loadAnalytics()

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadAnalytics()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

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

  const loadAnalytics = async () => {
    try {
      // Generate aggregated analytics data
      const now = new Date()
      const data = []
      
      for (let i = 23; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
        const totalTxs = chains.length * (Math.floor(Math.random() * 1000) + 500)
        const avgTps = Math.floor(Math.random() * 100) + 700
        const totalGas = chains.length * (Math.floor(Math.random() * 1000000) + 500000)
        
        data.push({
          timestamp: timestamp.toISOString(),
          transactions: totalTxs,
          tps: avgTps,
          gasUsed: totalGas,
          activeChains: chains.filter(c => c.status === 'active' || c.isActive).length
        })
      }
      
      setAnalytics(data)
    } catch (error) {
      console.error('Error loading analytics:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    loadChains()
    await loadAnalytics()
    setRefreshing(false)
    toast.success('Analytics refreshed!')
  }

  const totalStats = {
    totalChains: chains.length,
    activeChains: chains.filter(c => c.status === 'active' || c.isActive).length,
    totalValidators: chains.reduce((acc, c) => acc + (parseInt(c.validators || c.initialValidators || '0')), 0),
    totalTransactions: analytics.reduce((acc, a) => acc + (a.transactions || 0), 0),
    avgTPS: analytics.length > 0 ? Math.round(analytics.reduce((acc, a) => acc + (a.tps || 0), 0) / analytics.length) : 0,
    totalGasUsed: analytics.reduce((acc, a) => acc + (a.gasUsed || 0), 0)
  }

  const chainTypeData = chains.reduce((acc: any, chain: any) => {
    const type = chain.chainType || 'Unknown'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})

  const pieData = Object.entries(chainTypeData).map(([name, value]) => ({
    name,
    value
  }))

  const COLORS = ['#7c3aed', '#a855f7', '#d946ef', '#6366f1', '#9333ea']

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <motion.div
            className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 relative">
        {/* Animated Nebula Background */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(120% 120% at 10% -10%, rgba(109, 40, 217, 0.3) 0%, transparent 60%), radial-gradient(120% 120% at 90% 0%, rgba(217, 70, 239, 0.28) 0%, transparent 65%), radial-gradient(120% 120% at 50% 110%, rgba(99, 102, 241, 0.22) 0%, transparent 72%)'
            }}
            animate={{ opacity: [0.5, 0.85, 0.5] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-0 opacity-50"
            animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
            transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
            style={{
              backgroundImage:
                'linear-gradient(135deg, rgba(168, 85, 247, 0.16) 0%, transparent 35%, transparent 65%, rgba(217, 70, 239, 0.16) 100%), linear-gradient(225deg, rgba(99, 102, 241, 0.12) 0%, transparent 45%, rgba(147, 51, 234, 0.12) 55%, transparent 100%)',
              backgroundSize: '220% 220%'
            }}
          />
          <motion.div
            className="absolute -top-24 left-10 w-80 h-80 bg-purple-500/25 rounded-full blur-3xl"
            animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.65, 0.35] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-[-18rem] right-[-8rem] w-[28rem] h-[28rem] bg-fuchsia-500/20 rounded-full blur-3xl"
            animate={{ scale: [1.05, 1.2, 1.05], opacity: [0.3, 0.55, 0.3] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-purple-200/70 hover:text-purple-100 transition-colors font-mono group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <motion.button
            onClick={handleRefresh}
            disabled={refreshing}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-xl border border-purple-400/40 hover:border-purple-300/70 hover:bg-purple-500/15 transition-all flex items-center gap-2 disabled:opacity-50 font-mono"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
        </motion.div>

        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3 font-mono">
            <div className="relative">
              <BarChart3 className="w-8 h-8 text-purple-200" />
              <motion.div
                className="absolute -inset-2 bg-purple-500/30 rounded-xl blur"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
            </div>
            <span className="bg-gradient-to-r from-purple-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
              Analytics Dashboard
            </span>
          </h1>
          <p className="text-gray-300 font-mono flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-200" />
            Monitor your chains' performance and metrics
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { icon: Network, label: 'Total Chains', value: totalStats.totalChains, gradient: 'from-[#6d28d9] to-[#a855f7]', delay: 0 },
            { icon: Activity, label: 'Active Chains', value: totalStats.activeChains, gradient: 'from-[#8b5cf6] to-[#d946ef]', delay: 0.1 },
            { icon: Cpu, label: 'Validators', value: totalStats.totalValidators, gradient: 'from-[#312e81] to-[#6d28d9]', delay: 0.2 },
            { icon: BarChart3, label: 'Total TXs (24h)', value: `${(totalStats.totalTransactions / 1000).toFixed(1)}K`, gradient: 'from-[#a855f7] to-[#6366f1]', delay: 0.3 },
            { icon: Zap, label: 'Avg TPS', value: totalStats.avgTPS, gradient: 'from-[#d946ef] to-[#a855f7]', delay: 0.4 },
            { icon: Layers, label: 'Gas Used (24h)', value: `${(totalStats.totalGasUsed / 1000000).toFixed(1)}M`, gradient: 'from-[#4c1d95] to-[#9333ea]', delay: 0.5 },
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: stat.delay }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="relative group overflow-hidden"
              >
                <div className="relative bg-gradient-to-br from-white/12 via-purple-500/10 to-white/5 backdrop-blur-2xl rounded-2xl p-4 border border-purple-500/25 hover:border-purple-400/60 transition-all shadow-[0_12px_35px_rgba(109,40,217,0.25)]">
                  <motion.div
                    className="absolute inset-0 bg-[linear-gradient(to_right,rgba(168,85,247,0.3)_0.5px,transparent_0.5px),linear-gradient(to_bottom,rgba(236,72,153,0.3)_0.5px,transparent_0.5px)] bg-[size:18px_18px] opacity-10 pointer-events-none"
                    animate={{ backgroundPosition: ['0% 0%', '30% 20%'] }}
                    transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                  />
                  
                  {/* Progress bar */}
                  <motion.div
                    className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r ${stat.gradient} rounded-b-lg`}
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ delay: stat.delay + 0.3, duration: 0.8 }}
                  />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <motion.div 
                        className={`w-8 h-8 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center border border-white/20`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <Icon className="w-4 h-4 text-white" />
                      </motion.div>
                      <TrendingUp className="w-3 h-3 text-purple-200" />
                    </div>
                    <div className="text-xl font-bold mb-1 text-white font-mono">
                      {stat.value}
                    </div>
                    <div className="text-xs text-purple-100/70 font-mono">{stat.label}</div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Transaction History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group overflow-hidden"
          >
            <div className="relative bg-gradient-to-br from-white/10 via-purple-500/10 to-white/5 backdrop-blur-2xl rounded-3xl p-6 border border-purple-500/25 hover:border-purple-400/60 transition-all shadow-[0_20px_50px_rgba(109,40,217,0.35)]">
              <motion.div
                className="absolute inset-0 bg-[linear-gradient(to_right,rgba(168,85,247,0.3)_0.5px,transparent_0.5px),linear-gradient(to_bottom,rgba(236,72,153,0.3)_0.5px,transparent_0.5px)] bg-[size:20px_20px] opacity-10 pointer-events-none"
                animate={{ backgroundPosition: ['0% 0%', '30% 30%'] }}
                transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
              />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-indigo-500 flex items-center justify-center border border-white/20 shadow-[0_8px_24px_rgba(168,85,247,0.4)]">
                    <LineChartIcon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xl font-bold font-mono text-white">Transaction History (24h)</h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      stroke="rgba(255,255,255,0.5)"
                    />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Area
                      type="monotone"
                      dataKey="transactions"
                      stroke="#a855f7"
                      fill="url(#colorGradient1)"
                      fillOpacity={0.4}
                    />
                    <defs>
                      <linearGradient id="colorGradient1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#6d28d9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* TPS Over Time */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative group overflow-hidden"
          >
            <div className="relative bg-gradient-to-br from-white/10 via-indigo-500/10 to-white/5 backdrop-blur-2xl rounded-3xl p-6 border border-indigo-500/25 hover:border-indigo-400/60 transition-all shadow-[0_20px_50px_rgba(76,29,149,0.35)]">
              <motion.div
                className="absolute inset-0 bg-[linear-gradient(to_right,rgba(129,140,248,0.28)_0.5px,transparent_0.5px),linear-gradient(to_bottom,rgba(192,132,252,0.28)_0.5px,transparent_0.5px)] bg-[size:20px_20px] opacity-10 pointer-events-none"
                animate={{ backgroundPosition: ['0% 0%', '25% 25%'] }}
                transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
              />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 flex items-center justify-center border border-white/20 shadow-[0_8px_24px_rgba(76,29,149,0.4)]">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xl font-bold font-mono text-white">TPS Over Time</h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      stroke="rgba(255,255,255,0.5)"
                    />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Line
                      type="monotone"
                      dataKey="tps"
                      stroke="#a855f7"
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* Gas Usage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative group overflow-hidden"
          >
            <div className="relative bg-gradient-to-br from-white/10 via-fuchsia-500/10 to-white/5 backdrop-blur-2xl rounded-3xl p-6 border border-fuchsia-500/25 hover:border-fuchsia-400/60 transition-all shadow-[0_20px_50px_rgba(217,70,239,0.35)]">
              <motion.div
                className="absolute inset-0 bg-[linear-gradient(to_right,rgba(217,70,239,0.28)_0.5px,transparent_0.5px),linear-gradient(to_bottom,rgba(236,72,153,0.28)_0.5px,transparent_0.5px)] bg-[size:20px_20px] opacity-10 pointer-events-none"
                animate={{ backgroundPosition: ['0% 0%', '20% 25%'] }}
                transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
              />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-500 flex items-center justify-center border border-white/20 shadow-[0_8px_24px_rgba(217,70,239,0.4)]">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xl font-bold font-mono text-white">Gas Usage (24h)</h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      stroke="rgba(255,255,255,0.5)"
                    />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: number) => [(value / 1000000).toFixed(2) + 'M', 'Gas Used']}
                    />
                    <Bar dataKey="gasUsed" fill="url(#colorGradient2)" />
                    <defs>
                      <linearGradient id="colorGradient2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d946ef" stopOpacity={1}/>
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* Chain Type Distribution */}
          {pieData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative group overflow-hidden"
            >
              <div className="relative bg-gradient-to-br from-white/10 via-purple-500/10 to-white/5 backdrop-blur-2xl rounded-3xl p-6 border border-purple-500/25 hover:border-purple-400/60 transition-all shadow-[0_20px_50px_rgba(147,51,234,0.35)]">
                <motion.div
                  className="absolute inset-0 bg-[linear-gradient(to_right,rgba(147,51,234,0.28)_0.5px,transparent_0.5px),linear-gradient(to_bottom,rgba(192,132,252,0.28)_0.5px,transparent_0.5px)] bg-[size:20px_20px] opacity-10 pointer-events-none"
                  animate={{ backgroundPosition: ['0% 0%', '30% 30%'] }}
                  transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-indigo-500 flex items-center justify-center border border-white/20 shadow-[0_8px_24px_rgba(147,51,234,0.4)]">
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-xl font-bold font-mono text-white">Chain Type Distribution</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0,0,0,0.8)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Active Chains Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative group overflow-hidden"
        >
          <div className="relative bg-gradient-to-br from-white/10 via-purple-500/10 to-white/5 backdrop-blur-2xl rounded-3xl p-6 border border-purple-500/25 hover:border-purple-400/60 transition-all shadow-[0_20px_50px_rgba(109,40,217,0.35)]">
            <motion.div
              className="absolute inset-0 bg-[linear-gradient(to_right,rgba(168,85,247,0.28)_0.5px,transparent_0.5px),linear-gradient(to_bottom,rgba(236,72,153,0.28)_0.5px,transparent_0.5px)] bg-[size:20px_20px] opacity-10 pointer-events-none"
              animate={{ backgroundPosition: ['0% 0%', '25% 30%'] }}
              transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
            />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-indigo-500 flex items-center justify-center border border-white/20 shadow-[0_8px_24px_rgba(168,85,247,0.4)]">
                  <Network className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-xl font-bold font-mono text-white">Active Chains Over Time</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    stroke="rgba(255,255,255,0.5)"
                  />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                  />
                  <Line
                    type="monotone"
                    dataKey="activeChains"
                    stroke="#7c3aed"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}

