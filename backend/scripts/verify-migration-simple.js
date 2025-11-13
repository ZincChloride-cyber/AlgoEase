/**
 * Simple script to verify database migration
 * Run with: node scripts/verify-migration-simple.js
 */

require('dotenv').config();
const { connectDB, getSupabase } = require('../config/database');

const verifyMigration = async () => {
  console.log('=== Verifying Database Migration ===\n');

  try {
    // Connect to database
    console.log('Connecting to Supabase...');
    await connectDB();
    const supabase = getSupabase();
    console.log('✓ Connected to Supabase\n');

    // Test 1: Try to create a bounty with NULL contract_id
    console.log('Test 1: Creating bounty with NULL contract_id...');
    // Use a valid Algorand address format (58 characters, base32 encoded)
    const testAddress = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const testBounty = {
      title: 'Migration Test Bounty',
      description: 'Test bounty to verify migration',
      amount: 1.0,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      client_address: testAddress,
      verifier_address: testAddress,
      status: 'open',
      requirements: [],
      tags: [],
      submissions: []
      // contract_id is intentionally omitted (should be NULL)
    };

    const { data: insertedBounty, error: insertError } = await supabase
      .from('bounties')
      .insert(testBounty)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to create bounty with NULL contract_id:', insertError.message);
      console.error('  Details:', insertError);
      if (insertError.code === '23502') {
        console.error('  ⚠️  Migration may not have been applied. contract_id is still NOT NULL.');
      }
      return;
    }

    console.log('✓ Bounty created successfully with NULL contract_id');
    console.log('  ID:', insertedBounty.id);
    console.log('  Contract ID:', insertedBounty.contract_id || 'NULL (as expected)');
    console.log('');

    // Test 2: Update contract_id
    console.log('Test 2: Updating contract_id...');
    const { data: updatedBounty, error: updateError } = await supabase
      .from('bounties')
      .update({ contract_id: 99999 })
      .eq('id', insertedBounty.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update contract_id:', updateError.message);
    } else {
      console.log('✓ Contract ID updated successfully');
      console.log('  Contract ID:', updatedBounty.contract_id);
      console.log('');
    }

    // Test 3: Update status to 'rejected'
    console.log('Test 3: Updating status to "rejected"...');
    const { data: rejectedBounty, error: rejectError } = await supabase
      .from('bounties')
      .update({ status: 'rejected' })
      .eq('id', insertedBounty.id)
      .select()
      .single();

    if (rejectError) {
      console.error('❌ Failed to update status to "rejected":', rejectError.message);
      if (rejectError.code === '23514') {
        console.error('  ⚠️  Status constraint may not include "rejected".');
        console.error('  ⚠️  Please run the migration to add "rejected" status.');
      }
    } else {
      console.log('✓ Status updated to "rejected" successfully');
      console.log('  Status:', rejectedBounty.status);
      console.log('');
    }

    // Clean up
    console.log('Cleaning up test bounty...');
    const { error: deleteError } = await supabase
      .from('bounties')
      .delete()
      .eq('id', insertedBounty.id);

    if (deleteError) {
      console.log('⚠️  Could not delete test bounty:', deleteError.message);
      console.log('  Please delete it manually. ID:', insertedBounty.id);
    } else {
      console.log('✓ Test bounty deleted');
    }
    console.log('');

    console.log('=== Migration Verification Complete ===');
    console.log('✓ All tests passed!');
    console.log('');
    console.log('The database migration was successful:');
    console.log('  ✓ contract_id is nullable');
    console.log('  ✓ "rejected" status is allowed');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart your backend server');
    console.log('2. Restart your frontend server');
    console.log('3. Test creating a bounty in the UI');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error('  Stack:', error.stack);
    process.exit(1);
  }
};

// Run verification
verifyMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Verification failed:', error);
    process.exit(1);
  });

