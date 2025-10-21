# AlgoEase Backend Documentation

## Overview

The AlgoEase backend is an optional Node.js API server that provides metadata storage, contract state management, and additional functionality for the AlgoEase platform. It serves as a bridge between the frontend and the Algorand blockchain.

## Technology Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **AlgoSDK** - Algorand blockchain integration
- **Joi** - Input validation
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

## Project Structure

```
backend/
├── config/
│   └── database.js
├── middleware/
│   ├── auth.js
│   └── validation.js
├── models/
│   └── Bounty.js
├── routes/
│   ├── bounties.js
│   └── contracts.js
├── utils/
├── server.js
├── package.json
└── env.example
```

## API Endpoints

### Bounty Endpoints

#### GET /api/bounties

Retrieve a list of bounties with optional filtering and pagination.

**Query Parameters:**
- `status` (string): Filter by status (open, accepted, approved, claimed, refunded)
- `client` (string): Filter by client address
- `freelancer` (string): Filter by freelancer address
- `minAmount` (number): Minimum bounty amount
- `maxAmount` (number): Maximum bounty amount
- `deadline` (string): Filter by deadline (ISO date)
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `sortBy` (string): Sort field (default: createdAt)
- `sortOrder` (string): Sort order (asc/desc, default: desc)

**Response:**
```json
{
  "bounties": [
    {
      "contractId": 123,
      "title": "Build a React component",
      "description": "Create a responsive dashboard...",
      "amount": 15.5,
      "deadline": "2024-02-15T23:59:59Z",
      "status": "open",
      "clientAddress": "ALGORAND_ADDRESS",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### GET /api/bounties/:id

Retrieve a specific bounty by contract ID.

**Response:**
```json
{
  "contractId": 123,
  "title": "Build a React component",
  "description": "Create a responsive dashboard...",
  "amount": 15.5,
  "deadline": "2024-02-15T23:59:59Z",
  "status": "open",
  "clientAddress": "ALGORAND_ADDRESS",
  "freelancerAddress": "ALGORAND_ADDRESS",
  "verifierAddress": "ALGORAND_ADDRESS",
  "requirements": ["React 18+", "TypeScript"],
  "tags": ["frontend", "react"],
  "submissions": [
    {
      "freelancerAddress": "ALGORAND_ADDRESS",
      "description": "Completed work description",
      "links": ["https://github.com/user/repo"],
      "submittedAt": "2024-01-20T15:30:00Z",
      "status": "pending"
    }
  ],
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-20T15:30:00Z"
}
```

#### POST /api/bounties

Create a new bounty.

**Headers:**
- `Authorization: Bearer ALGORAND_ADDRESS`

**Request Body:**
```json
{
  "title": "Build a React component",
  "description": "Create a responsive dashboard component...",
  "amount": 15.5,
  "deadline": "2024-02-15T23:59:59Z",
  "verifierAddress": "ALGORAND_ADDRESS",
  "requirements": ["React 18+", "TypeScript"],
  "tags": ["frontend", "react"]
}
```

**Response:**
```json
{
  "contractId": 123,
  "title": "Build a React component",
  "description": "Create a responsive dashboard component...",
  "amount": 15.5,
  "deadline": "2024-02-15T23:59:59Z",
  "status": "open",
  "clientAddress": "ALGORAND_ADDRESS",
  "verifierAddress": "ALGORAND_ADDRESS",
  "requirements": ["React 18+", "TypeScript"],
  "tags": ["frontend", "react"],
  "createdAt": "2024-01-15T10:00:00Z"
}
```

#### PUT /api/bounties/:id

Update an existing bounty (only by client).

**Headers:**
- `Authorization: Bearer ALGORAND_ADDRESS`

**Request Body:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "requirements": ["Updated requirement"]
}
```

#### POST /api/bounties/:id/submit

Submit work for a bounty.

**Headers:**
- `Authorization: Bearer ALGORAND_ADDRESS`

**Request Body:**
```json
{
  "description": "Work completion description",
  "links": ["https://github.com/user/repo", "https://demo.example.com"]
}
```

#### GET /api/bounties/user/:address

Get bounties for a specific user.

**Query Parameters:**
- `type` (string): Filter type (created, accepted, all)

### Contract Endpoints

#### GET /api/contracts/:contractId

Get contract information from Algorand.

**Response:**
```json
{
  "contractId": 123,
  "globalState": {
    "bounty_count": 1,
    "client_addr": "ALGORAND_ADDRESS",
    "amount": 1000000
  },
  "creator": "ALGORAND_ADDRESS",
  "createdAt": 1234567890
}
```

#### GET /api/contracts/:contractId/state

Get parsed contract state.

**Response:**
```json
{
  "bountyCount": 1,
  "clientAddress": "ALGORAND_ADDRESS",
  "freelancerAddress": "ALGORAND_ADDRESS",
  "amount": 1000000,
  "deadline": 1704067200,
  "status": 2,
  "taskDescription": "Task description",
  "verifierAddress": "ALGORAND_ADDRESS"
}
```

#### GET /api/contracts/params

Get suggested transaction parameters.

**Response:**
```json
{
  "fee": 1000,
  "firstRound": 12345678,
  "lastRound": 12346678,
  "genesisID": "testnet-v1.0",
  "genesisHash": "SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI="
}
```

#### POST /api/contracts/simulate

Simulate a transaction.

**Request Body:**
```json
{
  "transaction": "base64_encoded_transaction"
}
```

## Data Models

### Bounty Model

```javascript
{
  contractId: Number,           // Algorand application ID
  clientAddress: String,        // Client's Algorand address
  freelancerAddress: String,     // Freelancer's Algorand address
  verifierAddress: String,       // Verifier's Algorand address
  amount: Number,               // Amount in ALGO
  deadline: Date,               // Deadline timestamp
  status: String,               // Current status
  title: String,                // Bounty title
  description: String,          // Task description
  requirements: [String],       // Task requirements
  tags: [String],              // Bounty tags
  submissions: [Submission],    // Work submissions
  createdAt: Date,              // Creation timestamp
  updatedAt: Date               // Last update timestamp
}
```

### Submission Model

```javascript
{
  freelancerAddress: String,    // Freelancer's address
  description: String,         // Submission description
  links: [String],             // Links to work
  submittedAt: Date,           // Submission timestamp
  status: String               // Submission status
}
```

## Middleware

### Authentication

Simple header-based authentication using Algorand addresses.

```javascript
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header required' });
  }

  const address = authHeader.replace('Bearer ', '');
  
  if (!/^[A-Z2-7]{58}$/.test(address)) {
    return res.status(401).json({ error: 'Invalid address format' });
  }

  req.user = { address };
  next();
};
```

### Validation

Input validation using Joi schemas.

```javascript
const validateBounty = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().max(200).required(),
    description: Joi.string().max(5000).required(),
    amount: Joi.number().min(0.001).required(),
    deadline: Joi.date().greater('now').required(),
    verifierAddress: Joi.string().pattern(/^[A-Z2-7]{58}$/).optional(),
    requirements: Joi.array().items(Joi.string().max(500)).optional(),
    tags: Joi.array().items(Joi.string().max(50)).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: error.details.map(d => d.message) 
    });
  }

  next();
};
```

## Database Configuration

### MongoDB Connection

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/algoease';
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
```

### Indexes

```javascript
// Bounty model indexes
bountySchema.index({ contractId: 1 });
bountySchema.index({ clientAddress: 1 });
bountySchema.index({ freelancerAddress: 1 });
bountySchema.index({ status: 1 });
bountySchema.index({ deadline: 1 });
bountySchema.index({ createdAt: -1 });
```

## Algorand Integration

### Client Configuration

```javascript
const algosdk = require('algosdk');

const algodClient = new algosdk.Algodv2(
  process.env.ALGOD_TOKEN || '',
  process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud',
  process.env.ALGOD_PORT || ''
);
```

### Contract State Parsing

```javascript
const parseGlobalState = (globalState) => {
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

  globalState.forEach(item => {
    const key = Buffer.from(item.key, 'base64').toString();
    const value = item.value;
    
    switch (key) {
      case 'bounty_count':
        state.bountyCount = value.uint;
        break;
      case 'client_addr':
        state.clientAddress = Buffer.from(value.bytes, 'base64').toString();
        break;
      // ... other cases
    }
  });

  return state;
};
```

## Security

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

### Security Headers

```javascript
const helmet = require('helmet');

app.use(helmet());
```

### CORS Configuration

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

## Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/algoease

# Algorand Configuration
ALGOD_SERVER=https://testnet-api.algonode.cloud
ALGOD_TOKEN=
ALGOD_PORT=

# Contract Configuration
CONTRACT_APP_ID=
CONTRACT_CREATOR_ADDRESS=

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Error Handling

### Global Error Handler

```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});
```

### API Error Responses

```javascript
// 400 Bad Request
res.status(400).json({ 
  error: 'Validation failed', 
  details: error.details.map(d => d.message) 
});

// 401 Unauthorized
res.status(401).json({ error: 'Authorization header required' });

// 403 Forbidden
res.status(403).json({ error: 'Not authorized to update this bounty' });

// 404 Not Found
res.status(404).json({ error: 'Bounty not found' });

// 500 Internal Server Error
res.status(500).json({ error: 'Failed to fetch bounties' });
```

## Testing

### Unit Tests

```javascript
const request = require('supertest');
const app = require('../server');

describe('GET /api/bounties', () => {
  it('should return list of bounties', async () => {
    const response = await request(app)
      .get('/api/bounties')
      .expect(200);

    expect(response.body).toHaveProperty('bounties');
    expect(response.body).toHaveProperty('pagination');
  });
});
```

### Integration Tests

- Database operations
- API endpoint testing
- Algorand integration
- Error handling

## Deployment

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

### Environment Setup

1. Set up MongoDB
2. Configure environment variables
3. Deploy to cloud provider
4. Set up monitoring and logging

### Monitoring

- Application performance monitoring
- Database performance monitoring
- Error tracking
- Uptime monitoring

## Performance Optimization

### Database Optimization

- Proper indexing
- Query optimization
- Connection pooling
- Caching strategies

### API Optimization

- Response compression
- Request validation
- Rate limiting
- Error handling

### Caching

- Redis for session storage
- Memory caching for frequent queries
- CDN for static assets
- Database query caching
