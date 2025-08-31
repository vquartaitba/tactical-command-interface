import { ethers, network } from "hardhat";

async function main() {
  console.log("💰 Estimating Sepolia Deployment Cost");
  console.log("🔗 Network:", network.name);

  try {
    const [deployer] = await ethers.getSigners();
    console.log("👤 Account:", deployer.address);

    const balance = await deployer.getBalance();
    const balanceEth = ethers.utils.formatEther(balance);
    console.log("💰 Current balance:", balanceEth, "ETH");

    // Get current gas price
    const gasPrice = await ethers.provider.getGasPrice();
    const gasPriceGwei = ethers.utils.formatUnits(gasPrice, "gwei");
    console.log("⛽ Current gas price:", gasPriceGwei, "gwei");

    // Estimate contract deployment
    const CreditScoreModel = await ethers.getContractFactory("CreditScoreModel");

    console.log("\n🔨 Estimating deployment cost...");

    // Get deployment data
    const deployTx = CreditScoreModel.getDeployTransaction();

    // Estimate gas
    const estimatedGas = await ethers.provider.estimateGas({
      ...deployTx,
      from: deployer.address
    });

    console.log("⛽ Estimated gas:", estimatedGas.toString());

    // Calculate cost
    const deploymentCost = estimatedGas.mul(gasPrice);
    const deploymentCostEth = ethers.utils.formatEther(deploymentCost);

    console.log("💸 Estimated deployment cost:", deploymentCostEth, "ETH");

    // Check if user has enough
    const hasEnough = balance.gte(deploymentCost);
    console.log("✅ Sufficient funds:", hasEnough ? "YES" : "NO");

    if (!hasEnough) {
      const shortfall = deploymentCost.sub(balance);
      const shortfallEth = ethers.utils.formatEther(shortfall);
      console.log("💡 Additional needed:", shortfallEth, "ETH");

      console.log("\n🔗 Get more Sepolia ETH from:");
      console.log("1. https://sepoliafaucet.com/");
      console.log("2. https://faucet.quicknode.com/ethereum/sepolia");
      console.log("3. https://faucets.chain.link/");
      console.log("4. https://sepolia-faucet.pk910.de/");
    } else {
      console.log("\n🎉 Ready for deployment!");
      console.log("💡 Run: npm run deploy:sepolia");
    }

    // Additional estimates for common operations
    console.log("\n📊 Additional Cost Estimates:");

    // Estimate a function call cost
    try {
      const testData = ethers.utils.randomBytes(32);
      const callGas = await CreditScoreModel.signer.estimateGas(
        await CreditScoreModel.populateTransaction.computeCreditScore(testData)
      );
      const callCost = callGas.mul(gasPrice);
      const callCostEth = ethers.utils.formatEther(callCost);
      console.log("🤖 computeCreditScore() call:", callCostEth, "ETH");
    } catch (error) {
      console.log("🤖 computeCreditScore() call: Unable to estimate");
    }

    // Estimate request computation cost
    try {
      const testUser = "0x742d35Cc6634C0532925a3b844B8b6b6b4b6b6b6b6";
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));
      const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("data"));
      const validUntil = Math.floor(Date.now() / 1000) + 3600;

      const requestGas = await CreditScoreModel.signer.estimateGas(
        await CreditScoreModel.populateTransaction.requestComputation(
          testUser, requestId, dataHash, validUntil
        )
      );
      const requestCost = requestGas.mul(gasPrice);
      const requestCostEth = ethers.utils.formatEther(requestCost);
      console.log("📝 requestComputation() call:", requestCostEth, "ETH");
    } catch (error) {
      console.log("📝 requestComputation() call: Unable to estimate");
    }

  } catch (error) {
    console.error("❌ Estimation failed:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Check your network connection");
    console.log("2. Verify PRIVATE_KEY is set correctly");
    console.log("3. Check SEPOLIA_RPC_URL is accessible");
  }
}

main().catch(console.error);
