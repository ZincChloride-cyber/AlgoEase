const { exec } = require('child_process')
const hre = require("hardhat")
require("dotenv").config()

const WALLET_ADDRESS = "0xCF2E0DBEde2B76d79c7D3bd5c6FD3eC4CD8BbeB8"

const FAUCETS = [
  {
    name: "Polygon Official Faucet",
    url: `https://faucet.polygon.technology/?address=${WALLET_ADDRESS}`,
    amount: "Variable",
    cooldown: "24 hours"
  },
  {
    name: "Alchemy Faucet",
    url: "https://www.alchemy.com/faucets/polygon-amoy",
    amount: "Up to 1 POL/day",
    cooldown: "24 hours"
  },
  {
    name: "Chainlink Faucet",
    url: "https://faucets.chain.link/polygon-amoy",
    amount: "0.5 POL/request",
    cooldown: "24 hours"
  },
  {
    name: "Tatum Faucet",
    url: "https://tatum.io/faucets/amoy",
    amount: "0.005 POL/day",
    cooldown: "24 hours"
  }
]

function openUrl(url) {
  const platform = process.platform
  let command
  
  if (platform === 'win32') {
    command = `start "" "${url}"`
  } else if (platform === 'darwin') {
    command = `open "${url}"`
  } else {
    command = `xdg-open "${url}"`
  }
  
  exec(command, (error) => {
    if (error) {
      console.log(`   ⚠️  Could not open browser automatically`)
      console.log(`   📋 Please copy and paste this URL: ${url}`)
    }
  })
}

async function checkBalance() {
  try {
    // Use the same network as the deploy script
    const signers = await hre.ethers.getSigners()
    if (!signers || signers.length === 0) {
      return null
    }
    
    const deployer = signers[0]
    const balance = await hre.ethers.provider.getBalance(deployer.address)
    const balanceInEther = hre.ethers.formatEther(balance)
    return parseFloat(balanceInEther)
  } catch (error) {
    console.error("Error checking balance:", error.message)
    return null
  }
}

async function main() {
  console.log("🚰 Getting Test POL Tokens for Polygon Amoy Testnet")
  console.log("=" .repeat(60))
  console.log("")
  console.log("📝 Your Wallet Address:")
  console.log(`   ${WALLET_ADDRESS}`)
  console.log("")
  
  // Check current balance
  console.log("🔍 Checking current balance...")
  const currentBalance = await checkBalance()
  
  if (currentBalance !== null && currentBalance > 0) {
    console.log(`💰 Current Balance: ${currentBalance.toFixed(4)} POL`)
    console.log("")
    if (currentBalance >= 0.1) {
      console.log("✅ You have enough POL! You can deploy now.")
      console.log("   Run: npm run deploy:amoy")
      return
    } else {
      console.log("⚠️  You have some POL, but you may need more for deployment.")
      console.log("   Recommended: At least 0.1 POL")
      console.log("")
    }
  } else {
    console.log("💰 Current Balance: 0.0000 POL")
    console.log("")
  }
  
  console.log("📋 Available Faucets:")
  console.log("")
  
  FAUCETS.forEach((faucet, index) => {
    console.log(`${index + 1}. ${faucet.name}`)
    console.log(`   Amount: ${faucet.amount}`)
    console.log(`   Cooldown: ${faucet.cooldown}`)
    console.log(`   URL: ${faucet.url}`)
    console.log("")
  })
  
  console.log("🌐 Opening faucet pages in your browser...")
  console.log("")
  console.log("📝 Instructions:")
  console.log("   1. Complete the CAPTCHA on each faucet")
  console.log("   2. Enter or verify your wallet address")
  console.log("   3. Request POL tokens")
  console.log("   4. Wait 1-2 minutes for tokens to arrive")
  console.log("   5. Run 'npm run check:balance' to verify")
  console.log("")
  
  // Open all faucets
  console.log("🔗 Opening faucets...")
  FAUCETS.forEach((faucet, index) => {
    setTimeout(() => {
      console.log(`   Opening ${faucet.name}...`)
      openUrl(faucet.url)
    }, index * 1000) // Stagger the opens
  })
  
  console.log("")
  console.log("⏳ After requesting from faucets, wait 1-2 minutes, then run:")
  console.log("   npm run check:balance")
  console.log("")
  console.log("🚀 Once you have POL, deploy with:")
  console.log("   npm run deploy:amoy")
  console.log("")
}

main()
  .then(() => {
    // Keep process alive for a bit to allow browser opens
    setTimeout(() => process.exit(0), 5000)
  })
  .catch((error) => {
    console.error("❌ Error:", error.message)
    process.exit(1)
  })

