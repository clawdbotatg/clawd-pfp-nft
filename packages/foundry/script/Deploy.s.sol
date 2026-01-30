//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import { DeployClawdPFP } from "./DeployClawdPFP.s.sol";

contract DeployScript is ScaffoldETHDeploy {
  function run() external {
    DeployClawdPFP deployClawdPFP = new DeployClawdPFP();
    deployClawdPFP.run();
  }
}
