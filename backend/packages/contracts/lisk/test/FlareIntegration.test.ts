import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, ContractFactory, Signer, BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("FlareIntegration", function () {
    let FlareIntegration: ContractFactory;
    let FlareStateConnector: ContractFactory;
    let Identity: ContractFactory;
    let ScoreSBT: ContractFactory;
    let DataRegistry: ContractFactory;
    
    let flareIntegration: Contract;
    let flareStateConnector: Contract;
    let identityContract: Contract;
    let scoreSBTContract: Contract;
    let dataRegistryContract: Contract;
    
    let owner: SignerWithAddress;
    let fintech: SignerWithAddress;
    let user: SignerWithAddress;
    let validator: SignerWithAddress;
    let otherUser: SignerWithAddress;

    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
    const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000";

    beforeEach(async function () {
        [owner, fintech, user, validator, otherUser] = await ethers.getSigners();
        
        // Deploy mock contracts first
        FlareStateConnector = await ethers.getContractFactory("FlareStateConnector");
        flareStateConnector = await FlareStateConnector.deploy();
        await flareStateConnector.deployed();

        Identity = await ethers.getContractFactory("Identity");
        identityContract = await Identity.deploy();
        await identityContract.deployed();

        ScoreSBT = await ethers.getContractFactory("ScoreSBT");
        scoreSBTContract = await ScoreSBT.deploy();
        await scoreSBTContract.deployed();

        DataRegistry = await ethers.getContractFactory("DataRegistry");
        dataRegistryContract = await DataRegistry.deploy();
        await dataRegistryContract.deployed();

        // Deploy FlareIntegration with mock contracts
        FlareIntegration = await ethers.getContractFactory("FlareIntegration");
        flareIntegration = await FlareIntegration.deploy(
            flareStateConnector.address,
            identityContract.address,
            scoreSBTContract.address,
            dataRegistryContract.address
        );
        await flareIntegration.deployed();

        // Setup initial configuration
        await flareStateConnector.setValidatorWhitelist(validator.address, true);
        await flareIntegration.setFintechAuthorization(fintech.address, true);
        
        // Register user in Identity contract
        await identityContract.connect(user).registerUser("test@example.com", "John Doe");
    });

    describe("Deployment", function () {
        it("Should set the correct contract addresses", async function () {
            expect(await flareIntegration.flareStateConnector()).to.equal(flareStateConnector.address);
            expect(await flareIntegration.identityContract()).to.equal(identityContract.address);
            expect(await flareIntegration.scoreSBTContract()).to.equal(scoreSBTContract.address);
            expect(await flareIntegration.dataRegistryContract()).to.equal(dataRegistryContract.address);
        });

        it("Should set the correct owner", async function () {
            expect(await flareIntegration.owner()).to.equal(owner.address);
        });

        it("Should have correct initial parameters", async function () {
            expect(await flareIntegration.minFlareConfirmations()).to.equal(3);
            expect(await flareIntegration.maxRequestAge()).to.equal(7 * 24 * 3600); // 7 days
            expect(await flareIntegration.requestCounter()).to.equal(0);
        });
    });

    describe("Credit Score Request Management", function () {
        it("Should allow authorized fintechs to initiate credit score requests", async function () {
            const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test data"));
            
            const tx = await flareIntegration.connect(fintech).initiateCreditScoreRequest(user.address, dataHash);
            const receipt = await tx.wait();
            
            const requestId = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
                ["address", "bytes32", "uint256", "uint256", "uint256"],
                [user.address, dataHash, 1, receipt.blockNumber, await flareIntegration.provider.getNetwork().then(n => n.chainId)]
            ));

            const request = await flareIntegration.getCreditScoreRequest(requestId);
            expect(request.user).to.equal(user.address);
            expect(request.dataHash).to.equal(dataHash);
            expect(request.status).to.equal(0); // Pending
            expect(request.flareVerified).to.be.false;
            expect(request.zamaProcessed).to.be.false;
        });

        it("Should prevent unauthorized fintechs from initiating requests", async function () {
            const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test data"));
            
            await expect(
                flareIntegration.connect(otherUser).initiateCreditScoreRequest(user.address, dataHash)
            ).to.be.revertedWith("FlareIntegration: Not authorized fintech");
        });

        it("Should prevent requests for unregistered users", async function () {
            const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test data"));
            
            await expect(
                flareIntegration.connect(fintech).initiateCreditScoreRequest(otherUser.address, dataHash)
            ).to.be.revertedWith("FlareIntegration: User not registered");
        });

        it("Should prevent requests with zero data hash", async function () {
            await expect(
                flareIntegration.connect(fintech).initiateCreditScoreRequest(user.address, ZERO_BYTES32)
            ).to.be.revertedWith("FlareIntegration: Invalid data hash");
        });

        it("Should prevent requests with zero user address", async function () {
            const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test data"));
            
            await expect(
                flareIntegration.connect(fintech).initiateCreditScoreRequest(ZERO_ADDRESS, dataHash)
            ).to.be.revertedWith("FlareIntegration: Invalid user address");
        });

        it("Should increment request counter", async function () {
            const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test data"));
            
            const initialCounter = await flareIntegration.requestCounter();
            await flareIntegration.connect(fintech).initiateCreditScoreRequest(user.address, dataHash);
            
            expect(await flareIntegration.requestCounter()).to.equal(initialCounter.add(1));
        });
    });

    describe("Flare Attestation Processing", function () {
        let requestId: string;
        let dataHash: string;

        beforeEach(async function () {
            dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test data"));
            const tx = await flareIntegration.connect(fintech).initiateCreditScoreRequest(user.address, dataHash);
            const receipt = await tx.wait();
            
            requestId = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
                ["address", "bytes32", "uint256", "uint256", "uint256"],
                [user.address, dataHash, 1, receipt.blockNumber, await flareIntegration.provider.getNetwork().then(n => n.chainId)]
            ));

            // Submit data request to Flare State Connector
            await flareStateConnector.submitDataRequest(dataHash);
        });

        it("Should process valid Flare attestations", async function () {
            const blockNumber = await ethers.provider.getBlockNumber();
            const messageHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
                ["bytes32", "bytes32", "uint256", "uint256"],
                [requestId, dataHash, blockNumber, await flareStateConnector.provider.getNetwork().then(n => n.chainId)]
            ));
            const signature = await validator.signMessage(ethers.utils.arrayify(messageHash));

            // Fast forward time to meet minimum delay requirement
            await ethers.provider.send("evm_increaseTime", [3601]); // 1 hour + 1 second
            await ethers.provider.send("evm_mine", []);

            // Submit attestation to Flare State Connector
            await flareStateConnector.connect(validator).submitAttestation(
                requestId,
                dataHash,
                signature,
                blockNumber
            );

            // Verify attestation
            await flareStateConnector.verifyAndProcessAttestation(requestId);

            // Process Flare attestation in integration contract
            const attestationProof = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("proof"));
            await expect(
                flareIntegration.connect(fintech).processFlareAttestation(requestId, attestationProof)
            ).to.emit(flareIntegration, "FlareAttestationProcessed")
                .withArgs(requestId, dataHash, true, await ethers.provider.getBlockNumber());

            const request = await flareIntegration.getCreditScoreRequest(requestId);
            expect(request.flareVerified).to.be.true;
            expect(request.status).to.equal(1); // FlareVerified
        });

        it("Should reject processing of invalid attestations", async function () {
            const attestationProof = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("proof"));
            
            // Try to process attestation without Flare verification
            await expect(
                flareIntegration.connect(fintech).processFlareAttestation(requestId, attestationProof)
            ).to.emit(flareIntegration, "FlareAttestationProcessed")
                .withArgs(requestId, dataHash, false, await ethers.provider.getBlockNumber());

            const request = await flareIntegration.getCreditScoreRequest(requestId);
            expect(request.status).to.equal(4); // Failed
        });

        it("Should prevent processing of already processed requests", async function () {
            // First, make the request Flare verified
            const blockNumber = await ethers.provider.getBlockNumber();
            const messageHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
                ["bytes32", "bytes32", "uint256", "uint256"],
                [requestId, dataHash, blockNumber, await flareStateConnector.provider.getNetwork().then(n => n.chainId)]
            ));
            const signature = await validator.signMessage(ethers.utils.arrayify(messageHash));

            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine", []);

            await flareStateConnector.connect(validator).submitAttestation(
                requestId,
                dataHash,
                signature,
                blockNumber
            );

            await flareStateConnector.verifyAndProcessAttestation(requestId);

            const attestationProof = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("proof"));
            await flareIntegration.connect(fintech).processFlareAttestation(requestId, attestationProof);

            // Try to process again
            await expect(
                flareIntegration.connect(fintech).processFlareAttestation(requestId, attestationProof)
            ).to.be.revertedWith("FlareIntegration: Invalid request status");
        });
    });

    describe("Zama Result Processing", function () {
        let requestId: string;
        let dataHash: string;

        beforeEach(async function () {
            dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test data"));
            const tx = await flareIntegration.connect(fintech).initiateCreditScoreRequest(user.address, dataHash);
            const receipt = await tx.wait();
            
            requestId = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
                ["address", "bytes32", "uint256", "uint256", "uint256"],
                [user.address, dataHash, 1, receipt.blockNumber, await flareIntegration.provider.getNetwork().then(n => n.chainId)]
            ));

            // Setup Flare verification
            await flareStateConnector.submitDataRequest(dataHash);
            const blockNumber = await ethers.provider.getBlockNumber();
            const messageHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
                ["bytes32", "bytes32", "uint256", "uint256"],
                [requestId, dataHash, blockNumber, await flareStateConnector.provider.getNetwork().then(n => n.chainId)]
            ));
            const signature = await validator.signMessage(ethers.utils.arrayify(messageHash));

            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine", []);

            await flareStateConnector.connect(validator).submitAttestation(
                requestId,
                dataHash,
                signature,
                blockNumber
            );

            await flareStateConnector.verifyAndProcessAttestation(requestId);

            const attestationProof = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("proof"));
            await flareIntegration.connect(fintech).processFlareAttestation(requestId, attestationProof);
        });

        it("Should process valid Zama results", async function () {
            const creditScore = 750;
            const encryptedResult = ethers.utils.toUtf8Bytes("encrypted_result_data");

            await expect(
                flareIntegration.connect(fintech).processZamaResult(requestId, creditScore, encryptedResult)
            ).to.emit(flareIntegration, "CreditScoreComputed")
                .withArgs(requestId, user.address, creditScore, ethers.utils.hexZeroPad("0x1", 32), await ethers.provider.getBlockNumber());

            const request = await flareIntegration.getCreditScoreRequest(requestId);
            expect(request.creditScore).to.equal(creditScore);
            expect(request.zamaProcessed).to.be.true;
            expect(request.status).to.equal(3); // Completed
        });

        it("Should reject processing of non-Flare verified requests", async function () {
            // Create new request without Flare verification
            const newDataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("new test data"));
            const tx = await flareIntegration.connect(fintech).initiateCreditScoreRequest(user.address, newDataHash);
            const receipt = await tx.wait();
            
            const newRequestId = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
                ["address", "bytes32", "uint256", "uint256", "uint256"],
                [user.address, newDataHash, 2, receipt.blockNumber, await flareIntegration.provider.getNetwork().then(n => n.chainId)]
            ));

            const creditScore = 750;
            const encryptedResult = ethers.utils.toUtf8Bytes("encrypted_result_data");

            await expect(
                flareIntegration.connect(fintech).processZamaResult(newRequestId, creditScore, encryptedResult)
            ).to.be.revertedWith("FlareIntegration: Request not Flare verified");
        });

        it("Should reject invalid credit scores", async function () {
            const creditScore = 0;
            const encryptedResult = ethers.utils.toUtf8Bytes("encrypted_result_data");

            await expect(
                flareIntegration.connect(fintech).processZamaResult(requestId, creditScore, encryptedResult)
            ).to.be.revertedWith("FlareIntegration: Invalid credit score");
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to authorize/remove fintechs", async function () {
            await flareIntegration.setFintechAuthorization(otherUser.address, true);
            expect(await flareIntegration.authorizedFintechs(otherUser.address)).to.be.true;

            await flareIntegration.setFintechAuthorization(fintech.address, false);
            expect(await flareIntegration.authorizedFintechs(fintech.address)).to.be.false;
        });

        it("Should allow owner to update Flare confirmations", async function () {
            await flareIntegration.updateFlareConfirmations(5);
            expect(await flareIntegration.minFlareConfirmations()).to.equal(5);
        });

        it("Should allow owner to update max request age", async function () {
            const newAge = 14 * 24 * 3600; // 14 days
            await flareIntegration.updateMaxRequestAge(newAge);
            expect(await flareIntegration.maxRequestAge()).to.equal(newAge);
        });

        it("Should allow owner to pause/unpause contract", async function () {
            await flareIntegration.pause();
            expect(await flareIntegration.paused()).to.be.true;

            await flareIntegration.unpause();
            expect(await flareIntegration.paused()).to.be.false;
        });

        it("Should prevent non-owners from calling admin functions", async function () {
            await expect(
                flareIntegration.connect(fintech).setFintechAuthorization(otherUser.address, true)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("View Functions", function () {
        it("Should return correct request details", async function () {
            const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test data"));
            const tx = await flareIntegration.connect(fintech).initiateCreditScoreRequest(user.address, dataHash);
            const receipt = await tx.wait();
            
            const requestId = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
                ["address", "bytes32", "uint256", "uint256", "uint256"],
                [user.address, dataHash, 1, receipt.blockNumber, await flareIntegration.provider.getNetwork().then(n => n.chainId)]
            ));

            const request = await flareIntegration.getCreditScoreRequest(requestId);
            expect(request.user).to.equal(user.address);
            expect(request.dataHash).to.equal(dataHash);
            expect(request.status).to.equal(0); // Pending
        });

        it("Should return correct Flare data", async function () {
            const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test data"));
            const tx = await flareIntegration.connect(fintech).initiateCreditScoreRequest(user.address, dataHash);
            const receipt = await tx.wait();
            
            const requestId = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
                ["address", "bytes32", "uint256", "uint256", "uint256"],
                [user.address, dataHash, 1, receipt.blockNumber, await flareIntegration.provider.getNetwork().then(n => n.chainId)]
            ));

            // Process Flare attestation
            await flareStateConnector.submitDataRequest(dataHash);
            const blockNumber = await ethers.provider.getBlockNumber();
            const messageHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
                ["bytes32", "bytes32", "uint256", "uint256"],
                [requestId, dataHash, blockNumber, await flareStateConnector.provider.getNetwork().then(n => n.chainId)]
            ));
            const signature = await validator.signMessage(ethers.utils.arrayify(messageHash));

            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine", []);

            await flareStateConnector.connect(validator).submitAttestation(
                requestId,
                dataHash,
                signature,
                blockNumber
            );

            await flareStateConnector.verifyAndProcessAttestation(requestId);

            const attestationProof = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("proof"));
            await flareIntegration.connect(fintech).processFlareAttestation(requestId, attestationProof);

            const flareData = await flareIntegration.getFlareData(requestId);
            expect(flareData.requestId).to.equal(requestId);
            expect(flareData.dataHash).to.equal(dataHash);
            expect(flareData.isValid).to.be.true;
        });

        it("Should correctly identify requests ready for Zama", async function () {
            const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test data"));
            const tx = await flareIntegration.connect(fintech).initiateCreditScoreRequest(user.address, dataHash);
            const receipt = await tx.wait();
            
            const requestId = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
                ["address", "bytes32", "uint256", "uint256", "uint256"],
                [user.address, dataHash, 1, receipt.blockNumber, await flareIntegration.provider.getNetwork().then(n => n.chainId)]
            ));

            // Initially not ready
            expect(await flareIntegration.isRequestReadyForZama(requestId)).to.be.false;

            // Process Flare attestation
            await flareStateConnector.submitDataRequest(dataHash);
            const blockNumber = await ethers.provider.getBlockNumber();
            const messageHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
                ["bytes32", "bytes32", "uint256", "uint256"],
                [requestId, dataHash, blockNumber, await flareStateConnector.provider.getNetwork().then(n => n.chainId)]
            ));
            const signature = await validator.signMessage(ethers.utils.arrayify(messageHash));

            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine", []);

            await flareStateConnector.connect(validator).submitAttestation(
                requestId,
                dataHash,
                signature,
                blockNumber
            );

            await flareStateConnector.verifyAndProcessAttestation(requestId);

            const attestationProof = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("proof"));
            await flareIntegration.connect(fintech).processFlareAttestation(requestId, attestationProof);

            // Now ready for Zama
            expect(await flareIntegration.isRequestReadyForZama(requestId)).to.be.true;
        });
    });

    describe("Pausable Functionality", function () {
        it("Should prevent operations when paused", async function () {
            await flareIntegration.pause();

            const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test data"));
            
            await expect(
                flareIntegration.connect(fintech).initiateCreditScoreRequest(user.address, dataHash)
            ).to.be.revertedWith("FlareIntegration: Contract is paused");
        });
    });
});
