/**
 * Script to create a demo bounty in Supabase database
 * Run: node scripts/create-demo-bounty.js
 */

require('dotenv').config();
const Bounty = require('../models/Bounty');
const { connectDB } = require('../config/database');

// Demo bounty data - using the wallet address from the user's screenshot
const demoBountyData = {
  contractId: '0', // Bounty ID (0 for first bounty)
  clientAddress: '3AU6XYBNSEW7DRXJVNTGDAZLUYL54CTW3BUYKTBN6LX76KJ3EAVIQLPEBI',
  freelancerAddress: null, // Not accepted yet
  verifierAddress: '3AU6XYBNSEW7DRXJVNTGDAZLUYL54CTW3BUYKTBN6LX76KJ3EAVIQLPEBI',
  amount: 10.5, // 10.5 ALGO
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  status: 'open',
  title: 'Demo Bounty: Build a React Component',
  description: 'This is a demo bounty created to test the AlgoEase platform. Create a beautiful React component with animations and responsive design. The component should include:\n\n- Smooth animations\n- Responsive layout\n- Modern UI design\n- Accessibility features\n\nSubmit your work with a GitHub link and a live demo URL.',
  requirements: [
    'React component with TypeScript',
    'Responsive design for mobile and desktop',
    'Smooth animations',
    'Accessibility compliance'
  ],
  tags: ['react', 'typescript', 'ui', 'demo'],
  submissions: []
};

async function createDemoBounty() {
  try {
    console.log('🔌 Connecting to database...');
    await connectDB();
    
    console.log('📦 Creating demo bounty...');
    console.log('📋 Bounty data:', JSON.stringify(demoBountyData, null, 2));
    
    const bounty = new Bounty(demoBountyData);
    await bounty.save();

    const bountyObj = bounty.toObject ? bounty.toObject() : bounty;
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ DEMO BOUNTY CREATED SUCCESSFULLY!');
    console.log('='.repeat(80));
    console.log('📋 Bounty ID:', bountyObj.id);
    console.log('📝 Title:', bountyObj.title);
    console.log('💰 Amount:', bountyObj.amount, 'ALGO');
    console.log('👤 Client:', bountyObj.clientAddress);
    console.log('📅 Deadline:', bountyObj.deadline);
    console.log('📊 Status:', bountyObj.status);
    console.log('='.repeat(80));
    console.log('\n💡 Now refresh your "My Bounties" page to see this demo bounty!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating demo bounty:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack
    });
    process.exit(1);
  }
}

createDemoBounty();

