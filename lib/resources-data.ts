export interface Resource {
  id: string;
  title: string;
  description: string;
  category: 'how-to' | 'getting-started' | 'tokens' | 'empire' | 'games' | 'community' | 'international' | 'monthly-updates' | 'art' | 'technical';
  language: 'en' | 'es' | 'ko' | 'ja' | 'zh';
  readTime: number; // in minutes
  topic: string; // Replaced difficulty with topic (e.g., 'Strategy', 'Tutorial', 'News', 'Guide')
  featured: boolean;
  updatedDate: string;
  externalUrl: string;
  thumbnail?: string;
  bannerImage?: string; // Path to banner image from Paragraph articles
  tags: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced'; // Keep for backward compatibility
}

export const resources: Resource[] = [
  // FEATURED/HIGH PRIORITY ARTICLES
  {
    id: 'how-to-stickers-meme',
    title: 'BizarreBeasts Miniapp How-To Series: Stickers and Meme Creator',
    description: 'Learn how to use the BizarreBeasts Stickers & Meme Creator tool. Step-by-step guide to creating custom memes, PFPs, and artwork with BizarreBeasts stickers.',
    category: 'how-to',
    language: 'en',
    readTime: 8,
    topic: 'Tutorial',
    difficulty: 'beginner',
    featured: true,
    updatedDate: 'Dec 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/bizarrebeasts-miniapp-how-to-series-stickers-and-meme-creator',
    tags: ['how-to', 'tutorial', 'memes', 'stickers', 'creator', 'miniapp']
  },
  {
    id: 'how-to-rituals-checkins',
    title: 'BizarreBeasts Miniapp How-To Series: Daily Rituals and Check-ins',
    description: 'Complete guide to the Daily Rituals and Check-in system. Learn how to maximize rewards, complete rituals, and engage with the BizarreBeasts ecosystem daily.',
    category: 'how-to',
    language: 'en',
    readTime: 7,
    topic: 'Tutorial',
    difficulty: 'beginner',
    featured: false,
    updatedDate: 'Jan 2025',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/bizarrebeasts-miniapp-how-to-series-daily-rituals-and-check-ins',
    tags: ['how-to', 'tutorial', 'rituals', 'check-in', 'rewards', 'miniapp', 'daily']
  },
  {
    id: 'bb-empire-guide',
    title: '$BB Empire Guide',
    description: 'Everything you need to know to get started with the BizarreBeasts Empire. Complete walkthrough of tokens, boosters, and rewards.',
    category: 'empire',
    language: 'en',
    readTime: 10,

    topic: 'Guide',
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
    readTime: 9,

    topic: 'Guide',
    difficulty: 'beginner',
    featured: true,
    updatedDate: 'Nov 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/curious-about-crypto-dive-into-bizarrebeasts-a-beginners-guide',
    tags: ['web3', 'nfts', 'getting-started', 'crypto']
  },
  {
    id: 'treasure-quest-guide',
    title: 'The Official Player\'s Guide: BizarreBeasts Treasure Quest',
    description: 'Complete walkthrough and strategy guide for the flagship BizarreBeasts game, Treasure Quest.',
    category: 'games',
    language: 'en',
    readTime: 5,
    topic: 'Guide',
    difficulty: 'intermediate',
    featured: true,
    updatedDate: 'Dec 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/the-official-players-guide-bizarrebeasts-treasure-quest',
    tags: ['games', 'treasure-quest', 'guide', 'strategy']
  },
  {
    id: 'building-web3-masterpiece',
    title: 'From Frustration to Flow: Building a 21,812 Line Web3 Masterpiece',
    description: 'The technical journey of creating BizarreBeasts Treasure Quest - a deep dive into building Web3 games.',
    category: 'technical',
    language: 'en',
    readTime: 11,
    topic: 'Development',
    difficulty: 'advanced',
    featured: true,
    updatedDate: 'Dec 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/from-frustration-to-flow-how-i-built-a-21812-line-web3-artgaming-masterpiece-in-3-weeks',
    tags: ['development', 'web3', 'technical', 'games']
  },

  // EMPIRE & TOKENS
  {
    id: 'building-bb-empire',
    title: 'Building the $BB Empire on $GLANKER',
    description: 'Why Empire Builder works for artists and creators - the complete guide to the Empire ecosystem.',
    category: 'empire',
    language: 'en',
    readTime: 12,
    topic: 'Ecosystem',
    difficulty: 'intermediate',
    featured: false,
    updatedDate: 'Dec 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/building-the-dollarbb-empire-on-dollarglanker-why-empire-builder-works-for-artists-and-creators',
    tags: ['empire', 'glanker', 'creators', 'tokens']
  },
  {
    id: 'bizarre-token-rewards',
    title: '$BIZARRE Token Rewards',
    description: 'Learn about the $BIZARRE token and rewards system. Understand how to earn and use tokens in the ecosystem.',
    category: 'tokens',
    language: 'en',
    readTime: 7,
    topic: 'Tokenomics',
    difficulty: 'intermediate',
    featured: false,
    updatedDate: 'Oct 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/introducing-dollarbizarre',
    tags: ['bizarre', 'tokens', 'rewards']
  },
  {
    id: 'bb-treasury-drop',
    title: 'BB Treasury Drop: $160 in Tokens & VibeMarket Bundle',
    description: 'Details about the treasury distribution system and rewards for $BB holders.',
    category: 'tokens',
    language: 'en',
    readTime: 5,
    topic: 'Announcement',
    difficulty: 'intermediate',
    featured: false,
    updatedDate: 'Nov 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/bb-treasury-drop-incoming-dollar160-in-tokens-and-a-vibemarket-bundle-up-for-grabs',
    tags: ['treasury', 'rewards', 'vibemarket']
  },
  {
    id: 'burning-tokens-logic',
    title: 'The Bizarre Logic of Burning Tokens',
    description: 'Understanding token burns: scarcity, value, and growth mechanics in the $BB ecosystem.',
    category: 'tokens',
    language: 'en',
    readTime: 10,
    topic: 'Economics',
    difficulty: 'intermediate',
    featured: false,
    updatedDate: 'May 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/the-bizarre-logic-of-burning-tokens-scarcity-value-and-growth',
    tags: ['tokenomics', 'burning', 'strategy']
  },

  // GAMES & PRODUCTS
  {
    id: 'games-100k-plays',
    title: 'BizarreBeasts Games Surpass 100,000 Plays',
    description: 'Celebrating a major milestone for BizarreBeasts games on Remix platform.',
    category: 'community',
    language: 'en',
    readTime: 5,
    topic: 'Milestone',
    difficulty: 'beginner',
    featured: false,
    updatedDate: 'Nov 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/bizarrebeasts-games-surpass-100000-plays-on-remix',
    tags: ['games', 'milestone', 'remix']
  },
  {
    id: 'munchies-climb-launch',
    title: 'Munchies Climb is Live on Farcade',
    description: 'The most delicious BIZARRE game yet - introducing our latest gaming experience.',
    category: 'games',
    language: 'en',
    readTime: 5,
    topic: 'New Release',
    difficulty: 'beginner',
    featured: false,
    updatedDate: 'Dec 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/munchies-climb-is-live-on-farcade-the-most-delicious-bizarre-game-yet',
    tags: ['games', 'farcade', 'munchies-climb']
  },
  {
    id: 'notorious-biz-farverse',
    title: 'Notorious BIZ is Back - Battle for 25M $BB on Farverse',
    description: 'The legendary BizarreBeasts arena fighter returns! Compete in epic battles for a share of 25 million $BB tokens in this high-stakes gaming competition.',
    category: 'games',
    language: 'en',
    readTime: 6,
    topic: 'Tournament',
    difficulty: 'intermediate',
    featured: false,
    updatedDate: 'Jan 2025',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/notorious-biz-is-back-battle-for-25m-dollarbb-on-farverse',
    tags: ['games', 'notorious-biz', 'farverse', 'tournament', 'competition', '$BB', 'rewards']
  },
  {
    id: 'bizarre-bounce-unleashed',
    title: 'Bizarre Bounce Unleashed',
    description: 'A new era of BIZARRE gaming with Remix - introducing our latest game mechanics.',
    category: 'games',
    language: 'en',
    readTime: 7,
    topic: 'New Release',
    difficulty: 'beginner',
    featured: false,
    updatedDate: 'Dec 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/bizarre-bounce-unleashed-a-new-era-of-bizarre-gaming-with-remix',
    tags: ['games', 'bizarre-bounce', 'remix']
  },
  {
    id: 'bizarre-bounce-lottery',
    title: '🎰 Bizarre Bounce Lottery is Live 🎲',
    description: 'Play Bizarre Bounce for a chance to win exclusive rewards and prizes.',
    category: 'games',
    language: 'en',
    readTime: 3,
    topic: 'Feature',
    difficulty: 'beginner',
    featured: false,
    updatedDate: 'Nov 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/%F0%9F%8E%B0-bizarre-bounce-lottery-is-live-%F0%9F%8E%B2',
    tags: ['games', 'lottery', 'rewards']
  },
  {
    id: 'bizarrebeasts-checkerz',
    title: 'BizarreBeasts Checkerz',
    description: 'Classic strategy meets BIZARRE art - introducing our take on the timeless game.',
    category: 'games',
    language: 'en',
    readTime: 5,
    topic: 'Tournament',
    difficulty: 'beginner',
    featured: false,
    updatedDate: 'Apr 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/bizarrebeasts-checkerz',
    tags: ['games', 'checkerz', 'strategy']
  },

  // VIBEMARKET & CARDS
  {
    id: 'vibemarket-card-launch',
    title: 'BizarreBeasts Card Packs Launch on VibeMarket',
    description: 'Collect, trade, and showcase your BIZARRE cards on the VibeMarket platform.',
    category: 'community',
    language: 'en',
    readTime: 7,
    topic: 'Partnership',
    difficulty: 'intermediate',
    featured: false,
    updatedDate: 'Dec 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/bizarrebeasts-card-packs-launch-on-vibemarket',
    tags: ['vibemarket', 'cards', 'collectibles']
  },
  {
    id: 'hologram-booster-packs',
    title: 'New Hologram Booster Expansion Packs',
    description: 'Introducing holographic cards and booster packs for BizarreBeasts VibeCards collection.',
    category: 'empire',
    language: 'en',
    readTime: 5,
    topic: 'Feature',
    difficulty: 'intermediate',
    featured: false,
    updatedDate: 'Nov 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/new-hologram-booster-expansion-packs-for-bizarrebeasts-vibecards-%F0%9F%9A%80',
    tags: ['vibemarket', 'cards', 'hologram']
  },
  {
    id: 'vibemarket-empire-revolution',
    title: 'VibeMarket x $GLANKER Empire Revolution',
    description: 'The partnership bringing Empire mechanics to collectible card trading.',
    category: 'empire',
    language: 'en',
    readTime: 8,
    topic: 'Integration',
    difficulty: 'intermediate',
    featured: false,
    updatedDate: 'Nov 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/vibemarket-x-dollarglanker-empire-revolution',
    tags: ['vibemarket', 'empire', 'partnership']
  },

  // COMMUNITY & COLLABORATIONS
  {
    id: 'community-access-grants',
    title: 'Community Access Grants: Unleashing Inclusivity',
    description: 'How BizarreBeasts is making Web3 accessible to everyone through community grants.',
    category: 'community',
    language: 'en',
    readTime: 8,
    topic: 'Grants',
    difficulty: 'beginner',
    featured: false,
    updatedDate: 'Dec 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/bizarrebeasts-community-access-grants-unleashing-the-power-of-inclusivity',
    tags: ['community', 'grants', 'inclusivity']
  },
  {
    id: 'miniapp-launch',
    title: 'BizarreBeasts MiniApp: Your BIZARRE Dashboard',
    description: 'The official BizarreBeasts miniapp has arrived - your hub for all things BIZARRE.',
    category: 'technical',
    language: 'en',
    readTime: 6,
    topic: 'Launch',
    difficulty: 'beginner',
    featured: false,
    updatedDate: 'Apr 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/bizarrebeasts-miniapp-your-bizarre-dashboard-has-arrived',
    tags: ['miniapp', 'tools', 'dashboard']
  },
  {
    id: 'feedcoin-launch',
    title: 'The BizarreBeasts FeedCoin Powered by $PRO',
    description: 'Introducing our social token integration with the $PRO ecosystem.',
    category: 'tokens',
    language: 'en',
    readTime: 5,
    topic: 'Partnership',
    difficulty: 'intermediate',
    featured: false,
    updatedDate: 'Nov 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/the-bizarrebeasts-feedcoin-powered-by-dollarpro-is-live',
    tags: ['feedcoin', 'social', 'tokens']
  },
  {
    id: 'brnd-top3',
    title: 'BizarreBeasts Hits BRND\'s Top 3',
    description: 'Climbing the Farcaster brand ranks - a community achievement.',
    category: 'community',
    language: 'en',
    readTime: 4,
    topic: 'Guide',
    difficulty: 'beginner',
    featured: false,
    updatedDate: 'Nov 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/bizarrebeasts-hits-brnds-top-3-climbing-the-farcaster-brand-ranks',
    tags: ['brnd', 'farcaster', 'achievement']
  },
  {
    id: 'productclank-synergies',
    title: 'Unleashing Synergies: ProductClank + GigBot + Glanker',
    description: 'How strategic partnerships drive BIZARRE growth in the Web3 ecosystem.',
    category: 'community',
    language: 'en',
    readTime: 10,
    topic: 'Guide',
    difficulty: 'intermediate',
    featured: false,
    updatedDate: 'Jun 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/unleashing-synergies-productclank-gigbot-glanker-=-bizarre-growth',
    tags: ['partnerships', 'growth', 'strategy']
  },

  // ART & NFT DROPS
  {
    id: 'bizarre-ghost-collection',
    title: 'New NFT Drop: Bizarre G0hst Collection',
    description: 'The haunting new collection of BIZARRE spirits is now live for minting.',
    category: 'art',
    language: 'en',
    readTime: 5,
    topic: 'NFT Drop',
    difficulty: 'beginner',
    featured: false,
    updatedDate: 'Dec 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/new-nft-drop-bizarre-g0hst-collection-is-live',
    tags: ['nft', 'collection', 'art']
  },
  {
    id: 'ollie-graffiti-auction',
    title: '1/1 Art Auction: Ollie Doin\' Graffiti',
    description: 'Exclusive auction for a unique hand-illustrated BizarreBeasts artwork.',
    category: 'art',
    language: 'en',
    readTime: 5,
    topic: 'Auction',
    difficulty: 'beginner',
    featured: false,
    updatedDate: 'Jun 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/11-art-auction-ollie-doin-graffiti',
    tags: ['auction', 'art', '1/1']
  },
  {
    id: 'plantstan-auction',
    title: 'Cultivate the Bizarre: PlantStan Auction',
    description: 'Exclusive 1/1 auction for $BB holders - a botanical BIZARRE creation.',
    category: 'art',
    language: 'en',
    readTime: 5,
    topic: 'Guide',
    difficulty: 'beginner',
    featured: false,
    updatedDate: 'Jun 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/cultivate-the-bizarre-plantstan-%E2%80%94-exclusive-11-auction-for-dollarbb-holders',
    tags: ['auction', 'art', 'exclusive']
  },
  {
    id: 'watcher-odd-moon',
    title: 'IRL Painting: Watcher of the Odd Moon',
    description: 'Physical artwork meets digital - a BizarreBeasts canvas creation.',
    category: 'art',
    language: 'en',
    readTime: 7,
    topic: 'Guide',
    difficulty: 'beginner',
    featured: false,
    updatedDate: 'May 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/irl-painting-watcher-of-the-odd-moon',
    tags: ['painting', 'irl', 'art']
  },
  {
    id: 'the-audience-painting',
    title: 'Painting Sale and NFT Release: The Audience',
    description: 'Limited edition physical painting and NFT hybrid release.',
    category: 'art',
    language: 'en',
    readTime: 6,
    topic: 'Guide',
    difficulty: 'beginner',
    featured: false,
    updatedDate: 'Apr 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/painting-sale-and-nft-release-the-audience',
    tags: ['painting', 'nft', 'hybrid']
  },
  {
    id: 'bizarre-remix-posterfun',
    title: 'The Bizarre Remix: Co-Creating with PosterFun',
    description: 'Community art collaboration bringing $BB holders into the creative process.',
    category: 'community',
    language: 'en',
    readTime: 8,
    topic: 'Collaboration',
    difficulty: 'intermediate',
    featured: false,
    updatedDate: 'Jun 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/the-bizarre-remix-co-creating-art-and-community-with-dollarbb-and-posterfun',
    tags: ['collaboration', 'community-art', 'posterfun']
  },

  // COLLABORATIONS
  {
    id: 'grumbeast-collab',
    title: 'GrumBeast: BizarreBeasts x Grum Reapur Collaboration',
    description: 'A cross-community collaboration bringing together $BB and $REAPS.',
    category: 'community',
    language: 'en',
    readTime: 6,
    topic: 'Collaboration',
    difficulty: 'beginner',
    featured: false,
    updatedDate: 'Apr 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/grumbeast-a-bizarrebeasts-dollarbb-x-grum-reapur-dollarreaps-collaboration',
    tags: ['collaboration', 'grumbeast', 'partnership']
  },
  {
    id: 'bb-sausage-collab',
    title: 'BizarreBeasts x $SAUSAGE Collaboration',
    description: 'The spicy collaboration bringing two communities together.',
    category: 'community',
    language: 'en',
    readTime: 5,
    topic: 'Collaboration',
    difficulty: 'beginner',
    featured: false,
    updatedDate: 'Apr 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/bizarrebeasts-dollarbb-x-dollarsausage-collab',
    tags: ['collaboration', 'sausage', 'partnership']
  },

  // UPDATES & RECAPS
  {
    id: 'june-2025-recap',
    title: 'June 2025: Month of BIZARRE Breakthroughs',
    description: 'Monthly recap of all the BIZARRE developments and community growth.',
    category: 'monthly-updates',
    language: 'en',
    readTime: 10,
    topic: 'Monthly Recap',
    difficulty: 'beginner',
    featured: false,
    updatedDate: 'Jun 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/june-2025-the-month-of-bizarre-breakthroughs-and-beastly-growth',
    tags: ['recap', 'monthly', 'updates']
  },
  {
    id: 'may-2025-recap',
    title: 'May 2025 Recap',
    description: 'All the BIZARRE happenings from May 2025.',
    category: 'monthly-updates',
    language: 'en',
    readTime: 8,
    topic: 'Monthly Recap',
    difficulty: 'beginner',
    featured: false,
    updatedDate: 'May 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/may-2025-recap',
    tags: ['recap', 'monthly', 'updates']
  },
  {
    id: 'april-2025-recap',
    title: 'April 2025 Monthly Recap',
    description: 'Highlights and achievements from April 2025.',
    category: 'monthly-updates',
    language: 'en',
    readTime: 8,
    topic: 'Monthly Recap',
    difficulty: 'beginner',
    featured: false,
    updatedDate: 'Apr 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/april-2025-monthly-recap',
    tags: ['recap', 'monthly', 'updates']
  },
  {
    id: 'june-art-rollup',
    title: 'June BizarreBeasts Art and Blog Rollup',
    description: 'All the creative outputs from June collected in one place.',
    category: 'art',
    language: 'en',
    readTime: 10,
    topic: 'Art Showcase',
    difficulty: 'beginner',
    featured: false,
    updatedDate: 'Jun 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/june-bizarrebeasts-art-and-blog-rollup',
    tags: ['art', 'rollup', 'monthly']
  },
  {
    id: 'may-art-rollup',
    title: 'May BizarreBeasts Art Rollup',
    description: 'Collection of all artwork and creative projects from May.',
    category: 'art',
    language: 'en',
    readTime: 8,
    topic: 'Art Showcase',
    difficulty: 'beginner',
    featured: false,
    updatedDate: 'May 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/may-bizarrebeasts-art-rollup',
    tags: ['art', 'rollup', 'monthly']
  },
  {
    id: 'april-art-rollup',
    title: 'April\'s BizarreBeasts Art Rollup',
    description: 'Showcasing the month\'s creative achievements.',
    category: 'art',
    language: 'en',
    readTime: 8,
    topic: 'Art Showcase',
    difficulty: 'beginner',
    featured: false,
    updatedDate: 'Apr 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/aprils-bizarrebeasts-art-rollup',
    tags: ['art', 'rollup', 'monthly']
  },

  // TECHNICAL & DEVELOPMENT
  {
    id: 'animating-bizarre',
    title: 'Animating the BIZARRE: DCP\'s Onchain Creators Award',
    description: 'BizarreBeasts applies for recognition in Web3 creative innovation.',
    category: 'technical',
    language: 'en',
    readTime: 8,
    topic: 'Guide',
    difficulty: 'intermediate',
    featured: false,
    updatedDate: 'Dec 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/animating-the-bizarre-bizarrebeasts-applies-for-dcps-onchain-creators-award',
    tags: ['awards', 'animation', 'recognition']
  },
  {
    id: 'code-creativity-collab',
    title: 'Code, Creativity, and Collaboration',
    description: 'The intersection of technical development and artistic expression in BizarreBeasts.',
    category: 'technical',
    language: 'en',
    readTime: 12,
    topic: 'Guide',
    difficulty: 'intermediate',
    featured: false,
    updatedDate: 'Jun 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/code-creativity-and-collaboration',
    tags: ['development', 'creativity', 'technical']
  },
  {
    id: 'unleash-the-beast',
    title: 'Unleash the $BEAST',
    description: 'Technical deep dive into the $BEAST token mechanics and ecosystem.',
    category: 'tokens',
    language: 'en',
    readTime: 10,
    topic: 'Guide',
    difficulty: 'intermediate',
    featured: false,
    updatedDate: 'May 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/unleash-the-dollarbeast',
    tags: ['beast', 'tokens', 'technical']
  },
  {
    id: 'bizarre-summer',
    title: 'New Rounds: Bizarre Summer ☀️',
    description: 'Summer campaign launch and seasonal activities.',
    category: 'community',
    language: 'en',
    readTime: 5,
    topic: 'Guide',
    difficulty: 'beginner',
    featured: false,
    updatedDate: 'Jun 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/new-rounds-bizarre-summer-%E2%98%80%EF%B8%8F',
    tags: ['campaign', 'summer', 'events']
  },

  // INTERNATIONAL
  {
    id: 'spanish-guide',
    title: 'Primeros pasos con BizarreBeasts',
    description: 'Guía completa en español para comenzar en el universo BizarreBeasts.',
    category: 'international',
    language: 'es',
    readTime: 12,
    topic: 'Guide',
    difficulty: 'beginner',
    featured: false,
    updatedDate: 'Dec 2024',
    externalUrl: 'https://paragraph.com/@bizarrebeasts/primeros-pasos-con-bizarrebeasts',
    tags: ['español', 'guía', 'principiantes']
  },
  {
    id: 'korean-guide',
    title: 'BizarreBeasts 제국을 발견하세요',
    description: '시작을 위한 모든 정보 - Korean language guide to BizarreBeasts ecosystem.',
    category: 'international',
    language: 'ko',
    readTime: 12,
    topic: 'Guide',
    difficulty: 'beginner',
    featured: false,
    updatedDate: 'Apr 2024',
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
    id: 'join-empire',
    title: 'Join the Empire',
    description: 'Steps to become part of the BizarreBeasts Empire leaderboard.',
    steps: [
      { number: 1, text: 'Acquire $BB tokens (minimum 100,000)' },
      { number: 2, text: 'Hold tokens in your wallet' },
      { number: 3, text: 'Check your rank on the Empire page' },
      { number: 4, text: 'Unlock tier-based benefits automatically' }
    ]
  },
  {
    id: 'play-games',
    title: 'Start Playing Games',
    description: 'Get started with BizarreBeasts games on Remix.',
    steps: [
      { number: 1, text: 'Visit the Games section' },
      { number: 2, text: 'Choose your platform (Farcaster, Telegram, Web)' },
      { number: 3, text: 'Click Play on any game' },
      { number: 4, text: 'Compete for high scores and rewards' }
    ]
  }
];

// Article collections for dropdown/collapsible sections
export const articleCollections = {
  monthlyRecaps: [
    'june-2025-recap',
    'may-2025-recap',
    'april-2025-recap'
  ],
  artRollups: [
    'june-art-rollup',
    'may-art-rollup',
    'april-art-rollup'
  ],
  collaborations: [
    'grumbeast-collab',
    'bb-sausage-collab',
    'bizarre-remix-posterfun'
  ],
  nftDrops: [
    'bizarre-ghost-collection',
    'ollie-graffiti-auction',
    'plantstan-auction',
    'watcher-odd-moon',
    'the-audience-painting'
  ]
};