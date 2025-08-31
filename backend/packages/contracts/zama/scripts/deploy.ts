import { ethers, network } from "hardhat";

async function main() {
  console.log("🚀 Starting Zama CreditScoreModel deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📋 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.getBalance()).toString());

  // Get the CreditScoreModel contract factory
  const CreditScoreModel = await ethers.getContractFactory("CreditScoreModel");
  console.log("🔨 Deploying CreditScoreModel...");

  // Deploy the contract
  const creditScoreModel = await CreditScoreModel.deploy();
  await creditScoreModel.deployed();

  console.log("✅ CreditScoreModel deployed successfully!");
  console.log("📍 Contract address:", creditScoreModel.address);
  console.log("🔗 Network:", network.name);
  console.log("⛓️  Chain ID:", network.config.chainId);

  // Verify deployment by calling a simple function
  try {
    const owner = await creditScoreModel.owner();
    console.log("👤 Contract owner:", owner);

    const baseScore = await creditScoreModel.baseCreditScore();
    console.log("📊 Base credit score:", baseScore.toString());

    console.log("🎉 Deployment verification successful!");
  } catch (error) {
    console.error("❌ Deployment verification failed:", error);
  }

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    contractAddress: creditScoreModel.address,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file for reference
  const fs = require("fs");
  const deploymentsDir = "./deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const filename = `${deploymentsDir}/${network.name}-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Deployment info saved to: ${filename}`);
}

// Handle errors
main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
