// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ChainFactory
 * @dev Smart contract for managing blockchain deployments on PolyOne
 * Deployed on Polygon network
 */
contract ChainFactory {
    struct Chain {
        uint256 id;
        address owner;
        string name;
        string chainType; // "public", "private", "permissioned"
        string rollupType; // "zk-rollup", "optimistic-rollup", "validium"
        string gasToken;
        uint256 validators;
        uint256 createdAt;
        bool isActive;
        string rpcUrl;
        string explorerUrl;
    }

    mapping(uint256 => Chain) public chains;
    mapping(address => uint256[]) public userChains;
    uint256 public chainCount;

    event ChainCreated(
        uint256 indexed chainId,
        address indexed owner,
        string name,
        string chainType,
        string rollupType
    );

    event ChainUpdated(
        uint256 indexed chainId,
        bool isActive
    );

    event ChainDeleted(
        uint256 indexed chainId,
        address indexed owner
    );

    modifier onlyChainOwner(uint256 _chainId) {
        require(chains[_chainId].owner == msg.sender, "Not chain owner");
        _;
    }

    /**
     * @dev Create a new blockchain deployment
     */
    function createChain(
        string memory _name,
        string memory _chainType,
        string memory _rollupType,
        string memory _gasToken,
        uint256 _validators,
        string memory _rpcUrl,
        string memory _explorerUrl
    ) external returns (uint256) {
        chainCount++;
        uint256 newChainId = chainCount;

        Chain memory newChain = Chain({
            id: newChainId,
            owner: msg.sender,
            name: _name,
            chainType: _chainType,
            rollupType: _rollupType,
            gasToken: _gasToken,
            validators: _validators,
            createdAt: block.timestamp,
            isActive: true,
            rpcUrl: _rpcUrl,
            explorerUrl: _explorerUrl
        });

        chains[newChainId] = newChain;
        userChains[msg.sender].push(newChainId);

        emit ChainCreated(
            newChainId,
            msg.sender,
            _name,
            _chainType,
            _rollupType
        );

        return newChainId;
    }

    /**
     * @dev Update chain status
     */
    function updateChainStatus(uint256 _chainId, bool _isActive) 
        external 
        onlyChainOwner(_chainId) 
    {
        chains[_chainId].isActive = _isActive;
        emit ChainUpdated(_chainId, _isActive);
    }

    /**
     * @dev Delete a chain
     */
    function deleteChain(uint256 _chainId) 
        external 
        onlyChainOwner(_chainId) 
    {
        delete chains[_chainId];
        
        // Remove from user's chain list
        uint256[] storage userChainList = userChains[msg.sender];
        for (uint256 i = 0; i < userChainList.length; i++) {
            if (userChainList[i] == _chainId) {
                userChainList[i] = userChainList[userChainList.length - 1];
                userChainList.pop();
                break;
            }
        }

        emit ChainDeleted(_chainId, msg.sender);
    }

    /**
     * @dev Get all chains for a user
     */
    function getUserChains(address _user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userChains[_user];
    }

    /**
     * @dev Get chain details
     */
    function getChain(uint256 _chainId) 
        external 
        view 
        returns (Chain memory) 
    {
        return chains[_chainId];
    }

    /**
     * @dev Get total number of chains
     */
    function getTotalChains() external view returns (uint256) {
        return chainCount;
    }
}

