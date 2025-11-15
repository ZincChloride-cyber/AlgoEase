const hre = require("hardhat")

async function main() {
  console.log("🔄 Interacting with PolyOne Smart Contracts...")

  // Load deployment info
  const fs = require("fs")
  const path = require("path")
  
  const deploymentDir = path.join(__dirname, "../deployments")
  const files = fs.readdirSync(deploymentDir)
  const latestDeployment = files
    .filter(f => f.startsWith(hre.network.name))
    .sort()
    .reverse()[0]

  if (!latestDeployment) {
    console.error("❌ No deployment found for network:", hre.network.name)
    process.exit(1)
  }

  const deploymentInfo = JSON.parse(
    fs.readFileSync(path.join(deploymentDir, latestDeployment), "utf-8")
  )

  console.log("📋 Using deployment:", latestDeployment)
  console.log("📍 ChainFactory:", deploymentInfo.contracts.ChainFactory)

  // Get contract instance
  const ChainFactory = await hre.ethers.getContractFactory("ChainFactory")
  const chainFactory = ChainFactory.attach(deploymentInfo.contracts.ChainFactory)

  // Example: Create a test chain
  console.log("\n🚀 Creating a test chain...")
  
  const tx = await chainFactory.createChain(
    "Test zkRollup Chain",
    "public",
    "zk-rollup",
    "TEST",
    3,
    "https://rpc-test.polyone.io",
    "https://explorer-test.polyone.io"
  )

  console.log("⏳ Transaction hash:", tx.hash)
  await tx.wait()
  console.log("✅ Chain created!")

  // Get chain count
  const chainCount = await chainFactory.getTotalChains()
  console.log("\n📊 Total chains:", chainCount.toString())

  // Get user's chains
  const [signer] = await hre.ethers.getSigners()
  const userChains = await chainFactory.getUserChains(signer.address)
  console.log("👤 Your chains:", userChains.map(n => n.toString()))

  // Get chain details
  if (userChains.length > 0) {
    const chainId = userChains[0]
    const chain = await chainFactory.getChain(chainId)
    console.log("\n🔍 Chain Details:")
    console.log("  ID:", chain.id.toString())
    console.log("  Name:", chain.name)
    console.log("  Type:", chain.chainType)
    console.log("  Rollup:", chain.rollupType)
    console.log("  Gas Token:", chain.gasToken)
    console.log("  Validators:", chain.validators.toString())
    console.log("  Active:", chain.isActive)
    console.log("  RPC:", chain.rpcUrl)
  }

  console.log("\n✨ Interaction complete!")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Interaction failed:", error)
    process.exit(1)
  })

