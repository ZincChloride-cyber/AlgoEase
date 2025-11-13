const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');

const client = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');

// Transaction IDs from recent deployments
const txIds = [
  'JTWX6PM7YIWBVGMMELA4GSYG2IKSPBTF3AA45SHKOT7F3S226YYA', // Latest
  'DJGE2ECSFZSSJKZENSLR4XR4RSX6TEQCRDSAJKBBIVMKEA34NL4A',
  'NFNSTXUV5WWHOSJEESOVBQ6MPCSDHA7IQNUDW754FAORFRYT7SOA',
  'J7Z74XKEZGJN7HI4DVIEKLLKUIY2O64JP5LDGEGQ2OC5FBRLUVSQ'
];

async function checkTransactions() {
  console.log('Checking transaction status...\n');
  
  for (const txId of txIds) {
    try {
      // Try to get from indexer/blockchain
      const status = await client.pendingTransactionInformation(txId).do();
      
      if (status['confirmed-round']) {
        console.log(`✅ ${txId}`);
        console.log(`   Confirmed in round: ${status['confirmed-round']}`);
        
        if (status['application-index']) {
          const appId = status['application-index'];
          const appAddress = algosdk.getApplicationAddress(appId);
          
          console.log(`   App ID: ${appId}`);
          console.log(`   App Address: ${appAddress}`);
          
          // Save contract info
          const contractInfo = {
            appId: Number(appId),
            appAddress,
            network: 'testnet',
            deployedAt: new Date().toISOString(),
            creator: '3AU6XYBNSEW7DRXJVNTGDAZLUYL54CTW3BUYKTBN6LX76KJ3EAVIQLPEBI',
            algodUrl: 'https://testnet-api.algonode.cloud',
            indexerUrl: 'https://testnet-idx.algonode.cloud',
            version: 'v3',
            transactionId: txId
          };
          
          fs.writeFileSync(
            path.join(__dirname, '../contract-info-v3.json'),
            JSON.stringify(contractInfo, null, 2)
          );
          
          // Update frontend .env
          const envPath = path.join(__dirname, '../frontend/.env');
          let envContent = '';
          if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
          }
          
          // Update App ID
          if (envContent.includes('REACT_APP_CONTRACT_APP_ID=')) {
            envContent = envContent.replace(
              /REACT_APP_CONTRACT_APP_ID=.*/,
              `REACT_APP_CONTRACT_APP_ID=${appId}`
            );
          } else {
            envContent += `\nREACT_APP_CONTRACT_APP_ID=${appId}\n`;
          }
          
          // Update URLs
          if (!envContent.includes('REACT_APP_ALGOD_URL=')) {
            envContent += 'REACT_APP_ALGOD_URL=https://testnet-api.algonode.cloud\n';
          }
          if (!envContent.includes('REACT_APP_INDEXER_URL=')) {
            envContent += 'REACT_APP_INDEXER_URL=https://testnet-idx.algonode.cloud\n';
          }
          
          fs.writeFileSync(envPath, envContent);
          
          console.log('\n✅ Contract info saved and frontend .env updated!');
          return contractInfo;
        }
      } else {
        console.log(`⏳ ${txId} - Still pending...`);
      }
    } catch (e) {
      // Try alternative method
      try {
        const indexer = new algosdk.Indexer('', 'https://testnet-idx.algonode.cloud', '');
        const txInfo = await indexer.lookupTransactionByID(txId).do();
        
        if (txInfo.transaction && txInfo.transaction['confirmed-round']) {
          console.log(`✅ ${txId}`);
          console.log(`   Confirmed in round: ${txInfo.transaction['confirmed-round']}`);
          
          if (txInfo.transaction['created-application-index']) {
            const appId = txInfo.transaction['created-application-index'];
            const appAddress = algosdk.getApplicationAddress(appId);
            
            console.log(`   App ID: ${appId}`);
            console.log(`   App Address: ${appAddress}`);
            
            // Save contract info (same as above)
            const contractInfo = {
              appId: Number(appId),
              appAddress,
              network: 'testnet',
              deployedAt: new Date().toISOString(),
              creator: '3AU6XYBNSEW7DRXJVNTGDAZLUYL54CTW3BUYKTBN6LX76KJ3EAVIQLPEBI',
              algodUrl: 'https://testnet-api.algonode.cloud',
              indexerUrl: 'https://testnet-idx.algonode.cloud',
              version: 'v3',
              transactionId: txId
            };
            
            fs.writeFileSync(
              path.join(__dirname, '../contract-info-v3.json'),
              JSON.stringify(contractInfo, null, 2)
            );
            
            // Update frontend .env
            const envPath = path.join(__dirname, '../frontend/.env');
            let envContent = '';
            if (fs.existsSync(envPath)) {
              envContent = fs.readFileSync(envPath, 'utf8');
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
            
            fs.writeFileSync(envPath, envContent);
            
            console.log('\n✅ Contract info saved and frontend .env updated!');
            return contractInfo;
          }
        }
      } catch (e2) {
        console.log(`❌ ${txId} - Not found or error: ${e2.message}`);
      }
    }
  }
  
  console.log('\n⚠️  No confirmed transactions found. They may still be pending.');
  console.log('Please check:');
  console.log('1. Account has enough ALGO for fees (need at least 0.1 ALGO)');
  console.log('2. Network connectivity');
  console.log('3. Wait a few minutes and run this script again');
}

checkTransactions().catch(console.error);

