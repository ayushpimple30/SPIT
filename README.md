# Privacy-Preserving Decentralized Identity Verification

Strict rules: **no personal data stored**, **no database**, **no Aadhaar/face/biometric/IP storage**. Verification is temporary in memory only; only final **reputation score** and **verification status** are written to the blockchain (Sepolia).

## Folder Structure

```
.
├── contracts/
│   └── ReputationRegistry.sol    # On-chain: score, isVerified, nftExpiry only (deploy via Remix)
├── backend/                      # Stateless Node.js + Express
│   ├── .env                      # Copy from .env.example (never commit)
│   ├── .env.example
│   ├── package.json
│   ├── server.js
│   ├── middleware/
│   │   ├── rateLimiter.js        # Rate limit (no PII logged)
│   │   └── captcha.js            # Google reCAPTCHA verification
│   ├── routes/
│   │   └── verify.js             # All verification endpoints
│   ├── services/
│   │   ├── walletVerification.js # ethers.js signature verify
│   │   ├── aadhaarValidation.js  # Regex only; number never stored
│   │   ├── faceVerification.js   # Verify signed score from client
│   │   ├── biometricSimulation.js# Mock 70–100 score
│   │   ├── scoreCalculator.js    # Reputation model
│   │   └── contractService.js    # ethers.js contract writes
│   └── utils/
│       └── inMemoryStore.js      # Failed attempts Map; 10 min block
├── frontend/
│   ├── index.html                # UI: MetaMask, Aadhaar, face, reCAPTCHA
│   └── app.js                    # face-api.js (client-side), API calls
└── README.md
```

## Tech Stack

- **Solidity + OpenZeppelin** (ReputationRegistry) — compile & deploy via **Remix IDE**
- **Node.js + Express** (stateless backend)
- **ethers.js** (signature verification + contract calls)
- **MetaMask** (connect + sign)
- **face-api.js** (open source, client-side face comparison)
- **Google reCAPTCHA** (free tier)
- **Sepolia** testnet

## Features (Privacy Rules)

| Feature | Rule | Implementation |
|--------|------|----------------|
| Wallet | No wallet data stored | Verify signature with ethers; use only in request |
| Aadhaar | Do not store number | Regex validate 12 digits; discard immediately |
| Face | Do not store images | face-api.js in browser; only signed similarity score sent |
| Captcha | Block if fail | reCAPTCHA server-side verify |
| Failed attempts | In memory only | Map with 10 min block after 5 failures |
| Biometric | Mock (no paid API) | Random 70–100; if > 80 verified |

## Reputation Score (in memory, then on-chain)

- +20 Wallet signature valid  
- +15 Aadhaar format valid  
- +25 Face verified  
- +20 Biometric verified  
- +10 Captcha success  
- +10 No excessive failed attempts  

**Eligible** if score ≥ 75. Only then: `setReputation` and `verifyUser` on contract.

## Blockchain (ReputationRegistry)

- `setReputation(user, score)` – backend signer only  
- `verifyUser(user)` – backend signer only  
- `mintTimeBoundNFT(user)` – 30-day expiry; revert if already active  
- `checkEligibility(user)` – view  

No Hardhat — contract is deployed only via **Remix IDE**. The backend uses the contract address from Remix in `backend/.env`.

## Run Locally

### 1. Deploy contract in Remix IDE and set `.env`

1. Open **[Remix IDE](https://remix.ethereum.org)**.
2. **OpenZeppelin:** Plugin Manager → enable **“OpenZeppelin Contracts”** (or NPM and add `@openzeppelin/contracts`) so Remix can resolve the contract import.
3. **Contract:** Create `ReputationRegistry.sol` and paste the contents of `contracts/ReputationRegistry.sol`.
4. **Compile:** Compiler **0.8.20** → Compile.
5. **Deploy:** Deploy & run → **Injected Provider - MetaMask** → network **Sepolia** → Deploy (wallet needs Sepolia test ETH, e.g. [sepoliafaucet.com](https://sepoliafaucet.com)).
6. **Copy the deployed contract address** from Remix and put it in `backend/.env`:
   - `BACKEND_CONTRACT_ADDRESS=` that address (no spaces).
   - `PRIVATE_KEY=` the **same** deployer wallet’s private key (backend must be the contract owner).
   - `SEPOLIA_RPC_URL=` e.g. `https://rpc.sepolia.org` (or your RPC URL).

### 2. Backend

```bash
cd backend
npm install
npm start
```

Server runs at `http://localhost:3000`. No database; no file storage.

### 3. Frontend

- Get a **reCAPTCHA v2 site key** and replace in `frontend/index.html`:

  ```html
  <div class="g-recaptcha" data-sitekey="YOUR_ACTUAL_SITE_KEY"></div>
  ```

- Serve the frontend (any static server). From project root:

  ```bash
  npx serve frontend -p 5500
  ```

- Open `http://localhost:5500`. Connect MetaMask (Sepolia), complete steps 1–6, then “Calculate score & write to chain” and “Mint time-bound NFT”.

## Backend Endpoints

| Method | Path | Body | Notes |
|--------|------|------|--------|
| POST | `/verify-wallet` | `{ address }` or `{ address, message, signature }` | Returns message to sign if no signature |
| POST | `/verify-aadhaar` | `{ aadhaar }` | Format only; not stored |
| POST | `/verify-face` | `{ walletAddress, similarityScore, nonce, signature }` | Client signs score from face-api.js |
| POST | `/verify-biometric` | `{}` | Simulated; no storage |
| POST | `/calculate-score` | All flags + `recaptchaToken` + `address` | Writes to chain if eligible |
| POST | `/mint-nft` | `{ address, recaptchaToken }` | Requires eligible on-chain |

## Security

- Rate limiter middleware (express-rate-limit).  
- `dotenv` for `PRIVATE_KEY` and secrets; no hardcoded secrets.  
- Input validation on all endpoints.  
- No logging of Aadhaar, images, or raw biometric data.  
- File buffers (if any) cleared after use; face comparison is client-side so server never receives images.

## CORS

To allow the frontend origin:

```env
CORS_ORIGIN=http://localhost:5500
```
