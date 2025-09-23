# BizarreBeasts Miniapp 🎨

A production-ready Farcaster miniapp for the BizarreBeasts ecosystem featuring advanced meme generation, Base Smart Wallet support, games hub, Empire integration, and token swapping.

**🔗 Live:** [bbapp.bizarrebeasts.io](https://bbapp.bizarrebeasts.io)

## 📚 Important Documentation

- **[PROGRESS_LOG_2025-01-23.md](./PROGRESS_LOG_2025-01-23.md)** - Critical security fixes and ritual sharing restoration (Jan 23, 2025)
- **[SECURITY_GUIDE.md](./SECURITY_GUIDE.md)** - Comprehensive security documentation with latest hardening updates
- **[AUTHENTICATION_FIXES.md](./AUTHENTICATION_FIXES.md)** - Complete authentication system fixes and implementation details (Jan 2025)
- **[SESSION_SUMMARY.md](./SESSION_SUMMARY.md)** - Latest contest system implementation details
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Database migration and setup guide for contest system
- **[SHARING-IMPLEMENTATION-GUIDE.md](./SHARING-IMPLEMENTATION-GUIDE.md)** - Complete guide to sharing features and implementation

## 🚀 Core Features

### 🔐 Unified Authentication System (FIXED Jan 2025)
- **Dual Identity Support**: Combines Farcaster (social) and Wallet (financial) identities
- **Auto-Linking**: Automatically links accounts using verified addresses from Farcaster
- **Persistent Sessions**: Sessions maintained across browser refreshes and app visits
- **Profile Unification**: Single profile displaying both wallet and Farcaster information
- **Smart Wallet Integration**: Coinbase Smart Wallet support with no seed phrases required
- **Dual Authentication Paths**: SDK for Farcaster miniapp, Neynar OAuth for PWA/browser
- **Automatic Wallet Connection**: Auto-connects verified addresses for Farcaster users
- **Single Source of Truth**: FarcasterSDKSync manages all authentication state

### 💳 Base Smart Wallet Integration
- **Coinbase Smart Wallet**: No seed phrases required - create wallets with just a Coinbase account
- **One-Click Connect**: Seamless wallet connection via Reown AppKit
- **Auto-Reconnection**: Wallet persists across sessions
- **Multi-Network Support**: Base (primary), Ethereum, Arbitrum, Polygon
- **Mobile Optimized**: Full support on all devices

### 🎨 Meme Generator
- **Multiple Sticker Collections**: BizarreBeasts, Treasure Quest, VibeCards
- **Canvas Creation**: Powered by Fabric.js v6 with drag-and-drop interface
- **Text Overlays**: Customizable colors, fonts (Impact, Arial, Comic Sans), and styles
- **Backgrounds**: Transparent, solid colors, or custom uploads (Elite tier)
- **Smart Alignment**: Snap-to-grid and edge snapping for precise composition
- **Export Options**: 800x800px PNG/JPEG with optional watermark
- **Farcaster Sharing**: Native integration via composeCast API
- **Empire Tier Gating**: Features unlocked based on $BB holdings
- **Download Modal**: Clear save instructions with right-click guidance

### 🏰 Empire Leaderboard
- **Live Rankings**: Real-time leaderboard based on $BB holdings
- **5-Tier System**:
  - **Elite** (10M+ $BB): All features, no watermark, custom uploads
  - **Champion** (1M-10M $BB): Premium features, no watermark  
  - **Veteran** (100K-1M $BB): Premium collections, optional watermark
  - **Member** (10K-100K $BB): Basic collections, watermark removal
  - **Visitor** (<10K $BB): Basic access with watermark
- **Search Functionality**: Find users by wallet address or username
- **Social Sharing**: Share rank cards directly to Farcaster
- **Multiplier Tracking**: View boosters and bonuses in real-time

### 🎯 Daily BIZARRE Rituals
- **9 Daily Challenges**: Interactive tasks to engage with the ecosystem
- **Progress Tracking**: localStorage with daily reset at midnight UTC
- **Featured Rituals**: Temporary/sponsored tasks with expiration dates
- **Individual Sharing**: Share each ritual completion on Farcaster
- **Cross-Page Syncing**: Rituals complete across different pages
- **Visual Progress**: Checkmarks, counters, and progress indicators

### 💱 Token Swap
- **Embedded Uniswap**: Full trading interface via iframe
- **$BB Pre-Selected**: Default output token configuration
- **DexScreener Integration**: Live price charts
- **Token Information**: Contract address and network details
- **Mobile Responsive**: Optimized for all screen sizes

### 🎮 Games Hub
- **8 BizarreBeasts Games**: 130K+ total plays tracked
- **Featured Game**: Treasure Quest with 50+ levels
- **Platform Links**: Remix, TheBase.App, external URLs
- **Visual Game Cards**: Square banners with play statistics
- **Game Soundtracks**: Original music by @kateyarter

### 🎵 Music & Soundtracks
- **Original Compositions**: Game soundtracks and themes
- **Streaming Links**: Spotify, Apple Music, Amazon Music
- **Album Artwork**: Visual covers for each track
- **NFT Collections**: Links to music NFTs

### 🏆 Contest System (NEW)
- **Dual Button System**: Separate CTA and submission buttons for clarity
- **Contest Types**: Game score, creative/meme, onboarding, and tiered contests
- **CTA Tracking**: Analytics for button clicks and user engagement
- **Voting System**: Community voting with one-vote-per-wallet restriction
- **Admin Panel**: Full CRUD operations for contest management
- **Smart Defaults**: Contest-type-specific button text and icons
- **External Links**: Support for games, tools, and third-party integrations
- **Mobile Optimized**: Responsive layouts with stacked button variants

## 🛠️ Technical Stack

- **Framework**: Next.js 15 with TypeScript and React 19
- **Styling**: Tailwind CSS (custom gem-themed design system)
- **Canvas**: Fabric.js v6 for meme generation
- **State Management**: Zustand v5
- **Wallet Integration**: Reown AppKit (WalletConnect v2) + Ethers v6
- **Farcaster SDK**: @farcaster/miniapp-sdk v0.1.10
- **Blockchain**: Base Network (primary)
- **Deployment**: Vercel with edge optimization

## 📁 Project Structure

```
/app                    # Next.js 15 app directory
  /api                 # API routes
    /admin            # Admin endpoints
      /contests       # Contest CRUD operations
    /contests         # Contest APIs
      /track-cta      # CTA click tracking
      /vote           # Voting system
    /empire           # Empire API proxy
    /upload-temp      # Temporary image storage
    /image            # Image serving endpoint
  /admin              # Admin panel
    /contests         # Contest management
  /contests           # Contest pages
    /[id]             # Contest detail page
  /meme-generator     # Meme creation with canvas
  /swap               # Token swap interface
  /games              # Games hub
  /empire             # Live leaderboard
  /rituals            # Daily challenges
  /music              # Soundtracks
  /resources          # Community links

/components
  /admin              # Admin components
    CreateContestForm.tsx # Contest creation
    EditContestForm.tsx   # Contest editing
  /canvas             # Meme canvas components
    MemeCanvas.tsx    # Main canvas with Fabric.js
    StickerGallery.tsx # Tier-gated collections
  /contests           # Contest components
    ContestActionButtons.tsx # Dual button system
    VotingGallery.tsx        # Voting interface
  /wallet             # Wallet connection UI
  /navigation         # Navigation components

/lib
  supabase.ts         # Supabase client & types
  web3.ts             # Wallet configuration
  farcaster.ts        # Farcaster integration
  sdk-ultimate.ts     # Bulletproof SDK init
  mobile-utils.ts     # Mobile helpers

/contexts
  FarcasterContext.tsx # Farcaster state
  SDKContext.tsx       # SDK management

/supabase             # Database migrations
  complete_migration.sql     # Full contest system
  add_cta_fields.sql        # CTA fields
  create_voting_tables.sql  # Voting system

/public
  /assets             # Images and media
  manifest.json       # PWA manifest
  farcaster.json      # Miniapp config
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- WalletConnect Project ID

### Installation

```bash
# Clone the repository
git clone https://github.com/bizarrebeast/bizarrebeastsminiapp.git

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev

# Build for production
npm run build
```

### Environment Variables

```env
# Wallet & Web3
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# API Endpoints
NEXT_PUBLIC_EMPIRE_API_URL=https://bizarrebeasts.win/api
NEXT_PUBLIC_FARCASTER_MANIFEST_URL=/farcaster.json

# Supabase (Database with Unified Auth & Contests)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Server-side only

# Unified Authentication (Farcaster Integration)
NEYNAR_API_KEY=your_neynar_api_key              # Server-side only
NEXT_PUBLIC_NEYNAR_CLIENT_ID=your_client_id

# Admin Configuration
NEXT_PUBLIC_ADMIN_WALLETS=comma,separated,admin,wallets

# Feature Flags
NEXT_PUBLIC_ENABLE_CONTESTS=true                # Contest system toggle
NEXT_PUBLIC_ENABLE_CONTEST_ADMIN=true          # Admin panel toggle
NEXT_PUBLIC_CONTEST_ADMIN_WALLET=0x...         # Contest admin wallet

# Optional: Storage (for contest submissions)
R2_ACCESS_KEY_ID=your_r2_access_key            # Server-side only
R2_SECRET_ACCESS_KEY=your_r2_secret            # Server-side only
R2_BUCKET_NAME=your_bucket_name
NEXT_PUBLIC_R2_PUBLIC_URL=your_public_url
```

## 🎯 Key Features Explained

### Unified Authentication System
The app combines Farcaster (social) and Wallet (financial) identities into a single user experience:
- **Auto-Linking**: When users connect both a wallet and Farcaster account, the system automatically links them if the wallet address is verified on Farcaster
- **Persistent Sessions**: User sessions are maintained across browser refreshes and app visits using Zustand with localStorage
- **Profile Unification**: Single profile page showing both wallet info (Empire tier, $BB holdings) and Farcaster info (username, FID, display name)
- **Database Integration**: All user data stored in Supabase with the `unified_users` table structure

### Smart Wallet Support
The app uses Coinbase Smart Wallet as the primary wallet option, eliminating the need for seed phrases. Users can create and access wallets using just their Coinbase account, making Web3 onboarding seamless.

### Empire Tier System
Features are progressively unlocked based on $BB token holdings:
- **Visitor**: Basic meme creation with watermark
- **Member**: Watermark removal
- **Veteran**: Premium sticker collections
- **Champion**: All collections unlocked
- **Elite**: Custom background uploads

### Farcaster Integration
Full miniapp support with bulletproof SDK integration:
- **Ultimate SDK Wrapper**: Multi-layer initialization system solving the "first-click error"
- **Native Sharing**: Direct sharing via composeCast API without leaving the app
- **Profile Integration**: Farcaster usernames and FIDs displayed throughout the app
- **Verified Addresses**: Uses Farcaster's verified addresses for auto-linking accounts

### Contest System
Comprehensive contest platform with dual-action design:
- **CTA System**: Separate buttons for contest actions (play game, create meme) and submissions
- **Voting System**: Community voting with one-vote-per-wallet restriction
- **Admin Panel**: Full CRUD operations for contest management
- **Analytics**: Click tracking and conversion rate monitoring

### Mobile Optimization
- Progressive Web App (PWA) support
- Add to home screen functionality
- Touch-optimized canvas controls
- Responsive design throughout

## 📊 Production Metrics

- **Status**: Live Production
- **URL**: https://bbapp.bizarrebeasts.io
- **Performance**: 95+ Lighthouse score
- **Load Time**: <3 seconds
- **Mobile Score**: Fully optimized
- **Browser Support**: Chrome, Safari, Firefox, Edge, Brave

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is proprietary software owned by BizarreBeasts.

## 🔗 Links

- **Live App**: [bbapp.bizarrebeasts.io](https://bbapp.bizarrebeasts.io)
- **$BB Token**: [Base Network](https://basescan.org/token/0x0520bf1d3cEE163407aDA79109333aB1599b4004)
- **Farcaster**: [/bizarrebeasts](https://warpcast.com/~/channel/bizarrebeasts)
- **Twitter**: [@BizarreBeast](https://twitter.com/BizarreBeast)
- **Games**: [bizarrebeasts.win](https://bizarrebeasts.win)

## 🏆 Achievements

- ✅ Base Smart Wallet Integration
- ✅ Farcaster Miniapp Validated
- ✅ 130K+ Game Plays
- ✅ 4,400+ Token Holders
- ✅ 8 Integrated Games
- ✅ Mobile-First Design
- ✅ PWA Support

---

**Built with 💎 by @bizarrebeast**

*Hold 25M $BB to join /bizarrebeasts*