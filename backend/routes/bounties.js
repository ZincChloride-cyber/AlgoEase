const express = require('express');
const router = express.Router();
const Bounty = require('../models/Bounty');
const { validateBounty } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

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

    // Build filter object
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

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const bounties = await Bounty.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-submissions'); // Exclude submissions for list view

    const total = await Bounty.countDocuments(filter);

    res.json({
      bounties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching bounties:', error);
    res.status(500).json({ error: 'Failed to fetch bounties' });
  }
});

// Get single bounty by ID
router.get('/:id', async (req, res) => {
  try {
    const bounty = await Bounty.findOne({ contractId: req.params.id });
    
    if (!bounty) {
      return res.status(404).json({ error: 'Bounty not found' });
    }

    res.json(bounty);
  } catch (error) {
    console.error('Error fetching bounty:', error);
    res.status(500).json({ error: 'Failed to fetch bounty' });
  }
});

// Create new bounty
router.post('/', authenticate, validateBounty, async (req, res) => {
  try {
    const bountyData = {
      ...req.body,
      clientAddress: req.user.address,
      // Generate a unique contract ID for this bounty
      contractId: Date.now() + Math.floor(Math.random() * 1000)
    };

    const bounty = new Bounty(bountyData);
    await bounty.save();

    // Return bounty with smart contract interaction instructions
    res.status(201).json({
      ...bounty.toObject(),
      smartContract: {
        action: 'create_bounty',
        required: {
          payment: {
            amount: bounty.amount,
            to: 'contract_address', // Will be replaced by frontend
            note: 'AlgoEase: Bounty Payment'
          },
          appCall: {
            method: 'create_bounty',
            args: [
              bounty.amount * 1000000, // Convert to microALGO
              Math.floor(bounty.deadline.getTime() / 1000), // Convert to timestamp
              bounty.description
            ],
            accounts: [bounty.verifierAddress]
          }
        }
      }
    });
  } catch (error) {
    console.error('Error creating bounty:', error);
    res.status(500).json({ error: 'Failed to create bounty' });
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

    const updatedBounty = await Bounty.findByIdAndUpdate(
      bounty._id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedBounty);
  } catch (error) {
    console.error('Error updating bounty:', error);
    res.status(500).json({ error: 'Failed to update bounty' });
  }
});

// Submit work for bounty
router.post('/:id/submit', authenticate, async (req, res) => {
  try {
    const { description, links } = req.body;
    
    const bounty = await Bounty.findOne({ contractId: req.params.id });
    
    if (!bounty) {
      return res.status(404).json({ error: 'Bounty not found' });
    }

    if (bounty.status !== 'accepted') {
      return res.status(400).json({ error: 'Bounty must be accepted before submitting work' });
    }

    if (bounty.freelancerAddress !== req.user.address) {
      return res.status(403).json({ error: 'Only the assigned freelancer can submit work' });
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

    const bounties = await Bounty.find(filter)
      .sort({ createdAt: -1 })
      .select('-submissions');

    res.json(bounties);
  } catch (error) {
    console.error('Error fetching user bounties:', error);
    res.status(500).json({ error: 'Failed to fetch user bounties' });
  }
});

// Smart contract interaction endpoints
router.post('/:id/accept', authenticate, async (req, res) => {
  try {
    const bounty = await Bounty.findOne({ contractId: req.params.id });
    
    if (!bounty) {
      return res.status(404).json({ error: 'Bounty not found' });
    }

    if (bounty.status !== 'open') {
      return res.status(400).json({ error: 'Bounty is not open for acceptance' });
    }

    // Update bounty with freelancer
    bounty.freelancerAddress = req.user.address;
    bounty.status = 'accepted';
    await bounty.save();

    res.json({
      message: 'Bounty accepted successfully',
      smartContract: {
        action: 'accept_bounty',
        required: {
          appCall: {
            method: 'accept_bounty',
            args: [],
            accounts: []
          }
        }
      }
    });
  } catch (error) {
    console.error('Error accepting bounty:', error);
    res.status(500).json({ error: 'Failed to accept bounty' });
  }
});

router.post('/:id/approve', authenticate, async (req, res) => {
  try {
    const bounty = await Bounty.findOne({ contractId: req.params.id });
    
    if (!bounty) {
      return res.status(404).json({ error: 'Bounty not found' });
    }

    if (bounty.verifierAddress !== req.user.address) {
      return res.status(403).json({ error: 'Only the verifier can approve this bounty' });
    }

    if (bounty.status !== 'accepted') {
      return res.status(400).json({ error: 'Bounty must be accepted before approval' });
    }

    // Update bounty status
    bounty.status = 'approved';
    await bounty.save();

    res.json({
      message: 'Bounty approved successfully',
      smartContract: {
        action: 'approve_bounty',
        required: {
          appCall: {
            method: 'approve_bounty',
            args: [],
            accounts: []
          }
        }
      }
    });
  } catch (error) {
    console.error('Error approving bounty:', error);
    res.status(500).json({ error: 'Failed to approve bounty' });
  }
});

router.post('/:id/claim', authenticate, async (req, res) => {
  try {
    const bounty = await Bounty.findOne({ contractId: req.params.id });
    
    if (!bounty) {
      return res.status(404).json({ error: 'Bounty not found' });
    }

    if (bounty.freelancerAddress !== req.user.address) {
      return res.status(403).json({ error: 'Only the freelancer can claim this bounty' });
    }

    if (bounty.status !== 'approved') {
      return res.status(400).json({ error: 'Bounty must be approved before claiming' });
    }

    // Update bounty status
    bounty.status = 'claimed';
    await bounty.save();

    res.json({
      message: 'Bounty claimed successfully',
      smartContract: {
        action: 'claim',
        required: {
          appCall: {
            method: 'claim',
            args: [],
            accounts: []
          }
        }
      }
    });
  } catch (error) {
    console.error('Error claiming bounty:', error);
    res.status(500).json({ error: 'Failed to claim bounty' });
  }
});

router.post('/:id/refund', authenticate, async (req, res) => {
  try {
    const bounty = await Bounty.findOne({ contractId: req.params.id });
    
    if (!bounty) {
      return res.status(404).json({ error: 'Bounty not found' });
    }

    if (bounty.clientAddress !== req.user.address && bounty.verifierAddress !== req.user.address) {
      return res.status(403).json({ error: 'Only the client or verifier can refund this bounty' });
    }

    if (bounty.status === 'claimed' || bounty.status === 'refunded') {
      return res.status(400).json({ error: 'Bounty cannot be refunded' });
    }

    // Update bounty status
    bounty.status = 'refunded';
    await bounty.save();

    res.json({
      message: 'Bounty refunded successfully',
      smartContract: {
        action: 'refund',
        required: {
          appCall: {
            method: 'refund',
            args: [],
            accounts: []
          }
        }
      }
    });
  } catch (error) {
    console.error('Error refunding bounty:', error);
    res.status(500).json({ error: 'Failed to refund bounty' });
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
