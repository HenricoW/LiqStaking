// SPDX-License-Identifier: MIT

pragma solidity ^0.7.3;

import "./UnderlyingToken.sol";
import "./GovernanceToken.sol";
import "./LpToken.sol";

contract TokenStaking is LpToken {
    UnderlyingToken public utkn;
    GovernanceToken public gtkn;

    uint256 public exchangeRate = 1; // LP tokens per underlying deposited
    uint constant public REWARD_PER_BLOCK = 1;

    mapping(address => uint256) checkpoints;

    constructor(address underlyingToken, address governanceToken) {
        utkn = UnderlyingToken(underlyingToken);
        gtkn = GovernanceToken(governanceToken);
    }

    function deposit(uint256 uAmount) external {
        uint checkpoint = checkpoints[msg.sender];
        // transferFrom underlying tokens
        utkn.transferFrom(msg.sender, address(this), uAmount);
        // if returning client, distr reward (based on existing LP tkn holding, so has 2b b4 new minting)
        if (checkpoint > 0) _distributeReward(msg.sender);
        // set user's checkpoint block for new clients
        if (checkpoint == 0) checkpoints[msg.sender] = block.number;
        // mint LP tokens for depositor
        _mint(msg.sender, exchangeRate * uAmount);
    }

    function withdraw(uint lpAmount) external {
        // check lp balance sufficient
        require(balanceOf(msg.sender) >= lpAmount, "Insufficient balance");
        // trigger distribution
        _distributeReward(msg.sender);
        // burn user's LP allocation
        _burn(msg.sender, lpAmount);
        // transfer underlying tkn
        utkn.transfer(msg.sender, lpAmount / exchangeRate);
    }

    // distr reward for individual user
    function _distributeReward(address beneficiary) internal {
        uint checkpoint = checkpoints[beneficiary];
        if(block.number - checkpoint > 0){
            // calc distr amount (scaled by Lp tkn amount)
            uint reward = (block.number - checkpoint) * REWARD_PER_BLOCK * balanceOf(beneficiary);
            // reset user's checkpoint block
            checkpoints[beneficiary] = block.number;
            // mint gov tkn
            gtkn.mint(beneficiary, reward);
        }
    }
}
