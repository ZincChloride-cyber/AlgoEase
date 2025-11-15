const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { deployChain } = require('../services/chainDeployment');

// In-memory storage (replace with database in production)
const chains = new Map();

// Middleware to verify JWT
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all chains for a user
router.get('/', authenticate, async (req, res) => {
  try {
    const userChains = Array.from(chains.values()).filter(
      chain => chain.userId === req.userId
    );

    // Calculate stats
    const stats = {
      totalChains: userChains.length,
      activeChains: userChains.filter(c => c.status === 'active').length,
      totalTransactions: userChains.reduce((sum, c) => sum + (c.transactions || 0), 0),
      averageUptime: userChains.length > 0 
        ? userChains.reduce((sum, c) => sum + c.uptime, 0) / userChains.length 
        : 99.9
    };

    res.json({ chains: userChains, stats });
  } catch (error) {
    console.error('Error fetching chains:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific chain
router.get('/:id', authenticate, async (req, res) => {
  try {
    const chain = chains.get(req.params.id);
    
    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }

    if (chain.userId !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(chain);
  } catch (error) {
    console.error('Error fetching chain:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new chain (authentication optional for now)
router.post('/create', async (req, res) => {
  try {
    const { name, chainType, rollupType, gasToken, validatorAccess, initialValidators, blockchainTxHash, blockchainChainId } = req.body;

    // Validation
    if (!name || !chainType || !rollupType || !gasToken) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const chainId = uuidv4();
    
    // Determine PolygonScan URL based on chain ID
    let polygonScanUrl = null;
    if (blockchainTxHash) {
      if (blockchainChainId === 137) {
        polygonScanUrl = `https://polygonscan.com/tx/${blockchainTxHash}`;
      } else if (blockchainChainId === 80002) {
        polygonScanUrl = `https://amoy.polygonscan.com/tx/${blockchainTxHash}`;
      }
    }

    const chain = {
      id: chainId,
      userId: req.userId,
      name,
      chainType,
      rollupType,
      gasToken: gasToken.toUpperCase(),
      validatorAccess: validatorAccess || 'public',
      validators: parseInt(initialValidators) || 3,
      status: 'deploying',
      uptime: 0,
      tps: 0,
      transactions: 0,
      createdAt: new Date().toISOString(),
      rpcUrl: `https://rpc-${chainId.substring(0, 8)}.polyone.io`,
      explorerUrl: `https://explorer-${chainId.substring(0, 8)}.polyone.io`,
      chainId: Math.floor(Math.random() * 1000000) + 100000,
      blockchainTxHash: blockchainTxHash || null,
      blockchainChainId: blockchainChainId || null,
      polygonScanUrl: polygonScanUrl || null
    };

    chains.set(chainId, chain);

    // Start deployment process (async)
    deployChain(chainId, chain).then((result) => {
      const updatedChain = chains.get(chainId);
      if (updatedChain && result.success) {
        updatedChain.status = 'active';
        updatedChain.uptime = 99.9;
        updatedChain.tps = Math.floor(Math.random() * 500) + 500;
        updatedChain.rpcUrl = result.endpoints.rpc;
        updatedChain.explorerUrl = result.endpoints.explorer;
        updatedChain.bridgeUrl = result.endpoints.bridge;
        updatedChain.agglayerChainId = result.agglayerChainId;
        updatedChain.validatorKeys = result.validatorKeys;
        updatedChain.deployedAt = new Date().toISOString();
        chains.set(chainId, updatedChain);
      }
    }).catch(error => {
      console.error('Deployment error:', error);
      const updatedChain = chains.get(chainId);
      if (updatedChain) {
        updatedChain.status = 'failed';
        updatedChain.error = error.message;
        chains.set(chainId, updatedChain);
      }
    });

    res.status(201).json({
      message: 'Chain deployment started',
      chainId,
      chain
    });
  } catch (error) {
    console.error('Error creating chain:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update chain
router.put('/:id', authenticate, async (req, res) => {
  try {
    const chain = chains.get(req.params.id);
    
    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }

    if (chain.userId !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedChain = { ...chain, ...req.body, id: chain.id, userId: chain.userId };
    chains.set(req.params.id, updatedChain);

    res.json({ message: 'Chain updated', chain: updatedChain });
  } catch (error) {
    console.error('Error updating chain:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete chain
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const chain = chains.get(req.params.id);
    
    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }

    if (chain.userId !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    chains.delete(req.params.id);

    res.json({ message: 'Chain deleted successfully' });
  } catch (error) {
    console.error('Error deleting chain:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get chain deployment status
router.get('/:id/status', authenticate, async (req, res) => {
  try {
    const { getDeploymentStatus } = require('../services/chainDeployment');
    const { getAggLayerStatus } = require('../services/agglayer');
    
    const chain = chains.get(req.params.id);
    
    if (!chain) {
      return res.status(404).json({ message: 'Chain not found' });
    }

    if (chain.userId !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get deployment status
    const deploymentStatus = await getDeploymentStatus(req.params.id);
    
    // Get AggLayer status
    const agglayerStatus = await getAggLayerStatus(req.params.id);

    res.json({
      chainId: req.params.id,
      status: chain.status,
      deployment: deploymentStatus,
      agglayer: agglayerStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting chain status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

