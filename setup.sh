#!/bin/bash

# PolyOne Web3 Setup Script
# This script helps you get started with PolyOne on Polygon

echo "🧩 PolyOne - Web3 Setup Script"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js v18 or higher from https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm found: $(npm --version)${NC}"
echo ""

# Install root dependencies
echo -e "${YELLOW}📦 Installing root dependencies...${NC}"
npm install

# Install frontend dependencies
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
cd frontend && npm install
cd ..

# Install backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd backend && npm install
cd ..

echo ""
echo -e "${GREEN}✅ All dependencies installed!${NC}"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env and add your PRIVATE_KEY${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Create frontend/.env.local if it doesn't exist
if [ ! -f frontend/.env.local ]; then
    echo -e "${YELLOW}📝 Creating frontend/.env.local...${NC}"
    cp frontend/.env.example frontend/.env.local
    echo -e "${GREEN}✅ frontend/.env.local created${NC}"
else
    echo -e "${GREEN}✅ frontend/.env.local already exists${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Edit .env and add your MetaMask private key"
echo "2. Get test MATIC from https://faucet.polygon.technology/"
echo "3. Compile contracts: ${GREEN}npm run compile${NC}"
echo "4. Deploy to testnet: ${GREEN}npm run deploy:amoy${NC}"
echo "5. Run the app: ${GREEN}npm run dev${NC}"
echo ""
echo -e "${YELLOW}📚 Documentation:${NC}"
echo "- WEB3_README.md - Quick Web3 guide"
echo "- docs/WEB3_SETUP.md - Detailed setup"
echo ""
echo -e "${GREEN}Happy Building! 🚀${NC}"

