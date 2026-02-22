import { ethers } from "ethers";

/**
 * Verify that a message was signed by the given address.
 * PRIVACY: We never store wallet address or message; used only for this request.
 */
export function verifyWalletSignature(address, message, signature) {
  if (!address || !message || !signature) {
    return { valid: false, error: "Missing address, message, or signature" };
  }
  try {
    const recovered = ethers.verifyMessage(message, signature);
    const valid = recovered.toLowerCase() === address.toLowerCase();
    return { valid };
  } catch (e) {
    return { valid: false, error: "Invalid signature" };
  }
}

/**
 * Generate a nonce message for the user to sign (temporary, not stored).
 */
export function getMessageForSigning(nonce) {
  return `Identity verification nonce: ${nonce}`;
}
