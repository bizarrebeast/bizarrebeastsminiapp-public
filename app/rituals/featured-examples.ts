/**
 * Featured Ritual Examples
 * This file contains examples of how to configure the featured ritual box
 * for different use cases: regular, sponsored, collab, and partner content
 */

// Example 1: Your own featured content (current)
export const bbFeaturedExample = {
  title: "Vote for BizarreBeasts for the DCP Base Creators Award! 🏆",
  description: "Help BizarreBeasts win the DCP Onchain Creators Award!",
  actionText: "Vote Now",
  actionUrl: "https://app.decentralized.pictures/project/68694bbba0073d7cf1048a2b",
  image: "/assets/page-assets/banners/rituals-boxes/featured-ritual-banner.png",
  expiresAt: "2025-01-13"
};

// Example 2: Sponsored Content
export const sponsoredExample = {
  title: "Mint the Exclusive BB x Partner NFT Collection! 🎨",
  description: "Limited edition collaboration NFTs now available. Only 1000 will ever be minted!",
  actionText: "Mint Now",
  actionUrl: "https://partner-site.com/mint",
  image: "/assets/sponsored/partner-banner.png",
  expiresAt: "2025-02-01",

  // Sponsorship fields
  sponsorType: 'sponsored' as const,
  sponsorName: 'CoolNFTProject',
  sponsorLogo: '/assets/sponsors/coolnft-logo.png',
  sponsorTagline: 'Powered by CoolNFTProject'
};

// Example 3: Collaboration
export const collabExample = {
  title: "Join the BB x FriendlyDAO Gaming Tournament! 🎮",
  description: "Compete for 100,000 $BB in prizes! Register now for the ultimate gaming showdown.",
  actionText: "Register",
  actionUrl: "https://tournament.friendlydao.com",
  image: "/assets/collabs/tournament-banner.png",
  expiresAt: "2025-01-20",

  // Collab fields
  sponsorType: 'collab' as const,
  sponsorName: 'FriendlyDAO',
  sponsorLogo: '/assets/collabs/friendlydao-logo.png',
  sponsorTagline: 'In collaboration with FriendlyDAO'
};

// Example 4: Partner Placement
export const partnerExample = {
  title: "Stake Your BB Tokens for Extra Rewards! 💎",
  description: "New staking pools are live with up to 50% APY. Stake your BB tokens and earn passive income!",
  actionText: "Start Staking",
  actionUrl: "https://staking.partner.com",
  image: "/assets/partners/staking-banner.png",

  // Partner fields
  sponsorType: 'partner' as const,
  sponsorName: 'StakingProtocol',
  sponsorLogo: '/assets/partners/staking-logo.png',
  sponsorTagline: 'Official Staking Partner'
};

/**
 * HOW TO USE:
 *
 * 1. In app/rituals/page.tsx, import the example you want:
 *    import { sponsoredExample } from './featured-examples';
 *
 * 2. Replace the featuredRitual constant with your chosen example:
 *    const featuredRitual = sponsoredExample;
 *
 * 3. Or set to null to hide the featured section:
 *    const featuredRitual = null;
 *
 * VISUAL DIFFERENCES:
 *
 * - Regular (no sponsorType): Shows "FEATURED RITUAL" with star emojis
 * - Sponsored: Shows "SPONSORED RITUAL" with "AD" badge
 * - Collab: Shows "COLLABORATION" with "COLLAB" badge
 * - Partner: Shows "PARTNER RITUAL" with "PARTNER" badge
 *
 * All sponsored content will also show the sponsor name/logo below the header
 */