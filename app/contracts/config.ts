// Contract addresses on Base Mainnet (Production)
export const CONTRACT_ADDRESSES = {
  bbToken: '0x0520bf1d3cEE163407aDA79109333aB1599b4004', // BB Token on Base Mainnet
  ritualGatekeeper: '0x0f57b7755A1CBa924fC23d6b40153668245DBd1a', // Production gatekeeper
  bizarreCheckIn: '0x3e8B162E639785f71018DB091A13e3b5A5b77278', // FIXED check-in (deployed Oct 10, 2025)
  // OLD (buggy): '0x12125F025ea390B975aEa210B40c7B81dC2F00E0'
} as const;

// Base Mainnet Chain Configuration
export const BASE_MAINNET_CHAIN = {
  id: 8453,
  name: 'Base',
  network: 'base',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://base.llamarpc.com'],
    },
    public: {
      http: ['https://base.llamarpc.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BaseScan',
      url: 'https://basescan.org',
    },
  },
  testnet: false,
} as const;

// Empire Tier Configuration (Must match deployed contract!)
export const EMPIRE_TIERS = {
  BIZARRE: {
    name: 'BIZARRE',
    rank: '1-25',
    fiveDayReward: '250,000 BB',
    fifteenDayBonus: '500,000 BB',  // Hardcoded in contract
    thirtyDayBonus: '1,000,000 BB',  // Hardcoded in contract
  },
  WEIRDO: {
    name: 'WEIRDO',
    rank: '26-50',
    fiveDayReward: '100,000 BB',
    fifteenDayBonus: '250,000 BB',  // Hardcoded in contract
    thirtyDayBonus: '500,000 BB',   // Hardcoded in contract
  },
  ODDBALL: {
    name: 'ODDBALL',
    rank: '51-100',
    fiveDayReward: '50,000 BB',
    fifteenDayBonus: '100,000 BB',  // Hardcoded in contract
    thirtyDayBonus: '200,000 BB',   // Hardcoded in contract
  },
  MISFIT: {
    name: 'MISFIT',
    rank: '101-500',
    fiveDayReward: '25,000 BB',
    fifteenDayBonus: '50,000 BB',   // Hardcoded in contract
    thirtyDayBonus: '100,000 BB',   // Hardcoded in contract
  },
  NORMIE: {
    name: 'NORMIE',
    rank: '501+',
    fiveDayReward: '25,000 BB',
    fifteenDayBonus: null,
    thirtyDayBonus: null,
  },
} as const;