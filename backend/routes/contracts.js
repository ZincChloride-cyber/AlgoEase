const express = require('express');
const router = express.Router();
const algosdk = require('algosdk');

// ============================================================================
// Algorand Client Configuration
// ============================================================================

const algodClient = new algosdk.Algodv2(
  process.env.ALGOD_TOKEN || '',
  process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud',
  process.env.ALGOD_PORT || ''
);

const indexerClient = new algosdk.Indexer(
  process.env.ALGOD_TOKEN || '',
  process.env.INDEXER_SERVER || 'https://testnet-idx.algonode.cloud',
  process.env.ALGOD_PORT || ''
);

// Contract Configuration (Bounty Escrow V2)
const BOUNTY_ESCROW_APP_ID = parseInt(process.env.CONTRACT_APP_ID || process.env.REACT_APP_CONTRACT_APP_ID || '749707697');
const BOUNTY_ESCROW_ADDRESS = process.env.CONTRACT_ADDRESS || process.env.REACT_APP_CONTRACT_ADDRESS || 'ZS2EW3YGUDATK5OH4S7QUPMIJ4T6ROU6OFJEAGKFD2RSEHPSOCJ3BZBFLU';

// ============================================================================
// Routes
// ============================================================================

/**
 * Get contract information
 * GET /api/contracts/:contractId
 */
router.get('/:contractId', async (req, res) => {
  try {
    const { contractId } = req.params;
    
    const appInfo = await algodClient.getApplicationByID(parseInt(contractId)).do();
    
    // Get global state
    const globalState = {};
    if (appInfo.params['global-state']) {
      appInfo.params['global-state'].forEach(state => {
        const key = Buffer.from(state.key, 'base64').toString();
        globalState[key] = state.value;
      });
    }

    res.json({
      contractId: parseInt(contractId),
      globalState,
      creator: appInfo.params.creator,
      createdAt: appInfo.params['created-at-round']
    });
  } catch (error) {
    console.error('Error fetching contract info:', error);
    res.status(500).json({ error: 'Failed to fetch contract information' });
  }
});

/**
 * Get contract state
 * GET /api/contracts/:contractId/state
 */
router.get('/:contractId/state', async (req, res) => {
  try {
    const { contractId } = req.params;
    
    const appInfo = await algodClient.getApplicationByID(parseInt(contractId)).do();
    
    const state = {
      bountyCount: 0,
      clientAddress: null,
      freelancerAddress: null,
      amount: 0,
      deadline: 0,
      status: 0,
      taskDescription: null,
      verifierAddress: null
    };

    if (appInfo.params['global-state']) {
      appInfo.params['global-state'].forEach(item => {
        const key = Buffer.from(item.key, 'base64').toString();
        const value = item.value;
        
        switch (key) {
          case 'bounty_count':
            state.bountyCount = value.uint;
            break;
          case 'client_addr':
            state.clientAddress = Buffer.from(value.bytes, 'base64').toString();
            break;
          case 'freelancer_addr':
            state.freelancerAddress = Buffer.from(value.bytes, 'base64').toString();
            break;
          case 'amount':
            state.amount = value.uint;
            break;
          case 'deadline':
            state.deadline = value.uint;
            break;
          case 'status':
            state.status = value.uint;
            break;
          case 'task_desc':
            state.taskDescription = Buffer.from(value.bytes, 'base64').toString();
            break;
          case 'verifier_addr':
            state.verifierAddress = Buffer.from(value.bytes, 'base64').toString();
            break;
        }
      });
    }

    res.json(state);
  } catch (error) {
    console.error('Error fetching contract state:', error);
    res.status(500).json({ error: 'Failed to fetch contract state' });
  }
});

/**
 * Get suggested transaction parameters
 * GET /api/contracts/params
 */
router.get('/params', async (req, res) => {
  try {
    const params = await algodClient.getTransactionParams().do();
    res.json(params);
  } catch (error) {
    console.error('Error fetching transaction params:', error);
    res.status(500).json({ error: 'Failed to fetch transaction parameters' });
  }
});

/**
 * Simulate transaction
 * POST /api/contracts/simulate
 */
router.post('/simulate', async (req, res) => {
  try {
    const { transaction } = req.body;
    
    if (!transaction) {
      return res.status(400).json({ error: 'Transaction data is required' });
    }

    const result = await algodClient.simulateRawTransactions([transaction]).do();
    res.json(result);
  } catch (error) {
    console.error('Error simulating transaction:', error);
    res.status(500).json({ error: 'Failed to simulate transaction' });
  }
});

module.exports = router;
