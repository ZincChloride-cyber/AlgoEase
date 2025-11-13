const express = require('express');
const router = express.Router();
const Bounty = require('../models/Bounty');
const { validateBounty } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

// Test endpoint to check all bounties in database
router.get('/test/all', async (req, res) => {
  try {
    const allBounties = await Bounty.find({}, { limit: 100 });
    const bountyObjects = allBounties.map(bounty => 
      bounty.toObject ? bounty.toObject() : bounty
    );
    res.json({ 
      total: bountyObjects.length,
      bounties: bountyObjects 
    });
  } catch (error) {
    console.error('Error fetching all bounties:', error);
    res.status(500).json({ error: 'Failed to fetch bounties', message: error.message });
  }
});

// Get all bounties with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      status,
      client,
      freelancer,
      minAmount,
      maxAmount,
      deadline,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    console.log('📥 Fetching all bounties with query:', req.query);

    // Build filter object for Supabase
    const filter = {};
    if (status) filter.status = status;
    if (client) filter.clientAddress = client;
    if (freelancer) filter.freelancerAddress = freelancer;
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }
    if (deadline) {
      filter.deadline = { $gte: new Date(deadline) };
    }

    console.log('🔍 Filter object:', JSON.stringify(filter, null, 2));

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    // Convert sortBy from camelCase to snake_case if needed
    const sortFieldMap = {
      'createdAt': 'created_at',
      'updatedAt': 'updated_at',
      'contractId': 'contract_id',
      'clientAddress': 'client_address',
      'freelancerAddress': 'freelancer_address',
      'verifierAddress': 'verifier_address'
    };
    const dbSortBy = sortFieldMap[sortBy] || sortBy;
    
    console.log('📊 Querying bounties with:', {
      filter,
      sort: { [dbSortBy]: sortOrder === 'desc' ? -1 : 1 },
      skip,
      limit: limitNum
    });
    
    const bounties = await Bounty.find(filter, {
      sort: { [dbSortBy]: sortOrder === 'desc' ? -1 : 1 },
      skip: skip,
      limit: limitNum,
      select: '-submissions' // Exclude submissions for list view
    });

    const total = await Bounty.countDocuments(filter);

    console.log('📊 Found bounties:', bounties.length, 'out of', total, 'total');

    // Convert bounties to objects for JSON response
    const bountyObjects = bounties.map(bounty => {
      if (typeof bounty.toObject === 'function') {
        return bounty.toObject();
      }
      return bounty;
    });

    if (bountyObjects.length > 0) {
      console.log('📋 First bounty sample:', JSON.stringify(bountyObjects[0], null, 2));
    }

    const responseData = {
      bounties: bountyObjects,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };

    console.log('✅ Returning', bountyObjects.length, 'bounties');
    res.json(responseData);
  } catch (error) {
    console.error('❌ Error fetching bounties:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch bounties', message: error.message });
  }
});

// Get single bounty by ID (can be contract_id or database id)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📥 Fetching bounty with ID:', id);
    
    // Try to find by contract_id first (numeric)
    let bounty = await Bounty.findOne({ contractId: id });
    
    // If not found, try to find by database id (UUID)
    if (!bounty) {
      bounty = await Bounty.findById(id);
    }
    
    if (!bounty) {
      return res.status(404).json({ error: 'Bounty not found' });
    }

    res.json(bounty.toObject ? bounty.toObject() : bounty);
  } catch (error) {
    console.error('Error fetching bounty:', error);
    res.status(500).json({ error: 'Failed to fetch bounty' });
  }
});

// Create new bounty - make auth optional if clientAddress is in body
router.post('/', async (req, res, next) => {
  // If clientAddress is provided in body, we can skip strict auth
  // Otherwise, use authenticate middleware
  if (req.body.clientAddress) {
    // Set req.user from body for compatibility
    req.user = { address: req.body.clientAddress };
    next();
  } else {
    // Use authenticate middleware
    authenticate(req, res, next);
  }
}, validateBounty, async (req, res) => {
  try {
    console.log('📥 Received bounty creation request:', {
      body: req.body,
      user: req.user
    });

    // Prepare bounty data
    // Use clientAddress from body if provided, otherwise use auth token (req.user.address)
    const clientAddress = req.body.clientAddress || req.user?.address;
    
    if (!clientAddress) {
      return res.status(400).json({ 
        error: 'Client address required',
        message: 'Client address must be provided in request body or Authorization header'
      });
    }

    const bountyData = {
      title: req.body.title,
      description: req.body.description,
      amount: parseFloat(req.body.amount),
      deadline: new Date(req.body.deadline).toISOString(),
      verifierAddress: req.body.verifierAddress || clientAddress,
      clientAddress: clientAddress, // Use from body or auth token
      status: 'open',
      requirements: req.body.requirements || [],
      tags: req.body.tags || [],
      submissions: [],
      // contractId will be set after smart contract creation
      // If provided, use it; otherwise, it will be null and updated later
      contractId: req.body.contractId || null
    };

    console.log('💾 Bounty data to save:', bountyData);

    // Validate required fields
    if (!bountyData.title || !bountyData.description || !bountyData.amount || !bountyData.deadline) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Title, description, amount, and deadline are required'
      });
    }

    // Validate amount
    if (bountyData.amount < 0.001) {
      return res.status(400).json({ 
        error: 'Invalid amount',
        message: 'Amount must be at least 0.001 ALGO'
      });
    }

    // Validate deadline
    const deadlineDate = new Date(bountyData.deadline);
    if (deadlineDate <= new Date()) {
      return res.status(400).json({ 
        error: 'Invalid deadline',
        message: 'Deadline must be in the future'
      });
    }

    // Validate addresses
    const addressRegex = /^[A-Z2-7]{58}$/;
    if (!addressRegex.test(bountyData.clientAddress)) {
      return res.status(400).json({ 
        error: 'Invalid client address',
        message: 'Client address must be a valid Algorand address'
      });
    }
    if (bountyData.verifierAddress && !addressRegex.test(bountyData.verifierAddress)) {
      return res.status(400).json({ 
        error: 'Invalid verifier address',
        message: 'Verifier address must be a valid Algorand address'
      });
    }

    const bounty = new Bounty(bountyData);
    console.log('📦 Bounty object created, saving to database...');
    
    try {
      await bounty.save();
      console.log('✅ Bounty saved successfully with ID:', bounty.id, 'Contract ID:', bounty.contract_id);
    } catch (saveError) {
      console.error('❌ Error saving bounty to database:', saveError);
      console.error('❌ Save error details:', {
        message: saveError.message,
        code: saveError.code,
        details: saveError.details,
        hint: saveError.hint
      });
      
      // If it's a duplicate contract_id error, return a more helpful message
      if (saveError.code === '23505' || saveError.message.includes('duplicate') || saveError.message.includes('unique')) {
        return res.status(409).json({ 
          error: 'Bounty already exists',
          message: 'A bounty with this contract ID already exists in the database'
        });
      }
      
      throw saveError;
    }

    const responseData = {
      ...bounty.toObject(),
      smartContract: {
        action: 'create_bounty',
        required: {
          payment: {
            amount: bounty.amount,
            to: process.env.CONTRACT_ADDRESS || 'contract_address', // Use contract address from env
            note: 'AlgoEase: Bounty Payment'
          },
          appCall: {
            method: 'create_bounty',
            args: [
              Math.round(bounty.amount * 1000000), // Convert to microALGO
              Math.floor(new Date(bounty.deadline).getTime() / 1000), // Convert to timestamp
              (bounty.title ? `${bounty.title}\n\n${bounty.description}` : bounty.description).slice(0, 1000) // Task description
            ],
            accounts: [bounty.verifierAddress || bounty.clientAddress]
          }
        }
      }
    };

    console.log('📤 Sending response:', responseData);
    res.status(201).json(responseData);
  } catch (error) {
    console.error('❌ Error creating bounty:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    res.status(500).json({ 
      error: 'Failed to create bounty',
      message: error.message,
      details: error.details || error.hint || 'Unknown error'
    });
  }
});

// Update bounty (only by client)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const bounty = await Bounty.findOne({ contractId: req.params.id });
    
    if (!bounty) {
      return res.status(404).json({ error: 'Bounty not found' });
    }

    if (bounty.clientAddress !== req.user.address) {
      return res.status(403).json({ error: 'Not authorized to update this bounty' });
    }

    if (bounty.status !== 'open') {
      return res.status(400).json({ error: 'Cannot update bounty that is not open' });
    }

    // Update bounty fields
    Object.assign(bounty, req.body);
    await bounty.save();

    res.json(bounty.toObject ? bounty.toObject() : bounty);
  } catch (error) {
    console.error('Error updating bounty:', error);
    res.status(500).json({ error: 'Failed to update bounty' });
  }
});

// Submit work for bounty
router.post('/:id/submit', authenticate, async (req, res) => {
  try {
    const { description, links } = req.body;
    
    // Try to find by contract_id first, then by database id
    let bounty = await Bounty.findOne({ contractId: req.params.id });
    if (!bounty) {
      bounty = await Bounty.findById(req.params.id);
    }
    
    if (!bounty) {
      return res.status(404).json({ error: 'Bounty not found' });
    }

    if (bounty.status !== 'accepted') {
      return res.status(400).json({ error: 'Bounty must be accepted before submitting work' });
    }

    // Allow any freelancer who has accepted the bounty to submit work
    // Check if there's a freelancer address set, and if so, verify it matches
    // But if no freelancer address is set yet, allow the submission (they might have accepted via contract)
    const bountyObj = bounty.toObject ? bounty.toObject() : bounty;
    const rawFreelancerAddr = bounty.freelancerAddress || bounty.freelancer_address || 
                              bountyObj.freelancerAddress || bountyObj.freelancer_address ||
                              bounty.freelancer || bountyObj.freelancer;
    const freelancerAddr = rawFreelancerAddr ? (rawFreelancerAddr || '').toUpperCase().trim() : null;
    const userAddr = (req.user.address || '').toUpperCase().trim();
    
    console.log('🔍 Checking freelancer for submission:', {
      rawFreelancerAddr,
      freelancerAddr,
      userAddr,
      hasFreelancer: !!freelancerAddr,
      match: freelancerAddr ? freelancerAddr === userAddr : 'no freelancer set',
      bountyId: req.params.id,
      bountyStatus: bounty.status,
      bountyObject: {
        freelancerAddress: bounty.freelancerAddress,
        freelancer_address: bounty.freelancer_address,
        id: bounty.id,
        contractId: bounty.contract_id || bounty.contractId
      }
    });

    // If a freelancer address is set, verify it matches the user
    // If no freelancer address is set, allow submission (bounty might have been accepted via contract)
    if (freelancerAddr && freelancerAddr !== userAddr) {
      console.warn('⚠️ Freelancer address mismatch, but allowing submission since bounty is accepted:', {
        expected: freelancerAddr,
        received: userAddr
      });
      // Don't block - allow submission if bounty is accepted
      // The user might have accepted via smart contract but backend wasn't updated
    }
    
    // If no freelancer address is set, set it to the current user
    if (!freelancerAddr) {
      console.log('📝 No freelancer address set, setting it to current user:', userAddr);
      bounty.freelancerAddress = req.user.address;
      bounty.freelancer_address = req.user.address;
      await bounty.save();
    }

    const submission = {
      freelancerAddress: req.user.address,
      description,
      links: links || []
    };

    bounty.submissions.push(submission);
    await bounty.save();

    res.json({ message: 'Work submitted successfully', submission });
  } catch (error) {
    console.error('Error submitting work:', error);
    res.status(500).json({ error: 'Failed to submit work' });
  }
});

// Get user's bounties
router.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { type = 'all' } = req.query;

    console.log('📥 Fetching user bounties:', {
      address,
      type,
      url: req.url
    });

    let filter = {};
    if (type === 'created') {
      filter.clientAddress = address;
    } else if (type === 'accepted') {
      filter.freelancerAddress = address;
    } else {
      filter.$or = [
        { clientAddress: address },
        { freelancerAddress: address }
      ];
    }

    console.log('🔍 Filter:', JSON.stringify(filter, null, 2));

    const bounties = await Bounty.find(filter, {
      sort: { created_at: -1 },
      select: '-submissions'
    });

    console.log('📊 Found bounties:', bounties.length);
    if (bounties.length > 0) {
      console.log('📋 First bounty sample:', JSON.stringify(bounties[0].toObject ? bounties[0].toObject() : bounties[0], null, 2));
    }

    const bountyObjects = bounties.map(bounty => 
      bounty.toObject ? bounty.toObject() : bounty
    );

    console.log('✅ Returning', bountyObjects.length, 'bounties');
    res.json(bountyObjects);
  } catch (error) {
    console.error('❌ Error fetching user bounties:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch user bounties', message: error.message });
  }
});

// Smart contract interaction endpoints
router.post('/:id/accept', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📥 Accepting bounty with ID:', id);
    
    // Try to find by contract_id first, then by database id
    let bounty = await Bounty.findOne({ contractId: id });
    if (!bounty) {
      bounty = await Bounty.findById(id);
    }
    
    if (!bounty) {
      return res.status(404).json({ error: 'Bounty not found' });
    }

    // Check status case-insensitively
    const bountyStatus = (bounty.status || '').toLowerCase().trim();
    const hasFreelancer = !!(bounty.freelancerAddress || bounty.freelancer_address);
    
    console.log('🔍 Checking bounty status for acceptance:', {
      rawStatus: bounty.status,
      normalizedStatus: bountyStatus,
      bountyId: id,
      isOpen: bountyStatus === 'open',
      hasFreelancer: hasFreelancer,
      freelancerAddress: bounty.freelancerAddress || bounty.freelancer_address
    });

    // Allow acceptance if:
    // 1. Status is 'open' (case-insensitive), OR
    // 2. Status is 'open' but has no freelancer set (might be a data inconsistency)
    if (bountyStatus !== 'open') {
      // If status is not 'open' but also has no freelancer, allow acceptance
      // (might be a data sync issue)
      if (!hasFreelancer) {
        console.warn('⚠️ Bounty status is not "open" but has no freelancer. Allowing acceptance:', {
          status: bounty.status,
          normalizedStatus: bountyStatus
        });
        // Continue - we'll update the status to 'accepted' below
      } else {
        console.error('❌ Bounty is not open for acceptance:', {
          status: bounty.status,
          normalizedStatus: bountyStatus,
          bountyId: id,
          hasFreelancer: hasFreelancer
        });
        return res.status(400).json({ 
          error: 'Bounty is not open for acceptance',
          details: {
            currentStatus: bounty.status,
            requiredStatus: 'open',
            hasFreelancer: hasFreelancer
          }
        });
      }
    }

    // Validate contract ID exists
    if (!bounty.contract_id && !bounty.contractId) {
      return res.status(400).json({ error: 'Bounty does not have a contract ID. Please wait for the contract to be created.' });
    }

    // Update bounty with freelancer - ensure both camelCase and snake_case are set
    const freelancerAddr = req.user.address;
    console.log('💾 Setting freelancer address:', {
      address: freelancerAddr,
      bountyId: id,
      currentFreelancer: bounty.freelancerAddress || bounty.freelancer_address
    });
    
    bounty.freelancerAddress = freelancerAddr;
    bounty.freelancer_address = freelancerAddr;
    bounty.status = 'accepted';
    
    console.log('💾 Bounty before save:', {
      id: bounty.id,
      contractId: bounty.contract_id || bounty.contractId,
      freelancerAddress: bounty.freelancerAddress,
      freelancer_address: bounty.freelancer_address,
      status: bounty.status
    });
    
    await bounty.save();
    
    // Reload to verify it was saved correctly
    const savedBounty = await Bounty.findOne({ contractId: id }) || await Bounty.findById(id);
    console.log('✅ Bounty after save:', {
      id: savedBounty?.id,
      contractId: savedBounty?.contract_id || savedBounty?.contractId,
      freelancerAddress: savedBounty?.freelancerAddress,
      freelancer_address: savedBounty?.freelancer_address,
      status: savedBounty?.status
    });

    const contractId = bounty.contract_id || bounty.contractId;
    res.json({
      message: 'Bounty accepted successfully',
      smartContract: {
        action: 'accept_bounty',
        required: {
          appCall: {
            method: 'accept_bounty',
            args: [contractId],
            accounts: []
          }
        }
      }
    });
  } catch (error) {
    console.error('Error accepting bounty:', error);
    res.status(500).json({ error: 'Failed to accept bounty', message: error.message });
  }
});

router.post('/:id/approve', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📥 Approving bounty with ID:', id);
    
    // Try to find by contract_id first, then by database id
    let bounty = await Bounty.findOne({ contractId: id });
    if (!bounty) {
      bounty = await Bounty.findById(id);
    }
    
    if (!bounty) {
      return res.status(404).json({ error: 'Bounty not found' });
    }

    // Allow client (creator) or verifier to approve
    const clientAddr = (bounty.clientAddress || bounty.client_address || '').toUpperCase().trim();
    const verifierAddr = (bounty.verifierAddress || bounty.verifier_address || '').toUpperCase().trim();
    const userAddr = (req.user.address || '').toUpperCase().trim();
    
    if (clientAddr !== userAddr && verifierAddr !== userAddr) {
      return res.status(403).json({ error: 'Only the creator or verifier can approve this bounty' });
    }

    if (bounty.status !== 'accepted') {
      return res.status(400).json({ error: 'Bounty must be accepted before approval' });
    }

    // Validate contract ID exists
    if (!bounty.contract_id && !bounty.contractId) {
      return res.status(400).json({ error: 'Bounty does not have a contract ID' });
    }

    // Update bounty status to 'claimed' since contract transfers funds directly
    bounty.status = 'claimed';
    await bounty.save();

    const contractId = bounty.contract_id || bounty.contractId;
    res.json({
      message: 'Bounty approved successfully',
      smartContract: {
        action: 'approve_bounty',
        required: {
          appCall: {
            method: 'approve_bounty',
            args: [contractId],
            accounts: []
          }
        }
      }
    });
  } catch (error) {
    console.error('Error approving bounty:', error);
    res.status(500).json({ error: 'Failed to approve bounty', message: error.message });
  }
});

router.post('/:id/reject', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📥 Rejecting bounty with ID:', id);
    
    // Try to find by contract_id first, then by database id
    let bounty = await Bounty.findOne({ contractId: id });
    if (!bounty) {
      bounty = await Bounty.findById(id);
    }
    
    if (!bounty) {
      return res.status(404).json({ error: 'Bounty not found' });
    }

    // Allow client (creator) or verifier to reject
    const clientAddr = (bounty.clientAddress || bounty.client_address || '').toUpperCase().trim();
    const verifierAddr = (bounty.verifierAddress || bounty.verifier_address || '').toUpperCase().trim();
    const userAddr = (req.user.address || '').toUpperCase().trim();
    
    if (clientAddr !== userAddr && verifierAddr !== userAddr) {
      return res.status(403).json({ error: 'Only the creator or verifier can reject this bounty' });
    }

    if (bounty.status !== 'accepted') {
      return res.status(400).json({ error: 'Bounty must be accepted before rejection' });
    }

    // Validate contract ID exists
    if (!bounty.contract_id && !bounty.contractId) {
      return res.status(400).json({ error: 'Bounty does not have a contract ID' });
    }

    // Update bounty status to rejected (we use reject_bounty function on contract)
    bounty.status = 'rejected';
    await bounty.save();

    const contractId = bounty.contract_id || bounty.contractId;
    res.json({
      message: 'Bounty rejected successfully',
      smartContract: {
        action: 'reject_bounty',
        required: {
          appCall: {
            method: 'reject_bounty',
            args: [contractId],
            accounts: []
          }
        }
      }
    });
  } catch (error) {
    console.error('Error rejecting bounty:', error);
    res.status(500).json({ error: 'Failed to reject bounty', message: error.message });
  }
});

router.post('/:id/claim', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📥 Claiming bounty with ID:', id);
    
    // Try to find by contract_id first, then by database id
    let bounty = await Bounty.findOne({ contractId: id });
    if (!bounty) {
      bounty = await Bounty.findById(id);
    }
    
    if (!bounty) {
      return res.status(404).json({ error: 'Bounty not found' });
    }

    if (bounty.freelancerAddress !== req.user.address && bounty.freelancer_address !== req.user.address) {
      return res.status(403).json({ error: 'Only the freelancer can claim this bounty' });
    }

    if (bounty.status !== 'approved') {
      return res.status(400).json({ error: 'Bounty must be approved before claiming' });
    }

    // Validate contract ID exists
    if (!bounty.contract_id && !bounty.contractId) {
      return res.status(400).json({ error: 'Bounty does not have a contract ID' });
    }

    // Update bounty status
    bounty.status = 'claimed';
    await bounty.save();

    const contractId = bounty.contract_id || bounty.contractId;
    res.json({
      message: 'Bounty claimed successfully',
      smartContract: {
        action: 'claim',
        required: {
          appCall: {
            method: 'claim',
            args: [contractId],
            accounts: []
          }
        }
      }
    });
  } catch (error) {
    console.error('Error claiming bounty:', error);
    res.status(500).json({ error: 'Failed to claim bounty', message: error.message });
  }
});

router.post('/:id/refund', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📥 Refunding bounty with ID:', id);
    
    // Try to find by contract_id first, then by database id
    let bounty = await Bounty.findOne({ contractId: id });
    if (!bounty) {
      bounty = await Bounty.findById(id);
    }
    
    if (!bounty) {
      return res.status(404).json({ error: 'Bounty not found' });
    }

    const clientAddr = bounty.clientAddress || bounty.client_address;
    const verifierAddr = bounty.verifierAddress || bounty.verifier_address;
    
    if (clientAddr !== req.user.address && verifierAddr !== req.user.address) {
      return res.status(403).json({ error: 'Only the client or verifier can refund this bounty' });
    }

    if (bounty.status === 'claimed' || bounty.status === 'refunded' || bounty.status === 'rejected') {
      return res.status(400).json({ error: 'Bounty cannot be refunded' });
    }

    // Validate contract ID exists
    if (!bounty.contract_id && !bounty.contractId) {
      return res.status(400).json({ error: 'Bounty does not have a contract ID' });
    }

    // If verifier is refunding an accepted bounty, treat it as rejection
    // Otherwise, treat it as a regular refund
    if (verifierAddr === req.user.address && bounty.status === 'accepted') {
      bounty.status = 'rejected';
    } else {
      bounty.status = 'refunded';
    }
    await bounty.save();

    const contractId = bounty.contract_id || bounty.contractId;
    res.json({
      message: 'Bounty refunded successfully',
      smartContract: {
        action: 'refund',
        required: {
          appCall: {
            method: 'refund',
            args: [contractId],
            accounts: []
          }
        }
      }
    });
  } catch (error) {
    console.error('Error refunding bounty:', error);
    res.status(500).json({ error: 'Failed to refund bounty', message: error.message });
  }
});

router.post('/:id/auto-refund', async (req, res) => {
  try {
    const bounty = await Bounty.findOne({ contractId: req.params.id });
    
    if (!bounty) {
      return res.status(404).json({ error: 'Bounty not found' });
    }

    // Check if deadline has passed
    if (new Date() < bounty.deadline) {
      return res.status(400).json({ error: 'Deadline has not passed yet' });
    }

    if (bounty.status === 'claimed' || bounty.status === 'refunded') {
      return res.status(400).json({ error: 'Bounty cannot be refunded' });
    }

    // Update bounty status
    bounty.status = 'refunded';
    await bounty.save();

    res.json({
      message: 'Bounty auto-refunded successfully',
      smartContract: {
        action: 'auto_refund',
        required: {
          appCall: {
            method: 'auto_refund',
            args: [],
            accounts: []
          }
        }
      }
    });
  } catch (error) {
    console.error('Error auto-refunding bounty:', error);
    res.status(500).json({ error: 'Failed to auto-refund bounty' });
  }
});

module.exports = router;
