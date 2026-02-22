// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReputationRegistry
 * @dev Privacy-preserving: Only stores reputation score, verification status, and NFT expiry on-chain.
 *      No personal data (Aadhaar, face, biometric, IP) is ever stored.
 */
contract ReputationRegistry is Ownable {
    mapping(address => uint256) public reputationScore;
    mapping(address => bool) public isVerified;
    mapping(address => uint256) public nftExpiry; // timestamp when current NFT expires
    uint256 public constant NFT_VALIDITY_DAYS = 30;
    uint256 public constant ELIGIBILITY_THRESHOLD = 75;

    event ReputationSet(address indexed user, uint256 score);
    event UserVerified(address indexed user);
    event NFTMinted(address indexed user, uint256 expiryTimestamp);

    error AlreadyActiveNFT();
    error Unauthorized();

    /// @dev Only the backend signer (owner) can write to the contract
    modifier onlyBackend() {
        if (msg.sender != owner()) revert Unauthorized();
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Set reputation score for a user (called by backend after verification)
     * @param user Address to set score for
     * @param score Reputation score (0-100)
     */
    function setReputation(address user, uint256 score) external onlyBackend {
        reputationScore[user] = score;
        emit ReputationSet(user, score);
    }

    /**
     * @notice Mark user as verified (score >= 75)
     * @param user Address to verify
     */
    function verifyUser(address user) external onlyBackend {
        isVerified[user] = true;
        emit UserVerified(user);
    }

    /**
     * @notice Mint a time-bound "NFT" (stored as expiry timestamp). Prevents minting if already active.
     * @param user Address to mint for
     */
    function mintTimeBoundNFT(address user) external onlyBackend {
        if (nftExpiry[user] > block.timestamp) revert AlreadyActiveNFT();
        nftExpiry[user] = block.timestamp + (NFT_VALIDITY_DAYS * 1 days);
        emit NFTMinted(user, nftExpiry[user]);
    }

    /**
     * @notice Check if user is eligible (verified and score >= threshold)
     * @param user Address to check
     * @return eligible True if score >= 75 and isVerified
     */
    function checkEligibility(address user) external view returns (bool eligible) {
        return isVerified[user] && reputationScore[user] >= ELIGIBILITY_THRESHOLD;
    }

    /**
     * @notice Check if user has an active (non-expired) NFT
     */
    function hasActiveNFT(address user) external view returns (bool) {
        return nftExpiry[user] > block.timestamp;
    }
}
