#!/bin/bash

# Bash script to start the backend server
# Usage: ./scripts/start-backend.sh

echo "🚀 Starting PolyOne Backend Server..."
echo ""

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "❌ Backend directory not found!"
    exit 1
fi

# Change to backend directory
cd backend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies!"
        exit 1
    fi
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating default .env..."
    cat > .env << EOF
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
EOF
    echo "✅ Created .env file"
fi

echo "🚀 Starting backend server on port 5000..."
echo ""
echo "📍 Backend URL: http://localhost:5000"
echo "📍 Health Check: http://localhost:5000/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npm run dev

