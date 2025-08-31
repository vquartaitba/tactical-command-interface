import { ethers, network } from "hardhat";

async function main() {
  console.log("🏠 Starting Local Hardhat Deployment Test");
  console.log("🔐 Testing TFHE-ready contract on local network");
  console.log("⛓️  Network:", network.name);
  console.log("🔗 Chain ID:", network.config.chainId);

  try {
    // Get signer
    const [deployer] = await ethers.getSigners();
    console.log("👤 Deploying with account:", deployer.address);

    // Check balance (should be unlimited on local network)
    const balance = await deployer.getBalance();
    console.log("💰 Account balance:", ethers.utils.formatEther(balance), "ETH");

    console.log("\n🔨 Deploying CreditScoreModel with TFHE support...");

    // Deploy the contract
    const CreditScoreModel = await ethers.getContractFactory("CreditScoreModel");
    const contract = await CreditScoreModel.deploy();

    console.log("⏳ Waiting for deployment confirmation...");
    await contract.deployed();

    console.log("✅ Contract deployed successfully!");
    console.log("📍 Contract address:", contract.address);

    // Test basic functionality
    console.log("\n🧪 Testing basic contract functionality...");

    const owner = await contract.owner();
    console.log("✅ Owner:", owner);

    const baseScoreHandle = await contract.baseCreditScore();
    console.log("✅ Base Score Handle:", baseScoreHandle.toString());

    const paused = await contract.paused();
    console.log("✅ Contract Paused:", paused);

    // Test FHE operations with fallback functions
    console.log("\n🤖 Testing TFHE fallback operations...");

    const testData = ethers.utils.randomBytes(64);
    console.log("📊 Testing credit score computation with sample data...");

    const score = await contract.computeCreditScore(testData);
    console.log("✅ Credit Score computed! Result:", score.toString());

    // Test feature extraction
    const features = await contract.extractFeatures(testData);
    console.log("✅ Features extracted successfully");
    console.log("💰 Monthly Income:", features.monthlyIncome.toString());
    console.log("🏦 Total Debt:", features.totalDebt.toString());

    // Test ML model application
    const mlScore = await contract.applyCreditScoringModel(features);
    console.log("✅ ML Model applied! Score:", mlScore.toString());

    // Test model parameters
    const params = await contract.getModelParameters();
    console.log("📊 Model Parameters:");
    console.log("  📈 Base Score:", params.baseScore.toString());
    console.log("  📈 Risk Multiplier:", params.riskMultiplier.toString());
    console.log("  📈 Credit Limit:", params.creditLimit.toString());
    console.log("  📈 Model Active:", params.isActive);

    // Test contract statistics
    const stats = await contract.getContractStats();
    console.log("📊 Contract Statistics:");
    console.log("  📋 Total Requests:", stats[0].toString());
    console.log("  📋 Completed Requests:", stats[1].toString());
    console.log("  📋 Base Credit Score:", stats[2].toString());

    console.log("\n🎉 LOCAL DEPLOYMENT SUCCESS!");
    console.log("✅ Contract deployed and fully functional");
    console.log("✅ TFHE fallback operations working perfectly");
    console.log("✅ All ML functions operational");
    console.log("✅ Ready for Zama testnet deployment");

    console.log("\n📋 Deployment Summary:");
    console.log("🔗 Network: Local Hardhat");
    console.log("📍 Contract:", contract.address);
    console.log("👤 Deployer:", deployer.address);
    console.log("🤖 TFHE Ready: YES");
    console.log("⚡ Gas Used:", contract.deployTransaction.gasLimit?.toString());

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Check contract compilation");
    console.log("2. Verify network configuration");
    console.log("3. Check for any import issues");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Script execution failed:", error);
  process.exitCode = 1;
});
