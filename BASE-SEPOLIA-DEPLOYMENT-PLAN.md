# 🚀 Bizarre Beasts Check-In Contract: Base Sepolia Deployment Master Plan

## 📋 Executive Overview

This document provides a **CRITICAL** step-by-step deployment plan for the Bizarre Beasts Check-In smart contract on Base Sepolia testnet, followed by mainnet deployment. We'll leverage Thirdweb's powerful tools alongside traditional Hardhat for maximum reliability and efficiency.

**Timeline:** 2-3 weeks from start to mainnet
**Risk Level:** Low (with proper testing)
**Complexity:** Medium

---

## 🛠️ Tool Selection & Rationale

### **Primary Approach: Hybrid Strategy**
We'll use BOTH Thirdweb AND Hardhat for different aspects:

| Tool | Purpose | Why |
|------|---------|-----|
| **Thirdweb Deploy** | Initial deployment & management | No private key exposure, built-in dashboard, gas optimization |
| **Hardhat** | Development, testing, verification | Industry standard, comprehensive testing suite |
| **Thirdweb SDK** | Frontend integration | Seamless React/Next.js integration, wallet management |
| **OpenZeppelin** | Contract security | Battle-tested contract templates |

### **Thirdweb Advantages for Our Project:**
1. ✅ **Full Base Support** - Both Sepolia and mainnet
2. ✅ **No Private Key Risk** - Secure browser-based deployment
3. ✅ **Built-in Dashboard** - Monitor contract without custom tools
4. ✅ **Gas Optimization** - Automatic optimization on deployment
5. ✅ **React SDK** - Direct integration with our Next.js app
6. ✅ **Pre-audited Templates** - Reduce security risks

---

## 📝 Phase 1: Environment Setup (Day 1-2)

### Step 1.1: Create Contract Repository
```bash
# Create separate repo for contract code
mkdir bizarre-checkin-contracts
cd bizarre-checkin-contracts
git init

# Initialize with both Hardhat and Thirdweb
npm init -y
npm install --save-dev hardhat @thirdweb-dev/contracts
npm install @openzeppelin/contracts ethers dotenv
npx hardhat init
```

### Step 1.2: Configure Networks
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
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532,
      gasPrice: 1000000000, // 1 gwei
    },
    baseMainnet: {
      url: "https://mainnet.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 8453
    }
  },
  etherscan: {
    apiKey: {
      baseSepolia: process.env.BASESCAN_API_KEY,
      base: process.env.BASESCAN_API_KEY
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      }
    ]
  }
};
```

### Step 1.3: Environment Variables
```bash
# .env file
PRIVATE_KEY=your_deployment_wallet_private_key
BASESCAN_API_KEY=your_basescan_api_key
ALCHEMY_BASE_SEPOLIA_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
THIRDWEB_SECRET_KEY=your_thirdweb_secret_key

# Base Sepolia BB Token (deploy test token first)
BB_TOKEN_ADDRESS_SEPOLIA=0x...
# Base Mainnet BB Token
BB_TOKEN_ADDRESS_MAINNET=0x0520bf1d3cEE163407aDA79109333aB1599b4004
```

---

## 🏗️ Phase 2: Smart Contract Development (Day 3-5)

### Step 2.1: Core Contract Structure
```solidity
// contracts/BizarreCheckIn.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@thirdweb-dev/contracts/extension/PermissionsEnumerable.sol";

contract BizarreCheckIn is Ownable, ReentrancyGuard, Pausable, PermissionsEnumerable {
    // Constants
    uint256 public constant COOLDOWN_PERIOD = 20 hours;
    uint256 public constant STREAK_BREAK_PERIOD = 44 hours;
    uint256 public constant MAX_STREAK = 30;
    uint256 public constant RITUAL_THRESHOLD = 3;
    uint256 public constant FIVE_DAY_BONUS = 50 * 10**18; // 50 BB

    // Token reference
    IERC20 public immutable bbToken;

    // User data
    struct UserData {
        uint256 lastCheckIn;
        uint256 currentStreak;
        uint256 bestStreak;
        uint256 totalCheckIns;
        uint256 totalRewards;
        uint256 checkInCycles;
        uint256 ritualsCompleted;
        bool canCheckIn;
    }

    mapping(address => UserData) public users;

    // Tier rewards (in BB wei)
    mapping(string => uint256) public tierRewards;

    // Events
    event CheckIn(address indexed user, uint256 streak, uint256 reward);
    event StreakBroken(address indexed user, uint256 previousStreak);
    event MilestoneReached(address indexed user, uint256 milestone);
    event CycleCompleted(address indexed user, uint256 cycleNumber);

    constructor(address _bbToken) {
        bbToken = IERC20(_bbToken);

        // Initialize tier rewards
        tierRewards["BIZARRE"] = 20 * 10**18;
        tierRewards["WEIRDO"] = 15 * 10**18;
        tierRewards["ODDBALL"] = 12 * 10**18;
        tierRewards["MISFIT"] = 10 * 10**18;
        tierRewards["NORMIE"] = 5 * 10**18;
    }

    // Main check-in function
    function checkIn(string calldata empireTier) external nonReentrant whenNotPaused {
        UserData storage user = users[msg.sender];

        require(user.canCheckIn, "Complete rituals first");
        require(block.timestamp >= user.lastCheckIn + COOLDOWN_PERIOD, "Cooldown active");

        // Check if streak should be broken
        if (user.lastCheckIn > 0 &&
            block.timestamp > user.lastCheckIn + STREAK_BREAK_PERIOD) {
            emit StreakBroken(msg.sender, user.currentStreak);
            user.currentStreak = 0;
        }

        // Increment streak
        user.currentStreak++;
        user.totalCheckIns++;
        user.lastCheckIn = block.timestamp;

        // Calculate reward
        uint256 reward = calculateReward(empireTier, user.currentStreak);

        // Handle 30-day cycle
        if (user.currentStreak >= MAX_STREAK) {
            user.checkInCycles++;
            user.currentStreak = 0; // Reset for new cycle
            emit CycleCompleted(msg.sender, user.checkInCycles);

            // Bonus for cycle completion
            reward += 1000 * 10**18; // 1000 BB bonus
        }

        // Check milestones
        checkMilestones(msg.sender, user.currentStreak);

        // Update best streak
        if (user.currentStreak > user.bestStreak) {
            user.bestStreak = user.currentStreak;
        }

        // Transfer rewards
        require(bbToken.transfer(msg.sender, reward), "Reward transfer failed");
        user.totalRewards += reward;

        emit CheckIn(msg.sender, user.currentStreak, reward);
    }

    // Unlock check-in after ritual completion
    function unlockCheckIn(address userAddress, uint256 ritualsCompleted)
        external
        onlyRole(RITUAL_VERIFIER_ROLE)
    {
        require(ritualsCompleted >= RITUAL_THRESHOLD, "Not enough rituals");
        UserData storage user = users[userAddress];
        user.ritualsCompleted = ritualsCompleted;
        user.canCheckIn = true;
    }

    // Calculate rewards based on tier and streak
    function calculateReward(string calldata tier, uint256 streak)
        public
        view
        returns (uint256)
    {
        uint256 baseReward = tierRewards[tier];
        if (baseReward == 0) baseReward = tierRewards["NORMIE"];

        // 5-day bonus
        uint256 bonus = 0;
        if (streak % 5 == 0) {
            bonus = FIVE_DAY_BONUS;
        }

        return baseReward + bonus;
    }

    // Check and award milestones
    function checkMilestones(address userAddress, uint256 streak) internal {
        if (streak == 7) {
            emit MilestoneReached(userAddress, 7);
            // Mint Week Warrior NFT (integrate with NFT contract)
        } else if (streak == 14) {
            emit MilestoneReached(userAddress, 14);
            // Mint Fortnight Fighter NFT
        } else if (streak == 30) {
            emit MilestoneReached(userAddress, 30);
            // Mint Bizarre Legend NFT
        }
    }

    // Admin functions
    function updateTierReward(string calldata tier, uint256 reward)
        external
        onlyOwner
    {
        tierRewards[tier] = reward;
    }

    function withdrawTokens(uint256 amount) external onlyOwner {
        require(bbToken.transfer(owner(), amount), "Withdrawal failed");
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // View functions
    function getUserData(address userAddress) external view returns (UserData memory) {
        return users[userAddress];
    }

    function canUserCheckIn(address userAddress) external view returns (bool) {
        UserData memory user = users[userAddress];
        return user.canCheckIn &&
               block.timestamp >= user.lastCheckIn + COOLDOWN_PERIOD;
    }

    function timeUntilNextCheckIn(address userAddress) external view returns (uint256) {
        UserData memory user = users[userAddress];
        if (block.timestamp >= user.lastCheckIn + COOLDOWN_PERIOD) {
            return 0;
        }
        return (user.lastCheckIn + COOLDOWN_PERIOD) - block.timestamp;
    }
}
```

### Step 2.2: Test Token for Sepolia
```solidity
// contracts/TestBBToken.sol (ONLY for Sepolia testing)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestBBToken is ERC20 {
    constructor() ERC20("Test Bizarre Beast", "tBB") {
        _mint(msg.sender, 1000000 * 10**18); // 1M test tokens
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

---

## 🧪 Phase 3: Testing Suite (Day 6-7)

### Step 3.1: Comprehensive Test Suite
```javascript
// test/BizarreCheckIn.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BizarreCheckIn", function () {
  let checkIn, bbToken, owner, user1, user2, ritualVerifier;

  beforeEach(async function () {
    [owner, user1, user2, ritualVerifier] = await ethers.getSigners();

    // Deploy test token
    const TestBBToken = await ethers.getContractFactory("TestBBToken");
    bbToken = await TestBBToken.deploy();

    // Deploy check-in contract
    const BizarreCheckIn = await ethers.getContractFactory("BizarreCheckIn");
    checkIn = await BizarreCheckIn.deploy(bbToken.address);

    // Fund check-in contract
    await bbToken.transfer(checkIn.address, ethers.utils.parseEther("100000"));

    // Grant ritual verifier role
    const RITUAL_VERIFIER_ROLE = await checkIn.RITUAL_VERIFIER_ROLE();
    await checkIn.grantRole(RITUAL_VERIFIER_ROLE, ritualVerifier.address);
  });

  describe("Check-in flow", function () {
    it("Should require ritual completion before check-in", async function () {
      await expect(
        checkIn.connect(user1).checkIn("NORMIE")
      ).to.be.revertedWith("Complete rituals first");
    });

    it("Should unlock after 3 rituals", async function () {
      await checkIn.connect(ritualVerifier).unlockCheckIn(user1.address, 3);
      const userData = await checkIn.getUserData(user1.address);
      expect(userData.canCheckIn).to.be.true;
    });

    it("Should enforce 20-hour cooldown", async function () {
      // Unlock and first check-in
      await checkIn.connect(ritualVerifier).unlockCheckIn(user1.address, 3);
      await checkIn.connect(user1).checkIn("NORMIE");

      // Try immediate second check-in
      await expect(
        checkIn.connect(user1).checkIn("NORMIE")
      ).to.be.revertedWith("Cooldown active");

      // Fast forward 20 hours
      await time.increase(20 * 3600);

      // Should work now
      await checkIn.connect(user1).checkIn("NORMIE");
      const userData = await checkIn.getUserData(user1.address);
      expect(userData.currentStreak).to.equal(2);
    });

    it("Should break streak after 44 hours", async function () {
      await checkIn.connect(ritualVerifier).unlockCheckIn(user1.address, 3);
      await checkIn.connect(user1).checkIn("NORMIE");

      // Fast forward 45 hours (past break period)
      await time.increase(45 * 3600);

      await checkIn.connect(user1).checkIn("NORMIE");
      const userData = await checkIn.getUserData(user1.address);
      expect(userData.currentStreak).to.equal(1); // Reset to 1
    });

    it("Should give 5-day bonus", async function () {
      await checkIn.connect(ritualVerifier).unlockCheckIn(user1.address, 3);

      // Check in for 5 days
      for (let i = 0; i < 5; i++) {
        await checkIn.connect(user1).checkIn("NORMIE");
        if (i < 4) await time.increase(20 * 3600);
      }

      const userData = await checkIn.getUserData(user1.address);
      // 5 days * 5 BB + 50 BB bonus = 75 BB
      expect(userData.totalRewards).to.equal(ethers.utils.parseEther("75"));
    });

    it("Should reset after 30-day cycle", async function () {
      await checkIn.connect(ritualVerifier).unlockCheckIn(user1.address, 3);

      // Check in for 30 days
      for (let i = 0; i < 30; i++) {
        await checkIn.connect(user1).checkIn("NORMIE");
        if (i < 29) await time.increase(20 * 3600);
      }

      const userData = await checkIn.getUserData(user1.address);
      expect(userData.currentStreak).to.equal(0); // Reset
      expect(userData.checkInCycles).to.equal(1); // One cycle complete
    });
  });

  describe("Tier rewards", function () {
    it("Should give correct rewards per tier", async function () {
      await checkIn.connect(ritualVerifier).unlockCheckIn(user1.address, 3);

      const balanceBefore = await bbToken.balanceOf(user1.address);
      await checkIn.connect(user1).checkIn("BIZARRE");
      const balanceAfter = await bbToken.balanceOf(user1.address);

      // BIZARRE tier = 20 BB
      expect(balanceAfter.sub(balanceBefore)).to.equal(
        ethers.utils.parseEther("20")
      );
    });
  });

  describe("Admin functions", function () {
    it("Should allow owner to pause", async function () {
      await checkIn.pause();
      expect(await checkIn.paused()).to.be.true;
    });

    it("Should allow owner to update tier rewards", async function () {
      await checkIn.updateTierReward("BIZARRE", ethers.utils.parseEther("25"));
      expect(await checkIn.tierRewards("BIZARRE")).to.equal(
        ethers.utils.parseEther("25")
      );
    });
  });
});
```

### Step 3.2: Gas Optimization Tests
```javascript
// test/GasOptimization.test.js
describe("Gas Optimization", function () {
  it("Should measure gas for check-in", async function () {
    // Setup
    await checkIn.connect(ritualVerifier).unlockCheckIn(user1.address, 3);

    // Measure gas
    const tx = await checkIn.connect(user1).checkIn("NORMIE");
    const receipt = await tx.wait();

    console.log("Check-in gas used:", receipt.gasUsed.toString());
    expect(receipt.gasUsed).to.be.lessThan(150000); // Target: under 150k gas
  });
});
```

---

## 🚀 Phase 4: Deployment Process (Day 8-10)

### Step 4.1: Deploy to Base Sepolia

#### Option A: Using Thirdweb (RECOMMENDED)
```bash
# Install Thirdweb CLI
npm install -g @thirdweb-dev/cli

# Deploy via Thirdweb
npx thirdweb deploy

# This will:
# 1. Compile your contracts
# 2. Upload to IPFS
# 3. Open browser for deployment
# 4. No private key needed!
# 5. Select "Base Sepolia" from chain list
# 6. Set constructor parameters
# 7. Deploy with built-in verification
```

#### Option B: Using Hardhat (Traditional)
```javascript
// scripts/deploy-sepolia.js
const hre = require("hardhat");

async function main() {
  console.log("Deploying to Base Sepolia...");

  // Deploy test token first
  const TestBBToken = await hre.ethers.getContractFactory("TestBBToken");
  const bbToken = await TestBBToken.deploy();
  await bbToken.deployed();
  console.log("Test BB Token deployed to:", bbToken.address);

  // Deploy check-in contract
  const BizarreCheckIn = await hre.ethers.getContractFactory("BizarreCheckIn");
  const checkIn = await BizarreCheckIn.deploy(bbToken.address);
  await checkIn.deployed();
  console.log("BizarreCheckIn deployed to:", checkIn.address);

  // Fund contract with test tokens
  await bbToken.transfer(checkIn.address, ethers.utils.parseEther("10000"));
  console.log("Contract funded with 10,000 test BB");

  // Verify on BaseScan
  console.log("Waiting for blocks...");
  await checkIn.deployTransaction.wait(5);

  await hre.run("verify:verify", {
    address: checkIn.address,
    constructorArguments: [bbToken.address],
  });

  console.log("Contract verified on BaseScan!");

  return {
    bbToken: bbToken.address,
    checkIn: checkIn.address
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

```bash
# Deploy command
npx hardhat run scripts/deploy-sepolia.js --network baseSepolia
```

### Step 4.2: Post-Deployment Setup
```javascript
// scripts/setup-sepolia.js
async function setupContract() {
  const checkInAddress = "0x..."; // From deployment
  const checkIn = await ethers.getContractAt("BizarreCheckIn", checkInAddress);

  // 1. Grant ritual verifier role to backend wallet
  const RITUAL_VERIFIER_ROLE = await checkIn.RITUAL_VERIFIER_ROLE();
  const backendWallet = "0x..."; // Your backend service wallet
  await checkIn.grantRole(RITUAL_VERIFIER_ROLE, backendWallet);
  console.log("Ritual verifier role granted");

  // 2. Verify tier rewards are set correctly
  console.log("BIZARRE reward:", await checkIn.tierRewards("BIZARRE"));
  console.log("WEIRDO reward:", await checkIn.tierRewards("WEIRDO"));

  // 3. Test with a small check-in
  // ... test transactions

  console.log("Setup complete!");
}
```

---

## 🔧 Phase 5: Frontend Integration (Day 11-12)

### Step 5.1: Install Thirdweb SDK
```bash
cd /Users/dylan/bizarrebeastsminiapp
npm install @thirdweb-dev/react @thirdweb-dev/sdk
```

### Step 5.2: Create Contract Service
```typescript
// lib/contracts/checkIn.ts
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { BaseSepoliaTestnet, Base } from "@thirdweb-dev/chains";

const CHECKIN_ADDRESS_SEPOLIA = process.env.NEXT_PUBLIC_CHECKIN_ADDRESS_SEPOLIA;
const CHECKIN_ADDRESS_MAINNET = process.env.NEXT_PUBLIC_CHECKIN_ADDRESS_MAINNET;

export class CheckInService {
  private sdk: ThirdwebSDK;
  private contract: any;

  constructor(signer?: any) {
    const chain = process.env.NEXT_PUBLIC_NETWORK === 'mainnet' ? Base : BaseSepoliaTestnet;
    this.sdk = new ThirdwebSDK(chain, {
      clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
    });

    const address = process.env.NEXT_PUBLIC_NETWORK === 'mainnet'
      ? CHECKIN_ADDRESS_MAINNET
      : CHECKIN_ADDRESS_SEPOLIA;

    this.contract = this.sdk.getContract(address);
  }

  async checkIn(empireTier: string) {
    const contract = await this.contract;
    const tx = await contract.call("checkIn", [empireTier]);
    return tx;
  }

  async getUserData(address: string) {
    const contract = await this.contract;
    return await contract.call("getUserData", [address]);
  }

  async canCheckIn(address: string) {
    const contract = await this.contract;
    return await contract.call("canUserCheckIn", [address]);
  }

  async getTimeUntilNextCheckIn(address: string) {
    const contract = await this.contract;
    const seconds = await contract.call("timeUntilNextCheckIn", [address]);
    return Number(seconds);
  }
}
```

### Step 5.3: Create Check-In Component
```typescript
// components/CheckInSection.tsx
import { useState, useEffect } from 'react';
import { CheckInService } from '@/lib/contracts/checkIn';
import { useWallet } from '@/hooks/useWallet';
import { empireService } from '@/lib/empire';

export default function CheckInSection({ ritualsCompleted }: { ritualsCompleted: number }) {
  const { address, isConnected } = useWallet();
  const [checkInService] = useState(() => new CheckInService());
  const [userData, setUserData] = useState<any>(null);
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (address) {
      loadUserData();
    }
  }, [address]);

  const loadUserData = async () => {
    try {
      const data = await checkInService.getUserData(address!);
      setUserData(data);

      const canCheck = await checkInService.canCheckIn(address!);
      setCanCheckIn(canCheck);

      const timeLeft = await checkInService.getTimeUntilNextCheckIn(address!);
      setTimeUntilNext(timeLeft);
    } catch (error) {
      console.error('Error loading check-in data:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!address) return;

    setLoading(true);
    try {
      // Get user's Empire tier
      const empireData = await empireService.getUserByAddress(address);
      const tier = empireService.getUserTier(empireData?.rank || null);

      // Map AccessTier enum to contract tier string
      const tierMap = {
        'bizarre': 'BIZARRE',
        'weirdo': 'WEIRDO',
        'oddball': 'ODDBALL',
        'misfit': 'MISFIT',
        'normie': 'NORMIE'
      };

      await checkInService.checkIn(tierMap[tier]);

      // Reload data
      await loadUserData();

      // Show success animation
      showSuccessAnimation();
    } catch (error) {
      console.error('Check-in failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
}
```

---

## 🧪 Phase 6: Testnet Testing (Day 13-14)

### Testing Checklist

#### A. Contract Functions
- [ ] Deploy test BB token
- [ ] Deploy check-in contract
- [ ] Fund with test tokens
- [ ] Test ritual unlocking
- [ ] Test first check-in
- [ ] Test cooldown enforcement
- [ ] Test streak counting
- [ ] Test streak breaking
- [ ] Test 5-day bonus
- [ ] Test 30-day cycle
- [ ] Test tier rewards
- [ ] Test admin functions

#### B. Frontend Integration
- [ ] Wallet connection
- [ ] Check-in button display
- [ ] Cooldown timer
- [ ] Streak display
- [ ] Reward animation
- [ ] Error handling
- [ ] Mobile responsiveness

#### C. Edge Cases
- [ ] Multiple check-ins rapid fire
- [ ] Check-in at exact cooldown time
- [ ] Network failures
- [ ] Low gas situations
- [ ] Contract pause/unpause

### Test Users Setup
```javascript
// scripts/setup-test-users.js
async function setupTestUsers() {
  const addresses = [
    "0x...", // Test user 1
    "0x...", // Test user 2
    "0x...", // Test user 3
  ];

  for (const addr of addresses) {
    // Give test tokens
    await bbToken.transfer(addr, ethers.utils.parseEther("100"));

    // Unlock check-in
    await checkIn.connect(ritualVerifier).unlockCheckIn(addr, 3);

    console.log(`Test user ${addr} setup complete`);
  }
}
```

---

## 🚢 Phase 7: Mainnet Deployment (Day 15-16)

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Gas optimization complete
- [ ] Security review done
- [ ] Admin keys secured (multi-sig preferred)
- [ ] BB token allocation ready
- [ ] Backend ritual verifier ready
- [ ] Monitoring setup complete

### Mainnet Deployment Steps

1. **Deploy Contract**
```bash
# Using Thirdweb (recommended)
npx thirdweb deploy
# Select Base Mainnet
# Use real BB token address: 0x0520bf1d3cEE163407aDA79109333aB1599b4004
```

2. **Verify Contract**
```bash
npx hardhat verify --network base CONTRACT_ADDRESS BB_TOKEN_ADDRESS
```

3. **Initial Configuration**
```javascript
// scripts/setup-mainnet.js
async function setupMainnet() {
  const checkIn = await ethers.getContractAt("BizarreCheckIn", MAINNET_ADDRESS);

  // 1. Transfer 50,000 BB to contract
  const bbToken = await ethers.getContractAt("IERC20", BB_TOKEN_ADDRESS);
  await bbToken.transfer(MAINNET_ADDRESS, ethers.utils.parseEther("50000"));

  // 2. Set ritual verifier
  const RITUAL_VERIFIER_ROLE = await checkIn.RITUAL_VERIFIER_ROLE();
  await checkIn.grantRole(RITUAL_VERIFIER_ROLE, BACKEND_WALLET);

  // 3. Transfer ownership to multi-sig
  await checkIn.transferOwnership(MULTISIG_ADDRESS);

  console.log("Mainnet setup complete!");
}
```

---

## 📊 Phase 8: Monitoring & Maintenance

### Monitoring Setup
```javascript
// scripts/monitor.js
const { ethers } = require("ethers");
const { WebhookClient } = require("discord.js");

const webhook = new WebhookClient({ url: process.env.DISCORD_WEBHOOK });

async function monitorContract() {
  const provider = new ethers.providers.JsonRpcProvider(BASE_RPC);
  const checkIn = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

  // Monitor events
  checkIn.on("CheckIn", (user, streak, reward) => {
    webhook.send(`✅ Check-in: ${user} | Streak: ${streak} | Reward: ${ethers.utils.formatEther(reward)} BB`);
  });

  checkIn.on("CycleCompleted", (user, cycleNumber) => {
    webhook.send(`🎉 Cycle Complete: ${user} completed cycle ${cycleNumber}!`);
  });

  // Check contract balance
  setInterval(async () => {
    const balance = await bbToken.balanceOf(CONTRACT_ADDRESS);
    const formatted = ethers.utils.formatEther(balance);

    if (parseFloat(formatted) < 1000) {
      webhook.send(`⚠️ LOW BALANCE: Only ${formatted} BB remaining!`);
    }
  }, 3600000); // Every hour
}

monitorContract();
```

### Maintenance Tasks
- **Daily:** Check contract balance, review check-in metrics
- **Weekly:** Analyze streak data, adjust rewards if needed
- **Monthly:** Full audit of rewards distributed vs. budget

---

## 🎯 Success Metrics

### Launch Targets (First Month)
| Metric | Target | Measurement |
|--------|--------|-------------|
| Contract Deployment | ✅ | On Base mainnet |
| Daily Active Check-ins | 100+ | Unique addresses/day |
| Average Streak | 5+ days | Mean of all active |
| BB Distributed | < 100k | Total rewards |
| Gas per Check-in | < $0.05 | USD equivalent |

---

## 🚨 Emergency Procedures

### If Something Goes Wrong

1. **Contract Bug Found**
```solidity
// Immediately pause contract
await checkIn.pause();
// Assess damage
// Plan fix
// Deploy new version if needed
```

2. **Token Depletion**
```solidity
// Reduce rewards temporarily
await checkIn.updateTierReward("BIZARRE", ethers.utils.parseEther("10"));
// Add more tokens
await bbToken.transfer(CONTRACT_ADDRESS, amount);
```

3. **Exploit Detected**
```solidity
// Pause immediately
await checkIn.pause();
// Revoke compromised roles
await checkIn.revokeRole(ROLE, compromisedAddress);
// Investigate and patch
```

---

## 📚 Resources & Links

- **Base Sepolia Faucet:** https://www.alchemy.com/faucets/base-sepolia
- **Base Sepolia Explorer:** https://sepolia.basescan.org
- **Thirdweb Dashboard:** https://thirdweb.com/dashboard
- **Base Docs:** https://docs.base.org
- **OpenZeppelin Wizard:** https://wizard.openzeppelin.com
- **Hardhat Docs:** https://hardhat.org/docs

---

## ✅ Final Launch Checklist

### Technical
- [ ] Contract tested on Sepolia
- [ ] Gas optimization complete
- [ ] Frontend integration working
- [ ] Monitoring active
- [ ] Backup admin keys secured

### Business
- [ ] BB token allocation approved
- [ ] Reward economics reviewed
- [ ] Community announcement prepared
- [ ] Support documentation ready
- [ ] Launch date confirmed

### Security
- [ ] Contract audit (optional but recommended)
- [ ] Multi-sig wallet setup
- [ ] Emergency pause tested
- [ ] Rate limiting configured
- [ ] Backup deployment ready

---

**This is a CRITICAL deployment. Take your time, test thoroughly, and don't rush. The contract will handle real value, so security and reliability are paramount.**

*Document Version: 1.0.0*
*Created: January 2025*
*Status: Ready for Implementation*