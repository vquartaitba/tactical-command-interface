// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./FlareStateConnector.sol";
import "./Identity.sol";
import "./ScoreSBT.sol";
import "./DataRegistry.sol";

/**
 * @title FlareIntegration
 * @dev Integration contract that bridges Flare State Connector with Zkredit protocol
 * @notice Handles cross-chain data verification and credit score computation workflow
 */
contract FlareIntegration is Ownable, ReentrancyGuard, Pausable {
    using ECDSA for bytes32;

    // Events
    event CreditScoreRequestInitiated(
        bytes32 indexed requestId,
        address indexed user,
        bytes32 indexed dataHash,
        uint256 timestamp
    );

    event CreditScoreComputed(
        bytes32 indexed requestId,
        address indexed user,
        uint256 creditScore,
        bytes32 sbtTokenId,
        uint256 timestamp
    );

    event FlareAttestationProcessed(
        bytes32 indexed requestId,
        bytes32 indexed dataHash,
        bool isValid,
        uint256 timestamp
    );

    event CrossChainMessageSent(
        bytes32 indexed requestId,
        address indexed targetChain,
        bytes32 indexed messageHash,
        uint256 timestamp
    );

    // Structs
    struct CreditScoreRequest {
        bytes32 requestId;
        address user;
        bytes32 dataHash;
        uint256 timestamp;
        bool flareVerified;
        bool zamaProcessed;
        uint256 creditScore;
        bytes32 sbtTokenId;
        RequestStatus status;
    }

    struct FlareData {
        bytes32 requestId;
        bytes32 dataHash;
        bytes32 attestationProof;
        uint256 timestamp;
        bool isValid;
    }

    enum RequestStatus {
        Pending,
        FlareVerified,
        ZamaProcessing,
        Completed,
        Failed
    }

    // State variables
    FlareStateConnector public flareStateConnector;
    Identity public identityContract;
    ScoreSBT public scoreSBTContract;
    DataRegistry public dataRegistryContract;

    mapping(bytes32 => CreditScoreRequest) public creditScoreRequests;
    mapping(bytes32 => FlareData) public flareData;
    mapping(address => bool) public authorizedFintechs;
    mapping(bytes32 => bool) public processedRequests;

    uint256 public requestCounter = 0;
    uint256 public minFlareConfirmations = 3;
    uint256 public maxRequestAge = 7 days;

    // Modifiers
    modifier onlyAuthorizedFintech() {
        require(authorizedFintechs[msg.sender], "FlareIntegration: Not authorized fintech");
        _;
    }

    modifier onlyValidRequest(bytes32 requestId) {
        require(creditScoreRequests[requestId].user != address(0), "FlareIntegration: Invalid request ID");
        _;
    }

    modifier onlyUnprocessedRequest(bytes32 requestId) {
        require(!processedRequests[requestId], "FlareIntegration: Request already processed");
        _;
    }

    modifier whenNotPaused() {
        require(!paused(), "FlareIntegration: Contract is paused");
        _;
    }

    constructor(
        address _flareStateConnector,
        address _identityContract,
        address _scoreSBTContract,
        address _dataRegistryContract
    ) {
        require(_flareStateConnector != address(0), "FlareIntegration: Invalid Flare contract");
        require(_identityContract != address(0), "FlareIntegration: Invalid Identity contract");
        require(_scoreSBTContract != address(0), "FlareIntegration: Invalid ScoreSBT contract");
        require(_dataRegistryContract != address(0), "FlareIntegration: Invalid DataRegistry contract");

        flareStateConnector = FlareStateConnector(_flareStateConnector);
        identityContract = Identity(_identityContract);
        scoreSBTContract = ScoreSBT(_scoreSBTContract);
        dataRegistryContract = DataRegistry(_dataRegistryContract);
    }

    /**
     * @dev Initiate a credit score request with Flare verification
     * @param user Address of the user requesting credit score
     * @param dataHash Hash of the data to be verified
     * @return requestId Unique identifier for the request
     */
    function initiateCreditScoreRequest(address user, bytes32 dataHash)
        external
        onlyAuthorizedFintech
        whenNotPaused
        nonReentrant
        returns (bytes32 requestId)
    {
        require(user != address(0), "FlareIntegration: Invalid user address");
        require(dataHash != bytes32(0), "FlareIntegration: Invalid data hash");
        require(identityContract.isUserRegistered(user), "FlareIntegration: User not registered");

        requestCounter++;
        requestId = keccak256(abi.encodePacked(
            user,
            dataHash,
            requestCounter,
            block.timestamp,
            block.chainid
        ));

        require(creditScoreRequests[requestId].user == address(0), "FlareIntegration: Request already exists");

        creditScoreRequests[requestId] = CreditScoreRequest({
            requestId: requestId,
            user: user,
            dataHash: dataHash,
            timestamp: block.timestamp,
            flareVerified: false,
            zamaProcessed: false,
            creditScore: 0,
            sbtTokenId: bytes32(0),
            status: RequestStatus.Pending
        });

        // Submit data request to Flare State Connector
        flareStateConnector.submitDataRequest(dataHash);

        emit CreditScoreRequestInitiated(requestId, user, dataHash, block.timestamp);

        return requestId;
    }

    /**
     * @dev Process Flare attestation and update request status
     * @param requestId The request ID to process
     * @param attestationProof Proof from Flare State Connector
     */
    function processFlareAttestation(bytes32 requestId, bytes32 attestationProof)
        external
        onlyValidRequest(requestId)
        whenNotPaused
        nonReentrant
    {
        CreditScoreRequest storage request = creditScoreRequests[requestId];
        require(request.status == RequestStatus.Pending, "FlareIntegration: Invalid request status");

        // Verify attestation with Flare State Connector
        bool isValid = flareStateConnector.isAttestationValidAndProcessed(requestId);
        
        if (isValid) {
            request.flareVerified = true;
            request.status = RequestStatus.FlareVerified;

            // Store Flare data
            flareData[requestId] = FlareData({
                requestId: requestId,
                dataHash: request.dataHash,
                attestationProof: attestationProof,
                timestamp: block.timestamp,
                isValid: true
            });

            emit FlareAttestationProcessed(requestId, request.dataHash, true, block.timestamp);

            // Trigger cross-chain message to Zama
            _sendCrossChainMessage(requestId, request.dataHash);
        } else {
            request.status = RequestStatus.Failed;
            emit FlareAttestationProcessed(requestId, request.dataHash, false, block.timestamp);
        }
    }

    /**
     * @dev Process credit score result from Zama network
     * @param requestId The request ID to process
     * @param creditScore The computed credit score
     * @param encryptedResult Encrypted result data
     */
    function processZamaResult(
        bytes32 requestId,
        uint256 creditScore,
        bytes calldata encryptedResult
    )
        external
        onlyValidRequest(requestId)
        whenNotPaused
        nonReentrant
    {
        CreditScoreRequest storage request = creditScoreRequests[requestId];
        require(request.status == RequestStatus.FlareVerified, "FlareIntegration: Request not Flare verified");
        require(creditScore > 0, "FlareIntegration: Invalid credit score");

        request.creditScore = creditScore;
        request.zamaProcessed = true;
        request.status = RequestStatus.ZamaProcessing;

        // Mint SBT with credit score
        bytes32 sbtTokenId = _mintCreditScoreSBT(request.user, creditScore, encryptedResult);
        request.sbtTokenId = sbtTokenId;
        request.status = RequestStatus.Completed;

        processedRequests[requestId] = true;

        emit CreditScoreComputed(requestId, request.user, creditScore, sbtTokenId, block.timestamp);
    }

    /**
     * @dev Get credit score request details
     * @param requestId The request ID
     * @return request The credit score request details
     */
    function getCreditScoreRequest(bytes32 requestId)
        external
        view
        returns (CreditScoreRequest memory request)
    {
        return creditScoreRequests[requestId];
    }

    /**
     * @dev Get Flare data for a request
     * @param requestId The request ID
     * @return data The Flare data
     */
    function getFlareData(bytes32 requestId)
        external
        view
        returns (FlareData memory data)
    {
        return flareData[requestId];
    }

    /**
     * @dev Check if a request is ready for Zama processing
     * @param requestId The request ID
     * @return ready Whether the request is ready
     */
    function isRequestReadyForZama(bytes32 requestId)
        external
        view
        returns (bool ready)
    {
        CreditScoreRequest storage request = creditScoreRequests[requestId];
        return request.flareVerified && request.status == RequestStatus.FlareVerified;
    }

    // Admin functions

    /**
     * @dev Authorize or remove a fintech
     * @param fintech Address of the fintech
     * @param isAuthorized Whether to authorize or remove
     */
    function setFintechAuthorization(address fintech, bool isAuthorized)
        external
        onlyOwner
    {
        authorizedFintechs[fintech] = isAuthorized;
    }

    /**
     * @dev Update Flare confirmation requirements
     * @param _minFlareConfirmations New minimum confirmations
     */
    function updateFlareConfirmations(uint256 _minFlareConfirmations)
        external
        onlyOwner
    {
        require(_minFlareConfirmations > 0, "FlareIntegration: Invalid confirmation count");
        minFlareConfirmations = _minFlareConfirmations;
    }

    /**
     * @dev Update maximum request age
     * @param _maxRequestAge New maximum age in seconds
     */
    function updateMaxRequestAge(uint256 _maxRequestAge)
        external
        onlyOwner
    {
        require(_maxRequestAge > 0, "FlareIntegration: Invalid request age");
        maxRequestAge = _maxRequestAge;
    }

    /**
     * @dev Pause contract operations
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // Internal functions

    /**
     * @dev Send cross-chain message to Zama network
     * @param requestId The request ID
     * @param dataHash The data hash
     */
    function _sendCrossChainMessage(bytes32 requestId, bytes32 dataHash) internal {
        // This would integrate with a cross-chain bridge
        // For now, we'll emit an event
        emit CrossChainMessageSent(
            requestId,
            address(0), // Target chain address
            keccak256(abi.encodePacked(requestId, dataHash)),
            block.timestamp
        );
    }

    /**
     * @dev Mint credit score SBT
     * @param user Address of the user
     * @param creditScore The credit score
     * @param encryptedResult Encrypted result data
     * @return tokenId The minted SBT token ID
     */
    function _mintCreditScoreSBT(
        address user,
        uint256 creditScore,
        bytes calldata encryptedResult
    ) internal returns (bytes32 tokenId) {
        // Create metadata for the SBT
        string memory metadata = string(abi.encodePacked(
            '{"creditScore": "', _uint2str(creditScore), '", "timestamp": "', _uint2str(block.timestamp), '"}'
        ));

        // Mint SBT through the ScoreSBT contract
        tokenId = scoreSBTContract.mintCreditScoreSBT(user, creditScore, metadata, encryptedResult);

        return tokenId;
    }

    /**
     * @dev Convert uint to string
     * @param _i The uint to convert
     * @return The string representation
     */
    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        while (_i != 0) {
            k -= 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    /**
     * @dev Emergency function to recover stuck funds
     * @param token Address of the token to recover
     * @param amount Amount to recover
     */
    function emergencyRecover(address token, uint256 amount) external onlyOwner {
        // Implementation for emergency fund recovery
        // This would require additional token handling logic
    }
}
