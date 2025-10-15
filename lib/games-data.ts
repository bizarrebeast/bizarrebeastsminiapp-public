// Game data for BizarreBeasts games
export interface GameData {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  bannerImage?: string;
  iconImage?: string;
  plays: number;
  players?: number;
  hoursPlayed?: number;
  rating?: number;
  genre: string;
  platforms: {
    farcaster?: string;
    telegram?: string;
    worldApp?: string;
    online?: string;
  };
  featured: boolean;
  exclusive?: boolean; // Exclusive to BizarreBeasts
  releaseDate?: string;
  lastUpdated?: string;
}

export const gamesData: GameData[] = [
  {
    id: 'bizbe-coin-toss',
    title: "BizBe's Daily Coin Toss",
    description: 'Flip BizBe\'s coin daily and win big! Get one free flip per day to bet on heads (BizBe\'s face) or tails (BizBe\'s butt). Each flip is provably fair using cryptographic verification. Win daily prizes in $BB tokens and compete for the massive monthly prize pool. Additional flips available for $BB holders. Climb the leaderboard and become a coin toss champion!',
    shortDescription: 'Daily provably fair coin flips with monthly prizes',
    bannerImage: '/assets/page-assets/games/banners/bizbe-coin-flip-game-banner-9.svg',
    plays: 430,
    genre: 'Exclusive',
    platforms: {
      online: '/flip'
    },
    featured: true,
    exclusive: true,
    releaseDate: 'January 2025'
  },
  {
    id: 'treasure-quest',
    title: 'BizarreBeasts: Treasure Quest',
    description: 'The BIZARRE masterpiece! An epic underground adventure through the Bizarre Underground. Navigate crystal caverns, dodge dangerous enemies, collect rare gems, and discover legendary treasures. This is the most ambitious BizarreBeasts game yet, featuring hand-illustrated characters, multiple levels, and challenging platformer gameplay.',
    shortDescription: 'Epic underground platformer masterpiece',
    bannerImage: '/assets/page-assets/games/banners/treasure-quest-game-banner-1.svg',
    iconImage: '/assets/stickers/treasure-quest/treasure-quest-game-logo.svg',
    plays: 6000,
    genre: 'Platformer',
    platforms: {
      farcaster: 'https://treasure-quest.remix.gg/',
      telegram: 'https://t.me/the_remix_bot?startapp=user_i1emcnVI6A__path_-games-d281be5d-2111-4a73-afb0-19b2a18c80a9-overview',
      worldApp: 'https://world.org/ecosystem/app_91190f3689f2d34181e9d8495cfa5523',
      online: 'https://treasure-quest.remix.gg/'
    },
    featured: true,
    releaseDate: 'August 27, 2024'
  },
  {
    id: 'bizarre-bounce',
    title: 'Bizarre Bounce',
    description: 'Bounce your way through bizarre obstacles in this addictive arcade game! With 42K+ plays, this fan-favorite features responsive controls optimized for all devices, challenging levels, and endless replayability.',
    shortDescription: 'Addictive bouncing arcade action',
    bannerImage: '/assets/page-assets/games/banners/bizarre-bounce-game-banner-2.svg',
    plays: 44000,
    genre: 'Arcade',
    platforms: {
      farcaster: 'https://bizarre-bounce.remix.gg',
      telegram: 'https://t.me/the_remix_bot?startapp=user_i1emcnVI6A__path_-games-6b07d2de-8a84-4da4-af76-b3c9b3a626a8-overview',
      worldApp: 'https://world.org/mini-app?app_id=app_6205b24a7cb61a04d91557fb65d41688',
      online: 'https://bizarre-bounce.remix.gg'
    },
    featured: true
  },
  {
    id: 'munchies-climb',
    title: 'Munchies Climb',
    description: 'Help Munchies climb to new heights in this vertical adventure! Jump from platform to platform, avoid obstacles, and collect power-ups as you ascend through the bizarre world. How high can you climb?',
    shortDescription: 'Vertical climbing adventure with Munchies',
    bannerImage: '/assets/page-assets/games/banners/munchies-climb-game-banner-3.svg',
    plays: 11000,
    genre: 'Platformer',
    platforms: {
      farcaster: 'https://munchies-climb.remix.gg',
      telegram: 'https://t.me/the_remix_bot?startapp=user_i1emcnVI6A__path_-games-41ca2b98-b47a-4cb1-a827-b210c7479f8d-overview',
      worldApp: '', // coming soon
      online: 'https://munchies-climb.remix.gg'
    },
    featured: false
  },
  {
    id: 'head-crush',
    title: 'Head Crush',
    description: 'Crush, smash, and destroy in this action-packed BizarreBeasts game! Fast-paced gameplay that will test your reflexes and timing. Built through weeks of dedication and continuous improvements based on player feedback.',
    shortDescription: 'Action-packed crushing game',
    bannerImage: '/assets/page-assets/games/banners/head-crush-game-banner-6.svg',
    plays: 20000,
    genre: 'Action',
    platforms: {
      farcaster: 'https://bizarrebeasts-head-crush.remix.gg',
      telegram: 'https://t.me/the_remix_bot?startapp=user_i1emcnVI6A__path_-games-DOncF3WDMGCd-overview',
      worldApp: 'https://world.org/mini-app?app_id=app_18a7624d2af11a2d75e516979f82acc7',
      online: 'https://bizarrebeasts-head-crush.remix.gg'
    },
    featured: false
  },
  {
    id: 'memory-game',
    title: 'Memory Game',
    description: 'Test your memory with BizarreBeasts characters! Flip cards to find matching pairs in this classic memory game with a bizarre twist. Features multiple difficulty levels and unique BizarreBeasts artwork on every card.',
    shortDescription: 'Classic memory matching game with BizarreBeasts',
    bannerImage: '/assets/page-assets/games/banners/bizarrebeasts-memory-game-banner-5.svg',
    plays: 25000,
    genre: 'Puzzle/Memory',
    platforms: {
      farcaster: 'https://bizarrebeasts-memory-game.remix.gg/',
      telegram: 'https://t.me/the_remix_bot?startapp=user_i1emcnVI6A__path_-games-2NrpZ0RDLl6U-overview',
      worldApp: 'https://world.org/mini-app?app_id=app_d9b84a049359e03656317f5a866a0a53',
      online: 'https://bizarrebeasts-memory-game.remix.gg/'
    },
    featured: false
  },
  {
    id: 'tictactoe',
    title: 'BizarreBeasts TicTacToe',
    description: 'The classic game of TicTacToe with a BizarreBeasts twist! Challenge the AI in this single-player version. Features unique BizarreBeasts characters as your game pieces and special victory animations. Multiplayer coming soon!',
    shortDescription: 'Classic TicTacToe with BizarreBeasts characters',
    bannerImage: '/assets/page-assets/games/banners/tictactoe-game-banner-4.svg',
    plays: 26000,
    genre: 'Strategy/Classic',
    platforms: {
      farcaster: 'https://bizarrebeasts-tictactoe.remix.gg/',
      telegram: 'https://t.me/the_remix_bot?startapp=user_i1emcnVI6A__path_-games-Emk1p6hBBEu5-overview',
      worldApp: 'https://world.org/mini-app?app_id=app_3a7d1167bf2438f9af8b414b0c25759d',
      online: 'https://bizarrebeasts-tictactoe.remix.gg/'
    },
    featured: true
  },
  {
    id: 'checkerz',
    title: 'Checkerz',
    description: 'Strategic checkers gameplay featuring BizarreBeasts as your game pieces! Jump, capture, and crown your way to victory. Built with extensive testing and refinement for the perfect gameplay experience.',
    shortDescription: 'Strategic checkers with BizarreBeasts',
    bannerImage: '/assets/page-assets/games/banners/checkerz-game-banner-7.svg',
    plays: 12000,
    genre: 'Strategy/Board',
    platforms: {
      farcaster: 'https://bizarrebeasts-checkerz.remix.gg/',
      telegram: 'https://t.me/the_remix_bot?startapp=user_i1emcnVI6A__path_-games-ASNmNmnu0DGJ-overview',
      worldApp: 'https://world.org/ecosystem/app_729e6957b28ac6e0e1d192d3066f2645',
      online: 'https://bizarrebeasts-checkerz.remix.gg/'
    },
    featured: false
  },
  {
    id: 'sliderz',
    title: 'Sliderz',
    description: 'Slide your way through challenging puzzles in this BizarreBeasts slider game. Simple concept but addictive gameplay. Move tiles to create paths and solve increasingly complex puzzles.',
    shortDescription: 'Sliding puzzle challenges',
    bannerImage: '/assets/page-assets/games/banners/sliderz-game-banner-8.svg',
    plays: 600,
    genre: 'Puzzle',
    platforms: {
      farcaster: 'https://remix.gg?game=QOwHOawyLtQV',
      telegram: 'https://t.me/the_remix_bot?startapp=user_i1emcnVI6A__path_-games-QOwHOawyLtQV-overview',
      worldApp: '', // coming soon
      online: 'https://remix.gg?game=QOwHOawyLtQV'
    },
    featured: false
  }
];

// Helper function to get featured games
export function getFeaturedGames(): GameData[] {
  return gamesData.filter(game => game.featured);
}

// Helper function to get game by ID
export function getGameById(id: string): GameData | undefined {
  return gamesData.find(game => game.id === id);
}

// Helper function to format play count
export function formatPlayCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

// Helper function to get total plays across all games
export function getTotalPlays(): number {
  return gamesData.reduce((total, game) => total + game.plays, 0);
}

// Helper function to sort games by plays
export function getGamesByPopularity(): GameData[] {
  return [...gamesData].sort((a, b) => b.plays - a.plays);
}