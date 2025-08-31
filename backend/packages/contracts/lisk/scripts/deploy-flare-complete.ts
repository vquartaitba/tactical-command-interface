import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

interface DeploymentInfo {
    contractName: string;
    address: string;
    network: string;
    timestamp: number;
    constructorArgs: any[];
}

async function main() {
    console.log("🚀 Starting complete Flare integration deployment...");
    console.log("📋 Network:", network.name);
    console.log("📋 Chain ID:", (await ethers.provider.getNetwork()).chainId);

    const deployments: DeploymentInfo[] = [];
    const deployer = (await ethers.getSigners())[0];
    console.log("👤 Deployer:", deployer.address);

    try {
        // Step 1: Deploy FlareStateConnector
        console.log("\n🔹 Step 1: Deploying FlareStateConnector...");
        const FlareStateConnector = await ethers.getContractFactory("FlareStateConnector");
        const flareStateConnector = await FlareStateConnector.deploy();
        await flareStateConnector.deployed();
        
        console.log("✅ FlareStateConnector deployed to:", flareStateConnector.address);
        deployments.push({
            contractName: "FlareStateConnector",
            address: flareStateConnector.address,
            network: network.name,
            timestamp: Date.now(),
            constructorArgs: []
        });

        // Step 2: Deploy FlareIntegration (requires existing contracts)
        console.log("\n🔹 Step 2: Deploying FlareIntegration...");
        
        // Get existing contract addresses from environment or use mock addresses for testing
        let identityAddress = process.env.IDENTITY_CONTRACT_ADDRESS;
        let scoreSBTAddress = process.env.SCORE_SBT_CONTRACT_ADDRESS;
        let dataRegistryAddress = process.env.DATA_REGISTRY_CONTRACT_ADDRESS;

        if (!identityAddress || !scoreSBTAddress || !dataRegistryAddress) {
            console.log("⚠️  Some contract addresses not found in environment, deploying mock contracts...");
            
            // Deploy mock contracts for testing
            const Identity = await ethers.getContractFactory("Identity");
            const identityContract = await Identity.deploy();
            await identityContract.deployed();
            identityAddress = identityContract.address;
            console.log("✅ Mock Identity deployed to:", identityAddress);

            const ScoreSBT = await ethers.getContractFactory("ScoreSBT");
            const scoreSBTContract = await ScoreSBT.deploy();
            await scoreSBTContract.deployed();
            scoreSBTAddress = scoreSBTContract.address;
            console.log("✅ Mock ScoreSBT deployed to:", scoreSBTAddress);

            const DataRegistry = await ethers.getContractFactory("DataRegistry");
            const dataRegistryContract = await DataRegistry.deploy();
            await dataRegistryContract.deployed();
            dataRegistryAddress = dataRegistryContract.address;
            console.log("✅ Mock DataRegistry deployed to:", dataRegistryAddress);
        }

        const FlareIntegration = await ethers.getContractFactory("FlareIntegration");
        const flareIntegration = await FlareIntegration.deploy(
            flareStateConnector.address,
            identityAddress,
            scoreSBTAddress,
            dataRegistryAddress
        );
        await flareIntegration.deployed();
        
        console.log("✅ FlareIntegration deployed to:", flareIntegration.address);
        deployments.push({
            contractName: "FlareIntegration",
            address: flareIntegration.address,
            network: network.name,
            timestamp: Date.now(),
            constructorArgs: [
                flareStateConnector.address,
                identityAddress,
                scoreSBTAddress,
                dataRegistryAddress
            ]
        });

        // Step 3: Configure FlareStateConnector
        console.log("\n🔹 Step 3: Configuring FlareStateConnector...");
        
        // Whitelist the deployer as a validator for testing
        await flareStateConnector.setValidatorWhitelist(deployer.address, true);
        console.log("✅ Deployer whitelisted as validator");

        // Set initial parameters
        await flareStateConnector.updateAttestationParameters(1800, 43200); // 30 min delay, 12 hours max age
        console.log("✅ Attestation parameters updated");

        // Step 4: Configure FlareIntegration
        console.log("\n🔹 Step 4: Configuring FlareIntegration...");
        
        // Authorize the deployer as a fintech for testing
        await flareIntegration.setFintechAuthorization(deployer.address, true);
        console.log("✅ Deployer authorized as fintech");

        // Update parameters
        await flareIntegration.updateFlareConfirmations(1); // Lower for testing
        await flareIntegration.updateMaxRequestAge(3 * 24 * 3600); // 3 days for testing
        console.log("✅ Integration parameters updated");

        // Step 5: Verify contracts on Etherscan (if on mainnet/testnet)
        if (network.name !== "hardhat" && network.name !== "localhost") {
            console.log("\n🔹 Step 5: Verifying contracts on Etherscan...");
            
            // Wait for block confirmations
            await flareStateConnector.deployTransaction.wait(6);
            await flareIntegration.deployTransaction.wait(6);
            
            // Verify FlareStateConnector
            try {
                await hre.run("verify:verify", {
                    address: flareStateConnector.address,
                    constructorArguments: [],
                });
                console.log("✅ FlareStateConnector verified on Etherscan");
            } catch (error) {
                console.log("⚠️  FlareStateConnector verification failed:", error);
            }

            // Verify FlareIntegration
            try {
                await hre.run("verify:verify", {
                    address: flareIntegration.address,
                    constructorArguments: [
                        flareStateConnector.address,
                        identityAddress,
                        scoreSBTAddress,
                        dataRegistryAddress
                    ],
                });
                console.log("✅ FlareIntegration verified on Etherscan");
            } catch (error) {
                console.log("⚠️  FlareIntegration verification failed:", error);
            }
        }

        // Step 6: Save deployment information
        console.log("\n🔹 Step 6: Saving deployment information...");
        
        const deploymentData = {
            network: network.name,
            chainId: (await ethers.provider.getNetwork()).chainId,
            deployer: deployer.address,
            timestamp: Date.now(),
            contracts: deployments
        };

        const deploymentPath = path.join(__dirname, `../deployments/flare-deployment-${network.name}-${Date.now()}.json`);
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
        console.log("✅ Deployment info saved to:", deploymentPath);

        // Step 7: Display final summary
        console.log("\n🎉 Flare Integration Deployment Complete!");
        console.log("\n📋 Deployed Contracts:");
        console.log("   - FlareStateConnector:", flareStateConnector.address);
        console.log("   - FlareIntegration:", flareIntegration.address);
        
        console.log("\n🔧 Configuration:");
        console.log("   - Deployer is whitelisted as validator");
        console.log("   - Deployer is authorized as fintech");
        console.log("   - Attestation delay: 30 minutes");
        console.log("   - Max attestation age: 12 hours");
        console.log("   - Min Flare confirmations: 1");
        console.log("   - Max request age: 3 days");

        console.log("\n🎯 Next Steps:");
        console.log("1. Test the contracts using the test suites");
        console.log("2. Run end-to-end integration tests");
        console.log("3. Deploy to production networks");
        console.log("4. Configure production validators and fintechs");

        console.log("\n📝 Environment variables to set:");
        console.log(`export FLARE_STATE_CONNECTOR_ADDRESS="${flareStateConnector.address}"`);
        console.log(`export FLARE_INTEGRATION_ADDRESS="${flareIntegration.address}"`);

        return {
            flareStateConnector,
            flareIntegration,
            deploymentData
        };

    } catch (error) {
        console.error("❌ Deployment failed:", error);
        throw error;
    }
}

// Execute deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
