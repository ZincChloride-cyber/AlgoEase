#!/usr/bin/env node
/**
 * Script to update all contract IDs and addresses across the codebase
 */

const fs = require('fs');
const path = require('path');

const NEW_APP_ID = '749646001';
const NEW_ADDRESS = 'L5GY7SCGVI6M7XB4F4HGCBSSKCGQFR33NEBHHP35JKBYDQFP2DX4LQ7A4U';
const OLD_IDS = ['749599170', '749540140', '749335380'];
const OLD_ADDRESS_PREFIX = 'K2M726DQ';

// Files to check and update
const filesToCheck = [
  'frontend/.env',
  'frontend/src/pages/Home.js',
  'frontend/src/config/contract.js',
  'frontend/src/utils/contractUtils.js',
  'backend/.env',
  'contract.env',
  'contract-info.json'
];

function updateFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let updated = false;

  // Replace old contract IDs
  OLD_IDS.forEach(oldId => {
    if (content.includes(oldId)) {
      console.log(`  Replacing old App ID: ${oldId} → ${NEW_APP_ID}`);
      content = content.replace(new RegExp(oldId, 'g'), NEW_APP_ID);
      updated = true;
    }
  });

  // Replace old address
  if (content.includes(OLD_ADDRESS_PREFIX)) {
    console.log(`  Replacing old address prefix: ${OLD_ADDRESS_PREFIX}...`);
    // This is trickier - we'll update env files specifically
    if (filePath.includes('.env') || filePath.includes('contract-info.json')) {
      const oldAddressPattern = /K2M726DQ[^"'\s]*/g;
      if (oldAddressPattern.test(content)) {
        content = content.replace(oldAddressPattern, NEW_ADDRESS);
        updated = true;
      }
    }
  }

  if (updated) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
    return true;
  } else {
    console.log(`✓  No changes needed: ${filePath}`);
    return false;
  }
}

console.log('=== Updating Contract IDs and Addresses ===\n');
console.log(`New App ID: ${NEW_APP_ID}`);
console.log(`New Address: ${NEW_ADDRESS}\n`);

let updatedCount = 0;
filesToCheck.forEach(file => {
  console.log(`Checking: ${file}`);
  if (updateFile(file)) {
    updatedCount++;
  }
  console.log('');
});

console.log(`\n=== Summary ===`);
console.log(`Files checked: ${filesToCheck.length}`);
console.log(`Files updated: ${updatedCount}`);
console.log(`\n✅ Done! Please restart your frontend and backend servers.`);

