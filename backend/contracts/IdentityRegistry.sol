// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract IdentityRegistry {
    struct Identity {
        bytes32 hash;
        uint256 verifiedAt;
        uint256 validUntil;
    }

    mapping(address => Identity) private identities;

    event IdentityVerified(
        address indexed user,
        bytes32 hash,
        uint256 validUntil
    );

    function storeIdentityHash(bytes32 hash) external {
        require(hash != bytes32(0), "Invalid hash");

        identities[msg.sender] = Identity({
            hash: hash,
            verifiedAt: block.timestamp,
            validUntil: block.timestamp + 30 days
        });

        emit IdentityVerified(
            msg.sender,
            hash,
            block.timestamp + 30 days
        );
    }

    function isVerified(address user) external view returns (bool) {
        Identity memory id = identities[user];
        return id.hash != bytes32(0) && block.timestamp <= id.validUntil;
    }

    function getIdentityHash(address user)
        external
        view
        returns (bytes32)
    {
        return identities[user].hash;
    }
}