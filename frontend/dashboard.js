(async function () {
  const walletAddressEl = document.getElementById("walletAddress");
  const identityHashEl = document.getElementById("identityHash");
  const btnQr = document.getElementById("btnQrLogin");

  if (!window.ethereum) {
    walletAddressEl.textContent = "MetaMask not detected";
    return;
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  walletAddressEl.textContent =
    address.slice(0, 6) + "..." + address.slice(-4);

  // Demo identity hash (replace with backend value if needed)
  identityHashEl.textContent =
    "0x" + ethers.keccak256(ethers.toUtf8Bytes(address)).slice(2, 18) + "...";

  btnQr.onclick = () => {
    window.open("qr-login.html", "_blank");
  };
})();