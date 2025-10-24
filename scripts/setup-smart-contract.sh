#!/bin/bash

# AlgoEase Smart Contract Setup Script
# This script sets up the complete smart contract environment

set -e

echo "🎯 AlgoEase Smart Contract Setup"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
    else
        print_error "Node.js is not installed. Please install Node.js v14 or higher."
        exit 1
    fi
}

# Check if Python is installed
check_python() {
    print_status "Checking Python installation..."
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version)
        print_success "Python is installed: $PYTHON_VERSION"
    else
        print_error "Python 3 is not installed. Please install Python 3.7 or higher."
        exit 1
    fi
}

# Install Python dependencies
install_python_deps() {
    print_status "Installing Python dependencies..."
    cd contracts
    if [ -f "requirements.txt" ]; then
        pip3 install -r requirements.txt
        print_success "Python dependencies installed"
    else
        print_warning "No requirements.txt found in contracts directory"
    fi
    cd ..
}

# Install Node.js dependencies
install_node_deps() {
    print_status "Installing Node.js dependencies..."
    
    # Install root dependencies
    if [ -f "package.json" ]; then
        npm install
        print_success "Root dependencies installed"
    fi
    
    # Install backend dependencies
    if [ -d "backend" ] && [ -f "backend/package.json" ]; then
        cd backend
        npm install
        print_success "Backend dependencies installed"
        cd ..
    fi
    
    # Install frontend dependencies
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        cd frontend
        npm install
        print_success "Frontend dependencies installed"
        cd ..
    fi
}

# Compile smart contract
compile_contract() {
    print_status "Compiling smart contract..."
    cd contracts
    
    if [ -f "algoease_contract.py" ]; then
        python3 algoease_contract.py
        if [ $? -eq 0 ]; then
            print_success "Smart contract compiled successfully"
        else
            print_error "Failed to compile smart contract"
            exit 1
        fi
    else
        print_error "Smart contract source file not found"
        exit 1
    fi
    
    cd ..
}

# Check environment variables
check_env() {
    print_status "Checking environment variables..."
    
    if [ -z "$CREATOR_MNEMONIC" ]; then
        print_warning "CREATOR_MNEMONIC not set"
        print_status "Please set your creator mnemonic:"
        print_status "export CREATOR_MNEMONIC=\"your mnemonic phrase here\""
        print_status ""
        print_status "You can get a test mnemonic from:"
        print_status "https://testnet.algoexplorer.io/dispenser"
        return 1
    else
        print_success "CREATOR_MNEMONIC is set"
        return 0
    fi
}

# Deploy smart contract
deploy_contract() {
    print_status "Deploying smart contract..."
    
    if [ -f "scripts/deploy-contract.js" ]; then
        node scripts/deploy-contract.js
        if [ $? -eq 0 ]; then
            print_success "Smart contract deployed successfully"
        else
            print_error "Failed to deploy smart contract"
            exit 1
        fi
    else
        print_error "Deploy script not found"
        exit 1
    fi
}

# Test smart contract
test_contract() {
    print_status "Testing smart contract..."
    
    if [ -f "scripts/test-contract.js" ]; then
        node scripts/test-contract.js
        if [ $? -eq 0 ]; then
            print_success "Smart contract tests passed"
        else
            print_warning "Some smart contract tests failed"
        fi
    else
        print_warning "Test script not found"
    fi
}

# Create environment files
create_env_files() {
    print_status "Creating environment files..."
    
    # Backend .env
    if [ ! -f "backend/.env" ]; then
        cat > backend/.env << EOF
# Database
MONGODB_URI=mongodb://localhost:27017/algoease

# JWT
JWT_SECRET=your_jwt_secret_here

# Algorand
ALGOD_URL=https://testnet-api.algonode.cloud
ALGOD_TOKEN=
INDEXER_URL=https://testnet-idx.algonode.cloud
INDEXER_TOKEN=

# Contract
CONTRACT_APP_ID=
CONTRACT_ADDRESS=
EOF
        print_success "Backend .env file created"
    else
        print_warning "Backend .env file already exists"
    fi
    
    # Frontend .env.local
    if [ ! -f "frontend/.env.local" ]; then
        cat > frontend/.env.local << EOF
# Algorand
REACT_APP_ALGOD_URL=https://testnet-api.algonode.cloud
REACT_APP_INDEXER_URL=https://testnet-idx.algonode.cloud
REACT_APP_NETWORK=testnet

# Contract
REACT_APP_CONTRACT_APP_ID=
REACT_APP_CONTRACT_ADDRESS=
EOF
        print_success "Frontend .env.local file created"
    else
        print_warning "Frontend .env.local file already exists"
    fi
}

# Main setup function
main() {
    echo "Starting setup process..."
    echo ""
    
    # Check prerequisites
    check_node
    check_python
    
    # Install dependencies
    install_python_deps
    install_node_deps
    
    # Compile contract
    compile_contract
    
    # Create environment files
    create_env_files
    
    # Check if we can deploy
    if check_env; then
        echo ""
        print_status "Environment is ready for deployment"
        print_status "Run the following commands to deploy and test:"
        echo ""
        print_status "1. Deploy the contract:"
        print_status "   node scripts/deploy-contract.js"
        echo ""
        print_status "2. Test the contract:"
        print_status "   node scripts/test-contract.js"
        echo ""
        print_status "3. Start the backend:"
        print_status "   cd backend && npm start"
        echo ""
        print_status "4. Start the frontend:"
        print_status "   cd frontend && npm start"
        echo ""
    else
        echo ""
        print_warning "Please set your CREATOR_MNEMONIC and run the deployment commands manually"
        echo ""
    fi
    
    print_success "Setup completed!"
}

# Run main function
main "$@"
