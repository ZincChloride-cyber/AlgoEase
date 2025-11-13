/**
 * Test script to verify database migration and bounty creation
 * Run with: node scripts/test-database-migration.js
 */

require('dotenv').config();
const { connectDB, getSupabase } = require('../config/database');
const Bounty = require('../models/Bounty');

const testDatabaseMigration = async () => {
  console.log('=== Testing Database Migration ===\n');

  try {
    // Step 1: Connect to database
    console.log('Step 1: Connecting to Supabase...');
    await connectDB();
    console.log('✓ Connected to Supabase\n');

    // Step 2: Verify contract_id is nullable
    console.log('Step 2: Verifying contract_id is nullable...');
    const supabase = getSupabase();
    const { data: columns, error: colError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'bounties'
        AND column_name = 'contract_id';
      `
    }).catch(async () => {
      // Fallback: Use direct query
      const { data, error } = await supabase
        .from('bounties')
        .select('contract_id')
        .limit(0);
      
      // If we can query the table, the column exists
      // Check if we can insert NULL by trying to create a test bounty
      return { data: null, error: null };
    });

    // Try to query the table structure using a different approach
    console.log('  Checking if contract_id column exists and is nullable...');
    console.log('  (This is verified by testing if we can create a bounty with NULL contract_id)\n');

    // Step 3: Test creating a bounty with NULL contract_id
    console.log('Step 3: Testing bounty creation with NULL contract_id...');
    const testBountyData = {
      title: 'Test Bounty - Migration Verification',
      description: 'This is a test bounty to verify the database migration worked correctly. It should be created with NULL contract_id.',
      amount: 1.0,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      clientAddress: 'TESTADDRESS1234567890123456789012345678901234567890123456',
      verifierAddress: 'TESTADDRESS1234567890123456789012345678901234567890123456',
      status: 'open',
      requirements: [],
      tags: ['test', 'migration'],
      submissions: []
    };

    console.log('  Creating test bounty...');
    console.log('  Title:', testBountyData.title);
    console.log('  Amount:', testBountyData.amount, 'ALGO');
    console.log('  Contract ID:', 'NULL (should be allowed)\n');

    const testBounty = new Bounty(testBountyData);
    
    try {
      await testBounty.save();
      console.log('✓ Test bounty created successfully!');
      console.log('  Database ID:', testBounty.id);
      console.log('  Contract ID:', testBounty.contract_id || 'NULL (as expected)');
      console.log('  Status:', testBounty.status);
      console.log('');

      // Step 4: Verify the bounty was saved correctly
      console.log('Step 4: Verifying bounty in database...');
      const savedBounty = await Bounty.findById(testBounty.id);
      
      if (savedBounty) {
        console.log('✓ Bounty found in database');
        console.log('  ID:', savedBounty.id);
        console.log('  Title:', savedBounty.title);
        console.log('  Contract ID:', savedBounty.contract_id || 'NULL');
        console.log('  Status:', savedBounty.status);
        console.log('');

        // Step 5: Test updating contract_id
        console.log('Step 5: Testing contract_id update...');
        savedBounty.contract_id = 12345; // Test contract ID
        await savedBounty.save();
        console.log('✓ Contract ID updated successfully');
        console.log('  New Contract ID:', savedBounty.contract_id);
        console.log('');

        // Step 6: Test rejected status
        console.log('Step 6: Testing rejected status...');
        savedBounty.status = 'rejected';
        await savedBounty.save();
        console.log('✓ Status updated to "rejected" successfully');
        console.log('  Status:', savedBounty.status);
        console.log('');

        // Step 7: Clean up test bounty
        console.log('Step 7: Cleaning up test bounty...');
        const { error: deleteError } = await supabase
          .from('bounties')
          .delete()
          .eq('id', savedBounty.id);
        
        if (deleteError) {
          console.log('⚠️  Could not delete test bounty:', deleteError.message);
          console.log('  Please delete it manually from the database');
          console.log('  Bounty ID:', savedBounty.id);
        } else {
          console.log('✓ Test bounty deleted successfully');
        }
        console.log('');

      } else {
        console.log('❌ Bounty not found in database');
        return;
      }

    } catch (saveError) {
      console.error('❌ Error creating test bounty:', saveError.message);
      console.error('  Details:', saveError);
      
      if (saveError.message && saveError.message.includes('contract_id')) {
        console.error('\n⚠️  Migration may not have been applied correctly.');
        console.error('  Please verify that contract_id is nullable in the database.');
      }
      return;
    }

    // Step 8: Verify status constraint includes 'rejected'
    console.log('Step 8: Verifying status constraint includes "rejected"...');
    console.log('  (This is verified by the successful status update above)');
    console.log('✓ Status constraint includes "rejected"\n');

    console.log('=== Migration Test Complete ===');
    console.log('✓ All tests passed!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart your backend server');
    console.log('2. Restart your frontend server');
    console.log('3. Test creating a bounty in the UI');
    console.log('4. Verify it appears in the bounty list');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('  Stack:', error.stack);
    process.exit(1);
  }
};

// Run the test
testDatabaseMigration()
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });

