/**
 * Reputation score model. All inputs are from current request only; nothing stored.
 */
const WEIGHTS = {
  walletSignature: 20,
  aadhaarValid: 15,
  faceVerified: 25,
  biometricVerified: 20,
  captchaSuccess: 10,
  noExcessiveFailures: 10,
};
const ELIGIBILITY_THRESHOLD = 75;

export function calculateScore(checks) {
  let score = 0;
  if (checks.walletSignature) score += WEIGHTS.walletSignature;
  if (checks.aadhaarValid) score += WEIGHTS.aadhaarValid;
  if (checks.faceVerified) score += WEIGHTS.faceVerified;
  if (checks.biometricVerified) score += WEIGHTS.biometricVerified;
  if (checks.captchaSuccess) score += WEIGHTS.captchaSuccess;
  if (checks.noExcessiveFailures) score += WEIGHTS.noExcessiveFailures;

  const eligible = score >= ELIGIBILITY_THRESHOLD;
  return { score, eligible, threshold: ELIGIBILITY_THRESHOLD };
}

export { ELIGIBILITY_THRESHOLD, WEIGHTS };
