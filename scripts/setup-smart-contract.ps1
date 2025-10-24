# AlgoEase Smart Contract Setup Script (PowerShell)
# This script sets up the complete smart contract environment

param(
    [string]$CreatorMnemonic = ""
)

Write-Host "🎯 AlgoEase Smart Contract Setup" -ForegroundColor Blue
Write-Host "================================" -ForegroundColor Blue
Write-Host ""

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if Node.js is installed
function Test-Node {
    Write-Status "Checking Node.js installation..."
    try {
        $nodeVersion = node --version
        Write-Success "Node.js is installed: $nodeVersion"
        return $true
    }
    catch {
        Write-Error "Node.js is not installed. Please install Node.js v14 or higher."
        return $false
    }
}

# Check if Python is installed
function Test-Python {
    Write-Status "Checking Python installation..."
    try {
        $pythonVersion = python --version
        Write-Success "Python is installed: $pythonVersion"
        return $true
    }
    catch {
        Write-Error "Python 3 is not installed. Please install Python 3.7 or higher."
        return $false
    }
}

# Install Python dependencies
function Install-PythonDependencies {
    Write-Status "Installing Python dependencies..."
    Set-Location contracts
    
    if (Test-Path "requirements.txt") {
        pip install -r requirements.txt
        Write-Success "Python dependencies installed"
    }
    else {
        Write-Warning "No requirements.txt found in contracts directory"
    }
    
    Set-Location ..
}

# Install Node.js dependencies
function Install-NodeDependencies {
    Write-Status "Installing Node.js dependencies..."
    
    # Install root dependencies
    if (Test-Path "package.json") {
        npm install
        Write-Success "Root dependencies installed"
    }
    
    # Install backend dependencies
    if (Test-Path "backend/package.json") {
        Set-Location backend
        npm install
        Write-Success "Backend dependencies installed"
        Set-Location ..
    }
    
    # Install frontend dependencies
    if (Test-Path "frontend/package.json") {
        Set-Location frontend
        npm install
        Write-Success "Frontend dependencies installed"
        Set-Location ..
    }
}

# Compile smart contract
function Compile-Contract {
    Write-Status "Compiling smart contract..."
    Set-Location contracts
    
    if (Test-Path "algoease_contract.py") {
        python algoease_contract.py
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Smart contract compiled successfully"
        }
        else {
            Write-Error "Failed to compile smart contract"
            exit 1
        }
    }
    else {
        Write-Error "Smart contract source file not found"
        exit 1
    }
    
    Set-Location ..
}

# Check environment variables
function Test-Environment {
    Write-Status "Checking environment variables..."
    
    if ([string]::IsNullOrEmpty($CreatorMnemonic)) {
        Write-Warning "CREATOR_MNEMONIC not provided"
        Write-Status "Please set your creator mnemonic:"
        Write-Status "`$env:CREATOR_MNEMONIC = 'your mnemonic phrase here'"
        Write-Status ""
        Write-Status "You can get a test mnemonic from:"
        Write-Status "https://testnet.algoexplorer.io/dispenser"
        return $false
    }
    else {
        Write-Success "CREATOR_MNEMONIC is provided"
        return $true
    }
}

# Deploy smart contract
function Deploy-Contract {
    Write-Status "Deploying smart contract..."
    
    if (Test-Path "scripts/deploy-contract.js") {
        $env:CREATOR_MNEMONIC = $CreatorMnemonic
        node scripts/deploy-contract.js
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Smart contract deployed successfully"
        }
        else {
            Write-Error "Failed to deploy smart contract"
            exit 1
        }
    }
    else {
        Write-Error "Deploy script not found"
        exit 1
    }
}

# Test smart contract
function Test-Contract {
    Write-Status "Testing smart contract..."
    
    if (Test-Path "scripts/test-contract.js") {
        node scripts/test-contract.js
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Smart contract tests passed"
        }
        else {
            Write-Warning "Some smart contract tests failed"
        }
    }
    else {
        Write-Warning "Test script not found"
    }
}

# Create environment files
function New-EnvironmentFiles {
    Write-Status "Creating environment files..."
    
    # Backend .env
    if (-not (Test-Path "backend/.env")) {
        $backendEnv = @"
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
"@
        $backendEnv | Out-File -FilePath "backend/.env" -Encoding UTF8
        Write-Success "Backend .env file created"
    }
    else {
        Write-Warning "Backend .env file already exists"
    }
    
    # Frontend .env.local
    if (-not (Test-Path "frontend/.env.local")) {
        $frontendEnv = @"
# Algorand
REACT_APP_ALGOD_URL=https://testnet-api.algonode.cloud
REACT_APP_INDEXER_URL=https://testnet-idx.algonode.cloud
REACT_APP_NETWORK=testnet

# Contract
REACT_APP_CONTRACT_APP_ID=
REACT_APP_CONTRACT_ADDRESS=
"@
        $frontendEnv | Out-File -FilePath "frontend/.env.local" -Encoding UTF8
        Write-Success "Frontend .env.local file created"
    }
    else {
        Write-Warning "Frontend .env.local file already exists"
    }
}

# Main setup function
function Start-Setup {
    Write-Host "Starting setup process..." -ForegroundColor Blue
    Write-Host ""
    
    # Check prerequisites
    if (-not (Test-Node)) { exit 1 }
    if (-not (Test-Python)) { exit 1 }
    
    # Install dependencies
    Install-PythonDependencies
    Install-NodeDependencies
    
    # Compile contract
    Compile-Contract
    
    # Create environment files
    New-EnvironmentFiles
    
    # Check if we can deploy
    if (Test-Environment) {
        Write-Host ""
        Write-Status "Environment is ready for deployment"
        Write-Status "Run the following commands to deploy and test:"
        Write-Host ""
        Write-Status "1. Deploy the contract:"
        Write-Status "   node scripts/deploy-contract.js"
        Write-Host ""
        Write-Status "2. Test the contract:"
        Write-Status "   node scripts/test-contract.js"
        Write-Host ""
        Write-Status "3. Start the backend:"
        Write-Status "   cd backend; npm start"
        Write-Host ""
        Write-Status "4. Start the frontend:"
        Write-Status "   cd frontend; npm start"
        Write-Host ""
    }
    else {
        Write-Host ""
        Write-Warning "Please set your CREATOR_MNEMONIC and run the deployment commands manually"
        Write-Host ""
    }
    
    Write-Success "Setup completed!"
}

# Run setup
Start-Setup
