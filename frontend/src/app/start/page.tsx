'use client'

import Link from 'next/link'
import { ArrowLeft, Wallet, Download } from 'lucide-react'

export default function StartPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto pt-20">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Get Started
        </h1>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold mb-4">Install a Wallet</h2>
            <p className="text-gray-400 mb-6">
              Choose one of these wallets to interact with PolyOne:
            </p>
            <div className="space-y-4">
              <a
                href="https://metamask.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl border border-white/20 hover:border-purple-500/50 transition-all"
              >
                <Wallet className="w-8 h-8" />
                <div>
                  <div className="font-bold">MetaMask</div>
                  <div className="text-sm text-gray-400">Most popular Ethereum wallet</div>
                </div>
                <Download className="w-5 h-5 ml-auto" />
              </a>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
            <h3 className="font-bold mb-2">Next Steps</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-400">
              <li>Install MetaMask or another compatible wallet</li>
              <li>Get test MATIC from the faucet</li>
              <li>Connect your wallet to PolyOne</li>
              <li>Launch your first blockchain!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

