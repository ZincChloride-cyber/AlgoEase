const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("ChainFactory", function () {
  let chainFactory
  let owner
  let user1
  let user2

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners()

    const ChainFactory = await ethers.getContractFactory("ChainFactory")
    chainFactory = await ChainFactory.deploy()
    await chainFactory.waitForDeployment()
  })

  describe("Deployment", function () {
    it("Should start with 0 chains", async function () {
      expect(await chainFactory.getTotalChains()).to.equal(0)
    })
  })

  describe("Chain Creation", function () {
    it("Should create a new chain", async function () {
      const tx = await chainFactory.createChain(
        "Test Chain",
        "public",
        "zk-rollup",
        "TEST",
        3,
        "https://rpc.test.io",
        "https://explorer.test.io"
      )

      await expect(tx)
        .to.emit(chainFactory, "ChainCreated")
        .withArgs(1, owner.address, "Test Chain", "public", "zk-rollup")

      expect(await chainFactory.getTotalChains()).to.equal(1)
    })

    it("Should assign chain to creator", async function () {
      await chainFactory.createChain(
        "Test Chain",
        "public",
        "zk-rollup",
        "TEST",
        3,
        "https://rpc.test.io",
        "https://explorer.test.io"
      )

      const userChains = await chainFactory.getUserChains(owner.address)
      expect(userChains.length).to.equal(1)
      expect(userChains[0]).to.equal(1)
    })

    it("Should store chain details correctly", async function () {
      await chainFactory.createChain(
        "Test Chain",
        "private",
        "optimistic-rollup",
        "OPTIM",
        5,
        "https://rpc.test.io",
        "https://explorer.test.io"
      )

      const chain = await chainFactory.getChain(1)
      expect(chain.name).to.equal("Test Chain")
      expect(chain.chainType).to.equal("private")
      expect(chain.rollupType).to.equal("optimistic-rollup")
      expect(chain.gasToken).to.equal("OPTIM")
      expect(chain.validators).to.equal(5)
      expect(chain.isActive).to.equal(true)
      expect(chain.owner).to.equal(owner.address)
    })
  })

  describe("Chain Management", function () {
    beforeEach(async function () {
      await chainFactory.createChain(
        "Test Chain",
        "public",
        "zk-rollup",
        "TEST",
        3,
        "https://rpc.test.io",
        "https://explorer.test.io"
      )
    })

    it("Should update chain status", async function () {
      await chainFactory.updateChainStatus(1, false)
      
      const chain = await chainFactory.getChain(1)
      expect(chain.isActive).to.equal(false)
    })

    it("Should prevent non-owner from updating", async function () {
      await expect(
        chainFactory.connect(user1).updateChainStatus(1, false)
      ).to.be.revertedWith("Not chain owner")
    })

    it("Should delete chain", async function () {
      await chainFactory.deleteChain(1)
      
      const chain = await chainFactory.getChain(1)
      expect(chain.id).to.equal(0) // Default value for deleted chain
    })

    it("Should prevent non-owner from deleting", async function () {
      await expect(
        chainFactory.connect(user1).deleteChain(1)
      ).to.be.revertedWith("Not chain owner")
    })
  })

  describe("Multiple Users", function () {
    it("Should allow multiple users to create chains", async function () {
      await chainFactory.connect(user1).createChain(
        "User1 Chain",
        "public",
        "zk-rollup",
        "U1",
        3,
        "https://rpc1.io",
        "https://exp1.io"
      )

      await chainFactory.connect(user2).createChain(
        "User2 Chain",
        "private",
        "validium",
        "U2",
        5,
        "https://rpc2.io",
        "https://exp2.io"
      )

      const user1Chains = await chainFactory.getUserChains(user1.address)
      const user2Chains = await chainFactory.getUserChains(user2.address)

      expect(user1Chains.length).to.equal(1)
      expect(user2Chains.length).to.equal(1)
      expect(await chainFactory.getTotalChains()).to.equal(2)
    })
  })
})

