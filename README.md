# BizarreBeasts Miniapp 🎮

> A comprehensive Web3 gaming and NFT ecosystem built on Base blockchain, featuring daily rituals, community contests, and provably fair gaming.

[![Live App](https://img.shields.io/badge/Live-bbapp.bizarrebeasts.io-purple)](https://bbapp.bizarrebeasts.io)
[![Base](https://img.shields.io/badge/Base-Blockchain-blue)](https://base.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)

## 🎯 Overview

BizarreBeasts is a full-featured Web3 gaming platform integrating with Farcaster, featuring:
- **9 playable games** across multiple platforms (Farcaster, Telegram, World App, web)
- **Daily check-in rituals** with NFT attestations on Base blockchain
- **Community-driven contests** with voting and rewards
- **Provably fair coin flip game** with token rewards and monthly prize drawings
- **NFT minting and gallery** showcasing 100+ hand-illustrated artworks
- **Unified authentication** supporting Farcaster, Privy, and wallet connections

## ✨ Key Features

### 🎮 Gaming Ecosystem
- **8 Remix Games** + exclusive BizBe Coin Toss game
- Cross-platform play (Farcaster Miniapps, Telegram, World App)
- Real-time leaderboards and stats tracking
- Over **430+ daily flips** and growing

### 🎨 NFT Collections
- Multiple NFT collections deployed on Base mainnet
- In-app exclusive NFT minting with share verification
- Dynamic NFT galleries with collection views
- Integration with OpenSea and Base marketplaces

### 🗓️ Daily Rituals System
- On-chain attestations via custom smart contracts
- Streak tracking with milestone rewards
- Farcaster share verification
- Automated reward distribution system

### 🏆 Community Contests
- Create and manage meme contests, game competitions, and more
- Community voting with anti-fraud measures
- Recurring contest support with automation
- Admin panel for contest management

### 🪙 Provably Fair Flip Game
- Cryptographically secure random number generation
- Transparent win/loss verification
- $BB token rewards (Beta)
- Monthly prize drawings with real-world rewards
- Tiered system based on community engagement

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Farcaster SDK** for miniapp integration
- **Privy** for wallet authentication
- **Wagmi/Viem** for blockchain interactions

### Backend & Infrastructure
- **Supabase** for database and authentication
- **PostgreSQL** with Row Level Security (RLS)
- **Vercel** for hosting and serverless functions
- **Cloudinary** for image management

### Blockchain
- **Base** (Ethereum L2)
- **Solidity** smart contracts:
  - `BizarreAttestation.sol` - Daily check-in attestations
  - `BizarreFlip.sol` - Provably fair gaming
  - `InAppExclusiveNFT.sol` - NFT minting
  - `TestBBToken.sol` - $BB token (testnet)
- **Hardhat** for contract development and deployment
- **thirdweb** for NFT infrastructure

### APIs & Integrations
- **Neynar API** for Farcaster data
- **Base RPC** for blockchain interactions
- **OpenSea API** for NFT metadata
- **Resend** for email notifications

## 🏗️ Architecture Highlights

### Unified Authentication System
- Multi-provider support (Farcaster, Privy, WalletConnect)
- Automatic account linking and migration
- Zustand state management for consistent auth across the app

### Security Features
- Comprehensive Row Level Security (RLS) policies
- Admin role-based access control
- Rate limiting on sensitive endpoints
- Fraud detection for voting and submissions

### Smart Contract Architecture
- Upgradeable proxy pattern considerations
- Role-based access control (RBAC)
- Gas-optimized operations
- Comprehensive event emission for tracking

### Database Schema
- Optimized indexes for performance
- Materialized views for complex queries
- Efficient RLS policies
- Migration system for schema updates

## 📊 Stats & Metrics

- **44K+** game plays across all games
- **10K+** players
- **430+** daily flips and counting
- **Multiple NFT collections** deployed and active
- **Active daily ritual participants** with ongoing streaks

## 🎨 Original Artwork

All game assets, NFTs, and illustrations are **100% original hand-illustrated artwork**. The project showcases:
- 80+ paper illustrations
- 20+ ink illustrations
- 30+ acrylic paintings
- Custom character designs and animations
- Unique sticker packs

## 🚀 Deployment

The application is deployed on Vercel with:
- Automatic deployments from main branch
- Preview deployments for pull requests
- Edge functions for optimal performance
- Environment-based configuration

Smart contracts deployed on:
- **Base Mainnet** (production)
- **Base Sepolia** (testing)

## 📝 Documentation

Comprehensive documentation available in `/docs`:
- Authentication architecture
- Smart contract deployment guides
- API documentation
- Feature implementation specs
- Security checklists

## 🤝 Contributing

This is the public version of the BizarreBeasts miniapp, maintained for transparency and community involvement.

## 🔗 Links

- **Live App**: [bbapp.bizarrebeasts.io](https://bbapp.bizarrebeasts.io)
- **Base Scan**: View our contracts on Base explorer
- **OpenSea**: Browse our NFT collections
- **Farcaster**: [@bizarrebeasts](https://warpcast.com/bizarrebeasts)

## 📄 License

All artwork and game assets © BizarreBeasts. Code is shared for transparency and educational purposes.

---

**Built with ❤️ on Base** | **Powered by Farcaster SDK** | **Original Artwork by BizarreBeasts**
