/**
 * NFT Collections Data
 * Contains information about all BizarreBeasts NFT collections
 */

export interface NFTCollection {
  id: string;
  name: string;
  symbol: string;
  description: string;
  contractAddress: string;
  chainId: number;
  type: 'ERC-721' | 'ERC-1155';
  supply: number;
  holders: number;
  floorPrice?: string;
  coverImage: string;
  coverTokenId?: string; // Specific token ID to use as cover image
  featured: boolean;
  status: 'live' | 'upcoming' | 'sold-out' | 'ended';
  claimable: boolean;
  requiresDGEN1?: boolean;
  category?: string; // Category for organization
}

export const NFT_COLLECTIONS: NFTCollection[] = [
  // In-App Exclusive - Mintable with BB Tokens!
  {
    id: 'in-app-exclusive',
    name: "BizBe's Booty Shake - In-App Exclusive",
    symbol: 'BBEXC',
    description: 'The first-ever BizarreBeasts In-App Exclusive NFT! Watch BizBe shake their legendary booty in this animated collectible. Limited to 500 pieces, only mintable with $BB tokens. Features dynamic bonding curve pricing (5M-20M BB). 100% of proceeds used to fund community rewards, treasury drops, and token burns.',
    contractAddress: '0x177D2210B8fd8Ee3bF77D37F2C4a561f6479d0F0',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 500,
    holders: 0,
    coverImage: '/assets/nft/nfts-for-inapp-mint/treasure-quest-inapp-exclusive-bizbe-booty-shaking-animation-1.gif',
    featured: true,
    status: 'live',
    claimable: true,
    category: 'Featured Collections',
  },

  // Featured VibeMarket Collection
  {
    id: 'bbcp-vibemarket',
    name: 'BizarreBeasts ($BBCP) VibeMarket Cards',
    symbol: 'BBCP',
    description: 'Limited-edition pack of cards featuring hand-illustrated BizarreBeasts artwork, brought to life against a backdrop of retro-futuristic, 1990s-inspired designs. 31 unique card designs.',
    contractAddress: '0xcebff8f7db53062ade8e3f131a85283131168e59',
    chainId: 8453,
    type: 'ERC-721',
    supply: 1609,
    holders: 150, // Estimated
    coverImage: '/assets/nft/collections/bbcp-vibemarket-cover.png',
    coverTokenId: '1263',
    featured: true,
    status: 'live',
    claimable: false,
    category: 'Popular Collections', // Moved from Featured - has banner at top
  },

  // Featured Upcoming Drop
  {
    id: 'dgen1-genesis',
    name: 'DGEN1 Exclusive Genesis',
    symbol: 'BBGEN',
    description: 'First-ever miniapp-exclusive NFT drop! Only DGEN1 holders can claim. Hand-drawn original artwork with unique utilities and perks.',
    contractAddress: '', // Will be deployed
    chainId: 8453,
    type: 'ERC-721',
    supply: 0, // TBD
    holders: 0,
    coverImage: '/assets/nft/dgen1-with-bb-art.png',
    featured: true,
    status: 'upcoming',
    claimable: true,
    requiresDGEN1: true,
  },

  // Popular Collections
  {
    id: 'treasure-quest',
    name: 'Treasure Quest by BizarreBeasts',
    symbol: 'TQBB',
    description: 'Treasure Quest game NFTs. Collectible items and rewards from the BizarreBeasts Treasure Quest game.',
    contractAddress: '0xB66bF0d9196D8746564C84Ece150d51F63FD74Cf',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 3,
    holders: 10,
    coverImage: '/assets/nft/collections/treasure-quest-cover.png',
    featured: true,
    status: 'live',
    claimable: false,
    category: 'Featured Collections',
  },
  {
    id: 'head-crush',
    name: 'BizarreBeasts: Head Crush',
    symbol: 'BBHEADCRUSHART',
    description: 'Artwork from the Head Crush game. Popular collection with 657 holders featuring original game art and characters.',
    contractAddress: '0x5F9f7b7e9cCEAD211D2448175910bFa38C80e607',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 26,
    holders: 657,
    coverImage: '/assets/nft/collections/head-crush-cover.png',
    featured: false,
    status: 'live',
    claimable: false,
  },
  {
    id: 'rodeo-posts',
    name: 'Rodeo Posts',
    symbol: 'RODEO',
    description: 'Exclusive Rodeo posts collection with 220 holders. Limited edition community artwork and posts.',
    contractAddress: '0xd3666669292614f6d94b1a774854addccad3556b',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 1470,
    holders: 220,
    coverImage: '/assets/nft/collections/rodeo-posts-cover.png',
    coverTokenId: '23',
    featured: true,
    status: 'live',
    claimable: false,
    category: 'Featured Collections',
  },
  {
    id: 'farcaster-drops',
    name: 'BizarreBeasts Farcaster Drops',
    symbol: 'BBFD',
    description: 'Exclusive Farcaster community drops. 127 holders collecting unique BizarreBeasts artwork shared on Farcaster.',
    contractAddress: '0xad50a7b6c2bd95c0499758133d457c14ce845412',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 50, // Estimated
    holders: 127,
    coverImage: '/assets/nft/collections/farcaster-drops-cover.png',
    featured: false,
    status: 'live',
    claimable: false,
  },

  // Game Collections
  {
    id: 'memory-game-s1',
    name: 'Memory Game PFPs - Series 1',
    symbol: 'BBMGPFPS1',
    description: 'Series 1 PFPs from the BizarreBeasts Memory Game. Collectible profile pictures with unique traits.',
    contractAddress: '0xb86B7Dc57887AA2E000b20d7E0bd8ac0D407590f',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 9,
    holders: 48,
    coverImage: '/assets/nft/collections/memory-game-s1-cover.png',
    coverTokenId: '1',
    featured: true,
    status: 'live',
    claimable: false,
    category: 'Featured Collections',
  },
  {
    id: 'memory-game-s2',
    name: 'Memory Game PFPs - Series 2',
    symbol: 'BBMGPFPS2',
    description: 'Series 2 PFPs from the BizarreBeasts Memory Game. Continued collection of unique profile pictures.',
    contractAddress: '0x45258c590dda18fd714365d3e32AFA5b64c04E9f',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 8,
    holders: 31,
    coverImage: '/assets/nft/collections/memory-game-s2-cover.png',
    featured: false,
    status: 'live',
    claimable: false,
  },
  {
    id: 'memory-game-s3',
    name: 'Memory Game PFPs - Series 3',
    symbol: 'BBMGPFPS3',
    description: 'Series 3 PFPs from the BizarreBeasts Memory Game. Latest series with new character variations.',
    contractAddress: '0x6539eDe08D87346b74f24476260b50a839FBf94E',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 9,
    holders: 10,
    coverImage: '/assets/nft/collections/memory-game-s3-cover.png',
    featured: false,
    status: 'live',
    claimable: false,
  },
  {
    id: 'bizarre-bounce',
    name: 'Bizarre Bounce',
    symbol: 'BBBG',
    description: 'Original game artwork collection. 5 unique NFTs featuring characters and elements from the Bizarre Bounce game.',
    contractAddress: '0x2E8FCA4B9cddDF07cE9eE0B1317A3b0d7a3A4A59',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 5,
    holders: 9,
    coverImage: '/assets/nft/collections/bizarre-bounce-cover.png',
    coverTokenId: '2',
    featured: false,
    status: 'live',
    claimable: false,
  },
  {
    id: 'checkerz',
    name: 'BizarreBeasts: Checkerz',
    symbol: 'BBCHCKRZ',
    description: 'Checkerz game artwork collection. Original NFTs from the BizarreBeasts Checkerz game.',
    contractAddress: '0x9B24FbF3a7CD4a086482bd624371A64EC4A2f8d3',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 7,
    holders: 4,
    coverImage: '/assets/nft/collections/checkerz-cover.png',
    featured: false,
    status: 'live',
    claimable: false,
  },

  // Special Drops
  {
    id: 'hypersub-drops',
    name: 'Hypersub Exclusive Drops',
    symbol: 'BBHYPED',
    description: 'Exclusive drops for Hypersub subscribers. Limited edition artwork for the BizarreBeasts community.',
    contractAddress: '0x43de2de346255e75b2df539841bbaeb6dd576d59',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 50, // Estimated
    holders: 36,
    coverImage: '/assets/nft/collections/hypersub-drops-cover.png',
    featured: false,
    status: 'live',
    claimable: false,
  },
  {
    id: 'empire-drops',
    name: '$BB Empire Drops',
    symbol: 'BBED',
    description: 'Exclusive NFT drops for $BB Empire members. Reward NFTs for top Empire leaderboard holders.',
    contractAddress: '0xaab8ed02ea595d26e299c245330e4d5a744caa1b',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 30, // Estimated
    holders: 24,
    coverImage: '/assets/nft/collections/empire-drops-cover.png',
    featured: true,
    status: 'live',
    category: 'Featured Collections',
    claimable: false,
  },
  {
    id: 'hologram-token',
    name: 'Hologram Token',
    symbol: 'BBHG',
    description: '$BB Hologram Token collection. Special edition holographic-style BizarreBeasts artwork.',
    contractAddress: '0xd73cdcb4a61e6255300c7d8f6578a03f8a159e5a',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 20, // Estimated
    holders: 23,
    coverImage: '/assets/nft/collections/hologram-token-cover.png',
    featured: false,
    status: 'live',
    claimable: false,
  },

  // Character Collections
  {
    id: 'g0hst',
    name: 'BizarreBeasts g0hst',
    symbol: 'BBGHST',
    description: 'g0hst character collection. Exclusive BizarreBeasts character artwork.',
    contractAddress: '0x676CBB23C96947164dFc6F4f3626068feC9d5b2B',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 8,
    holders: 22,
    coverImage: '/assets/nft/collections/g0hst-cover.png',
    featured: false,
    status: 'live',
    claimable: false,
  },
  {
    id: 'electric-shock',
    name: 'Electric Shock',
    symbol: 'BBELESHO',
    description: 'Electric Shock game artwork. High-voltage BizarreBeasts characters and elements.',
    contractAddress: '0x43d5B903402dbe79722ad84dB9260325A3622485',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 3,
    holders: 16,
    coverImage: '/assets/nft/collections/electric-shock-cover.png',
    featured: false,
    status: 'live',
    claimable: false,
  },
  {
    id: 'petz-collector',
    name: 'Petz Collector',
    symbol: 'PETZ',
    description: 'Collectible Petz artwork. Unique BizarreBeasts pet characters.',
    contractAddress: '0xe395C9a66BF7D9b3a009A5cD26e0a1Bd95e446A5',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 1,
    holders: 16,
    coverImage: '/assets/nft/collections/petz-collector-cover.png',
    featured: false,
    status: 'live',
    claimable: false,
  },
  {
    id: 'lloyd',
    name: 'BizarreBeasts - Lloyd',
    symbol: 'BBLLOYD',
    description: 'Lloyd character collection. Original BizarreBeasts character artwork.',
    contractAddress: '0x9e4e939B192f4eB993C75797BcB19bF4953Aeb6C',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 4,
    holders: 7,
    coverImage: '/assets/nft/collections/lloyd-cover.png',
    featured: false,
    status: 'live',
    claimable: false,
  },
  {
    id: 'barry',
    name: 'BizarreBeasts - Barry',
    symbol: 'BBBARRY',
    description: 'Barry character collection. Original BizarreBeasts character artwork.',
    contractAddress: '0xE5A4F5FeAfBE6F5b06A356ea9a9F91bd312E54b6',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 4,
    holders: 7,
    coverImage: '/assets/nft/collections/barry-cover.png',
    featured: false,
    status: 'live',
    claimable: false,
  },
  {
    id: 'munchies',
    name: 'BizarreBeasts Munchies',
    symbol: 'BBMUNCH',
    description: 'Collectible food-themed NFTs. 10 unique pieces with holder perks and utilities in the BizarreBeasts ecosystem.',
    contractAddress: '0x1DeF3CB2b47C47F546AA9cf7970c3d55bD3C83EB',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 10,
    holders: 25,
    coverImage: '/assets/nft/collections/munchies-cover.png',
    featured: true,
    status: 'live',
    claimable: false,
    category: 'Featured Collections',
  },

  // Small/Exclusive Collections
  {
    id: 'custom-pfps',
    name: 'Custom BizarreBeasts PFPs',
    symbol: 'CBBPFPS',
    description: 'Custom-made profile pictures. Exclusive commissioned BizarreBeasts artwork.',
    contractAddress: '0xe48847e5b1e3b0abdbab2a566063587835c40f1a',
    chainId: 8453,
    type: 'ERC-721',
    supply: 5, // Estimated
    holders: 2,
    coverImage: '/assets/nft/collections/custom-pfps-cover.png',
    featured: false,
    status: 'live',
    claimable: false,
  },
  {
    id: 'empire-1of1s',
    name: '$BB Empire 1/1s',
    symbol: 'BBEONES',
    description: 'Exclusive 1/1 artwork for Empire top holders. Ultra-rare original BizarreBeasts pieces.',
    contractAddress: '0x2614834f6e5d1fab91d9dee492f1d314694947d3',
    chainId: 8453,
    type: 'ERC-721',
    supply: 10, // Estimated
    holders: 1,
    coverImage: '/assets/nft/collections/empire-1of1s-cover.png',
    featured: true,
    status: 'live',
    claimable: false,
    category: 'Featured Collections',
  },
  {
    id: 'sausage-collab',
    name: 'BizarreBeasts x Sausage Collab',
    symbol: 'BBSDCLLB',
    description: 'Collaboration with Sausage. Limited edition crossover artwork.',
    contractAddress: '0xcc4139D7608E7Bb6Cbe22cDA63c85fC63a1c3827',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 2,
    holders: 2,
    coverImage: '/assets/nft/collections/sausage-collab-cover.png',
    featured: false,
    status: 'live',
    claimable: false,
  },
  {
    id: 'free-mints',
    name: 'Farcaster Free Mints',
    symbol: 'BBFFREE',
    description: 'Free mint collection for Farcaster community. Complimentary BizarreBeasts artwork.',
    contractAddress: '0xf8b259c95b8e848bfa122ac42fe5a12129cedd3b',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 10, // Estimated
    holders: 2,
    coverImage: '/assets/nft/collections/free-mints-cover.png',
    featured: false,
    status: 'live',
    claimable: false,
  },
  {
    id: 'grum-reapur',
    name: '$BB x Grum Reapur',
    symbol: 'BBREAPS',
    description: 'BizarreBeasts x Grum Reapur collaboration. Cross-project artwork collection.',
    contractAddress: '0xf63105c3A2300cbA5A34819a4Aa3186877Af2d58',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 10,
    holders: 1, // Estimated (showed 0 but has supply)
    coverImage: '/assets/nft/collections/grum-reapur-cover.png',
    featured: false,
    status: 'live',
    claimable: false,
  },
  {
    id: 'bbburn',
    name: 'BBBurn',
    symbol: 'BBBURN',
    description: 'BBBurn special collection. Unique burn-mechanic NFTs.',
    contractAddress: '0x5dfcbdbB8E2721820155DC19093FF38c3cBB170d',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 3,
    holders: 32,
    coverImage: '/assets/nft/collections/bbburn-cover.png',
    featured: true,
    status: 'live',
    claimable: false,
    category: 'Featured Collections',
  },
  {
    id: 'benito',
    name: 'BizarreBeasts - Benito',
    symbol: 'BBBNT',
    description: 'Benito character collection. Exclusive BizarreBeasts character.',
    contractAddress: '0x3FC072806A845d0531235A2ea58BD953dAdc303c',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 1,
    holders: 1, // Estimated (showed 0 but has supply)
    coverImage: '/assets/nft/collections/benito-cover.png',
    featured: false,
    status: 'live',
    claimable: false,
  },

  // === NEW COLLECTIONS FROM 0x3FDD6aFEd7a19990632468c7102219d051E685dB ===

  // High Holder Collections
  {
    id: 'bizarrebeasts-pfps',
    name: 'BizarreBeasts PFPs',
    symbol: 'BBPFPS',
    description: 'Popular PFP collection with 193 holders. Profile picture variations of BizarreBeasts characters.',
    contractAddress: '0x5aa250093fb51303fd269336d439495b2c4fa3ef',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 50, // Estimated
    holders: 193,
    coverImage: '/assets/nft/collections/bizarrebeasts-pfps-cover.png',
    featured: false,
    status: 'live',
    claimable: false,
  },
  {
    id: 'cat-cazlone-comic',
    name: 'The Cat Cazlone Onchain Comic',
    symbol: 'CATCOMIC',
    description: 'Onchain comic series featuring Cat Cazlone. 40 holders collecting this narrative art series.',
    contractAddress: '0x7fa3e343a666b387a8003bd27cff50c5949ad5e2',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 20, // Estimated
    holders: 40,
    coverImage: '/assets/nft/collections/cat-cazlone-comic-cover.png',
    featured: true,
    status: 'live',
    claimable: false,
    category: 'Featured Collections',
  },
  {
    id: 'onchain-summer',
    name: 'BizarreBeasts.io Onchain Summer',
    symbol: 'BBOCS',
    description: 'Onchain Summer special edition. Limited summer-themed BizarreBeasts artwork.',
    contractAddress: '0x9e09b02f7157022bec2746eccb7a6f05c359cb59',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 10, // Estimated
    holders: 10,
    coverImage: '/assets/nft/collections/onchain-summer-cover.png',
    featured: false,
    status: 'live',
    claimable: false,
  },

  // Art & Character Collections
  {
    id: 'painted-series',
    name: 'BizarreBeasts: Painted Series',
    symbol: 'BBPS',
    description: 'Hand-painted artwork series. Traditional art meets blockchain with unique painted BizarreBeasts pieces.',
    contractAddress: '0xcdb4bba1ccb5564843103f0d7bce2bcbb3c00b35',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 15, // Estimated
    holders: 5,
    coverImage: '/assets/nft/collections/painted-series-cover.png',
    featured: false,
    status: 'live',
    claimable: false,
  },
  {
    id: 'night-beast',
    name: 'Night Beast',
    symbol: 'NIGHTBB',
    description: 'Dark and mysterious Night Beast character collection. Nocturnal BizarreBeasts variants.',
    contractAddress: '0xca5243d86ecdd06ff4008620c826ff6d960a4a9b',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 10, // Estimated
    holders: 3,
    coverImage: '/assets/nft/collections/night-beast-cover.png',
    featured: true,
    status: 'live',
    claimable: false,
    category: 'Featured Collections',
  },
  {
    id: 'hero-pfps',
    name: 'BizarreBeasts Hero PFPs',
    symbol: 'BBHERO',
    description: 'Hero-themed profile pictures. Heroic versions of BizarreBeasts characters.',
    contractAddress: '0x4c3b8ec72e9ef22195f56627ea006d9247a11c1b',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 20, // Estimated
    holders: 8,
    coverImage: '/assets/nft/collections/hero-pfps-cover.png',
    featured: false,
    status: 'live',
    claimable: false,
  },
  {
    id: 'social-pfp',
    name: 'BizarreBeasts x $Social PFP',
    symbol: 'BBSOCIAL',
    description: 'Collaboration with $Social. Exclusive social media optimized profile pictures.',
    contractAddress: '0x0a62f4f8eb5cd902499ba5d6a5c1a653a3477417',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 15, // Estimated
    holders: 6,
    coverImage: '/assets/nft/collections/social-pfp-cover.png',
    featured: false,
    status: 'live',
    claimable: false,
  },
  {
    id: 'beastholes-s1',
    name: 'Bizarre BeastHoles: Series 1',
    symbol: 'BBHOLE1',
    description: 'BeastHoles Series 1. First edition of the BeastHoles collection.',
    contractAddress: '0x71c2ccc797942a8a13da427aa8cd6175a4fce517',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 12, // Estimated
    holders: 4,
    coverImage: '/assets/nft/collections/beastholes-s1-cover.png',
    featured: false,
    status: 'live',
    claimable: false,
  },

  // Community Drops
  {
    id: 'warpcast-rewards',
    name: 'BizarreBeasts x Warpcast Reward Drops',
    symbol: 'BBWARP',
    description: 'Exclusive reward drops for Warpcast community members. Limited distribution.',
    contractAddress: '0x0e87fc6f40ad34f77eee31a0c8e1ea33cb4a699e',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 25, // Estimated
    holders: 12,
    coverImage: '/assets/nft/collections/warpcast-rewards-cover.png',
    featured: false,
    status: 'live',
    claimable: false,
  },
  {
    id: 'onchain-comic-strip',
    name: 'BizarreBeasts Onchain Comic Strip',
    symbol: 'BBCOMIC',
    description: 'Ongoing onchain comic strip series. Collectible comic panels telling BizarreBeasts stories.',
    contractAddress: '0xd4e596b2badc1db74244f2edf452654d44a71c3b',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 30, // Estimated
    holders: 15,
    coverImage: '/assets/nft/collections/onchain-comic-strip-cover.png',
    featured: false,
    status: 'live',
    claimable: false,
  },
  {
    id: 'fan-token-exclusive',
    name: 'BizarreBeasts Fan Token Holders Exclusive Drops',
    symbol: 'BBFTEX',
    description: 'Exclusive drops for $BB fan token holders. Reward NFTs for loyal supporters.',
    contractAddress: '0xcaf52a37409bd2bd0cdc2ce25c5aa3499d4fde8d',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 20, // Estimated
    holders: 18,
    coverImage: '/assets/nft/collections/fan-token-exclusive-cover.png',
    featured: false,
    status: 'live',
    claimable: false,
  },
  {
    id: 'bb-collab',
    name: 'BizarreBeasts x Collab',
    symbol: 'BBCOLLAB',
    description: 'General collaboration collection. Various partnership artworks and special editions.',
    contractAddress: '0x5bec4ca780bc23060987d852746367e84e465856',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 15, // Estimated
    holders: 8,
    coverImage: '/assets/nft/collections/bb-collab-cover.png',
    featured: false,
    status: 'live',
    claimable: false,
  },
  {
    id: 'dance-party',
    name: 'BizarreBeasts Dance Party Hans and Edgar',
    symbol: 'BBDANCE',
    description: 'Dance Party featuring Hans and Edgar characters. Fun and vibrant party-themed artwork.',
    contractAddress: '0x2ca919ea0690ff35e070b9cbd6e1cc49bf7c44e6',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 8, // Estimated
    holders: 3,
    coverImage: '/assets/nft/collections/dance-party-cover.png',
    featured: false,
    status: 'live',
    claimable: false,
  },

  // Archive Collections (Old Wallet)
  {
    id: 'rodeo-posts-archive',
    name: 'Rodeo Posts (Archive)',
    symbol: 'RODEOARCH',
    description: 'Original Rodeo posts collection from archive wallet. 1,976 posts preserved onchain.',
    contractAddress: '0x3d3f77ca7f91fe540c3381e7add0ce8ce822dcf9',
    chainId: 8453,
    type: 'ERC-1155',
    supply: 1976,
    holders: 15,
    coverImage: '/assets/nft/collections/rodeo-posts-archive-cover.png',
    coverTokenId: '58',
    featured: false,
    status: 'ended',
    claimable: false,
    category: 'Archive Collections',
  },
  {
    id: 'bizarrebeasts-bzb',
    name: 'BizarreBeasts (BZB)',
    symbol: 'BZB',
    description: 'Original BizarreBeasts collection from archive wallet. Early BizarreBeasts NFTs.',
    contractAddress: '0xba24fcafe3401e7b737752e59082f8517a380ec0',
    chainId: 8453,
    type: 'ERC-721',
    supply: 25, // Estimated
    holders: 8,
    coverImage: '/assets/nft/collections/bizarrebeasts-bzb-cover.png',
    featured: false,
    status: 'ended',
    claimable: false,
    category: 'Archive Collections',
  },
  {
    id: 'petz-collector-bbptcr',
    name: 'Petz Collector',
    symbol: 'BBPTCR',
    description: 'Petz Collector series with 13 unique collectible pets. 4 holders.',
    contractAddress: '0x2d9e6393cd38d5cd7a7df22f070dd724af45a17d',
    chainId: 8453,
    type: 'ERC-721',
    supply: 13,
    holders: 4,
    coverImage: '/assets/nft/collections/petz-collector-cover.png',
    featured: false,
    status: 'ended',
    claimable: false,
    category: 'Archive Collections',
  },
  {
    id: 'petz-collector-pc',
    name: 'Petz Collector (PC)',
    symbol: 'PC',
    description: 'Alternative Petz Collector edition. 9 unique pet variations.',
    contractAddress: '0x7a9a244e115745d975da2843de88f066926a2cac',
    chainId: 8453,
    type: 'ERC-721',
    supply: 9,
    holders: 1,
    coverImage: '/assets/nft/collections/petz-collector-pc-cover.png',
    featured: false,
    status: 'ended',
    claimable: false,
    category: 'Archive Collections',
  },

  // 1/1 & Limited Editions
  {
    id: 'based-egg-party',
    name: 'Based Egg Party - BizarreBeasts',
    symbol: 'BEP',
    description: '1/1 Based Egg Party artwork. Unique celebration piece.',
    contractAddress: '0xe15fd07c6ffe95fb7a11168c29fcd405b4ce4928',
    chainId: 8453,
    type: 'ERC-721',
    supply: 1,
    holders: 1,
    coverImage: '/assets/nft/collections/based-egg-party-cover.png',
    featured: false,
    status: 'ended',
    claimable: false,
    category: '1/1 & Limited Editions',
  },
  {
    id: 'king-krong',
    name: 'King Krong',
    symbol: 'KINGKRO',
    description: 'Limited edition King Krong collection. 4 unique pieces across 4 holders.',
    contractAddress: '0x078c4c5d30694d59ab6e38fad3182b6e9e70840f',
    chainId: 8453,
    type: 'ERC-721',
    supply: 4,
    holders: 4,
    coverImage: '/assets/nft/collections/king-krong-cover.png',
    featured: false,
    status: 'ended',
    claimable: false,
    category: '1/1 & Limited Editions',
  },

  // Based Editions
  {
    id: 'bb-wif-nouns',
    name: 'BizarreBeasts wif Nouns ⌐◨-◨',
    symbol: 'BWN',
    description: '1/1 BizarreBeasts x Nouns collaboration. Iconic crossover artwork.',
    contractAddress: '0x7c8cd280b83e72283526ea3d80deb097a6b9b63e',
    chainId: 8453,
    type: 'ERC-721',
    supply: 1,
    holders: 1,
    coverImage: '/assets/nft/collections/bb-wif-nouns-cover.png',
    featured: false,
    status: 'ended',
    claimable: false,
    category: 'Based Editions',
  },
  {
    id: 'bb-x-base-allin',
    name: 'BizarreBeasts x Base – All in!',
    symbol: 'BXB',
    description: '1/1 Base network celebration piece. All-in on Base!',
    contractAddress: '0xd8e135369dc33cf4b624c5ae555e7f81a1230f54',
    chainId: 8453,
    type: 'ERC-721',
    supply: 1,
    holders: 1,
    coverImage: '/assets/nft/collections/bb-x-base-allin-cover.png',
    featured: false,
    status: 'ended',
    claimable: false,
    category: 'Based Editions',
  },
  {
    id: 'bb-x-swc-shield',
    name: 'BizarreBeasts x SWC Shield',
    symbol: 'BXS',
    description: '1/1 SWC (Standwithcrypto) Shield collaboration. Supporting crypto advocacy.',
    contractAddress: '0x0f2c993d33f22fd537989692fde35ba56cea7adf',
    chainId: 8453,
    type: 'ERC-721',
    supply: 1,
    holders: 1,
    coverImage: '/assets/nft/collections/bb-x-swc-shield-cover.png',
    featured: false,
    status: 'ended',
    claimable: false,
    category: 'Based Editions',
  },

  // Physical Paintings
  {
    id: 'the-florist',
    name: 'THE FLORIST',
    symbol: 'FLORIST',
    description: '1/1 Digital copy of physical painting. Original artwork immortalized onchain.',
    contractAddress: '0x80120a5bdbc3b9b68530413c32990deca4a28b11',
    chainId: 8453,
    type: 'ERC-721',
    supply: 1,
    holders: 1,
    coverImage: '/assets/nft/collections/the-florist-cover.png',
    featured: false,
    status: 'ended',
    claimable: false,
    category: 'Physical Paintings',
  },
  {
    id: 'window-watchers',
    name: 'Window Watchers',
    symbol: 'WATCH',
    description: 'Limited edition physical painting series. 5 unique window watcher scenes. Digital copies of original paintings.',
    contractAddress: '0x045295b597e346b3438bcee5a557192ed42961aa',
    chainId: 8453,
    type: 'ERC-721',
    supply: 5,
    holders: 5,
    coverImage: '/assets/nft/collections/window-watchers-cover.png',
    featured: false,
    status: 'ended',
    claimable: false,
    category: 'Physical Paintings',
  },
  {
    id: 'guy-and-cat',
    name: 'A GUY AND HIS CAT',
    symbol: 'GUYCAT',
    description: '1/1 Digital copy of physical painting. Heartwarming original artwork.',
    contractAddress: '0xe82dac8f96051649954eb43d558a660b9b3c9fa6',
    chainId: 8453,
    type: 'ERC-721',
    supply: 1,
    holders: 1,
    coverImage: '/assets/nft/collections/guy-and-cat-cover.png',
    featured: false,
    status: 'ended',
    claimable: false,
    category: 'Physical Paintings',
  },
  {
    id: 'munchies-physical',
    name: 'Munchies (Physical Painting)',
    symbol: 'MUNCH',
    description: '1/1 Digital copy of physical painting. Original Munchies artwork.',
    contractAddress: '0x5afe5dbcb6f9adaa4baed7f9a4d54ce28f19e150',
    chainId: 8453,
    type: 'ERC-721',
    supply: 1,
    holders: 1,
    coverImage: '/assets/nft/collections/munchies-physical-cover.png',
    featured: false,
    status: 'ended',
    claimable: false,
    category: 'Physical Paintings',
  },
];

// DGEN1 contract for holder verification
export const DGEN1_CONTRACT = {
  address: '0x17d9e1e613bd4bcf069573761aa5be68c773ec7b',
  chainId: 8453,
  name: 'DGEN1',
};

/**
 * Get all collections
 */
export function getAllCollections(): NFTCollection[] {
  return NFT_COLLECTIONS;
}

/**
 * Get featured collection
 */
export function getFeaturedCollection(): NFTCollection | undefined {
  return NFT_COLLECTIONS.find(c => c.featured);
}

/**
 * Get collection by ID
 */
export function getCollectionById(id: string): NFTCollection | undefined {
  return NFT_COLLECTIONS.find(c => c.id === id);
}

/**
 * Get live collections (excluding upcoming)
 */
export function getLiveCollections(): NFTCollection[] {
  return NFT_COLLECTIONS.filter(c => c.status === 'live');
}

/**
 * Get total NFT count
 */
export function getTotalNFTs(): number {
  return NFT_COLLECTIONS.reduce((sum, c) => sum + c.supply, 0);
}

/**
 * Get total unique holders
 */
export function getTotalHolders(): number {
  // Note: This is approximate as some wallets may hold multiple collections
  return NFT_COLLECTIONS.reduce((sum, c) => sum + c.holders, 0);
}

/**
 * Get floor price (lowest among all collections)
 */
export function getFloorPrice(): string | null {
  const prices = NFT_COLLECTIONS
    .filter(c => c.floorPrice)
    .map(c => parseFloat(c.floorPrice!));

  return prices.length > 0 ? `${Math.min(...prices).toFixed(4)}Ξ` : null;
}
