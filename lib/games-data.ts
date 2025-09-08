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
  releaseDate?: string;
  lastUpdated?: string;
}

export const gamesData: GameData[] = [
  {
    id: 'treasure-quest',
    title: 'BizarreBeasts: Treasure Quest',
    description: 'The BIZARRE masterpiece! An epic underground adventure through the Bizarre Underground. Navigate crystal caverns, dodge dangerous enemies, collect rare gems, and discover legendary treasures. This is the most ambitious BizarreBeasts game yet, featuring hand-illustrated characters, multiple levels, and challenging platformer gameplay.',
    shortDescription: 'Epic underground platformer masterpiece',
    bannerImage: '/assets/page-assets/games/banners/treasure-quest-game-banner-1.svg',
    iconImage: '/assets/stickers/treasure-quest/treasure-quest-game-logo.svg',
    plays: 4000,
    genre: 'Platformer/Adventure',
    platforms: {
      farcaster: '',
      telegram: '',
      worldApp: '',
      online: ''
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
    plays: 42000,
    genre: 'Arcade',
    platforms: {
      farcaster: '',
      telegram: '',
      worldApp: '',
      online: ''
    },
    featured: true
  },
  {
    id: 'munches-climb',
    title: 'Munches Climb',
    description: 'Help Munches climb to new heights in this vertical adventure! Jump from platform to platform, avoid obstacles, and collect power-ups as you ascend through the bizarre world. How high can you climb?',
    shortDescription: 'Vertical climbing adventure with Munches',
    bannerImage: '/assets/page-assets/games/banners/munchies-climb-game-banner-3.svg',
    plays: 10000,
    genre: 'Platformer',
    platforms: {
      farcaster: '',
      telegram: '',
      worldApp: '',
      online: ''
    },
    featured: false
  },
  {
    id: 'head-crush',
    title: 'Head Crush',
    description: 'Crush, smash, and destroy in this action-packed BizarreBeasts game! Fast-paced gameplay that will test your reflexes and timing. Built through weeks of dedication and continuous improvements based on player feedback.',
    shortDescription: 'Action-packed crushing game',
    bannerImage: '/assets/page-assets/games/banners/head-crush-game-banner-6.svg',
    plays: 16000,
    genre: 'Action',
    platforms: {
      farcaster: '',
      telegram: '',
      worldApp: '',
      online: ''
    },
    featured: false
  },
  {
    id: 'memory-game',
    title: 'BizarreBeasts Memory',
    description: 'Test your memory with BizarreBeasts characters! Flip cards to find matching pairs in this classic memory game with a bizarre twist. Features multiple difficulty levels and unique BizarreBeasts artwork on every card.',
    shortDescription: 'Classic memory matching game with BizarreBeasts',
    bannerImage: '/assets/page-assets/games/banners/bizarrebeasts-memory-game-banner-5.svg',
    plays: 22000,
    genre: 'Puzzle/Memory',
    platforms: {
      farcaster: '',
      telegram: '',
      worldApp: '',
      online: ''
    },
    featured: false
  },
  {
    id: 'tictactoe',
    title: 'BizarreBeasts TicTacToe',
    description: 'The classic game of TicTacToe with a BizarreBeasts twist! Play against friends or challenge the AI. Features unique BizarreBeasts characters as your game pieces and special victory animations.',
    shortDescription: 'Classic TicTacToe with BizarreBeasts characters',
    bannerImage: '/assets/page-assets/games/banners/tictactoe-game-banner-4.svg',
    plays: 24000,
    genre: 'Strategy/Classic',
    platforms: {
      farcaster: '',
      telegram: '',
      worldApp: '',
      online: ''
    },
    featured: true
  },
  {
    id: 'checkerz',
    title: 'Checkerz',
    description: 'Strategic checkers gameplay featuring BizarreBeasts as your game pieces! Jump, capture, and crown your way to victory. Built with extensive testing and refinement for the perfect gameplay experience.',
    shortDescription: 'Strategic checkers with BizarreBeasts',
    bannerImage: '/assets/page-assets/games/banners/checkerz-game-banner-7.svg',
    plays: 10000,
    genre: 'Strategy/Board',
    platforms: {
      farcaster: '',
      telegram: '',
      worldApp: '',
      online: ''
    },
    featured: false
  },
  {
    id: 'sliderz',
    title: 'Sliderz',
    description: 'Slide your way through challenging puzzles in this BizarreBeasts slider game. Simple concept but addictive gameplay. Move tiles to create paths and solve increasingly complex puzzles.',
    shortDescription: 'Sliding puzzle challenges',
    bannerImage: '/assets/page-assets/games/banners/sliderz-game-banner-8.svg',
    plays: 573,
    genre: 'Puzzle',
    platforms: {
      farcaster: '',
      telegram: '',
      worldApp: '',
      online: ''
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