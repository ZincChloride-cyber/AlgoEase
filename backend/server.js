const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const bountyRoutes = require('./routes/bounties');
const contractRoutes = require('./routes/contracts');
const { connectDB } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware - configure helmet to not interfere with CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));
// CORS configuration - allow frontend origin
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'AlgoEase Backend API'
  });
});

// API routes
app.use('/api/bounties', bountyRoutes);
app.use('/api/contracts', contractRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Helper function to find an available port
const findAvailablePort = (startPort, maxAttempts = 10) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const tryPort = (port) => {
      attempts++;
      const server = require('http').createServer();
      
      server.listen(port, () => {
        server.once('close', () => resolve(port));
        server.close();
      });
      
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          if (attempts < maxAttempts) {
            tryPort(port + 1);
          } else {
            reject(new Error(`Could not find an available port starting from ${startPort}`));
          }
        } else {
          reject(err);
        }
      });
    };
    
    tryPort(startPort);
  });
};

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Find an available port
    let actualPort = PORT;
    try {
      actualPort = await findAvailablePort(PORT);
    } catch (error) {
      console.error(`❌ Port ${PORT} is in use and no alternative found.`);
      console.error(`💡 Please stop the process using port ${PORT} or set a different PORT in your .env file.`);
      process.exit(1);
    }
    
    if (actualPort !== PORT) {
      console.warn(`⚠️  Port ${PORT} is in use. Using port ${actualPort} instead.`);
      console.warn(`⚠️  Update REACT_APP_API_URL in frontend to: http://localhost:${actualPort}/api`);
    }
    
    const server = app.listen(actualPort, () => {
      console.log(`🚀 AlgoEase Backend API running on port ${actualPort}`);
      console.log(`📊 Health check: http://localhost:${actualPort}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${actualPort} became unavailable during startup.`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
