import axios from "axios";

/**
 * Verify Google reCAPTCHA (free tier). No storage of user responses.
 */
export async function verifyRecaptcha(token) {
  if (!token) return { success: false, error: "Missing captcha token" };
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return { success: false, error: "Server captcha not configured" };

  try {
    const { data } = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      new URLSearchParams({ secret, response: token }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 5000 }
    );
    return { success: !!data.success, error: data["error-codes"]?.[0] };
  } catch (e) {
    return { success: false, error: "Captcha verification failed" };
  }
}

/**
 * Middleware: require captcha in body when RECAPTCHA_SECRET_KEY is set; otherwise skip so dev works.
 */
export async function requireCaptcha(req, res, next) {
  if (!process.env.RECAPTCHA_SECRET_KEY?.trim()) {
    return next();
  }
  const result = await verifyRecaptcha(req.body?.recaptchaToken);
  if (!result.success) {
    return res.status(400).json({ success: false, error: "Captcha failed", details: result.error });
  }
  next();
}
