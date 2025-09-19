/**
 * FEATURED RITUAL CONFIGURATION
 * ============================
 *
 * This is the SINGLE SOURCE OF TRUTH for the featured ritual box.
 * To update the featured campaign, simply modify the `ACTIVE_CAMPAIGN` export below.
 *
 * Quick Start:
 * 1. Update ACTIVE_CAMPAIGN with your new campaign details
 * 2. Save the file
 * 3. The changes will appear immediately in development
 * 4. Commit and deploy to see changes in production
 *
 * To hide the featured box: Set ACTIVE_CAMPAIGN = null
 */

interface FeaturedCampaign {
  // REQUIRED FIELDS
  title: string;              // Main headline
  description: string;        // Full description (supports line breaks with \n)
  actionText: string;         // Primary CTA button text
  actionUrl: string;          // Primary CTA button URL
  image: string;              // Banner image path (720x360 recommended)

  // OPTIONAL FIELDS
  learnMoreUrl?: string;      // Secondary "Learn More" button URL
  learnMoreText?: string;     // Secondary button text (defaults to "Learn More")
  expiresAt?: string;         // Auto-hide date (YYYY-MM-DD format)
  urgencyText?: string;       // Custom urgency message (e.g., "48 hours left!")

  // SPONSORSHIP FIELDS (optional)
  sponsorType?: 'sponsored' | 'collab' | 'partner';
  sponsorName?: string;       // Name of sponsor/partner
  sponsorLogo?: string;       // Path to sponsor logo
  sponsorTagline?: string;    // Custom tagline (defaults to "Powered by X")

  // SHARING CUSTOMIZATION (optional)
  shareTitle?: string;        // Custom title for sharing (defaults to title)
  shareText?: string;         // Custom text for social sharing
  shareEmbed?: string;        // Custom embed URL for Farcaster shares
}

// ============================================================================
// ACTIVE CAMPAIGN - EDIT THIS TO UPDATE THE FEATURED RITUAL
// ============================================================================

export const ACTIVE_CAMPAIGN: FeaturedCampaign | null = {
  // Basic Campaign Info
  title: "The BB Miniapp & Treasure Quest in the dGEN1 app store!",
  description: `I'm GOING BIZARRE to announce that the BizarreBeasts ($BB) Miniapp and game Treasure Quest are now officially live in the dGEN1 app store! This marks a new era as we become one of the first native web3 experiences on the world's only Ethereum-integrated mobile device.`,

  actionText: "Visit app store",
  actionUrl: "https://www.freedomfactory.io/apps",
  image: "/assets/page-assets/banners/rituals-boxes/featured-ritual-banner-2-dgen1.png",

  // Optional: Add a Learn More button
  learnMoreUrl: "https://paragraph.com/@bizarrebeasts/bizarrebeasts-miniapp-and-treasure-quest-now-live-in-the-dgen1-app-store",
  learnMoreText: "More info",

  // Optional: Auto-expire (remove or update if needed)
  // expiresAt: "2025-01-31",
  // urgencyText: "New on dGEN1!",

  // Optional: Sponsorship (uncomment if needed)
  // sponsorType: 'partner',
  // sponsorName: 'dGEN1',
  // sponsorLogo: '/assets/partners/dgen1-logo.png',
  // sponsorTagline: 'Available on dGEN1',

  // Optional: Custom sharing
  shareTitle: "BizarreBeasts is now on dGEN1! 📱",
  shareText: "The @bizarrebeasts Miniapp and Treasure Quest game are now LIVE in the dGEN1 app store! 🎮\n\nWe're one of the first native web3 experiences on the world's only Ethereum-integrated mobile device! 🚀\n\nJoin the BIZARRE revolution on dGEN1!",
  shareEmbed: "https://paragraph.com/@bizarrebeasts/bizarrebeasts-miniapp-and-treasure-quest-now-live-in-the-dgen1-app-store"
};

// ============================================================================
// CAMPAIGN TEMPLATES - Copy these for quick setup
// ============================================================================

export const CAMPAIGN_TEMPLATES = {
  // Standard BizarreBeasts Campaign
  standard: {
    title: "Your Campaign Title Here",
    description: "Your campaign description here. Use \\n\\n for paragraphs.",
    actionText: "Take Action",
    actionUrl: "https://your-action-url.com",
    image: "/assets/page-assets/banners/rituals-boxes/your-banner.png"
  },

  // Sponsored Content
  sponsored: {
    title: "Sponsored Campaign Title",
    description: "Description of the sponsored opportunity",
    actionText: "Participate",
    actionUrl: "https://sponsor-site.com",
    image: "/assets/sponsored/sponsor-banner.png",
    sponsorType: 'sponsored' as const,
    sponsorName: 'Sponsor Name',
    sponsorLogo: '/assets/sponsors/logo.png',
    sponsorTagline: 'Sponsored by Partner'
  },

  // Collaboration
  collab: {
    title: "BB x Partner Collab",
    description: "Exciting collaboration details",
    actionText: "Join Now",
    actionUrl: "https://collab-site.com",
    image: "/assets/collabs/collab-banner.png",
    sponsorType: 'collab' as const,
    sponsorName: 'Partner DAO',
    sponsorTagline: 'In collaboration with Partner'
  },

  // Contest/Competition
  contest: {
    title: "BizarreBeasts Contest Name!",
    description: "Contest details and prizes",
    actionText: "Enter Contest",
    actionUrl: "/contests/current",
    image: "/assets/contests/contest-banner.png",
    learnMoreUrl: "/contests/rules",
    expiresAt: "2025-01-20",
    urgencyText: "Contest ends in 3 days!"
  },

  // Product Launch
  launch: {
    title: "New BB Feature Launch!",
    description: "Introducing our latest feature",
    actionText: "Try It Now",
    actionUrl: "/new-feature",
    image: "/assets/launches/feature-banner.png",
    learnMoreUrl: "/docs/new-feature"
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a campaign has expired
 */
export function isCampaignActive(campaign: FeaturedCampaign | null): boolean {
  if (!campaign) return false;
  if (!campaign.expiresAt) return true;

  const expiryDate = new Date(campaign.expiresAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today <= expiryDate;
}

/**
 * Get the active campaign (checks expiration)
 */
export function getActiveCampaign(): FeaturedCampaign | null {
  if (!ACTIVE_CAMPAIGN) return null;
  return isCampaignActive(ACTIVE_CAMPAIGN) ? ACTIVE_CAMPAIGN : null;
}

/**
 * Format the campaign for display
 */
export function formatCampaignDisplay(campaign: FeaturedCampaign) {
  return {
    ...campaign,
    // Add display helpers
    displayTitle: campaign.sponsorType ?
      (campaign.sponsorType === 'sponsored' ? 'SPONSORED RITUAL' :
       campaign.sponsorType === 'collab' ? 'COLLABORATION' :
       'PARTNER RITUAL') : 'FEATURED RITUAL',

    badgeText: campaign.sponsorType ?
      (campaign.sponsorType === 'sponsored' ? 'AD' :
       campaign.sponsorType === 'collab' ? 'COLLAB' :
       'PARTNER') : null,

    sponsorDisplay: campaign.sponsorTagline ||
      (campaign.sponsorName ? `Powered by ${campaign.sponsorName}` : null)
  };
}