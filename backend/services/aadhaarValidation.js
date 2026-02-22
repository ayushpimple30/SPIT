/**
 * Aadhaar format validation only. Number is NEVER stored or logged.
 * We validate in memory and return a boolean; the number is discarded.
 */
const AADHAAR_REGEX = /^\d{12}$/;

export function validateAadhaarFormat(digits) {
  if (typeof digits !== "string") return { valid: false };
  const trimmed = String(digits).replace(/\s/g, "");
  const valid = AADHAAR_REGEX.test(trimmed);
  // Do not log or store trimmed; return immediately.
  return { valid };
}
