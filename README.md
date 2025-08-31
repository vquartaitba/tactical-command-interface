# ZKredit 

This project introduces a decentralized platform for generating a reliable, portable, and private credit score, designed for the financial inclusion of individuals without access to traditional systems.

Through a multi-chain architecture, we leverage the power of artificial intelligence and advanced cryptography to create a sovereign digital identity and a score that the user controls at all times.

Our Website: https://tactical-command-interface-rzif.vercel.app/

## 🎯 The Problem: The Credit Access Gap

Millions of people worldwide lack access to fair financial services because they do not have a formal credit history. This financial "invisibility" prevents them from obtaining loans, insurance, or even renting a home, creating a significant barrier to their economic and personal development.

Current systems are centralized, opaque, and not adapted to the new digital and on-chain economy, leaving out a large portion of the global population.

## 💡 Our Solution: A Sovereign Credit Score

Our platform solves this problem through a decentralized workflow that guarantees the security, privacy, and portability of user data.

The solution is structured around three fundamental pillars:

- **Verified Digital Identity:** The user creates a sovereign digital identity anchored on the blockchain. Verification data (KYC) is stored immutably on Filecoin/IPFS, and a Soulbound Token (SBT) is issued on Lisk as non-transferable proof of identity. This creates a foundation of trust for financial institutions.

- **Real-World Data:** Through the Flare State Connector, the platform securely queries APIs from authorized sources (banks, telcos, services) to obtain the necessary data for analysis. This ensures the score is based on verifiable information, not self-declared data.

- **Private AI Calculation:** Here lies the main innovation. The collected data is sent to the Zama network (fhEVM), where a Machine Learning model calculates the score. Thanks to Fully Homomorphic Encryption (FHE), the entire process is performed on encrypted data. Neither the AI nor any intermediary ever sees the user's sensitive information.

Finally, the encrypted result is anchored on IPFS, and an NFT credential is issued on Lisk. This NFT acts as a credit "passport" and it can be presented to any protocol or company, but maintaining full control over who accesses their information.

## 🛠️ Applied Technologies and Their Benefits

| Technology       | Role in the Project                                                                 | Key Benefit                                                                                          |
|------------------|--------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| **Lisk**         | Identity and Portability: Issuance of the identity SBT and the NFT containing the score. | Low costs, high speed, and EVM compatibility. Enables portability and user-managed credentials.      |
| **Filecoin / IPFS** | Decentralized Storage: Stores verified metadata and the encrypted score result.     | Immutability and censorship resistance. Ensures verified data cannot be altered and remains available.|
| **Zama (fhEVM)** | Score Calculation with Absolute Privacy: Execution of the AI model on encrypted data. | Total privacy via FHE. Complex computations without exposing sensitive information.                  |
| **Flare**        | Off-Chain Data Oracle: Securely connects the blockchain with real-world APIs.         | Reliability and verifiability. Scores are based on real, trusted data.                               |
| **Machine Learning** | Precision and Robustness: Models (LightGBM, Logistic Regression) compute the score. | Financial-grade quality using industry-proven techniques.                                             |
| **Vercel**       | Frontend and User Experience: Web app deployment for onboarding.                      | High performance and global scalability with a modern, accessible UI.                                 |

## 📜 Deployed Contracts

Below are the addresses of the smart contracts deployed on their respective testnets.

| Component / Role           | Network (Chain)                | Contract Address                                   |
|---------------------------:|--------------------------------|----------------------------------------------------|
| Score Calculation (AI)     | Zama / fhEVM (**ZEMA**)        | `0x59A3b5AfB6bACdbEc53bc1aB13af08e20db2748c`       |
| CID Registry (Link to IPFS)| Filecoin EVM (**Calibration**) | `0x749777126B405832d92520Ec94D22B9685595027`       |
| Score SBT / NFT Credential | Lisk EVM (**Sepolia**)         | `0x686BABbCa7924470f8c4343C6b4b702a0e0Bb5eb`       |

## 🔗 Links to Block Explorers (Testnets)

- ZEMA (Zama Testnet)
  https://explorer.testnet.zama.cloud/address/0x59A3b5AfB6bACdbEc53bc1aB13af08e20db2748c

- CID Registry (Filecoin Calibration)
  https://filecoin-testnet.blockscout.com/address/0x749777126B405832d92520Ec94D22B9685595027

- Score SBT / NFT (Lisk Sepolia)
  https://sepolia-blockscout.lisk.com/address/0x686BABbCa7924470f8c4343C6b4b702a0e0Bb5eb


