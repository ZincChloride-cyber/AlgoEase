/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // Ensure trailing slashes are handled correctly for Vercel
  trailingSlash: false,
  // Environment variables that should be available on the client
  // These are automatically available if they start with NEXT_PUBLIC_
  // But we can also explicitly define them here for clarity
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS: process.env.NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS || '',
    NEXT_PUBLIC_CHAIN_REGISTRY_ADDRESS: process.env.NEXT_PUBLIC_CHAIN_REGISTRY_ADDRESS || '',
    NEXT_PUBLIC_DEFAULT_NETWORK: process.env.NEXT_PUBLIC_DEFAULT_NETWORK || 'polygonAmoy',
  },
}

module.exports = nextConfig

