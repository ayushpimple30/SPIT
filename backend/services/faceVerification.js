import { ethers } from "ethers";

const FACE_MATCH_THRESHOLD = 70;

/**
 * Verify face similarity score sent by client (client uses face-api.js to compute).
 * PRIVACY: We never receive or store images; only the score and signature.
 * Client signs (address, score, nonce) so we can trust the score without storing it.
 */
export function verifyFaceScore(walletAddress, similarityScore, nonce, signature) {
  if (walletAddress == null || similarityScore == null || nonce == null || !signature) {
    return { verified: false, error: "Missing walletAddress, similarityScore, nonce, or signature" };
  }
  try {
    const message = JSON.stringify({ walletAddress, similarityScore, nonce });
    const recovered = ethers.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
      return { verified: false, error: "Signature mismatch" };
    }
    const score = Number(similarityScore);
    if (Number.isNaN(score) || score < 0 || score > 100) {
      return { verified: false, error: "Invalid score range" };
    }
    const verified = score >= FACE_MATCH_THRESHOLD;
    return { verified, score };
  } catch (e) {
    return { verified: false, error: "Invalid signature" };
  }
}

export { FACE_MATCH_THRESHOLD };
