// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@thirdweb-dev/contracts/base/ERC1155Base.sol";
import "@thirdweb-dev/contracts/extension/Permissions.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title InAppExclusiveNFT
 * @notice BizarreBeasts In-App Exclusive NFT Collection
 * @dev ERC-1155 with dynamic bonding curve pricing in BB tokens
 *
 * Features:
 * - 500 total supply per token ID
 * - Dynamic pricing: starts at 10M BB, ends at 20M BB
 * - Linear bonding curve increases price with each mint
 * - Max 5 per wallet
 * - Creator reserves via admin mint
 * - Emergency pause
 * - BB token only (no ETH)
 */
contract InAppExclusiveNFT is ERC1155Base, ReentrancyGuard {

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice The BB token contract address on Base
    IERC20 public immutable bbToken;

    /// @notice Treasury wallet receiving BB tokens
    address public immutable treasury;

    /// @notice Maximum supply per token ID
    uint256 public constant MAX_SUPPLY = 500;

    /// @notice Maximum tokens per wallet
    uint256 public constant MAX_PER_WALLET = 5;

    /// @notice Starting price: 5M BB tokens (with 18 decimals)
    uint256 public constant STARTING_PRICE = 5_000_000 * 10**18;

    /// @notice Ending price: 20M BB tokens (with 18 decimals)
    uint256 public constant ENDING_PRICE = 20_000_000 * 10**18;

    /// @notice Track total minted per token ID
    mapping(uint256 => uint256) public totalMinted;

    /// @notice Emergency pause state
    bool public paused;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event Minted(
        address indexed minter,
        uint256 indexed tokenId,
        uint256 amount,
        uint256 totalCost,
        uint256 newTotalMinted
    );

    event Paused(bool paused);

    event CreatorReserveMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256 amount
    );

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error ContractPaused();
    error ExceedsMaxSupply();
    error ExceedsMaxPerWallet();
    error InsufficientBBAllowance();
    error InsufficientBBBalance();
    error InvalidAmount();
    error TransferFailed();

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @param _bbTokenAddress BB token address on Base: 0x0520bf1d3cEE163407aDA79109333aB1599b4004
     * @param _treasury Treasury wallet to receive BB tokens: 0xD136b312dE3f0A27dB9b2E2BeDceF487722F10c9
     * @param _royaltyRecipient Address to receive royalties
     * @param _royaltyBps Royalty basis points (e.g., 500 = 5%)
     */
    constructor(
        address _bbTokenAddress,
        address _treasury,
        address _royaltyRecipient,
        uint128 _royaltyBps
    )
        ERC1155Base(
            msg.sender, // initial owner
            "BizarreBeasts In-App Exclusives",
            "BBEXC",
            _royaltyRecipient,
            _royaltyBps
        )
    {
        require(_bbTokenAddress != address(0), "Invalid BB token address");
        require(_treasury != address(0), "Invalid treasury address");

        bbToken = IERC20(_bbTokenAddress);
        treasury = _treasury;
    }

    /*//////////////////////////////////////////////////////////////
                            MINTING LOGIC
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Mint NFTs with BB tokens using bonding curve pricing
     * @param tokenId The token ID to mint
     * @param amount Number of tokens to mint (1-5)
     */
    function mint(uint256 tokenId, uint256 amount) external nonReentrant {
        if (paused) revert ContractPaused();
        if (amount == 0 || amount > MAX_PER_WALLET) revert InvalidAmount();

        uint256 currentSupply = totalMinted[tokenId];
        if (currentSupply + amount > MAX_SUPPLY) revert ExceedsMaxSupply();

        uint256 userBalance = balanceOf[msg.sender][tokenId];
        if (userBalance + amount > MAX_PER_WALLET) revert ExceedsMaxPerWallet();

        // Calculate total cost using bonding curve
        uint256 totalCost = calculateTotalCost(tokenId, amount);

        // Check allowance and balance
        uint256 allowance = bbToken.allowance(msg.sender, address(this));
        if (allowance < totalCost) revert InsufficientBBAllowance();

        uint256 userBBBalance = bbToken.balanceOf(msg.sender);
        if (userBBBalance < totalCost) revert InsufficientBBBalance();

        // Transfer BB tokens to treasury
        bool success = bbToken.transferFrom(msg.sender, treasury, totalCost);
        if (!success) revert TransferFailed();

        // Mint NFT
        _mint(msg.sender, tokenId, amount, "");
        totalMinted[tokenId] += amount;

        emit Minted(msg.sender, tokenId, amount, totalCost, totalMinted[tokenId]);
    }

    /**
     * @notice Admin function to mint creator reserves
     * @param to Address to mint to
     * @param tokenId Token ID to mint
     * @param amount Amount to mint
     */
    function mintCreatorReserve(
        address to,
        uint256 tokenId,
        uint256 amount
    ) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(amount > 0, "Invalid amount");

        uint256 currentSupply = totalMinted[tokenId];
        if (currentSupply + amount > MAX_SUPPLY) revert ExceedsMaxSupply();

        _mint(to, tokenId, amount, "");
        totalMinted[tokenId] += amount;

        emit CreatorReserveMinted(to, tokenId, amount);
    }

    /*//////////////////////////////////////////////////////////////
                          PRICING LOGIC
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get current price for next mint
     * @param tokenId Token ID to check price for
     * @return Current price in BB tokens (with 18 decimals)
     */
    function getCurrentPrice(uint256 tokenId) public view returns (uint256) {
        uint256 minted = totalMinted[tokenId];
        if (minted >= MAX_SUPPLY) return ENDING_PRICE;

        // Linear bonding curve: price increases linearly from START to END
        uint256 priceIncrease = (ENDING_PRICE - STARTING_PRICE) * minted / MAX_SUPPLY;
        return STARTING_PRICE + priceIncrease;
    }

    /**
     * @notice Calculate total cost for minting multiple tokens
     * @param tokenId Token ID
     * @param amount Number of tokens to mint
     * @return Total cost in BB tokens (with 18 decimals)
     *
     * @dev Calculates the sum of prices across the bonding curve
     * Example: Minting 3 tokens when 100 already minted:
     * - Price for mint #101
     * - Price for mint #102
     * - Price for mint #103
     * = Total cost
     */
    function calculateTotalCost(uint256 tokenId, uint256 amount) public view returns (uint256) {
        uint256 currentSupply = totalMinted[tokenId];
        uint256 totalCost = 0;

        for (uint256 i = 0; i < amount; i++) {
            uint256 mintNumber = currentSupply + i;
            uint256 priceIncrease = (ENDING_PRICE - STARTING_PRICE) * mintNumber / MAX_SUPPLY;
            uint256 price = STARTING_PRICE + priceIncrease;
            totalCost += price;
        }

        return totalCost;
    }

    /**
     * @notice Get detailed pricing breakdown for minting
     * @param tokenId Token ID
     * @param amount Amount to mint
     * @return prices Array of individual prices for each token
     * @return total Total cost
     * @return avgPrice Average price per token
     */
    function getPricingBreakdown(uint256 tokenId, uint256 amount)
        external
        view
        returns (
            uint256[] memory prices,
            uint256 total,
            uint256 avgPrice
        )
    {
        uint256 currentSupply = totalMinted[tokenId];
        prices = new uint256[](amount);
        total = 0;

        for (uint256 i = 0; i < amount; i++) {
            uint256 mintNumber = currentSupply + i;
            uint256 priceIncrease = (ENDING_PRICE - STARTING_PRICE) * mintNumber / MAX_SUPPLY;
            prices[i] = STARTING_PRICE + priceIncrease;
            total += prices[i];
        }

        avgPrice = total / amount;
    }

    /*//////////////////////////////////////////////////////////////
                          ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Emergency pause/unpause
     * @param _paused New pause state
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit Paused(_paused);
    }

    /**
     * @notice Set metadata URI for a token
     * @param tokenId Token ID to set URI for
     * @param tokenURI Metadata URI (e.g., ipfs://QmHash/0)
     */
    function setTokenURI(uint256 tokenId, string memory tokenURI) external onlyOwner {
        _setTokenURI(tokenId, tokenURI);
    }

    /*//////////////////////////////////////////////////////////////
                          VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get remaining supply for a token ID
     * @param tokenId Token ID to check
     * @return Remaining mintable supply
     */
    function remainingSupply(uint256 tokenId) external view returns (uint256) {
        return MAX_SUPPLY - totalMinted[tokenId];
    }

    /**
     * @notice Check if a user can mint more tokens
     * @param user Address to check
     * @param tokenId Token ID
     * @return canMint Whether user can mint
     * @return remaining How many more user can mint
     */
    function canUserMint(address user, uint256 tokenId)
        external
        view
        returns (bool canMint, uint256 remaining)
    {
        uint256 userBalance = balanceOf[user][tokenId];
        remaining = userBalance >= MAX_PER_WALLET ? 0 : MAX_PER_WALLET - userBalance;
        canMint = remaining > 0 && totalMinted[tokenId] < MAX_SUPPLY;
    }

    /**
     * @notice Get all stats for a token ID
     * @param tokenId Token ID to query
     * @return minted Total minted
     * @return remaining Remaining supply
     * @return currentPrice Current mint price
     * @return isPaused Whether contract is paused
     */
    function getTokenStats(uint256 tokenId)
        external
        view
        returns (
            uint256 minted,
            uint256 remaining,
            uint256 currentPrice,
            bool isPaused
        )
    {
        minted = totalMinted[tokenId];
        remaining = MAX_SUPPLY - minted;
        currentPrice = getCurrentPrice(tokenId);
        isPaused = paused;
    }
}
