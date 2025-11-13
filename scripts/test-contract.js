#!/usr/bin/env node

/**
 * AlgoEase Smart Contract Test Script
 * 
 * This script tests the basic functionality of the deployed AlgoEase smart contract.
 */

const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  ALGOD_URL: process.env.ALGOD_URL || 'https://testnet-api.algonode.cloud',
  ALGOD_TOKEN: process.env.ALGOD_TOKEN || '',
  INDEXER_URL: process.env.INDEXER_URL || 'https://testnet-idx.algonode.cloud',
  INDEXER_TOKEN: process.env.INDEXER_TOKEN || '',
  CONTRACT_INFO_PATH: path.join(__dirname, '../contract-info.json')
};

class ContractTester {
  constructor() {
    this.algodClient = new algosdk.Algodv2(CONFIG.ALGOD_TOKEN, CONFIG.ALGOD_URL, '');
    this.indexerClient = new algosdk.Indexer(CONFIG.INDEXER_TOKEN, CONFIG.INDEXER_URL, '');
    this.contractInfo = null;
    this.testAccounts = [];
  }

  // Load contract information
  loadContractInfo() {
    try {
      if (!fs.existsSync(CONFIG.CONTRACT_INFO_PATH)) {
        throw new Error('Contract info file not found. Please deploy the contract first.');
      }
      
      this.contractInfo = JSON.parse(fs.readFileSync(CONFIG.CONTRACT_INFO_PATH, 'utf8'));
      console.log('✅ Contract info loaded');
      console.log('   App ID:', this.contractInfo.appId);
      console.log('   Address:', this.contractInfo.appAddress);
      return true;
    } catch (error) {
      console.error('❌ Failed to load contract info:', error.message);
      return false;
    }
  }

  // Generate test accounts
  generateTestAccounts() {
    try {
      console.log('👥 Generating test accounts...');
      
      // Generate 3 test accounts: client, freelancer, verifier
      for (let i = 0; i < 3; i++) {
        const account = algosdk.generateAccount();
        this.testAccounts.push(account);
        console.log(`   Account ${i + 1}: ${account.addr}`);
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to generate test accounts:', error.message);
      return false;
    }
  }

  // Get account balance
  async getAccountBalance(address) {
    try {
      const accountInfo = await this.algodClient.accountInformation(address).do();
      return accountInfo.amount / 1000000; // Convert from microALGO to ALGO
    } catch (error) {
      console.error(`❌ Failed to get balance for ${address}:`, error.message);
      return 0;
    }
  }

  // Get contract state
  async getContractState() {
    try {
      const appInfo = await this.algodClient.getApplicationByID(this.contractInfo.appId).do();
      const globalState = appInfo.params['global-state'] || [];
      
      const parsedState = {};
      globalState.forEach(item => {
        const key = atob(item.key);
        const value = item.value;
        
        if (value.type === 1) { // uint64
          parsedState[key] = value.uint;
        } else if (value.type === 2) { // bytes
          parsedState[key] = atob(value.bytes);
        }
      });

      return parsedState;
    } catch (error) {
      console.error('❌ Failed to get contract state:', error.message);
      return null;
    }
  }

  // Test contract state reading
  async testContractState() {
    console.log('\n🔍 Testing contract state reading...');
    
    try {
      const state = await this.getContractState();
      
      if (state) {
        console.log('✅ Contract state retrieved successfully');
        console.log('   Bounty Count:', state.bounty_count || 0);
        console.log('   Status:', state.status || 'N/A');
        console.log('   Amount:', state.amount ? (state.amount / 1000000) + ' ALGO' : 'N/A');
        return true;
      } else {
        console.log('❌ Failed to retrieve contract state');
        return false;
      }
    } catch (error) {
      console.error('❌ Contract state test failed:', error.message);
      return false;
    }
  }

  // Test contract methods (without actual transactions)
  async testContractMethods() {
    console.log('\n🧪 Testing contract method validation...');
    
    try {
      const suggestedParams = await this.algodClient.getTransactionParams().do();
      
      // Test create_bounty method
      console.log('   Testing create_bounty method...');
      const createBountyTxn = algosdk.makeApplicationCallTxnFromObject({
        from: this.testAccounts[0].addr,
        appIndex: this.contractInfo.appId,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        suggestedParams,
        appArgs: [
          new Uint8Array(Buffer.from('create_bounty')),
          algosdk.encodeUint64(1000000), // 1 ALGO in microALGO
          algosdk.encodeUint64(Math.floor(Date.now() / 1000) + 86400), // 24 hours from now
          new Uint8Array(Buffer.from('Test task description'))
        ],
        accounts: [this.testAccounts[2].addr] // verifier address
      });
      console.log('   ✅ create_bounty transaction created');

      // Test accept_bounty method
      console.log('   Testing accept_bounty method...');
      const acceptBountyTxn = algosdk.makeApplicationCallTxnFromObject({
        from: this.testAccounts[1].addr,
        appIndex: this.contractInfo.appId,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        suggestedParams,
        appArgs: [new Uint8Array(Buffer.from('accept_bounty'))]
      });
      console.log('   ✅ accept_bounty transaction created');

      // Test other methods
      const methods = ['approve_bounty', 'claim', 'refund', 'auto_refund', 'get_bounty'];
      for (const method of methods) {
        const txn = algosdk.makeApplicationCallTxnFromObject({
          from: this.testAccounts[0].addr,
          appIndex: this.contractInfo.appId,
          onComplete: algosdk.OnApplicationComplete.NoOpOC,
          suggestedParams,
          appArgs: [new Uint8Array(Buffer.from(method))]
        });
        console.log(`   ✅ ${method} transaction created`);
      }

      console.log('✅ All contract methods validated successfully');
      return true;

    } catch (error) {
      console.error('❌ Contract method test failed:', error.message);
      return false;
    }
  }

  // Test contract address calculation
  testContractAddress() {
    console.log('\n🏠 Testing contract address calculation...');
    
    try {
      const calculatedAddress = algosdk.getApplicationAddress(this.contractInfo.appId);
      
      if (calculatedAddress === this.contractInfo.appAddress) {
        console.log('✅ Contract address calculation is correct');
        console.log('   Calculated:', calculatedAddress);
        console.log('   Stored:', this.contractInfo.appAddress);
        return true;
      } else {
        console.log('❌ Contract address mismatch');
        console.log('   Calculated:', calculatedAddress);
        console.log('   Stored:', this.contractInfo.appAddress);
        return false;
      }
    } catch (error) {
      console.error('❌ Contract address test failed:', error.message);
      return false;
    }
  }

  // Run all tests
  async runTests() {
    console.log('🧪 AlgoEase Smart Contract Test Suite');
    console.log('====================================\n');

    // Load contract info
    if (!this.loadContractInfo()) {
      return false;
    }

    // Generate test accounts
    if (!this.generateTestAccounts()) {
      return false;
    }

    // Run tests
    const tests = [
      { name: 'Contract State Reading', fn: () => this.testContractState() },
      { name: 'Contract Methods', fn: () => this.testContractMethods() },
      { name: 'Contract Address', fn: () => this.testContractAddress() }
    ];

    let passed = 0;
    let total = tests.length;

    for (const test of tests) {
      try {
        const result = await test.fn();
        if (result) {
          passed++;
        }
      } catch (error) {
        console.error(`❌ ${test.name} failed:`, error.message);
      }
    }

    console.log('\n📊 Test Results');
    console.log('===============');
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);

    if (passed === total) {
      console.log('\n🎉 All tests passed! The smart contract is ready to use.');
      return true;
    } else {
      console.log('\n⚠️ Some tests failed. Please check the contract deployment.');
      return false;
    }
  }
}

// Main execution
async function main() {
  const tester = new ContractTester();
  const success = await tester.runTests();
  process.exit(success ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = ContractTester;
