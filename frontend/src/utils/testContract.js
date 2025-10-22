// Test script for smart contract integration
import contractUtils from './contractUtils';
import contractDeployer from './deployContract';

class ContractTester {
  constructor() {
    this.testResults = [];
  }

  // Test contract utility functions
  async testContractUtils() {
    console.log('Testing contract utilities...');
    
    try {
      // Test 1: Check if contract app ID is set
      const appId = contractUtils.getAppId();
      if (!appId) {
        throw new Error('Contract app ID not set');
      }
      this.testResults.push({ test: 'App ID Check', status: 'PASS', message: `App ID: ${appId}` });
    } catch (error) {
      this.testResults.push({ test: 'App ID Check', status: 'FAIL', message: error.message });
    }

    try {
      // Test 2: Get contract state
      const state = await contractUtils.getContractState();
      this.testResults.push({ test: 'Contract State', status: 'PASS', message: 'State loaded successfully' });
    } catch (error) {
      this.testResults.push({ test: 'Contract State', status: 'FAIL', message: error.message });
    }

    try {
      // Test 3: Get current bounty
      const bounty = await contractUtils.getCurrentBounty();
      if (bounty) {
        this.testResults.push({ test: 'Current Bounty', status: 'PASS', message: 'Bounty found' });
      } else {
        this.testResults.push({ test: 'Current Bounty', status: 'INFO', message: 'No active bounty' });
      }
    } catch (error) {
      this.testResults.push({ test: 'Current Bounty', status: 'FAIL', message: error.message });
    }

    return this.testResults;
  }

  // Test deployment status
  async testDeployment() {
    console.log('Testing deployment status...');
    
    try {
      const status = await contractDeployer.getDeploymentStatus();
      if (status.deployed) {
        this.testResults.push({ 
          test: 'Deployment Status', 
          status: 'PASS', 
          message: `Contract deployed with App ID: ${status.appId}` 
        });
      } else {
        this.testResults.push({ 
          test: 'Deployment Status', 
          status: 'FAIL', 
          message: 'Contract not deployed' 
        });
      }
    } catch (error) {
      this.testResults.push({ 
        test: 'Deployment Status', 
        status: 'FAIL', 
        message: error.message 
      });
    }

    return this.testResults;
  }

  // Test transaction creation (without submitting)
  async testTransactionCreation() {
    console.log('Testing transaction creation...');
    
    const testAddress = 'TEST1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF';
    
    try {
      // Test create bounty transaction
      const createTxns = await contractUtils.createBounty(
        testAddress,
        10, // 10 ALGO
        '2024-12-31T23:59:59Z',
        'Test bounty description',
        testAddress
      );
      
      if (createTxns && createTxns.length === 2) {
        this.testResults.push({ 
          test: 'Create Bounty Transaction', 
          status: 'PASS', 
          message: 'Transaction created successfully' 
        });
      } else {
        this.testResults.push({ 
          test: 'Create Bounty Transaction', 
          status: 'FAIL', 
          message: 'Invalid transaction structure' 
        });
      }
    } catch (error) {
      this.testResults.push({ 
        test: 'Create Bounty Transaction', 
        status: 'FAIL', 
        message: error.message 
      });
    }

    try {
      // Test accept bounty transaction
      const acceptTxn = await contractUtils.acceptBounty(testAddress);
      
      if (acceptTxn) {
        this.testResults.push({ 
          test: 'Accept Bounty Transaction', 
          status: 'PASS', 
          message: 'Transaction created successfully' 
        });
      } else {
        this.testResults.push({ 
          test: 'Accept Bounty Transaction', 
          status: 'FAIL', 
          message: 'Invalid transaction structure' 
        });
      }
    } catch (error) {
      this.testResults.push({ 
        test: 'Accept Bounty Transaction', 
        status: 'FAIL', 
        message: error.message 
      });
    }

    return this.testResults;
  }

  // Run all tests
  async runAllTests() {
    console.log('Starting contract integration tests...');
    this.testResults = [];

    await this.testDeployment();
    await this.testContractUtils();
    await this.testTransactionCreation();

    // Print results
    console.log('\n=== Test Results ===');
    this.testResults.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : 'ℹ️';
      console.log(`${status} ${result.test}: ${result.message}`);
    });

    const passCount = this.testResults.filter(r => r.status === 'PASS').length;
    const failCount = this.testResults.filter(r => r.status === 'FAIL').length;
    const infoCount = this.testResults.filter(r => r.status === 'INFO').length;

    console.log(`\nSummary: ${passCount} passed, ${failCount} failed, ${infoCount} info`);
    
    return {
      results: this.testResults,
      summary: { passed: passCount, failed: failCount, info: infoCount }
    };
  }

  // Test wallet integration
  async testWalletIntegration() {
    console.log('Testing wallet integration...');
    
    // This would test the WalletContext integration
    // For now, just return a mock result
    return {
      test: 'Wallet Integration',
      status: 'INFO',
      message: 'Wallet integration requires actual wallet connection'
    };
  }
}

// Export test functions
export const runContractTests = async () => {
  const tester = new ContractTester();
  return await tester.runAllTests();
};

export const testDeployment = async () => {
  const tester = new ContractTester();
  return await tester.testDeployment();
};

export const testContractUtils = async () => {
  const tester = new ContractTester();
  return await tester.testContractUtils();
};

export default ContractTester;
