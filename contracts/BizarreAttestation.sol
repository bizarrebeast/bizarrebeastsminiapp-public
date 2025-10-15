// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BizarreAttestation
 * @dev A contract for daily on-chain attestations declaring "I AM BIZARRE"
 * @notice Users can attest once per day (20-hour cooldown) and build streaks
 */
contract BizarreAttestation {
    // Events
    event BizarreAttested(
        address indexed attester,
        uint256 timestamp,
        uint256 attestationCount,
        uint256 daysSinceEpoch,
        string message
    );

    event RewardClaimed(
        address indexed user,
        uint256 amount,
        string rewardType,
        uint256 milestone
    );

    event MilestoneReached(
        address indexed user,
        uint256 milestone,
        uint256 timestamp
    );

    event EmergencyPauseToggled(bool isPaused, uint256 timestamp);

    // State variables
    mapping(address => uint256) public lastAttestationTime;
    mapping(address => uint256) public totalAttestations;
    mapping(address => uint256) public lastAttestationDay;
    mapping(address => uint256) public currentStreak;
    mapping(address => uint256) public bestStreak;

    // Reward system (inactive initially)
    mapping(address => uint256) public pendingRewards;
    mapping(address => uint256) public totalRewardsClaimed;
    mapping(address => mapping(uint256 => bool)) public hasClaimedMilestone;

    // Configuration
    uint256 public constant COOLDOWN_PERIOD = 20 hours;
    uint256 public constant DAY_IN_SECONDS = 86400;
    uint256 public immutable deploymentTime;

    // Admin controls
    address public owner;
    address public rewardAdmin;
    bool public rewardsEnabled = false;
    bool public emergencyPause = false;

    // Statistics
    uint256 public totalGlobalAttestations;
    uint256 public uniqueAttesters;

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier notPaused() {
        require(!emergencyPause, "Contract is paused");
        _;
    }

    constructor() {
        owner = msg.sender;
        rewardAdmin = msg.sender;
        deploymentTime = block.timestamp;
    }

    /**
     * @dev Main attestation function - users declare "I AM BIZARRE" on-chain
     * @notice Can only be called once per 20-hour period
     */
    function attestBizarre() external notPaused {
        require(
            block.timestamp > lastAttestationTime[msg.sender] + COOLDOWN_PERIOD,
            "Cooldown period not met"
        );

        uint256 currentDay = (block.timestamp - deploymentTime) / DAY_IN_SECONDS;
        uint256 lastDay = lastAttestationDay[msg.sender];

        // Update streak logic
        if (currentDay == lastDay + 1) {
            // Consecutive day - increase streak
            currentStreak[msg.sender]++;
        } else if (currentDay > lastDay + 1) {
            // Streak broken - reset to 1
            currentStreak[msg.sender] = 1;
        }
        // If same day, don't update streak (shouldn't happen due to cooldown)

        // Update best streak
        if (currentStreak[msg.sender] > bestStreak[msg.sender]) {
            bestStreak[msg.sender] = currentStreak[msg.sender];
        }

        // Check for milestones
        _checkMilestones(msg.sender, currentStreak[msg.sender]);

        // Update attestation data
        if (totalAttestations[msg.sender] == 0) {
            uniqueAttesters++;
        }

        lastAttestationTime[msg.sender] = block.timestamp;
        lastAttestationDay[msg.sender] = currentDay;
        totalAttestations[msg.sender]++;
        totalGlobalAttestations++;

        // Emit event for off-chain indexing
        emit BizarreAttested(
            msg.sender,
            block.timestamp,
            totalAttestations[msg.sender],
            currentDay,
            "I AM BIZARRE"
        );
    }

    /**
     * @dev Check and emit milestone events
     */
    function _checkMilestones(address user, uint256 streak) private {
        uint256[] memory milestones = new uint256[](4);
        milestones[0] = 7;  // Week Warrior
        milestones[1] = 14; // Fortnight Fighter
        milestones[2] = 30; // Bizarre Legend
        milestones[3] = 100; // Centurion (total attestations)

        for (uint i = 0; i < 3; i++) {
            if (streak == milestones[i] && !hasClaimedMilestone[user][milestones[i]]) {
                emit MilestoneReached(user, milestones[i], block.timestamp);
                hasClaimedMilestone[user][milestones[i]] = true;

                // Set pending rewards if enabled
                if (rewardsEnabled) {
                    _setPendingReward(user, milestones[i]);
                }
            }
        }

        // Check total attestations milestone
        if (totalAttestations[user] == 100 && !hasClaimedMilestone[user][100]) {
            emit MilestoneReached(user, 100, block.timestamp);
            hasClaimedMilestone[user][100] = true;

            if (rewardsEnabled) {
                _setPendingReward(user, 100);
            }
        }
    }

    /**
     * @dev Internal function to set pending rewards (for future use)
     */
    function _setPendingReward(address user, uint256 milestone) private {
        uint256 rewardAmount;

        if (milestone == 7) rewardAmount = 100;
        else if (milestone == 14) rewardAmount = 250;
        else if (milestone == 30) rewardAmount = 1000;
        else if (milestone == 100) rewardAmount = 5000;

        pendingRewards[user] += rewardAmount;
    }

    // View functions

    /**
     * @dev Check if a user can currently attest
     */
    function canAttest(address user) external view returns (bool) {
        return block.timestamp > lastAttestationTime[user] + COOLDOWN_PERIOD && !emergencyPause;
    }

    /**
     * @dev Get time until next attestation is available
     */
    function timeUntilNextAttestation(address user) external view returns (uint256) {
        uint256 nextTime = lastAttestationTime[user] + COOLDOWN_PERIOD;
        if (block.timestamp >= nextTime) return 0;
        return nextTime - block.timestamp;
    }

    /**
     * @dev Get comprehensive user statistics
     */
    function getUserStats(address user) external view returns (
        uint256 attestations,
        uint256 streak,
        uint256 best,
        uint256 lastTime,
        bool canAttestNow,
        uint256 pending
    ) {
        return (
            totalAttestations[user],
            currentStreak[user],
            bestStreak[user],
            lastAttestationTime[user],
            block.timestamp > lastAttestationTime[user] + COOLDOWN_PERIOD && !emergencyPause,
            pendingRewards[user]
        );
    }

    /**
     * @dev Get global contract statistics
     */
    function getGlobalStats() external view returns (
        uint256 total,
        uint256 unique,
        uint256 contractDay
    ) {
        return (
            totalGlobalAttestations,
            uniqueAttesters,
            (block.timestamp - deploymentTime) / DAY_IN_SECONDS
        );
    }

    // Admin functions

    /**
     * @dev Enable rewards system (one-way toggle)
     */
    function enableRewards() external onlyOwner {
        require(!rewardsEnabled, "Already enabled");
        rewardsEnabled = true;
    }

    /**
     * @dev Emergency pause toggle
     */
    function setEmergencyPause(bool _pause) external onlyOwner {
        emergencyPause = _pause;
        emit EmergencyPauseToggled(_pause, block.timestamp);
    }

    /**
     * @dev Set reward admin address
     */
    function setRewardAdmin(address _admin) external onlyOwner {
        require(_admin != address(0), "Invalid address");
        rewardAdmin = _admin;
    }

    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }

    // Future reward claiming (inactive initially)

    /**
     * @dev Claim pending rewards (when enabled)
     * @notice This is a placeholder for future $BB token integration
     */
    function claimReward() external notPaused {
        require(rewardsEnabled, "Rewards not enabled");
        require(pendingRewards[msg.sender] > 0, "No pending rewards");

        uint256 amount = pendingRewards[msg.sender];
        pendingRewards[msg.sender] = 0;
        totalRewardsClaimed[msg.sender] += amount;

        // Transfer logic would go here when BB token integration is ready
        // For now, just emit an event
        emit RewardClaimed(msg.sender, amount, "BB_TOKEN", 0);
    }

    /**
     * @dev Set specific reward amount for a user (admin only)
     */
    function setRewardAmount(address user, uint256 amount) external {
        require(msg.sender == rewardAdmin, "Not reward admin");
        require(rewardsEnabled, "Rewards not enabled");
        pendingRewards[user] = amount;
    }
}