#!/bin/bash

###############################################################################
# PolyOne Chain Deployment Script
# This script automates the deployment of a Polygon CDK-based blockchain
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
CHAIN_ID=$1
CHAIN_NAME=$2
ROLLUP_TYPE=$3
GAS_TOKEN=$4
VALIDATORS=$5

echo -e "${GREEN}🚀 PolyOne Chain Deployment Script${NC}"
echo "================================================"
echo "Chain ID: $CHAIN_ID"
echo "Chain Name: $CHAIN_NAME"
echo "Rollup Type: $ROLLUP_TYPE"
echo "Gas Token: $GAS_TOKEN"
echo "Validators: $VALIDATORS"
echo "================================================"

# Step 1: Validate prerequisites
echo -e "\n${YELLOW}Step 1: Validating prerequisites...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites validated${NC}"

# Step 2: Create chain directory
echo -e "\n${YELLOW}Step 2: Creating chain directory...${NC}"
CHAIN_DIR="chains/$CHAIN_ID"
mkdir -p "$CHAIN_DIR"/{config,data,logs}
echo -e "${GREEN}✓ Directory created: $CHAIN_DIR${NC}"

# Step 3: Generate chain configuration
echo -e "\n${YELLOW}Step 3: Generating chain configuration...${NC}"
cat > "$CHAIN_DIR/config/genesis.json" <<EOF
{
  "chainId": "$CHAIN_ID",
  "chainName": "$CHAIN_NAME",
  "rollupType": "$ROLLUP_TYPE",
  "gasToken": "$GAS_TOKEN",
  "consensus": "PoS",
  "blockTime": 2,
  "networkId": $(date +%s),
  "genesis": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "gasLimit": "0x1312D00",
    "difficulty": "0x1",
    "alloc": {}
  }
}
EOF
echo -e "${GREEN}✓ Genesis configuration generated${NC}"

# Step 4: Deploy validator nodes
echo -e "\n${YELLOW}Step 4: Deploying $VALIDATORS validator nodes...${NC}"
for i in $(seq 1 $VALIDATORS); do
    echo "  - Deploying validator $i..."
    mkdir -p "$CHAIN_DIR/data/validator-$i"
    # In production, this would spin up actual validator containers
    # docker run -d --name "${CHAIN_ID}-validator-${i}" ...
done
echo -e "${GREEN}✓ Validators deployed${NC}"

# Step 5: Setup Polygon CDK
echo -e "\n${YELLOW}Step 5: Configuring Polygon CDK...${NC}"
cat > "$CHAIN_DIR/config/cdk-config.json" <<EOF
{
  "networkName": "$CHAIN_NAME",
  "l1Config": {
    "chainId": 80002,
    "polygonRollupManagerAddress": "0x...",
    "polTokenAddress": "0x..."
  },
  "polygonZkEVMGlobalExitRootAddress": "0x...",
  "rollupType": "$ROLLUP_TYPE",
  "dataAvailability": "rollup"
}
EOF
echo -e "${GREEN}✓ CDK configured${NC}"

# Step 6: Setup bridge to AggLayer
echo -e "\n${YELLOW}Step 6: Setting up bridge to AggLayer...${NC}"
cat > "$CHAIN_DIR/config/bridge-config.json" <<EOF
{
  "bridgeAddress": "0x...",
  "aggLayerEndpoint": "https://agglayer.polygon.technology",
  "sourceChain": "$CHAIN_ID",
  "supportedTokens": ["$GAS_TOKEN", "MATIC", "ETH"]
}
EOF
echo -e "${GREEN}✓ Bridge configured${NC}"

# Step 7: Initialize monitoring
echo -e "\n${YELLOW}Step 7: Initializing monitoring...${NC}"
cat > "$CHAIN_DIR/config/prometheus.yml" <<EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'chain-$CHAIN_ID'
    static_configs:
      - targets: ['localhost:9090']
EOF
echo -e "${GREEN}✓ Monitoring initialized${NC}"

# Step 8: Generate RPC endpoint configuration
echo -e "\n${YELLOW}Step 8: Configuring RPC endpoints...${NC}"
RPC_URL="https://rpc-${CHAIN_ID:0:8}.polyone.io"
EXPLORER_URL="https://explorer-${CHAIN_ID:0:8}.polyone.io"

cat > "$CHAIN_DIR/config/endpoints.json" <<EOF
{
  "rpcUrl": "$RPC_URL",
  "wsUrl": "wss://ws-${CHAIN_ID:0:8}.polyone.io",
  "explorerUrl": "$EXPLORER_URL",
  "bridgeUrl": "https://bridge-${CHAIN_ID:0:8}.polyone.io"
}
EOF
echo -e "${GREEN}✓ Endpoints configured${NC}"

# Step 9: Create deployment summary
echo -e "\n${YELLOW}Step 9: Creating deployment summary...${NC}"
cat > "$CHAIN_DIR/deployment-info.json" <<EOF
{
  "chainId": "$CHAIN_ID",
  "chainName": "$CHAIN_NAME",
  "rollupType": "$ROLLUP_TYPE",
  "gasToken": "$GAS_TOKEN",
  "validators": $VALIDATORS,
  "status": "active",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "endpoints": {
    "rpc": "$RPC_URL",
    "explorer": "$EXPLORER_URL"
  }
}
EOF
echo -e "${GREEN}✓ Deployment summary created${NC}"

# Final output
echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}✅ Chain deployment completed successfully!${NC}"
echo -e "${GREEN}================================================${NC}"
echo -e "\nChain Details:"
echo -e "  Chain ID: ${GREEN}$CHAIN_ID${NC}"
echo -e "  RPC URL: ${GREEN}$RPC_URL${NC}"
echo -e "  Explorer: ${GREEN}$EXPLORER_URL${NC}"
echo -e "\nNext Steps:"
echo -e "  1. Access your dashboard at https://app.polyone.io"
echo -e "  2. Monitor your chain's performance"
echo -e "  3. Deploy your dApp using the provided RPC endpoint"
echo -e "\n${YELLOW}Note: This is a simulated deployment for demo purposes.${NC}"
echo -e "${YELLOW}Production deployment would involve actual cloud infrastructure.${NC}"

