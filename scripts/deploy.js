const hre = require("hardhat")
require("dotenv").config()

async function main() {
  console.log("🚀 Deploying PolyOne Smart Contracts to Polygon Network...")

  // Check if private key is configured
  if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY === "your_private_key_here") {
    console.error("❌ Error: PRIVATE_KEY not configured in .env file")
    console.error("")
    console.error("Please create a .env file in the root directory with:")
    console.error("  PRIVATE_KEY=your_private_key_here")
    console.error("  POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology")
    console.error("")
    console.error("Get your private key from MetaMask:")
    console.error("  Settings → Security & Privacy → Reveal Private Key")
    process.exit(1)
  }

  // Get deployer account
  const signers = await hre.ethers.getSigners()
  if (!signers || signers.length === 0) {
    console.error("❌ Error: No signers available")
    console.error("")
    console.error("This usually means:")
    console.error("  1. PRIVATE_KEY is not set in .env file")
    console.error("  2. PRIVATE_KEY format is incorrect (should start with 0x)")
    console.error("  3. Network RPC URL is incorrect or unreachable")
    console.error("")
    console.error("Please check your .env file configuration")
    process.exit(1)
  }

  const deployer = signers[0]
  if (!deployer || !deployer.address) {
    console.error("❌ Error: Could not get deployer address")
    console.error("Please check your network configuration in hardhat.config.js")
    process.exit(1)
  }

  console.log("📝 Deploying contracts with account:", deployer.address)

  // Check account balance
  try {
    const balance = await hre.ethers.provider.getBalance(deployer.address)
    const balanceInEther = hre.ethers.formatEther(balance)
    const balanceAmount = parseFloat(balanceInEther)
    
    // Determine token name based on network
    const networkName = hre.network.name
    const isAmoy = networkName === "polygonAmoy" || hre.network.config.chainId === 80002
    const tokenName = isAmoy ? "POL" : "MATIC"
    
    console.log("💰 Account balance:", balanceInEther, tokenName)
    
    // Warn if balance is too low
    if (balanceAmount < 0.01) {
      console.warn(`⚠️  Warning: Low balance! You may not have enough ${tokenName} for deployment.`)
      if (isAmoy) {
        console.warn(`   Get test ${tokenName} (POL) from:`)
        console.warn("   - https://faucet.polygon.technology/")
        console.warn("   - https://www.alchemy.com/faucets/polygon-amoy")
        console.warn("   - https://faucets.chain.link/polygon-amoy")
      } else {
        console.warn(`   Get ${tokenName} from: https://faucet.polygon.technology/`)
      }
    }
  } catch (error) {
    console.error("❌ Error checking balance:", error.message)
    console.error("   This might indicate a network connection issue")
    console.error("   Please check your RPC URL in .env file")
    process.exit(1)
  }

  // Deploy ChainFactory
  console.log("\n🏗️  Deploying ChainFactory...")
  const ChainFactory = await hre.ethers.getContractFactory("ChainFactory")
  const chainFactory = await ChainFactory.deploy()
  await chainFactory.waitForDeployment()
  const chainFactoryAddress = await chainFactory.getAddress()
  console.log("✅ ChainFactory deployed to:", chainFactoryAddress)

  // Deploy ChainRegistry
  console.log("\n🏗️  Deploying ChainRegistry...")
  const ChainRegistry = await hre.ethers.getContractFactory("ChainRegistry")
  const chainRegistry = await ChainRegistry.deploy()
  await chainRegistry.waitForDeployment()
  const chainRegistryAddress = await chainRegistry.getAddress()
  console.log("✅ ChainRegistry deployed to:", chainRegistryAddress)

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    contracts: {
      ChainFactory: chainFactoryAddress,
      ChainRegistry: chainRegistryAddress
    },
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  }

  console.log("\n📋 Deployment Summary:")
  console.log(JSON.stringify(deploymentInfo, null, 2))

  // Save to file
  const fs = require("fs")
  const path = require("path")
  
  const deploymentDir = path.join(__dirname, "../deployments")
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true })
  }

  const deploymentFile = path.join(
    deploymentDir,
    `${hre.network.name}-${Date.now()}.json`
  )
  
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2))
  console.log("\n💾 Deployment info saved to:", deploymentFile)

  // Verification instructions
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n🔍 To verify contracts, run:")
    console.log(`npx hardhat verify --network ${hre.network.name} ${chainFactoryAddress}`)
    console.log(`npx hardhat verify --network ${hre.network.name} ${chainRegistryAddress}`)
  }

  console.log("\n✨ Deployment complete!")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed!")
    console.error("Error:", error.message)
    
    // Provide helpful error messages
    const networkName = hre.network.name
    const isAmoy = networkName === "polygonAmoy" || (hre.network.config && hre.network.config.chainId === 80002)
    const tokenName = isAmoy ? "POL" : "MATIC"
    
    if (error.message.includes("insufficient funds")) {
      console.error(`\n💡 Solution: Add more ${tokenName} to your wallet`)
      if (isAmoy) {
        console.error("   Testnet POL faucets:")
        console.error("   - https://faucet.polygon.technology/")
        console.error("   - https://www.alchemy.com/faucets/polygon-amoy")
        console.error("   - https://faucets.chain.link/polygon-amoy")
      } else {
        console.error("   Testnet: https://faucet.polygon.technology/")
      }
    } else if (error.message.includes("network") || error.message.includes("connection")) {
      console.error("\n💡 Solution: Check your RPC URL in .env file")
      console.error("   Polygon Amoy: https://rpc-amoy.polygon.technology")
    } else if (error.message.includes("private key") || error.message.includes("invalid")) {
      console.error("\n💡 Solution: Check your PRIVATE_KEY in .env file")
      console.error("   It should start with 0x and be 66 characters long")
    }
    
    console.error("\nFor more help, see DEPLOYMENT_GUIDE.md")
    process.exit(1)
  })

