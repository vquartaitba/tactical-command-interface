// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Identity
 * @dev Smart contract for managing user identity in the Zkredit protocol
 * @notice This contract handles user registration, verification, and identity management
 */
contract Identity is Ownable, Pausable, ReentrancyGuard {
    
    struct UserIdentity {
        address userAddress;
        string userId;
        bool isVerified;
        uint256 createdAt;
        uint256 lastUpdated;
        mapping(bytes32 => bool) authorizedAPIs;
        mapping(bytes32 => uint256) dataAccessTimestamps;
        mapping(address => bool) authorizedFintechs;
        mapping(address => uint256) fintechAuthorizationTimestamps;
        bool hasActiveCreditScore;
        uint256 lastCreditScoreRequest;
    }
    
    struct CreditScoreRequest {
        address fintechAddress;
        address userAddress;
        uint256 timestamp;
        bool isApproved;
        bool isCompleted;
        bytes32 requestId;
    }
    
    mapping(address => UserIdentity) public identities;
    mapping(string => address) public userIdToAddress;
    mapping(bytes32 => CreditScoreRequest) public creditScoreRequests;
    mapping(address => bytes32[]) public userCreditScoreRequests;
    mapping(address => bytes32[]) public fintechCreditScoreRequests;
    
    uint256 public totalUsers;
    uint256 public totalCreditScoreRequests;
    
    event UserRegistered(address indexed userAddress, string userId);
    event UserVerified(address indexed userAddress);
    event APIAuthorized(address indexed userAddress, bytes32 apiHash);
    event APIRevoked(address indexed userAddress, bytes32 apiHash);
    event FintechAuthorized(address indexed userAddress, address indexed fintechAddress);
    event FintechRevoked(address indexed userAddress, address indexed fintechAddress);
    event CreditScoreRequested(bytes32 indexed requestId, address indexed fintechAddress, address indexed userAddress);
    event CreditScoreApproved(bytes32 indexed requestId, address indexed userAddress);
    event CreditScoreRejected(bytes32 indexed requestId, address indexed userAddress);
    
    modifier onlyRegisteredUser() {
        require(identities[msg.sender].userAddress != address(0), "User not registered");
        _;
    }
    
    modifier onlyVerifiedUser() {
        require(identities[msg.sender].isVerified, "User not verified");
        _;
    }
    
    modifier onlyValidRequest(bytes32 _requestId) {
        require(creditScoreRequests[_requestId].userAddress != address(0), "Invalid request ID");
        _;
    }
    
    /**
     * @dev Register a new user identity
     * @param _userId Unique identifier for the user
     */
    function registerUser(string memory _userId) external whenNotPaused nonReentrant {
        require(bytes(_userId).length > 0, "User ID cannot be empty");
        require(userIdToAddress[_userId] == address(0), "User ID already exists");
        require(identities[msg.sender].userAddress == address(0), "Address already registered");
        
        UserIdentity storage newIdentity = identities[msg.sender];
        newIdentity.userAddress = msg.sender;
        newIdentity.userId = _userId;
        newIdentity.isVerified = false;
        newIdentity.createdAt = block.timestamp;
        newIdentity.lastUpdated = block.timestamp;
        newIdentity.hasActiveCreditScore = false;
        
        userIdToAddress[_userId] = msg.sender;
        totalUsers++;
        
        emit UserRegistered(msg.sender, _userId);
    }
    
    /**
     * @dev Verify a user's identity (only owner can call)
     * @param _userAddress Address of the user to verify
     */
    function verifyUser(address _userAddress) external onlyOwner {
        require(identities[_userAddress].userAddress != address(0), "User not registered");
        require(!identities[_userAddress].isVerified, "User already verified");
        
        identities[_userAddress].isVerified = true;
        identities[_userAddress].lastUpdated = block.timestamp;
        
        emit UserVerified(_userAddress);
    }
    
    /**
     * @dev Authorize an API for a user
     * @param _userAddress Address of the user
     * @param _apiHash Hash of the API identifier
     */
    function authorizeAPI(address _userAddress, bytes32 _apiHash) external onlyOwner {
        require(identities[_userAddress].userAddress != address(0), "User not registered");
        require(!identities[_userAddress].authorizedAPIs[_apiHash], "API already authorized");
        
        identities[_userAddress].authorizedAPIs[_apiHash] = true;
        identities[_userAddress].dataAccessTimestamps[_apiHash] = block.timestamp;
        identities[_userAddress].lastUpdated = block.timestamp;
        
        emit APIAuthorized(_userAddress, _apiHash);
    }
    
    /**
     * @dev Revoke API access for a user
     * @param _userAddress Address of the user
     * @param _apiHash Hash of the API identifier
     */
    function revokeAPI(address _userAddress, bytes32 _apiHash) external onlyOwner {
        require(identities[_userAddress].userAddress != address(0), "User not registered");
        require(identities[_userAddress].authorizedAPIs[_apiHash], "API not authorized");
        
        identities[_userAddress].authorizedAPIs[_apiHash] = false;
        identities[_userAddress].lastUpdated = block.timestamp;
        
        emit APIRevoked(_userAddress, _apiHash);
    }
    
    /**
     * @dev Authorize a fintech to access user data
     * @param _userAddress Address of the user
     * @param _fintechAddress Address of the fintech
     */
    function authorizeFintech(address _userAddress, address _fintechAddress) external onlyOwner {
        require(identities[_userAddress].userAddress != address(0), "User not registered");
        require(_fintechAddress != address(0), "Invalid fintech address");
        require(!identities[_userAddress].authorizedFintechs[_fintechAddress], "Fintech already authorized");
        
        identities[_userAddress].authorizedFintechs[_fintechAddress] = true;
        identities[_userAddress].fintechAuthorizationTimestamps[_fintechAddress] = block.timestamp;
        identities[_userAddress].lastUpdated = block.timestamp;
        
        emit FintechAuthorized(_userAddress, _fintechAddress);
    }
    
    /**
     * @dev Revoke fintech access for a user
     * @param _userAddress Address of the user
     * @param _fintechAddress Address of the fintech
     */
    function revokeFintech(address _userAddress, address _fintechAddress) external onlyOwner {
        require(identities[_userAddress].userAddress != address(0), "User not registered");
        require(identities[_userAddress].authorizedFintechs[_fintechAddress], "Fintech not authorized");
        
        identities[_userAddress].authorizedFintechs[_fintechAddress] = false;
        identities[_userAddress].lastUpdated = block.timestamp;
        
        emit FintechRevoked(_userAddress, _fintechAddress);
    }
    
    /**
     * @dev Request a credit score for a user
     * @param _userAddress Address of the user
     * @param _requestId Unique identifier for the request
     */
    function requestCreditScore(address _userAddress, bytes32 _requestId) external whenNotPaused nonReentrant {
        require(identities[_userAddress].userAddress != address(0), "User not registered");
        require(identities[_userAddress].isVerified, "User not verified");
        require(identities[_userAddress].authorizedFintechs[msg.sender], "Fintech not authorized");
        require(creditScoreRequests[_requestId].userAddress == address(0), "Request ID already exists");
        require(_requestId != bytes32(0), "Invalid request ID");
        
        CreditScoreRequest storage request = creditScoreRequests[_requestId];
        request.fintechAddress = msg.sender;
        request.userAddress = _userAddress;
        request.timestamp = block.timestamp;
        request.isApproved = false;
        request.isCompleted = false;
        request.requestId = _requestId;
        
        userCreditScoreRequests[_userAddress].push(_requestId);
        fintechCreditScoreRequests[msg.sender].push(_requestId);
        totalCreditScoreRequests++;
        
        identities[_userAddress].lastCreditScoreRequest = block.timestamp;
        
        emit CreditScoreRequested(_requestId, msg.sender, _userAddress);
    }
    
    /**
     * @dev Approve a credit score request (only user can call)
     * @param _requestId ID of the request to approve
     */
    function approveCreditScoreRequest(bytes32 _requestId) external onlyValidRequest(_requestId) nonReentrant {
        require(creditScoreRequests[_requestId].userAddress == msg.sender, "Not authorized");
        require(!creditScoreRequests[_requestId].isApproved, "Request already approved");
        require(!creditScoreRequests[_requestId].isCompleted, "Request already completed");
        
        creditScoreRequests[_requestId].isApproved = true;
        
        emit CreditScoreApproved(_requestId, msg.sender);
    }
    
    /**
     * @dev Reject a credit score request (only user can call)
     * @param _requestId ID of the request to reject
     */
    function rejectCreditScoreRequest(bytes32 _requestId) external onlyValidRequest(_requestId) nonReentrant {
        require(creditScoreRequests[_requestId].userAddress == msg.sender, "Not authorized");
        require(!creditScoreRequests[_requestId].isApproved, "Request already approved");
        require(!creditScoreRequests[_requestId].isCompleted, "Request already completed");
        
        creditScoreRequests[_requestId].isApproved = false;
        creditScoreRequests[_requestId].isCompleted = true;
        
        emit CreditScoreRejected(_requestId, msg.sender);
    }
    
    /**
     * @dev Mark a credit score request as completed (only owner can call)
     * @param _requestId ID of the request to mark as completed
     */
    function completeCreditScoreRequest(bytes32 _requestId) external onlyOwner onlyValidRequest(_requestId) {
        require(creditScoreRequests[_requestId].isApproved, "Request not approved");
        require(!creditScoreRequests[_requestId].isCompleted, "Request already completed");
        
        creditScoreRequests[_requestId].isCompleted = true;
        identities[creditScoreRequests[_requestId].userAddress].hasActiveCreditScore = true;
    }
    
    /**
     * @dev Check if a user has access to a specific API
     * @param _userAddress Address of the user
     * @param _apiHash Hash of the API identifier
     * @return bool True if user has access
     */
    function hasAPIAccess(address _userAddress, bytes32 _apiHash) external view returns (bool) {
        return identities[_userAddress].authorizedAPIs[_apiHash];
    }
    
    /**
     * @dev Check if a fintech is authorized for a user
     * @param _userAddress Address of the user
     * @param _fintechAddress Address of the fintech
     * @return bool True if fintech is authorized
     */
    function isFintechAuthorized(address _userAddress, address _fintechAddress) external view returns (bool) {
        return identities[_userAddress].authorizedFintechs[_fintechAddress];
    }
    
    /**
     * @dev Get user identity information
     * @param _userAddress Address of the user
     * @return userId User ID string
     * @return isVerified Verification status
     * @return createdAt Creation timestamp
     * @return lastUpdated Last update timestamp
     * @return hasActiveCreditScore Whether user has an active credit score
     */
    function getUserIdentity(address _userAddress) external view returns (
        string memory userId,
        bool isVerified,
        uint256 createdAt,
        uint256 lastUpdated,
        bool hasActiveCreditScore
    ) {
        UserIdentity storage identity = identities[_userAddress];
        return (
            identity.userId,
            identity.isVerified,
            identity.createdAt,
            identity.lastUpdated,
            identity.hasActiveCreditScore
        );
    }
    
    /**
     * @dev Get credit score request information
     * @param _requestId ID of the request
     * @return fintechAddress Address of the requesting fintech
     * @return userAddress Address of the user
     * @return timestamp When the request was made
     * @return isApproved Whether the request was approved
     * @return isCompleted Whether the request was completed
     */
    function getCreditScoreRequest(bytes32 _requestId) external view returns (
        address fintechAddress,
        address userAddress,
        uint256 timestamp,
        bool isApproved,
        bool isCompleted
    ) {
        CreditScoreRequest storage request = creditScoreRequests[_requestId];
        return (
            request.fintechAddress,
            request.userAddress,
            request.timestamp,
            request.isApproved,
            request.isCompleted
        );
    }
    
    /**
     * @dev Get all credit score requests for a user
     * @param _userAddress Address of the user
     * @return Array of request IDs
     */
    function getUserCreditScoreRequests(address _userAddress) external view returns (bytes32[] memory) {
        return userCreditScoreRequests[_userAddress];
    }
    
    /**
     * @dev Get all credit score requests from a fintech
     * @param _fintechAddress Address of the fintech
     * @return Array of request IDs
     */
    function getFintechCreditScoreRequests(address _fintechAddress) external view returns (bytes32[] memory) {
        return fintechCreditScoreRequests[_fintechAddress];
    }
    
    /**
     * @dev Get contract statistics
     * @return _totalUsers Total number of registered users
     * @return _totalCreditScoreRequests Total number of credit score requests
     */
    function getContractStats() external view returns (uint256 _totalUsers, uint256 _totalCreditScoreRequests) {
        return (totalUsers, totalCreditScoreRequests);
    }
    
    /**
     * @dev Pause the contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
