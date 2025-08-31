import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, ContractFactory, Signer } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Identity Contract", function () {
  let Identity: ContractFactory;
  let identity: Contract;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let fintech1: SignerWithAddress;
  let fintech2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2, fintech1, fintech2] = await ethers.getSigners();
    Identity = await ethers.getContractFactory("Identity");
    identity = await Identity.deploy();
    await identity.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await identity.owner()).to.equal(owner.address);
    });

    it("Should not be paused initially", async function () {
      expect(await identity.paused()).to.be.false;
    });
  });

  describe("User Registration", function () {
    it("Should allow a user to register with a valid user ID", async function () {
      const userId = "user123";
      await identity.connect(user1).registerUser(userId);
      
      const userIdentity = await identity.getUserIdentity(user1.address);
      expect(userIdentity.userId).to.equal(userId);
      expect(userIdentity.isVerified).to.be.false;
      expect(userIdentity.createdAt).to.be.gt(0);
    });

    it("Should not allow registration with empty user ID", async function () {
      await expect(
        identity.connect(user1).registerUser("")
      ).to.be.revertedWith("User ID cannot be empty");
    });

    it("Should not allow duplicate user IDs", async function () {
      const userId = "user123";
      await identity.connect(user1).registerUser(userId);
      
      await expect(
        identity.connect(user2).registerUser(userId)
      ).to.be.revertedWith("User ID already exists");
    });

    it("Should not allow a user to register twice", async function () {
      const userId = "user123";
      await identity.connect(user1).registerUser(userId);
      
      await expect(
        identity.connect(user1).registerUser("user456")
      ).to.be.revertedWith("Address already registered");
    });
  });

  describe("User Verification", function () {
    beforeEach(async function () {
      await identity.connect(user1).registerUser("user123");
    });

    it("Should allow owner to verify a user", async function () {
      await identity.connect(owner).verifyUser(user1.address);
      
      const userIdentity = await identity.getUserIdentity(user1.address);
      expect(userIdentity.isVerified).to.be.true;
    });

    it("Should not allow non-owner to verify users", async function () {
      await expect(
        identity.connect(user2).verifyUser(user1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow verification of non-existent users", async function () {
      await expect(
        identity.connect(owner).verifyUser(user2.address)
      ).to.be.revertedWith("User not registered");
    });

    it("Should not allow double verification", async function () {
      await identity.connect(owner).verifyUser(user1.address);
      
      await expect(
        identity.connect(owner).verifyUser(user1.address)
      ).to.be.revertedWith("User already verified");
    });
  });

  describe("API Authorization", function () {
    beforeEach(async function () {
      await identity.connect(user1).registerUser("user123");
    });

    it("Should allow owner to authorize API access", async function () {
      const apiHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-api"));
      await identity.connect(owner).authorizeAPI(user1.address, apiHash);
      
      expect(await identity.hasAPIAccess(user1.address, apiHash)).to.be.true;
    });

    it("Should not allow non-owner to authorize APIs", async function () {
      const apiHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-api"));
      await expect(
        identity.connect(user2).authorizeAPI(user1.address, apiHash)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow API authorization for non-existent users", async function () {
      const apiHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-api"));
      await expect(
        identity.connect(owner).authorizeAPI(user2.address, apiHash)
      ).to.be.revertedWith("User not registered");
    });

    it("Should not allow duplicate API authorization", async function () {
      const apiHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-api"));
      await identity.connect(owner).authorizeAPI(user1.address, apiHash);
      
      await expect(
        identity.connect(owner).authorizeAPI(user1.address, apiHash)
      ).to.be.revertedWith("API already authorized");
    });
  });

  describe("API Revocation", function () {
    beforeEach(async function () {
      await identity.connect(user1).registerUser("user123");
      const apiHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-api"));
      await identity.connect(owner).authorizeAPI(user1.address, apiHash);
    });

    it("Should allow owner to revoke API access", async function () {
      const apiHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-api"));
      await identity.connect(owner).revokeAPI(user1.address, apiHash);
      
      expect(await identity.hasAPIAccess(user1.address, apiHash)).to.be.false;
    });

    it("Should not allow non-owner to revoke APIs", async function () {
      const apiHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-api"));
      await expect(
        identity.connect(user2).revokeAPI(user1.address, apiHash)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow revocation of non-authorized APIs", async function () {
      const apiHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("other-api"));
      await expect(
        identity.connect(owner).revokeAPI(user1.address, apiHash)
      ).to.be.revertedWith("API not authorized");
    });
  });

  describe("Fintech Authorization", function () {
    beforeEach(async function () {
      await identity.connect(user1).registerUser("user123");
    });

    it("Should allow owner to authorize fintech access", async function () {
      await identity.connect(owner).authorizeFintech(user1.address, fintech1.address);
      
      expect(await identity.isFintechAuthorized(user1.address, fintech1.address)).to.be.true;
    });

    it("Should not allow non-owner to authorize fintechs", async function () {
      await expect(
        identity.connect(user2).authorizeFintech(user1.address, fintech1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow fintech authorization for non-existent users", async function () {
      await expect(
        identity.connect(owner).authorizeFintech(user2.address, fintech1.address)
      ).to.be.revertedWith("User not registered");
    });

    it("Should not allow authorization with zero address", async function () {
      await expect(
        identity.connect(owner).authorizeFintech(user1.address, ethers.constants.AddressZero)
      ).to.be.revertedWith("Invalid fintech address");
    });

    it("Should not allow duplicate fintech authorization", async function () {
      await identity.connect(owner).authorizeFintech(user1.address, fintech1.address);
      
      await expect(
        identity.connect(owner).authorizeFintech(user1.address, fintech1.address)
      ).to.be.revertedWith("Fintech already authorized");
    });
  });

  describe("Fintech Revocation", function () {
    beforeEach(async function () {
      await identity.connect(user1).registerUser("user123");
      await identity.connect(owner).authorizeFintech(user1.address, fintech1.address);
    });

    it("Should allow owner to revoke fintech access", async function () {
      await identity.connect(owner).revokeFintech(user1.address, fintech1.address);
      
      expect(await identity.isFintechAuthorized(user1.address, fintech1.address)).to.be.false;
    });

    it("Should not allow non-owner to revoke fintechs", async function () {
      await expect(
        identity.connect(user2).revokeFintech(user1.address, fintech1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow revocation of non-authorized fintechs", async function () {
      await expect(
        identity.connect(owner).revokeFintech(user1.address, fintech2.address)
      ).to.be.revertedWith("Fintech not authorized");
    });
  });

  describe("Credit Score Requests", function () {
    beforeEach(async function () {
      await identity.connect(user1).registerUser("user123");
      await identity.connect(owner).verifyUser(user1.address);
      await identity.connect(owner).authorizeFintech(user1.address, fintech1.address);
    });

    it("Should allow authorized fintech to request credit score", async function () {
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("request1"));
      await identity.connect(fintech1).requestCreditScore(user1.address, requestId);
      
      const request = await identity.getCreditScoreRequest(requestId);
      expect(request.fintechAddress).to.equal(fintech1.address);
      expect(request.userAddress).to.equal(user1.address);
      expect(request.isApproved).to.be.false;
      expect(request.isCompleted).to.be.false;
    });

    it("Should not allow unauthorized fintech to request credit score", async function () {
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("request1"));
      await expect(
        identity.connect(fintech2).requestCreditScore(user1.address, requestId)
      ).to.be.revertedWith("Fintech not authorized");
    });

    it("Should not allow requests for unverified users", async function () {
      await identity.connect(user2).registerUser("user456");
      await identity.connect(owner).authorizeFintech(user2.address, fintech1.address);
      
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("request1"));
      await expect(
        identity.connect(fintech1).requestCreditScore(user2.address, requestId)
      ).to.be.revertedWith("User not verified");
    });

    it("Should not allow duplicate request IDs", async function () {
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("request1"));
      await identity.connect(fintech1).requestCreditScore(user1.address, requestId);
      
      await expect(
        identity.connect(fintech1).requestCreditScore(user1.address, requestId)
      ).to.be.revertedWith("Request ID already exists");
    });

    it("Should not allow requests with zero request ID", async function () {
      await expect(
        identity.connect(fintech1).requestCreditScore(user1.address, ethers.constants.HashZero)
      ).to.be.revertedWith("Invalid request ID");
    });
  });

  describe("Credit Score Request Approval", function () {
    beforeEach(async function () {
      await identity.connect(user1).registerUser("user123");
      await identity.connect(owner).verifyUser(user1.address);
      await identity.connect(owner).authorizeFintech(user1.address, fintech1.address);
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("request1"));
      await identity.connect(fintech1).requestCreditScore(user1.address, requestId);
    });

    it("Should allow user to approve credit score request", async function () {
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("request1"));
      await identity.connect(user1).approveCreditScoreRequest(requestId);
      
      const request = await identity.getCreditScoreRequest(requestId);
      expect(request.isApproved).to.be.true;
    });

    it("Should not allow non-user to approve request", async function () {
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("request1"));
      await expect(
        identity.connect(user2).approveCreditScoreRequest(requestId)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should not allow approval of already approved request", async function () {
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("request1"));
      await identity.connect(user1).approveCreditScoreRequest(requestId);
      
      await expect(
        identity.connect(user1).approveCreditScoreRequest(requestId)
      ).to.be.revertedWith("Request already approved");
    });
  });

  describe("Credit Score Request Rejection", function () {
    beforeEach(async function () {
      await identity.connect(user1).registerUser("user123");
      await identity.connect(owner).verifyUser(user1.address);
      await identity.connect(owner).authorizeFintech(user1.address, fintech1.address);
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("request1"));
      await identity.connect(fintech1).requestCreditScore(user1.address, requestId);
    });

    it("Should allow user to reject credit score request", async function () {
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("request1"));
      await identity.connect(user1).rejectCreditScoreRequest(requestId);
      
      const request = await identity.getCreditScoreRequest(requestId);
      expect(request.isApproved).to.be.false;
      expect(request.isCompleted).to.be.true;
    });

    it("Should not allow non-user to reject request", async function () {
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("request1"));
      await expect(
        identity.connect(user2).rejectCreditScoreRequest(requestId)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Credit Score Request Completion", function () {
    beforeEach(async function () {
      await identity.connect(user1).registerUser("user123");
      await identity.connect(owner).verifyUser(user1.address);
      await identity.connect(owner).authorizeFintech(user1.address, fintech1.address);
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("request1"));
      await identity.connect(fintech1).requestCreditScore(user1.address, requestId);
      await identity.connect(user1).approveCreditScoreRequest(requestId);
    });

    it("Should allow owner to complete approved request", async function () {
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("request1"));
      await identity.connect(owner).completeCreditScoreRequest(requestId);
      
      const request = await identity.getCreditScoreRequest(requestId);
      expect(request.isCompleted).to.be.true;
      
      const userIdentity = await identity.getUserIdentity(user1.address);
      expect(userIdentity.hasActiveCreditScore).to.be.true;
    });

    it("Should not allow non-owner to complete request", async function () {
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("request1"));
      await expect(
        identity.connect(user2).completeCreditScoreRequest(requestId)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow completion of unapproved request", async function () {
      await identity.connect(user2).registerUser("user456");
      await identity.connect(owner).verifyUser(user2.address);
      await identity.connect(owner).authorizeFintech(user2.address, fintech1.address);
      const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("request2"));
      await identity.connect(fintech1).requestCreditScore(user2.address, requestId);
      
      await expect(
        identity.connect(owner).completeCreditScoreRequest(requestId)
      ).to.be.revertedWith("Request not approved");
    });
  });

  describe("Contract Statistics", function () {
    beforeEach(async function () {
      await identity.connect(user1).registerUser("user123");
      await identity.connect(user2).registerUser("user456");
    });

    it("Should return correct contract statistics", async function () {
      const stats = await identity.getContractStats();
      expect(stats._totalUsers).to.equal(2);
      expect(stats._totalCreditScoreRequests).to.equal(0);
    });
  });

  describe("Pausability", function () {
    it("Should allow owner to pause and unpause", async function () {
      await identity.connect(owner).pause();
      expect(await identity.paused()).to.be.true;
      
      await identity.connect(owner).unpause();
      expect(await identity.paused()).to.be.false;
    });

    it("Should not allow non-owner to pause", async function () {
      await expect(
        identity.connect(user1).pause()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow registration when paused", async function () {
      await identity.connect(owner).pause();
      
      await expect(
        identity.connect(user1).registerUser("user123")
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple users and requests correctly", async function () {
      // Register multiple users
      await identity.connect(user1).registerUser("user1");
      await identity.connect(user2).registerUser("user2");
      
      // Verify users
      await identity.connect(owner).verifyUser(user1.address);
      await identity.connect(owner).verifyUser(user2.address);
      
      // Authorize fintechs
      await identity.connect(owner).authorizeFintech(user1.address, fintech1.address);
      await identity.connect(owner).authorizeFintech(user2.address, fintech1.address);
      
      // Make requests
      const requestId1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("request1"));
      const requestId2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("request2"));
      
      await identity.connect(fintech1).requestCreditScore(user1.address, requestId1);
      await identity.connect(fintech1).requestCreditScore(user2.address, requestId2);
      
      // Check statistics
      const stats = await identity.getContractStats();
      expect(stats._totalUsers).to.equal(2);
      expect(stats._totalCreditScoreRequests).to.equal(2);
    });
  });
});
