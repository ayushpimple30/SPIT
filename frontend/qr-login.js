(async function () {
  const statusEl = document.getElementById("status");

  // Generate secure nonce
  const nonce = crypto.randomUUID();

  // Login payload
  const payload = JSON.stringify({
    action: "LOGIN",
    nonce,
    timestamp: Date.now()
  });

  // Render QR
  new QRCode(document.getElementById("qrcode"), {
    text: payload,
    width: 200,
    height: 200
  });

  // Simulate wallet scan & signature (hackathon safe)
  setTimeout(async () => {
    if (!window.ethereum) {
      statusEl.textContent = "MetaMask required";
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const signature = await signer.signMessage(payload);

    // Normally sent to backend for verification
    console.log("Nonce:", nonce);
    console.log("Signature:", signature);

    statusEl.textContent = "✅ Login Approved";
  }, 3000);
})();