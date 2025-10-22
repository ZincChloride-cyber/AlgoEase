#!/bin/bash

# AlgoEase Development Startup Script
echo "🚀 Starting AlgoEase Development Environment..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first:"
    echo "   - On Windows: Start MongoDB service or run 'mongod'"
    echo "   - On macOS: brew services start mongodb-community"
    echo "   - On Linux: sudo systemctl start mongod"
    echo ""
    read -p "Press Enter to continue anyway (backend will fail without MongoDB)..."
fi

# Start backend
echo "📦 Starting Backend Server..."
cd backend
npm install
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🎨 Starting Frontend Server..."
cd ../frontend
npm install
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ AlgoEase is starting up!"
echo "   - Backend: http://localhost:5000"
echo "   - Frontend: http://localhost:3000"
echo "   - Health Check: http://localhost:5000/health"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
