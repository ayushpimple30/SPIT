// zkProof.js
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.9.0/dist/ethers.min.js";

export function generateZKProof(data) {
  /*
    data = {
      wallet,
      aadhaarValid,
      faceVerified,
      ageAbove18
    }
  */

  // Simulated zk commitment (hash)
  const encoded = ethers.solidityPacked(
    ["address", "bool", "bool", "bool"],
    [data.wallet, data.aadhaarValid, data.faceVerified, data.ageAbove18]
  );

  return ethers.keccak256(encoded);
}