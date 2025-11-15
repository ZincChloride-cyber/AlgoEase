# AlgoEase Backend API

A clean, well-structured Express.js backend for the AlgoEase bounty platform, built with Supabase and Algorand integration.

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # Supabase database connection
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── validation.js        # Request validation (Joi)
├── models/
│   └── Bounty.js            # Bounty model with database operations
├── routes/
│   ├── bounties.js          # Bounty CRUD and action endpoints
│   └── contracts.js         # Smart contract interaction endpoints
├── migrations/              # SQL migration scripts
├── scripts/                 # Utility scripts
├── server.js                # Express app entry point
├── package.json
└── .env                     # Environment variables
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Supabase account and project
- Algorand testnet/mainnet access

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Algorand
ALGOD_SERVER=https://testnet-api.algonode.cloud
ALGOD_TOKEN=
ALGOD_PORT=

# Contract
CONTRACT_APP_ID=749689686
CONTRACT_ADDRESS=GJR2ZOTCUS6JK63T3V47KYPZ7ZEKOIVTESQEQOUZCXIA3E35QR46NC46TM
```

3. Run database migrations:
   - Go to your Supabase dashboard
   - Open SQL Editor
   - Run the migration script from `migrations/FIX_EXISTING_TABLE.sql` or `migrations/COMPLETE_DATABASE_REWRITE.sql`

4. Start the server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

## 📡 API Endpoints

### Health Check
- `GET /health` - Server health status

### Bounties
- `GET /api/bounties` - List all bounties (with filtering, pagination)
- `GET /api/bounties/:id` - Get single bounty
- `POST /api/bounties` - Create new bounty
- `PUT /api/bounties/:id` - Update bounty
- `POST /api/bounties/:id/accept` - Accept bounty (freelancer)
- `POST /api/bounties/:id/submit` - Submit work (freelancer)
- `POST /api/bounties/:id/approve` - Approve work (client/verifier)
- `POST /api/bounties/:id/reject` - Reject work (client/verifier)
- `POST /api/bounties/:id/claim` - Claim funds (freelancer)
- `POST /api/bounties/:id/refund` - Refund to client
- `GET /api/bounties/user/:address` - Get user's bounties

### Contracts
- `GET /api/contracts/:contractId` - Get contract info
- `GET /api/contracts/:contractId/state` - Get contract state
- `GET /api/contracts/params` - Get transaction parameters
- `POST /api/contracts/simulate` - Simulate transaction

## 🔧 Key Features

### Contract ID Handling
The backend includes robust handling for `contract_id`:
- Automatic conversion between camelCase (API) and snake_case (database)
- Validation and type checking
- Fallback mechanism to fetch from on-chain state if missing
- Comprehensive logging for debugging

### Database Model
The `Bounty` model provides:
- Automatic field name conversion (camelCase ↔ snake_case)
- Type validation and sanitization
- Support for all transaction IDs (create, accept, approve, reject, claim, refund)
- Proper handling of JSONB fields (requirements, tags, submissions)

### Error Handling
- Comprehensive error logging
- Detailed error messages in development
- Graceful error responses
- Database error handling with proper status codes

## 🔐 Authentication

Currently uses simple header-based authentication:
```
Authorization: Bearer <ALGORAND_ADDRESS>
```

In production, this should be replaced with JWT tokens.

## 📝 Database Schema

The `bounties` table includes:
- `id` (UUID, primary key)
- `contract_id` (BIGINT, unique, nullable)
- `client_address`, `freelancer_address`, `verifier_address` (VARCHAR(58))
- `amount` (DECIMAL(18, 6))
- `deadline` (TIMESTAMP)
- `status` (VARCHAR) - 'open', 'accepted', 'submitted', 'approved', 'claimed', 'refunded', 'rejected'
- `title`, `description`, `requirements`, `tags`, `submissions` (TEXT/JSONB)
- Transaction IDs for all actions
- `created_at`, `updated_at` (TIMESTAMP)

## 🛠️ Development

### Running Tests
```bash
npm test
```

### Code Structure
- **server.js**: Express app setup, middleware, error handling
- **config/database.js**: Supabase client initialization
- **models/Bounty.js**: Database operations and data transformation
- **routes/**: API endpoint handlers
- **middleware/**: Request validation and authentication

## 📦 Dependencies

- `express` - Web framework
- `@supabase/supabase-js` - Database client
- `algosdk` - Algorand SDK
- `joi` - Validation
- `cors` - CORS handling
- `helmet` - Security headers
- `express-rate-limit` - Rate limiting

## 🔄 Migration Guide

If upgrading from an older version:
1. Backup your database
2. Run the appropriate migration script from `migrations/`
3. Update your `.env` file with new variables
4. Restart the server

## 📄 License

MIT

