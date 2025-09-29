# 🛡️ GenProof

**Privacy-Preserving Credential Verification on Algorand using State Proofs + PyTEAL**

GenProof enables users to prove identity attributes—such as age, citizenship, or qualification—**without revealing sensitive personal information**. Built on **Algorand**, GenProof leverages **State Proofs** and **TEAL logic (via PyTEAL)** to provide a lightweight, verifiable, and reusable credential attestation system.

---

## ► Problem

Traditional identity verification systems require users to reveal more information than necessary. Whether proving eligibility for a financial service or accessing an age-restricted platform, users are forced to disclose full identity documents—creating risks of data leaks, centralization, and non-compliance with privacy regulations.

**Users should be able to prove facts, not reveal documents.**

---

## ► Solution: GenProof

GenProof provides a minimal disclosure verification protocol on Algorand:

- A credential is verified **off-chain** by a trusted issuer.
- The issuer signs an attestation (e.g., `"Age >= 18"`, `"Citizenship = IN"`).
- A **hashed commitment** is stored on Algorand using a **PyTEAL-based smart contract**.
- Applications can **verify eligibility using TEAL logic** without accessing raw credentials.

This enables trustless verification while preserving full privacy.

---

## ► How It Works

| Step | Process | On-Chain Interaction |
|------|---------|---------------------|
| 1. Off-Chain Verification | A user verifies credentials with an issuer | No |
| 2. Credential Attestation | Issuer signs a structured claim (JSON → hash) | No |
| 3. On-Chain Commitment | Hashed claim is stored in GenProof Smart Contract | Yes |
| 4. Verification by Apps | dApps read attestation validity using TEAL logic | Yes |

---

## ► Features

| Feature | Description |
|---------|-------------|
| State-Proof-Based Attestations | Credential commitments stored via PyTEAL smart contract |
| Selective Disclosure | Only proof-of-fact is revealed, never raw data |
| Reusable Credentials | Once verified, reuse across multiple platforms |
| Wallet Support | Pera Wallet + WalletConnect |
| Gas Efficient | Optimized for Algorand’s low-cost transactions |

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd GenProof

# Install dependencies
pip install pyteal
npm install

# Compile PyTEAL contracts
python contracts/compile.py

# Deploy to Algorand TestNet
bash scripts/deploy.sh

# Start the frontend
npm run dev

```
📋 Prerequisites
Python 3.8+

pip (Python package manager)

Node.js

Algorand TestNet account

Pera Wallet / WalletConnect

🏗️ Project Structure
```bash
Copy code
GenProof/
├── contracts/             # PyTEAL smart contracts
│   ├── Attestation.py     # Handles credential commitments
│   └── Approval.teal      # Compiled TEAL logic
├── frontend/              # Web interface
│   ├── src/
│   └── package.json
├── scripts/               # Deployment utilities
└── README.md              # Documentation
```
🔧 Smart Contract Logic (PyTEAL Overview)
Store attestation hash mapped to user wallet address

Allow issuers to submit commitments

Allow verifying dApps to query credential validity

Optional revocation & expiry support

🧪 Testing
bash
Copy code
# Compile contracts
python contracts/compile.py

# Run PyTEAL tests
pytest tests/
🌐 Algorand TestNet Configuration
Parameter	Value
Network	TestNet
Explorer	https://testnet.algoexplorer.io
Dispenser	https://bank.testnet.algorand.network

🔒 Security Features
No raw credential storage

Issuer-controlled attestation

Immutable audit trail

TEAL-based trustless verification

📚 Documentation
https://developer.algorand.org/

https://pyteal.readthedocs.io

https://developer.algorand.org/articles/state-proofs/

🤝 Contributing
Fork the repository

Create a feature branch

Commit changes with tests

Submit a pull request
