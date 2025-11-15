'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  HelpCircle,
  Mail,
  MessageCircle,
  Book,
  Github,
  Twitter,
  Send,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000))

    setSubmitting(false)
    setSubmitted(true)
    toast.success('Support request submitted! We\'ll get back to you soon.')
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '' })
      setSubmitted(false)
    }, 3000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const faqs = [
    {
      question: 'How do I create a new blockchain?',
      answer: 'Navigate to "Launch Chain" in the sidebar and fill out the form with your chain details. You can choose the chain type, rollup type, and configure validators.'
    },
    {
      question: 'What networks are supported?',
      answer: 'PolyOne supports Polygon mainnet (chain ID 137) and Polygon Amoy testnet (chain ID 80002) for on-chain registration.'
    },
    {
      question: 'How do I register my chain on-chain?',
      answer: 'After creating a chain locally, connect your wallet to Polygon network and click "Register on Blockchain" in the chain details page.'
    },
    {
      question: 'What is the difference between local and on-chain chains?',
      answer: 'Local chains are stored only in your browser. On-chain chains are registered on the Polygon blockchain and can be accessed by others.'
    },
    {
      question: 'How do I add validators to my chain?',
      answer: 'Validators can be configured during chain creation. You can also update validator settings in the chain details page.'
    },
    {
      question: 'Where can I find my RPC URL?',
      answer: 'Your RPC URL is displayed in the chain details page. You can copy it using the copy button next to the RPC URL field.'
    }
  ]

  const resources = [
    {
      title: 'Documentation',
      description: 'Comprehensive guides and API reference',
      icon: Book,
      href: '/docs',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'GitHub',
      description: 'View source code and contribute',
      icon: Github,
      href: 'https://github.com',
      color: 'from-gray-500 to-gray-700',
      external: true
    },
    {
      title: 'Twitter',
      description: 'Follow us for updates',
      icon: Twitter,
      href: 'https://twitter.com',
      color: 'from-sky-500 to-blue-500',
      external: true
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-purple-400" />
            Support Center
          </h1>
          <p className="text-gray-400">Get help, ask questions, or report issues</p>
        </div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-3xl p-6 sm:p-8 border border-white/20"
        >
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold">Contact Us</h2>
          </div>

          {submitted ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
              <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
              <p className="text-gray-400">We'll get back to you as soon as possible.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500/50 transition-all"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500/50 transition-all"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500/50 transition-all"
                  placeholder="What can we help you with?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500/50 transition-all resize-none"
                  placeholder="Tell us more about your question or issue..."
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>

        {/* FAQs */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-purple-400" />
            Frequently Asked Questions
          </h2>
          <div className="grid gap-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
              >
                <h3 className="text-lg font-bold mb-2">{faq.question}</h3>
                <p className="text-gray-400">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Additional Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {resources.map((resource, i) => {
              const Icon = resource.icon
              const content = (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-all cursor-pointer group"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${resource.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{resource.title}</h3>
                  <p className="text-sm text-gray-400">{resource.description}</p>
                </motion.div>
              )

              return resource.external ? (
                <a key={i} href={resource.href} target="_blank" rel="noopener noreferrer">
                  {content}
                </a>
              ) : (
                <Link key={i} href={resource.href}>
                  {content}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

