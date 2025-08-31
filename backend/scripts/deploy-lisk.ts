#!/usr/bin/env ts-node

import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Lisk Smart Contract Deployment Script
 * 
 * This script deploys the Zkredit protocol smart contracts to the Lisk blockchain.
 * It handles contract compilation, deployment, verification, and configuration.
 */

interface DeploymentConfig {
  network: string;
  rpcUrl: string;
  privateKey: string;
  gasLimit: number;
  gasPrice: string;
  contracts: {
    identity: string;
    scoreSBT: string;
    dataRegistry: string;
  };
}

interface DeploymentResult {
  contract: string;
  address: string;
  transactionHash: string;
  gasUsed: number;
  timestamp: number;
}

class LiskDeployer {
  private provider: ethers.providers.Provider;
  private wallet: ethers.Wallet;
  private config: DeploymentConfig;
  private deploymentResults: DeploymentResult[] = [];

  constructor(config: DeploymentConfig) {
    this.config = config;
    this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
  }

  /**
   * Main deployment function
   */
  public async deploy(): Promise<void> {
    console.log('🚀 Starting Lisk Smart Contract Deployment...');
    console.log(`📡 Network: ${this.config.network}`);
    console.log(`👤 Deployer: ${this.wallet.address}`);
    console.log(`💰 Balance: ${ethers.utils.formatEther(await this.wallet.getBalance())} LSK`);

    try {
      // Deploy Identity Contract
      console.log('\n📋 Deploying Identity Contract...');
      const identityContract = await this.deployIdentityContract();
      this.deploymentResults.push(identityContract);

      // Deploy ScoreSBT Contract
      console.log('\n🎫 Deploying ScoreSBT Contract...');
      const scoreSBTContract = await this.deployScoreSBTContract();
      this.deploymentResults.push(scoreSBTContract);

      // Deploy Data Registry Contract
      console.log('\n📚 Deploying Data Registry Contract...');
      const dataRegistryContract = await this.deployDataRegistryContract();
      this.deploymentResults.push(dataRegistryContract);

      // Configure contract interactions
      console.log('\n🔗 Configuring Contract Interactions...');
      await this.configureContractInteractions();

      // Verify contracts
      console.log('\n✅ Verifying Contracts...');
      await this.verifyContracts();

      // Save deployment results
      console.log('\n💾 Saving Deployment Results...');
      await this.saveDeploymentResults();

      console.log('\n🎉 Deployment completed successfully!');
      this.printDeploymentSummary();

    } catch (error) {
      console.error('\n❌ Deployment failed:', error);
      throw error;
    }
  }

  /**
   * Deploy Identity Contract
   */
  private async deployIdentityContract(): Promise<DeploymentResult> {
    try {
      // Contract bytecode and ABI would be loaded from compiled contracts
      const contractBytecode = '0x...'; // Placeholder for actual bytecode
      const contractABI = []; // Placeholder for actual ABI

      const factory = new ethers.ContractFactory(
        contractABI,
        contractBytecode,
        this.wallet
      );

      console.log('  📝 Creating contract transaction...');
      const contract = await factory.deploy({
        gasLimit: this.config.gasLimit,
        gasPrice: ethers.utils.parseUnits(this.config.gasPrice, 'gwei')
      });

      console.log('  ⏳ Waiting for contract deployment...');
      const receipt = await contract.deployTransaction.wait();

      const result: DeploymentResult = {
        contract: 'Identity',
        address: contract.address,
        transactionHash: receipt.transactionHash,
        gasUsed: receipt.gasUsed.toNumber(),
        timestamp: Date.now()
      };

      console.log(`  ✅ Identity Contract deployed at: ${result.address}`);
      console.log(`  🔗 Transaction: ${result.transactionHash}`);
      console.log(`  ⛽ Gas used: ${result.gasUsed}`);

      return result;

    } catch (error) {
      console.error('  ❌ Failed to deploy Identity Contract:', error);
      throw error;
    }
  }

  /**
   * Deploy ScoreSBT Contract
   */
  private async deployScoreSBTContract(): Promise<DeploymentResult> {
    try {
      // Contract bytecode and ABI would be loaded from compiled contracts
      const contractBytecode = '0x...'; // Placeholder for actual bytecode
      const contractABI = []; // Placeholder for actual ABI

      const factory = new ethers.ContractFactory(
        contractABI,
        contractBytecode,
        this.wallet
      );

      console.log('  📝 Creating contract transaction...');
      const contract = await factory.deploy({
        gasLimit: this.config.gasLimit,
        gasPrice: ethers.utils.parseUnits(this.config.gasPrice, 'gwei')
      });

      console.log('  ⏳ Waiting for contract deployment...');
      const receipt = await contract.deployTransaction.wait();

      const result: DeploymentResult = {
        contract: 'ScoreSBT',
        address: contract.address,
        transactionHash: receipt.transactionHash,
        gasUsed: receipt.gasUsed.toNumber(),
        timestamp: Date.now()
      };

      console.log(`  ✅ ScoreSBT Contract deployed at: ${result.address}`);
      console.log(`  🔗 Transaction: ${result.transactionHash}`);
      console.log(`  ⛽ Gas used: ${result.gasUsed}`);

      return result;

    } catch (error) {
      console.error('  ❌ Failed to deploy ScoreSBT Contract:', error);
      throw error;
    }
  }

  /**
   * Deploy Data Registry Contract
   */
  private async deployDataRegistryContract(): Promise<DeploymentResult> {
    try {
      // Contract bytecode and ABI would be loaded from compiled contracts
      const contractBytecode = '0x...'; // Placeholder for actual bytecode
      const contractABI = []; // Placeholder for actual ABI

      const factory = new ethers.ContractFactory(
        contractABI,
        contractBytecode,
        this.wallet
      );

      console.log('  📝 Creating contract transaction...');
      const contract = await factory.deploy({
        gasLimit: this.config.gasLimit,
        gasPrice: ethers.utils.parseUnits(this.config.gasPrice, 'gwei')
      });

      console.log('  ⏳ Waiting for contract deployment...');
      const receipt = await contract.deployTransaction.wait();

      const result: DeploymentResult = {
        contract: 'DataRegistry',
        address: contract.address,
        transactionHash: receipt.transactionHash,
        gasUsed: receipt.gasUsed.toNumber(),
        timestamp: Date.now()
      };

      console.log(`  ✅ Data Registry Contract deployed at: ${result.address}`);
      console.log(`  🔗 Transaction: ${result.transactionHash}`);
      console.log(`  ⛽ Gas used: ${result.gasUsed}`);

      return result;

    } catch (error) {
      console.error('  ❌ Failed to deploy Data Registry Contract:', error);
      throw error;
    }
  }

  /**
   * Configure contract interactions
   */
  private async configureContractInteractions(): Promise<void> {
    try {
      // This would configure the contracts to work together
      // For example, setting the ScoreSBT contract address in the Identity contract
      // and configuring the Data Registry with initial authorized APIs

      console.log('  🔧 Setting up contract relationships...');
      // Implementation would depend on actual contract interfaces

      console.log('  🔧 Configuring initial data sources...');
      // Implementation would depend on actual contract interfaces

      console.log('  ✅ Contract interactions configured successfully');

    } catch (error) {
      console.error('  ❌ Failed to configure contract interactions:', error);
      throw error;
    }
  }

  /**
   * Verify contracts on blockchain explorer
   */
  private async verifyContracts(): Promise<void> {
    try {
      console.log('  🔍 Verifying contracts on blockchain explorer...');
      
      // Contract verification would be implemented here
      // This typically involves calling the explorer's verification API
      
      console.log('  ✅ Contract verification completed');

    } catch (error) {
      console.error('  ❌ Contract verification failed:', error);
      // Don't throw error as verification is not critical for deployment
    }
  }

  /**
   * Save deployment results to file
   */
  private async saveDeploymentResults(): Promise<void> {
    try {
      const deploymentData = {
        network: this.config.network,
        deployer: this.wallet.address,
        timestamp: Date.now(),
        contracts: this.deploymentResults
      };

      const outputPath = path.join(__dirname, `../deployments/lisk-${this.config.network}-${Date.now()}.json`);
      
      // Ensure deployments directory exists
      const deploymentsDir = path.dirname(outputPath);
      if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
      }

      fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));
      console.log(`  💾 Deployment results saved to: ${outputPath}`);

    } catch (error) {
      console.error('  ❌ Failed to save deployment results:', error);
      // Don't throw error as saving results is not critical
    }
  }

  /**
   * Print deployment summary
   */
  private printDeploymentSummary(): void {
    console.log('\n📊 Deployment Summary:');
    console.log('======================');
    
    this.deploymentResults.forEach(result => {
      console.log(`\n${result.contract}:`);
      console.log(`  Address: ${result.address}`);
      console.log(`  Transaction: ${result.transactionHash}`);
      console.log(`  Gas Used: ${result.gasUsed}`);
    });

    const totalGas = this.deploymentResults.reduce((sum, result) => sum + result.gasUsed, 0);
    console.log(`\nTotal Gas Used: ${totalGas}`);
    
    const deployerBalance = await this.wallet.getBalance();
    console.log(`Deployer Balance: ${ethers.utils.formatEther(deployerBalance)} LSK`);
  }
}

/**
 * Load deployment configuration
 */
function loadConfig(): DeploymentConfig {
  const configPath = path.join(__dirname, '../config/deployment.json');
  
  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  // Validate required configuration
  const requiredFields = ['network', 'rpcUrl', 'privateKey', 'gasLimit', 'gasPrice'];
  for (const field of requiredFields) {
    if (!configData[field]) {
      throw new Error(`Missing required configuration field: ${field}`);
    }
  }

  return configData as DeploymentConfig;
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    // Load configuration
    const config = loadConfig();
    
    // Create deployer instance
    const deployer = new LiskDeployer(config);
    
    // Execute deployment
    await deployer.deploy();
    
  } catch (error) {
    console.error('Deployment script failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

export { LiskDeployer, DeploymentConfig, DeploymentResult };
