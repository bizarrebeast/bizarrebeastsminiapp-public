// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// OpenZeppelin Contracts v5.4.0 (latest stable as of 2025-10-01)
// All imports are from audited OpenZeppelin library - no custom security code
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BizarreFlip
 * @notice Deposit/withdraw contract for BizarreBeasts coin flip game
 * @dev Game logic is off-chain. This contract only handles token custody.
 *
 * User Flow:
 * 1. User deposits $BB tokens to contract
 * 2. User plays games off-chain (backend updates balances)
 * 3. User withdraws $BB tokens from contract
 *
 * Security:
 * - Uses only audited OpenZeppelin contracts
 * - ReentrancyGuard on all token transfers
 * - Pausable for emergency stops
 * - Ownable for backend balance updates
 */
contract BizarreFlip is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    /// @notice The $BB token contract
    IERC20 public immutable bbToken;

    /// @notice User balances (includes deposits + winnings - losses)
    mapping(address => uint256) public balances;

    /// @notice Total deposits across all users
    uint256 public totalDeposits;

    /// @notice House reserve for payouts (funded separately)
    uint256 public houseReserve;

    /// @notice Minimum deposit amount (1000 $BB)
    uint256 public constant MIN_DEPOSIT = 1000 * 10**18;

    /// @notice Maximum deposit amount (500K $BB - matches max bet)
    uint256 public constant MAX_DEPOSIT = 500_000 * 10**18;

    /// @notice Maximum balance allowed (10M $BB - forced withdrawal above this)
    uint256 public constant MAX_BALANCE = 10_000_000 * 10**18;

    /// @notice Forced withdrawal target (1M $BB - withdraw down to this amount)
    uint256 public constant FORCE_WITHDRAW_TARGET = 1_000_000 * 10**18;

    event Deposited(address indexed user, uint256 amount, uint256 newBalance);
    event Withdrawn(address indexed user, uint256 amount, uint256 newBalance);
    event BalanceUpdated(address indexed user, uint256 oldBalance, uint256 newBalance, string reason);
    event HouseReserveFunded(uint256 amount, uint256 newReserve);
    event EmergencyWithdraw(address indexed token, address indexed to, uint256 amount);
    event ForceWithdrawalRequired(address indexed user, uint256 currentBalance, uint256 excess);

    constructor(address _bbToken) Ownable(msg.sender) {
        require(_bbToken != address(0), "Invalid token address");
        bbToken = IERC20(_bbToken);
    }

    /**
     * @notice Deposit $BB tokens to play
     * @param amount Amount of $BB tokens to deposit (in wei)
     */
    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        require(amount >= MIN_DEPOSIT, "Below minimum deposit");
        require(amount <= MAX_DEPOSIT, "Above maximum deposit");

        bbToken.safeTransferFrom(msg.sender, address(this), amount);
        balances[msg.sender] += amount;
        totalDeposits += amount;

        emit Deposited(msg.sender, amount, balances[msg.sender]);
    }

    /**
     * @notice Withdraw $BB tokens
     * @param amount Amount of $BB tokens to withdraw (in wei)
     */
    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");

        balances[msg.sender] -= amount;
        totalDeposits -= amount;
        bbToken.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount, balances[msg.sender]);
    }

    /**
     * @notice Withdraw all balance
     */
    function withdrawAll() external nonReentrant whenNotPaused {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance to withdraw");

        balances[msg.sender] = 0;
        totalDeposits -= amount;
        bbToken.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount, 0);
    }

    /**
     * @notice Update user balance after game resolution (off-chain)
     * @dev Only callable by backend (owner)
     * @param user User address
     * @param newBalance New balance after game
     * @param reason Description of balance change (e.g., "won_19600", "lost_10000")
     */
    function updateBalance(
        address user,
        uint256 newBalance,
        string calldata reason
    ) external onlyOwner {
        uint256 oldBalance = balances[user];
        balances[user] = newBalance;

        // Update total deposits to maintain accounting
        if (newBalance > oldBalance) {
            uint256 increase = newBalance - oldBalance;
            totalDeposits += increase;
            // Winnings come from house reserve
            require(houseReserve >= increase, "Insufficient house reserve");
            houseReserve -= increase;
        } else if (newBalance < oldBalance) {
            uint256 decrease = oldBalance - newBalance;
            totalDeposits -= decrease;
            // Losses go to house reserve
            houseReserve += decrease;
        }

        emit BalanceUpdated(user, oldBalance, newBalance, reason);

        // Check if forced withdrawal required
        if (newBalance > MAX_BALANCE) {
            uint256 excess = newBalance - MAX_BALANCE;
            emit ForceWithdrawalRequired(user, newBalance, excess);
        }
    }

    /**
     * @notice Check if user needs to make forced withdrawal
     * @param user User address
     * @return required True if forced withdrawal needed
     * @return amount Amount user must withdraw
     */
    function checkForceWithdrawal(address user) external view returns (bool required, uint256 amount) {
        uint256 balance = balances[user];
        if (balance > MAX_BALANCE) {
            required = true;
            amount = balance - FORCE_WITHDRAW_TARGET;
        }
        return (required, amount);
    }

    /**
     * @notice Fund house reserve for payouts
     * @dev Owner deposits $BB to cover player winnings
     */
    function fundHouseReserve(uint256 amount) external onlyOwner {
        bbToken.safeTransferFrom(msg.sender, address(this), amount);
        houseReserve += amount;
        emit HouseReserveFunded(amount, houseReserve);
    }

    /**
     * @notice Get contract's total $BB balance
     */
    function getContractBalance() external view returns (uint256) {
        return bbToken.balanceOf(address(this));
    }

    /**
     * @notice Check if contract is healthy (has enough reserves)
     */
    function isHealthy() external view returns (bool) {
        uint256 contractBalance = bbToken.balanceOf(address(this));
        return contractBalance >= totalDeposits;
    }

    /**
     * @notice Pause deposits and withdrawals
     * @dev Emergency use only
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause deposits and withdrawals
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Emergency withdraw any ERC20 token
     * @dev Only use if tokens sent by mistake or for contract migration
     */
    function emergencyWithdraw(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        IERC20(token).safeTransfer(to, amount);
        emit EmergencyWithdraw(token, to, amount);
    }
}
