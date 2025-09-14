# 🎮 Bizarre Beasts Check-In System & Gamification Plan

## 📋 Executive Summary

This document outlines the implementation plan for a daily check-in smart contract system with advanced gamification features for the Bizarre Beasts mini app. The system rewards consistent engagement through $BB tokens, NFTs, and social recognition while integrating with existing Empire tiers and rituals.

**Core Goals:**
- Drive daily active users through check-in rewards
- Create habit-forming engagement loops
- Integrate with existing Empire tier system
- Build community through competitive features
- Maintain sustainable token economics

---

## 🏗️ Smart Contract Architecture

### Core Contract Features

```solidity
contract BizarreCheckIn {
    // Key Parameters
    COOLDOWN: 20 hours              // Flexibility for users
    STREAK_BREAK: 44 hours          // 20hr + 24hr buffer
    MAX_STREAK: 30 days             // Cycles reset after 30
    RITUAL_THRESHOLD: 3             // Complete 3 rituals to unlock
    FIVE_DAY_REWARD: 50 BB         // Bonus every 5 check-ins
}
```

### User Data Structure

```solidity
struct UserCheckIn {
    uint256 lastCheckIn;          // Timestamp of last check-in
    uint256 currentStreak;        // Current consecutive days
    uint256 bestStreak;           // Personal best streak
    uint256 totalCheckIns;        // Lifetime check-ins
    uint256 totalRewards;         // Total BB earned
    uint256 checkInCycles;        // Number of 30-day cycles completed
    uint256 ritualsCompleted;     // For gating mechanism
    bool canCheckIn;              // Unlocked after ritual threshold
}
```

### Key Functions

1. **checkIn()** - Main function for daily check-in
2. **unlockCheckIn()** - Called when user completes enough rituals
3. **calculateReward()** - Determines reward based on tier and streak
4. **updateLeaderboard()** - Maintains streak rankings
5. **checkMilestones()** - Awards milestone NFTs/bonuses
6. **completeCycle()** - Handles 30-day cycle completion

---

## 💎 Reward Structure

### Daily Base Rewards (by Empire Tier)

| Tier | Daily BB | 5-Day Bonus | Monthly Estimate |
|------|----------|-------------|------------------|
| Elite | 20 BB | 50 BB | ~2,600 BB |
| Gold | 15 BB | 50 BB | ~2,150 BB |
| Silver | 12 BB | 50 BB | ~1,860 BB |
| Bronze | 10 BB | 50 BB | ~1,700 BB |
| Member | 8 BB | 50 BB | ~1,540 BB |
| Visitor | 5 BB | 50 BB | ~1,350 BB |

### Milestone Rewards

```yaml
7-Day Streak:
  - Reward: 100 BB
  - Badge: Week Warrior NFT
  - Special: Profile flair

14-Day Streak:
  - Reward: 250 BB
  - Badge: Fortnight Fighter NFT
  - Special: Exclusive sticker pack

30-Day Streak:
  - Reward: 1,000 BB
  - Badge: Bizarre Legend NFT
  - Special: Animated profile badge
  - Reset: Streak counter resets for new cycle
```

### Cycle Completion Bonuses

- **First Cycle:** 2,000 BB + Genesis NFT
- **Second Cycle:** 2,500 BB + Evolved NFT
- **Third+ Cycles:** 3,000 BB + Legendary variants

---

## 🎯 Gamification Features

### 1. Ritual-Gated Access

```typescript
Requirements:
  - Complete 3 daily rituals
  - Share at least 1 ritual
  - Once unlocked, permanently available

UI Flow:
  - Locked state: "Complete 3 rituals to unlock"
  - Progress: "2/3 rituals completed"
  - Unlocked: Check-in button appears
```

### 2. Streak Leaderboard System

```typescript
Leaderboards:
  - Current Streaks: Live ranking of active streaks
  - Best Streaks: All-time personal bests
  - Cycle Champions: Most 30-day cycles completed
  - Squad Rankings: Group streak competitions

Display:
  - Top 100 global
  - Friend rankings
  - Empire tier rankings
```

### 3. Combo System

| Combo Type | Requirement | Bonus |
|------------|-------------|-------|
| Ritual Combo | Check-in + Complete all rituals | 1.5x rewards |
| Meme Combo | Check-in + Create meme | Unlock special sticker |
| Social Combo | Check-in + Share | 25 bonus BB |
| Perfect Week | All combos for 7 days | Mystery box NFT |

### 4. Weekly Challenges

```yaml
Monday Motivation:
  - Check in before 9 AM
  - Reward: 50 BB + Early Bird badge

Midweek Warrior:
  - 3 consecutive weekday check-ins
  - Reward: 75 BB

Weekend Warrior:
  - Check in both Saturday and Sunday
  - Reward: 100 BB

Night Owl:
  - Check in after 11 PM
  - Reward: 50 BB + Night Owl badge
```

### 5. Streak Insurance

```typescript
Feature: Protect your streak from breaking
Cost: 100 BB per skip day
Limit: 1 per 30-day cycle
Tier Benefits:
  - Elite: 1 free skip per cycle
  - Gold: 50% discount on skip
  - Others: Full price
Use Cases:
  - Vacation
  - Emergency
  - Technical issues
```

### 6. Squad Streaks

```yaml
Formation:
  - Create or join squad (max 5 members)
  - Set squad name and avatar

Mechanics:
  - All members check in = 2x rewards for all
  - Squad streak tracked separately
  - Weekly squad vs squad competitions

Rewards:
  - Top squad weekly: 500 BB per member
  - Monthly champion: Exclusive NFT set
```

### 7. Power Hour Events

```typescript
Frequency: 2-3 times per week
Duration: 1 hour window
Announcement: 30 minutes before via push/social
Bonus: 5-10x rewards for check-ins
Strategy: Creates FOMO and engagement spikes
```

### 8. NFT Evolution System

```yaml
Day 1-6: Bizarre Egg
  - Static egg NFT
  - Shows cracks as days progress

Day 7-13: Hatching Phase
  - Egg cracks open
  - Baby beast visible

Day 14-29: Growth Phase
  - Beast grows each day
  - Gains features and colors

Day 30: Full Evolution
  - Unique fully-evolved beast
  - Tradeable on secondary market
  - Rarity based on perfect streak

Cycles 2+: Accessories
  - Each cycle adds items
  - Hats, weapons, backgrounds
  - Increases rarity/value
```

### 9. Seasonal Events

```yaml
Spring Season (March-May):
  Theme: Growth & Renewal
  Special: Flower-themed NFTs
  Bonus: +20% rewards on weekends

Summer Season (June-August):
  Theme: Beach Bizarre
  Special: Summer vacation streak insurance
  Bonus: Double rewards on Fridays

Fall Season (September-November):
  Theme: Harvest Festival
  Special: Pumpkin spice everything
  Bonus: Streak multipliers increase

Winter Season (December-February):
  Theme: Frozen Beasts
  Special: Holiday-themed rewards
  Bonus: 12 days of Bizarre (special event)
```

---

## 📱 UI/UX Implementation

### Rituals Page Integration

```typescript
interface RitualsPageEnhancement {
  // Check-in section location
  position: 'Below rituals grid',

  // Visual elements
  streakFlame: '🔥 animated for active streaks',
  calendar: 'Monthly view with check marks',
  progressBar: 'Shows progress to next milestone',

  // Interactive elements
  checkInButton: {
    locked: 'Grayed out with lock icon',
    ready: 'Glowing with animation',
    cooldown: 'Shows countdown timer',
    claimed: 'Checkmark with "See you tomorrow!"'
  },

  // Information display
  stats: {
    currentStreak: 'Large prominent display',
    bestStreak: 'Smaller secondary stat',
    nextReward: 'Preview of upcoming milestone',
    leaderboardRank: 'Global and tier ranking'
  }
}
```

### Mobile Optimization

- Large touch targets for check-in button
- Swipe gestures for calendar navigation
- Pull-to-refresh for leaderboard updates
- Push notifications for check-in reminders
- Offline capability with sync on reconnect

### Visual Feedback

```typescript
Animations:
  - Coin shower on check-in
  - Streak flame grows with consecutive days
  - Milestone celebration animation
  - NFT evolution preview

Sound Effects:
  - Satisfying 'ding' on check-in
  - Streak continuation sound
  - Milestone achievement fanfare
  - Streak break 'whoosh' sound
```

---

## 💰 Token Economics

### Sustainability Model

```yaml
Daily Distribution:
  - Average user: 10-15 BB/day
  - Active users: 1,000 (initial)
  - Daily outflow: 10,000-15,000 BB
  - Monthly: 300,000-450,000 BB

Revenue Sources:
  - Streak insurance purchases
  - Premium skip days
  - Squad formation fees
  - NFT marketplace fees

Token Sinks:
  - Insurance/skips: 100 BB each
  - Squad creation: 500 BB
  - Challenge entries: 50 BB
  - Name changes: 200 BB
```

### Inflation Control

1. **Cycle Rewards Cap** - Maximum 3,000 BB per cycle
2. **Dynamic Adjustment** - Reduce rewards if supply issues
3. **Burn Mechanisms** - % of insurance/fees burned
4. **Time-Limited Events** - Not permanent inflation

---

## 🚀 Implementation Roadmap

### Phase 1: Core System (Week 1-2)
- [ ] Deploy basic check-in contract
- [ ] Integrate with rituals page
- [ ] Implement 20-hour cooldown
- [ ] Add Empire tier multipliers
- [ ] Test on Base testnet

### Phase 2: Rewards & Streaks (Week 3-4)
- [ ] Add 5-day bonus system
- [ ] Implement 30-day cycles
- [ ] Create milestone NFT contracts
- [ ] Build streak leaderboard
- [ ] Add streak breaking logic

### Phase 3: Gamification (Month 2)
- [ ] Ritual-gating mechanism
- [ ] Weekly challenges
- [ ] Combo system
- [ ] Streak insurance
- [ ] Power hour events

### Phase 4: Social Features (Month 2-3)
- [ ] Squad streak system
- [ ] Friend leaderboards
- [ ] Share integrations
- [ ] Prediction markets
- [ ] Tournament mode

### Phase 5: Advanced Features (Month 3+)
- [ ] NFT evolution system
- [ ] Seasonal events
- [ ] Cross-app integrations
- [ ] Achievement system
- [ ] Merchandise unlocks

---

## 🔒 Security Considerations

### Smart Contract Security
- Reentrancy guards on all functions
- Time manipulation prevention
- Owner-only administrative functions
- Pausable in case of emergency
- Audit before mainnet deployment

### Anti-Gaming Measures
- One check-in per wallet per day
- Server-side ritual verification
- Rate limiting on API calls
- Suspicious activity monitoring
- Manual review for top streakers

---

## 📊 Success Metrics

### Target KPIs (3 Month)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily Active Users | 500+ | Unique check-ins/day |
| 7-Day Retention | 60% | Week 2 check-ins |
| 30-Day Completion | 25% | Full cycles |
| Squad Participation | 30% | Users in squads |
| Revenue/User | $2 | Insurance + fees |

### Engagement Metrics
- Average streak length: 12 days
- Check-ins per user: 20/month
- Social shares: 40% of milestones
- NFT evolution completion: 15%
- Challenge participation: 50%

---

## 🤝 Integration Points

### With Existing Features
- **Meme Generator:** Combo bonuses for creation + check-in
- **Contests:** Streak holders get voting power boost
- **Empire System:** Tier-based reward multipliers
- **Games:** Check-in unlocks daily play bonuses

### External Integrations
- **Farcaster:** Auto-share milestones
- **Discord:** Streak role assignments
- **Twitter:** Power hour announcements
- **Wallet:** Push notifications via WalletConnect

---

## 📝 Technical Requirements

### Smart Contract
- Solidity ^0.8.20
- OpenZeppelin contracts
- Base network deployment
- Upgradeable proxy pattern
- Gas optimization critical

### Frontend
- React component in rituals page
- Zustand for state management
- Real-time updates via polling
- Local storage for offline
- Service worker for notifications

### Backend
- API endpoint for ritual verification
- Cron job for daily resets
- Webhook for milestone alerts
- Analytics event tracking
- Admin dashboard for monitoring

---

## ❓ Open Questions for Discussion

1. **Reward Amounts:** Are the BB amounts sustainable?
2. **NFT Design:** Who creates the evolution artwork?
3. **Squad Size:** Is 5 members optimal?
4. **Insurance Cost:** Is 100 BB fair?
5. **Seasonal Themes:** Community-driven or pre-planned?
6. **Leaderboard Prizes:** Additional rewards for top 10?
7. **Contract Upgradeability:** Proxy pattern or immutable?
8. **Multi-Chain:** Deploy on other chains later?

---

## 📝 Smart Contract Creation & Deployment Process

### Step 1: Development Environment Setup

```bash
# Install required tools
npm install -g hardhat
npm install @openzeppelin/contracts ethers dotenv

# Initialize Hardhat project
npx hardhat init
# Choose: Create a JavaScript project

# Project structure
bizarre-checkin-contract/
├── contracts/
│   ├── BizarreCheckIn.sol
│   └── interfaces/
├── scripts/
│   ├── deploy.js
│   └── verify.js
├── test/
│   └── BizarreCheckIn.test.js
├── hardhat.config.js
└── .env
```

### Step 2: Environment Configuration

```javascript
// .env file
PRIVATE_KEY=your_wallet_private_key
BASE_RPC_URL=https://mainnet.base.org
BASE_SCAN_API_KEY=your_basescan_api_key
BB_TOKEN_ADDRESS=0x... // BB token contract on Base
```

### Step 3: Full Contract Code

```solidity
// contracts/BizarreCheckIn.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract BizarreCheckIn is Ownable, ReentrancyGuard, Pausable {
    // [Full contract code as designed above]
    // Including all functions, events, and modifiers
}
```

### Step 4: Hardhat Configuration

```javascript
// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    base: {
      url: process.env.BASE_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 8453
    },
    baseTestnet: {
      url: "https://goerli.base.org",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 84531
    }
  },
  etherscan: {
    apiKey: {
      base: process.env.BASE_SCAN_API_KEY
    }
  }
};
```

### Step 5: Deployment Script

```javascript
// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  console.log("Deploying BizarreCheckIn contract...");

  const bbTokenAddress = process.env.BB_TOKEN_ADDRESS;

  // Deploy contract
  const BizarreCheckIn = await hre.ethers.getContractFactory("BizarreCheckIn");
  const checkIn = await BizarreCheckIn.deploy(bbTokenAddress);

  await checkIn.deployed();

  console.log("BizarreCheckIn deployed to:", checkIn.address);

  // Set initial configurations
  console.log("Setting up initial configurations...");

  // Set tier multipliers
  await checkIn.updateTierMultiplier("Elite", 200);
  await checkIn.updateTierMultiplier("Gold", 150);
  await checkIn.updateTierMultiplier("Silver", 125);
  await checkIn.updateTierMultiplier("Bronze", 110);
  await checkIn.updateTierMultiplier("Member", 100);
  await checkIn.updateTierMultiplier("Visitor", 50);

  console.log("Configuration complete!");

  // Fund contract with BB tokens
  console.log("Remember to fund the contract with BB tokens!");

  return checkIn.address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Step 6: Testing

```javascript
// test/BizarreCheckIn.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BizarreCheckIn", function () {
  let checkIn, bbToken, owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock BB token
    const MockToken = await ethers.getContractFactory("MockERC20");
    bbToken = await MockToken.deploy("Bizarre Beast", "BB");

    // Deploy check-in contract
    const BizarreCheckIn = await ethers.getContractFactory("BizarreCheckIn");
    checkIn = await BizarreCheckIn.deploy(bbToken.address);

    // Fund contract
    await bbToken.mint(checkIn.address, ethers.utils.parseEther("100000"));
  });

  it("Should handle check-ins correctly", async function () {
    // Unlock check-in for user
    await checkIn.unlockCheckIn(user1.address, 3);

    // First check-in
    await checkIn.connect(user1).checkIn("Member");
    const userData = await checkIn.users(user1.address);
    expect(userData.currentStreak).to.equal(1);

    // Try immediate second check-in (should fail)
    await expect(
      checkIn.connect(user1).checkIn("Member")
    ).to.be.revertedWith("Wait 20 hours between check-ins");

    // Fast forward 20 hours
    await ethers.provider.send("evm_increaseTime", [20 * 3600]);
    await ethers.provider.send("evm_mine");

    // Second check-in should work
    await checkIn.connect(user1).checkIn("Member");
    const userData2 = await checkIn.users(user1.address);
    expect(userData2.currentStreak).to.equal(2);
  });

  // Add more tests for streaks, rewards, milestones, etc.
});
```

### Step 7: Deployment Process

```bash
# 1. Compile contracts
npx hardhat compile

# 2. Run tests
npx hardhat test

# 3. Deploy to Base testnet first
npx hardhat run scripts/deploy.js --network baseTestnet

# 4. Verify on BaseScan testnet
npx hardhat verify --network baseTestnet DEPLOYED_ADDRESS BB_TOKEN_ADDRESS

# 5. Test thoroughly on testnet
# - Check-ins, streaks, rewards
# - Admin functions
# - Edge cases

# 6. Deploy to Base mainnet
npx hardhat run scripts/deploy.js --network base

# 7. Verify on BaseScan mainnet
npx hardhat verify --network base DEPLOYED_ADDRESS BB_TOKEN_ADDRESS
```

### Step 8: Post-Deployment Setup

```javascript
// scripts/setup.js
async function setupContract() {
  const contractAddress = "0x..."; // Deployed address
  const checkIn = await ethers.getContractAt("BizarreCheckIn", contractAddress);

  // 1. Transfer BB tokens to contract
  const bbToken = await ethers.getContractAt("IERC20", BB_TOKEN_ADDRESS);
  const fundAmount = ethers.utils.parseEther("50000"); // 50k BB
  await bbToken.transfer(contractAddress, fundAmount);

  // 2. Set authorized callers (for ritual integration)
  await checkIn.setAuthorizedCaller("0x..."); // Rituals API wallet

  // 3. Set milestone rewards
  await checkIn.setMilestone(7, ethers.utils.parseEther("100"), "");
  await checkIn.setMilestone(14, ethers.utils.parseEther("250"), "");
  await checkIn.setMilestone(30, ethers.utils.parseEther("1000"), "");

  console.log("Contract setup complete!");
}
```

### Step 9: Frontend Integration

```typescript
// lib/contracts/checkIn.ts
import { ethers } from 'ethers';
import CheckInABI from './abis/BizarreCheckIn.json';

const CHECK_IN_ADDRESS = process.env.NEXT_PUBLIC_CHECK_IN_ADDRESS;

export class CheckInContract {
  private contract: ethers.Contract;

  constructor(signer: ethers.Signer) {
    this.contract = new ethers.Contract(
      CHECK_IN_ADDRESS,
      CheckInABI,
      signer
    );
  }

  async checkIn(empireTier: string) {
    const tx = await this.contract.checkIn(empireTier);
    return tx.wait();
  }

  async getUserData(address: string) {
    return this.contract.users(address);
  }

  async canCheckIn(address: string) {
    return this.contract.canCheckIn(address);
  }

  async getTimeUntilNextCheckIn(address: string) {
    const seconds = await this.contract.timeUntilNextCheckIn(address);
    return seconds.toNumber();
  }

  async getLeaderboard(limit = 10) {
    return this.contract.getTopStreaks(limit);
  }
}
```

### Step 10: Monitoring & Maintenance

```javascript
// scripts/monitor.js
async function monitorContract() {
  // Check contract balance
  const balance = await bbToken.balanceOf(contractAddress);
  console.log("Contract BB balance:", ethers.utils.formatEther(balance));

  // Check daily statistics
  const stats = await checkIn.getDailyStats();
  console.log("Today's check-ins:", stats.checkIns);
  console.log("Rewards distributed:", ethers.utils.formatEther(stats.rewards));

  // Alert if low balance
  if (balance.lt(ethers.utils.parseEther("1000"))) {
    console.warn("⚠️ Contract balance low! Refill needed.");
  }
}

// Run daily
setInterval(monitorContract, 24 * 60 * 60 * 1000);
```

### Deployment Costs Estimate

```yaml
Base Network Deployment:
  Contract Deployment: ~$5-10 in ETH
  Verification: Free
  Initial Funding: 50,000 BB tokens

Ongoing Costs:
  User Check-in Gas: ~$0.01-0.02 (paid by user)
  Admin Updates: ~$0.01-0.05 per transaction

Total Initial Investment:
  ~$10 + value of BB tokens for rewards
```

### Security Checklist

- [ ] Contract audited by security firm
- [ ] Multi-sig wallet for owner address
- [ ] Emergency pause function tested
- [ ] Reentrancy guards in place
- [ ] Time manipulation resistant
- [ ] Overflow/underflow protection
- [ ] Access controls properly set
- [ ] Testnet thoroughly tested
- [ ] Monitoring alerts configured
- [ ] Backup admin keys secured

## 🎯 Next Steps

1. **Review and approve contract code**
2. **Set up development environment**
3. **Deploy to Base testnet**
4. **Run comprehensive tests**
5. **Security audit (optional but recommended)**
6. **Deploy to Base mainnet**
7. **Fund with BB tokens**
8. **Integrate with frontend**
9. **Beta test with small group**
10. **Full launch with marketing**

---

**Document Version:** 1.1.0
**Created:** January 2025
**Status:** Draft - Awaiting Review
**Author:** Bizarre Beasts Team

---

*This document outlines the comprehensive plan for implementing a gamified check-in system. All features, rewards, and mechanics are subject to change based on community feedback and technical constraints.*