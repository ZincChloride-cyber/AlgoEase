# AlgoEase Development Setup Script

# This script sets up the development environment for AlgoEase

echo "🚀 Setting up AlgoEase development environment..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed. Please install Python 3.10+"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed. Please install Node.js 18+"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is required but not installed. Please install npm"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Install Python dependencies
echo "📦 Installing Python dependencies..."
cd projects/algoease-contracts
pip install -r requirements.txt
cd ../..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd projects/algoease-frontend
npm install
cd ../..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install AlgoKit
echo "🔧 Installing AlgoKit..."
pip install algokit

# Initialize AlgoKit
echo "🔧 Initializing AlgoKit..."
algokit init

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p data
mkdir -p temp

# Set up environment files
echo "⚙️ Setting up environment files..."
if [ ! -f backend/.env ]; then
    cp backend/env.example backend/.env
    echo "📝 Created backend/.env from template"
fi

# Compile smart contracts
echo "🔨 Compiling smart contracts..."
cd projects/algoease-contracts
python algoease_contract.py
cd ../..

echo "✅ Setup complete!"
echo ""
echo "🎉 AlgoEase is ready for development!"
echo ""
echo "Next steps:"
echo "1. Start the backend: cd backend && npm run dev"
echo "2. Start the frontend: cd projects/algoease-frontend && npm run dev"
echo "3. Deploy contracts: cd projects/algoease-contracts && algokit project deploy localnet"
echo "4. Run tests: cd projects/algoease-contracts && python test_contract.py"
echo ""
echo "Happy coding! 🚀"
