// Contract addresses on Base Mainnet (Production)
export const CONTRACT_ADDRESSES = {
  bbToken: '0x0520bf1d3cEE163407aDA79109333aB1599b4004', // BB Token on Base Mainnet
  ritualGatekeeper: '0x0f57b7755A1CBa924fC23d6b40153668245DBd1a', // Production gatekeeper
  bizarreCheckIn: '0x12125F025ea390B975aEa210B40c7B81dC2F00E0', // Production check-in
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
      http: ['https://mainnet.base.org'],
    },
    public: {
      http: ['https://mainnet.base.org'],
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
    fiveDayReward: '100,000 BB',
    fifteenDayBonus: '50,000 BB',
    thirtyDayBonus: '100,000 BB',
  },
  WEIRDO: {
    name: 'WEIRDO',
    rank: '26-50',
    fiveDayReward: '50,000 BB',
    fifteenDayBonus: '25,000 BB',
    thirtyDayBonus: '50,000 BB',
  },
  ODDBALL: {
    name: 'ODDBALL',
    rank: '51-100',
    fiveDayReward: '25,000 BB',
    fifteenDayBonus: '10,000 BB',
    thirtyDayBonus: '25,000 BB',
  },
  MISFIT: {
    name: 'MISFIT',
    rank: '101-500',
    fiveDayReward: '5,000 BB',
    fifteenDayBonus: null,
    thirtyDayBonus: null,
  },
  NORMIE: {
    name: 'NORMIE',
    rank: '501+',
    fiveDayReward: null,
    fifteenDayBonus: null,
    thirtyDayBonus: null,
  },
} as const;