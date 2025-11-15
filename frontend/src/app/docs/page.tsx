'use client'

import Link from 'next/link'
import { ArrowLeft, Book, Code, Rocket, Shield } from 'lucide-react'

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto pt-20">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Documentation
        </h1>

        <div className="grid gap-6">
          {[
            {
              icon: <Book />,
              title: 'Getting Started',
              description: 'Learn how to deploy your first blockchain in minutes',
              link: '#'
            },
            {
              icon: <Code />,
              title: 'API Reference',
              description: 'Complete API documentation for developers',
              link: '#'
            },
            {
              icon: <Rocket />,
              title: 'Quick Start',
              description: 'Fast track guide to launching your chain',
              link: '#'
            },
            {
              icon: <Shield />,
              title: 'Security',
              description: 'Best practices for securing your blockchain',
              link: '#'
            }
          ].map((doc, i) => (
            <div key={i} className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-purple-500/50 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  {doc.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{doc.title}</h3>
                  <p className="text-gray-400">{doc.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

