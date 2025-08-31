import { ethers } from "hardhat";

async function main() {
    console.log("🚀 Deploying FlareIntegration contract...");

    // Get the contract factory
    const FlareIntegration = await ethers.getContractFactory("FlareIntegration");
    
    // Get deployed contract addresses (these should be deployed first)
    const FLARE_STATE_CONNECTOR_ADDRESS = process.env.FLARE_STATE_CONNECTOR_ADDRESS;
    const IDENTITY_CONTRACT_ADDRESS = process.env.IDENTITY_CONTRACT_ADDRESS;
    const SCORE_SBT_CONTRACT_ADDRESS = process.env.SCORE_SBT_CONTRACT_ADDRESS;
    const DATA_REGISTRY_CONTRACT_ADDRESS = process.env.DATA_REGISTRY_CONTRACT_ADDRESS;

    if (!FLARE_STATE_CONNECTOR_ADDRESS) {
        throw new Error("FLARE_STATE_CONNECTOR_ADDRESS environment variable not set");
    }
    if (!IDENTITY_CONTRACT_ADDRESS) {
        throw new Error("IDENTITY_CONTRACT_ADDRESS environment variable not set");
    }
    if (!SCORE_SBT_CONTRACT_ADDRESS) {
        throw new Error("SCORE_SBT_CONTRACT_ADDRESS environment variable not set");
    }
    if (!DATA_REGISTRY_CONTRACT_ADDRESS) {
        throw new Error("DATA_REGISTRY_CONTRACT_ADDRESS environment variable not set");
    }

    console.log("📋 Contract addresses:");
    console.log("   - FlareStateConnector:", FLARE_STATE_CONNECTOR_ADDRESS);
    console.log("   - Identity:", IDENTITY_CONTRACT_ADDRESS);
    console.log("   - ScoreSBT:", SCORE_SBT_CONTRACT_ADDRESS);
    console.log("   - DataRegistry:", DATA_REGISTRY_CONTRACT_ADDRESS);

    // Deploy the contract
    const flareIntegration = await FlareIntegration.deploy(
        FLARE_STATE_CONNECTOR_ADDRESS,
        IDENTITY_CONTRACT_ADDRESS,
        SCORE_SBT_CONTRACT_ADDRESS,
        DATA_REGISTRY_CONTRACT_ADDRESS
    );
    await flareIntegration.deployed();

    console.log("✅ FlareIntegration deployed to:", flareIntegration.address);
    console.log("📋 Contract details:");
    console.log("   - Owner:", await flareIntegration.owner());
    console.log("   - Min Flare Confirmations:", (await flareIntegration.minFlareConfirmations()).toString());
    console.log("   - Max Request Age:", (await flareIntegration.maxRequestAge()).toString(), "seconds");
    console.log("   - Request Counter:", (await flareIntegration.requestCounter()).toString());

    // Verify deployment on Etherscan (if on mainnet/testnet)
    if (network.name !== "hardhat" && network.name !== "localhost") {
        console.log("⏳ Waiting for block confirmations...");
        await flareIntegration.deployTransaction.wait(6);
        
        console.log("🔍 Verifying contract on Etherscan...");
        try {
            await hre.run("verify:verify", {
                address: flareIntegration.address,
                constructorArguments: [
                    FLARE_STATE_CONNECTOR_ADDRESS,
                    IDENTITY_CONTRACT_ADDRESS,
                    SCORE_SBT_CONTRACT_ADDRESS,
                    DATA_REGISTRY_CONTRACT_ADDRESS
                ],
            });
            console.log("✅ Contract verified on Etherscan");
        } catch (error) {
            console.log("⚠️  Contract verification failed:", error);
        }
    }

    console.log("\n🎯 Next steps:");
    console.log("1. Authorize fintechs using setFintechAuthorization()");
    console.log("2. Test the integration with FlareStateConnector");
    console.log("3. Verify cross-chain communication with Zama network");
    console.log("4. Test end-to-end credit score workflow");

    console.log("\n📝 Environment variables to set:");
    console.log(`export FLARE_INTEGRATION_ADDRESS="${flareIntegration.address}"`);

    return flareIntegration;
}

// Execute deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
