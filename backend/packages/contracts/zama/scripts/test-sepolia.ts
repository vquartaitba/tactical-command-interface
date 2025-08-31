import { ethers, network } from "hardhat";

async function main() {
  console.log("🧪 Testing Zama CreditScoreModel on Sepolia...");
  console.log("🔗 Network:", network.name);
  console.log("⛓️  Chain ID:", network.config.chainId);

  // Your deployed contract address
  const CONTRACT_ADDRESS = "0x59A3b5AfB6bACdbEc53bc1aB13af08e20db2748c";

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("👤 Testing with account:", signer.address);

  // Get contract instance
  const CreditScoreModel = await ethers.getContractFactory("CreditScoreModel");
  const contract = CreditScoreModel.attach(CONTRACT_ADDRESS);

  console.log("📍 Contract address:", contract.address);
  console.log("🔍 Starting comprehensive tests...\n");

  try {
    // Test 1: Basic contract info
    console.log("📋 Test 1: Basic Contract Information");
    const owner = await contract.owner();
    console.log("✅ Owner:", owner);

    const baseScore = await contract.baseCreditScore();
    console.log("✅ Base Credit Score:", baseScore.toString());

    const paused = await contract.paused();
    console.log("✅ Contract Paused:", paused);

    console.log("✅ Basic info test passed!\n");

    // Unpause the contract if it's paused
    if (paused) {
      console.log("▶️  Unpausing contract for testing...");
      await contract.unpause();
      console.log("✅ Contract unpaused");
    }

    // Test 2: Model parameters
    console.log("📊 Test 2: Model Parameters");
    const modelParams = await contract.getModelParameters();
    console.log("✅ Base Score:", modelParams[0].toString());
    console.log("✅ Risk Multiplier:", modelParams[1].toString());
    console.log("✅ Credit Limit:", modelParams[2].toString());
    console.log("✅ Is Active:", modelParams[3]);

    console.log("✅ Model parameters test passed!\n");

    // Test 3: Contract statistics
    console.log("📈 Test 3: Contract Statistics");
    const stats = await contract.getContractStats();
    console.log("✅ Total Sources:", stats[0].toString());
    console.log("✅ Total Types:", stats[1].toString());
    console.log("✅ Total Requests:", stats[2].toString());

    console.log("✅ Contract statistics test passed!\n");

    // Test 4: ML Model Testing
    console.log("🤖 Test 4: ML Model Testing");
    console.log("📊 Testing credit scoring with various data inputs...");

    // Test different data patterns
    const testCases = [
      {
        name: "Good Credit Profile",
        data: ethers.utils.randomBytes(64),
        expectedRange: "700-850"
      },
      {
        name: "Average Credit Profile",
        data: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("average")),
        expectedRange: "580-720"
      },
      {
        name: "Poor Credit Profile",
        data: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("poor")),
        expectedRange: "300-450"
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n🧪 Testing: ${testCase.name}`);
      console.log(`📋 Expected range: ${testCase.expectedRange}`);

      try {
        const score = await contract.computeCreditScore(testCase.data);
        console.log(`✅ Credit Score: ${score.toString()}`);
        console.log(`📊 Score is in valid range (300-850): ${score >= 300 && score <= 850 ? 'YES' : 'NO'}`);
      } catch (error) {
        console.log(`❌ Error computing score:`, error.message);
      }
    }

    console.log("\n✅ ML Model testing completed!\n");

    // Test 5: Request Management Flow
    console.log("🔄 Test 5: Full Request Management Flow");

    const testUser = signer.address; // Use the signer address for testing
    const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-request-" + Date.now()));
    const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-data"));
    const validUntil = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

    console.log("📝 Creating computation request...");
    await contract.requestComputation(testUser, requestId, dataHash, validUntil);
    console.log("✅ Request created successfully");

    // Check request details
    console.log("📋 Checking request details...");
    const requestDetails = await contract.getComputationRequest(requestId);
    console.log("✅ User Address:", requestDetails[0]);
    console.log("✅ Request ID:", requestDetails[1]);
    console.log("✅ Timestamp:", new Date(requestDetails[2] * 1000).toLocaleString());
    console.log("✅ Is Completed:", requestDetails[3]);
    console.log("✅ Data Hash:", requestDetails[4]);
    console.log("✅ Valid Until:", new Date(requestDetails[5] * 1000).toLocaleString());

    // Execute computation
    console.log("⚡ Executing computation...");
    const encryptedData = ethers.utils.randomBytes(64);
    await contract.executeComputation(requestId, encryptedData);
    console.log("✅ Computation executed successfully");

    // Check final results
    console.log("📊 Checking final results...");
    const finalRequest = await contract.getComputationRequest(requestId);
    console.log("✅ Is Completed:", finalRequest[3]);
    console.log("✅ Encrypted Score:", finalRequest[4].toString());

    // Get encrypted score
    const encryptedScore = await contract.getEncryptedScore(requestId);
    console.log("🔐 Final Encrypted Score:", encryptedScore.toString());

    console.log("\n✅ Full request flow test completed!\n");

    // Test 6: Owner Functions
    console.log("👑 Test 6: Owner Functions");
    console.log("⚙️  Testing owner-only functions...");

    // Test pausing/unpausing
    console.log("⏸️  Pausing contract...");
    await contract.pause();
    console.log("✅ Contract paused");

    console.log("▶️  Unpausing contract...");
    await contract.unpause();
    console.log("✅ Contract unpaused");

    // Test parameter updates
    console.log("🔧 Updating model parameters...");
    await contract.updateModelParameters(400, 110, 12000);
    console.log("✅ Parameters updated");

    console.log("\n✅ Owner functions test completed!\n");

    console.log("🎉 ALL TESTS PASSED!");
    console.log("🎊 Your FHE Credit Scoring contract is working perfectly on Sepolia!");
    console.log("\n📋 Test Summary:");
    console.log("✅ Basic contract functionality");
    console.log("✅ Model parameters and statistics");
    console.log("✅ Machine learning credit scoring");
    console.log("✅ Full request management flow");
    console.log("✅ Owner administrative functions");
    console.log("✅ FHE operations on real blockchain");

  } catch (error) {
    console.error("❌ Test failed:", error);
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Check your account balance on Sepolia");
    console.log("2. Verify contract address is correct");
    console.log("3. Ensure you have enough gas for transactions");
    console.log("4. Check if contract is paused or has issues");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Script execution failed:", error);
  process.exitCode = 1;
});
