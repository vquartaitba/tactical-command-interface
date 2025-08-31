// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title ScoreSBT
 * @dev Soulbound Token (SBT) representing a user's Financial Passport
 * @notice This contract mints non-transferable NFTs containing encrypted credit scores
 */
contract ScoreSBT is ERC721, Ownable, Pausable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIds;
    
    struct FinancialPassport {
        uint256 tokenId;
        address userAddress;
        bytes32 scoreHash;
        uint256 scoreTimestamp;
        uint256 validUntil;
        string metadataURI;
        bool isActive;
        address mintedBy;
        uint256 mintedAt;
    }
    
    mapping(uint256 => FinancialPassport) public passports;
    mapping(address => uint256[]) public userPassports;
    mapping(bytes32 => uint256) public scoreHashToTokenId;
    
    uint256 public totalPassports;
    uint256 public activePassports;
    
    event PassportMinted(uint256 indexed tokenId, address indexed userAddress, bytes32 scoreHash);
    event PassportRevoked(uint256 indexed tokenId, address indexed userAddress);
    event PassportRenewed(uint256 indexed tokenId, address indexed userAddress, bytes32 newScoreHash);
    
    modifier onlyValidToken(uint256 _tokenId) {
        require(_exists(_tokenId), "Token does not exist");
        _;
    }
    
    constructor() ERC721("Zkredit Financial Passport", "ZFP") {}
    
    /**
     * @dev Mint a new Financial Passport (only owner can call)
     * @param _userAddress Address of the user
     * @param _scoreHash Hash of the encrypted credit score
     * @param _validUntil Timestamp until which the passport is valid
     * @param _metadataURI URI containing passport metadata
     */
    function mintPassport(
        address _userAddress,
        bytes32 _scoreHash,
        uint256 _validUntil,
        string memory _metadataURI
    ) external onlyOwner whenNotPaused returns (uint256) {
        require(_userAddress != address(0), "Invalid user address");
        require(_scoreHash != bytes32(0), "Invalid score hash");
        require(_validUntil > block.timestamp, "Invalid validity period");
        require(scoreHashToTokenId[_scoreHash] == 0, "Score hash already used");
        require(bytes(_metadataURI).length > 0, "Metadata URI cannot be empty");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        // Mint the token to the user
        _safeMint(_userAddress, newTokenId);
        
        // Create the passport record
        FinancialPassport storage passport = passports[newTokenId];
        passport.tokenId = newTokenId;
        passport.userAddress = _userAddress;
        passport.scoreHash = _scoreHash;
        passport.scoreTimestamp = block.timestamp;
        passport.validUntil = _validUntil;
        passport.metadataURI = _metadataURI;
        passport.isActive = true;
        passport.mintedBy = msg.sender;
        passport.mintedAt = block.timestamp;
        
        // Update mappings
        userPassports[_userAddress].push(newTokenId);
        scoreHashToTokenId[_scoreHash] = newTokenId;
        totalPassports++;
        activePassports++;
        
        emit PassportMinted(newTokenId, _userAddress, _scoreHash);
        
        return newTokenId;
    }
    
    /**
     * @dev Revoke a Financial Passport (only owner can call)
     * @param _tokenId ID of the token to revoke
     */
    function revokePassport(uint256 _tokenId) external onlyOwner onlyValidToken(_tokenId) whenNotPaused {
        require(passports[_tokenId].isActive, "Passport already revoked");

        address currentOwner = passports[_tokenId].userAddress;
        passports[_tokenId].isActive = false;
        activePassports--;

        emit PassportRevoked(_tokenId, currentOwner);
    }
    
    /**
     * @dev Renew a Financial Passport with a new score (only owner can call)
     * @param _tokenId ID of the token to renew
     * @param _newScoreHash Hash of the new encrypted credit score
     * @param _newValidUntil New validity period
     * @param _newMetadataURI New metadata URI
     */
    function renewPassport(
        uint256 _tokenId,
        bytes32 _newScoreHash,
        uint256 _newValidUntil,
        string memory _newMetadataURI
    ) external onlyOwner onlyValidToken(_tokenId) whenNotPaused {
        require(passports[_tokenId].isActive, "Passport is not active");
        require(_newScoreHash != bytes32(0), "Invalid new score hash");
        require(_newValidUntil > block.timestamp, "Invalid new validity period");
        require(scoreHashToTokenId[_newScoreHash] == 0, "New score hash already used");
        require(bytes(_newMetadataURI).length > 0, "New metadata URI cannot be empty");
        
        FinancialPassport storage passport = passports[_tokenId];
        
        // Remove old score hash mapping
        delete scoreHashToTokenId[passport.scoreHash];
        
        // Update passport with new data
        passport.scoreHash = _newScoreHash;
        passport.scoreTimestamp = block.timestamp;
        passport.validUntil = _newValidUntil;
        passport.metadataURI = _newMetadataURI;
        
        // Add new score hash mapping
        scoreHashToTokenId[_newScoreHash] = _tokenId;
        
        emit PassportRenewed(_tokenId, passport.userAddress, _newScoreHash);
    }
    
    /**
     * @dev Get passport information
     * @param _tokenId ID of the token
     * @return userAddress Address of the passport owner
     * @return scoreHash Hash of the encrypted credit score
     * @return scoreTimestamp When the score was generated
     * @return validUntil Until when the passport is valid
     * @return metadataURI URI containing passport metadata
     * @return isActive Whether the passport is active
     */
    function getPassport(uint256 _tokenId) external view onlyValidToken(_tokenId) returns (
        address userAddress,
        bytes32 scoreHash,
        uint256 scoreTimestamp,
        uint256 validUntil,
        string memory metadataURI,
        bool isActive
    ) {
        FinancialPassport storage passport = passports[_tokenId];
        return (
            passport.userAddress,
            passport.scoreHash,
            passport.scoreTimestamp,
            passport.validUntil,
            passport.metadataURI,
            passport.isActive
        );
    }
    
    /**
     * @dev Get all passports for a user
     * @param _userAddress Address of the user
     * @return Array of token IDs
     */
    function getUserPassports(address _userAddress) external view returns (uint256[] memory) {
        return userPassports[_userAddress];
    }
    
    /**
     * @dev Check if a passport is valid (not expired and active)
     * @param _tokenId ID of the token
     * @return bool True if passport is valid
     */
    function isPassportValid(uint256 _tokenId) external view onlyValidToken(_tokenId) returns (bool) {
        FinancialPassport storage passport = passports[_tokenId];
        return passport.isActive && passport.validUntil > block.timestamp;
    }
    
    /**
     * @dev Get token ID by score hash
     * @param _scoreHash Hash of the encrypted credit score
     * @return Token ID if found, 0 if not found
     */
    function getTokenIdByScoreHash(bytes32 _scoreHash) external view returns (uint256) {
        return scoreHashToTokenId[_scoreHash];
    }
    
    /**
     * @dev Get contract statistics
     * @return _totalPassports Total number of minted passports
     * @return _activePassports Number of active passports
     */
    function getContractStats() external view returns (uint256 _totalPassports, uint256 _activePassports) {
        return (totalPassports, activePassports);
    }
    
    /**
     * @dev Override transfer function to make tokens non-transferable (Soulbound)
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual override(ERC721) {
        require(from == address(0) || to == address(0), "Token is non-transferable");
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }
    
    /**
     * @dev Override transfer function to make tokens non-transferable (Soulbound)
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override(ERC721) {
        require(false, "Token is non-transferable");
    }
    
    /**
     * @dev Override safeTransferFrom function to make tokens non-transferable (Soulbound)
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public virtual override(ERC721) {
        require(false, "Token is non-transferable");
    }
    
    /**
     * @dev Override approve function to prevent approvals (Soulbound)
     */
    function approve(address to, uint256 tokenId) public virtual override(ERC721) {
        require(false, "Token is non-transferable");
    }
    
    /**
     * @dev Override setApprovalForAll function to prevent approvals (Soulbound)
     */
    function setApprovalForAll(address operator, bool approved) public virtual override(ERC721) {
        require(false, "Token is non-transferable");
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
