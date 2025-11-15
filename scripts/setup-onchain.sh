#!/bin/bash

# PolyOne On-Chain Setup Script
# This script helps you set up the ChainFactory contract for on-chain registration

set -e

echo "🚀 PolyOne On-Chain Setup"
echo "=========================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "Creating .env file from template..."
    cat > .env << EOF
# Smart Contract Deployment Configuration
PRIVATE_KEY=your_private_key_here
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGONSCAN_API_KEY=
EOF
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env and add your private key and RPC URLs${NC}"
    echo ""
    read -p "Press Enter after you've updated .env file..."
fi

# Check if frontend/.env.local exists
if [ ! -f frontend/.env.local ]; then
    echo -e "${YELLOW}⚠️  frontend/.env.local not found${NC}"
    echo "Creating frontend/.env.local..."
    cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS=
EOF
    echo -e "${GREEN}✓ Created frontend/.env.local${NC}"
fi

# Ask which network to deploy to
echo ""
echo "Which network would you like to deploy to?"
echo "1) Polygon Amoy Testnet (Recommended for testing)"
echo "2) Polygon Mainnet (For production)"
echo "3) Local network (For development)"
read -p "Enter choice [1-3]: " network_choice

case $network_choice in
    1)
        NETWORK="polygonAmoy"
        NETWORK_NAME="Polygon Amoy Testnet"
        ;;
    2)
        NETWORK="polygon"
        NETWORK_NAME="Polygon Mainnet"
        ;;
    3)
        NETWORK="localhost"
        NETWORK_NAME="Local network"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Deploying to ${NETWORK_NAME}...${NC}"
echo ""

# Compile contracts
echo "📦 Compiling contracts..."
npm run compile

# Deploy contracts
if [ "$NETWORK" = "localhost" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Make sure Hardhat node is running in another terminal:${NC}"
    echo "   npm run node"
    echo ""
    read -p "Press Enter when Hardhat node is running..."
    npm run deploy:localhost
else
    npm run deploy:$NETWORK
fi

# Extract contract address from deployment output
echo ""
echo -e "${GREEN}✓ Deployment complete!${NC}"
echo ""
echo -e "${YELLOW}Please copy the ChainFactory contract address from above and:${NC}"
echo "1. Add it to frontend/.env.local:"
echo "   NEXT_PUBLIC_CHAIN_FACTORY_ADDRESS=0x..."
echo "2. Restart your frontend server"
echo ""
echo "See DEPLOYMENT_GUIDE.md for detailed instructions."

