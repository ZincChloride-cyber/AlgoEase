/**
 * Script to create a demo bounty in Supabase database
 * This will help test if bounties are displaying correctly
 */

// Run this from the backend directory: cd backend && node ../scripts/create-demo-bounty.js
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Demo bounty data - using the wallet address from the user's screenshot
const demoBounty = {
  contract_id: '749540140-0', // App ID + bounty ID
  client_address: '3AU6XYBNSEW7DRXJVNTGDAZLUYL54CTW3BUYKTBN6LX76KJ3EAVIQLPEBI',
  freelancer_address: null, // Not accepted yet
  verifier_address: '3AU6XYBNSEW7DRXJVNTGDAZLUYL54CTW3BUYKTBN6LX76KJ3EAVIQLPEBI',
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
  submissions: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

async function createDemoBounty() {
  try {
    console.log('📦 Creating demo bounty...');
    console.log('📋 Bounty data:', JSON.stringify(demoBounty, null, 2));
    
    const { data, error } = await supabase
      .from('bounties')
      .insert(demoBounty)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating demo bounty:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      process.exit(1);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ DEMO BOUNTY CREATED SUCCESSFULLY!');
    console.log('='.repeat(80));
    console.log('📋 Bounty ID:', data.id);
    console.log('📝 Title:', data.title);
    console.log('💰 Amount:', data.amount, 'ALGO');
    console.log('👤 Client:', data.client_address);
    console.log('📅 Deadline:', data.deadline);
    console.log('📊 Status:', data.status);
    console.log('='.repeat(80));
    console.log('\n💡 Now refresh your "My Bounties" page to see this demo bounty!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

createDemoBounty();

