# BizarreFlip Smart Contract

## Overview

Simple deposit/withdraw contract for the BizarreBeasts coin flip game using **only audited OpenZeppelin contracts**.

## Architecture

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ 1. Deposit $BB
       ▼
┌─────────────────────┐
│ BizarreFlip Contract│
│                     │
│ • Holds user funds  │
│ • Tracks balances   │
│ • Pausable          │
└──────┬──────────────┘
       │ 2. Backend updates balance
       │    after each game
       ▼
┌─────────────┐
│   Backend   │
│             │
│ • Game logic│
│ • Provably  │
│   fair      │
└─────────────┘
```

## Key Features

- ✅ **OpenZeppelin v5.4.0** - Latest stable, all audited code
- ✅ **Off-chain games** - Fast gameplay, zero gas during bets
- ✅ **ReentrancyGuard** - Protection against reentrancy attacks
- ✅ **Pausable** - Emergency stop mechanism
- ✅ **House Reserve** - Separate accounting for player funds vs house
- ✅ **Health Check** - Ensures contract has enough reserves
- ✅ **Forced Withdrawals** - Automatic risk management for large balances
- ✅ **Max Balance Limits** - Caps user deposits at 100K $BB, balances at 10M $BB

## User Flow

```
1. User deposits 100K $BB
   → Contract holds funds
   → User balance: 100K

2. User plays 5 games (off-chain, instant)
   → Backend updates: user balance = 150K
   → Contract still holds funds

3. User withdraws 150K $BB
   → Contract transfers tokens
   → User balance: 0
```

## Risk Management

### Balance Limits

The contract enforces strict limits to minimize exposure:

```
MIN_DEPOSIT:            1,000 $BB
MAX_DEPOSIT:          500,000 $BB (matches max bet)
MAX_BALANCE:       10,000,000 $BB (forced withdrawal trigger)
FORCE_WITHDRAW_TARGET: 1,000,000 $BB (withdraw down to this)
```

### Forced Withdrawal Flow

When a user's balance exceeds 10M $BB:

1. Contract emits `ForceWithdrawalRequired` event
2. Backend shows modal: "You must withdraw excess winnings"
3. User must withdraw balance down to 500K $BB
4. Cannot place new bets until withdrawal complete

**Example:**
```
User wins big streak → balance = 12M $BB
Contract: "Withdraw 11M $BB" (down to 1M)
User withdraws → balance = 1M $BB
Can continue playing
```

This protects the house reserve and limits single-user exposure.

## Deployment

### Prerequisites

```bash
cd contracts
npm install
```

### Deploy to Base Sepolia (Testnet)

```bash
npx hardhat run scripts/deploy.js --network base-sepolia
```

### Deploy to Base Mainnet

```bash
npx hardhat run scripts/deploy.js --network base-mainnet
```

## Contract Functions

### User Functions

```solidity
// Deposit $BB tokens
deposit(uint256 amount)

// Withdraw specific amount
withdraw(uint256 amount)

// Withdraw all balance
withdrawAll()

// Check your balance
balances(address user) returns (uint256)
```

### Owner Functions (Backend)

```solidity
// Update user balance after game
updateBalance(address user, uint256 newBalance, string reason)

// Fund house reserve for payouts
fundHouseReserve(uint256 amount)

// Emergency pause
pause()
unpause()

// Check contract health
isHealthy() returns (bool)
```

## Security

### What's Secure

- ✅ Uses battle-tested OpenZeppelin contracts
- ✅ ReentrancyGuard on all transfers
- ✅ Pausable for emergencies
- ✅ SafeERC20 for safe token transfers
- ✅ Owner controls (backend only)

### What to Secure

- 🔐 **Owner Private Key** - Use hardware wallet or multisig
- 🔐 **Backend API** - Ensure only authorized updates
- 🔐 **Database** - Match contract balances with DB

### Audit Checklist

- [ ] Verify OpenZeppelin version (latest)
- [ ] Test deposit/withdraw flow on testnet
- [ ] Test balance update logic
- [ ] Test pause functionality
- [ ] Verify owner key security (multisig)
- [ ] Test emergency withdraw
- [ ] Load test with multiple users

## Gas Costs (Base Network)

| Function | Gas Cost | USD (est) |
|----------|----------|-----------|
| deposit() | ~50,000 | $0.01-0.02 |
| withdraw() | ~45,000 | $0.01-0.02 |
| updateBalance() | ~30,000 | $0.01 |

**User cost per session**: ~$0.02-0.04 (deposit + withdraw)

## House Reserve Management

The contract separates user deposits from house funds:

```
Contract Balance = User Deposits + House Reserve
```

**Example:**
```
Users deposit: 100M $BB
House funds: 50M $BB
Contract holds: 150M $BB

User wins 20M $BB:
- User balance increases by 20M
- House reserve decreases by 20M
- Total still 150M $BB
```

## Integration with Backend

### When user wins:

```typescript
// Backend API
const newBalance = oldBalance + winnings;
await contract.updateBalance(
  userAddress,
  newBalance,
  `won_${winnings}`
);
```

### When user loses:

```typescript
// Backend API
const newBalance = oldBalance - betAmount;
await contract.updateBalance(
  userAddress,
  newBalance,
  `lost_${betAmount}`
);
```

## Emergency Procedures

### If contract needs to pause:

```bash
# From owner wallet
cast send $CONTRACT_ADDRESS "pause()" --private-key $OWNER_KEY
```

### If users need to withdraw during pause:

```bash
# Unpause temporarily
cast send $CONTRACT_ADDRESS "unpause()" --private-key $OWNER_KEY

# Let users withdraw
# ...

# Pause again
cast send $CONTRACT_ADDRESS "pause()" --private-key $OWNER_KEY
```

## Testing

```bash
npx hardhat test
```

See `test/BizarreFlip.test.js` for full test suite.

## License

MIT

## Contract Address

**Base Sepolia (Testnet):** TBD
**Base Mainnet:** TBD

## $BB Token Address

**Base Mainnet:** `0x0520bf1d3cEE163407aDA79109333aB1599b4004`
