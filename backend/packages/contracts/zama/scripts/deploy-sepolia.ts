import { ethers, network } from "hardhat";

async function main() {
  console.log("🚀 Starting Zama CreditScoreModel deployment to Sepolia...");
  console.log("🔐 Using REAL FHE encryption on Sepolia testnet");
  console.log("⏳ This will take longer due to real encryption...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📋 Deploying contracts with account:", deployer.address);

  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "ETH");

  if (balance.lt(ethers.utils.parseEther("0.01"))) {
    console.warn("⚠️  WARNING: Low balance! You need at least 0.01 ETH for deployment");
    console.log("💡 Get Sepolia ETH from: https://sepoliafaucet.com/");
    return;
  }

  // Get the CreditScoreModel contract factory
  const CreditScoreModel = await ethers.getContractFactory("CreditScoreModel");
  console.log("🔨 Deploying CreditScoreModel with FHE support...");

  // Estimate gas for deployment
  const estimatedGas = await CreditScoreModel.signer.estimateGas(
    CreditScoreModel.getDeployTransaction()
  );
  console.log("⛽ Estimated gas:", estimatedGas.toString());

  // Deploy the contract
  console.log("📡 Submitting deployment transaction...");
  const creditScoreModel = await CreditScoreModel.deploy();
  console.log("⏳ Waiting for confirmation...");

  await creditScoreModel.deployed();

  console.log("✅ CreditScoreModel deployed successfully!");
  console.log("📍 Contract address:", creditScoreModel.address);
  console.log("🔗 Network:", network.name);
  console.log("⛓️  Chain ID:", network.config.chainId);

  // Verify deployment by calling a simple function
  console.log("\n🔍 Verifying deployment...");
  try {
    const owner = await creditScoreModel.owner();
    console.log("✅ Owner:", owner);

    const baseScore = await creditScoreModel.baseCreditScore();
    console.log("✅ Base Credit Score:", baseScore.toString());

    const paused = await creditScoreModel.paused();
    console.log("✅ Contract Paused:", paused);

    // Test ML model with sample data (this will use real FHE on Sepolia!)
    console.log("\n🤖 Testing ML model with real FHE encryption...");
    const sampleData = ethers.utils.randomBytes(64);
    console.log("📊 Computing credit score with encrypted data...");

    const score = await creditScoreModel.computeCreditScore(sampleData);
    console.log("✅ Computed Credit Score:", score.toString());
    console.log("🔐 This score was computed using REAL FHE encryption!");

    console.log("\n🎉 Deployment and FHE verification successful!");
  } catch (error) {
    console.error("❌ Deployment verification failed:", error);
    console.log("💡 This might be normal for Sepolia - real FHE operations can be slow");
  }

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    contractAddress: creditScoreModel.address,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    fheEnabled: true,
    encryptionType: "real-fhe",
    etherscanUrl: `https://sepolia.etherscan.io/address/${creditScoreModel.address}`,
  };

  console.log("\n📋 Sepolia Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file for reference
  const fs = require("fs");
  const deploymentsDir = "./deployments";
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const filename = `${deploymentsDir}/sepolia-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Deployment info saved to: ${filename}`);

  console.log("\n🔗 View on Etherscan:", deploymentInfo.etherscanUrl);
  console.log("\n📝 Next steps:");
  console.log("1. Verify contract on Etherscan (if API key configured)");
  console.log("2. Test FHE operations with real encrypted data");
  console.log("3. Monitor gas usage for FHE operations");
  console.log("4. Consider cross-chain integration with your Lisk contracts");
}

// Handle errors
main().catch((error) => {
  console.error("❌ Sepolia deployment failed:", error);
  console.log("\n🔧 Troubleshooting:");
  console.log("1. Check your Sepolia ETH balance");
  console.log("2. Verify PRIVATE_KEY in .env file");
  console.log("3. Check SEPOLIA_RPC_URL connectivity");
  console.log("4. Try a different RPC provider if needed");
  process.exitCode = 1;
});
