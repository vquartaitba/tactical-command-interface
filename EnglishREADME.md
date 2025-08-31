## 🚨 **Problem to Solve**

Millions of people worldwide, especially in emerging economies, lack access to formal financial services because:

* They don’t have sufficient banking history.
* Credit information is fragmented across multiple sources.
* Current systems expose sensitive data, compromising privacy.
* Traditional scoring processes are not transparent or portable.

This generates financial exclusion, limits access to fair loans, and reduces participation in the digital economy.

---

## 💡 **Our Solution (high-level view)**

We are building a **unified system for identity and credit reputation** that combines **blockchain, data oracles, AI, and advanced cryptography** to:

1. **Verify digital identity** in a portable and auditable way.
2. **Collect real financial and consumption data**, cryptographically validated.
3. **Calculate a credit score with AI on encrypted data** (full privacy).
4. **Issue a Soulbound Token (SBT)** representing that score, which the user can use with fintechs, banks, or DeFi protocols.

---

## 🛠️ **The Solution in Detail**

### **1. Digital Identity (Lisk + Filecoin)**

* The user connects their wallet and completes identity verification (KYC).
* Validated data is stored on **Filecoin/IPFS**, generating an immutable CID.
* An **Identity SBT** is minted on Lisk, representing the existence of a verified identity.

📌 This creates a **trustworthy, portable digital identity**, accepted across the ecosystem.

---

### **2. Credit Score Request (Flare)**

* A fintech requests a user’s credit score.
* Flare’s **State Connector** queries multiple external sources (banks, telcos, utilities).
* Flare validators generate a **cryptographic attestation**, ensuring data integrity and authenticity.

📌 Guarantees that the data used for scoring is **real and auditable**, not self-reported.

---

### **3. AI-Powered Scoring with Full Privacy (Zama FHE)**

* Data travels encrypted to the **Zama network**.
* Thanks to **Fully Homomorphic Encryption (FHE)**, an AI model processes the information without decrypting it.
* An encrypted credit score is produced and returned to the ecosystem.

📌 **Absolute privacy**: data is never exposed, not even to the AI model.

---

### **4. Final Score & User Access (Lisk + Filecoin)**

* A **Score SBT** is minted on Lisk with credit score metadata.
* Proofs and records are stored on Filecoin/IPFS, ensuring transparency and auditability.
* The user can use this portable score with fintechs, banks, or DeFi apps.

📌 Builds a **global, censorship-resistant financial reputation layer** that empowers the user.

---

## ⚙️ **Why We Chose These Technologies**

* **Lisk** → Accessible platform for identity and SBTs, focused on usability and dApp adoption. Ideal for representing identity and reputation in non-transferable tokens.
* **Filecoin/IPFS** → Decentralized, immutable, and auditable storage for sensitive data and traceability.
* **Flare** → Robust data oracle with its **State Connector**, ideal for bringing verifiable real-world data on-chain.
* **Zama (FHE)** → Enables computation on encrypted data without decryption → ensures privacy and regulatory compliance.

