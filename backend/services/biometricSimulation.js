/**
 * Mock biometric verification (real APIs are paid).
 * PRIVACY: No storage. Generate random confidence 70-100; if > 80 mark verified.
 */
const MIN_CONFIDENCE = 70;
const MAX_CONFIDENCE = 100;
const VERIFIED_THRESHOLD = 80;

export function simulateBiometricVerification() {
  const confidence = Math.floor(Math.random() * (MAX_CONFIDENCE - MIN_CONFIDENCE + 1)) + MIN_CONFIDENCE;
  const verified = confidence >= VERIFIED_THRESHOLD;
  return { verified, confidence };
}
