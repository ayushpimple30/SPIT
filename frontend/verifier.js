/* =========================================================
   VERIFIED WALLET LOGIN – verifier.js
   Backend-free • On-chain • QR-ready
========================================================= */

"use strict";

/* =========================================================
   CONFIG
========================================================= */

const CONTRACT_ADDRESS = "0x60312e89Ac44eC082640Abc42622e0Af08C479F9"; // your deployed contract

const CONTRACT_ABI = [
  "function isVerified(address user) view returns (bool)"
];

let provider;
let signer;
let userAddress;
let contract;

/* =========================================================
   HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

function setLoginStatus(text, ok = true) {
  const el = $("loginStatus");
  if (!el) return;
  el.textContent = text;
  el.className = ok ? "ok" : "err";
}

/* =========================================================
   WALLET LOGIN (PRIMARY)
========================================================= */

async function loginWithWallet() {
  try {
    if (!window.ethereum) {
      setLoginStatus("MetaMask not detected", false);
      return;
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    userAddress = await signer.getAddress();

    contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      provider
    );

    setLoginStatus("Checking on-chain verification…");

    const verified = await contract.isVerified(userAddress);

    if (!verified) {
      setLoginStatus("Wallet not verified on blockchain", false);
      return;
    }

    // ✅ LOGIN SUCCESS
    setLoginStatus("Login successful ✔ Wallet verified");

    // Example redirect
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1200);

  } catch (err) {
    console.error(err);
    setLoginStatus("Login failed", false);
  }
}

/* =========================================================
   QR-BASED LOGIN (DEMO FLOW)
========================================================= */

function generateQRLogin() {
  const payload = {
    type: "wallet-login",
    contract: CONTRACT_ADDRESS,
    ts: Date.now()
  };

  const qrData = JSON.stringify(payload);

  // Simple demo QR (text-based)
  $("qrBox").innerHTML = `
    <div class="qr-demo">
      <p>Scan with wallet-enabled browser</p>
      <code>${qrData}</code>
    </div>
  `;
}

/* =========================================================
   EVENTS
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  $("btnWalletLogin")?.addEventListener("click", loginWithWallet);
  generateQRLogin();
});