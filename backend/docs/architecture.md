# Zkredit Protocol Architecture

## System Overview

The Zkredit Protocol is a decentralized financial identity system built across multiple blockchain networks, each serving a specific purpose in the credit scoring workflow. The architecture follows a zero-trust, user-sovereign design that ensures privacy and security at every step.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Unified Web Application                      │
│                    (packages/web-app)                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   End-User      │  │   Fintech       │  │   Admin         │ │
│  │   Interface     │  │   Interface     │  │   Interface     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Lisk Blockchain                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │  Identity   │  │  ScoreSBT   │  │   Data     │           │
│  │  Contract   │  │  Contract   │  │  Registry  │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Flare Network                                │
│                    State Connector                              │
│                    (Data Verification)                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Zama Network                                 │
│                    fhEVM                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              CreditScoreModel Contract                  │   │
│  │              (FHE Computation)                         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Filecoin/IPFS                                │
│                    (Metadata & Proofs Storage)                  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Unified Web Application (packages/web-app)

**Purpose**: Single interface serving all participants in the Zkredit ecosystem

**Key Components**:
- **End-User Interface**: Onboarding, wallet management, consent management, SBT display
- **Fintech Interface**: Score requests, analytics, user management
- **Admin Interface**: System administration and monitoring
- **Wallet Integration**: Web3Modal/RainbowKit for seamless wallet connectivity

**Responsibilities**:
- Unified user authentication and role management
- End-user onboarding and KYC integration
- Fintech business operations and analytics
- Direct blockchain interaction through user wallets
- Responsive design for all device types

**Interactions**:
- **Sole Front-End**: Now the only user-facing interface in the system
- **Direct Blockchain Access**: Users interact directly with contracts through their wallets
- **Unified User Management**: Single system handles all user types and permissions

### 2. Lisk Blockchain (Main Application Layer)

**Purpose**: Central orchestrator and identity management layer

**Key Components**:
- **Identity Contract**: Manages user registration, verification, and API permissions
- **ScoreSBT Contract**: Handles Soulbound Token minting and metadata storage
- **Data Registry Contract**: Maintains whitelist of authorized data sources

**Responsibilities**:
- User identity lifecycle management
- Cross-chain workflow orchestration
- SBT issuance and management
- Access control and permissions

**Interactions**:
- **Receives requests from unified web-app**: Single source for all user interactions
- Initiates data verification via Flare network
- Sends data to Zama for computation
- Receives encrypted results and mints SBTs
- Stores metadata references on Filecoin/IPFS

### 3. Zama Network (Confidential Computation)

**Purpose**: Privacy-preserving AI model execution

**Key Components**:
- **CreditScoreModel Contract**: Implements credit scoring algorithms using FHE
- **fHVM**: Fully Homomorphic Encryption Virtual Machine

**Responsibilities**:
- Execute AI models on encrypted data
- Maintain complete data privacy
- Return encrypted computation results
- Optimize FHE operations for efficiency

**Interactions**:
- Receives encrypted data from Lisk
- Processes data using FHE-compatible algorithms
- Returns encrypted credit scores
- Maintains isolation from external systems

### 4. Flare Network (Data Verification)

**Purpose**: Cross-chain data attestation and verification

**Key Components**:
- **State Connector**: Verifies real-world data from authorized APIs
- **Attestation System**: Provides cryptographic proofs of data authenticity

**Responsibilities**:
- Verify data from external sources
- Provide cryptographic attestations
- Ensure data quality and authenticity
- Bridge Web2 and Web3 data

**Interactions**:
- Receives data verification requests from Lisk
- Queries authorized external APIs
- Returns verified data with attestations
- Maintains whitelist of trusted data sources

### 5. Filecoin/IPFS (Decentralized Storage)

**Purpose**: Immutable storage for metadata and proofs

**Key Components**:
- **IPFS**: Distributed file system for content addressing
- **Filecoin**: Incentivized storage network

**Responsibilities**:
- Store metadata and cryptographic proofs
- Ensure data immutability and availability
- Provide content addressing for blockchain references
- Enable decentralized data persistence

**Interactions**:
- Receives metadata from Lisk contracts
- Stores data with content addressing
- Returns CIDs for blockchain storage
- Ensures data availability and redundancy

## Data Flow Architecture

### 1. User Registration Flow

```
User (Web App) → Lisk (Identity Contract) → Filecoin/IPFS
     ↓
1. User connects wallet and registers identity through web interface
2. Identity contract stores user information
3. Metadata stored on Filecoin/IPFS
4. CID returned and stored in contract
```

### 2. Credit Score Request Flow

```
Fintech (Web App) → Lisk (Identity Contract) → Flare → Zama → Lisk → Filecoin/IPFS
     ↓
1. Fintech requests credit score for user through web interface
2. Lisk contract initiates data verification via Flare
3. Flare verifies data from external APIs
4. Verified data sent to Zama for computation
5. Zama executes AI model on encrypted data
6. Encrypted result returned to Lisk
7. SBT minted with metadata stored on Filecoin/IPFS
```

### 3. Cross-Chain Communication Flow

```
Lisk → Cross-Chain Bridge → Zama
  ↓
1. Lisk contract emits cross-chain message
2. Bridge validates and forwards message
3. Zama contract receives and processes message
4. Result returned via reverse bridge
5. Lisk contract processes encrypted result
```

## Security Architecture

### 1. Zero Trust Design

**Principles**:
- No trusted parties in the system
- All operations cryptographically verifiable
- Continuous verification at every step
- Defense in depth approach

**Implementation**:
- Smart contract access controls
- Cryptographic proof verification
- Multi-signature requirements
- Regular security audits

### 2. Privacy Preservation

**FHE Implementation**:
- End-to-end encryption of sensitive data
- Computation on encrypted data
- No decryption during processing
- Mathematical security guarantees

**Data Minimization**:
- Only necessary data collected
- Local processing when possible
- Granular consent controls
- Right to deletion

### 3. Access Control

**Multi-Layer Security**:
- Blockchain-level permissions
- Smart contract access controls
- Application-level authentication
- User consent management

**Permission Model**:
- Role-based access control
- Granular permission system
- Time-limited access
- Audit trail maintenance

## Scalability Architecture

### 1. Horizontal Scaling

**Component Scaling**:
- Multiple instances of cross-chain listeners
- Load-balanced web application deployment
- Distributed infrastructure
- Multi-region deployment

**Blockchain Scaling**:
- Layer 2 solutions for high throughput
- Sharding for parallel processing
- Optimistic rollups for cost reduction
- State channels for frequent interactions

### 2. Performance Optimization

**Smart Contract Optimization**:
- Gas-efficient contract design
- Batch processing capabilities
- Efficient data structures
- Minimal storage operations

**Cross-Chain Optimization**:
- Asynchronous message processing
- Parallel request handling
- Caching strategies
- Connection pooling

## Integration Architecture

### 1. External System Integration

**KYC Providers**:
- Standardized API interfaces
- Secure data transmission
- Compliance verification
- Audit trail maintenance

**Financial Data Sources**:
- Authorized API access
- Data quality validation
- Rate limiting and quotas
- Error handling and retry

### 2. API Architecture

**RESTful APIs**:
- Standard HTTP methods
- JSON data format
- Authentication headers
- Rate limiting headers

**WebSocket APIs**:
- Real-time updates
- Connection management
- Message queuing
- Error handling

## Monitoring and Observability

### 1. System Monitoring

**Metrics Collection**:
- Transaction throughput
- Response times
- Error rates
- Resource utilization

**Health Checks**:
- Contract availability
- Cross-chain connectivity
- Storage system health
- External service status

### 2. Alerting and Notification

**Alert Types**:
- Critical failures
- Performance degradation
- Security incidents
- Capacity warnings

**Notification Channels**:
- Email alerts
- Slack notifications
- PagerDuty integration
- SMS alerts

## Disaster Recovery

### 1. Backup Strategies

**Data Backup**:
- Regular blockchain state snapshots
- Metadata backup from Filecoin/IPFS
- Configuration backup
- Key backup and recovery

**Recovery Procedures**:
- Automated recovery scripts
- Manual recovery procedures
- Testing and validation
- Documentation and training

### 2. Business Continuity

**Failover Systems**:
- Multiple blockchain nodes
- Redundant cross-chain bridges
- Backup storage systems
- Geographic distribution

**Recovery Time Objectives**:
- Critical systems: < 1 hour
- Important systems: < 4 hours
- Standard systems: < 24 hours
- Documentation and training
