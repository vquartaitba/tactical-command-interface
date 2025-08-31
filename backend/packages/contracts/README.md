# Smart Contracts

This directory contains all the on-chain logic (smart contracts) that defines the behavior of the Zkredit protocol. It is the decentralized backbone of the system.

## Contents

- **`lisk/`**: Contracts for the main application and identity layer
- **`zama/`**: Contracts for confidential computation using FHE

## Architecture

The Zkredit protocol uses a multi-chain architecture where each blockchain serves a specific purpose:

### Lisk Blockchain
- **Identity Management**: User registration, verification, and identity storage
- **Cross-Chain Orchestration**: Coordinates data flow between different blockchains
- **SBT Issuance**: Mints Soulbound NFTs representing Financial Passports
- **Access Control**: Manages permissions for data access and API usage

### Zama Blockchain
- **Confidential Computation**: Executes AI models on encrypted data using FHE
- **Privacy Preservation**: Ensures user data remains encrypted throughout processing
- **Result Generation**: Produces encrypted credit scores without exposing raw data

## Cross-Chain Communication

The protocol implements secure cross-chain messaging to:
- Transfer verified data from Flare to Zama
- Return encrypted results from Zama to Lisk
- Maintain data integrity across different blockchain networks

## Security Features

- **Access Control**: Role-based permissions and ownership controls
- **Pausability**: Emergency stop mechanisms for critical functions
- **Input Validation**: Comprehensive parameter checking and validation
- **Event Logging**: Transparent audit trail for all operations

## Development

### Prerequisites
- Solidity ^0.8.19
- Hardhat ^2.17.0
- OpenZeppelin Contracts ^4.9.0

### Building
```bash
npm run build:lisk    # Build Lisk contracts
npm run build:zama    # Build Zama contracts
npm run build         # Build all contracts
```

### Testing
```bash
npm run test:lisk     # Test Lisk contracts
npm run test:zama     # Test Zama contracts
npm run test          # Test all contracts
```

**📖 [Complete Testing Guide](TESTING.md)** - Detailed instructions for running tests, debugging, and test development.

### Deployment
```bash
npm run deploy:lisk   # Deploy to Lisk network
npm run deploy:zama   # Deploy to Zama network
```

## Dependencies

- **OpenZeppelin**: Standard library for secure smart contract development
- **Hardhat**: Development environment and testing framework
- **Ethers.js**: Ethereum library for contract interaction

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   cd lisk && npm install
   cd ../zama && npm install
   ```

2. **Build contracts:**
   ```bash
   npm run build
   ```

3. **Run tests:**
   ```bash
   npm test
   ```

4. **For detailed testing information, see [TESTING.md](TESTING.md)**
