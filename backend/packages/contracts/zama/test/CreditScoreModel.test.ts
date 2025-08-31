import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, ContractFactory, Signer } from "ethers";

describe("CreditScoreModel", function () {
  let CreditScoreModel: ContractFactory;
  let creditScoreModel: Contract;
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let fintech1: Signer;
  let fintech2: Signer;
  let addr1: string;
  let addr2: string;
  let fintech1Addr: string;
  let fintech2Addr: string;
  let ownerAddr: string;

  beforeEach(async function () {
    [owner, user1, user2, fintech1, fintech2] = await ethers.getSigners();
    addr1 = await user1.getAddress();
    addr2 = await user2.getAddress();
    fintech1Addr = await fintech1.getAddress();
    fintech2Addr = await fintech2.getAddress();
    ownerAddr = await owner.getAddress();

    CreditScoreModel = await ethers.getContractFactory("CreditScoreModel");
    creditScoreModel = await CreditScoreModel.deploy();
    await creditScoreModel.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await creditScoreModel.owner()).to.equal(ownerAddr);
    });

    it("Should initialize with correct base credit score", async function () {
      expect(await creditScoreModel.baseCreditScore()).to.equal(350);
    });

    it("Should initialize with active model", async function () {
      const params = await creditScoreModel.getModelParameters();
      expect(params.isActive).to.be.true;
    });

    it("Should initialize with correct model parameters", async function () {
      const params = await creditScoreModel.getModelParameters();
      expect(params.baseScore).to.not.equal(0);
      expect(params.riskMultiplier).to.not.equal(0);
      expect(params.creditLimit).to.not.equal(0);
      expect(params.lastUpdated).to.be.gt(0);
    });
  });

  describe("Model Parameters", function () {
    it("Should allow owner to update model parameters", async function () {
      const newBaseScore = 400;
      const newRiskMultiplier = 120;
      const newCreditLimit = 15000;

      await creditScoreModel.updateModelParameters(
        newBaseScore,
        newRiskMultiplier,
        newCreditLimit
      );

      const params = await creditScoreModel.getModelParameters();
      expect(params.baseScore).to.not.equal(0);
      expect(params.riskMultiplier).to.not.equal(0);
      expect(params.creditLimit).to.not.equal(0);
      expect(await creditScoreModel.baseCreditScore()).to.equal(newBaseScore);
    });

    it("Should not allow non-owner to update model parameters", async function () {
      await expect(
        creditScoreModel.connect(user1).updateModelParameters(400, 120, 15000)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should reject invalid parameters", async function () {
      await expect(
        creditScoreModel.updateModelParameters(0, 120, 15000)
      ).to.be.revertedWith("Base score must be positive");

      await expect(
        creditScoreModel.updateModelParameters(400, 0, 15000)
      ).to.be.revertedWith("Risk multiplier must be positive");

      await expect(
        creditScoreModel.updateModelParameters(400, 120, 0)
      ).to.be.revertedWith("Credit limit must be positive");
    });

    it("Should emit events when updating parameters", async function () {
      const newBaseScore = 450;
      await expect(
        creditScoreModel.updateModelParameters(450, 120, 15000)
      )
        .to.emit(creditScoreModel, "ModelParametersUpdated")
        .and.to.emit(creditScoreModel, "BaseScoreUpdated")
        .withArgs(newBaseScore);
    });
  });

  describe("Model Activation", function () {
    it("Should allow owner to deactivate model", async function () {
      await creditScoreModel.setModelActive(false);
      
      const params = await creditScoreModel.getModelParameters();
      expect(params.isActive).to.be.false;
    });

    it("Should allow owner to reactivate model", async function () {
      await creditScoreModel.setModelActive(false);
      await creditScoreModel.setModelActive(true);
      
      const params = await creditScoreModel.getModelParameters();
      expect(params.isActive).to.be.true;
    });

    it("Should not allow non-owner to change model status", async function () {
      await expect(
        creditScoreModel.connect(user1).setModelActive(false)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Computation Requests", function () {
    let validUntil: number;
    const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-request"));
    const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-data"));

    beforeEach(async function () {
      // Get current block timestamp and add 1 hour
      const currentBlock = await ethers.provider.getBlock("latest");
      validUntil = currentBlock.timestamp + 3600; // 1 hour from current block time
    });

    it("Should allow fintech to request computation", async function () {
      await creditScoreModel.connect(fintech1).requestComputation(
        addr1,
        requestId,
        dataHash,
        validUntil
      );

      const [
        userAddress,
        timestamp,
        isCompleted,
        encryptedScore,
        dataHashResult,
        validUntilResult,
        requestedBy
      ] = await creditScoreModel.getComputationRequest(requestId);

      expect(userAddress).to.equal(addr1);
      expect(isCompleted).to.be.false;
      expect(dataHashResult).to.equal(dataHash);
      expect(validUntilResult).to.equal(validUntil);
      expect(requestedBy).to.equal(fintech1Addr);
    });

    it("Should reject invalid request parameters", async function () {
      await expect(
        creditScoreModel.connect(fintech1).requestComputation(
          ethers.constants.AddressZero,
          requestId,
          dataHash,
          validUntil
        )
      ).to.be.revertedWith("Invalid user address");

      await expect(
        creditScoreModel.connect(fintech1).requestComputation(
          addr1,
          ethers.constants.HashZero,
          dataHash,
          validUntil
        )
      ).to.be.revertedWith("Invalid request ID");

      await expect(
        creditScoreModel.connect(fintech1).requestComputation(
          addr1,
          requestId,
          ethers.constants.HashZero,
          validUntil
        )
      ).to.be.revertedWith("Invalid data hash");

      const currentBlock = await ethers.provider.getBlock("latest");
      const pastTime = currentBlock.timestamp - 3600; // 1 hour ago
      await expect(
        creditScoreModel.connect(fintech1).requestComputation(
          addr1,
          requestId,
          dataHash,
          pastTime
        )
      ).to.be.revertedWith("Invalid validity period");
    });

    it("Should reject duplicate request IDs", async function () {
      await creditScoreModel.connect(fintech1).requestComputation(
        addr1,
        requestId,
        dataHash,
        validUntil
      );

      await expect(
        creditScoreModel.connect(fintech2).requestComputation(
          addr2,
          requestId,
          dataHash,
          validUntil
        )
      ).to.be.revertedWith("Request ID already exists");
    });

    it("Should reject requests when model is inactive", async function () {
      await creditScoreModel.setModelActive(false);

      await expect(
        creditScoreModel.connect(fintech1).requestComputation(
          addr1,
          requestId,
          dataHash,
          validUntil
        )
      ).to.be.revertedWith("Model is not active");
    });

    it("Should track request statistics", async function () {
      expect(await creditScoreModel.totalRequests()).to.equal(0);

      await creditScoreModel.connect(fintech1).requestComputation(
        addr1,
        requestId,
        dataHash,
        validUntil
      );

      expect(await creditScoreModel.totalRequests()).to.equal(1);
    });

    it("Should emit ComputationRequested event", async function () {
      await expect(
        creditScoreModel.connect(fintech1).requestComputation(
          addr1,
          requestId,
          dataHash,
          validUntil
        )
      )
        .to.emit(creditScoreModel, "ComputationRequested")
        .withArgs(requestId, addr1, fintech1Addr);
    });
  });

  describe("Computation Execution", function () {
    let validUntil: number;
    const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-request"));
    const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-data"));
    const encryptedData = ethers.utils.randomBytes(64);

    beforeEach(async function () {
      // Get current block timestamp and add 1 hour
      const currentBlock = await ethers.provider.getBlock("latest");
      validUntil = currentBlock.timestamp + 3600; // 1 hour from current block time
    });

    beforeEach(async function () {
      await creditScoreModel.connect(fintech1).requestComputation(
        addr1,
        requestId,
        dataHash,
        validUntil
      );
    });

    it("Should allow owner to execute computation", async function () {
      await creditScoreModel.executeComputation(requestId, encryptedData);

      const [, , isCompleted] = await creditScoreModel.getComputationRequest(requestId);
      expect(isCompleted).to.be.true;
    });

    it("Should not allow non-owner to execute computation", async function () {
      await expect(
        creditScoreModel.connect(user1).executeComputation(requestId, encryptedData)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should reject execution for non-existent requests", async function () {
      const invalidRequestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("invalid"));
      await expect(
        creditScoreModel.executeComputation(invalidRequestId, encryptedData)
      ).to.be.revertedWith("Invalid request ID");
    });

    it("Should reject execution for completed requests", async function () {
      await creditScoreModel.executeComputation(requestId, encryptedData);

      await expect(
        creditScoreModel.executeComputation(requestId, encryptedData)
      ).to.be.revertedWith("Computation already completed");
    });

    it("Should reject execution for expired requests", async function () {
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [7200]); // 2 hours
      await ethers.provider.send("evm_mine", []);

      await expect(
        creditScoreModel.executeComputation(requestId, encryptedData)
      ).to.be.revertedWith("Request expired");
    });

    it("Should reject execution with empty encrypted data", async function () {
      await expect(
        creditScoreModel.executeComputation(requestId, [])
      ).to.be.revertedWith("Encrypted data cannot be empty");
    });

    it("Should reject execution when model is inactive", async function () {
      await creditScoreModel.setModelActive(false);

      await expect(
        creditScoreModel.executeComputation(requestId, encryptedData)
      ).to.be.revertedWith("Model is not active");
    });

    it("Should update completion statistics", async function () {
      expect(await creditScoreModel.completedRequests()).to.equal(0);

      await creditScoreModel.executeComputation(requestId, encryptedData);

      expect(await creditScoreModel.completedRequests()).to.equal(1);
    });

    it("Should emit ComputationCompleted event", async function () {
      await expect(
        creditScoreModel.executeComputation(requestId, encryptedData)
      )
        .to.emit(creditScoreModel, "ComputationCompleted")
        .withArgs(requestId, addr1, await creditScoreModel.getEncryptedScore(requestId));
    });
  });

  describe("Request Management", function () {
    let validUntil: number;
    const requestId1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("request-1"));
    const requestId2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("request-2"));
    const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-data"));

    beforeEach(async function () {
      // Get current block timestamp and add 1 hour
      const currentBlock = await ethers.provider.getBlock("latest");
      validUntil = currentBlock.timestamp + 3600; // 1 hour from current block time
    });

    beforeEach(async function () {
      await creditScoreModel.connect(fintech1).requestComputation(
        addr1,
        requestId1,
        dataHash,
        validUntil
      );
      await creditScoreModel.connect(fintech2).requestComputation(
        addr2,
        requestId2,
        dataHash,
        validUntil
      );
    });

    it("Should return user requests correctly", async function () {
      const userRequests = await creditScoreModel.getUserRequests(addr1);
      expect(userRequests).to.include(requestId1);
      expect(userRequests).to.not.include(requestId2);
    });

    it("Should return fintech requests correctly", async function () {
      const fintechRequests = await creditScoreModel.getFintechRequests(fintech1Addr);
      expect(fintechRequests).to.include(requestId1);
      expect(fintechRequests).to.not.include(requestId2);
    });

    it("Should check request validity correctly", async function () {
      expect(await creditScoreModel.isRequestValid(requestId1)).to.be.true;
      expect(await creditScoreModel.isRequestValid(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("invalid")))).to.be.false;
    });

    it("Should return encrypted score for completed requests", async function () {
      const encryptedData = ethers.utils.randomBytes(64);
      await creditScoreModel.executeComputation(requestId1, encryptedData);

      const score = await creditScoreModel.getEncryptedScore(requestId1);
      expect(score).to.not.equal(0);
    });

    it("Should reject getting encrypted score for incomplete requests", async function () {
      await expect(
        creditScoreModel.getEncryptedScore(requestId1)
      ).to.be.revertedWith("Computation not completed");
    });
  });

  describe("Contract Statistics", function () {
    it("Should return correct contract statistics", async function () {
      const [totalRequests, completedRequests, baseCreditScore] = await creditScoreModel.getContractStats();
      expect(totalRequests).to.equal(0);
      expect(completedRequests).to.equal(0);
      expect(baseCreditScore).to.equal(350);
    });

    it("Should update statistics correctly", async function () {
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-request"));
      const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-data"));
      const currentBlock = await ethers.provider.getBlock("latest");
      const validUntil = currentBlock.timestamp + 3600;

      await creditScoreModel.connect(fintech1).requestComputation(
        addr1,
        requestId,
        dataHash,
        validUntil
      );

      let [totalRequests, completedRequests, baseCreditScore] = await creditScoreModel.getContractStats();
      expect(totalRequests).to.equal(1);
      expect(completedRequests).to.equal(0);

      const encryptedData = ethers.utils.randomBytes(64);
      await creditScoreModel.executeComputation(requestId, encryptedData);

      [totalRequests, completedRequests, baseCreditScore] = await creditScoreModel.getContractStats();
      expect(totalRequests).to.equal(1);
      expect(completedRequests).to.equal(1);
    });
  });

  describe("Pausable Functionality", function () {
    it("Should allow owner to pause contract", async function () {
      await creditScoreModel.pause();
      expect(await creditScoreModel.paused()).to.be.true;
    });

    it("Should allow owner to unpause contract", async function () {
      await creditScoreModel.pause();
      await creditScoreModel.unpause();
      expect(await creditScoreModel.paused()).to.be.false;
    });

    it("Should not allow non-owner to pause contract", async function () {
      await expect(
        creditScoreModel.connect(user1).pause()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow non-owner to unpause contract", async function () {
      await creditScoreModel.pause();
      await expect(
        creditScoreModel.connect(user1).unpause()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should reject requests when paused", async function () {
      await creditScoreModel.pause();

      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-request"));
      const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-data"));
      const currentBlock = await ethers.provider.getBlock("latest");
      const validUntil = currentBlock.timestamp + 3600;

      await expect(
        creditScoreModel.connect(fintech1).requestComputation(
          addr1,
          requestId,
          dataHash,
          validUntil
        )
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Receive Function", function () {
    it("Should be able to receive ETH", async function () {
      const amount = ethers.utils.parseEther("1.0");
      await user1.sendTransaction({
        to: creditScoreModel.address,
        value: amount,
      });

      const balance = await ethers.provider.getBalance(creditScoreModel.address);
      expect(balance).to.equal(amount);
    });
  });
});
