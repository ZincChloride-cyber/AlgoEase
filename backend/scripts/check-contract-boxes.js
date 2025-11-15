/**
 * Quick script to check which boxes exist on each contract
 */

require('dotenv').config();
const algosdk = require('algosdk');

const OLD_CONTRACT_APP_ID = 749696699;
const NEW_CONTRACT_APP_ID = 749702537;

const indexerClient = new algosdk.Indexer(
  process.env.ALGOD_TOKEN || '',
  process.env.INDEXER_SERVER || 'https://testnet-idx.algonode.cloud',
  process.env.ALGOD_PORT || ''
);

async function checkContractBoxes(appId, contractName) {
  try {
    console.log(`\n🔍 Checking ${contractName} contract (App ID: ${appId})...`);
    
    const response = await indexerClient.searchForApplicationBoxes(appId).do();
    const boxes = response.boxes || [];
    
    console.log(`✅ Found ${boxes.length} boxes on ${contractName} contract`);
    
    if (boxes.length > 0) {
      console.log(`\n📦 Boxes found:`);
      boxes.forEach((box, idx) => {
        const nameBytes = Buffer.from(box.name, 'base64');
        const nameHex = nameBytes.toString('hex');
        let nameStr = '';
        try {
          nameStr = new TextDecoder().decode(nameBytes);
        } catch (e) {
          nameStr = 'N/A';
        }
        
        // Try to extract bounty ID
        let bountyId = null;
        if (nameBytes.length >= 15) {
          const prefix = Buffer.from('bounty_', 'utf8');
          if (nameBytes.slice(0, prefix.length).equals(prefix)) {
            try {
              const bountyIdBytes = nameBytes.slice(prefix.length, prefix.length + 8);
              bountyId = algosdk.decodeUint64(new Uint8Array(bountyIdBytes));
            } catch (e) {
              // Ignore
            }
          }
        }
        
        console.log(`  ${idx + 1}. Box name: ${nameStr || 'N/A'}`);
        console.log(`     Hex: ${nameHex.substring(0, 32)}...`);
        if (bountyId !== null) {
          console.log(`     Bounty ID: ${bountyId}`);
        }
        console.log(`     Value length: ${box.value ? Buffer.from(box.value, 'base64').length : 0} bytes`);
      });
    }
    
    return boxes.length;
  } catch (error) {
    if (error.status === 404 || error.message?.includes('not found')) {
      console.log(`❌ Contract ${contractName} (${appId}) not found or has no boxes`);
      return 0;
    }
    console.error(`❌ Error checking ${contractName} contract:`, error.message);
    return 0;
  }
}

async function main() {
  console.log('🚀 Checking contracts for boxes...\n');
  
  const [oldBoxes, newBoxes] = await Promise.all([
    checkContractBoxes(OLD_CONTRACT_APP_ID, 'OLD'),
    checkContractBoxes(NEW_CONTRACT_APP_ID, 'NEW')
  ]);
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`Old Contract (${OLD_CONTRACT_APP_ID}): ${oldBoxes} boxes`);
  console.log(`New Contract (${NEW_CONTRACT_APP_ID}): ${newBoxes} boxes`);
  console.log('='.repeat(80));
  
  if (newBoxes === 0) {
    console.log('\n⚠️  No boxes found on NEW contract!');
    console.log('   This means either:');
    console.log('   1. No bounties have been created on the new contract yet');
    console.log('   2. The contract ID is incorrect');
    console.log('   3. The indexer hasn\'t indexed the boxes yet (wait a few minutes)');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

