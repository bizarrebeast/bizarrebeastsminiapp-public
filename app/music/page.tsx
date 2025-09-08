'use client';

import React, { useState, useRef } from 'react';
import { Music, Play, Pause, ExternalLink, Sparkles, Headphones, ShoppingBag, Apple } from 'lucide-react';
import Image from 'next/image';

// Spotify and Amazon Music icons as simple SVG components
const SpotifyIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.371-.721.49-1.101.24-3.02-1.843-6.841-2.25-11.281-1.23-.451.12-.93-.15-1.05-.601-.12-.45.15-.93.6-1.05 4.921-1.11 9.122-.63 12.531 1.44.361.15.481.72.301 1.2zm1.47-3.3c-.301.45-.931.631-1.381.301-3.451-2.11-8.701-2.731-12.781-1.491-.541.15-1.11-.15-1.26-.691-.15-.541.15-1.11.69-1.261 4.681-1.41 10.501-.721 14.431 1.741.45.271.631.901.301 1.401zm.15-3.45c-4.141-2.461-10.981-2.701-14.911-1.491-.631.18-1.32-.181-1.5-.811-.181-.631.18-1.321.81-1.501 4.561-1.38 12.151-1.11 16.941 1.71.571.361.751 1.11.391 1.681-.361.601-1.131.781-1.731.421z"/>
  </svg>
);

const AmazonMusicIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
  </svg>
);

// Type for track data
interface Track {
  id: string;
  title: string;
  game: string;
  description: string;
  coverArt: string;
  audioUrl?: string;
  duration: string;
  links: {
    spotify?: string;
    apple?: string;
    amazon?: string;
    mint?: string;
  };
  tags: string[];
}

// Sample track data - replace with your actual tracks
const tracks: Track[] = [
  {
    id: '1',
    title: 'Empire Quest Theme',
    game: 'Empire Builder',
    description: 'The epic main theme for Empire Builder, featuring orchestral elements and electronic beats.',
    coverArt: '/music/empire-quest-cover.jpg',
    audioUrl: '/music/empire-quest-theme.mp3',
    duration: '3:45',
    links: {
      spotify: 'https://open.spotify.com/track/...',
      apple: 'https://music.apple.com/...',
      amazon: 'https://music.amazon.com/...',
      mint: 'https://mint.link/...'
    },
    tags: ['Epic', 'Orchestral', 'Electronic']
  },
  {
    id: '2',
    title: 'Treasure Hunt',
    game: 'Treasure Quest',
    description: 'An adventurous and mysterious track that plays during treasure hunting sequences.',
    coverArt: '/music/treasure-hunt-cover.jpg',
    audioUrl: '/music/treasure-hunt.mp3',
    duration: '2:30',
    links: {
      spotify: 'https://open.spotify.com/track/...',
      apple: 'https://music.apple.com/...',
      amazon: 'https://music.amazon.com/...',
    },
    tags: ['Adventure', 'Mystery', 'Ambient']
  },
  {
    id: '3',
    title: 'Battle Beasts',
    game: 'BizarreBeasts Arena',
    description: 'High-energy combat music for intense beast battles.',
    coverArt: '/music/battle-beasts-cover.jpg',
    audioUrl: '/music/battle-beasts.mp3',
    duration: '4:12',
    links: {
      spotify: 'https://open.spotify.com/track/...',
      apple: 'https://music.apple.com/...',
    },
    tags: ['Battle', 'Intense', 'Electronic']
  },
];

export default function MusicPage() {
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

  const handlePlayPause = (trackId: string) => {
    const audio = audioRefs.current[trackId];
    
    if (!audio) return;

    if (playingTrack === trackId) {
      audio.pause();
      setPlayingTrack(null);
    } else {
      // Pause any currently playing track
      if (playingTrack && audioRefs.current[playingTrack]) {
        audioRefs.current[playingTrack]?.pause();
      }
      
      audio.play();
      setPlayingTrack(trackId);
    }
  };

  const handleAudioEnd = (trackId: string) => {
    if (playingTrack === trackId) {
      setPlayingTrack(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-dark-bg">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Music className="w-8 h-8 text-gem-purple" />
            Game Soundtracks
          </h1>
          <p className="text-gray-400">
            Original music from BizarreBeasts games. Stream on your favorite platform or collect as NFTs.
          </p>
        </div>

        {/* Featured Track Banner */}
        <div className="mb-8 bg-gradient-to-r from-gem-purple/20 to-gem-blue/20 rounded-lg p-6 border border-gem-purple/30">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-gem-gold" />
            <span className="text-sm font-semibold text-gem-gold">Featured Track</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">{tracks[0].title}</h2>
          <p className="text-gray-300 text-sm">{tracks[0].description}</p>
        </div>

        {/* Track Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="bg-dark-card border border-gem-crystal/20 rounded-lg overflow-hidden hover:border-gem-crystal/40 transition-all duration-300"
            >
              {/* Cover Art with Play Button */}
              <div className="relative aspect-square bg-gray-800 group">
                {track.coverArt ? (
                  <div className="w-full h-full bg-gradient-to-br from-gem-purple to-gem-blue" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gem-purple to-gem-blue flex items-center justify-center">
                    <Music className="w-16 h-16 text-white/30" />
                  </div>
                )}
                
                {/* Play Button Overlay */}
                {track.audioUrl && (
                  <button
                    onClick={() => handlePlayPause(track.id)}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                      {playingTrack === track.id ? (
                        <Pause className="w-8 h-8 text-white" />
                      ) : (
                        <Play className="w-8 h-8 text-white ml-1" />
                      )}
                    </div>
                  </button>
                )}

                {/* Audio Element */}
                {track.audioUrl && (
                  <audio
                    ref={(el) => { audioRefs.current[track.id] = el; }}
                    src={track.audioUrl}
                    onEnded={() => handleAudioEnd(track.id)}
                  />
                )}
              </div>

              {/* Track Info */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-1">{track.title}</h3>
                <p className="text-sm text-gray-400 mb-2">
                  {track.game} • {track.duration}
                </p>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                  {track.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {track.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-700/50 text-xs text-gray-300 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Streaming Links */}
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {track.links.spotify && (
                      <a
                        href={track.links.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded text-sm transition-colors"
                      >
                        <SpotifyIcon />
                        Spotify
                      </a>
                    )}
                    {track.links.apple && (
                      <a
                        href={track.links.apple}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 rounded text-sm transition-colors"
                      >
                        <Apple className="w-4 h-4" />
                        Apple
                      </a>
                    )}
                    {track.links.amazon && (
                      <a
                        href={track.links.amazon}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 rounded text-sm transition-colors"
                      >
                        <AmazonMusicIcon />
                        Amazon
                      </a>
                    )}
                  </div>
                  
                  {/* Mint/Collect Button */}
                  {track.links.mint && (
                    <a
                      href={track.links.mint}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-gem-gold to-gem-crystal text-black rounded font-semibold text-sm hover:opacity-90 transition-opacity"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Collect as NFT
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
            <Headphones className="w-5 h-5 text-gem-crystal" />
            About the Music
          </h2>
          <p className="text-gray-400 mb-4">
            All tracks are original compositions created for the BizarreBeasts gaming ecosystem. 
            Each piece is crafted to enhance the gaming experience and bring the world of BizarreBeasts to life.
          </p>
          <p className="text-gray-400">
            Stream on your favorite platform or collect limited edition NFT versions to support the project 
            and own a piece of BizarreBeasts history.
          </p>
        </div>
      </div>
    </div>
  );
}