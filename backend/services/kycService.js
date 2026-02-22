/**
 * KYC verification: Aadhaar and related checks.
 * PRIVACY: We never store Aadhaar number, OTP, or any PII. Use in request only, then discard.
 *
 * - Mock mode (default): format + simulated verification for development.
 * - API mode: set AADHAAR_KYC_API_URL + AADHAAR_KYC_API_KEY to call external KYC provider (e.g. UIDAI-authorized).
 */

import { validateAadhaarFormat } from "./aadhaarValidation.js";
import axios from "axios";

/**
 * Verify Aadhaar: format first, then mock or external API. Number is never stored.
 * @param {string} aadhaar - 12-digit string (discarded after use)
 * @param {string} [otp] - Optional OTP for mock (e.g. "000000" for success in demo)
 * @returns {{ verified: boolean, message?: string }}
 */
export async function verifyAadhaarKyc(aadhaar, otp) {
  const formatResult = validateAadhaarFormat(aadhaar);
  if (!formatResult.valid) {
    return { verified: false, message: "Invalid Aadhaar format (12 digits required)" };
  }

  const apiUrl = process.env.AADHAAR_KYC_API_URL?.trim();
  const apiKey = process.env.AADHAAR_KYC_API_KEY?.trim();

  if (apiUrl && apiKey) {
    try {
      const result = await callAadhaarKycApi(apiUrl, apiKey, aadhaar, otp);
      return result;
    } catch (e) {
      return { verified: false, message: "KYC service unavailable" };
    }
  }

  // Mock KYC: accept any valid format; optional OTP "000000" for stricter demo
  const mockOtp = process.env.MOCK_AADHAAR_OTP || "000000";
  if (otp !== undefined && otp !== null && String(otp).trim() !== "" && String(otp).trim() !== mockOtp) {
    return { verified: false, message: "Invalid OTP" };
  }
  return { verified: true, message: "Verified (mock KYC)" };
}

/**
 * Call external Aadhaar KYC API. Replace with your provider's contract (e.g. OTP verify, eSign).
 * PRIVACY: Do not log aadhaar or OTP. Discard after request.
 */
async function callAadhaarKycApi(apiUrl, apiKey, aadhaar, otp) {
  const response = await axios.post(
    apiUrl,
    {
      id_number: aadhaar,
      otp: otp || "",
    },
    {
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      timeout: 15000,
      validateStatus: () => true,
    }
  );

  if (response.status >= 200 && response.status < 300) {
    const data = response.data || {};
    const verified = data.verified === true || data.status === "verified";
    return { verified, message: data.message || (verified ? "Verified" : "Verification failed") };
  }
  return { verified: false, message: "KYC provider error" };
}

/**
 * Validate Aadhaar format only (no API). For use when only format check is needed.
 */
export function validateAadhaar(aadhaar) {
  return validateAadhaarFormat(aadhaar);
}
