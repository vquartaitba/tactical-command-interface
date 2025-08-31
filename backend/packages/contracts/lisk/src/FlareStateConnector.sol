// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title FlareStateConnector
 * @dev Consumer contract for Flare State Connector attestations
 * @notice Integrates with Flare network for cross-chain data verification
 */
contract FlareStateConnector is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // Events
    event AttestationReceived(
        bytes32 indexed requestId,
        address indexed requester,
        bytes32 indexed dataHash,
        uint256 timestamp,
        bool isValid
    );

    event AttestationVerified(
        bytes32 indexed requestId,
        bytes32 indexed dataHash,
        address indexed verifier,
        uint256 timestamp
    );

    event DataSourceWhitelisted(
        address indexed dataSource,
        bool isWhitelisted,
        uint256 timestamp
    );

    event ValidatorWhitelisted(
        address indexed validator,
        bool isWhitelisted,
        uint256 timestamp
    );

    // Structs
    struct Attestation {
        bytes32 requestId;
        bytes32 dataHash;
        uint256 timestamp;
        uint256 blockNumber;
        bytes signature;
        address validator;
        bool isValid;
        bool isProcessed;
    }

    struct DataRequest {
        bytes32 requestId;
        address requester;
        bytes32 dataHash;
        uint256 timestamp;
        bool isFulfilled;
        Attestation attestation;
    }

    // State variables
    mapping(bytes32 => Attestation) public attestations;
    mapping(bytes32 => DataRequest) public dataRequests;
    mapping(address => bool) public whitelistedDataSources;
    mapping(address => bool) public whitelistedValidators;
    mapping(bytes32 => bool) public processedAttestations;

    uint256 public minAttestationDelay = 1 hours;
    uint256 public maxAttestationAge = 24 hours;
    uint256 public requiredValidatorCount = 3;

    // Modifiers
    modifier onlyWhitelistedValidator() {
        require(whitelistedValidators[msg.sender], "FlareStateConnector: Not a whitelisted validator");
        _;
    }

    modifier onlyWhitelistedDataSource() {
        require(whitelistedDataSources[msg.sender], "FlareStateConnector: Not a whitelisted data source");
        _;
    }

    modifier onlyValidRequest(bytes32 requestId) {
        require(dataRequests[requestId].requester != address(0), "FlareStateConnector: Invalid request ID");
        _;
    }

    modifier onlyUnprocessedAttestation(bytes32 requestId) {
        require(!processedAttestations[requestId], "FlareStateConnector: Attestation already processed");
        _;
    }

    constructor() {
        // Initialize with some default values
        _transferOwnership(msg.sender);
    }

    /**
     * @dev Submit a data verification request
     * @param dataHash Hash of the data to be verified
     * @return requestId Unique identifier for the request
     */
    function submitDataRequest(bytes32 dataHash) 
        external 
        nonReentrant 
        returns (bytes32 requestId) 
    {
        require(dataHash != bytes32(0), "FlareStateConnector: Invalid data hash");
        
        requestId = keccak256(abi.encodePacked(
            msg.sender,
            dataHash,
            block.timestamp,
            block.chainid
        ));

        require(dataRequests[requestId].requester == address(0), "FlareStateConnector: Request already exists");

        dataRequests[requestId] = DataRequest({
            requestId: requestId,
            requester: msg.sender,
            dataHash: dataHash,
            timestamp: block.timestamp,
            isFulfilled: false,
            attestation: Attestation({
                requestId: bytes32(0),
                dataHash: bytes32(0),
                timestamp: 0,
                blockNumber: 0,
                signature: "",
                validator: address(0),
                isValid: false,
                isProcessed: false
            })
        });

        return requestId;
    }

    /**
     * @dev Submit an attestation from a whitelisted validator
     * @param requestId The request ID to attest to
     * @param dataHash Hash of the verified data
     * @param signature Cryptographic signature from the validator
     * @param blockNumber Block number when attestation was created
     */
    function submitAttestation(
        bytes32 requestId,
        bytes32 dataHash,
        bytes calldata signature,
        uint256 blockNumber
    ) external onlyWhitelistedValidator onlyValidRequest(requestId) {
        require(dataHash != bytes32(0), "FlareStateConnector: Invalid data hash");
        require(blockNumber > 0, "FlareStateConnector: Invalid block number");
        require(block.timestamp >= blockNumber + minAttestationDelay, "FlareStateConnector: Attestation too recent");

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            requestId,
            dataHash,
            blockNumber,
            block.chainid
        ));
        
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(signature);
        
        require(signer == msg.sender, "FlareStateConnector: Invalid signature");

        // Create attestation
        attestations[requestId] = Attestation({
            requestId: requestId,
            dataHash: dataHash,
            timestamp: block.timestamp,
            blockNumber: blockNumber,
            signature: signature,
            validator: msg.sender,
            isValid: true,
            isProcessed: false
        });

        // Update data request
        dataRequests[requestId].attestation = attestations[requestId];
        dataRequests[requestId].isFulfilled = true;

        emit AttestationReceived(
            requestId,
            dataRequests[requestId].requester,
            dataHash,
            block.timestamp,
            true
        );
    }

    /**
     * @dev Verify and process an attestation
     * @param requestId The request ID to process
     * @return isValid Whether the attestation is valid
     */
    function verifyAndProcessAttestation(bytes32 requestId) 
        external 
        onlyValidRequest(requestId) 
        onlyUnprocessedAttestation(requestId) 
        returns (bool isValid) 
    {
        DataRequest storage request = dataRequests[requestId];
        require(request.isFulfilled, "FlareStateConnector: Request not fulfilled");

        Attestation storage attestation = attestations[requestId];
        
        // Check attestation age
        require(
            block.timestamp <= attestation.timestamp + maxAttestationAge,
            "FlareStateConnector: Attestation too old"
        );

        // Verify the attestation
        isValid = _verifyAttestation(attestation);
        
        if (isValid) {
            processedAttestations[requestId] = true;
            attestation.isProcessed = true;
            
            emit AttestationVerified(
                requestId,
                attestation.dataHash,
                msg.sender,
                block.timestamp
            );
        }

        return isValid;
    }

    /**
     * @dev Get attestation details for a request
     * @param requestId The request ID
     * @return attestation The attestation details
     */
    function getAttestation(bytes32 requestId) 
        external 
        view 
        returns (Attestation memory attestation) 
    {
        return attestations[requestId];
    }

    /**
     * @dev Get data request details
     * @param requestId The request ID
     * @return request The data request details
     */
    function getDataRequest(bytes32 requestId) 
        external 
        view 
        returns (DataRequest memory request) 
    {
        return dataRequests[requestId];
    }

    /**
     * @dev Check if an attestation is valid and processed
     * @param requestId The request ID
     * @return isValid Whether the attestation is valid and processed
     */
    function isAttestationValidAndProcessed(bytes32 requestId) 
        external 
        view 
        returns (bool isValid) 
    {
        return processedAttestations[requestId] && attestations[requestId].isValid;
    }

    // Admin functions

    /**
     * @dev Whitelist or remove a data source
     * @param dataSource Address of the data source
     * @param isWhitelisted Whether to whitelist or remove
     */
    function setDataSourceWhitelist(address dataSource, bool isWhitelisted) 
        external 
        onlyOwner 
    {
        whitelistedDataSources[dataSource] = isWhitelisted;
        emit DataSourceWhitelisted(dataSource, isWhitelisted, block.timestamp);
    }

    /**
     * @dev Whitelist or remove a validator
     * @param validator Address of the validator
     * @param isWhitelisted Whether to whitelist or remove
     */
    function setValidatorWhitelist(address validator, bool isWhitelisted) 
        external 
        onlyOwner 
    {
        whitelistedValidators[validator] = isWhitelisted;
        emit ValidatorWhitelisted(validator, isWhitelisted, block.timestamp);
    }

    /**
     * @dev Update attestation delay parameters
     * @param _minAttestationDelay Minimum delay before attestation can be submitted
     * @param _maxAttestationAge Maximum age of attestation before it expires
     */
    function updateAttestationParameters(
        uint256 _minAttestationDelay,
        uint256 _maxAttestationAge
    ) external onlyOwner {
        require(_minAttestationDelay < _maxAttestationAge, "FlareStateConnector: Invalid parameters");
        minAttestationDelay = _minAttestationDelay;
        maxAttestationAge = _maxAttestationAge;
    }

    /**
     * @dev Update required validator count
     * @param _requiredValidatorCount New required validator count
     */
    function updateRequiredValidatorCount(uint256 _requiredValidatorCount) 
        external 
        onlyOwner 
    {
        require(_requiredValidatorCount > 0, "FlareStateConnector: Invalid validator count");
        requiredValidatorCount = _requiredValidatorCount;
    }

    // Internal functions

    /**
     * @dev Internal function to verify attestation validity
     * @param attestation The attestation to verify
     * @return isValid Whether the attestation is valid
     */
    function _verifyAttestation(Attestation storage attestation) 
        internal 
        view 
        returns (bool isValid) 
    {
        // Basic validation
        if (attestation.requestId == bytes32(0) || 
            attestation.dataHash == bytes32(0) || 
            attestation.validator == address(0)) {
            return false;
        }

        // Check if validator is still whitelisted
        if (!whitelistedValidators[attestation.validator]) {
            return false;
        }

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            attestation.requestId,
            attestation.dataHash,
            attestation.blockNumber,
            block.chainid
        ));
        
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(attestation.signature);
        
        return signer == attestation.validator;
    }

    /**
     * @dev Emergency function to pause contract operations
     * @notice This function can only be called by the owner
     */
    function emergencyPause() external onlyOwner {
        // Implementation for emergency pause functionality
        // This would require additional state management
    }
}
