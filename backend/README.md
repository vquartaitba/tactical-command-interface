# Zkredit Protocol

A decentralized financial identity system using multi-chain architecture to solve the "thin-file problem" in emerging markets.

## Core Principles

- **Zero Trust**: No component, not even Zkredit itself, should be a trusted party. Every step is cryptographically verifiable.
- **User Sovereignty**: The user has absolute control and ownership over their data and identity credential. Actions are only initiated with their explicit consent.
- **Separation of Concerns**: Each technology is used for a specific task for which it is best-in-class, maximizing the system's security and efficiency.

## Architecture Overview

The Zkredit protocol operates across multiple specialized blockchains:

- **Lisk**: Main application layer, identity management, cross-chain orchestration, SBT issuance
- **Zama**: Confidential computation layer using Fully Homomorphic Encryption (FHE)
- **Flare Network**: Cross-chain data verification and attestation
- **Filecoin/IPFS**: Decentralized storage for metadata and proofs

## High-Level Workflow

1. User registers and establishes identity on Lisk blockchain
2. Fintech requests credit score for that user
3. With user consent, protocol fetches and verifies real-world data via Flare network
4. Verified data is sent to Zama network for AI model execution on encrypted data
5. Encrypted score is returned to Lisk and minted as a Soulbound NFT (SBT)
6. Metadata and proofs are stored on Filecoin/IPFS

## Project Structure

```
packages/
├── contracts/           # Smart contracts
│   ├── lisk/           # Lisk blockchain contracts
│   └── zama/           # Zama FHE contracts
├── cross-chain-listener/ # Cross-chain monitoring service
└── scripts/            # Deployment and automation scripts
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
npm install
```

### Build Contracts

```bash
npm run build:contracts
```

### Test Contracts

```bash
npm run test:contracts
```

### Deploy Contracts

```bash
npm run deploy:lisk    # Deploy to Lisk
npm run deploy:zama    # Deploy to Zama
```

## Development

This project focuses on the core protocol infrastructure:

- **Smart Contracts**: Identity management, credit scoring, and cross-chain communication
- **Cross-Chain Infrastructure**: Monitoring and validation services
- **Deployment Scripts**: Automated contract deployment and configuration

## License

MIT
