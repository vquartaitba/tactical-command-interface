import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Checking Zama Network Status");
  console.log("⏳ Testing various Zama RPC endpoints...\n");

  const endpoints = [
    "https://rpc.testnet.zama.ai",
    "https://testnet.zama.ai",
    "https://devnet.zama.ai",
    "https://rpc.devnet.zama.ai",
    "https://api.testnet.zama.ai",
    "https://api.devnet.zama.ai",
    "wss://rpc.testnet.zama.ai",
    "wss://devnet.zama.ai"
  ];

  const workingEndpoints: string[] = [];

  for (const endpoint of endpoints) {
    try {
      console.log(`🔗 Testing: ${endpoint}`);

      // Try to create a provider
      const provider = new ethers.providers.JsonRpcProvider(endpoint);

      // Set timeout for the request
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );

      // Try to get network info
      const networkPromise = provider.getNetwork();

      await Promise.race([networkPromise, timeoutPromise]);

      const network = await networkPromise;

      console.log(`✅ Working! Chain ID: ${network.chainId}`);
      workingEndpoints.push(endpoint);

    } catch (error) {
      console.log(`❌ Failed: ${(error as Error).message}`);
    }

    console.log(""); // Empty line for readability
  }

  console.log("📋 Summary:");
  console.log(`✅ Working endpoints: ${workingEndpoints.length}`);
  console.log(`❌ Failed endpoints: ${endpoints.length - workingEndpoints.length}`);

  if (workingEndpoints.length > 0) {
    console.log("\n🎉 Found working Zama endpoints!");
    console.log("🚀 Ready to deploy!");
    console.log("\n📝 Next steps:");
    console.log("1. Update hardhat.config.ts with working endpoint");
    console.log("2. Get ZAMA tokens from faucet");
    console.log("3. Run: npm run deploy:zama");

    console.log("\n🔧 Working endpoints:");
    workingEndpoints.forEach((endpoint, index) => {
      console.log(`${index + 1}. ${endpoint}`);
    });
  } else {
    console.log("\n⚠️  No working endpoints found");
    console.log("💡 This could mean:");
    console.log("   - Zama testnet is not publicly available yet");
    console.log("   - Network is temporarily down");
    console.log("   - Special access credentials required");
    console.log("   - Endpoints have changed");

    console.log("\n📚 Recommendations:");
    console.log("1. Check https://docs.zama.ai/ for latest info");
    console.log("2. Join Zama Discord: https://discord.gg/zama");
    console.log("3. Follow @zama_fhe on Twitter");
    console.log("4. Continue with local development: npm run deploy:local");
  }
}

main().catch(console.error);
