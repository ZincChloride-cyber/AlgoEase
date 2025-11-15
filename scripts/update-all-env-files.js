#!/usr/bin/env node
/**
 * Script to update all .env files with the new contract ID and address
 */

const fs = require('fs');
const path = require('path');

const NEW_APP_ID = '749648617';
const NEW_ADDRESS = 'W7Z5VWO4V5MNXSS4HCMHQSCIH373NLTAP5IPSNTIQZP6J3XFT6PNEE6KWA';
const OLD_APP_ID = '749646001';
const OLD_ADDRESS = 'L5GY7SCGVI6M7XB4F4HGCBSSKCGQFR33NEBHHP35JKBYDQFP2DX4LQ7A4U';

// Files to update
const filesToUpdate = [
  {
    path: 'frontend/.env',
    updates: [
      { pattern: /REACT_APP_CONTRACT_APP_ID=.*/g, replacement: `REACT_APP_CONTRACT_APP_ID=${NEW_APP_ID}` },
      { pattern: /REACT_APP_CONTRACT_ADDRESS=.*/g, replacement: `REACT_APP_CONTRACT_ADDRESS=${NEW_ADDRESS}` }
    ],
    createIfNotExists: true,
    defaultContent: `# AlgoEase Frontend Configuration
REACT_APP_CONTRACT_APP_ID=${NEW_APP_ID}
REACT_APP_CONTRACT_ADDRESS=${NEW_ADDRESS}
REACT_APP_ALGOD_URL=https://testnet-api.algonode.cloud
REACT_APP_INDEXER_URL=https://testnet-idx.algonode.cloud
REACT_APP_NETWORK=testnet
REACT_APP_API_URL=http://localhost:5000/api
`
  },
  {
    path: 'backend/.env',
    updates: [
      { pattern: /CONTRACT_APP_ID=.*/g, replacement: `CONTRACT_APP_ID=${NEW_APP_ID}` },
      { pattern: /CONTRACT_ADDRESS=.*/g, replacement: `CONTRACT_ADDRESS=${NEW_ADDRESS}` }
    ],
    createIfNotExists: true,
    defaultContent: `# AlgoEase Backend Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database - Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Algorand Configuration
ALGOD_SERVER=https://testnet-api.algonode.cloud
ALGOD_TOKEN=
ALGOD_PORT=

# Contract Configuration
CONTRACT_APP_ID=${NEW_APP_ID}
CONTRACT_ADDRESS=${NEW_ADDRESS}
CONTRACT_CREATOR_ADDRESS=3AU6XYBNSEW7DRXJVNTGDAZLUYL54CTW3BUYKTBN6LX76KJ3EAVIQLPEBI

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
`
  },
  {
    path: 'contract.env',
    updates: [
      { pattern: /REACT_APP_CONTRACT_APP_ID=.*/g, replacement: `REACT_APP_CONTRACT_APP_ID=${NEW_APP_ID}` },
      { pattern: /REACT_APP_CONTRACT_ADDRESS=.*/g, replacement: `REACT_APP_CONTRACT_ADDRESS=${NEW_ADDRESS}` }
    ],
    createIfNotExists: false
  }
];

function updateFile(fileConfig) {
  const fullPath = path.join(__dirname, '..', fileConfig.path);
  let content = '';
  let fileExists = fs.existsSync(fullPath);
  
  if (fileExists) {
    content = fs.readFileSync(fullPath, 'utf8');
    console.log(`📝 Updating: ${fileConfig.path}`);
  } else if (fileConfig.createIfNotExists) {
    console.log(`📄 Creating: ${fileConfig.path}`);
    content = fileConfig.defaultContent || '';
  } else {
    console.log(`⚠️  File not found (skipping): ${fileConfig.path}`);
    return false;
  }
  
  let updated = false;
  
  // Apply all updates
  fileConfig.updates.forEach(update => {
    if (update.pattern.test(content)) {
      content = content.replace(update.pattern, update.replacement);
      updated = true;
    } else if (fileConfig.createIfNotExists && !fileExists) {
      // Add the line if it doesn't exist
      content += '\n' + update.replacement;
      updated = true;
    }
  });
  
  // Also replace old values if they exist
  if (content.includes(OLD_APP_ID)) {
    content = content.replace(new RegExp(OLD_APP_ID, 'g'), NEW_APP_ID);
    updated = true;
  }
  if (content.includes(OLD_ADDRESS)) {
    content = content.replace(new RegExp(OLD_ADDRESS, 'g'), NEW_ADDRESS);
    updated = true;
  }
  
  if (updated || !fileExists) {
    // Ensure directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ ${fileExists ? 'Updated' : 'Created'}: ${fileConfig.path}`);
    return true;
  } else {
    console.log(`✓  No changes needed: ${fileConfig.path}`);
    return false;
  }
}

console.log('=== Updating All .env Files ===\n');
console.log(`New App ID: ${NEW_APP_ID}`);
console.log(`New Address: ${NEW_ADDRESS}\n`);

let updatedCount = 0;
filesToUpdate.forEach(fileConfig => {
  if (updateFile(fileConfig)) {
    updatedCount++;
  }
  console.log('');
});

console.log(`=== Summary ===`);
console.log(`Files checked: ${filesToUpdate.length}`);
console.log(`Files updated/created: ${updatedCount}`);
console.log(`\n✅ Done! Please restart your frontend and backend servers.`);

