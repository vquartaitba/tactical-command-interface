import { ethers } from "hardhat";

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    console.error("❌ Please set CONTRACT_ADDRESS environment variable");
    console.log("Usage: CONTRACT_ADDRESS=0x123... npx hardhat run scripts/verify.ts --network zamaTestnet");
    process.exit(1);
  }

  console.log("🔍 Verifying deployed contract at:", contractAddress);

  try {
    // Attach to deployed contract
    const CreditScoreModel = await ethers.getContractFactory("CreditScoreModel");
    const contract = CreditScoreModel.attach(contractAddress);

    // Test basic functions
    console.log("📋 Testing basic contract functions...");

    const owner = await contract.owner();
    console.log("✅ Owner:", owner);

    const baseScore = await contract.baseCreditScore();
    console.log("✅ Base Credit Score:", baseScore.toString());

    const paused = await contract.paused();
    console.log("✅ Contract Paused:", paused);

    // Test ML model with sample data
    console.log("\n🤖 Testing ML model with sample data...");
    const sampleData = ethers.utils.randomBytes(64);
    const score = await contract.computeCreditScore(sampleData);
    console.log("✅ Computed Credit Score:", score.toString());

    // Test model parameters
    const params = await contract.getModelParameters();
    console.log("✅ Model Parameters:");
    console.log("   - Base Score:", params.baseScore.toString());
    console.log("   - Risk Multiplier:", params.riskMultiplier.toString());
    console.log("   - Credit Limit:", params.creditLimit.toString());
    console.log("   - Is Active:", params.isActive);

    // Test contract statistics
    const stats = await contract.getContractStats();
    console.log("✅ Contract Statistics:");
    console.log("   - Total Sources:", stats[0].toString());
    console.log("   - Total Types:", stats[1].toString());
    console.log("   - Total Requests:", stats[2].toString());

    console.log("\n🎉 Contract verification successful!");
    console.log("📍 Contract is fully operational on", network.name);

  } catch (error) {
    console.error("❌ Contract verification failed:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Verification script failed:", error);
  process.exitCode = 1;
});
