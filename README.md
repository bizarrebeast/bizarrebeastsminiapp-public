# BizarreBeasts Miniapp 🎨

A Next.js 14 application for the BizarreBeasts ecosystem featuring advanced meme generation, games hub, Empire integration, and token swapping.

## 🚀 Core Features

### 🎨 Meme Generator (Fully Implemented)
- **Multiple Sticker Collections**: BizarreBeasts, Treasure Quest, VibeCards
- **Canvas Creation**: Powered by Fabric.js v6 with drag-and-drop interface
- **Text Overlays**: Customizable colors, fonts, and styles
- **Backgrounds**: Transparent (default), solid colors, or custom image uploads
- **Smart Alignment**: Snap-to-grid feature for precise composition
- **Export**: High-quality PNG with optional watermark
- **Social Sharing**: Direct integration with Farcaster
- **Empire Gating**: Features unlocked based on Empire rank (not token-gated)

### 🏰 Empire Integration (Active)
- **Leaderboard Rankings**: Real-time rank based on $BB holdings
- **Tier System**:
  - **Elite** (Top 10): All features, no watermark, custom uploads
  - **Champion** (Top 50): Most features, no watermark, custom uploads  
  - **Veteran** (Top 100): Premium collections, optional watermark
  - **Member** (Top 500): Basic collections
  - **Visitor**: Limited access
- **Live Updates**: Tracks boosters and multipliers in real-time
- **Upgrade Prompts**: Smart modals guide users to unlock features

### 💱 Token Swap (Implemented)
- **Uniswap Integration**: Embedded interface via iframe
- **Default Token**: $BB pre-selected as output
- **Quick Actions**: Add token to wallet, bridge to Base
- **Token Info**: Contract address, charts, and BaseScan links
- **Mobile Support**: User-friendly message with desktop requirement
- **⚠️ Note**: Wallet connection is separate - users connect within Uniswap iframe

### 🎮 Games Hub (Fully Implemented)
- **8 BizarreBeasts Games** with 128K+ total plays
- Square banner images for each game
- Play count tracking and statistics
- Platform links (Telegram, World App, Farcaster, Online)
- Sort by popularity or view all games
- Featured games: Treasure Quest, Bizarre Bounce, TicTacToe

### 🎵 Music Page (Implemented)
- Original game soundtracks by @kateyarter
- Album covers for each track
- Streaming platform links (Spotify, Apple, Amazon)
- NFT collection options
- Track details and descriptions

### 🎯 Daily BIZARRE Rituals (Implemented)
- **9 Daily Rituals**: Interactive tasks to engage with the ecosystem
- **Progress Tracking**: localStorage with daily reset at midnight
- **Featured Rituals**: Temporary/sponsored rituals with expiration dates
- **Individual Sharing**: Share each ritual completion on Farcaster
- **Empire Integration**: Ritual #9 syncs with Empire rank sharing
- **Visual Progress**: Checkmarks and progress counter
- **Responsive Design**: Optimized for mobile and desktop

### 🔗 Wallet Connection (Implemented)
- **Reown AppKit**: WalletConnect integration
- **Base Network**: Full support
- **User Display**: Shows Empire rank, tier, balance
- **Live Stats**: Multipliers and boosters

## 🛠️ Technical Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS (gem-themed palette)
- **Canvas**: Fabric.js v6
- **State**: Zustand
- **Wallet**: Reown AppKit + Ethers v6
- **APIs**: Empire Builder API (proxied for CORS)
- **Hosting**: Vercel-ready

## 📁 Project Structure

```
/app                    # Next.js app directory
  /api                 # API routes
    /empire           # Empire API proxy
  /meme-generator     # Meme creation page
  /swap               # Token swap (Uniswap iframe)
  /games              # Games hub with 8 games
  /empire             # Rankings page with share functionality
  /music              # Game soundtracks
  /rituals            # Daily BIZARRE Rituals page
  /leaderboard        # Legacy leaderboard (redirects to /empire)
  /resources          # Resources page with links
  
/components
  /canvas             # Meme canvas components
    MemeCanvas.tsx   # Main canvas with snap-to-grid
    StickerGallery.tsx # Tier-gated stickers
    BackgroundSelector.tsx
  /wallet             # Wallet components
  /navigation         # Nav components
  UpgradePrompt.tsx  # Tier upgrade modal
  
/lib
  empire.ts          # Empire API service
  empire-gating.ts   # Feature access logic
  web3.ts           # Wallet config
  
/hooks
  useWallet.ts      # Wallet state hook
  
/public
  /stickers         # Sticker assets (needs population)
  /backgrounds      # Background images
  /farcaster-assets # Farcaster miniapp assets (icon, splash, og-image)
  /.well-known      # Farcaster manifest
```

## 🚀 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🔧 Environment Variables

Create `.env.local`:

```env
# Required
NEXT_PUBLIC_REOWN_PROJECT_ID=569afd0d3f8efc1ba7a63a57045ee717

# Optional (for future features)
NEXT_PUBLIC_TELEGRAM_BOT_URL=your_bot_url
NEXT_PUBLIC_WORLD_APP_ID=your_world_app_id
```

## 📍 Key Addresses & Links

- **$BB Token**: `0x0520bf1d3cEE163407aDA79109333aB1599b4004` (Base)
- **Empire Builder**: https://www.empirebuilder.world/empire/0x0520bf1d3cEE163407aDA79109333aB1599b4004
- **Uniswap Swap**: https://app.uniswap.org/swap?outputCurrency=0x0520bf1d3cEE163407aDA79109333aB1599b4004&chain=base

## 🏗️ Implementation Notes

### Swap Page Architecture Decision
The token swap uses an embedded Uniswap iframe instead of the widget due to dependency conflicts:
- **Issue**: App uses ethers v6 for wallet, Uniswap widget requires v5
- **Solution**: Iframe avoids version conflicts entirely
- **Trade-off**: Users connect wallet twice (app + iframe)
- **Future**: Consider Uniswap SDK v3 for native integration

### Empire API Proxy
All Empire Builder API calls route through `/api/empire/leaderboard` to handle CORS.

### Feature Gating Philosophy
Premium features check Empire tier (rank-based) rather than token balance directly, creating a competitive dynamic.

## 📋 Current Status

### ✅ Completed
- Full meme generator with all controls
- Empire integration with live data and rank sharing
- Wallet connection (Reown AppKit)
- Token swap page (iframe solution)
- Farcaster sharing with proper embeds[] for link previews
- Tier-based gating system
- Upgrade prompts for all locked content
- Snap-to-grid alignment
- Custom background uploads (Elite/Champion)
- Games hub with 8 games and real statistics
- Music page with original soundtracks
- Dynamic market cap display on homepage
- Responsive hamburger menu across all devices
- 4400+ holders tracking
- Homepage banner with $BB token info
- Farcaster miniapp integration with manifest and assets
- Mobile detection for swap page with user guidance
- Daily BIZARRE Rituals page with 9 rituals
- Featured ritual system for temporary/sponsored content
- Individual ritual sharing on Farcaster
- Empire rank sharing integration
- Resources page with key links
- PWA support with manifest and icons
- Fixed mobile browser sticker clearing bug
- Fixed first-click error in Farcaster mobile app
- Proper SDK initialization for all platforms

### 🔄 In Progress
- Production deployment to app.bizarrebeasts.io
- Adding more actual sticker assets
- Contest voting system design

### 📝 TODO
- [ ] Deploy to production (app.bizarrebeasts.io)
- [ ] Create Blog page with articles
- [ ] Populate `/public/stickers` with more assets
- [ ] Implement Uniswap SDK for native swap (v2)
- [ ] Add more sticker collections
- [ ] Contest voting backend
- [ ] Check-in/rewards system
- [ ] Analytics integration
- [ ] Add actual music streaming links
- [ ] Implement game platform links

## ⚠️ Known Issues

1. **Dual Wallet Connection**: Swap page requires separate connection in iframe
2. **Pino Warning**: Dev-only warning about pino-pretty (non-critical)
3. **Sticker Assets**: Currently using placeholder SVGs
4. **Production URLs**: Farcaster assets require production deployment to work

## 🔐 Security Notes

- Empire API proxied to prevent CORS exposure
- No private keys or sensitive data in frontend
- Wallet connections handled by established libraries
- Token addresses hardcoded to prevent scams

## 📈 Performance

- Canvas operations optimized with Fabric.js
- Empire data cached for 5 minutes
- Lazy loading for sticker collections
- Responsive design for all screen sizes

## 🤝 Contributing

Private repository for BizarreBeasts team members.

## 📄 License

Proprietary - BizarreBeasts

---

**Current Version**: 1.0.0-beta  
**Last Updated**: December 2024  
Built with ❤️ for the BizarreBeasts community