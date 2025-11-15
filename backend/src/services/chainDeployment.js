const { exec } = require('child_process');
const util = require('util');
const winston = require('winston');
const fs = require('fs').promises;
const path = require('path');
const { initializeCDKChain, deployCDKNodes, getChainStatus } = require('./polygonCDK');
const { registerChainWithAggLayer } = require('./agglayer');
const { setupPolygonBridge } = require('./polygonBridge');

const execPromise = util.promisify(exec);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/deployment.log' })
  ]
});

/**
 * Deploy a new blockchain using Polygon CDK
 * @param {string} chainId - Unique chain identifier
 * @param {object} config - Chain configuration
 * @returns {Promise<object>} Deployment result
 */
async function deployChain(chainId, config) {
  logger.info(`Starting deployment for chain ${chainId}`);
  
  try {
    // Step 1: Initialize Polygon CDK chain configuration
    logger.info(`Initializing Polygon CDK for ${config.name}`);
    const cdkResult = await initializeCDKChain(chainId, {
      name: config.name,
      rollupType: config.rollupType,
      gasToken: config.gasToken,
      chainType: config.chainType,
      validatorAccess: config.validatorAccess || 'public',
      validators: config.validators || 3,
      blockTime: config.blockTime || 2,
      gasLimit: config.gasLimit || '0x1312D00'
    });
    
    // Step 2: Deploy Polygon CDK nodes using Docker
    logger.info(`Deploying Polygon CDK nodes with Docker`);
    const deploymentResult = await deployCDKNodes(chainId, cdkResult.config);
    
    if (!deploymentResult.success) {
      throw new Error('Failed to deploy CDK nodes');
    }
    
    // Step 3: Register chain with AggLayer
    logger.info(`Registering chain with AggLayer`);
    const agglayerResult = await registerChainWithAggLayer(chainId, {
      name: config.name,
      rollupType: config.rollupType,
      rpcUrl: `http://localhost:8545`,
      explorerUrl: `https://explorer-${chainId.substring(0, 8)}.polyone.io`,
      bridgeAddress: '0x...', // Will be set after bridge deployment
      zkEVMAddress: '0x...',
      chainId: cdkResult.config.chainId
    });
    
    // Step 4: Setup Polygon PoS bridge
    logger.info(`Setting up Polygon PoS bridge`);
    const bridgeResult = await setupPolygonBridge(chainId, {
      name: config.name,
      chainId: cdkResult.config.chainId,
      rpcUrl: `http://localhost:8545`,
      gasToken: config.gasToken,
      bridgeAddress: '0x...'
    });
    
    // Step 5: Initialize monitoring
    logger.info(`Initializing monitoring services`);
    await setupMonitoring(chainId, config);
    
    // Step 6: Save deployment status
    const chainDir = path.join(process.cwd(), 'chains', chainId);
    const statusData = {
      chainId,
      status: 'active',
      deployedAt: new Date().toISOString(),
      cdk: cdkResult,
      agglayer: agglayerResult,
      bridge: bridgeResult,
      endpoints: {
        rpc: `http://localhost:8545`,
        ws: `ws://localhost:8546`,
        explorer: `https://explorer-${chainId.substring(0, 8)}.polyone.io`,
        bridge: bridgeResult.endpoints.bridgeUrl
      }
    };
    
    await fs.writeFile(
      path.join(chainDir, 'status.json'),
      JSON.stringify(statusData, null, 2)
    );
    
    logger.info(`Successfully deployed chain ${chainId}`);
    
    return {
      success: true,
      chainId,
      status: 'active',
      endpoints: statusData.endpoints,
      agglayerChainId: agglayerResult.agglayerChainId,
      validatorKeys: cdkResult.validatorKeys
    };
  } catch (error) {
    logger.error(`Deployment failed for chain ${chainId}:`, error);
    
    // Save error status
    try {
      const chainDir = path.join(process.cwd(), 'chains', chainId);
      await fs.mkdir(chainDir, { recursive: true });
      await fs.writeFile(
        path.join(chainDir, 'status.json'),
        JSON.stringify({
          chainId,
          status: 'failed',
          error: error.message,
          failedAt: new Date().toISOString()
        }, null, 2)
      );
    } catch (writeError) {
      logger.error(`Failed to write error status:`, writeError);
    }
    
    throw error;
  }
}

async function setupMonitoring(chainId, config) {
  try {
    const chainDir = path.join(process.cwd(), 'chains', chainId);
    const monitoringDir = path.join(chainDir, 'monitoring');
    await fs.mkdir(monitoringDir, { recursive: true });
    
    // Create Prometheus scrape config for this chain
    const prometheusConfig = {
      job_name: `chain-${chainId}`,
      scrape_interval: '15s',
      static_configs: [{
        targets: ['localhost:9090']
      }]
    };
    
    await fs.writeFile(
      path.join(monitoringDir, 'prometheus-config.json'),
      JSON.stringify(prometheusConfig, null, 2)
    );
    
    logger.info(`Monitoring configuration created for chain ${chainId}`);
  } catch (error) {
    logger.error(`Failed to setup monitoring:`, error);
    // Don't throw - monitoring setup failure shouldn't break deployment
  }
}

/**
 * Stop a running chain
 * @param {string} chainId - Chain identifier
 */
async function stopChain(chainId) {
  logger.info(`Stopping chain ${chainId}`);
  
  try {
    const chainDir = path.join(process.cwd(), 'chains', chainId);
    const dockerComposePath = path.join(chainDir, 'docker-compose.yml');
    
    // Check if docker-compose file exists
    try {
      await fs.access(dockerComposePath);
      
      // Stop Docker containers
      const { stdout, stderr } = await execPromise(
        `cd ${chainDir} && docker-compose down`,
        { timeout: 60000 }
      );
      
      logger.info(`Stopped chain ${chainId} containers`);
      
      // Update status
      const statusPath = path.join(chainDir, 'status.json');
      try {
        const statusData = JSON.parse(await fs.readFile(statusPath, 'utf8'));
        statusData.status = 'stopped';
        statusData.stoppedAt = new Date().toISOString();
        await fs.writeFile(statusPath, JSON.stringify(statusData, null, 2));
      } catch (e) {
        // Status file doesn't exist, create it
        await fs.writeFile(statusPath, JSON.stringify({
          chainId,
          status: 'stopped',
          stoppedAt: new Date().toISOString()
        }, null, 2));
      }
      
      return { success: true, chainId };
    } catch (error) {
      logger.warn(`Docker compose file not found for chain ${chainId}, marking as stopped`);
      return { success: true, chainId, note: 'No containers found' };
    }
  } catch (error) {
    logger.error(`Failed to stop chain ${chainId}:`, error);
    throw error;
  }
}

/**
 * Restart a chain
 * @param {string} chainId - Chain identifier
 */
async function restartChain(chainId) {
  logger.info(`Restarting chain ${chainId}`);
  
  try {
    await stopChain(chainId);
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Restart using docker-compose
    const chainDir = path.join(process.cwd(), 'chains', chainId);
    const dockerComposePath = path.join(chainDir, 'docker-compose.yml');
    
    try {
      await fs.access(dockerComposePath);
      
      const { stdout, stderr } = await execPromise(
        `cd ${chainDir} && docker-compose up -d`,
        { timeout: 120000 }
      );
      
      logger.info(`Restarted chain ${chainId}`);
      
      // Update status
      const statusPath = path.join(chainDir, 'status.json');
      try {
        const statusData = JSON.parse(await fs.readFile(statusPath, 'utf8'));
        statusData.status = 'active';
        statusData.restartedAt = new Date().toISOString();
        await fs.writeFile(statusPath, JSON.stringify(statusData, null, 2));
      } catch (e) {
        // Status file doesn't exist
      }
      
      return { success: true, chainId };
    } catch (error) {
      throw new Error(`Failed to restart chain: ${error.message}`);
    }
  } catch (error) {
    logger.error(`Failed to restart chain ${chainId}:`, error);
    throw error;
  }
}

/**
 * Get deployment status for a chain
 * @param {string} chainId - Chain identifier
 * @returns {Promise<object>} Deployment status
 */
async function getDeploymentStatus(chainId) {
  try {
    const chainStatus = await getChainStatus(chainId);
    return chainStatus;
  } catch (error) {
    logger.error(`Failed to get deployment status for ${chainId}:`, error);
    return { status: 'unknown', error: error.message };
  }
}

module.exports = {
  deployChain,
  stopChain,
  restartChain,
  getDeploymentStatus
};

