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
  title: "Notorious B.I.Z. is Back! Battle for 20M $BB on Farverse!",
  description: `The legend returns! Notorious B.I.Z. is back and ready to dominate the Farverse arena! Join the ultimate Slay-to-Earn battle where skill meets rewards.\n\nFarverse is a premier Farcaster-native gaming platform where you can battle, earn, and prove your dominance. With 20 MILLION $BB tokens up for grabs, plus other prizes for more villains, it's time to GO BIZARRE show what you're made of!`,

  actionText: "Join the Battle",
  actionUrl: "https://slay.farverse.games/enemies/24",
  image: "/assets/page-assets/banners/rituals-boxes/featured-ritual-banner-farverse-slay-to-earn.png",

  // Optional: Add a Learn More button
  learnMoreUrl: "https://paragraph.com/@bizarrebeasts/notorious-biz-is-back-battle-for-25m-dollarbb-on-farverse?referrer=0x3FDD6aFEd7a19990632468c7102219d051E685dB",
  learnMoreText: "More info",

  // Optional: Auto-expire (remove or update if needed)
  // expiresAt: "2025-01-31",
  urgencyText: "20M $BB Prize Pool!",

  // Optional: Sponsorship (uncomment if needed)
  // sponsorType: 'collab',
  // sponsorName: 'Farverse',
  // sponsorLogo: '/assets/partners/farverse-logo.png',
  // sponsorTagline: 'Slay-to-Earn on Farverse',

  // Optional: Custom sharing
  shareTitle: "Notorious B.I.Z. is BACK! 🎮⚔️",
  shareText: "NOTORIOUS B.I.Z. IS BACK! 🦾\n\nCheck out today's featured ritual on the BizarreBeasts ($BB) Miniapp: Battle for 20 MILLION $BB + other rewards on /farverse - the ultimate Slay-to-Earn arena! ⚔️ 👹\n\nCC @bizarrebeast @mfbevan.eth\n\n#BizarreBeasts #FeaturedRitual #Farverse #SlayToEarn",
  shareEmbed: "https://bbapp.bizarrebeasts.io/rituals/featured"
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