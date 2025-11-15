/**
 * Script to fix NULL contract_id values by fetching from on-chain data
 * This script:
 * 1. Finds all bounties with NULL contract_id
 * 2. Reads all boxes from the contract
 * 3. Matches bounties by client_address
 * 4. Updates the database with the correct contract_id
 */

require('dotenv').config();
const algosdk = require('algosdk');
const { connectDB, getSupabase } = require('../config/database');
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

const APP_ID = parseInt(process.env.CONTRACT_APP_ID || process.env.REACT_APP_CONTRACT_APP_ID || '749689686');

async function getAllBountyBoxes() {
  console.log(`\n🔍 Fetching all boxes for app ID: ${APP_ID}...`);
  
  try {
    const boxes = [];
    let nextToken = null;
    
    do {
      const params = {
        applicationId: APP_ID,
        limit: 1000
      };
      
      if (nextToken) {
        params.nextToken = nextToken;
      }
      
      const response = await indexerClient.lookupApplicationBoxes(APP_ID).do();
      
      if (response.boxes && response.boxes.length > 0) {
        for (const box of response.boxes) {
          try {
            const boxName = Buffer.from(box.name, 'base64');
            
            // Check if box name starts with "bounty_"
            const prefix = Buffer.from('bounty_', 'utf8');
            if (boxName.slice(0, prefix.length).equals(prefix)) {
              // Extract bounty ID from box name
              const bountyIdBytes = boxName.slice(prefix.length);
              const bountyId = algosdk.decodeUint64(bountyIdBytes, 'safe');
              
              // Parse box value
              const boxValue = Buffer.from(box.value, 'base64');
              const data = new Uint8Array(boxValue);
              
              if (data.length >= 32) {
                const clientAddr = algosdk.encodeAddress(data.slice(0, 32));
                
                boxes.push({
                  bountyId: Number(bountyId),
                  clientAddress: clientAddr,
                  boxName: box.name,
                  boxValue: box.value
                });
              }
            }
          } catch (err) {
            console.warn(`⚠️ Could not parse box:`, err.message);
          }
        }
      }
      
      nextToken = response.nextToken;
    } while (nextToken);
    
    console.log(`✅ Found ${boxes.length} bounty boxes on-chain`);
    return boxes;
  } catch (error) {
    console.error('❌ Error fetching boxes:', error);
    throw error;
  }
}

async function fixContractIds() {
  try {
    console.log('🚀 Starting contract_id fix script...\n');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected\n');
    
    // Get all bounties with NULL contract_id
    console.log('📋 Finding bounties with NULL contract_id...');
    const supabase = getSupabase();
    const { data: bounties, error } = await supabase
      .from('bounties')
      .select('id, contract_id, client_address, title, created_at')
      .is('contract_id', null)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ Found ${bounties.length} bounties with NULL contract_id\n`);
    
    if (bounties.length === 0) {
      console.log('✅ No bounties need fixing!');
      return;
    }
    
    // Get all boxes from chain
    const boxes = await getAllBountyBoxes();
    
    if (boxes.length === 0) {
      console.log('⚠️ No boxes found on-chain. Cannot match bounties.');
      return;
    }
    
    console.log(`\n📊 Matching bounties with on-chain boxes...\n`);
    
    let fixed = 0;
    let notFound = 0;
    
    for (const bounty of bounties) {
      const clientAddr = (bounty.client_address || '').toUpperCase().trim();
      
      if (!clientAddr) {
        console.log(`⚠️ Bounty ${bounty.id} has no client_address, skipping`);
        notFound++;
        continue;
      }
      
      // Find matching box by client address
      const matchingBox = boxes.find(box => 
        box.clientAddress.toUpperCase().trim() === clientAddr
      );
      
      if (matchingBox) {
        try {
          // Update the bounty with contract_id
          const bountyObj = await Bounty.findById(bounty.id);
          if (bountyObj) {
            bountyObj.contract_id = matchingBox.bountyId;
            bountyObj.contractId = matchingBox.bountyId;
            await bountyObj.save();
            
            console.log(`✅ Fixed bounty ${bounty.id}: contract_id = ${matchingBox.bountyId} (${bounty.title || 'No title'})`);
            fixed++;
          } else {
            console.log(`⚠️ Could not load bounty ${bounty.id}`);
            notFound++;
          }
        } catch (saveError) {
          console.error(`❌ Error updating bounty ${bounty.id}:`, saveError.message);
          notFound++;
        }
      } else {
        console.log(`⚠️ No matching box found for bounty ${bounty.id} (${bounty.title || 'No title'}) - client: ${clientAddr.substring(0, 10)}...`);
        notFound++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Fixed: ${fixed}`);
    console.log(`   ⚠️  Not found: ${notFound}`);
    console.log(`   📋 Total: ${bounties.length}\n`);
    
    if (fixed > 0) {
      console.log('✅ Contract IDs have been updated!');
    }
    
  } catch (error) {
    console.error('❌ Error in fix script:', error);
    process.exit(1);
  }
}

// Run the script
fixContractIds()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

