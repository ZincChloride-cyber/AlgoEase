require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config()

// Helper function to validate private key
function getPrivateKey() {
  const privateKey = process.env.PRIVATE_KEY
  
  // Check if private key exists and is not a placeholder
  if (!privateKey || 
      privateKey === "your_private_key_here" || 
      privateKey.trim() === "" ||
      !privateKey.startsWith("0x") ||
      privateKey.length !== 66) {
    return null
  }
  
  return privateKey
}

// Get valid private key
const privateKey = getPrivateKey()

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Polygon Mainnet
    polygon: {
      url: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
      accounts: privateKey ? [privateKey] : [],
      chainId: 137
    },
    // Polygon Amoy Testnet
    polygonAmoy: {
      url: process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
      accounts: privateKey ? [privateKey] : [],
      chainId: 80002
    },
    // Polygon zkEVM
    polygonZkEVM: {
      url: process.env.ZKEVM_RPC_URL || "https://zkevm-rpc.com",
      accounts: privateKey ? [privateKey] : [],
      chainId: 1101
    },
    // Polygon zkEVM Testnet
    polygonZkEVMTestnet: {
      url: "https://rpc.public.zkevm-test.net",
      accounts: privateKey ? [privateKey] : [],
      chainId: 1442
    },
    // Hardhat local network
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    }
  },
  etherscan: {
    apiKey: {
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || "",
      polygonZkEVM: process.env.ZKEVM_API_KEY || "",
      polygonZkEVMTestnet: process.env.ZKEVM_API_KEY || ""
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
}

