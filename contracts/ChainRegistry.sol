// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ChainRegistry
 * @dev Registry for deployed chains with metadata and verification
 */
contract ChainRegistry {
    struct ChainMetadata {
        uint256 chainId;
        address contractAddress;
        string name;
        string symbol;
        uint256 deployedBlock;
        bool verified;
        string cdkVersion;
        string zkevmVersion;
    }

    mapping(uint256 => ChainMetadata) public chainMetadata;
    mapping(address => bool) public verifiedDeployers;
    
    address public owner;
    uint256 public registeredChainCount;

    event ChainRegistered(
        uint256 indexed chainId,
        address indexed contractAddress,
        string name
    );

    event ChainVerified(
        uint256 indexed chainId,
        address verifier
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        verifiedDeployers[msg.sender] = true;
    }

    /**
     * @dev Register a new chain in the registry
     */
    function registerChain(
        uint256 _chainId,
        address _contractAddress,
        string memory _name,
        string memory _symbol,
        string memory _cdkVersion,
        string memory _zkevmVersion
    ) external {
        require(chainMetadata[_chainId].chainId == 0, "Chain already registered");

        ChainMetadata memory metadata = ChainMetadata({
            chainId: _chainId,
            contractAddress: _contractAddress,
            name: _name,
            symbol: _symbol,
            deployedBlock: block.number,
            verified: verifiedDeployers[msg.sender],
            cdkVersion: _cdkVersion,
            zkevmVersion: _zkevmVersion
        });

        chainMetadata[_chainId] = metadata;
        registeredChainCount++;

        emit ChainRegistered(_chainId, _contractAddress, _name);
    }

    /**
     * @dev Verify a chain
     */
    function verifyChain(uint256 _chainId) external onlyOwner {
        require(chainMetadata[_chainId].chainId != 0, "Chain not registered");
        
        chainMetadata[_chainId].verified = true;
        
        emit ChainVerified(_chainId, msg.sender);
    }

    /**
     * @dev Add verified deployer
     */
    function addVerifiedDeployer(address _deployer) external onlyOwner {
        verifiedDeployers[_deployer] = true;
    }

    /**
     * @dev Get chain metadata
     */
    function getChainMetadata(uint256 _chainId) 
        external 
        view 
        returns (ChainMetadata memory) 
    {
        return chainMetadata[_chainId];
    }

    /**
     * @dev Check if chain is verified
     */
    function isChainVerified(uint256 _chainId) 
        external 
        view 
        returns (bool) 
    {
        return chainMetadata[_chainId].verified;
    }
}

