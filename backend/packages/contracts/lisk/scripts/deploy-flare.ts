import { ethers } from "hardhat";

async function main() {
    console.log("🚀 Deploying FlareStateConnector contract...");

    // Get the contract factory
    const FlareStateConnector = await ethers.getContractFactory("FlareStateConnector");
    
    // Deploy the contract
    const flareStateConnector = await FlareStateConnector.deploy();
    await flareStateConnector.deployed();

    console.log("✅ FlareStateConnector deployed to:", flareStateConnector.address);
    console.log("📋 Contract details:");
    console.log("   - Owner:", await flareStateConnector.owner());
    console.log("   - Min Attestation Delay:", (await flareStateConnector.minAttestationDelay()).toString(), "seconds");
    console.log("   - Max Attestation Age:", (await flareStateConnector.maxAttestationAge()).toString(), "seconds");
    console.log("   - Required Validator Count:", (await flareStateConnector.requiredValidatorCount()).toString());

    // Verify deployment on Etherscan (if on mainnet/testnet)
    if (network.name !== "hardhat" && network.name !== "localhost") {
        console.log("⏳ Waiting for block confirmations...");
        await flareStateConnector.deployTransaction.wait(6);
        
        console.log("🔍 Verifying contract on Etherscan...");
        try {
            await hre.run("verify:verify", {
                address: flareStateConnector.address,
                constructorArguments: [],
            });
            console.log("✅ Contract verified on Etherscan");
        } catch (error) {
            console.log("⚠️  Contract verification failed:", error);
        }
    }

    console.log("\n🎯 Next steps:");
    console.log("1. Whitelist validators using setValidatorWhitelist()");
    console.log("2. Whitelist data sources using setDataSourceWhitelist()");
    console.log("3. Update parameters if needed using updateAttestationParameters()");
    console.log("4. Test the contract functionality");

    return flareStateConnector;
}

// Execute deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
