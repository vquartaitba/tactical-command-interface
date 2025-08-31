# Flare Integration for Zkredit Protocol

This document describes the Flare Network integration contracts that enable cross-chain data verification and attestation for the Zkredit protocol.

## Overview

The Flare integration consists of two main smart contracts:

1. **FlareStateConnector** - Consumer contract for Flare State Connector attestations
2. **FlareIntegration** - Bridge contract that integrates Flare with the existing Zkredit protocol

## Architecture

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│   Fintech      │───▶│  FlareIntegration   │───▶│ FlareStateConnector │
│   Application  │    │                     │    │                 │
└─────────────────┘    └──────────────────────┘    └─────────────────┘
                                │                           │
                                ▼                           ▼
                       ┌─────────────────┐    ┌──────────────────────┐
                       │   Identity      │    │   Flare Network     │
                       │   Contract      │    │   (State Connector) │
                       └─────────────────┘    └──────────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   ScoreSBT      │
                       │   Contract      │
                       └─────────────────┘
```

## Contracts

### 1. FlareStateConnector

**Purpose**: Consumer contract for Flare State Connector attestations

**Key Features**:
- Data verification request management
- Attestation submission and validation
- Validator whitelist management
- Cryptographic signature verification
- Time-based security controls

**Main Functions**:
- `submitDataRequest(bytes32 dataHash)` - Submit a data verification request
- `submitAttestation(bytes32 requestId, bytes32 dataHash, bytes calldata signature, uint256 blockNumber)` - Submit validator attestation
- `verifyAndProcessAttestation(bytes32 requestId)` - Verify and process attestation
- `setValidatorWhitelist(address validator, bool isWhitelisted)` - Manage validator whitelist

**Security Features**:
- Minimum attestation delay (prevents immediate attestations)
- Maximum attestation age (prevents stale attestations)
- Cryptographic signature verification
- Validator whitelist controls
- Reentrancy protection

### 2. FlareIntegration

**Purpose**: Bridge contract that integrates Flare with the Zkredit protocol

**Key Features**:
- Credit score request initiation
- Flare attestation processing
- Cross-chain message handling
- SBT minting integration
- Fintech authorization management

**Main Functions**:
- `initiateCreditScoreRequest(address user, bytes32 dataHash)` - Start credit score request
- `processFlareAttestation(bytes32 requestId, bytes32 attestationProof)` - Process Flare verification
- `processZamaResult(bytes32 requestId, uint256 creditScore, bytes calldata encryptedResult)` - Process Zama computation result
- `setFintechAuthorization(address fintech, bool isAuthorized)` - Manage fintech permissions

**Workflow Integration**:
1. Fintech initiates credit score request
2. Request is submitted to Flare State Connector
3. Flare validators provide attestations
4. Integration contract processes verified data
5. Cross-chain message sent to Zama network
6. Credit score computed and SBT minted

## Deployment

### Prerequisites

- Node.js and npm/yarn installed
- Hardhat configured for target network
- Environment variables set for existing contract addresses

### Environment Variables

```bash
# Required for FlareIntegration deployment
export IDENTITY_CONTRACT_ADDRESS="0x..."
export SCORE_SBT_CONTRACT_ADDRESS="0x..."
export DATA_REGISTRY_CONTRACT_ADDRESS="0x..."

# Optional: Set specific Flare contract addresses
export FLARE_STATE_CONNECTOR_ADDRESS="0x..."
export FLARE_INTEGRATION_ADDRESS="0x..."
```

### Deployment Commands

#### Deploy Individual Contracts

```bash
# Deploy FlareStateConnector
npx hardhat run scripts/deploy-flare.ts --network <network>

# Deploy FlareIntegration (requires existing contracts)
npx hardhat run scripts/deploy-flare-integration.ts --network <network>
```

#### Deploy Complete Integration

```bash
# Deploy all contracts with configuration
npx hardhat run scripts/deploy-flare-complete.ts --network <network>
```

### Post-Deployment Configuration

1. **Whitelist Validators**:
   ```solidity
   await flareStateConnector.setValidatorWhitelist(validatorAddress, true);
   ```

2. **Authorize Fintechs**:
   ```solidity
   await flareIntegration.setFintechAuthorization(fintechAddress, true);
   ```

3. **Configure Parameters**:
   ```solidity
   await flareStateConnector.updateAttestationParameters(1800, 43200); // 30min delay, 12h max age
   await flareIntegration.updateFlareConfirmations(3);
   await flareIntegration.updateMaxRequestAge(7 * 24 * 3600); // 7 days
   ```

## Testing

### Run Test Suites

```bash
# Test FlareStateConnector
npx hardhat test test/FlareStateConnector.test.ts

# Test FlareIntegration
npx hardhat test test/FlareIntegration.test.ts

# Run all tests
npx hardhat test
```

### Test Coverage

The test suites cover:
- Contract deployment and initialization
- Data request management
- Attestation submission and verification
- Integration workflow
- Admin functions
- Security features
- Edge cases and error conditions

## Security Considerations

### Access Control
- Owner-only admin functions
- Validator whitelist management
- Fintech authorization controls
- Pausable functionality for emergencies

### Cryptographic Security
- ECDSA signature verification
- Message hash validation
- Chain ID verification
- Timestamp-based security

### Reentrancy Protection
- NonReentrant modifiers on state-changing functions
- Proper state management
- Event emission for transparency

## Integration with Existing Protocol

### Contract Dependencies
- **Identity Contract**: User registration verification
- **ScoreSBT Contract**: SBT minting after credit score computation
- **DataRegistry Contract**: Data source validation

### Data Flow
1. User requests credit score through fintech
2. FlareIntegration initiates request
3. FlareStateConnector verifies data
4. Integration processes verified data
5. Cross-chain message sent to Zama
6. Credit score computed and SBT minted

### Event Integration
- Credit score request events
- Flare attestation events
- Cross-chain message events
- SBT minting events

## Monitoring and Maintenance

### Key Metrics
- Request success rates
- Attestation processing times
- Cross-chain message delivery
- Gas usage optimization

### Maintenance Tasks
- Regular validator whitelist updates
- Parameter optimization
- Security audits
- Performance monitoring

## Troubleshooting

### Common Issues

1. **Attestation Rejection**:
   - Check validator whitelist status
   - Verify signature validity
   - Ensure minimum delay requirements met

2. **Integration Failures**:
   - Verify contract addresses
   - Check fintech authorization
   - Ensure user registration status

3. **Gas Issues**:
   - Optimize batch operations
   - Use appropriate gas limits
   - Monitor network conditions

### Debug Commands

```bash
# Check contract state
npx hardhat console --network <network>

# Verify contract verification
npx hardhat verify --network <network> <contract_address> <constructor_args>
```

## Future Enhancements

### Planned Features
- Multi-validator consensus mechanisms
- Advanced attestation schemes
- Cross-chain bridge integration
- Performance optimization

### Scalability Improvements
- Batch processing capabilities
- Layer 2 integration
- Sharding support
- Parallel processing

## Support

For technical support or questions about the Flare integration:

1. Review the test suites for usage examples
2. Check the contract documentation
3. Review the deployment scripts
4. Consult the main protocol documentation

## License

This integration is part of the Zkredit protocol and follows the same licensing terms.
