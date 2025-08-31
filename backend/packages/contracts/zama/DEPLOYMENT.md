# 🚀 Zama Contract Deployment Guide

## Prerequisites

### 1. Get Zama Testnet Access
- Visit [Zama Documentation](https://docs.zama.ai/fhevm/getting-started/testnet)
- Get testnet RPC URL and network details
- Request testnet ZAMA tokens for gas fees

### 2. Wallet Setup
- Create or use an existing Ethereum-compatible wallet
- Export your private key securely (NEVER share this)
- Fund your wallet with testnet ZAMA tokens

### 3. Environment Setup
Create a `.env` file in this directory:

```bash
# Sepolia Testnet (RECOMMENDED for real FHE testing)
SEPOLIA_RPC_URL=https://rpc.sepolia.org
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Alternative: Zama Testnet (mock encryption)
ZAMA_TESTNET_RPC_URL=https://devnet.zama.ai
```

## Deployment Steps

### Step 1: Install Dependencies
```bash
cd backend/packages/contracts/zama
npm install
```

### Step 2: Compile Contracts
```bash
npm run build
```

### Step 3: Run Tests (Optional but Recommended)
```bash
npm test
```

### Step 4: Deploy to Testnet

#### 🚀 **RECOMMENDED: Deploy to Sepolia (Real FHE Encryption)**
```bash
# Build for Sepolia (real FHE encryption)
npm run build:sepolia

# Deploy to Sepolia with real FHE encryption
npm run deploy:sepolia

# Verify deployment on Sepolia
CONTRACT_ADDRESS=0xYOUR_DEPLOYED_ADDRESS npm run verify:sepolia
```

#### 🧪 **Alternative: Deploy to Zama Testnet (Mock Encryption)**
```bash
# Deploy to Zama testnet
npm run deploy:testnet

# Or deploy to Zama mainnet (when ready)
npm run deploy
```

## Expected Output

```
🚀 Starting Zama CreditScoreModel deployment...
📋 Deploying contracts with account: 0x1234...
💰 Account balance: 1000000000000000000
🔨 Deploying CreditScoreModel...
✅ CreditScoreModel deployed successfully!
📍 Contract address: 0x5678...
🔗 Network: zamaTestnet
⛓️  Chain ID: 8008
👤 Contract owner: 0x1234...
📊 Base credit score: 350
🎉 Deployment verification successful!

📋 Deployment Summary:
{
  "network": "zamaTestnet",
  "chainId": 8008,
  "contractAddress": "0x5678...",
  "deployer": "0x1234...",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "blockNumber": 12345
}
💾 Deployment info saved to: ./deployments/zamaTestnet-1704110400000.json
```

## Post-Deployment Verification

### 1. Check Contract on Zama Explorer
- Visit the Zama testnet explorer
- Search for your contract address
- Verify the deployment transaction

### 2. Test Contract Functions
```bash
# Connect to deployed contract (example)
npx hardhat console --network zamaTestnet

const CreditScoreModel = await ethers.getContractFactory("CreditScoreModel");
const contract = CreditScoreModel.attach("YOUR_DEPLOYED_ADDRESS");

// Test basic functions
await contract.owner();
await contract.baseCreditScore();
```

### 3. Verify FHE Functionality
```javascript
// Test with encrypted data (when FHE is active on testnet)
const encryptedData = ethers.utils.randomBytes(64);
await contract.computeCreditScore(encryptedData);
```

## Troubleshooting

### Common Issues:

**1. Insufficient Funds**
```
Error: insufficient funds for gas
```
- Get testnet ZAMA tokens from Zama faucet
- Check your wallet balance

**2. Invalid RPC URL**
```
Error: could not detect network
```
- Verify ZAMA_TESTNET_RPC_URL in .env
- Check if testnet is operational

**3. Private Key Issues**
```
Error: invalid private key
```
- Ensure PRIVATE_KEY starts with `0x`
- Verify the private key format

**4. Network Connection**
```
Error: connection refused
```
- Check internet connection
- Verify testnet is online
- Try different RPC endpoint

### Gas Estimation Issues:
```bash
# For debugging gas issues
npx hardhat run scripts/deploy.ts --network zamaTestnet --verbose
```

## Security Best Practices

### 🔐 Private Key Management
- **NEVER** commit `.env` file to git
- Use environment variables in production
- Consider using hardware wallets for mainnet

### 🔒 Contract Security
- Verify all tests pass before deployment
- Consider professional smart contract audit
- Test thoroughly on testnet before mainnet

### 📊 Monitoring
- Monitor contract events after deployment
- Set up alerts for unusual activity
- Keep track of gas usage patterns

## Network Information

### Sepolia Testnet (RECOMMENDED)
- **Chain ID**: 11155111
- **RPC URL**: https://rpc.sepolia.org
- **Explorer**: https://sepolia.etherscan.io
- **Faucet**: https://sepoliafaucet.com
- **FHE Support**: ✅ Real FHE encryption
- **Cost**: ~0.01-0.05 ETH per deployment
- **Speed**: Slower due to real encryption

### Zama Testnet
- **Chain ID**: 8008
- **RPC URL**: https://devnet.zama.ai
- **Explorer**: https://explorer.zama.ai (when available)
- **Faucet**: Request tokens from Zama team
- **FHE Support**: 🧪 Mock encryption only
- **Cost**: Free (testnet tokens)
- **Speed**: Fast (mock encryption)

### Zama Mainnet (Future)
- **Chain ID**: 8009
- **RPC URL**: https://mainnet.zama.ai
- **Explorer**: https://explorer.zama.ai
- **FHE Support**: ✅ Real FHE encryption
- **Cost**: ZAMA tokens required

## Next Steps After Deployment

1. **Update Frontend**: Point your frontend to the deployed contract
2. **Cross-Chain Setup**: Configure communication with Lisk contracts
3. **User Testing**: Test the full user flow with real encrypted data
4. **Performance Monitoring**: Monitor gas costs and execution times
5. **Upgrade Planning**: Plan for contract upgrades if needed

## Support

- 📚 [Zama Documentation](https://docs.zama.ai/)
- 💬 [Zama Discord](https://discord.gg/zama)
- 🐛 [GitHub Issues](https://github.com/zama-ai/fhevm/issues)

---

🎉 **Congratulations!** Your FHE credit scoring contract is now live on Zama testnet!
