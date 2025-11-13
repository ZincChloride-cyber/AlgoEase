/**
 * Test script to verify API bounty creation
 * Run with: node scripts/test-api-bounty-creation.js
 * 
 * This script tests the backend API endpoints for bounty creation
 */

require('dotenv').config();
const fetch = require('node-fetch');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const TEST_ADDRESS = 'TESTADDRESS1234567890123456789012345678901234567890123456';

const testAPIBountyCreation = async () => {
  console.log('=== Testing API Bounty Creation ===\n');

  try {
    // Step 1: Test health endpoint
    console.log('Step 1: Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.statusText}`);
    }
    const healthData = await healthResponse.json();
    console.log('✓ Backend server is running');
    console.log('  Status:', healthData.status);
    console.log('');

    // Step 2: Test creating a bounty (without authentication for now)
    console.log('Step 2: Testing bounty creation via API...');
    const bountyData = {
      title: 'API Test Bounty',
      description: 'This is a test bounty created via the API to verify the database integration works correctly.',
      amount: 2.5,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      verifierAddress: TEST_ADDRESS,
      requirements: ['Complete the task', 'Submit before deadline'],
      tags: ['test', 'api']
    };

    console.log('  Creating bounty via POST /api/bounties');
    console.log('  Title:', bountyData.title);
    console.log('  Amount:', bountyData.amount, 'ALGO');
    console.log('');

    // Note: This will fail if authentication is required
    // In a real scenario, you would need to authenticate first
    const createResponse = await fetch(`${API_BASE_URL}/bounties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_ADDRESS}` // Using address as token for testing
      },
      body: JSON.stringify(bountyData)
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}));
      console.log('⚠️  Bounty creation response:', createResponse.status, createResponse.statusText);
      console.log('  Error:', errorData.error || errorData.message || 'Unknown error');
      console.log('');
      
      if (createResponse.status === 401 || createResponse.status === 403) {
        console.log('  Note: Authentication may be required. Check your auth middleware.');
      }
      
      if (createResponse.status === 400) {
        console.log('  Note: Validation error. Check the request data.');
      }
    } else {
      const createdBounty = await createResponse.json();
      console.log('✓ Bounty created successfully via API');
      console.log('  Database ID:', createdBounty.id);
      console.log('  Contract ID:', createdBounty.contractId || 'NULL (will be set after contract creation)');
      console.log('  Status:', createdBounty.status);
      console.log('');

      // Step 3: Test fetching all bounties
      console.log('Step 3: Testing fetch all bounties...');
      const fetchResponse = await fetch(`${API_BASE_URL}/bounties`);
      if (fetchResponse.ok) {
        const fetchData = await fetchResponse.json();
        const bounties = fetchData.bounties || fetchData;
        console.log('✓ Bounties fetched successfully');
        console.log('  Total bounties:', Array.isArray(bounties) ? bounties.length : 'Unknown');
        if (Array.isArray(bounties) && bounties.length > 0) {
          console.log('  First bounty:', bounties[0].title);
          console.log('  First bounty ID:', bounties[0].id);
        }
        console.log('');
      } else {
        console.log('⚠️  Failed to fetch bounties:', fetchResponse.statusText);
        console.log('');
      }

      // Step 4: Test fetching single bounty
      if (createdBounty.id) {
        console.log('Step 4: Testing fetch single bounty...');
        const singleResponse = await fetch(`${API_BASE_URL}/bounties/${createdBounty.id}`);
        if (singleResponse.ok) {
          const singleBounty = await singleResponse.json();
          console.log('✓ Single bounty fetched successfully');
          console.log('  ID:', singleBounty.id);
          console.log('  Title:', singleBounty.title);
          console.log('');
        } else {
          console.log('⚠️  Failed to fetch single bounty:', singleResponse.statusText);
          console.log('');
        }
      }
    }

    console.log('=== API Test Complete ===');
    console.log('');
    console.log('Next steps:');
    console.log('1. Test creating a bounty in the frontend UI');
    console.log('2. Verify it appears in the bounty list');
    console.log('3. Test accepting, approving, and rejecting bounties');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('  Backend server is not running. Please start it first:');
      console.error('  cd backend && npm run dev');
    }
    console.error('  Stack:', error.stack);
    process.exit(1);
  }
};

// Run the test
testAPIBountyCreation()
  .then(() => {
    console.log('Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });

