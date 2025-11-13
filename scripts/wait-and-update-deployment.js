const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');

const client = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
const indexer = new algosdk.Indexer('', 'https://testnet-idx.algonode.cloud', '');

const txId = 'JTWX6PM7YIWBVGMMELA4GSYG2IKSPBTF3AA45SHKOT7F3S226YYA';
const creatorAddress = '3AU6XYBNSEW7DRXJVNTGDAZLUYL54CTW3BUYKTBN6LX76KJ3EAVIQLPEBI';

async function checkAndUpdate() {
  console.log('Checking transaction:', txId);
  console.log('This may take 30-60 seconds for confirmation...\n');
  
  let confirmed = false;
  let attempts = 0;
  const maxAttempts = 20; // Check for up to 2 minutes
  
  while (!confirmed && attempts < maxAttempts) {
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 6000)); // Wait 6 seconds between checks
    
    try {
      // Try indexer first (more reliable)
      const tx = await indexer.lookupTransactionByID(txId).do();
      
      if (tx.transaction && tx.transaction['confirmed-round']) {
        const appId = tx.transaction['created-application-index'];
        
        if (appId) {
          console.log('\n✅ Transaction confirmed!');
          console.log('Confirmed in round:', tx.transaction['confirmed-round']);
          console.log('App ID:', appId);
          
          const appAddress = algosdk.getApplicationAddress(appId);
          console.log('App Address:', appAddress);
          
          // Save contract info
          const contractInfo = {
            appId: Number(appId),
            appAddress,
            network: 'testnet',
            deployedAt: new Date().toISOString(),
            creator: creatorAddress,
            algodUrl: 'https://testnet-api.algonode.cloud',
            indexerUrl: 'https://testnet-idx.algonode.cloud',
            version: 'v3',
            transactionId: txId
          };
          
          const contractInfoPath = path.join(__dirname, '../contract-info-v3.json');
          fs.writeFileSync(contractInfoPath, JSON.stringify(contractInfo, null, 2));
          console.log('\n✅ Contract info saved to:', contractInfoPath);
          
          // Update frontend .env
          const envPath = path.join(__dirname, '../frontend/.env');
          let envContent = '';
          if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
          }
          
          // Update or add App ID
          if (envContent.includes('REACT_APP_CONTRACT_APP_ID=')) {
            envContent = envContent.replace(
              /REACT_APP_CONTRACT_APP_ID=.*/,
              `REACT_APP_CONTRACT_APP_ID=${appId}`
            );
          } else {
            envContent += `\nREACT_APP_CONTRACT_APP_ID=${appId}\n`;
          }
          
          // Update or add network URLs
          if (!envContent.includes('REACT_APP_ALGOD_URL=')) {
            envContent += 'REACT_APP_ALGOD_URL=https://testnet-api.algonode.cloud\n';
          }
          if (!envContent.includes('REACT_APP_INDEXER_URL=')) {
            envContent += 'REACT_APP_INDEXER_URL=https://testnet-idx.algonode.cloud\n';
          }
          
          // Update creator mnemonic and address
          if (envContent.includes('REACT_APP_CREATOR_MNEMONIC=')) {
            envContent = envContent.replace(
              /REACT_APP_CREATOR_MNEMONIC=.*/,
              'REACT_APP_CREATOR_MNEMONIC=once few arena ice fashion birth behind famous drink report dune manual knee popular will multiply fun public kangaroo suspect nominee sail blame abstract place'
            );
          } else {
            envContent += 'REACT_APP_CREATOR_MNEMONIC=once few arena ice fashion birth behind famous drink report dune manual knee popular will multiply fun public kangaroo suspect nominee sail blame abstract place\n';
          }
          
          if (envContent.includes('REACT_APP_CREATOR_ADDRESS=')) {
            envContent = envContent.replace(
              /REACT_APP_CREATOR_ADDRESS=.*/,
              `REACT_APP_CREATOR_ADDRESS=${creatorAddress}`
            );
          } else {
            envContent += `REACT_APP_CREATOR_ADDRESS=${creatorAddress}\n`;
          }
          
          fs.writeFileSync(envPath, envContent);
          console.log('✅ Frontend .env updated:', envPath);
          
          // Update contract.env
          const contractEnvPath = path.join(__dirname, '../contract.env');
          let contractEnv = fs.readFileSync(contractEnvPath, 'utf8');
          contractEnv = contractEnv.replace(/REACT_APP_CONTRACT_APP_ID=.*/, `REACT_APP_CONTRACT_APP_ID=${appId}`);
          contractEnv = contractEnv.replace(/REACT_APP_CONTRACT_ADDRESS=.*/, `REACT_APP_CONTRACT_ADDRESS=${appAddress}`);
          fs.writeFileSync(contractEnvPath, contractEnv);
          console.log('✅ contract.env updated:', contractEnvPath);
          
          console.log('\n=== Deployment Complete ===');
          console.log('App ID:', appId);
          console.log('App Address:', appAddress);
          console.log('\nNext steps:');
          console.log('1. Restart your frontend');
          console.log('2. Test contract interactions');
          
          confirmed = true;
          return contractInfo;
        }
      }
    } catch (e) {
      // Transaction not found yet, continue waiting
      process.stdout.write(`\rAttempt ${attempts}/${maxAttempts}... Waiting for confirmation...`);
    }
  }
  
  if (!confirmed) {
    console.log('\n⚠️  Transaction not confirmed after 2 minutes.');
    console.log('Transaction ID:', txId);
    console.log('Check status at: https://testnet.algoexplorer.io/tx/' + txId);
    console.log('The transaction may still be processing. Please check again in a few minutes.');
  }
}

checkAndUpdate().catch(console.error);





