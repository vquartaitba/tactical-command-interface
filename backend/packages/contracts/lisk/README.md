# Lisk Smart Contracts

## Purpose

To act as the main application and identity layer of the protocol. It manages the user's identity, orchestrates the workflow across different chains, and materializes the final credit score as a digital asset.

## Core Responsibilities

### 1. Identity Management (Identity.sol)
- Maintains the registry linking a user's wallet to their verified identity
- Stores the Filecoin CID of their proofs
- Acts as the main contract for each user
- Manages user verification status and API authorizations

### 2. Cross-Chain Orchestration
- Initiates requests to Flare's State Connector for data fetching
- Sends the verified data to the Zama network via cross-chain messaging protocol
- Coordinates the entire credit score generation workflow

### 3. SBT Issuance (ScoreSBT.sol)
- Receives the encrypted result from Zama
- Mints the Soulbound NFT that represents the user's "Financial Passport"
- Manages SBT metadata and proof storage

### 4. Access Control & Permissions
- Manages the read permissions that the user grants to Fintechs
- Controls access to credit score data
- Implements granular permission system

### 5. Data Source Registry (DataRegistry.sol)
- Maintains a whitelist of real-world APIs that Flare is permitted to query
- Ensures data quality and security
- Manages API authorization and revocation

## Key Technologies

- **Solidity**: Smart contract development
- **Lisk SDK**: Lisk-specific blockchain interactions
- **OpenZeppelin**: Security and standards implementation

## Interactions

### External Dependencies
- **packages/web-app**: **Now the sole front-end** that interacts with the contracts
  - Receives all signed transaction calls from end-users and Fintechs
  - Handles user consent transactions and Fintech score requests
  - Manages wallet connections and transaction signing
- **contracts/zama**: Sends data for confidential computation and receives encrypted results
- **Flare Network**: Communicates with State Connector for data attestations
- **Storage System (Filecoin/IPFS)**: Stores Content Identifier (CID) for metadata and proofs

### Internal Workflow
1. User registration and identity establishment
2. Fintech credit score request initiation
3. Cross-chain data verification via Flare
4. Data transmission to Zama for computation
5. Encrypted result reception and SBT minting
6. Metadata storage on decentralized storage

## Security Features

- **Ownership Controls**: Only authorized parties can perform administrative functions
- **Pausable Operations**: Emergency stop functionality for critical operations
- **Access Validation**: All operations verify user permissions before execution
- **Event Logging**: Comprehensive audit trail for all operations

## Contract Architecture

The contracts follow a modular design where:
- `Identity.sol` serves as the main orchestrator
- `ScoreSBT.sol` handles the final asset creation
- `DataRegistry.sol` manages external data source permissions

Each contract has specific responsibilities and communicates through well-defined interfaces, ensuring separation of concerns and maintainability.

## Simplified Integration

With the transition to a unified web platform, the contract interaction model has been simplified:

- **Single Front-End**: All user interactions now come through the unified web application
- **Wallet Integration**: Users connect their existing browser wallets directly to the contracts
- **Unified User Management**: Single system handles both end-users and Fintechs
- **Streamlined Workflow**: Reduced complexity in the front-end architecture while maintaining all functionality
