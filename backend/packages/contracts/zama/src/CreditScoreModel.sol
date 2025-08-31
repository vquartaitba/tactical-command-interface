// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Import TFHE library for FHE operations (only available on Zama network)
// import {TFHE} from "fhevm/lib/TFHE.sol";

/**
 * @title CreditScoreModel
 * @dev Smart contract for credit score computation using FHE on Zama network
 * @notice This contract executes AI models on encrypted data and returns encrypted results
 */
contract CreditScoreModel is Ownable, Pausable, ReentrancyGuard {

    // TFHE using statements for encrypted operations (only on Zama network)
    // using TFHE for euint32;
    // using TFHE for euint16;
    // using TFHE for euint8;

    // Fallback types for local development (will be replaced by encrypted types on Zama)
    type euint32 is uint256;

    // Fallback TFHE functions for local development
    // These will be replaced by real TFHE operations on Zama network
    function asEuint32(uint256 value) internal pure returns (euint32) {
        return euint32.wrap(value);
    }
    function add(euint32 a, euint32 b) internal pure returns (euint32) {
        return euint32.wrap(euint32.unwrap(a) + euint32.unwrap(b));
    }
    function sub(euint32 a, euint32 b) internal pure returns (euint32) {
        return euint32.wrap(euint32.unwrap(a) - euint32.unwrap(b));
    }
    function mul(euint32 a, euint32 b) internal pure returns (euint32) {
        return euint32.wrap(euint32.unwrap(a) * euint32.unwrap(b));
    }
    function div(euint32 a, euint32 b) internal pure returns (euint32) {
        return euint32.wrap(euint32.unwrap(a) / euint32.unwrap(b));
    }
    function lt(euint32 a, euint32 b) internal pure returns (bool) {
        return euint32.unwrap(a) < euint32.unwrap(b);
    }
    function gt(euint32 a, euint32 b) internal pure returns (bool) {
        return euint32.unwrap(a) > euint32.unwrap(b);
    }
    function cmux(bool condition, euint32 ifTrue, euint32 ifFalse) internal pure returns (euint32) {
        return condition ? ifTrue : ifFalse;
    }
    function and(bool a, bool b) internal pure returns (bool) {
        return a && b;
    }
    function or(bool a, bool b) internal pure returns (bool) {
        return a || b;
    }
    
    struct ComputationRequest {
        address userAddress;
        bytes32 requestId;
        uint256 timestamp;
        bool isCompleted;
        euint32 encryptedScore; // Encrypted credit score (300-850)
        bytes32 dataHash;
        uint256 validUntil;
        address requestedBy;
    }

    struct ModelParameters {
        euint32 baseScore; // Encrypted base credit score
        euint32 riskMultiplier; // Encrypted risk multiplier (100 = 1.00)
        euint32 creditLimit; // Encrypted credit limit in dollars
        bool isActive;
        uint256 lastUpdated;
    }

    struct CreditFeatures {
        euint32 monthlyIncome;       // Encrypted monthly income in dollars
        euint32 totalDebt;           // Encrypted total outstanding debt
        euint32 debtToIncomeRatio;   // Encrypted debt-to-income ratio (0-100%)
        euint32 creditUtilization;   // Encrypted credit utilization percentage
        euint32 paymentHistory;      // Encrypted payment history score (300-850)
        euint32 accountAgeMonths;    // Encrypted age of credit accounts in months
        euint32 recentInquiries;     // Encrypted number of recent inquiries (0-10)
        euint32 employmentStability; // Encrypted months in current employment
    }

    mapping(bytes32 => ComputationRequest) public requests;
    mapping(address => bytes32[]) public userRequests;
    mapping(address => bytes32[]) public fintechRequests;
    
    ModelParameters public modelParams;

    uint256 public totalRequests;
    uint256 public completedRequests;
    euint32 public baseCreditScore;
    
    event ComputationRequested(bytes32 indexed requestId, address indexed userAddress, address indexed fintech);
    event ComputationCompleted(bytes32 indexed requestId, address indexed userAddress, uint256 encryptedScore);
    event ModelParametersUpdated(uint256 timestamp);
    event BaseScoreUpdated(uint256 newBaseScore);
    
    modifier onlyValidRequest(bytes32 _requestId) {
        require(requests[_requestId].userAddress != address(0), "Invalid request ID");
        _;
    }
    
    modifier onlyActiveModel() {
        require(modelParams.isActive, "Model is not active");
        _;
    }
    
    constructor() {
        // Initialize with encrypted values using TFHE (fallback for local development)
        baseCreditScore = asEuint32(350);

        // Initialize model parameters with encrypted values
        modelParams.baseScore = asEuint32(350);
        modelParams.riskMultiplier = asEuint32(100); // 1.00 as integer (100 = 1.00)
        modelParams.creditLimit = asEuint32(10000); // $10,000 base limit
        modelParams.isActive = true;
        modelParams.lastUpdated = block.timestamp;
    }
    
    /**
     * @dev Request a credit score computation
     * @param _userAddress Address of the user
     * @param _requestId Unique identifier for the request
     * @param _dataHash Hash of the encrypted user data
     * @param _validUntil Timestamp until which the request is valid
     */
    function requestComputation(
        address _userAddress,
        bytes32 _requestId,
        bytes32 _dataHash,
        uint256 _validUntil
    ) external whenNotPaused nonReentrant onlyActiveModel {
        require(_userAddress != address(0), "Invalid user address");
        require(_requestId != bytes32(0), "Invalid request ID");
        require(_dataHash != bytes32(0), "Invalid data hash");
        require(_validUntil > block.timestamp, "Invalid validity period");
        require(requests[_requestId].userAddress == address(0), "Request ID already exists");
        
        ComputationRequest storage request = requests[_requestId];
        request.userAddress = _userAddress;
        request.requestId = _requestId;
        request.timestamp = block.timestamp;
        request.isCompleted = false;
        request.dataHash = _dataHash;
        request.validUntil = _validUntil;
        request.requestedBy = msg.sender;
        
        // Initialize encrypted score to 0
        request.encryptedScore = asEuint32(0);
        
        userRequests[_userAddress].push(_requestId);
        fintechRequests[msg.sender].push(_requestId);
        totalRequests++;
        
        emit ComputationRequested(_requestId, _userAddress, msg.sender);
    }
    
    /**
     * @dev Execute credit score computation using FHE (only owner can call)
     * @param _requestId ID of the request to process
     * @param _encryptedUserData Encrypted user data for computation
     */
    function executeComputation(
        bytes32 _requestId,
        bytes calldata _encryptedUserData
    ) external onlyOwner onlyValidRequest(_requestId) onlyActiveModel {
        require(!requests[_requestId].isCompleted, "Computation already completed");
        require(requests[_requestId].validUntil > block.timestamp, "Request expired");
        require(_encryptedUserData.length > 0, "Encrypted data cannot be empty");
        
        ComputationRequest storage request = requests[_requestId];
     
        euint32 computedScore = computeCreditScore(_encryptedUserData);

        request.encryptedScore = computedScore;
        request.isCompleted = true;
        completedRequests++;

        // For the event, we emit the encrypted score handle
        emit ComputationCompleted(_requestId, request.userAddress, euint32.unwrap(computedScore));
    }
    
    /**
     * @dev Compute credit score using machine learning model with FHE
     * @param _encryptedData Encrypted user data containing financial features
     * @return euint32 Encrypted credit score (300-850 range)
     */
    function computeCreditScore(bytes calldata _encryptedData) public view returns (euint32) {
        // Extract encrypted features from encrypted data
        CreditFeatures memory features = extractFeatures(_encryptedData);

        // Apply machine learning model with encrypted operations
        euint32 score = applyCreditScoringModel(features);

        // Ensure score is within valid range using encrypted comparisons
        // cmux(condition, ifTrue, ifFalse) for conditional operations
        euint32 minScore = asEuint32(300);
        euint32 maxScore = asEuint32(850);

        // Clamp score between 300 and 850
        bool isBelowMin = lt(score, minScore);
        euint32 clampedScore = cmux(isBelowMin, minScore, score);

        bool isAboveMax = gt(clampedScore, maxScore);
        clampedScore = cmux(isAboveMax, maxScore, clampedScore);

        return clampedScore;
    }

    /**
     * @dev Extract credit scoring features from encrypted data
     * @param _encryptedData Raw encrypted user data
     * @return CreditFeatures struct with encrypted features
     */
    function extractFeatures(bytes calldata _encryptedData) public view returns (CreditFeatures memory) {
        // In production, this would parse pre-encrypted fields from _encryptedData
        // For this example, we simulate feature extraction by encrypting derived values

        bytes32 dataHash = keccak256(_encryptedData);

        // Extract 8 features from the hash and encrypt them
        uint256[8] memory hashParts;
        for (uint i = 0; i < 8; i++) {
            hashParts[i] = uint256(dataHash) >> (i * 32) & 0xFFFFFFFF;
        }

        // Encrypt each feature using local functions (will be real TFHE on Zama)
        return CreditFeatures({
            monthlyIncome: asEuint32(2000 + (hashParts[0] % 8000)),      // $2K - $10K
            totalDebt: asEuint32(hashParts[1] % 100000),                   // $0 - $100K
            debtToIncomeRatio: asEuint32(hashParts[2] % 50),               // 0-50%
            creditUtilization: asEuint32(hashParts[3] % 100),              // 0-100%
            paymentHistory: asEuint32(300 + (hashParts[4] % 550)),         // 300-850
            accountAgeMonths: asEuint32(6 + (hashParts[5] % 240)),         // 6-246 months
            recentInquiries: asEuint32(hashParts[6] % 10),                 // 0-10
            employmentStability: asEuint32(hashParts[7] % 12)              // 0-12 months
        });
    }

    /**
     * @dev Apply machine learning model for credit scoring using FHE operations
     * @param features Extracted encrypted credit features
     * @return euint32 Computed encrypted credit score
     */
    function applyCreditScoringModel(CreditFeatures memory features) public view returns (euint32) {
        // Base score (FICO-like starting point) - encrypted
        euint32 score = asEuint32(450);

        // Feature weights (trained model coefficients) - encrypted
        // Positive weights increase score, negative weights decrease score

        // Income factors (positive impact) - using encrypted multiplication
        euint32 incomeBonus = mul(features.monthlyIncome, asEuint32(15));
        incomeBonus = div(incomeBonus, asEuint32(10000));  // +1.5 points per $10K income
        score = add(score, incomeBonus);

        euint32 employmentBonus = mul(features.employmentStability, asEuint32(8));
        score = add(score, employmentBonus);  // +8 points per month of employment

        // Debt factors (negative impact) - using encrypted operations with bounds checking
        euint32 debtPenalty = mul(features.totalDebt, asEuint32(25));
        debtPenalty = div(debtPenalty, asEuint32(100000));  // -2.5 points per $10K debt

        bool canSubtractDebt = lt(debtPenalty, score);
        score = sub(score, cmux(canSubtractDebt, debtPenalty, asEuint32(0)));

        // DTI penalty
        euint32 dtiPenalty = mul(features.debtToIncomeRatio, asEuint32(6));  // -6 points per percentage
        bool canSubtractDTI = lt(dtiPenalty, score);
        score = sub(score, cmux(canSubtractDTI, dtiPenalty, asEuint32(0)));

        // Utilization penalty
        euint32 utilPenalty = mul(features.creditUtilization, asEuint32(2));  // -2 points per percentage
        bool canSubtractUtil = lt(utilPenalty, score);
        score = sub(score, cmux(canSubtractUtil, utilPenalty, asEuint32(0)));

        // Credit history factors - encrypted arithmetic
        euint32 paymentBonus = sub(features.paymentHistory, asEuint32(300));
        paymentBonus = div(paymentBonus, asEuint32(2));  // +0.5 points per payment score point
        score = add(score, paymentBonus);

        euint32 ageBonus = div(features.accountAgeMonths, asEuint32(3));  // +0.33 points per month
        score = add(score, ageBonus);

        // Risk factors - inquiry penalty
        euint32 inquiryPenalty = mul(features.recentInquiries, asEuint32(15));  // -15 points per inquiry
        bool canSubtractInquiry = lt(inquiryPenalty, score);
        score = sub(score, cmux(canSubtractInquiry, inquiryPenalty, asEuint32(0)));

        // Non-linear transformations using encrypted conditionals

        // Age bonus (accounts with longer history get bonus)
        bool hasLongHistory = gt(features.accountAgeMonths, asEuint32(60));
        euint32 extraAgeBonus = sub(features.accountAgeMonths, asEuint32(60));
        extraAgeBonus = div(extraAgeBonus, asEuint32(4));
        score = add(score, cmux(hasLongHistory, extraAgeBonus, asEuint32(0)));

        // Income stability bonus
        bool hasHighIncome = gt(features.monthlyIncome, asEuint32(5000));
        bool hasStableJob = gt(features.employmentStability, asEuint32(24));
        bool stabilityBonusCondition = and(hasHighIncome, hasStableJob);
        score = add(score, cmux(stabilityBonusCondition, asEuint32(50), asEuint32(0)));

        // Debt management bonus
        bool lowDTI = lt(features.debtToIncomeRatio, asEuint32(20));
        bool lowUtilization = lt(features.creditUtilization, asEuint32(30));
        bool debtBonusCondition = and(lowDTI, lowUtilization);
        score = add(score, cmux(debtBonusCondition, asEuint32(75), asEuint32(0)));

        // High-risk penalty
        bool manyInquiries = gt(features.recentInquiries, asEuint32(5));
        bool highDTI = gt(features.debtToIncomeRatio, asEuint32(43));
        bool highRiskCondition = or(manyInquiries, highDTI);
        euint32 riskPenalty = cmux(highRiskCondition, asEuint32(100), asEuint32(0));
        bool canApplyPenalty = gt(score, asEuint32(100));
        euint32 actualPenalty = cmux(canApplyPenalty, riskPenalty, asEuint32(0));
        score = sub(score, actualPenalty);

        return score;
    }
    
    /**
     * @dev Get computation request details
     * @param _requestId ID of the request
     * @return userAddress Address of the user
     * @return timestamp When the request was made
     * @return isCompleted Whether computation is complete
     * @return encryptedScore Result if completed 
     * @return dataHash Hash of the input data
     * @return validUntil When the request expires
     * @return requestedBy Address that requested the computation
     */
    function getComputationRequest(bytes32 _requestId) external view onlyValidRequest(_requestId) returns (
        address userAddress,
        uint256 timestamp,
        bool isCompleted,
        euint32 encryptedScore,
        bytes32 dataHash,
        uint256 validUntil,
        address requestedBy
    ) {
        ComputationRequest storage request = requests[_requestId];
        return (
            request.userAddress,
            request.timestamp,
            request.isCompleted,
            request.encryptedScore,
            request.dataHash,
            request.validUntil,
            request.requestedBy
        );
    }
    
    /**
     * @dev Get all requests for a user
     * @param _userAddress Address of the user
     * @return Array of request IDs
     */
    function getUserRequests(address _userAddress) external view returns (bytes32[] memory) {
        return userRequests[_userAddress];
    }
    
    /**
     * @dev Get all requests from a fintech
     * @param _fintechAddress Address of the fintech
     * @return Array of request IDs
     */
    function getFintechRequests(address _fintechAddress) external view returns (bytes32[] memory) {
        return fintechRequests[_fintechAddress];
    }
    
    /**
     * @dev Update model parameters (only owner can call)
     * @param _baseScore New base credit score
     * @param _riskMultiplier New risk multiplier
     * @param _creditLimit New credit limit
     */
    function updateModelParameters(
        uint32 _baseScore,
        uint32 _riskMultiplier,
        uint32 _creditLimit
    ) external onlyOwner {
        require(_baseScore > 0, "Base score must be positive");
        require(_riskMultiplier > 0, "Risk multiplier must be positive");
        require(_creditLimit > 0, "Credit limit must be positive");

        modelParams.baseScore = asEuint32(_baseScore);
        modelParams.riskMultiplier = asEuint32(_riskMultiplier);
        modelParams.creditLimit = asEuint32(_creditLimit);
        modelParams.lastUpdated = block.timestamp;

        baseCreditScore = asEuint32(_baseScore);

        emit ModelParametersUpdated(block.timestamp);
        emit BaseScoreUpdated(_baseScore);
    }
    
    /**
     * @dev Activate/deactivate the model (only owner can call)
     * @param _isActive Whether the model should be active
     */
    function setModelActive(bool _isActive) external onlyOwner {
        modelParams.isActive = _isActive;
        modelParams.lastUpdated = block.timestamp;
    }
    
    /**
     * @dev Get model parameters
     * @return baseScore Encrypted base credit score
     * @return riskMultiplier Encrypted risk multiplier
     * @return creditLimit Encrypted credit limit
     * @return isActive Whether model is active
     * @return lastUpdated When parameters were last updated
     */
    function getModelParameters() external view returns (
        euint32 baseScore,
        euint32 riskMultiplier,
        euint32 creditLimit,
        bool isActive,
        uint256 lastUpdated
    ) {
        return (
            modelParams.baseScore,
            modelParams.riskMultiplier,
            modelParams.creditLimit,
            modelParams.isActive,
            modelParams.lastUpdated
        );
    }
    
    /**
     * @dev Get contract statistics
     * @return _totalRequests Total number of requests
     * @return _completedRequests Number of completed requests
     * @return _baseCreditScore Current encrypted base credit score
     */
    function getContractStats() external view returns (
        uint256 _totalRequests,
        uint256 _completedRequests,
        euint32 _baseCreditScore
    ) {
        return (totalRequests, completedRequests, baseCreditScore);
    }
    
    /**
     * @dev Check if a request is still valid
     * @param _requestId ID of the request
     * @return bool True if request is valid
     */
    function isRequestValid(bytes32 _requestId) external view returns (bool) {
        if (requests[_requestId].userAddress == address(0)) {
            return false;
        }
        return requests[_requestId].validUntil > block.timestamp;
    }
    
    /**
     * @dev Get the encrypted score for a completed request
     * @param _requestId ID of the request
     * @return euint32 Encrypted credit score
     */
    function getEncryptedScore(bytes32 _requestId) external view onlyValidRequest(_requestId) returns (euint32) {
        require(requests[_requestId].isCompleted, "Computation not completed");
        return requests[_requestId].encryptedScore;
    }
    
    /**
     * @dev Emergency function to pause the contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Emergency function to unpause the contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Function to receive ETH (for future fee collection)
     */
    receive() external payable {
        // Contract can receive ETH for fee collection
        // Implementation for fee logic can be added later
    }
}
