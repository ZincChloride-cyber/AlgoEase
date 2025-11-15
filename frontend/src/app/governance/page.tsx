'use client'

import Link from 'next/link'
import { ArrowLeft, Users, Vote } from 'lucide-react'

export default function GovernancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto pt-20">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Governance
        </h1>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">PolyOne Council</h2>
                <p className="text-gray-400">Community-driven governance</p>
              </div>
            </div>

            <p className="text-gray-400 mb-6">
              PolyOne is a DAO Network managed by SubDAOs in Development, Operations, and Communication,
              answerable to the community.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="font-bold mb-2">Total Proposals</div>
                <div className="text-3xl font-bold text-purple-400">12</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="font-bold mb-2">Active Members</div>
                <div className="text-3xl font-bold text-pink-400">1,234</div>
              </div>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="block p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl hover:border-purple-500/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold mb-2">Participate in Governance</h3>
                <p className="text-gray-400">Connect your wallet to vote on proposals</p>
              </div>
              <Vote className="w-8 h-8 text-purple-400" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

