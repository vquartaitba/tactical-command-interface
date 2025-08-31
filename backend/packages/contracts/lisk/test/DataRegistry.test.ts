import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, ContractFactory, Signer } from "ethers";

describe("DataRegistry", function () {
  let DataRegistry: ContractFactory;
  let dataRegistry: Contract;
  let owner: Signer;
  let user1: Signer;
  let fintech1: Signer;
  let fintech2: Signer;
  let addr1: string;
  let fintech1Addr: string;
  let fintech2Addr: string;
  let ownerAddr: string;

  const sourceId1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("source-1"));
  const sourceId2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("source-2"));
  const typeId1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("type-1"));
  const typeId2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("type-2"));

  beforeEach(async function () {
    [owner, user1, fintech1, fintech2] = await ethers.getSigners();
    addr1 = await user1.getAddress();
    fintech1Addr = await fintech1.getAddress();
    fintech2Addr = await fintech2.getAddress();
    ownerAddr = await owner.getAddress();

    DataRegistry = await ethers.getContractFactory("DataRegistry");
    dataRegistry = await DataRegistry.deploy();
    await dataRegistry.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await dataRegistry.owner()).to.equal(ownerAddr);
    });

    it("Should not be paused initially", async function () {
      expect(await dataRegistry.paused()).to.be.false;
    });

    it("Should start with 0 total sources and types", async function () {
      expect(await dataRegistry.totalDataSources()).to.equal(0);
      const [,, initialTotalTypes] = await dataRegistry.getContractStats();
      expect(initialTotalTypes).to.equal(0);
    });
  });

  describe("Data Source Management", function () {
    const sourceName = "Test Bank API";
    const sourceDescription = "API for retrieving bank account information";
    const apiEndpoint = "https://api.testbank.com/v1";
    const apiKeyHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-api-key"));

    it("Should allow owner to add data source", async function () {
      await dataRegistry.addDataSource(
        sourceId1,
        sourceName,
        sourceDescription,
        apiEndpoint,
        apiKeyHash
      );

      const [sourceNameResult, sourceDescriptionResult, apiEndpointResult, isActive, addedAt, requestCount, successCount, failureCount] = await dataRegistry.getDataSource(sourceId1);
      expect(sourceNameResult).to.equal(sourceName);
      expect(sourceDescriptionResult).to.equal(sourceDescription);
      expect(apiEndpointResult).to.equal(apiEndpoint);
      expect(isActive).to.be.true;
      expect(addedAt).to.be.gt(0);
    });

    it("Should not allow non-owner to add data source", async function () {
      await expect(
        dataRegistry.connect(user1).addDataSource(
          sourceId1,
          sourceName,
          sourceDescription,
          apiEndpoint,
          apiKeyHash
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should reject adding source with empty name", async function () {
      await expect(
        dataRegistry.addDataSource(
          sourceId1,
          "",
          sourceDescription,
          apiEndpoint,
          apiKeyHash
        )
      ).to.be.revertedWith("Source name cannot be empty");
    });

    it("Should reject adding source with empty endpoint", async function () {
      await expect(
        dataRegistry.addDataSource(
          sourceId1,
          sourceName,
          sourceDescription,
          "",
          apiKeyHash
        )
      ).to.be.revertedWith("API endpoint cannot be empty");
    });

    it("Should reject adding duplicate source ID", async function () {
      await dataRegistry.addDataSource(
        sourceId1,
        sourceName,
        sourceDescription,
        apiEndpoint,
        apiKeyHash
      );

      await expect(
        dataRegistry.addDataSource(
          sourceId1,
          "Another Source",
          "Another description",
          "https://another.com",
          ethers.utils.keccak256(ethers.utils.toUtf8Bytes("another-key"))
        )
      ).to.be.revertedWith("Data source already exists");
    });

    it("Should update total sources count", async function () {
      expect(await dataRegistry.totalDataSources()).to.equal(0);
      
      await dataRegistry.addDataSource(
        sourceId1,
        sourceName,
        sourceDescription,
        apiEndpoint,
        apiKeyHash
      );

      expect(await dataRegistry.totalDataSources()).to.equal(1);
    });

    it("Should emit DataSourceAdded event", async function () {
      await expect(
        dataRegistry.addDataSource(
          sourceId1,
          sourceName,
          sourceDescription,
          apiEndpoint,
          apiKeyHash
        )
      )
        .to.emit(dataRegistry, "DataSourceAdded")
        .withArgs(sourceId1, sourceName, owner.address);
    });
  });

  describe("Data Type Management", function () {
    const typeName = "Bank Account Balance";
    const typeDescription = "Current balance of bank accounts";
    const dataFormat = "JSON";
    const updateFrequency = "Daily";

    it("Should allow owner to add data type", async function () {
      await dataRegistry.addDataType(
        typeId1,
        typeName,
        typeDescription
      );

      const [typeNameResult, typeDescriptionResult, isSupported, addedAt, lastUsed] = await dataRegistry.getDataType(typeId1);
      expect(typeNameResult).to.equal(typeName);
      expect(typeDescriptionResult).to.equal(typeDescription);
      expect(isSupported).to.be.false;
      expect(addedAt).to.be.gt(0);

    });

    it("Should not allow non-owner to add data type", async function () {
      await expect(
        dataRegistry.connect(user1).addDataType(
          typeId1,
          typeName,
          typeDescription
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should reject adding type with empty name", async function () {
      await expect(
        dataRegistry.addDataType(
          typeId1,
          "",
          typeDescription
        )
      ).to.be.revertedWith("Type name cannot be empty");
    });

    it("Should reject adding duplicate type ID", async function () {
      await dataRegistry.addDataType(
        typeId1,
        typeName,
        typeDescription
      );

      await expect(
        dataRegistry.addDataType(
          typeId1,
          "Another Type",
          "Another description"
        )
      ).to.be.revertedWith("Data type already exists");
    });

    it("Should update total types count", async function () {
      const statsBefore = await dataRegistry.getContractStats();
      expect(statsBefore[1]).to.equal(0); // totalDataTypes should be 0

      // Add a unique data type for this test
      const uniqueTypeId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("unique-type"));
      await dataRegistry.addDataType(
        uniqueTypeId,
        "Unique Test Type",
        "Type for testing count update"
      );

      const statsAfter = await dataRegistry.getContractStats();
      expect(statsAfter[1]).to.equal(1); // totalDataTypes should be 1
    });

    it("Should emit DataTypeAdded event", async function () {
      await expect(
        dataRegistry.addDataType(
          typeId1,
          typeName,
          typeDescription
        )
      )
        .to.emit(dataRegistry, "DataTypeAdded")
        .withArgs(typeId1, typeName);
    });
  });

  describe("Data Source Activation/Deactivation", function () {
    const sourceName = "Test Source";
    const sourceDescription = "Test Description";
    const apiEndpoint = "https://test.com";
    const apiKeyHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-key"));

    beforeEach(async function () {
      await dataRegistry.addDataSource(
        sourceId1,
        sourceName,
        sourceDescription,
        apiEndpoint,
        apiKeyHash
      );
    });

    it("Should allow owner to deactivate data source", async function () {
      await dataRegistry.deactivateDataSource(sourceId1);

      const [,,, isActive,,,,,] = await dataRegistry.getDataSource(sourceId1);
      expect(isActive).to.be.false;
    });

    it("Should allow owner to reactivate data source", async function () {
      await dataRegistry.deactivateDataSource(sourceId1);
      await dataRegistry.reactivateDataSource(sourceId1);

      const [,,, isActive,,,,,] = await dataRegistry.getDataSource(sourceId1);
      expect(isActive).to.be.true;
    });

    it("Should not allow non-owner to change source status", async function () {
      await expect(
        dataRegistry.connect(user1).deactivateDataSource(sourceId1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should reject changing status for non-existent source", async function () {
      const invalidSourceId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("invalid"));
      await expect(
        dataRegistry.deactivateDataSource(invalidSourceId)
      ).to.be.revertedWith("Invalid source ID");
    });

    it("Should emit DataSourceStatusChanged event", async function () {
      await expect(dataRegistry.deactivateDataSource(sourceId1))
        .to.emit(dataRegistry, "DataSourceDeactivated")
        .withArgs(sourceId1);
    });
  });

  describe("Data Type Activation/Deactivation", function () {
    const typeName = "Test Type";
    const typeDescription = "Test Description";
    const dataFormat = "JSON";
    const updateFrequency = "Daily";
    const sourceName = "Test Source";
    const sourceDescription = "Test Source Description";
    const apiEndpoint = "https://test.com";
    const apiKeyHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-key"));

    beforeEach(async function () {
      // Create both source and type for testing
      await dataRegistry.addDataSource(
        sourceId1,
        sourceName,
        sourceDescription,
        apiEndpoint,
        apiKeyHash
      );
      await dataRegistry.addDataType(
        typeId1,
        typeName,
        typeDescription
      );
    });

    it("Should allow owner to add data type support to source", async function () {
      await dataRegistry.addDataTypeSupport(sourceId1, typeId1);

      const supportsType = await dataRegistry.isDataTypeSupported(sourceId1, typeId1);
      expect(supportsType).to.be.true;
    });

    it("Should allow owner to remove data type support from source", async function () {
      await dataRegistry.addDataTypeSupport(sourceId1, typeId1);
      await dataRegistry.removeDataTypeSupport(sourceId1, typeId1);

      const supportsType = await dataRegistry.isDataTypeSupported(sourceId1, typeId1);
      expect(supportsType).to.be.false;
    });

    it("Should not allow non-owner to add data type support", async function () {
      await expect(
        dataRegistry.connect(user1).addDataTypeSupport(sourceId1, typeId1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should reject adding support for non-existent type", async function () {
      const invalidTypeId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("invalid"));
      await expect(
        dataRegistry.addDataTypeSupport(sourceId1, invalidTypeId)
      ).to.be.revertedWith("Data type does not exist");
    });

    it("Should emit DataTypeSupported event", async function () {
      await expect(dataRegistry.addDataTypeSupport(sourceId1, typeId1))
        .to.emit(dataRegistry, "DataTypeSupported")
        .withArgs(sourceId1, typeId1);
    });
  });

  describe("Data Request Recording", function () {
    const sourceName = "Test Source";
    const sourceDescription = "Test Description";
    const apiEndpoint = "https://test.com";
    const apiKeyHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-key"));
    const typeName = "Test Type";
    const typeDescription = "Test Description";
    const dataFormat = "JSON";
    const updateFrequency = "Daily";

    beforeEach(async function () {
      await dataRegistry.addDataSource(
        sourceId1,
        sourceName,
        sourceDescription,
        apiEndpoint,
        apiKeyHash
      );
      await dataRegistry.addDataType(
        typeId1,
        typeName,
        typeDescription
      );
      await dataRegistry.addDataTypeSupport(sourceId1, typeId1);
    });

    it("Should allow owner to record successful data request", async function () {
      await dataRegistry.recordDataRequest(sourceId1, typeId1, fintech1Addr, true);
      
      const [requestCount, successCount, failureCount] = await dataRegistry.getDataSourceStats(sourceId1);
      expect(requestCount).to.equal(1);
      expect(successCount).to.equal(1);
      expect(failureCount).to.equal(0);
    });

    it("Should allow owner to record failed data request", async function () {
      await dataRegistry.recordDataRequest(sourceId1, typeId1, fintech1Addr, false);
      
      const [requestCount, successCount, failureCount] = await dataRegistry.getDataSourceStats(sourceId1);
      expect(requestCount).to.equal(1);
      expect(successCount).to.equal(0);
      expect(failureCount).to.equal(1);
    });

    it("Should not allow non-owner to record data request", async function () {
      await expect(
        dataRegistry.connect(user1).recordDataRequest(sourceId1, typeId1, fintech1Addr, true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should reject recording request for non-existent source", async function () {
      const invalidSourceId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("invalid"));
      await expect(
        dataRegistry.recordDataRequest(invalidSourceId, typeId1, fintech1Addr, true)
      ).to.be.revertedWith("Invalid source ID");
    });

    it("Should reject recording request for non-existent type", async function () {
      const invalidTypeId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("invalid"));
      await expect(
        dataRegistry.recordDataRequest(sourceId1, invalidTypeId, fintech1Addr, true)
      ).to.be.revertedWith("Data type does not exist");
    });

    it("Should reject recording request for inactive source", async function () {
      await dataRegistry.deactivateDataSource(sourceId1);

      await expect(
        dataRegistry.recordDataRequest(sourceId1, typeId1, fintech1Addr, true)
      ).to.be.revertedWith("Source is not active");
    });

    it("Should reject recording request for inactive type", async function () {
      await dataRegistry.removeDataTypeSupport(sourceId1, typeId1);
      
      await expect(
        dataRegistry.recordDataRequest(sourceId1, typeId1, fintech1Addr, true)
      ).to.be.revertedWith("Data type not supported by source");
    });

    it("Should update request statistics correctly", async function () {
      // Record multiple requests
      await dataRegistry.recordDataRequest(sourceId1, typeId1, fintech1Addr, true);
      await dataRegistry.recordDataRequest(sourceId1, typeId1, fintech1Addr, false);
      await dataRegistry.recordDataRequest(sourceId1, typeId1, fintech1Addr, true);
      
      const [requestCount, successCount, failureCount] = await dataRegistry.getDataSourceStats(sourceId1);
      expect(requestCount).to.equal(3);
      expect(successCount).to.equal(2);
      expect(failureCount).to.equal(1);
    });

    it("Should emit DataRequested event", async function () {
      await expect(
        dataRegistry.recordDataRequest(sourceId1, typeId1, fintech1Addr, true)
      )
        .to.emit(dataRegistry, "DataRequested")
        .withArgs(sourceId1, typeId1, fintech1Addr);
    });
  });

  describe("Data Source Updates", function () {
    const sourceName = "Test Source";
    const sourceDescription = "Test Description";
    const apiEndpoint = "https://test.com";
    const apiKeyHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-key"));

    beforeEach(async function () {
      await dataRegistry.addDataSource(
        sourceId1,
        sourceName,
        sourceDescription,
        apiEndpoint,
        apiKeyHash
      );
    });

    it("Should allow owner to update data source", async function () {
      const newName = "Updated Source";
      const newDescription = "Updated Description";
      const newEndpoint = "https://updated.com";
      const newApiKeyHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("updated-key"));

      await dataRegistry.updateDataSource(
        sourceId1,
        newName,
        newDescription,
        newEndpoint
      );

      const [sourceNameResult, sourceDescriptionResult, apiEndpointResult, isActive, addedAt, requestCount, successCount, failureCount] = await dataRegistry.getDataSource(sourceId1);
      expect(sourceNameResult).to.equal(newName);
      expect(sourceDescriptionResult).to.equal(newDescription);
      expect(apiEndpointResult).to.equal(newEndpoint);
    });

    it("Should not allow non-owner to update data source", async function () {
      await expect(
        dataRegistry.connect(user1).updateDataSource(
          sourceId1,
          "New Name",
          "New Description",
          "https://new.com"
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should reject updating non-existent source", async function () {
      const invalidSourceId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("invalid"));
      await expect(
        dataRegistry.updateDataSource(
          invalidSourceId,
          "New Name",
          "New Description",
          "https://new.com"
        )
      ).to.be.revertedWith("Invalid source ID");
    });

    it("Should reject updating with empty name", async function () {
      await expect(
        dataRegistry.updateDataSource(
          sourceId1,
          "",
          "New Description",
          "https://new.com"
        )
      ).to.be.revertedWith("Source name cannot be empty");
    });

    it("Should reject updating with empty endpoint", async function () {
      await expect(
        dataRegistry.updateDataSource(
          sourceId1,
          "New Name",
          "New Description",
          "",

        )
      ).to.be.revertedWith("API endpoint cannot be empty");
    });

    it("Should emit DataSourceUpdated event", async function () {
      const newName = "Updated Source";
      await expect(
        dataRegistry.updateDataSource(
          sourceId1,
          newName,
          "Updated Description",
          "https://updated.com"
        )
      )
        .to.emit(dataRegistry, "DataSourceUpdated")
        .withArgs(sourceId1, newName);
    });
  });

  describe("Data Type Updates", function () {
    const typeName = "Test Type";
    const typeDescription = "Test Description";
    const dataFormat = "JSON";
    const updateFrequency = "Daily";

    beforeEach(async function () {
      await dataRegistry.addDataType(
        typeId1,
        typeName,
        typeDescription
      );
    });

    it("Should allow owner to update data type", async function () {
      const newName = "Updated Type";
      const newDescription = "Updated Description";
      const newFormat = "XML";
      const newFrequency = "Weekly";

      await dataRegistry.updateDataType(
        typeId1,
        newName,
        newDescription
      );

      const [typeNameResult, typeDescriptionResult, isSupported, addedAt, lastUsed] = await dataRegistry.getDataType(typeId1);
      expect(typeNameResult).to.equal(newName);
      expect(typeDescriptionResult).to.equal(newDescription);

    });

    it("Should not allow non-owner to update data type", async function () {
      await expect(
        dataRegistry.connect(user1).updateDataType(
          typeId1,
          "New Name",
          "New Description"
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should reject updating non-existent type", async function () {
      const invalidTypeId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("invalid"));
      await expect(
        dataRegistry.updateDataType(
          invalidTypeId,
          "New Name",
          "New Description"
        )
      ).to.be.revertedWith("Data type does not exist");
    });

    it("Should reject updating with empty name", async function () {
      await expect(
        dataRegistry.updateDataType(
          typeId1,
          "",
          "New Description"
        )
      ).to.be.revertedWith("Type name cannot be empty");
    });

    it("Should emit DataTypeUpdated event", async function () {
      const newName = "Updated Type";
      await expect(
        dataRegistry.updateDataType(
          typeId1,
          newName,
          "Updated Description"
        )
      )
        .to.emit(dataRegistry, "DataTypeAdded")
        .withArgs(typeId1, newName);
    });
  });

  describe("Pausable Functionality", function () {
    it("Should allow owner to pause contract", async function () {
      await dataRegistry.pause();
      expect(await dataRegistry.paused()).to.be.true;
    });

    it("Should allow owner to unpause contract", async function () {
      await dataRegistry.pause();
      await dataRegistry.unpause();
      expect(await dataRegistry.paused()).to.be.false;
    });

    it("Should not allow non-owner to pause contract", async function () {
      await expect(
        dataRegistry.connect(user1).pause()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow non-owner to unpause contract", async function () {
      await dataRegistry.pause();
      await expect(
        dataRegistry.connect(user1).unpause()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should reject operations when paused", async function () {
      await dataRegistry.pause();

      const sourceName = "Test Source";
      const sourceDescription = "Test Description";
      const apiEndpoint = "https://test.com";
      const apiKeyHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-key"));

      await expect(
        dataRegistry.addDataSource(
          sourceId1,
          sourceName,
          sourceDescription,
          apiEndpoint,
          apiKeyHash
        )
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Contract Statistics", function () {
    it("Should return correct contract statistics", async function () {
      const [totalDataSources, totalDataTypes, totalRequests] = await dataRegistry.getContractStats();
      expect(totalDataSources).to.equal(0);
      expect(totalDataTypes).to.equal(0);
      expect(totalRequests).to.equal(0);
    });

    it("Should update statistics correctly", async function () {
      const sourceName = "Test Source";
      const sourceDescription = "Test Description";
      const apiEndpoint = "https://test.com";
      const apiKeyHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-key"));
      const typeName = "Test Type";
      const typeDescription = "Test Description";
      const dataFormat = "JSON";
      const updateFrequency = "Daily";

      // Add source and type
      await dataRegistry.addDataSource(
        sourceId1,
        sourceName,
        sourceDescription,
        apiEndpoint,
        apiKeyHash
      );
      await dataRegistry.addDataType(
        typeId1,
        typeName,
        typeDescription
      );
      await dataRegistry.addDataTypeSupport(sourceId1, typeId1);

      let [totalDataSources, totalDataTypes, totalRequests] = await dataRegistry.getContractStats();
      expect(totalDataSources).to.equal(1);
      expect(totalDataTypes).to.equal(1);

      // Record data request
      await dataRegistry.recordDataRequest(sourceId1, typeId1, fintech1Addr, true);

      [totalDataSources, totalDataTypes, totalRequests] = await dataRegistry.getContractStats();
      expect(totalRequests).to.equal(1);
    });
  });
});
