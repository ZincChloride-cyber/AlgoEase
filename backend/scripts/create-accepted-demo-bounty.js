/**
 * Script to create a demo bounty that's been accepted (for Contributor view testing)
 * Run: node scripts/create-accepted-demo-bounty.js
 */

require('dotenv').config();
const Bounty = require('../models/Bounty');
const { connectDB } = require('../config/database');

// Demo bounty data - accepted by the user
const demoBountyData = {
  contractId: '1', // Bounty ID
  clientAddress: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ', // Different client (not the user)
  freelancerAddress: '3AU6XYBNSEW7DRXJVNTGDAZLUYL54CTW3BUYKTBN6LX76KJ3EAVIQLPEBI', // User is the freelancer
  verifierAddress: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ',
  amount: 15.0, // 15 ALGO
  deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
  status: 'accepted', // Already accepted
  title: 'Demo Accepted Bounty: Frontend Development',
  description: 'This is a demo bounty that has been accepted. Build a responsive dashboard component with the following features:\n\n- Real-time data visualization\n- Interactive charts and graphs\n- Dark mode support\n- Mobile-first design\n\nThis bounty is already accepted and in progress.',
  requirements: [
    'React/Next.js application',
    'Responsive dashboard layout',
    'Chart.js or similar for visualizations',
    'Dark mode toggle'
  ],
  tags: ['react', 'dashboard', 'accepted', 'demo'],
  submissions: []
};

async function createAcceptedDemoBounty() {
  try {
    console.log('🔌 Connecting to database...');
    await connectDB();
    
    console.log('📦 Creating accepted demo bounty...');
    console.log('📋 Bounty data:', JSON.stringify(demoBountyData, null, 2));
    
    const bounty = new Bounty(demoBountyData);
    await bounty.save();

    const bountyObj = bounty.toObject ? bounty.toObject() : bounty;
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ ACCEPTED DEMO BOUNTY CREATED SUCCESSFULLY!');
    console.log('='.repeat(80));
    console.log('📋 Bounty ID:', bountyObj.id);
    console.log('📝 Title:', bountyObj.title);
    console.log('💰 Amount:', bountyObj.amount, 'ALGO');
    console.log('👤 Client:', bountyObj.clientAddress);
    console.log('👨‍💻 Freelancer (You):', bountyObj.freelancerAddress);
    console.log('📅 Deadline:', bountyObj.deadline);
    console.log('📊 Status:', bountyObj.status);
    console.log('='.repeat(80));
    console.log('\n💡 Now check the "Contributor view" tab in My Bounties to see this accepted bounty!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating accepted demo bounty:', error);
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

createAcceptedDemoBounty();

