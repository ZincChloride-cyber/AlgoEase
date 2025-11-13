const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  ALGOD_URL: 'https://testnet-api.algonode.cloud',
  APPROVAL_PROGRAM_PATH: path.join(__dirname, '../contracts/algoease_approval_v3.teal'),
  CLEAR_PROGRAM_PATH: path.join(__dirname, '../contracts/algoease_clear_v3.teal'),
  CONTRACT_INFO_PATH: path.join(__dirname, '../contract-info-v3.json'),
  FRONTEND_ENV_PATH: path.join(__dirname, '../frontend/.env'),
};

const client = new algosdk.Algodv2('', CONFIG.ALGOD_URL, '');

async function deploy() {
  try {
    // Load mnemonic
    const contractEnvPath = path.join(__dirname, '../contract.env');
    const envContent = fs.readFileSync(contractEnvPath, 'utf8');
    const mnemonicMatch = envContent.match(/REACT_APP_CREATOR_MNEMONIC=(.+)/);
    if (!mnemonicMatch) {
      throw new Error('Mnemonic not found in contract.env');
    }
    const mnemonic = mnemonicMatch[1].trim();
    
    const account = algosdk.mnemonicToSecretKey(mnemonic);
    // account.addr is an Address object with toString() method
    const address = account.addr.toString();
    console.log('Using account:', address);
    console.log('Address type:', typeof address);
    console.log('Address length:', address ? address.length : 'null');
    
    if (!address) {
      throw new Error('Failed to get address from account');
    }
    
    // Check balance
    const accountInfo = await client.accountInformation(address).do();
    const balance = Number(accountInfo.amount) / 1000000;
    console.log('Account balance:', balance.toFixed(2), 'ALGO');
    
    if (balance < 0.1) {
      throw new Error('Insufficient balance. Need at least 0.1 ALGO');
    }
    
    // Compile programs
    console.log('Compiling approval program...');
    const approvalCode = fs.readFileSync(CONFIG.APPROVAL_PROGRAM_PATH, 'utf8');
    const approvalCompiled = await client.compile(approvalCode).do();
    const approvalProgram = new Uint8Array(Buffer.from(approvalCompiled.result, 'base64'));
    
    console.log('Compiling clear program...');
    const clearCode = fs.readFileSync(CONFIG.CLEAR_PROGRAM_PATH, 'utf8');
    const clearCompiled = await client.compile(clearCode).do();
    const clearProgram = new Uint8Array(Buffer.from(clearCompiled.result, 'base64'));
    
    // Get suggested params
    const params = await client.getTransactionParams().do();
    
    // Create transaction - use string address directly
    console.log('Creating deployment transaction...');
    console.log('From address for transaction:', address);
    
    // Create transaction object - use 'sender' field (algosdk expects this)
    const txnParams = {
      sender: address, // Use 'sender' instead of 'from'
      suggestedParams: params,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      approvalProgram: approvalProgram,
      clearProgram: clearProgram,
      numGlobalByteSlices: 10,
      numGlobalInts: 10,
      numLocalByteSlices: 0,
      numLocalInts: 0
    };
    
    console.log('Transaction params sender field:', txnParams.sender);
    console.log('Transaction params sender type:', typeof txnParams.sender);
    
    const txn = algosdk.makeApplicationCreateTxnFromObject(txnParams);
    
    // Sign
    const signedTxn = txn.signTxn(account.sk);
    
    // Submit
    console.log('Submitting transaction...');
    const txResponse = await client.sendRawTransaction(signedTxn).do();
    const txId = txResponse.txId || txResponse;
    console.log('Transaction ID:', txId);
    console.log('Waiting for confirmation (this may take up to 1 minute)...');
    
    // Wait with longer timeout and status updates
    let confirmed = false;
    let rounds = 0;
    const maxRounds = 30;
    
    while (!confirmed && rounds < maxRounds) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
      rounds++;
      
      try {
        const status = await client.pendingTransactionInformation(txId).do();
        if (status['confirmed-round']) {
          confirmed = true;
          const appId = status['application-index'];
          const appAddress = algosdk.getApplicationAddress(appId);
          
          console.log('\n✅ Deployment successful!');
          console.log('App ID:', appId);
          console.log('App Address:', appAddress);
          
          // Save contract info
          const contractInfo = {
            appId: Number(appId),
            appAddress,
            network: 'testnet',
            deployedAt: new Date().toISOString(),
            creator: address,
            algodUrl: CONFIG.ALGOD_URL,
            indexerUrl: 'https://testnet-idx.algonode.cloud',
            version: 'v3',
            transactionId: txId
          };
          
          fs.writeFileSync(CONFIG.CONTRACT_INFO_PATH, JSON.stringify(contractInfo, null, 2));
          console.log('Contract info saved to:', CONFIG.CONTRACT_INFO_PATH);
          
          // Update frontend .env
          let envContent = '';
          if (fs.existsSync(CONFIG.FRONTEND_ENV_PATH)) {
            envContent = fs.readFileSync(CONFIG.FRONTEND_ENV_PATH, 'utf8');
          }
          
          if (envContent.includes('REACT_APP_CONTRACT_APP_ID=')) {
            envContent = envContent.replace(
              /REACT_APP_CONTRACT_APP_ID=.*/,
              `REACT_APP_CONTRACT_APP_ID=${appId}`
            );
          } else {
            envContent += `\nREACT_APP_CONTRACT_APP_ID=${appId}\n`;
          }
          
          if (!envContent.includes('REACT_APP_ALGOD_URL=')) {
            envContent += 'REACT_APP_ALGOD_URL=https://testnet-api.algonode.cloud\n';
          }
          if (!envContent.includes('REACT_APP_INDEXER_URL=')) {
            envContent += 'REACT_APP_INDEXER_URL=https://testnet-idx.algonode.cloud\n';
          }
          
          fs.writeFileSync(CONFIG.FRONTEND_ENV_PATH, envContent);
          console.log('Frontend .env updated:', CONFIG.FRONTEND_ENV_PATH);
          
          console.log('\n=== Deployment Complete ===');
          console.log('Next steps:');
          console.log('1. Restart your frontend');
          console.log('2. Test contract interactions');
          
          return contractInfo;
        } else {
          process.stdout.write(`\rWaiting... (${rounds}/${maxRounds} rounds)`);
        }
      } catch (e) {
        // Check if transaction failed
        if (e.message && e.message.includes('not found')) {
          // Transaction might have been dropped, check if it exists
          try {
            const indexer = new algosdk.Indexer('', 'https://testnet-idx.algonode.cloud', '');
            const txInfo = await indexer.lookupTransactionByID(txId).do();
            if (txInfo.transaction && txInfo.transaction['confirmed-round']) {
              const appId = txInfo.transaction['created-application-index'];
              if (appId) {
                console.log('\n✅ Transaction confirmed via indexer!');
                console.log('App ID:', appId);
                // Save info (same as above)
                return;
              }
            }
          } catch (e2) {
            // Continue waiting
          }
        }
        process.stdout.write(`\rWaiting... (${rounds}/${maxRounds} rounds)`);
      }
    }
    
    if (!confirmed) {
      console.log('\n⚠️  Transaction not confirmed after 30 rounds.');
      console.log('Transaction ID:', txId);
      console.log('Check status at: https://testnet.algoexplorer.io/tx/' + txId);
      console.log('The transaction may still be processing. Run check-deployment-status.js later.');
    }
    
  } catch (error) {
    console.error('Deployment failed:', error.message);
    throw error;
  }
}

deploy().catch(console.error);

