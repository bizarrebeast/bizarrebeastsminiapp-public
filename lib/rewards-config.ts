// Attestation Rewards Configuration
// Treasury wallet for distributing streak milestone rewards

export const REWARDS_CONFIG = {
  // Treasury wallet address for $BB token distributions
  TREASURY_WALLET: '0xc387c92c7CFb6c2Cfc5BE772fe8C5590387630e2',

  // Token contract address (Base mainnet)
  BB_TOKEN_ADDRESS: '0x0520bf1d3cEE163407aDA79109333aB1599b4004',

  // Milestone reward amounts (in tokens, not wei)
  MILESTONES: {
    '7_day': {
      tokens: 25000,
      label: '7-Day Streak',
      description: 'Starter milestone - Keep it going!'
    },
    '30_day': {
      tokens: 1000000,
      label: '30-Day Streak',
      description: 'Dedicated prover - One month strong!'
    },
    '100_day': {
      tokens: 5000000,
      label: '100-Day Streak',
      description: 'BIZARRE tier unlocked + Proof of BIZARRE NFT',
      grantsBlazareTier: true
    }
  },

  // Distribution schedule
  DISTRIBUTION_SCHEDULE: 'Manual review and distribution',

  // Explorer URLs
  BASESCAN_URL: 'https://basescan.org',
  BASESCAN_TOKEN_URL: 'https://basescan.org/token/0x0520bf1d3cEE163407aDA79109333aB1599b4004'
};

// Helper to format token amounts for display
export function formatRewardAmount(amount: string | number): string {
  const num = typeof amount === 'string' ? parseInt(amount) : amount;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
}