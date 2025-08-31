import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, ContractFactory, Signer, BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("FlareStateConnector", function () {
    let FlareStateConnector: ContractFactory;
    let flareStateConnector: Contract;
    let owner: SignerWithAddress;
    let validator1: SignerWithAddress;
    let validator2: SignerWithAddress;
    let dataSource: SignerWithAddress;
    let user: SignerWithAddress;
    let otherUser: SignerWithAddress;

    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
    const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000";

    beforeEach(async function () {
        [owner, validator1, validator2, dataSource, user, otherUser] = await ethers.getSigners();
        
        FlareStateConnector = await ethers.getContractFactory("FlareStateConnector");
        flareStateConnector = await FlareStateConnector.deploy();
        await flareStateConnector.deployed();

        // Setup initial whitelist
        await flareStateConnector.setValidatorWhitelist(validator1.address, true);
        await flareStateConnector.setValidatorWhitelist(validator2.address, true);
        await flareStateConnector.setDataSourceWhitelist(dataSource.address, true);
    });

    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            expect(await flareStateConnector.owner()).to.equal(owner.address);
        });

        it("Should have correct initial parameters", async function () {
            expect(await flareStateConnector.minAttestationDelay()).to.equal(3600); // 1 hour
            expect(await flareStateConnector.maxAttestationAge()).to.equal(86400); // 24 hours
            expect(await flareStateConnector.requiredValidatorCount()).to.equal(3);
        });
    });

    describe("Data Request Management", function () {
        it("Should allow users to submit data requests", async function () {
            const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test data"));
            const tx = await flareStateConnector.connect(user).submitDataRequest(dataHash);
            const receipt = await tx.wait();
            
            // Get the request ID from the transaction
            const requestId = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
                ["address", "bytes32", "uint256", "uint256"],
                [user.address, dataHash, receipt.blockNumber, await flareStateConnector.provider.getNetwork().then(n => n.chainId)]
            ));

            const request = await flareStateConnector.getDataRequest(requestId);
            expect(request.requester).to.equal(user.address);
            expect(request.dataHash).to.equal(dataHash);
            expect(request.isFulfilled).to.be.false;
        });

        it("Should prevent duplicate requests with same data hash", async function () {
            const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test data"));
            
            await flareStateConnector.connect(user).submitDataRequest(dataHash);
            
            // Try to submit the same request again
            await expect(
                flareStateConnector.connect(user).submitDataRequest(dataHash)
            ).to.be.revertedWith("FlareStateConnector: Request already exists");
        });

        it("Should reject requests with zero data hash", async function () {
            await expect(
                flareStateConnector.connect(user).submitDataRequest(ZERO_BYTES32)
            ).to.be.revertedWith("FlareStateConnector: Invalid data hash");
        });
    });

    describe("Attestation Management", function () {
        let requestId: string;
        let dataHash: string;

        beforeEach(async function () {
            dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test data"));
            const tx = await flareStateConnector.connect(user).submitDataRequest(dataHash);
            const receipt = await tx.wait();
            
            requestId = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
                ["address", "bytes32", "uint256", "uint256"],
                [user.address, dataHash, receipt.blockNumber, await flareStateConnector.provider.getNetwork().then(n => n.chainId)]
            ));
        });

        it("Should allow whitelisted validators to submit attestations", async function () {
            const blockNumber = await ethers.provider.getBlockNumber();
            
            // Create signature
            const messageHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
                ["bytes32", "bytes32", "uint256", "uint256"],
                [requestId, dataHash, blockNumber, await flareStateConnector.provider.getNetwork().then(n => n.chainId)]
            ));
            const ethSignedMessageHash = ethers.utils.hashMessage(ethers.utils.arrayify(messageHash));
            const signature = await validator1.signMessage(ethers.utils.arrayify(messageHash));

            // Fast forward time to meet minimum delay requirement
            await ethers.provider.send("evm_increaseTime", [3601]); // 1 hour + 1 second
            await ethers.provider.send("evm_mine", []);

            await expect(
                flareStateConnector.connect(validator1).submitAttestation(
                    requestId,
                    dataHash,
                    signature,
                    blockNumber
                )
            ).to.emit(flareStateConnector, "AttestationReceived");

            const request = await flareStateConnector.getDataRequest(requestId);
            expect(request.isFulfilled).to.be.true;
        });

        it("Should prevent non-whitelisted validators from submitting attestations", async function () {
            const blockNumber = await ethers.provider.getBlockNumber();
            const messageHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
                ["bytes32", "bytes32", "uint256", "uint256"],
                [requestId, dataHash, blockNumber, await flareStateConnector.provider.getNetwork().then(n => n.chainId)]
            ));
            const signature = await otherUser.signMessage(ethers.utils.arrayify(messageHash));

            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine", []);

            await expect(
                flareStateConnector.connect(otherUser).submitAttestation(
                    requestId,
                    dataHash,
                    signature,
                    blockNumber
                )
            ).to.be.revertedWith("FlareStateConnector: Not a whitelisted validator");
        });

        it("Should prevent attestations before minimum delay", async function () {
            const blockNumber = await ethers.provider.getBlockNumber();
            const messageHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
                ["bytes32", "bytes32", "uint256", "uint256"],
                [requestId, dataHash, blockNumber, await flareStateConnector.provider.getNetwork().then(n => n.chainId)]
            ));
            const signature = await validator1.signMessage(ethers.utils.arrayify(messageHash));

            // Try to submit attestation immediately
            await expect(
                flareStateConnector.connect(validator1).submitAttestation(
                    requestId,
                    dataHash,
                    signature,
                    blockNumber
                )
            ).to.be.revertedWith("FlareStateConnector: Attestation too recent");
        });

        it("Should verify signature correctly", async function () {
            const blockNumber = await ethers.provider.getBlockNumber();
            const messageHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
                ["bytes32", "bytes32", "uint256", "uint256"],
                [requestId, dataHash, blockNumber, await flareStateConnector.provider.getNetwork().then(n => n.chainId)]
            ));
            
            // Create signature with wrong message
            const wrongMessageHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
                ["bytes32", "bytes32", "uint256", "uint256"],
                [requestId, ethers.utils.keccak256(ethers.utils.toUtf8Bytes("wrong data")), blockNumber, await flareStateConnector.provider.getNetwork().then(n => n.chainId)]
            ));
            const signature = await validator1.signMessage(ethers.utils.arrayify(wrongMessageHash));

            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine", []);

            await expect(
                flareStateConnector.connect(validator1).submitAttestation(
                    requestId,
                    dataHash,
                    signature,
                    blockNumber
                )
            ).to.be.revertedWith("FlareStateConnector: Invalid signature");
        });
    });

    describe("Attestation Verification", function () {
        let requestId: string;
        let dataHash: string;
        let attestation: any;

        beforeEach(async function () {
            dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test data"));
            const tx = await flareStateConnector.connect(user).submitDataRequest(dataHash);
            const receipt = await tx.wait();
            
            requestId = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
                ["address", "bytes32", "uint256", "uint256"],
                [user.address, dataHash, receipt.blockNumber, await flareStateConnector.provider.getNetwork().then(n => n.chainId)]
            ));

            // Submit attestation
            const blockNumber = await ethers.provider.getBlockNumber();
            const messageHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
                ["bytes32", "bytes32", "uint256", "uint256"],
                [requestId, dataHash, blockNumber, await flareStateConnector.provider.getNetwork().then(n => n.chainId)]
            ));
            const signature = await validator1.signMessage(ethers.utils.arrayify(messageHash));

            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine", []);

            await flareStateConnector.connect(validator1).submitAttestation(
                requestId,
                dataHash,
                signature,
                blockNumber
            );

            attestation = await flareStateConnector.getAttestation(requestId);
        });

        it("Should allow verification of valid attestations", async function () {
            const isValid = await flareStateConnector.connect(user).verifyAndProcessAttestation(requestId);
            expect(isValid).to.be.true;

            const isProcessed = await flareStateConnector.isAttestationValidAndProcessed(requestId);
            expect(isProcessed).to.be.true;
        });

        it("Should prevent double processing of attestations", async function () {
            await flareStateConnector.connect(user).verifyAndProcessAttestation(requestId);
            
            await expect(
                flareStateConnector.connect(user).verifyAndProcessAttestation(requestId)
            ).to.be.revertedWith("FlareStateConnector: Attestation already processed");
        });

        it("Should reject verification of unfulfilled requests", async function () {
            // Create new request without attestation
            const newDataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("new test data"));
            const tx = await flareStateConnector.connect(otherUser).submitDataRequest(newDataHash);
            const receipt = await tx.wait();
            
            const newRequestId = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
                ["address", "bytes32", "uint256", "uint256"],
                [otherUser.address, newDataHash, receipt.blockNumber, await flareStateConnector.provider.getNetwork().then(n => n.chainId)]
            ));

            await expect(
                flareStateConnector.connect(otherUser).verifyAndProcessAttestation(newRequestId)
            ).to.be.revertedWith("FlareStateConnector: Request not fulfilled");
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to whitelist/remove validators", async function () {
            await expect(
                flareStateConnector.setValidatorWhitelist(otherUser.address, true)
            ).to.emit(flareStateConnector, "ValidatorWhitelisted")
                .withArgs(otherUser.address, true, await ethers.provider.getBlockNumber());

            expect(await flareStateConnector.whitelistedValidators(otherUser.address)).to.be.true;

            await expect(
                flareStateConnector.setValidatorWhitelist(validator1.address, false)
            ).to.emit(flareStateConnector, "ValidatorWhitelisted")
                .withArgs(validator1.address, false, await ethers.provider.getBlockNumber());

            expect(await flareStateConnector.whitelistedValidators(validator1.address)).to.be.false;
        });

        it("Should allow owner to whitelist/remove data sources", async function () {
            await expect(
                flareStateConnector.setDataSourceWhitelist(otherUser.address, true)
            ).to.emit(flareStateConnector, "DataSourceWhitelisted")
                .withArgs(otherUser.address, true, await ethers.provider.getBlockNumber());

            expect(await flareStateConnector.whitelistedDataSources(otherUser.address)).to.be.true;
        });

        it("Should allow owner to update attestation parameters", async function () {
            await flareStateConnector.updateAttestationParameters(7200, 48000); // 2 hours, 13.33 hours
            
            expect(await flareStateConnector.minAttestationDelay()).to.equal(7200);
            expect(await flareStateConnector.maxAttestationAge()).to.equal(48000);
        });

        it("Should prevent invalid parameter updates", async function () {
            await expect(
                flareStateConnector.updateAttestationParameters(48000, 7200) // max < min
            ).to.be.revertedWith("FlareStateConnector: Invalid parameters");
        });

        it("Should allow owner to update required validator count", async function () {
            await flareStateConnector.updateRequiredValidatorCount(5);
            expect(await flareStateConnector.requiredValidatorCount()).to.equal(5);
        });

        it("Should prevent zero validator count", async function () {
            await expect(
                flareStateConnector.updateRequiredValidatorCount(0)
            ).to.be.revertedWith("FlareStateConnector: Invalid validator count");
        });

        it("Should prevent non-owners from calling admin functions", async function () {
            await expect(
                flareStateConnector.connect(user).setValidatorWhitelist(otherUser.address, true)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Edge Cases and Security", function () {
        it("Should handle expired attestations correctly", async function () {
            const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test data"));
            const tx = await flareStateConnector.connect(user).submitDataRequest(dataHash);
            const receipt = await tx.wait();
            
            const requestId = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
                ["address", "bytes32", "uint256", "uint256"],
                [user.address, dataHash, receipt.blockNumber, await flareStateConnector.provider.getNetwork().then(n => n.chainId)]
            ));

            // Submit attestation
            const blockNumber = await ethers.provider.getBlockNumber();
            const messageHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
                ["bytes32", "bytes32", "uint256", "uint256"],
                [requestId, dataHash, blockNumber, await flareStateConnector.provider.getNetwork().then(n => n.chainId)]
            ));
            const signature = await validator1.signMessage(ethers.utils.arrayify(messageHash));

            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine", []);

            await flareStateConnector.connect(validator1).submitAttestation(
                requestId,
                dataHash,
                signature,
                blockNumber
            );

            // Fast forward past max age
            await ethers.provider.send("evm_increaseTime", [86401]); // 24 hours + 1 second
            await ethers.provider.send("evm_mine", []);

            // Try to verify expired attestation
            const isValid = await flareStateConnector.connect(user).verifyAndProcessAttestation(requestId);
            expect(isValid).to.be.false;
        });

        it("Should handle validator removal correctly", async function () {
            const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test data"));
            const tx = await flareStateConnector.connect(user).submitDataRequest(dataHash);
            const receipt = await tx.wait();
            
            const requestId = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
                ["address", "bytes32", "uint256", "uint256"],
                [user.address, dataHash, receipt.blockNumber, await flareStateConnector.provider.getNetwork().then(n => n.chainId)]
            ));

            // Submit attestation
            const blockNumber = await ethers.provider.getBlockNumber();
            const messageHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
                ["bytes32", "bytes32", "uint256", "uint256"],
                [requestId, dataHash, blockNumber, await flareStateConnector.provider.getNetwork().then(n => n.chainId)]
            ));
            const signature = await validator1.signMessage(ethers.utils.arrayify(messageHash));

            await ethers.provider.send("evm_increaseTime", [3601]);
            await ethers.provider.send("evm_mine", []);

            await flareStateConnector.connect(validator1).submitAttestation(
                requestId,
                dataHash,
                signature,
                blockNumber
            );

            // Remove validator from whitelist
            await flareStateConnector.setValidatorWhitelist(validator1.address, false);

            // Try to verify attestation from removed validator
            const isValid = await flareStateConnector.connect(user).verifyAndProcessAttestation(requestId);
            expect(isValid).to.be.false;
        });
    });
});
