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
      clientAddress: req.user.address
    };

    const bounty = new Bounty(bountyData);
    await bounty.save();

    res.status(201).json(bounty);
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

module.exports = router;
