// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title DataRegistry
 * @dev Smart contract for managing authorized data sources and APIs in the Zkredit protocol
 * @notice This contract maintains a whitelist of real-world APIs that Flare is permitted to query
 */
contract DataRegistry is Ownable, Pausable, ReentrancyGuard {
    
    struct DataSource {
        bytes32 sourceId;
        string sourceName;
        string sourceDescription;
        string apiEndpoint;
        bytes32 apiKeyHash;
        bool isActive;
        uint256 addedAt;
        uint256 lastUpdated;
        address addedBy;
        uint256 requestCount;
        uint256 successCount;
        uint256 failureCount;
        mapping(bytes32 => bool) supportedDataTypes;
        mapping(bytes32 => uint256) dataTypeLastUsed;
    }
    
    struct DataType {
        bytes32 typeId;
        string typeName;
        string typeDescription;
        bool isSupported;
        uint256 addedAt;
        uint256 lastUsed;
    }
    
    mapping(bytes32 => DataSource) public dataSources;
    mapping(bytes32 => DataType) public dataTypes;
    mapping(address => bytes32[]) public authorizedSources;
    
    bytes32[] public allSourceIds;
    bytes32[] public allDataTypeIds;
    
    uint256 public totalDataSources;
    uint256 public totalDataTypes;
    uint256 public totalRequests;
    
    event DataSourceAdded(bytes32 indexed sourceId, string sourceName, address indexed addedBy);
    event DataSourceUpdated(bytes32 indexed sourceId, string sourceName);
    event DataSourceDeactivated(bytes32 indexed sourceId);
    event DataSourceReactivated(bytes32 indexed sourceId);
    event DataTypeAdded(bytes32 indexed typeId, string typeName);
    event DataTypeSupported(bytes32 indexed sourceId, bytes32 indexed typeId);
    event DataTypeUnsupported(bytes32 indexed sourceId, bytes32 indexed typeId);
    event DataRequested(bytes32 indexed sourceId, bytes32 indexed dataType, address indexed requester);
    
    modifier onlyValidSource(bytes32 _sourceId) {
        require(dataSources[_sourceId].sourceId != bytes32(0), "Invalid source ID");
        _;
    }
    
    modifier onlyValidDataType(bytes32 _typeId) {
        require(dataTypes[_typeId].typeId != bytes32(0), "Data type does not exist");
        _;
    }
    
    modifier onlyActiveSource(bytes32 _sourceId) {
        require(dataSources[_sourceId].isActive, "Source is not active");
        _;
    }
    
    /**
     * @dev Add a new data source (only owner can call)
     * @param _sourceId Unique identifier for the data source
     * @param _sourceName Human-readable name of the source
     * @param _sourceDescription Description of the data source
     * @param _apiEndpoint API endpoint URL
     * @param _apiKeyHash Hash of the API key
     */
    function addDataSource(
        bytes32 _sourceId,
        string memory _sourceName,
        string memory _sourceDescription,
        string memory _apiEndpoint,
        bytes32 _apiKeyHash
    ) external onlyOwner whenNotPaused nonReentrant {
        require(_sourceId != bytes32(0), "Invalid source ID");
        require(dataSources[_sourceId].sourceId == bytes32(0), "Data source already exists");
        require(bytes(_sourceName).length > 0, "Source name cannot be empty");
        require(bytes(_apiEndpoint).length > 0, "API endpoint cannot be empty");
        
        DataSource storage newSource = dataSources[_sourceId];
        newSource.sourceId = _sourceId;
        newSource.sourceName = _sourceName;
        newSource.sourceDescription = _sourceDescription;
        newSource.apiEndpoint = _apiEndpoint;
        newSource.apiKeyHash = _apiKeyHash;
        newSource.isActive = true;
        newSource.addedAt = block.timestamp;
        newSource.lastUpdated = block.timestamp;
        newSource.addedBy = msg.sender;
        newSource.requestCount = 0;
        newSource.successCount = 0;
        newSource.failureCount = 0;
        
        allSourceIds.push(_sourceId);
        totalDataSources++;
        
        emit DataSourceAdded(_sourceId, _sourceName, msg.sender);
    }
    
    /**
     * @dev Update an existing data source (only owner can call)
     * @param _sourceId ID of the source to update
     * @param _sourceName New name for the source
     * @param _sourceDescription New description for the source
     * @param _apiEndpoint New API endpoint
     */
    function updateDataSource(
        bytes32 _sourceId,
        string memory _sourceName,
        string memory _sourceDescription,
        string memory _apiEndpoint
    ) external onlyOwner onlyValidSource(_sourceId) {
        require(bytes(_sourceName).length > 0, "Source name cannot be empty");
        require(bytes(_apiEndpoint).length > 0, "API endpoint cannot be empty");
        
        DataSource storage source = dataSources[_sourceId];
        source.sourceName = _sourceName;
        source.sourceDescription = _sourceDescription;
        source.apiEndpoint = _apiEndpoint;
        source.lastUpdated = block.timestamp;
        
        emit DataSourceUpdated(_sourceId, _sourceName);
    }
    
    /**
     * @dev Deactivate a data source (only owner can call)
     * @param _sourceId ID of the source to deactivate
     */
    function deactivateDataSource(bytes32 _sourceId) external onlyOwner onlyValidSource(_sourceId) {
        require(dataSources[_sourceId].isActive, "Source already deactivated");
        
        dataSources[_sourceId].isActive = false;
        dataSources[_sourceId].lastUpdated = block.timestamp;
        
        emit DataSourceDeactivated(_sourceId);
    }
    
    /**
     * @dev Reactivate a data source (only owner can call)
     * @param _sourceId ID of the source to reactivate
     */
    function reactivateDataSource(bytes32 _sourceId) external onlyOwner onlyValidSource(_sourceId) {
        require(!dataSources[_sourceId].isActive, "Source already active");
        
        dataSources[_sourceId].isActive = true;
        dataSources[_sourceId].lastUpdated = block.timestamp;
        
        emit DataSourceReactivated(_sourceId);
    }
    
    /**
     * @dev Add a new data type (only owner can call)
     * @param _typeId Unique identifier for the data type
     * @param _typeName Human-readable name of the data type
     * @param _typeDescription Description of the data type
     */
    function addDataType(
        bytes32 _typeId,
        string memory _typeName,
        string memory _typeDescription
    ) external onlyOwner whenNotPaused nonReentrant {
        require(_typeId != bytes32(0), "Invalid type ID");
        require(dataTypes[_typeId].typeId == bytes32(0), "Data type already exists");
        require(bytes(_typeName).length > 0, "Type name cannot be empty");
        
        DataType storage newType = dataTypes[_typeId];
        newType.typeId = _typeId;
        newType.typeName = _typeName;
        newType.typeDescription = _typeDescription;
        newType.isSupported = false;
        newType.addedAt = block.timestamp;
        newType.lastUsed = 0;
        
        allDataTypeIds.push(_typeId);
        totalDataTypes++;
        
        emit DataTypeAdded(_typeId, _typeName);
    }
    
    /**
     * @dev Update an existing data type (only owner can call)
     * @param _typeId ID of the data type to update
     * @param _typeName New name for the data type
     * @param _typeDescription New description for the data type
     */
    function updateDataType(
        bytes32 _typeId,
        string memory _typeName,
        string memory _typeDescription
    ) external onlyOwner onlyValidDataType(_typeId) {
        require(bytes(_typeName).length > 0, "Type name cannot be empty");

        DataType storage dataType = dataTypes[_typeId];
        dataType.typeName = _typeName;
        dataType.typeDescription = _typeDescription;

        emit DataTypeAdded(_typeId, _typeName); // Reusing existing event
    }

    /**
     * @dev Add data type support to a source (only owner can call)
     * @param _sourceId ID of the data source
     * @param _typeId ID of the data type
     */
    function addDataTypeSupport(bytes32 _sourceId, bytes32 _typeId) external onlyOwner onlyValidSource(_sourceId) onlyValidDataType(_typeId) {
        require(dataSources[_sourceId].isActive, "Source is not active");
        require(!dataSources[_sourceId].supportedDataTypes[_typeId], "Data type already supported");
        
        dataSources[_sourceId].supportedDataTypes[_typeId] = true;
        dataSources[_sourceId].dataTypeLastUsed[_typeId] = 0;
        dataSources[_sourceId].lastUpdated = block.timestamp;
        
        emit DataTypeSupported(_sourceId, _typeId);
    }
    
    /**
     * @dev Remove data type support from a source (only owner can call)
     * @param _sourceId ID of the data source
     * @param _typeId ID of the data type
     */
    function removeDataTypeSupport(bytes32 _sourceId, bytes32 _typeId) external onlyOwner onlyValidSource(_sourceId) onlyValidDataType(_typeId) {
        require(dataSources[_sourceId].supportedDataTypes[_typeId], "Data type not supported");
        
        dataSources[_sourceId].supportedDataTypes[_typeId] = false;
        dataSources[_sourceId].lastUpdated = block.timestamp;
        
        emit DataTypeUnsupported(_sourceId, _typeId);
    }
    
    /**
     * @dev Record a data request (only authorized contracts can call)
     * @param _sourceId ID of the data source
     * @param _typeId ID of the data type
     * @param _requester Address of the requester
     * @param _success Whether the request was successful
     */
    function recordDataRequest(
        bytes32 _sourceId,
        bytes32 _typeId,
        address _requester,
        bool _success
    ) external onlyOwner onlyValidSource(_sourceId) onlyValidDataType(_typeId) onlyActiveSource(_sourceId) {
        require(dataSources[_sourceId].supportedDataTypes[_typeId], "Data type not supported by source");
        
        DataSource storage source = dataSources[_sourceId];
        source.requestCount++;
        source.dataTypeLastUsed[_typeId] = block.timestamp;
        
        if (_success) {
            source.successCount++;
        } else {
            source.failureCount++;
        }
        
        dataTypes[_typeId].lastUsed = block.timestamp;
        totalRequests++;
        
        emit DataRequested(_sourceId, _typeId, _requester);
    }
    
    /**
     * @dev Check if a data source supports a specific data type
     * @param _sourceId ID of the data source
     * @param _typeId ID of the data type
     * @return bool True if the source supports the data type
     */
    function isDataTypeSupported(bytes32 _sourceId, bytes32 _typeId) external view returns (bool) {
        return dataSources[_sourceId].supportedDataTypes[_typeId];
    }
    
    /**
     * @dev Check if a data source is active
     * @param _sourceId ID of the data source
     * @return bool True if the source is active
     */
    function isDataSourceActive(bytes32 _sourceId) external view returns (bool) {
        return dataSources[_sourceId].isActive;
    }
    
    /**
     * @dev Get data source information
     * @param _sourceId ID of the data source
     * @return sourceName Name of the source
     * @return sourceDescription Description of the source
     * @return apiEndpoint API endpoint URL
     * @return isActive Whether the source is active
     * @return addedAt When the source was added
     * @return requestCount Total number of requests
     * @return successCount Number of successful requests
     * @return failureCount Number of failed requests
     */
    function getDataSource(bytes32 _sourceId) external view onlyValidSource(_sourceId) returns (
        string memory sourceName,
        string memory sourceDescription,
        string memory apiEndpoint,
        bool isActive,
        uint256 addedAt,
        uint256 requestCount,
        uint256 successCount,
        uint256 failureCount
    ) {
        DataSource storage source = dataSources[_sourceId];
        return (
            source.sourceName,
            source.sourceDescription,
            source.apiEndpoint,
            source.isActive,
            source.addedAt,
            source.requestCount,
            source.successCount,
            source.failureCount
        );
    }
    
    /**
     * @dev Get data type information
     * @param _typeId ID of the data type
     * @return typeName Name of the data type
     * @return typeDescription Description of the data type
     * @return isSupported Whether the type is supported
     * @return addedAt When the type was added
     * @return lastUsed When the type was last used
     */
    function getDataType(bytes32 _typeId) external view onlyValidDataType(_typeId) returns (
        string memory typeName,
        string memory typeDescription,
        bool isSupported,
        uint256 addedAt,
        uint256 lastUsed
    ) {
        DataType storage dataType = dataTypes[_typeId];
        return (
            dataType.typeName,
            dataType.typeDescription,
            dataType.isSupported,
            dataType.addedAt,
            dataType.lastUsed
        );
    }
    
    /**
     * @dev Get all data source IDs
     * @return Array of all source IDs
     */
    function getAllSourceIds() external view returns (bytes32[] memory) {
        return allSourceIds;
    }
    
    /**
     * @dev Get all data type IDs
     * @return Array of all type IDs
     */
    function getAllDataTypeIds() external view returns (bytes32[] memory) {
        return allDataTypeIds;
    }
    
    /**
     * @dev Get data source request statistics
     * @param _sourceId ID of the data source
     * @return requestCount Total requests for this source
     * @return successCount Successful requests for this source
     * @return failureCount Failed requests for this source
     */
    function getDataSourceStats(bytes32 _sourceId) external view onlyValidSource(_sourceId) returns (
        uint256 requestCount,
        uint256 successCount,
        uint256 failureCount
    ) {
        DataSource storage source = dataSources[_sourceId];
        return (source.requestCount, source.successCount, source.failureCount);
    }

    /**
     * @dev Get contract statistics
     * @return _totalDataSources Total number of data sources
     * @return _totalDataTypes Total number of data types
     * @return _totalRequests Total number of requests
     */
    function getContractStats() external view returns (
        uint256 _totalDataSources,
        uint256 _totalDataTypes,
        uint256 _totalRequests
    ) {
        return (totalDataSources, totalDataTypes, totalRequests);
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
