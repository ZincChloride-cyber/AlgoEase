#!/bin/bash

###############################################################################
# Polygon CDK Setup Script
# Installs and configures Polygon CDK for chain deployment
###############################################################################

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔧 Setting up Polygon CDK...${NC}"

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
sudo apt-get update
sudo apt-get install -y build-essential git curl

# Install Go (required for CDK)
if ! command -v go &> /dev/null; then
    echo -e "${YELLOW}Installing Go...${NC}"
    wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
    sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
    echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
    source ~/.bashrc
fi

# Install Polygon CDK
echo -e "\n${YELLOW}Installing Polygon CDK...${NC}"
git clone https://github.com/0xPolygon/cdk.git /tmp/polygon-cdk
cd /tmp/polygon-cdk
make build
sudo mv build/cdk /usr/local/bin/

echo -e "\n${GREEN}✅ Polygon CDK setup complete!${NC}"

