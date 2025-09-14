# BizarreBeasts Miniapp 🎨

A production-ready Farcaster miniapp for the BizarreBeasts ecosystem featuring advanced meme generation, Base Smart Wallet support, games hub, Empire integration, and token swapping.

**🔗 Live:** [bbapp.bizarrebeasts.io](https://bbapp.bizarrebeasts.io)

## 📚 Important Documentation

- **[SHARING-IMPLEMENTATION-GUIDE.md](./SHARING-IMPLEMENTATION-GUIDE.md)** - Complete guide to sharing features and implementation

## 🚀 Core Features

### 💳 Base Smart Wallet Integration (NEW)
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
    /empire           # Empire API proxy
    /upload-temp      # Temporary image storage
    /image            # Image serving endpoint
  /meme-generator     # Meme creation with canvas
  /swap               # Token swap interface
  /games              # Games hub
  /empire             # Live leaderboard
  /rituals            # Daily challenges
  /music              # Soundtracks
  /resources          # Community links
  
/components
  /canvas             # Meme canvas components
    MemeCanvas.tsx    # Main canvas with Fabric.js
    StickerGallery.tsx # Tier-gated collections
  /wallet             # Wallet connection UI
  /navigation         # Navigation components
  
/lib
  web3.ts             # Wallet configuration
  farcaster.ts        # Farcaster integration
  sdk-ultimate.ts     # Bulletproof SDK init
  mobile-utils.ts     # Mobile helpers
  
/contexts
  FarcasterContext.tsx # Farcaster state
  SDKContext.tsx       # SDK management
  
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
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_EMPIRE_API_URL=https://bizarrebeasts.win/api
NEXT_PUBLIC_FARCASTER_MANIFEST_URL=/farcaster.json
```

## 🎯 Key Features Explained

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
Full miniapp support with:
- Native sharing via composeCast API
- Platform detection (mobile/desktop)
- Bulletproof SDK initialization
- Fallback mechanisms for all environments

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