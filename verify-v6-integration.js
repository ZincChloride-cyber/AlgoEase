// Script to verify V6 contract integration
// Run with: node verify-v6-integration.js

const fs = require('fs');
const path = require('path');

const V6_APP_ID = 749696699;
const V6_ADDRESS = 'K66GIQVP5M7M77AZLZ4W6B763KC6A545C7QZQRYDP7OGYS2ZERRQXJH4EY';

console.log('🔍 Verifying V6 Contract Integration...\n');

let errors = [];
let warnings = [];

// Check frontend files
console.log('📁 Checking Frontend Files...');
const frontendFiles = [
  'frontend/src/pages/Home.js',
  'frontend/src/utils/contractUtils.js',
  'frontend/src/config/contract.js'
];

frontendFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for V6 App ID
    if (content.includes(V6_APP_ID.toString())) {
      console.log(`  ✅ ${file} - Contains V6 App ID`);
    } else {
      errors.push(`${file} - Missing V6 App ID`);
      console.log(`  ❌ ${file} - Missing V6 App ID`);
    }
    
    // Check for V6 Address
    if (content.includes(V6_ADDRESS)) {
      console.log(`  ✅ ${file} - Contains V6 Address`);
    } else {
      warnings.push(`${file} - Missing V6 Address (may be calculated)`);
      console.log(`  ⚠️  ${file} - Missing V6 Address (may be calculated)`);
    }
    
    // Check for old contract IDs
    const oldIds = ['749599170', '749689686', '749646001'];
    oldIds.forEach(oldId => {
      if (content.includes(oldId)) {
        errors.push(`${file} - Contains old contract ID: ${oldId}`);
        console.log(`  ❌ ${file} - Contains old contract ID: ${oldId}`);
      }
    });
  } else {
    warnings.push(`${file} - File not found`);
    console.log(`  ⚠️  ${file} - File not found`);
  }
});

// Check backend files
console.log('\n📁 Checking Backend Files...');
const backendFiles = [
  'backend/routes/bounties.js',
  'backend/routes/contracts.js'
];

backendFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for V6 App ID
    if (content.includes(V6_APP_ID.toString())) {
      console.log(`  ✅ ${file} - Contains V6 App ID`);
    } else {
      errors.push(`${file} - Missing V6 App ID`);
      console.log(`  ❌ ${file} - Missing V6 App ID`);
    }
  } else {
    warnings.push(`${file} - File not found`);
    console.log(`  ⚠️  ${file} - File not found`);
  }
});

// Check environment files
console.log('\n📁 Checking Environment Files...');
const envFiles = [
  'contract.env',
  'frontend/.env'
];

envFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes(V6_APP_ID.toString())) {
      console.log(`  ✅ ${file} - Contains V6 App ID`);
    } else {
      warnings.push(`${file} - Missing V6 App ID`);
      console.log(`  ⚠️  ${file} - Missing V6 App ID`);
    }
    
    if (content.includes(V6_ADDRESS)) {
      console.log(`  ✅ ${file} - Contains V6 Address`);
    } else {
      warnings.push(`${file} - Missing V6 Address`);
      console.log(`  ⚠️  ${file} - Missing V6 Address`);
    }
  } else {
    warnings.push(`${file} - File not found`);
    console.log(`  ⚠️  ${file} - File not found`);
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Summary:');
console.log('='.repeat(50));

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All checks passed! V6 integration looks good.');
} else {
  if (errors.length > 0) {
    console.log(`\n❌ Errors (${errors.length}):`);
    errors.forEach(err => console.log(`   - ${err}`));
  }
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  Warnings (${warnings.length}):`);
    warnings.forEach(warn => console.log(`   - ${warn}`));
  }
}

console.log('\n💡 Next Steps:');
console.log('   1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)');
console.log('   2. Restart frontend server: cd frontend && npm start');
console.log('   3. Restart backend server: cd backend && npm start');
console.log('   4. Verify contract ID shows 749696699 on home page\n');

process.exit(errors.length > 0 ? 1 : 0);

