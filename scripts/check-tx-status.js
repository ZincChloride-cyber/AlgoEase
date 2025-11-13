const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');

const ALGOD_URL = 'https://testnet-api.algonode.cloud';
const INDEXER_URL = 'https://testnet-idx.algonode.cloud';

const txId = process.argv[2] || 'FUBO4PHIKAPGQKDOFEXDH2UDIMX3TEJ73GBMN3AS75O7QJHTWMLA';

const algodClient = new algosdk.Algodv2('', ALGOD_URL, '');
const indexerClient = new algosdk.Indexer('', INDEXER_URL, '');

async function checkTransaction() {
  console.log(`Checking transaction: ${txId}\n`);
  
  try {
    // Try indexer first (more reliable for confirmed transactions)
    console.log('Checking via indexer...');
    const txInfo = await indexerClient.lookupTransactionByID(txId).do();
    console.log('Indexer response received');
    
    console.log('Transaction data:', JSON.stringify(txInfo, null, 2));
    
    if (txInfo.transaction && txInfo.transaction['confirmed-round']) {
      console.log('✅ Transaction confirmed!');
      console.log(`   Confirmed in round: ${txInfo.transaction['confirmed-round']}`);
      
      if (txInfo.transaction['created-application-index']) {
        const appId = txInfo.transaction['created-application-index'];
        const appAddress = algosdk.getApplicationAddress(appId);
        
        console.log(`\n📱 Application ID: ${appId}`);
        console.log(`🏠 Application Address: ${appAddress}`);
        
        // Save contract info
        const contractInfo = {
          appId: Number(appId),
          appAddress,
          network: 'testnet',
          deployedAt: new Date().toISOString(),
          creator: '3AU6XYBNSEW7DRXJVNTGDAZLUYL54CTW3BUYKTBN6LX76KJ3EAVIQLPEBI',
          algodUrl: ALGOD_URL,
          indexerUrl: INDEXER_URL,
          version: 'v3',
          transactionId: txId
        };
        
        fs.writeFileSync(
          path.join(__dirname, '../contract-info-v3.json'),
          JSON.stringify(contractInfo, null, 2)
        );
        console.log('\n✅ Contract info saved to contract-info-v3.json');
        
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
          envContent += `REACT_APP_ALGOD_URL=${ALGOD_URL}\n`;
        }
        if (!envContent.includes('REACT_APP_INDEXER_URL=')) {
          envContent += `REACT_APP_INDEXER_URL=${INDEXER_URL}\n`;
        }
        
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Frontend .env updated!');
        
        return contractInfo;
      }
    }
  } catch (e) {
    // Try algod pending transaction
    try {
      const status = await algodClient.pendingTransactionInformation(txId).do();
      
      if (status['confirmed-round']) {
        console.log('✅ Transaction confirmed!');
        console.log(`   Confirmed in round: ${status['confirmed-round']}`);
        
        if (status['application-index']) {
          const appId = status['application-index'];
          const appAddress = algosdk.getApplicationAddress(appId);
          
          console.log(`\n📱 Application ID: ${appId}`);
          console.log(`🏠 Application Address: ${appAddress}`);
          
          // Save contract info (same as above)
          const contractInfo = {
            appId: Number(appId),
            appAddress,
            network: 'testnet',
            deployedAt: new Date().toISOString(),
            creator: '3AU6XYBNSEW7DRXJVNTGDAZLUYL54CTW3BUYKTBN6LX76KJ3EAVIQLPEBI',
            algodUrl: ALGOD_URL,
            indexerUrl: INDEXER_URL,
            version: 'v3',
            transactionId: txId
          };
          
          fs.writeFileSync(
            path.join(__dirname, '../contract-info-v3.json'),
            JSON.stringify(contractInfo, null, 2)
          );
          console.log('\n✅ Contract info saved to contract-info-v3.json');
          
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
            envContent += `REACT_APP_ALGOD_URL=${ALGOD_URL}\n`;
          }
          if (!envContent.includes('REACT_APP_INDEXER_URL=')) {
            envContent += `REACT_APP_INDEXER_URL=${INDEXER_URL}\n`;
          }
          
          fs.writeFileSync(envPath, envContent);
          console.log('✅ Frontend .env updated!');
          
          return contractInfo;
        }
      } else {
        console.log('⏳ Transaction still pending...');
        console.log('   Pool error:', status['pool-error'] || 'None');
      }
    } catch (e2) {
      console.log('❌ Error checking transaction:', e2.message);
      console.log('\nThe transaction may still be processing. Please wait a moment and try again.');
    }
  }
}

checkTransaction().catch(console.error);

