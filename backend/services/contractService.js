import { ethers } from "ethers";

let contractInstance = null;
let providerInstance = null;

/** Uses BACKEND_CONTRACT_ADDRESS from .env (paste the contract address from Remix IDE after deploy). */
function getContract() {
  const address = process.env.BACKEND_CONTRACT_ADDRESS?.trim();
  const rpc = process.env.SEPOLIA_RPC_URL?.trim() || "https://rpc.sepolia.org";
  const privateKey = process.env.PRIVATE_KEY?.trim();
  if (!address || !privateKey) return null;
  const provider = new ethers.JsonRpcProvider(rpc);
  providerInstance = provider;
  const signer = new ethers.Wallet(privateKey, provider);
  const abi = [
    "function setReputation(address user, uint256 score) external",
    "function verifyUser(address user) external",
    "function mintTimeBoundNFT(address user) external",
    "function checkEligibility(address user) external view returns (bool)",
    "function reputationScore(address) external view returns (uint256)",
    "function isVerified(address) external view returns (bool)",
    "function nftExpiry(address) external view returns (uint256)",
  ];
  return new ethers.Contract(address, abi, signer);
}

export function getReputationContract() {
  if (!contractInstance) contractInstance = getContract();
  return contractInstance;
}

/** Call before process exit to avoid UV_HANDLE_CLOSING assertion on Windows */
export function destroyContractService() {
  if (providerInstance && typeof providerInstance.destroy === "function") {
    try {
      providerInstance.destroy();
    } catch (_) {}
    providerInstance = null;
  }
  contractInstance = null;
}

export async function setReputationOnChain(userAddress, score) {
  const contract = getReputationContract();
  if (!contract) return { success: false, error: "Contract not configured" };
  try {
    const tx = await contract.setReputation(userAddress, score);
    await tx.wait();
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function verifyUserOnChain(userAddress) {
  const contract = getReputationContract();
  if (!contract) return { success: false, error: "Contract not configured" };
  try {
    const tx = await contract.verifyUser(userAddress);
    await tx.wait();
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function mintNFTOnChain(userAddress) {
  const contract = getReputationContract();
  if (!contract) return { success: false, error: "Contract not configured" };
  try {
    const tx = await contract.mintTimeBoundNFT(userAddress);
    await tx.wait();
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function checkEligibilityOnChain(userAddress) {
  const contract = getReputationContract();
  if (!contract) return { eligible: false };
  try {
    return await contract.checkEligibility(userAddress);
  } catch {
    return false;
  }
}
