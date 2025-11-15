const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

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

// Get chain metrics
router.get('/:chainId/metrics', authenticate, async (req, res) => {
  try {
    // Generate sample metrics (replace with real data from monitoring service)
    const metrics = {
      timestamp: new Date().toISOString(),
      tps: Math.floor(Math.random() * 200) + 800,
      blockTime: (Math.random() * 2 + 1).toFixed(2),
      gasPrice: (Math.random() * 0.001).toFixed(6),
      activeValidators: Math.floor(Math.random() * 5) + 10,
      networkHashrate: (Math.random() * 100 + 400).toFixed(2),
      pendingTransactions: Math.floor(Math.random() * 100),
      uptime: (99 + Math.random()).toFixed(2)
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get chain analytics
router.get('/:chainId/analytics', authenticate, async (req, res) => {
  try {
    // Generate sample analytics data
    const now = new Date();
    const data = [];
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now - i * 60 * 60 * 1000);
      data.push({
        timestamp: timestamp.toISOString(),
        transactions: Math.floor(Math.random() * 1000) + 500,
        tps: Math.floor(Math.random() * 100) + 700,
        blockTime: (Math.random() * 2 + 1).toFixed(2),
        gasUsed: Math.floor(Math.random() * 1000000) + 500000
      });
    }

    res.json({ data, period: '24h' });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get chain logs
router.get('/:chainId/logs', authenticate, async (req, res) => {
  try {
    const { level = 'all', limit = 50 } = req.query;

    // Generate sample logs
    const logs = [];
    const levels = level === 'all' ? ['info', 'warning', 'error'] : [level];
    
    for (let i = 0; i < Math.min(limit, 50); i++) {
      logs.push({
        id: `log-${i}`,
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        level: levels[Math.floor(Math.random() * levels.length)],
        message: `Sample log message ${i}`,
        source: ['validator', 'sequencer', 'bridge'][Math.floor(Math.random() * 3)]
      });
    }

    res.json({ logs, total: logs.length });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

