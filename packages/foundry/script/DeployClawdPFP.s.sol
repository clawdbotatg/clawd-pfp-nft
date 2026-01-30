// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import "../contracts/ClawdPFP.sol";

contract DeployClawdPFP is ScaffoldETHDeploy {
    function run() external ScaffoldEthDeployerRunner {
        // CLAWD token on Base
        address clawdToken = 0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07;

        // Mint price: 0.001 ETH
        uint256 mintPrice = 0.001 ether;

        // Burn amount: 10,000 CLAWD per mint (18 decimals)
        uint256 burnAmountPerMint = 10_000 * 1e18;

        // Max supply: 1000 PFPs
        uint256 maxSupply = 1000;

        // Base URI (placeholder — will set per-token URIs later)
        string memory baseURI = "";

        new ClawdPFP(
            clawdToken,
            mintPrice,
            burnAmountPerMint,
            maxSupply,
            baseURI,
            deployer
        );
    }
}
