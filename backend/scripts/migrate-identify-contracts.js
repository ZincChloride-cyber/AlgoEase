/**
 * Migration Script: Identify which bounties are on which contract
 * 
 * This script:
 * 1. Reads all bounties from the database
 * 2. For each bounty with a contractId, checks if the box exists on:
 *    - Old contract: 749696699 (V6 - old contract)
 *    - New contract: 749702537 (Bounty Escrow - new contract)
 * 3. Reports which contract each bounty belongs to
 * 4. Optionally identifies bounties that need migration
 */

require('dotenv').config();
const algosdk = require('algosdk');
const { connectDB } = require('../config/database');
const Bounty = require('../models/Bounty');

// Contract configurations
const OLD_CONTRACT_APP_ID = 749696699; // Old V6 contract
const NEW_CONTRACT_APP_ID = 749702537; // New Bounty Escrow contract

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

/**
 * Get box name bytes for a bounty ID
 */
function getBoxNameBytes(bountyId) {
  const prefix = Buffer.from('bounty_', 'utf8');
  const bountyIdBytes = algosdk.encodeUint64(bountyId);
  const boxNameBytes = Buffer.concat([prefix, Buffer.from(bountyIdBytes)]);
  return boxNameBytes.toString('base64');
}

/**
 * Check if a box exists on a specific contract and read its data
 */
async function checkBoxExists(appId, bountyId) {
  try {
    const boxNameBase64 = getBoxNameBytes(bountyId);
    
    // First, check if box exists using search (faster check)
    try {
      const searchResponse = await indexerClient.searchForApplicationBoxes(appId).do();
      const boxes = searchResponse.boxes || [];
      const boxExists = boxes.some(box => box.name === boxNameBase64);
      
      if (!boxExists) {
        return { exists: false };
      }
    } catch (searchError) {
      // Continue to try direct lookup
      console.warn(`⚠️  Could not search boxes for app ${appId}:`, searchError.message);
    }
    
    // Try indexer lookup (includes value)
    try {
      const boxValue = await indexerClient.lookupApplicationBoxByIDandName(
        appId,
        boxNameBase64
      ).do();
      
      if (boxValue) {
        // Check if value exists and has data
        if (boxValue.value) {
          try {
            const boxData = Buffer.from(boxValue.value, 'base64');
            const data = new Uint8Array(boxData);
            
            if (data.length >= 73) {
              // New contract format: client_addr(32) + freelancer_addr(32) + amount(8) + status(1) + task_desc(variable)
              const clientAddr = algosdk.encodeAddress(data.slice(0, 32));
              return {
                exists: true,
                clientAddress: clientAddr,
                dataLength: data.length
              };
            } else if (data.length >= 32) {
              // Old contract format might be different - at least has client address
              const clientAddr = algosdk.encodeAddress(data.slice(0, 32));
              return {
                exists: true,
                clientAddress: clientAddr,
                dataLength: data.length
              };
            } else if (data.length > 0) {
              // Box exists but data is incomplete/corrupted
              return {
                exists: true,
                clientAddress: null,
                dataLength: data.length,
                warning: 'Box data is too short or corrupted'
              };
            } else {
              // Box exists but is empty
              return {
                exists: true,
                clientAddress: null,
                dataLength: 0,
                warning: 'Box exists but is empty'
              };
            }
          } catch (parseError) {
            // Box exists but can't parse - might be corrupted or different format
            return {
              exists: true,
              clientAddress: null,
              dataLength: 0,
              warning: `Box exists but could not parse data: ${parseError.message}`
            };
          }
        } else {
          // Box exists in indexer but has no value property
          return {
            exists: true,
            clientAddress: null,
            dataLength: 0,
            warning: 'Box exists but value is missing'
          };
        }
      }
      
      return { exists: false };
    } catch (indexerError) {
      // If indexer fails, try algod
      if (indexerError.status === 404 || indexerError.message?.includes('box not found')) {
        return { exists: false };
      }
      
      // Try algod as fallback
      try {
        const boxValue = await algodClient.getApplicationBoxByName(
          appId,
          boxNameBase64
        ).do();
        
        if (boxValue) {
          if (boxValue.value) {
            try {
              const boxData = Buffer.from(boxValue.value, 'base64');
              const data = new Uint8Array(boxData);
              
              if (data.length >= 32) {
                const clientAddr = algosdk.encodeAddress(data.slice(0, 32));
                return {
                  exists: true,
                  clientAddress: clientAddr,
                  dataLength: data.length
                };
              } else if (data.length > 0) {
                return {
                  exists: true,
                  clientAddress: null,
                  dataLength: data.length,
                  warning: 'Box data is too short'
                };
              } else {
                return {
                  exists: true,
                  clientAddress: null,
                  dataLength: 0,
                  warning: 'Box exists but is empty'
                };
              }
            } catch (parseError) {
              return {
                exists: true,
                clientAddress: null,
                dataLength: 0,
                warning: `Could not parse box data: ${parseError.message}`
              };
            }
          } else {
            return {
              exists: true,
              clientAddress: null,
              dataLength: 0,
              warning: 'Box exists but value is missing'
            };
          }
        }
        return { exists: false };
      } catch (algodError) {
        if (algodError.status === 404 || algodError.message?.includes('box not found') || 
            algodError.message?.includes('does not exist')) {
          return { exists: false };
        }
        // Other error - log and return false
        console.warn(`⚠️  Error checking box on app ${appId} for bounty ${bountyId}:`, algodError.message);
        return { exists: false, error: algodError.message };
      }
    }
  } catch (error) {
    console.warn(`⚠️  Error checking box on app ${appId} for bounty ${bountyId}:`, error.message);
    return { exists: false, error: error.message };
  }
}

/**
 * Identify which contract a bounty belongs to
 */
async function identifyBountyContract(bounty) {
  const contractId = bounty.contract_id || bounty.contractId;
  
  if (!contractId && contractId !== 0) {
    return {
      bountyId: bounty.id,
      contractId: null,
      status: 'NO_CONTRACT_ID',
      message: 'Bounty does not have a contract ID'
    };
  }
  
  const numericContractId = typeof contractId === 'string' ? parseInt(contractId, 10) : contractId;
  if (isNaN(numericContractId)) {
    return {
      bountyId: bounty.id,
      contractId: contractId,
      status: 'INVALID_CONTRACT_ID',
      message: 'Contract ID is not a valid number'
    };
  }
  
  console.log(`\n🔍 Checking bounty ${bounty.id} (contract_id: ${numericContractId})...`);
  
  // Check both contracts
  const [oldContractCheck, newContractCheck] = await Promise.all([
    checkBoxExists(OLD_CONTRACT_APP_ID, numericContractId),
    checkBoxExists(NEW_CONTRACT_APP_ID, numericContractId)
  ]);
  
  const dbClientAddr = (bounty.client_address || bounty.clientAddress || '').toUpperCase().trim();
  
  // Determine which contract the bounty belongs to
  let result = {
    bountyId: bounty.id,
    contractId: numericContractId,
    dbClientAddress: dbClientAddr,
    dbAmount: bounty.amount,
    dbStatus: bounty.status,
    oldContract: {
      appId: OLD_CONTRACT_APP_ID,
      exists: oldContractCheck.exists,
      clientAddress: oldContractCheck.clientAddress,
      matches: oldContractCheck.clientAddress && oldContractCheck.clientAddress.toUpperCase().trim() === dbClientAddr
    },
    newContract: {
      appId: NEW_CONTRACT_APP_ID,
      exists: newContractCheck.exists,
      clientAddress: newContractCheck.clientAddress,
      matches: newContractCheck.clientAddress && newContractCheck.clientAddress.toUpperCase().trim() === dbClientAddr
    }
  };
  
  // Determine status
  if (oldContractCheck.exists && oldContractCheck.clientAddress && 
      oldContractCheck.clientAddress.toUpperCase().trim() === dbClientAddr) {
    result.status = 'ON_OLD_CONTRACT';
    result.message = `Bounty exists on OLD contract (${OLD_CONTRACT_APP_ID})`;
    result.contractLocation = OLD_CONTRACT_APP_ID;
  } else if (newContractCheck.exists && newContractCheck.clientAddress && 
             newContractCheck.clientAddress.toUpperCase().trim() === dbClientAddr) {
    result.status = 'ON_NEW_CONTRACT';
    result.message = `Bounty exists on NEW contract (${NEW_CONTRACT_APP_ID})`;
    result.contractLocation = NEW_CONTRACT_APP_ID;
  } else if (oldContractCheck.exists || newContractCheck.exists) {
    result.status = 'MISMATCH';
    result.message = 'Box exists but client address does not match database';
    result.contractLocation = oldContractCheck.exists ? OLD_CONTRACT_APP_ID : NEW_CONTRACT_APP_ID;
  } else {
    result.status = 'NOT_FOUND';
    result.message = 'Box does not exist on either contract';
    result.contractLocation = null;
  }
  
  return result;
}

/**
 * Main migration function
 */
async function identifyContracts() {
  try {
    console.log('🚀 Starting contract identification script...\n');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected\n');
    
    // Fetch all bounties
    console.log('📥 Fetching all bounties from database...');
    const allBounties = await Bounty.find({}, { limit: 1000 });
    console.log(`✅ Found ${allBounties.length} bounties in database\n`);
    
    if (allBounties.length === 0) {
      console.log('ℹ️  No bounties found in database. Nothing to migrate.');
      return;
    }
    
    // Identify contracts for each bounty
    const results = [];
    const summary = {
      total: allBounties.length,
      onOldContract: 0,
      onNewContract: 0,
      noContractId: 0,
      notFound: 0,
      mismatch: 0,
      invalidContractId: 0
    };
    
    for (let i = 0; i < allBounties.length; i++) {
      const bounty = allBounties[i];
      console.log(`\n[${i + 1}/${allBounties.length}] Processing bounty: ${bounty.id}`);
      
      const result = await identifyBountyContract(bounty);
      results.push(result);
      
      // Update summary
      switch (result.status) {
        case 'ON_OLD_CONTRACT':
          summary.onOldContract++;
          break;
        case 'ON_NEW_CONTRACT':
          summary.onNewContract++;
          break;
        case 'NO_CONTRACT_ID':
          summary.noContractId++;
          break;
        case 'NOT_FOUND':
          summary.notFound++;
          break;
        case 'MISMATCH':
          summary.mismatch++;
          break;
        case 'INVALID_CONTRACT_ID':
          summary.invalidContractId++;
          break;
      }
      
      // Small delay to avoid rate limiting
      if (i < allBounties.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total bounties: ${summary.total}`);
    console.log(`✅ On NEW contract (${NEW_CONTRACT_APP_ID}): ${summary.onNewContract}`);
    console.log(`⚠️  On OLD contract (${OLD_CONTRACT_APP_ID}): ${summary.onOldContract}`);
    console.log(`❌ No contract ID: ${summary.noContractId}`);
    console.log(`❌ Not found on either contract: ${summary.notFound}`);
    console.log(`⚠️  Mismatch (address doesn't match): ${summary.mismatch}`);
    console.log(`❌ Invalid contract ID: ${summary.invalidContractId}`);
    console.log('='.repeat(80) + '\n');
    
    // Print detailed results
    console.log('\n📋 DETAILED RESULTS\n');
    
    // Group by status
    const onOldContract = results.filter(r => r.status === 'ON_OLD_CONTRACT');
    const onNewContract = results.filter(r => r.status === 'ON_NEW_CONTRACT');
    const notFound = results.filter(r => r.status === 'NOT_FOUND');
    const mismatch = results.filter(r => r.status === 'MISMATCH');
    const noContractId = results.filter(r => r.status === 'NO_CONTRACT_ID');
    const invalidContractId = results.filter(r => r.status === 'INVALID_CONTRACT_ID');
    
    if (onOldContract.length > 0) {
      console.log(`\n⚠️  BOUNTIES ON OLD CONTRACT (${OLD_CONTRACT_APP_ID}) - Need Migration:\n`);
      onOldContract.forEach(r => {
        console.log(`  - Bounty ID: ${r.bountyId}`);
        console.log(`    Contract ID: ${r.contractId}`);
        console.log(`    Client: ${r.dbClientAddress}`);
        console.log(`    Amount: ${r.dbAmount} ALGO`);
        console.log(`    Status: ${r.dbStatus}`);
        console.log(`    Location: OLD contract (${OLD_CONTRACT_APP_ID})`);
        console.log('');
      });
    }
    
    if (onNewContract.length > 0) {
      console.log(`\n✅ BOUNTIES ON NEW CONTRACT (${NEW_CONTRACT_APP_ID}) - Ready to Use:\n`);
      onNewContract.forEach(r => {
        console.log(`  - Bounty ID: ${r.bountyId}`);
        console.log(`    Contract ID: ${r.contractId}`);
        console.log(`    Client: ${r.dbClientAddress}`);
        console.log(`    Amount: ${r.dbAmount} ALGO`);
        console.log(`    Status: ${r.dbStatus}`);
        console.log(`    Location: NEW contract (${NEW_CONTRACT_APP_ID})`);
        console.log('');
      });
    }
    
    if (notFound.length > 0) {
      console.log(`\n❌ BOUNTIES NOT FOUND ON EITHER CONTRACT:\n`);
      notFound.forEach(r => {
        console.log(`  - Bounty ID: ${r.bountyId}`);
        console.log(`    Contract ID: ${r.contractId}`);
        console.log(`    Client: ${r.dbClientAddress}`);
        console.log(`    Message: ${r.message}`);
        console.log('');
      });
    }
    
    if (mismatch.length > 0) {
      console.log(`\n⚠️  BOUNTIES WITH MISMATCHED ADDRESSES:\n`);
      mismatch.forEach(r => {
        console.log(`  - Bounty ID: ${r.bountyId}`);
        console.log(`    Contract ID: ${r.contractId}`);
        console.log(`    DB Client: ${r.dbClientAddress}`);
        console.log(`    Old Contract Client: ${r.oldContract.clientAddress || 'N/A'}`);
        console.log(`    New Contract Client: ${r.newContract.clientAddress || 'N/A'}`);
        console.log(`    Location: ${r.contractLocation ? `Contract ${r.contractLocation}` : 'Unknown'}`);
        console.log('');
      });
    }
    
    if (noContractId.length > 0) {
      console.log(`\n❌ BOUNTIES WITHOUT CONTRACT ID:\n`);
      noContractId.forEach(r => {
        console.log(`  - Bounty ID: ${r.bountyId}`);
        console.log(`    Client: ${r.dbClientAddress || 'N/A'}`);
        console.log(`    Amount: ${r.dbAmount} ALGO`);
        console.log(`    Message: ${r.message}`);
        console.log('');
      });
    }
    
    if (invalidContractId.length > 0) {
      console.log(`\n❌ BOUNTIES WITH INVALID CONTRACT ID:\n`);
      invalidContractId.forEach(r => {
        console.log(`  - Bounty ID: ${r.bountyId}`);
        console.log(`    Contract ID: ${r.contractId} (invalid)`);
        console.log(`    Message: ${r.message}`);
        console.log('');
      });
    }
    
    // Recommendations
    console.log('\n' + '='.repeat(80));
    console.log('💡 RECOMMENDATIONS');
    console.log('='.repeat(80));
    
    if (onOldContract.length > 0) {
      console.log(`\n⚠️  ACTION REQUIRED: ${onOldContract.length} bounties are on the OLD contract.`);
      console.log('   These bounties will NOT work with the new frontend/backend code.');
      console.log('   Options:');
      console.log('   1. Create new bounties on the new contract (recommended)');
      console.log('   2. Keep using old contract for these bounties (requires code changes)');
      console.log('   3. Manually migrate bounties (complex, may require contract interaction)\n');
    }
    
    if (onNewContract.length > 0) {
      console.log(`\n✅ ${onNewContract.length} bounties are on the NEW contract and ready to use!\n`);
    }
    
    if (notFound.length > 0) {
      console.log(`\n⚠️  ${notFound.length} bounties were not found on either contract.`);
      console.log('   These may have been created but the box was not created properly.');
      console.log('   You may need to recreate these bounties.\n');
    }
    
    // Save results to JSON file
    const fs = require('fs');
    const path = require('path');
    const resultsPath = path.join(__dirname, 'migration-results.json');
    const reportData = {
      timestamp: new Date().toISOString(),
      summary,
      results,
      contracts: {
        old: { appId: OLD_CONTRACT_APP_ID },
        new: { appId: NEW_CONTRACT_APP_ID }
      }
    };
    
    fs.writeFileSync(resultsPath, JSON.stringify(reportData, null, 2));
    console.log(`\n💾 Detailed results saved to: ${resultsPath}`);
    
    console.log('\n✅ Migration identification complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error during migration identification:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  identifyContracts()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { identifyContracts, identifyBountyContract, checkBoxExists };

