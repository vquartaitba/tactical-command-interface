# User Flow Documentation

## Overview

This document describes the complete user journey through the Zkredit protocol, from initial registration to credit score generation and management. The flow encompasses both end-users (individuals seeking credit scores) and business users (Fintechs requesting credit scores) through a unified web platform.

## Unified Web Platform Journey

### 1. End-User Experience (Web Application)

#### Step 1: Platform Access and Wallet Connection
- User visits the Zkredit web application
- User connects their existing browser wallet (MetaMask, Rabby, etc.)
- Platform detects wallet connection and authenticates user
- User is redirected to appropriate interface based on their role

#### Step 2: Identity Registration and KYC
- User provides basic information (name, email, phone)
- Platform initiates KYC verification process
- User uploads required documents (ID, proof of address)
- Platform submits verification request to KYC provider

#### Step 3: KYC Verification and Identity Creation
- KYC provider processes documents and verifies identity
- Verification status updated in real-time on web interface
- User receives notification of verification completion
- Identity contract on Lisk blockchain is updated
- User's Financial Passport is created

#### Step 4: Financial Passport Management
- User can view their minted Soulbound Token (SBT)
- Platform displays credit score information and metadata
- User manages sharing permissions with Fintechs
- User receives notifications of credit score requests

### 2. Fintech Experience (Web Application)

#### Step 1: Business Account Creation
- Fintech representative visits the same web application
- Business information is collected and verified
- Legal and compliance documents are submitted
- Business verification process is initiated

#### Step 2: Business Verification and Access
- Zkredit team reviews business information
- Compliance checks are performed
- Business verification is completed
- API keys and access credentials are generated
- Fintech gains access to business interface

#### Step 3: Credit Score Request Process
- Fintech identifies user by wallet address or ENS name
- System validates user exists and is verified
- User consent status is checked
- Fintech submits credit score request
- User is notified of pending request

#### Step 4: Score Generation and Result Processing
- Fintech monitors request progress through web dashboard
- Real-time updates on processing status
- Encrypted credit score is received when complete
- Score is decrypted using authorized access keys
- Result is displayed in dashboard with export options

### 3. Credit Score Generation Workflow

#### Step 1: Score Request Initiation
- Fintech submits credit score request through web interface
- Platform validates request and user permissions
- User receives notification of pending request
- User reviews request details and provides consent

#### Step 2: Data Collection and Verification
- Platform initiates data verification via Flare network
- Flare queries authorized external APIs
- Data is verified and attested by Flare
- Verified data is encrypted and sent to Zama

#### Step 3: AI Model Execution
- Zama network receives encrypted data
- AI model executes on encrypted data using FHE
- Credit score is calculated and encrypted
- Encrypted result is returned to Lisk

#### Step 4: SBT Minting and Storage
- Lisk contract receives encrypted credit score
- Soulbound Token (SBT) is minted to user's wallet
- Metadata and proofs are stored on Filecoin/IPFS
- User receives notification of completion
- Fintech can access results through web dashboard

## Cross-Chain Workflow

### 1. Data Verification Flow (Flare Network)

#### Step 1: Verification Request
- Lisk contract emits verification request event
- Cross-chain bridge forwards request to Flare
- Flare State Connector receives request
- Request is queued for processing

#### Step 2: External API Query
- Flare queries authorized external APIs
- Data is retrieved and validated
- Quality checks are performed
- Data is formatted for blockchain storage

#### Step 3: Attestation Generation
- Cryptographic attestation is generated
- Proof of data authenticity is created
- Attestation is signed by Flare validators
- Verified data is returned to Lisk

### 2. Computation Flow (Zama Network)

#### Step 1: Data Transmission
- Encrypted data is sent to Zama network
- Cross-chain bridge validates transmission
- Zama contract receives encrypted data
- Data is queued for processing

#### Step 2: AI Model Execution
- Credit scoring model is loaded
- FHE operations are performed on encrypted data
- Model parameters are applied
- Credit score is calculated and encrypted

#### Step 3: Result Return
- Encrypted result is prepared for return
- Cross-chain bridge validates return message
- Result is transmitted back to Lisk
- Lisk contract processes encrypted result

### 3. Storage Flow (Filecoin/IPFS)

#### Step 1: Metadata Preparation
- Contract metadata is prepared
- Cryptographic proofs are included
- Content addressing is calculated
- Storage parameters are configured

#### Step 2: Decentralized Storage
- Metadata is stored on IPFS network
- Filecoin provides storage incentives
- Content ID (CID) is generated
- Storage proof is created

#### Step 3: Blockchain Reference
- CID is returned to Lisk contract
- Contract stores CID reference
- Storage verification is performed
- Metadata becomes accessible

## Error Handling and Recovery

### 1. User-Facing Errors

#### Network Errors
- Connection timeout handling
- Retry mechanisms with exponential backoff
- User-friendly error messages
- Alternative action suggestions

#### Transaction Failures
- Gas estimation errors
- Transaction confirmation failures
- Rollback and recovery procedures
- User notification and guidance

#### Data Validation Errors
- Input validation failures
- Format and type checking
- User guidance for corrections
- Error prevention measures

### 2. System-Level Errors

#### Cross-Chain Failures
- Bridge connection failures
- Message transmission errors
- Timeout and retry mechanisms
- Fallback and recovery procedures

#### Smart Contract Errors
- Contract execution failures
- Gas limit exceeded errors
- State inconsistency handling
- Emergency pause and recovery

#### External Service Failures
- KYC provider failures
- API rate limiting
- Service unavailability
- Graceful degradation

## Performance and Optimization

### 1. User Experience Optimization

#### Response Time Optimization
- Asynchronous processing where possible
- Progress indicators and status updates
- Background processing for heavy operations
- Caching strategies for frequently accessed data

#### Resource Management
- Efficient memory usage
- Network bandwidth optimization
- Storage space management
- Progressive loading for large datasets

### 2. System Performance

#### Throughput Optimization
- Batch processing capabilities
- Parallel request handling
- Queue management and prioritization
- Load balancing and distribution

#### Cost Optimization
- Gas-efficient smart contract design
- Optimal transaction batching
- Cross-chain message optimization
- Storage cost management

## Security and Privacy

### 1. User Privacy Protection

#### Data Minimization
- Only necessary data collection
- Local processing when possible
- Granular consent controls
- Right to deletion implementation

#### Encryption and Security
- End-to-end encryption
- Secure wallet integration
- Multi-factor authentication
- Secure communication protocols

### 2. System Security

#### Access Control
- Multi-factor authentication
- Role-based permissions
- Session management
- Audit logging and monitoring

#### Threat Protection
- Input validation and sanitization
- Rate limiting and abuse prevention
- DDoS protection
- Security monitoring and alerting

## Compliance and Regulatory

### 1. Regulatory Compliance

#### KYC/AML Requirements
- Identity verification standards
- Document validation procedures
- Compliance reporting
- Audit trail maintenance

#### Data Protection
- GDPR compliance measures
- Data retention policies
- User rights implementation
- Privacy impact assessments

### 2. Financial Regulations

#### Financial Services Compliance
- Regulatory reporting requirements
- Compliance monitoring
- Risk assessment procedures
- Regulatory change management

#### Audit and Reporting
- Comprehensive audit trails
- Regulatory reporting capabilities
- Compliance monitoring dashboards
- Regular compliance reviews

## Migration from Previous Architecture

### 1. From Mobile App to Web Platform

#### User Onboarding
- **Before**: Mobile app with native wallet creation
- **After**: Web interface with existing wallet connection
- **Benefits**: Reduced friction, familiar wallet experience

#### Wallet Management
- **Before**: App-managed private keys
- **After**: User-controlled browser wallets
- **Benefits**: Enhanced security, user sovereignty

#### User Consent
- **Before**: App-based consent management
- **After**: Web-based consent with wallet signing
- **Benefits**: Direct blockchain interaction, transparency

### 2. From Separate Portals to Unified Platform

#### User Management
- **Before**: Separate systems for end-users and Fintechs
- **After**: Single platform with role-based interfaces
- **Benefits**: Unified experience, reduced complexity

#### Authentication
- **Before**: Multiple authentication systems
- **After**: Single sign-on with role-based access
- **Benefits**: Simplified user management, better security

#### Analytics
- **Before**: Separate analytics for different user types
- **After**: Cross-user analytics and insights
- **Benefits**: Comprehensive view, better decision making
