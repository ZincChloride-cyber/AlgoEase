#!/bin/bash

# Vercel Deployment Script
# This script helps you deploy PolyOne to Vercel

set -e

echo "🚀 PolyOne Vercel Deployment Helper"
echo "===================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Vercel CLI not found. Installing..."
    npm install -g vercel
    echo "✅ Vercel CLI installed"
    echo ""
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel:"
    vercel login
    echo ""
fi

echo "📋 Deployment Checklist:"
echo ""
echo "1. ✅ Vercel CLI installed"
echo "2. ✅ Logged in to Vercel"
echo ""
echo "📝 Environment Variables to set in Vercel Dashboard:"
echo ""
echo "   NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS=0x7Eb4d5BeC7aabA9e758A50188d6f6581cbE5411c"
echo "   NEXT_PUBLIC_CHAIN_REGISTRY_ADDRESS=0x457e9323366369c04b8e0Db2e409d5E9f3B60252"
echo "   NEXT_PUBLIC_DEFAULT_NETWORK=polygonAmoy"
echo ""
echo "⚠️  IMPORTANT: Set Root Directory to 'frontend' in Vercel Dashboard!"
echo ""
read -p "Press Enter to continue with deployment..."

# Navigate to frontend directory
cd frontend

echo ""
echo "🚀 Deploying to Vercel..."
echo ""

# Deploy
vercel

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "📋 Next steps:"
echo "1. Go to Vercel Dashboard"
echo "2. Set Root Directory to 'frontend'"
echo "3. Add environment variables"
echo "4. Redeploy if needed"
echo ""

