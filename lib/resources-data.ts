export interface Resource {
  id: string;
  title: string;
  description: string;
  category: 'getting-started' | 'tokens' | 'empire' | 'games' | 'community' | 'international';
  language: 'en' | 'es' | 'ko' | 'ja' | 'zh';
  readTime: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  featured: boolean;
  updatedDate: string;
  externalUrl: string;
  thumbnail?: string;
  tags: string[];
}

export const resources: Resource[] = [
  {
    id: 'bb-empire-guide',
    title: '$BB Empire Guide',
    description: 'Everything you need to know to get started with the BizarreBeasts Empire. Complete walkthrough of tokens, boosters, and rewards.',
    category: 'empire',
    language: 'en',
    readTime: 10,
    difficulty: 'beginner',
    featured: true,
    updatedDate: 'Dec 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/discover-the-bizarrebeasts-empire-everything-you-need-to-know-to-get-started',
    tags: ['empire', 'tokens', 'boosters', 'rewards']
  },
  {
    id: 'beginners-guide',
    title: "BizarreBeasts: Beginner's Guide",
    description: 'Curious about crypto? Dive into BizarreBeasts with this complete beginner\'s guide to Web3, NFTs, and the ecosystem.',
    category: 'getting-started',
    language: 'en',
    readTime: 15,
    difficulty: 'beginner',
    featured: true,
    updatedDate: 'Nov 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/curious-about-crypto-dive-into-bizarrebeasts-a-beginners-guide',
    tags: ['web3', 'nfts', 'getting-started', 'crypto']
  },
  {
    id: 'bizarre-token-rewards',
    title: '$BIZARRE Token Rewards',
    description: 'Learn about the $BIZARRE token and rewards system. Understand how to earn and use tokens in the ecosystem.',
    category: 'tokens',
    language: 'en',
    readTime: 7,
    difficulty: 'intermediate',
    featured: false,
    updatedDate: 'Oct 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/introducing-dollarbizarre',
    tags: ['bizarre', 'tokens', 'rewards']
  },
  {
    id: 'spanish-guide',
    title: 'Primeros pasos con BizarreBeasts',
    description: 'Guía completa en español para comenzar en el universo BizarreBeasts. Todo lo que necesitas saber para unirte al imperio.',
    category: 'international',
    language: 'es',
    readTime: 12,
    difficulty: 'beginner',
    featured: false,
    updatedDate: 'Dec 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/primeros-pasos-con-bizarrebeasts',
    tags: ['español', 'guía', 'principiantes']
  },
  {
    id: 'korean-guide',
    title: 'BizarreBeasts 제국을 발견하세요',
    description: '시작을 위한 모든 정보 - Korean language guide to BizarreBeasts ecosystem and community.',
    category: 'international',
    language: 'ko',
    readTime: 12,
    difficulty: 'beginner',
    featured: false,
    updatedDate: 'Dec 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/bizarrebeasts-%EC%A0%9C%EA%B5%AD%EC%9D%84-%EB%B0%9C%EA%B2%AC%ED%95%98%EC%84%B8%EC%9A%94-%EC%8B%9C%EC%9E%91%EC%9D%84-%EC%9C%84%ED%95%9C-%EB%AA%A8%EB%93%A0-%EC%A0%95%EB%B3%B4',
    tags: ['한국어', '가이드', '초보자']
  }
];

export interface QuickGuide {
  id: string;
  title: string;
  description: string;
  steps: {
    number: number;
    text: string;
  }[];
}

export const quickGuides: QuickGuide[] = [
  {
    id: 'buy-bb',
    title: 'How to Buy $BB Tokens',
    description: 'Step-by-step guide to purchasing $BB tokens',
    steps: [
      { number: 1, text: 'Connect wallet to Base network' },
      { number: 2, text: 'Get ETH for gas fees' },
      { number: 3, text: 'Use the swap interface' },
      { number: 4, text: 'Confirm transaction' }
    ]
  },
  {
    id: 'understand-boosters',
    title: 'Understanding Boosters',
    description: 'Learn how boosters multiply your empire points',
    steps: [
      { number: 1, text: 'Hold required tokens/NFTs' },
      { number: 2, text: 'Automatic detection' },
      { number: 3, text: 'Points multiply' },
      { number: 4, text: 'Climb leaderboard' }
    ]
  },
  {
    id: 'daily-checkins',
    title: 'Daily Check-ins (Beta)',
    description: 'Maintain streaks for bonus rewards',
    steps: [
      { number: 1, text: 'Visit daily' },
      { number: 2, text: 'Click check-in' },
      { number: 3, text: 'Build streak' },
      { number: 4, text: 'Earn bonus multipliers' }
    ]
  }
];

export interface ChecklistItem {
  id: string;
  text: string;
  description: string;
  link?: string;
}

export const checklistItems: ChecklistItem[] = [
  {
    id: 'join-empire',
    text: 'Join the BizarreBeasts Empire',
    description: 'Connect your wallet and explore the mini app',
    link: '/empire'
  },
  {
    id: 'read-guide',
    text: 'Read the Empire Guide',
    description: 'Understand tokens, boosters, and how everything works',
    link: 'https://paragraph.com/@bizarrebeasts/discover-the-bizarrebeasts-empire-everything-you-need-to-know-to-get-started'
  },
  {
    id: 'get-tokens',
    text: 'Get Some $BB Tokens',
    description: 'Purchase tokens to participate in the ecosystem',
    link: '/swap'
  },
  {
    id: 'explore-boosters',
    text: 'Explore Boosters',
    description: 'Find NFTs and tokens that multiply your empire points',
    link: '/empire'
  },
  {
    id: 'join-community',
    text: 'Join the Community',
    description: 'Follow on Warpcast and connect with other members',
    link: 'https://warpcast.com/~/channel/bizarrebeasts'
  }
];