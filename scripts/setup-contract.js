#!/usr/bin/env node

/**
 * Smart Contract Setup Script
 * 
 * This script helps set up the smart contract integration for AlgoEase.
 * Run this after deploying the smart contract to configure the frontend.
 */

const fs = require('fs');
const path = require('path');

// Configuration template
const envTemplate = `
# AlgoEase Smart Contract Configuration
# Copy this to projects/algoease-frontend/.env and fill in the values

# Contract App ID (set after deployment)
REACT_APP_CONTRACT_APP_ID=

# Algorand Network Configuration
REACT_APP_ALGOD_URL=https://testnet-api.algonode.cloud
REACT_APP_INDEXER_URL=https://testnet-idx.algonode.cloud

# Deployment Configuration (for initial setup only)
REACT_APP_CREATOR_MNEMONIC=

# API Configuration
REACT_APP_API_URL=http://localhost:5000/api
`;

const setupInstructions = `
# Smart Contract Integration Setup

## 1. Deploy the Smart Contract

First, compile and deploy the smart contract:

\`\`\`bash
# Navigate to contracts directory
cd projects/algoease-contracts

# Install Python dependencies
pip install -r requirements.txt

# Compile the contract
python algoease_contract.py
\`\`\`

## 2. Deploy to TestNet

Use the AlgoKit CLI or your preferred method to deploy the contract:

\`\`\`bash
# Using AlgoKit (recommended)
algokit deploy

# Or manually using goal CLI
goal app create --creator [CREATOR_ADDRESS] --approval-prog algoease_approval.teal --clear-prog algoease_clear.teal --global-byteslices 10 --global-ints 10
\`\`\`

## 3. Configure Frontend

1. Copy the environment template to projects/algoease-frontend/.env
2. Set the REACT_APP_CONTRACT_APP_ID to your deployed contract ID
3. Configure other environment variables as needed

## 4. Test the Integration

\`\`\`bash
# Navigate to frontend directory
cd projects/algoease-frontend

# Install dependencies
npm install

# Start the development server
npm start
\`\`\`

## 5. Verify Integration

1. Open the application in your browser
2. Connect your wallet
3. Try creating a bounty
4. Check the browser console for any errors
5. Verify transactions on AlgoExplorer

## Troubleshooting

- Ensure the contract is deployed and the App ID is correct
- Check that your wallet is connected to TestNet
- Verify environment variables are set correctly
- Check browser console for error messages
`;

function createEnvFile() {
  const frontendPath = path.join(__dirname, '..', 'projects', 'algoease-frontend');
  const envPath = path.join(frontendPath, '.env');
  
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env file already exists. Backing up to .env.backup');
    fs.copyFileSync(envPath, path.join(frontendPath, '.env.backup'));
  }
  
  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Created .env template in frontend directory');
}

function createSetupGuide() {
  const guidePath = path.join(__dirname, '..', 'SMART_CONTRACT_SETUP.md');
  fs.writeFileSync(guidePath, setupInstructions);
  console.log('✅ Created setup guide: SMART_CONTRACT_SETUP.md');
}

function checkDependencies() {
  const frontendPath = path.join(__dirname, '..', 'projects', 'algoease-frontend');
  const packageJsonPath = path.join(frontendPath, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log('❌ Frontend package.json not found. Please run this script from the project root.');
    process.exit(1);
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredDeps = ['algosdk'];
  
  const missingDeps = requiredDeps.filter(dep => 
    !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
  );
  
  if (missingDeps.length > 0) {
    console.log('⚠️  Missing required dependencies:', missingDeps.join(', '));
    console.log('Run: npm install algosdk');
  } else {
    console.log('✅ All required dependencies are installed');
  }
}

function main() {
  console.log('🚀 Setting up AlgoEase Smart Contract Integration...\n');
  
  // Check if we're in the right directory
  if (!fs.existsSync(path.join(__dirname, '..', 'projects', 'algoease-frontend'))) {
    console.log('❌ Please run this script from the project root directory');
    process.exit(1);
  }
  
  // Check dependencies
  checkDependencies();
  
  // Create environment file
  createEnvFile();
  
  // Create setup guide
  createSetupGuide();
  
  console.log('\n🎉 Setup complete!');
  console.log('\nNext steps:');
  console.log('1. Deploy the smart contract (see SMART_CONTRACT_SETUP.md)');
  console.log('2. Set REACT_APP_CONTRACT_APP_ID in projects/algoease-frontend/.env');
  console.log('3. Start the frontend: cd projects/algoease-frontend && npm start');
  console.log('\nFor detailed instructions, see SMART_CONTRACT_SETUP.md');
}

if (require.main === module) {
  main();
}

module.exports = { createEnvFile, createSetupGuide, checkDependencies };
