// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ArcNovaToken is ERC20, Ownable {
    uint256 public constant MAX_FAUCET = 1000 * 10**18;
    mapping(address => uint256) public lastFaucet;

    constructor() ERC20("Arc Nova Token", "NOVA") Ownable(msg.sender) {
        _mint(msg.sender, 100_000_000 * 10**18);
    }

    // Testnet faucet — 1000 NOVA per 24h per address
    function faucet() external {
        require(block.timestamp >= lastFaucet[msg.sender] + 1 days, "Wait 24h");
        lastFaucet[msg.sender] = block.timestamp;
        _mint(msg.sender, MAX_FAUCET);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
