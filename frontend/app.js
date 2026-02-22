(function () {
  "use strict";

  /* ================= CONFIG ================= */
  const API_BASE = "http://localhost:3000";

  let walletAddress = null;

  const verificationStatus = {
    wallet: false,
    aadhaar: false,
    government: false, // DigiLocker
    otp: false,
    recaptcha: false
  };

  /* ================= HELPERS ================= */
  const $ = (id) => document.getElementById(id);

  function setStatus(id, text, ok = true) {
    const el = $(id);
    if (!el) return;
    el.textContent = text;
    el.className = "status " + (ok ? "ok" : "err");
  }

  function setListStatus(id, text, ok = true) {
    const li = $(id);
    if (!li) return;
    li.querySelector(".st-text").textContent = text;
    li.className = ok ? "done" : "fail";
  }

  /* ================= WALLET ================= */
  $("btnConnect").addEventListener("click", async () => {
    if (!window.ethereum) {
      setStatus("walletStatus", "MetaMask not installed", false);
      return;
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts"
    });

    walletAddress = accounts[0];
    $("walletStatus").textContent = "Wallet connected";
    setListStatus("stWallet", "Connected");
    verificationStatus.wallet = true;
  });

  /* ================= AADHAAR (VERHOEFF) ================= */
  const d = [[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]];
  const p = [[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]];

  function isValidAadhaar(a) {
    if (!/^\d{12}$/.test(a)) return false;
    let c = 0;
    a.split("").reverse().map(Number).forEach((n, i) => {
      c = d[c][p[i % 8][n]];
    });
    return c === 0;
  }

  $("btnAadhaar").addEventListener("click", () => {
    const a = $("aadhaarInput").value.trim();

    if (!isValidAadhaar(a)) {
      setStatus("aadhaarStatus", "Invalid Aadhaar checksum", false);
      setListStatus("stAadhaar", "Invalid", false);
      verificationStatus.aadhaar = false;
      return;
    }

    setStatus("aadhaarStatus", "Aadhaar verified");
    setListStatus("stAadhaar", "Valid");
    verificationStatus.aadhaar = true;
  });

  /* ================= DIGILOCKER ================= */
  $("btnDigiLocker").addEventListener("click", () => {
    if (!verificationStatus.wallet) {
      setStatus("govStatus", "Connect wallet first", false);
      return;
    }

    setStatus("govStatus", "Redirecting to DigiLocker...");
    window.open(API_BASE + "/digilocker/auth", "_blank");

    // Sandbox success simulation
    setTimeout(async () => {
      try {
        const res = await fetch(API_BASE + "/verify-digilocker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: walletAddress })
        });

        const data = await res.json();

        if (!data.verified) {
          setStatus("govStatus", "DigiLocker verification failed", false);
          setListStatus("stGov", "Failed", false);
          return;
        }

        verificationStatus.government = true;
        setStatus("govStatus", "Government proof verified");
        setListStatus("stGov", "Verified");
      } catch {
        setStatus("govStatus", "DigiLocker error", false);
      }
    }, 2000);
  });

  /* ================= PHONE & EMAIL OTP ================= */
  const phoneRegex = /^[6-9]\d{9}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  $("sendPhoneOtp").addEventListener("click", () => {
    if (!phoneRegex.test($("phone").value)) {
      setStatus("otpStatus", "Invalid Indian phone number", false);
      return;
    }
    alert("Phone OTP: 123456");
  });

  $("sendEmailOtp").addEventListener("click", () => {
    if (!emailRegex.test($("email").value)) {
      setStatus("otpStatus", "Invalid email address", false);
      return;
    }
    alert("Email OTP: 654321");
  });

  function verifyOtp() {
    if (
      $("phoneOtp").value === "123456" &&
      $("emailOtp").value === "654321"
    ) {
      verificationStatus.otp = true;
      setStatus("otpStatus", "Phone & Email verified");
      setListStatus("stOtp", "Verified");
    }
  }

  $("phoneOtp").addEventListener("input", verifyOtp);
  $("emailOtp").addEventListener("input", verifyOtp);

  /* ================= reCAPTCHA CALLBACK ================= */
  window.onCaptchaSuccess = function () {
    verificationStatus.recaptcha = true;
    setListStatus("stCaptcha", "Verified");
  };

  /* ================= SCORE ================= */
  $("btnCalculate").addEventListener("click", async () => {
    if (!Object.values(verificationStatus).every(Boolean)) {
      setStatus("scoreStatus", "Complete all verifications first", false);
      return;
    }

    const res = await fetch(API_BASE + "/calculate-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recaptchaToken: grecaptcha.getResponse() })
    });

    const data = await res.json();
    $("scoreValue").textContent = data.score;
    setStatus("scoreStatus", "Score calculated");
  });

})();