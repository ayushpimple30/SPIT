import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import crypto from "crypto";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

/* ================= reCAPTCHA ================= */
async function verifyRecaptcha(token) {
  if (!token) return false;
  const res = await fetch(
    "https://www.google.com/recaptcha/api/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${process.env.RECAPTCHA_SECRET}&response=${token}`
    }
  );
  const data = await res.json();
  return data.success === true;
}

/* ================= HEALTH ================= */
app.get("/", (_, res) => {
  res.send("RacePass Backend Running");
});

/* ================= DIGILOCKER AUTH (SANDBOX) ================= */
app.get("/digilocker/auth", (_, res) => {
  res.send(`
    <html>
      <body style="background:#0f172a;color:white;display:flex;align-items:center;justify-content:center;height:100vh">
        <div>
          <h2>DigiLocker Sandbox</h2>
          <p>Authorize verified government document</p>
          <button onclick="window.close()" style="padding:12px 20px;font-size:16px">
            Authorize
          </button>
        </div>
      </body>
    </html>
  `);
});

/* ================= DIGILOCKER VERIFY ================= */
app.post("/verify-digilocker", (req, res) => {
  const { wallet } = req.body;
  if (!wallet) return res.json({ verified: false });

  const dob = "2000-08-15";
  const age = new Date().getFullYear() - 2000;
  if (age < 18) return res.json({ verified: false });

  const hash = crypto
    .createHash("sha256")
    .update(wallet + dob)
    .digest("hex");

  res.json({
    verified: true,
    identityHash: hash
  });
});

/* ================= SCORE ================= */
app.post("/calculate-score", async (req, res) => {
  if (!(await verifyRecaptcha(req.body.recaptchaToken))) {
    return res.status(403).json({ error: "Invalid captcha" });
  }
  res.json({ score: 82, eligible: true });
});

/* ================= NFT ================= */
app.post("/mint-nft", async (req, res) => {
  if (!(await verifyRecaptcha(req.body.recaptchaToken))) {
    return res.status(403).json({ error: "Invalid captcha" });
  }
  res.json({ minted: true, tokenId: Date.now() });
});

/* ================= START ================= */
app.listen(3000, () =>
  console.log("🚀 Backend running on http://localhost:3000")
);