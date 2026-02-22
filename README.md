This project introduces a Decentralized Identity Verification Protocol where:

Identity is verified once

Only a cryptographic hash is stored on-chain

No raw Aadhaar / documents / PII are stored

Users authenticate using their wallet

Verification is time-bound and revocable

🏗️ Architecture Overview
User
 │
 │  Wallet Connect (MetaMask)
 │
 ▼
Frontend Verification UI
 ├─ Aadhaar Check (Checksum)
 ├─ Government Proof (DigiLocker Sandbox)
 ├─ Phone + Email Validation
 ├─ reCAPTCHA Protection
 │
 ▼
Identity Hash (SHA-256)
 │
 ▼
Smart Contract (IdentityRegistry)
 ├─ storeIdentityHash()
 ├─ isVerified()
 └─ Validity Period
 │
 ▼
QR / Wallet-based Login (No Re-KYC)
🔐 Core Features
✅ Wallet-Based Identity

MetaMask wallet as primary identity

No username/passwords

✅ Aadhaar Validation

UIDAI Verhoeff checksum validation

No Aadhaar storage

✅ Government Proof (DigiLocker – Sandbox)

Simulated DigiLocker verification

Age verification (18+)

Government-issued document proof

✅ Privacy-Preserving Blockchain Storage

Stores hash only, not raw data

Time-bound validity (30 days)

✅ Reputation Score Engine

5 verification modules

Each module = 20 points

Score out of 100

Eligibility threshold ≥ 75

✅ NFT-Based Proof of Verification

Time-bound NFT minting

Can be used across platforms

✅ QR-Based Wallet Login

Login anywhere using verified wallet

No re-authentication needed

🧠 Smart Contract

Contract: IdentityRegistry.sol

Key Functions:
storeIdentityHash(bytes32 hash)
isVerified(address user)
getIdentityHash(address user)
Guarantees:

Immutable verification proof

Time-limited validity

Zero PII exposure

🛠️ Tech Stack
Layer	Technology
Frontend	HTML, CSS, JavaScript
Wallet	MetaMask
Blockchain	Ethereum (Sepolia Testnet)
Smart Contract	Solidity
Crypto	SHA-256
Verification	DigiLocker (Sandbox)
UI/UX	Hackathon-grade dark Web3 UI
🧪 How It Works (Flow)

Connect MetaMask wallet

Verify Aadhaar (checksum)

Verify government proof via DigiLocker

Verify phone & email

Complete reCAPTCHA

Generate reputation score

Store identity hash on blockchain

Mint verification NFT

Login anywhere using wallet / QR

🚀 How to Run Locally
git clone https://github.com/ayushpimple30/SPIT.git
cd SPIT

Open index.html directly in browser
Ensure MetaMask is installed and connected to Sepolia testnet.

🔒 Privacy & Security

❌ No Aadhaar stored

❌ No documents stored

❌ No biometrics stored

✅ Only cryptographic hashes

✅ User-controlled identity

✅ Zero-trust compliant

🎯 Use Cases

Web3 onboarding

DAO membership

Hackathon identity

NFT-gated access

One-click login for dApps

Government-grade digital identity

🏆 Hackathon Value

✔ Blockchain-native
✔ Privacy-first
✔ Scalable
✔ Real-world relevance
✔ Clean UX
✔ Clear problem → solution

👨‍💻 Author

Ayush Pimple
Blockchain • Web3 • Identity Systems

GitHub: https://github.com/ayushpimple30

📜 License

MIT License
