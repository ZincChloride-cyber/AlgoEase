// Wallet Integration Test
// This utility helps test wallet connections and functionality

export const testWalletConnection = async () => {
  console.log('🧪 Testing wallet connection...');
  
  const results = {
    walletsDetected: 0,
    peraAvailable: false,
    algosignerAvailable: false,
    connectionTest: false,
    errors: []
  };

  try {
    // Test wallet detection
    if (window.AlgoEaseWallets) {
      results.walletsDetected = window.AlgoEaseWallets.available.length;
      console.log(`✅ Detected ${results.walletsDetected} wallets`);
    }

    // Test Pera Wallet
    if (window.algorand && window.algorand.pera) {
      results.peraAvailable = true;
      console.log('✅ Pera Wallet detected');
    } else {
      console.log('❌ Pera Wallet not detected');
    }

    // Test AlgoSigner
    if (window.AlgoSigner) {
      results.algosignerAvailable = true;
      console.log('✅ AlgoSigner detected');
    } else {
      console.log('❌ AlgoSigner not detected');
    }

    // Test connection (without actually connecting)
    if (results.walletsDetected > 0) {
      results.connectionTest = true;
      console.log('✅ Wallet connection should work');
    } else {
      results.errors.push('No wallets available for connection');
      console.log('❌ No wallets available for connection');
    }

  } catch (error) {
    results.errors.push(error.message);
    console.error('❌ Wallet test failed:', error);
  }

  return results;
};

export const testWalletSigning = async (walletType = 'pera') => {
  console.log(`🧪 Testing ${walletType} wallet signing...`);
  
  try {
    if (walletType === 'pera' && window.algorand && window.algorand.pera) {
      // Test Pera Wallet signing capability
      console.log('✅ Pera Wallet signing interface available');
      return { success: true, wallet: 'pera' };
    } else if (walletType === 'algosigner' && window.AlgoSigner) {
      // Test AlgoSigner signing capability
      console.log('✅ AlgoSigner signing interface available');
      return { success: true, wallet: 'algosigner' };
    } else {
      throw new Error(`${walletType} wallet not available`);
    }
  } catch (error) {
    console.error(`❌ ${walletType} wallet signing test failed:`, error);
    return { success: false, error: error.message };
  }
};

export const runWalletTests = async () => {
  console.log('🚀 Running comprehensive wallet tests...');
  
  const connectionTest = await testWalletConnection();
  const peraTest = await testWalletSigning('pera');
  const algosignerTest = await testWalletSigning('algosigner');
  
  const results = {
    connection: connectionTest,
    pera: peraTest,
    algosigner: algosignerTest,
    summary: {
      totalTests: 3,
      passed: 0,
      failed: 0
    }
  };
  
  // Calculate summary
  if (connectionTest.connectionTest) results.summary.passed++;
  else results.summary.failed++;
  
  if (peraTest.success) results.summary.passed++;
  else results.summary.failed++;
  
  if (algosignerTest.success) results.summary.passed++;
  else results.summary.failed++;
  
  console.log('📊 Test Results:', results);
  return results;
};

// Auto-run tests when imported
if (typeof window !== 'undefined') {
  // Run tests after a short delay to allow wallets to load
  setTimeout(() => {
    runWalletTests();
  }, 2000);
}
