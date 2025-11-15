/**
 * Script to fix bounties with missing contract_id
 * This script will:
 * 1. Find all bounties with NULL contract_id
 * 2. Try to match them with on-chain boxes
 * 3. Update the database with the correct contract_id
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const algosdk = require('algosdk');
const { connectDB } = require('../config/database');
const Bounty = require('../models/Bounty');

// Algorand configuration
const algodClient = new algosdk.Algodv2(
  process.env.ALGOD_TOKEN || '',
  process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud',
  process.env.ALGOD_PORT || ''
);

const indexerClient = new algosdk.Indexer(
  process.env.ALGOD_TOKEN || '',
  process.env.INDEXER_SERVER || 'https://testnet-idx.algonode.cloud',
  process.env.ALGOD_PORT || ''
);

const V5_APP_ID = parseInt(process.env.CONTRACT_APP_ID || process.env.REACT_APP_CONTRACT_APP_ID || '749689686');

async function getContractState() {
  try {
    const appInfo = await algodClient.getApplicationByID(V5_APP_ID).do();
    const globalState = {};
    if (appInfo.params['global-state']) {
      appInfo.params['global-state'].forEach(state => {
        const key = Buffer.from(state.key, 'base64').toString();
        if (state.value.type === 1) {
          globalState[key] = state.value.uint;
        } else if (state.value.type === 2) {
          globalState[key] = Buffer.from(state.value.bytes, 'base64').toString();
        }
      });
    }
    return globalState;
  } catch (error) {
    console.error('Error getting contract state:', error);
    return null;
  }
}

async function getBountyFromBox(bountyId) {
  try {
    const prefix = Buffer.from('bounty_', 'utf8');
    const bountyIdBytes = algosdk.encodeUint64(bountyId);
    const boxNameBytes = Buffer.concat([prefix, Buffer.from(bountyIdBytes)]);
    const boxNameBase64 = boxNameBytes.toString('base64');
    
    const boxValue = await indexerClient.lookupApplicationBoxByIDandName(
      V5_APP_ID,
      boxNameBase64
    ).do();
    
    if (!boxValue || !boxValue.value) {
      return null;
    }
    
    const boxData = Buffer.from(boxValue.value, 'base64');
    const data = new Uint8Array(boxData);
    
    if (data.length < 113) {
      return null;
    }
    
    const clientAddr = algosdk.encodeAddress(data.slice(0, 32));
    const freelancerBytes = data.slice(32, 64);
    const isZeroAddress = freelancerBytes.every(byte => byte === 0);
    const freelancerAddr = isZeroAddress ? null : algosdk.encodeAddress(freelancerBytes);
    const verifierAddr = algosdk.encodeAddress(data.slice(64, 96));
    const amountMicro = algosdk.decodeUint64(new Uint8Array(data.slice(96, 104)));
    const deadlineSeconds = algosdk.decodeUint64(new Uint8Array(data.slice(104, 112)));
    const status = data[112];
    const taskDesc = new TextDecoder().decode(data.slice(113));
    
    return {
      bountyId,
      clientAddress: clientAddr,
      freelancerAddress: freelancerAddr,
      verifierAddress: verifierAddr,
      amount: amountMicro / 1000000,
      deadline: new Date(deadlineSeconds * 1000),
      status,
      taskDescription: taskDesc
    };
  } catch (error) {
    if (error.status === 404) {
      return null; // Box doesn't exist
    }
    throw error;
  }
}

async function listAllBountyBoxes() {
  try {
    const boxesResponse = await indexerClient.searchForApplicationBoxes(V5_APP_ID).do();
    const boxes = boxesResponse.boxes || [];
    
    const bountyBoxes = [];
    
    for (const box of boxes) {
      try {
        const nameBytes = Buffer.from(box.name, 'base64');
        
        if (nameBytes.length >= 15 && nameBytes.slice(0, 7).toString() === 'bounty_') {
          // Extract the bounty ID bytes (8 bytes after 'bounty_')
          const bountyIdSlice = nameBytes.slice(7, 15);
          if (bountyIdSlice.length === 8) {
            const bountyIdBytes = new Uint8Array(bountyIdSlice);
            const bountyId = algosdk.decodeUint64(bountyIdBytes, 'safe');
            
            if (!box.value) {
              continue; // Skip boxes without value
            }
            
            const boxData = Buffer.from(box.value, 'base64');
            const data = new Uint8Array(boxData);
            
            if (data.length >= 113) {
              try {
                const clientAddr = algosdk.encodeAddress(data.slice(0, 32));
                const freelancerBytes = data.slice(32, 64);
                const isZeroAddress = freelancerBytes.every(byte => byte === 0);
                const freelancerAddr = isZeroAddress ? null : algosdk.encodeAddress(freelancerBytes);
                const verifierAddr = algosdk.encodeAddress(data.slice(64, 96));
                const amountMicro = algosdk.decodeUint64(new Uint8Array(data.slice(96, 104)), 'safe');
                const deadlineSeconds = algosdk.decodeUint64(new Uint8Array(data.slice(104, 112)), 'safe');
                const status = data[112];
                const taskDesc = new TextDecoder().decode(data.slice(113));
                
                bountyBoxes.push({
                  bountyId,
                  clientAddress: clientAddr,
                  freelancerAddress: freelancerAddr,
                  verifierAddress: verifierAddr,
                  amount: amountMicro / 1000000,
                  deadline: new Date(deadlineSeconds * 1000),
                  status,
                  taskDescription: taskDesc
                });
              } catch (parseError) {
                console.warn('Could not parse box data:', parseError.message);
                continue;
              }
            }
          }
        }
      } catch (parseError) {
        console.warn('Could not parse box:', parseError.message);
        continue;
      }
    }
    
    return bountyBoxes;
  } catch (error) {
    console.error('Error listing boxes:', error);
    return [];
  }
}

async function fixMissingContractIds() {
  console.log('🔍 Finding bounties with missing contract_id...\n');
  
  try {
    // Find all bounties with NULL contract_id
    const bountiesWithoutContractId = await Bounty.find({ contractId: null });
    console.log(`Found ${bountiesWithoutContractId.length} bounties without contract_id\n`);
    
    if (bountiesWithoutContractId.length === 0) {
      console.log('✅ All bounties have contract_id!');
      return;
    }
    
    // Get contract state to check bounty_count
    console.log('📊 Checking contract state...');
    const contractState = await getContractState();
    const bountyCount = contractState ? (contractState['bounty_count'] || 0) : 0;
    console.log(`📊 Contract bounty_count: ${bountyCount}\n`);
    
    // Get all boxes from on-chain
    console.log('📦 Fetching all boxes from on-chain...');
    const allBoxes = await listAllBountyBoxes();
    console.log(`Found ${allBoxes.length} boxes on-chain\n`);
    
    // If we have a bounty_count but no boxes, try to match by using the latest bounty IDs
    if (bountyCount > 0 && allBoxes.length === 0) {
      console.log('⚠️  Warning: Contract has bounty_count but no boxes found. This might indicate:');
      console.log('   1. The bounties were created but boxes are not indexed yet');
      console.log('   2. The contract app ID might be incorrect');
      console.log('   3. The bounties might not have been successfully created on-chain\n');
    }
    
    let fixed = 0;
    let notFound = 0;
    
    for (const bounty of bountiesWithoutContractId) {
      console.log(`\n🔍 Processing bounty: ${bounty.id}`);
      console.log(`   Client: ${bounty.client_address || bounty.clientAddress}`);
      console.log(`   Amount: ${bounty.amount} ALGO`);
      console.log(`   Title: ${bounty.title || 'N/A'}`);
      
      const bountyClient = (bounty.client_address || bounty.clientAddress || '').toUpperCase().trim();
      const bountyAmount = Math.round(parseFloat(bounty.amount || 0) * 1000000);
      
      // Try to find matching box
      let foundBox = null;
      for (const box of allBoxes) {
        const boxClient = (box.clientAddress || '').toUpperCase().trim();
        const boxAmount = Math.round(parseFloat(box.amount || 0) * 1000000);
        const amountDiff = Math.abs(bountyAmount - boxAmount);
        const clientMatch = boxClient === bountyClient;
        const amountMatch = amountDiff < 1000; // Allow 0.001 ALGO difference
        
        if (clientMatch && amountMatch) {
          foundBox = box;
          break;
        }
      }
      
      if (foundBox) {
        console.log(`   ✅ Found matching box with contract_id: ${foundBox.bountyId}`);
        try {
          // Update the bounty
          bounty.contract_id = foundBox.bountyId;
          bounty.contractId = foundBox.bountyId;
          await bounty.save();
          console.log(`   ✅ Updated database with contract_id: ${foundBox.bountyId}`);
          fixed++;
        } catch (updateError) {
          console.error(`   ❌ Failed to update: ${updateError.message}`);
        }
      } else {
        console.log(`   ⚠️  No matching box found on-chain`);
        notFound++;
      }
    }
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 Summary:`);
    console.log(`   ✅ Fixed: ${fixed} bounties`);
    console.log(`   ⚠️  Not found: ${notFound} bounties`);
    console.log(`   📦 Total boxes on-chain: ${allBoxes.length}`);
    console.log(`${'='.repeat(70)}\n`);
    
  } catch (error) {
    console.error('❌ Error fixing contract IDs:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  (async () => {
    try {
      // Initialize database connection first
      console.log('🔌 Connecting to database...');
      await connectDB();
      console.log('✅ Database connected!');
      
      // Run the fix
      await fixMissingContractIds();
      
      console.log('✅ Script completed!');
      process.exit(0);
    } catch (error) {
      console.error('❌ Script failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = { fixMissingContractIds };

