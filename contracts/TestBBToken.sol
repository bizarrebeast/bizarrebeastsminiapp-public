// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestBBToken
 * @dev Test token for Base Sepolia - simulates $BB token for withdrawal testing
 * Owner can mint tokens to fund the withdrawal wallet
 */
contract TestBBToken is ERC20, Ownable {

    constructor() ERC20("Test Bizarre Beasts Token", "testBB") Ownable(msg.sender) {
        // Mint initial supply to deployer (1 million testBB)
        _mint(msg.sender, 1_000_000 * 10**decimals());
    }

    /**
     * @dev Mint tokens to specified address
     * Only owner can mint (for funding withdrawal wallet)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens from caller's balance
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
