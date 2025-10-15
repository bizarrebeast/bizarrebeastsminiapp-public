# BizarreBeasts Miniapp - Builder Statistics

*Generated: 2025-10-12*

## Executive Summary

- **Total Lines of Code:** 78,997 lines
- **Total Files:** 385 files
- **Total Commits:** 703 commits
- **Development Period:** 34 calendar days (Sept 5 - Oct 8, 2025)
- **Estimated Coding Time:** ~205 hours (~25.6 working days)
- **Average Productivity:** ~2,323 lines/day, ~21 commits/day

---

## Code Distribution by Type

### Pages (51 files)
- **Total Lines:** 40,686 lines
- **Location:** `app/` directory
- **Key Pages:**
  - NFT Minting (`/nft/mint/in-app-exclusive/`)
  - Contests System (`/contests/`)
  - Leaderboard (`/leaderboard/`)
  - Profile Pages (`/profile/`)
  - Ritual System (`/rituals/`)
  - Wallet Integration (`/wallet/`)

### Components (56 files)
- **Total Lines:** 16,847 lines
- **Location:** `components/` directory
- **Major Components:**
  - Navigation (Navbar, Bottom Navigation)
  - Authentication (Farcaster SDK Sync, Unified Auth)
  - Contest Voting UI
  - NFT Display Components
  - Leaderboard Tables
  - Ritual Cards & Timers

### Libraries (48 files)
- **Total Lines:** 10,863 lines
- **Location:** `lib/` directory
- **Core Libraries:**
  - Web3 Integration (`web3.ts`, `unified-provider.ts`)
  - Farcaster Miniapp SDK Integration
  - Database Clients (Supabase)
  - Feature Flags System
  - Authentication Services
  - Analytics Tracking

### API Routes (95 files)
- **Estimated Lines:** ~10,000 lines
- **Location:** `app/api/` directory
- **Major API Groups:**
  - `/api/neynar/` - Farcaster data integration
  - `/api/contests/` - Contest management & voting
  - `/api/leaderboard/` - Scoring & rankings
  - `/api/rituals/` - Daily ritual tracking
  - `/api/nft/` - NFT metadata & minting
  - `/api/profile/` - User profile data
  - `/api/auth/` - Authentication endpoints

### Smart Contracts (4 files)
- **Total Lines:** 870 lines Solidity
- **Location:** `contracts/` directory
- **Contracts:**
  - `BizarreBeasts.sol` - Main NFT contract
  - `InAppExclusiveNFT.sol` - Miniapp-exclusive NFTs
  - Additional contract utilities

### Database (64 files)
- **Total Lines:** 8,496 lines SQL
- **Location:** `supabase/migrations/`
- **Schema:**
  - User profiles & wallet linking
  - Contest entries & voting
  - Leaderboard scoring
  - NFT ownership tracking
  - Ritual completion history
  - Analytics events

### Configuration Files
- TypeScript config, Next.js config, Tailwind config
- Environment variables & deployment configs
- Testing setup (Playwright, Jest)

---

## Development Timeline

### Commit Activity

- **Total Commits:** 703
- **Time Period:** 34 calendar days (Sept 5 - Oct 8, 2025)
- **Average:** 20.7 commits/day
- **Estimated Sessions:** 150 coding sessions
- **Average Session:** 82 minutes

### Peak Productivity

**Busiest Days:**
1. September 8: 61 commits
2. September 10: 60 commits
3. September 6: 52 commits
4. September 9: 51 commits
5. September 5: 50 commits

**Peak Hours (by commit count):**
1. 6am-7am: 82 commits (early bird!)
2. 7am-8am: 62 commits
3. 3pm-4pm: 53 commits
4. 4pm-5pm: 51 commits
5. 2pm-3pm: 50 commits

**Day of Week Distribution:**
- Monday: 159 commits (most productive)
- Wednesday: 129 commits
- Thursday: 120 commits
- Friday: 114 commits
- Tuesday: 91 commits
- Saturday: 72 commits
- Sunday: 18 commits

### Coding Time Estimate

**Methodology:**
- Used commit timestamp clustering
- Sessions defined by 2-hour threshold
- Added 30-minute buffer per session

**Results:**
- **Total Estimated Hours:** 205 hours
- **Working Days (8hr/day):** 25.6 days
- **Average Session Length:** 82 minutes
- **Estimated Sessions:** 150

---

## Technical Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Animation:** Framer Motion

### Blockchain
- **Network:** Base (Ethereum L2)
- **Library:** ethers.js v6
- **Wallet Integration:**
  - Farcaster Miniapp SDK
  - Privy (desktop)
  - EIP-1193 providers
- **Smart Contracts:** Solidity 0.8.x

### Backend
- **API:** Next.js API Routes (App Router)
- **Database:** Supabase (PostgreSQL)
- **External APIs:**
  - Neynar (Farcaster data)
  - Alchemy (blockchain indexing)
  - Pinata (IPFS)

### Authentication
- **Farcaster:** Miniapp SDK with verified addresses
- **Desktop:** Privy wallet authentication
- **Unified:** Custom auth store merging both contexts

---

## Key Features Implemented

### 1. NFT Minting System
- In-app exclusive NFT minting
- $BB token approval flow
- Network detection & switching
- Transaction polling via public RPC
- Farcaster mobile support (complex provider handling)

### 2. Contest System
- Creative contest creation (admin only)
- Entry submission via Farcaster casts
- Community voting mechanism
- Winner selection & prize distribution
- Leaderboard integration

### 3. Ritual System
- Daily check-in challenges
- Streak tracking
- Point rewards
- Time-based unlocking
- Persistent state management

### 4. Leaderboard
- Multi-metric scoring (contests, rituals, swaps, tips)
- Real-time updates
- Historical tracking
- Profile integration

### 5. Web3 Integration
- Token swaps (ETH ↔ $BB)
- Tipping system
- Balance checking
- Transaction history
- Multi-wallet support

### 6. Dual-Context Authentication
- Farcaster miniapp context detection
- Desktop wallet connection
- Unified user profile
- Verified address handling

---

## Major Technical Challenges Solved

### 1. Farcaster Provider Limitations
**Problem:** Farcaster wallet provider supports signing but not all read methods (eth_getTransactionReceipt, contract state reads)

**Solution:** Implemented separate provider pattern:
- Public RPC for reads (balanceOf, allowance, receipts)
- Wallet provider for writes (approve, mint, transfer)

### 2. Network Switching Race Conditions
**Problem:** Network switch requests succeeded but provider used before switch completed

**Solution:**
- Added 3-second delay after switch
- Implemented network verification step
- Clear error messages for incomplete switches

### 3. Dual Authentication Context
**Problem:** Different auth flows for Farcaster vs desktop

**Solution:**
- Created unified auth store
- Priority-based provider detection
- Shared wallet address across contexts

### 4. Transaction Confirmation
**Problem:** tx.wait() failed on Farcaster due to unsupported RPC method

**Solution:**
- Custom waitForTransaction() helper
- Polling via public RPC with 2-second intervals
- 120-second timeout with clear errors

---

## Code Quality Metrics

### TypeScript Coverage
- **Full TypeScript:** All source files
- **Type Safety:** Strict mode enabled
- **Interface-driven:** Extensive type definitions

### Component Architecture
- **Reusable Components:** 56 components
- **Page Components:** 51 routes
- **Server Components:** Extensive use of RSC
- **Client Components:** Interactive UI with 'use client'

### API Design
- **RESTful Endpoints:** 95 API routes
- **Error Handling:** Consistent error responses
- **Authentication:** Middleware-based auth checks
- **Rate Limiting:** Protected endpoints

### Database Design
- **64 Migrations:** Incremental schema evolution
- **Row-Level Security:** Supabase RLS policies
- **Indexes:** Optimized query performance
- **Relationships:** Foreign keys & constraints

---

## Deployment & Infrastructure

### Hosting
- **Platform:** Vercel
- **Environment:** Production + Preview
- **Domain:** Custom domain configured
- **SSL:** Automatic HTTPS

### Database
- **Provider:** Supabase
- **Tier:** Pro plan
- **Backups:** Automatic daily backups
- **Monitoring:** Real-time analytics

### Blockchain
- **Network:** Base Mainnet
- **RPC Provider:** Base public RPC + LlamaRPC fallback
- **Contracts Deployed:** 2 NFT contracts on Base

### Monitoring
- **Analytics:** Custom event tracking
- **Error Tracking:** Console logging (production)
- **Performance:** Next.js analytics

---

## Future Considerations

### Feature Flags Implemented
- Contests: Enabled
- Contest Admin: Restricted
- Contest Voting: Enabled
- Profiles: Enabled
- Meme Gallery: Opt-in (planned)
- Analytics: Enabled
- Test Pages: Disabled (debugging complete)

### Scalability
- Supabase can handle 10k+ concurrent users
- Next.js Edge Functions for global performance
- Static generation where possible
- Client-side caching strategies

---

## Development Patterns Used

### State Management
- Zustand stores for global state
- React hooks for local state
- Server state via API routes

### Error Handling
- Try-catch with detailed logging
- User-friendly error messages
- Fallback providers for resilience

### Code Organization
- Feature-based folder structure
- Shared utilities in /lib
- Consistent naming conventions

### Performance
- Code splitting via dynamic imports
- Image optimization with Next.js Image
- Lazy loading for heavy components
- Memoization where appropriate

---

## Statistics Generation Commands

```bash
# Lines of code by directory
find app -name "*.tsx" -o -name "*.ts" | xargs wc -l
find components -name "*.tsx" -o -name "*.ts" | xargs wc -l
find lib -name "*.ts" | xargs wc -l

# Commit history
git log --format="%at" --reverse > /tmp/commits.txt
git log --oneline | wc -l

# Commit activity by hour
git log --format="%ad" --date=format:"%H" | sort | uniq -c | sort -rn

# Commit activity by day of week
git log --format="%ad" --date=format:"%A" | sort | uniq -c | sort -rn

# Commit activity by date
git log --format="%as" | sort | uniq -c | sort -rn
```

---

*Built with dedication and lots of coffee ☕*
