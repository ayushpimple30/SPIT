import { Router } from "express";
import { requireCaptcha } from "../middleware/captcha.js";
import { recordFailedAttempt, clearFailedAttempts, isBlocked } from "../utils/inMemoryStore.js";
import { verifyWalletSignature, getMessageForSigning } from "../services/walletVerification.js";
import { verifyAadhaarKyc } from "../services/kycService.js";
import { verifyFaceScore } from "../services/faceVerification.js";
import { simulateBiometricVerification } from "../services/biometricSimulation.js";
import { calculateScore } from "../services/scoreCalculator.js";
import {
  setReputationOnChain,
  verifyUserOnChain,
  mintNFTOnChain,
  checkEligibilityOnChain,
} from "../services/contractService.js";
import crypto from "crypto";

const router = Router();

/**
 * POST /verify-wallet
 * Body: { address, message, signature } or { address } to get message to sign
 * PRIVACY: No wallet data stored; used only for this request.
 */
router.post("/verify-wallet", (req, res) => {
  try {
    const { address, message, signature } = req.body || {};
    if (!address) {
      return res.status(400).json({ success: false, error: "Missing address" });
    }
    const blocked = isBlocked(address);
    if (blocked.blocked) {
      return res.status(429).json({
        success: false,
        error: "Too many failed attempts",
        retryAfterMs: blocked.retryAfterMs,
      });
    }
    if (!message || !signature) {
      const nonce = crypto.randomBytes(16).toString("hex");
      const msg = getMessageForSigning(nonce);
      return res.json({ success: true, message: msg, nonce });
    }
    const result = verifyWalletSignature(address, message, signature);
    if (!result.valid) {
      const r = recordFailedAttempt(address);
      return res.status(400).json({ success: false, error: result.error || "Invalid signature", ...r });
    }
    clearFailedAttempts(address);
    return res.json({ success: true, verified: true });
  } catch (e) {
    return res.status(500).json({ success: false, error: "Verification failed" });
  }
});

/**
 * POST /verify-aadhaar
 * Body: { aadhaar, otp?, address? }. KYC verification (mock or external API). Aadhaar is NEVER stored.
 */
router.post("/verify-aadhaar", async (req, res) => {
  try {
    const { aadhaar, otp, address } = req.body || {};
    const key = address || req.ip || "anon";
    const blocked = isBlocked(key);
    if (blocked.blocked) {
      return res.status(429).json({ success: false, error: "Blocked", retryAfterMs: blocked.retryAfterMs });
    }
    if (!aadhaar) {
      return res.status(400).json({ success: false, verified: false, error: "Missing aadhaar" });
    }
    const result = await verifyAadhaarKyc(String(aadhaar).replace(/\s/g, ""), otp);
    if (!result.verified) {
      recordFailedAttempt(key);
      return res.json({ success: true, verified: false, message: result.message });
    }
    clearFailedAttempts(key);
    return res.json({ success: true, verified: true, message: result.message });
  } catch (e) {
    return res.status(500).json({ success: false, verified: false, error: "Verification failed" });
  }
});

/**
 * POST /verify-face
 * Body: { walletAddress, similarityScore, nonce, signature }
 * Client uses face-api.js to compare selfie vs ID image and signs the score. We never receive images.
 */
router.post("/verify-face", (req, res) => {
  try {
    const { walletAddress, similarityScore, nonce, signature } = req.body || {};
    const key = walletAddress || req.ip || "anon";
    const blocked = isBlocked(key);
    if (blocked.blocked) {
      return res.status(429).json({ success: false, error: "Blocked", retryAfterMs: blocked.retryAfterMs });
    }
    const result = verifyFaceScore(walletAddress, similarityScore, nonce, signature);
    if (!result.verified && result.error) {
      recordFailedAttempt(key);
      return res.status(400).json({ success: false, error: result.error });
    }
    clearFailedAttempts(key);
    return res.json({ success: true, verified: result.verified, score: result.score });
  } catch (e) {
    return res.status(500).json({ success: false, error: "Verification failed" });
  }
});

/**
 * POST /verify-biometric
 * Mock: random confidence 70-100; if > 80 verified. No storage.
 */
router.post("/verify-biometric", (req, res) => {
  try {
    const result = simulateBiometricVerification();
    return res.json({ success: true, verified: result.verified, confidence: result.confidence });
  } catch (e) {
    return res.status(500).json({ success: false, error: "Verification failed" });
  }
});

/**
 * POST /calculate-score
 * Body: { walletSignature, aadhaarValid, faceVerified, biometricVerified, captchaSuccess, noExcessiveFailures, address }
 * Optional: if address and eligible, write score and verified to chain (backend signer).
 */
router.post("/calculate-score", requireCaptcha, async (req, res) => {
  try {
    const {
      walletSignature,
      aadhaarValid,
      faceVerified,
      biometricVerified,
      address,
    } = req.body || {};
    const checks = {
      walletSignature: !!walletSignature,
      aadhaarValid: !!aadhaarValid,
      faceVerified: !!faceVerified,
      biometricVerified: !!biometricVerified,
      captchaSuccess: true,
      noExcessiveFailures: !isBlocked(address || req.ip).blocked,
    };
    const { score, eligible } = calculateScore(checks);
    const payload = { success: true, score, eligible };
    if (address && eligible) {
      const setRep = await setReputationOnChain(address, score);
      if (setRep.success) await verifyUserOnChain(address);
      payload.onChain = setRep.success;
    }
    return res.json(payload);
  } catch (e) {
    return res.status(500).json({ success: false, error: "Failed to calculate score" });
  }
});

/**
 * POST /mint-nft
 * Body: { address, recaptchaToken }
 * Only if user is eligible (score >= 75). Backend mints time-bound NFT on contract.
 */
router.post("/mint-nft", requireCaptcha, async (req, res) => {
  try {
    const { address } = req.body || {};
    if (!address) {
      return res.status(400).json({ success: false, error: "Missing address" });
    }
    const eligible = await checkEligibilityOnChain(address);
    if (!eligible) {
      return res.status(400).json({ success: false, error: "Not eligible" });
    }
    const result = await mintNFTOnChain(address);
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }
    return res.json({ success: true, message: "NFT minted" });
  } catch (e) {
    return res.status(500).json({ success: false, error: "Mint failed" });
  }
});

export default router;
