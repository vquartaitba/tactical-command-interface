import { ethers, network } from "hardhat";

async function main() {
  console.log("🧪 Simple Test: Zama CreditScoreModel on Sepolia");
  console.log("📍 Contract:", "0x240B659a2917aC8D8FDAAccA76743160eC4c5308");

  const CONTRACT_ADDRESS = "0x240B659a2917aC8D8FDAAccA76743160eC4c5308";

  try {
    const CreditScoreModel = await ethers.getContractFactory("CreditScoreModel");
    const contract = CreditScoreModel.attach(CONTRACT_ADDRESS);

    console.log("✅ Connected to contract");

    // Test basic functions that we know work
    const owner = await contract.owner();
    console.log("👤 Owner:", owner);

    const baseScore = await contract.baseCreditScore();
    console.log("📊 Base Score:", baseScore.toString());

    const paused = await contract.paused();
    console.log("⏸️  Paused:", paused);

    // Test model parameters
    const params = await contract.getModelParameters();
    console.log("📈 Model Params - Base:", params[0].toString(), "Risk:", params[1].toString());

    // Test contract stats
    const stats = await contract.getContractStats();
    console.log("📊 Stats - Sources:", stats[0].toString(), "Types:", stats[1].toString(), "Requests:", stats[2].toString());

    console.log("🎉 Basic tests passed!");

    // Test a simple credit score computation
    console.log("\n🤖 Testing credit score computation...");

    try {
      const testData = ethers.utils.randomBytes(32);
      console.log("📊 Input data length:", testData.length);

      // Try calling the function directly
      const tx = await contract.populateTransaction.computeCreditScore(testData);
      console.log("📝 Transaction data:", tx.data?.substring(0, 66) + "...");

      const score = await contract.computeCreditScore(testData);
      console.log("✅ Credit Score Result:", score.toString());

    } catch (error) {
      console.log("❌ Credit score computation failed:", error.message);

      // Let's try a different approach - check if the function exists
      console.log("🔍 Checking contract functions...");

      try {
        const code = await ethers.provider.getCode(CONTRACT_ADDRESS);
        console.log("📄 Contract code length:", code.length);

        // Try calling a known working function
        const testOwner = await contract.owner();
        console.log("✅ Contract is responsive, owner:", testOwner);

      } catch (codeError) {
        console.log("❌ Contract code error:", codeError.message);
      }
    }

    console.log("\n🎯 Test Summary:");
    console.log("✅ Contract connection: SUCCESS");
    console.log("✅ Basic functions: SUCCESS");
    console.log("🤔 ML functions: Need investigation");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Contract address:", CONTRACT_ADDRESS);
    console.log("2. Network:", network.name);
    console.log("3. Check contract deployment status on Etherscan");
  }
}

main().catch(console.error);
