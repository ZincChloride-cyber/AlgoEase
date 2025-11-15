// Quick test script to read bounty box directly from blockchain
// Run this in browser console on the bounty detail page

async function testReadBountyBox(bountyId) {
  console.log(`\n🔍 Testing box read for bounty ID: ${bountyId}\n`);
  
  try {
    // Get contract utils instance
    const contractUtils = window.contractUtils || (await import('./contractUtils.js')).default;
    
    // Read the box
    console.log('📦 Reading bounty box...');
    const bountyData = await contractUtils.getBountyFromBox(bountyId);
    
    if (!bountyData) {
      console.error('❌ Box read returned null - box may not exist');
      console.log('\n💡 Possible reasons:');
      console.log('  1. Bounty ID is incorrect');
      console.log('  2. Box was never created (bounty creation failed)');
      console.log('  3. Box was deleted');
      return null;
    }
    
    console.log('\n✅ Successfully read bounty box!');
    console.log('\n📊 Bounty Data:');
    console.log('  Bounty ID:', bountyData.bountyId);
    console.log('  Client:', bountyData.clientAddress);
    console.log('  Freelancer:', bountyData.freelancerAddress || '(not accepted yet)');
    console.log('  Verifier:', bountyData.verifierAddress);
    console.log('  Amount:', bountyData.amount, 'ALGO');
    console.log('  Deadline:', bountyData.deadline);
    console.log('  Status:', bountyData.status);
    console.log('  Description:', bountyData.taskDescription);
    
    // Check status
    const statusMap = {
      0: 'Open',
      1: 'Accepted',
      2: 'Completed (Approved)',
      3: 'Claimed',
      4: 'Refunded',
      5: 'Rejected'
    };
    console.log('\n📝 Status interpretation:', statusMap[bountyData.status] || 'Unknown');
    
    // Check if freelancer is assigned
    if (bountyData.freelancerAddress) {
      console.log('\n✅ Bounty HAS been accepted by freelancer:', bountyData.freelancerAddress);
      console.log('   This bounty CAN be approved');
    } else {
      console.log('\n⚠️ Bounty has NOT been accepted yet');
      console.log('   This bounty CANNOT be approved until a freelancer accepts it');
    }
    
    return bountyData;
  } catch (error) {
    console.error('\n❌ Error reading bounty box:', error);
    console.error('   Message:', error.message);
    console.error('   Status:', error.status);
    
    if (error.status === 404) {
      console.log('\n💡 Box not found (404). This means:');
      console.log('  • The bounty with this ID does not exist in the smart contract');
      console.log('  • Double-check the bounty ID is correct');
    }
    
    return null;
  }
}

// Instructions
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║  Bounty Box Reader - Debug Utility                             ║');
console.log('╠════════════════════════════════════════════════════════════════╣');
console.log('║  Usage: testReadBountyBox(bountyId)                            ║');
console.log('║  Example: testReadBountyBox(0)                                 ║');
console.log('║                                                                 ║');
console.log('║  This will show you what data is stored in the blockchain      ║');
console.log('║  for the specified bounty ID.                                  ║');
console.log('╚════════════════════════════════════════════════════════════════╝');

// Export for use
window.testReadBountyBox = testReadBountyBox;

// If there's a bountyId in the URL, auto-run
const urlParams = new URLSearchParams(window.location.search);
const bountyIdFromUrl = urlParams.get('bountyId') || new URLSearchParams(window.location.pathname).get('id');
if (bountyIdFromUrl) {
  console.log(`\n🎯 Detected bounty ID in URL: ${bountyIdFromUrl}`);
  console.log('💡 To test this bounty, run: testReadBountyBox(${bountyIdFromUrl})\n');
}
