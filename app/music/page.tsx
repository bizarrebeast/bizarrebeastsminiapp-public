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

// BizarreBeasts game soundtracks
const tracks: Track[] = [
  {
    id: '1',
    title: 'Crystal Cavern',
    game: 'Treasure Quest',
    description: 'Ethereal underground adventure theme with mysterious crystal cave ambience and epic orchestral swells.',
    coverArt: '/assets/page-assets/music/album-covers/crystal-cavern-bizarrebeasts-album-cover-2.svg',
    audioUrl: '/assets/page-assets/music/CRYSTAL CAVERN- MASTER 1.mp3',
    duration: '2:40',
    links: {
      spotify: '',
      apple: '',
      amazon: '',
      mint: ''
    },
    tags: ['Adventure', 'Ambient', 'Orchestral']
  },
  {
    id: '2',
    title: 'Head Crush',
    game: 'Head Crush',
    description: 'High-energy action soundtrack with pounding beats and intense electronic rhythms for crushing gameplay.',
    coverArt: '/assets/page-assets/music/album-covers/head-crush-bizarrebeasts-album-cover-1.svg',
    audioUrl: '/assets/page-assets/music/HEAD CRUSH- MASTER MP3 FOR GAME.mp3',
    duration: '1:20',
    links: {
      spotify: '',
      apple: '',
      amazon: '',
    },
    tags: ['Action', 'Electronic', 'Intense']
  },
  {
    id: '3',
    title: 'Night Beast',
    game: 'BizarreBeasts',
    description: 'Dark and mysterious theme featuring haunting melodies and atmospheric soundscapes.',
    coverArt: '/assets/page-assets/music/album-covers/night-beast-bizarrebeasts-album-cover-3.svg',
    audioUrl: '/assets/page-assets/music/Night Beast- BizarreBeasts.mp3',
    duration: '3:33',
    links: {
      spotify: '',
      apple: '',
    },
    tags: ['Dark', 'Atmospheric', 'Mystery']
  },
];

export default function MusicPage() {
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [loadedTracks, setLoadedTracks] = useState<Set<string>>(new Set());
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

  // Ensure only one track plays at a time
  React.useEffect(() => {
    // Pause all other tracks when playingTrack changes
    Object.keys(audioRefs.current).forEach(trackId => {
      const audio = audioRefs.current[trackId];
      if (audio && trackId !== playingTrack) {
        audio.pause();
      }
    });
  }, [playingTrack]);

  const handlePlayPause = (trackId: string) => {
    // If clicking the same track that's playing, pause it
    if (playingTrack === trackId) {
      const audio = audioRefs.current[trackId];
      if (audio) {
        audio.pause();
        setPlayingTrack(null);
      }
      return;
    }

    // Pause any currently playing track first
    if (playingTrack && audioRefs.current[playingTrack]) {
      audioRefs.current[playingTrack]?.pause();
    }

    // Lazy load audio if not already loaded
    if (!loadedTracks.has(trackId)) {
      // Pause current track before loading new one
      if (playingTrack && audioRefs.current[playingTrack]) {
        audioRefs.current[playingTrack]?.pause();
      }
      
      setLoadedTracks(prev => new Set([...prev, trackId]));
      setPlayingTrack(trackId); // Set as playing immediately
      
      // Small delay to ensure audio element is created
      setTimeout(() => {
        const audio = audioRefs.current[trackId];
        if (audio) {
          // Double-check no other track started playing in the meantime
          if (playingTrack && playingTrack !== trackId && audioRefs.current[playingTrack]) {
            audioRefs.current[playingTrack]?.pause();
          }
          audio.play().catch(err => {
            console.error('Error playing audio:', err);
            setPlayingTrack(null);
          });
        }
      }, 100);
      return;
    }

    // Track is already loaded, just play it
    const audio = audioRefs.current[trackId];
    if (audio) {
      audio.play().catch(err => {
        console.error('Error playing audio:', err);
        setPlayingTrack(null);
      });
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
        {/* Title and Description */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent leading-tight pb-2">
            Music & Soundtracks
          </h1>
          <p className="text-lg text-gray-300 max-w-4xl mx-auto px-4">
            Original music from BizarreBeasts games! Stream BIZARRE, original soundtracks from BizarreBeasts games on your favorite platform, or collect them as exclusive NFTs. Experience the full BIZARRE audio universe that brings the games to life.
          </p>
        </div>

        {/* Track Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="bg-dark-card border border-gem-crystal/20 rounded-lg overflow-hidden hover:border-gem-crystal/40 transition-all duration-300"
            >
              {/* Cover Art - Clean without overlay */}
              <div className="relative aspect-square bg-gray-800 group">
                {track.coverArt ? (
                  <img 
                    src={track.coverArt}
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gem-purple to-gem-blue flex items-center justify-center">
                    <Music className="w-16 h-16 text-white/30" />
                  </div>
                )}
                
                {/* Playing indicator - minimal overlay */}
                {playingTrack === track.id && (
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-gem-gold to-gem-crystal text-dark-bg text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg font-semibold">
                    <div className="w-2 h-2 bg-dark-bg rounded-full animate-pulse" />
                    Now Playing
                  </div>
                )}

                {/* Audio Element - Only load when user clicks play */}
                {track.audioUrl && loadedTracks.has(track.id) && (
                  <audio
                    ref={(el) => { audioRefs.current[track.id] = el; }}
                    src={track.audioUrl}
                    onEnded={() => handleAudioEnd(track.id)}
                    preload="none"
                  />
                )}
              </div>

              {/* Track Info */}
              <div className="p-4">
                {/* Play/Pause Button - External */}
                {track.audioUrl && (
                  <button
                    onClick={() => handlePlayPause(track.id)}
                    className={`w-full mb-3 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all transform hover:scale-105 ${
                      playingTrack === track.id 
                        ? 'bg-gradient-to-r from-gem-gold to-gem-pink text-dark-bg' 
                        : 'bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg'
                    }`}
                  >
                    {playingTrack === track.id ? (
                      <>
                        <Pause className="w-5 h-5" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Play Track
                      </>
                    )}
                  </button>
                )}
                
                <h3 className="text-lg font-semibold text-white mb-1">{track.title}</h3>
                <p className="text-sm text-gray-400 mb-2">
                  {track.game} • {track.duration}
                </p>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                  {track.description}
                </p>


                {/* Streaming Links - Hidden for now since no links available */}
                {(track.links.spotify || track.links.apple || track.links.amazon || track.links.mint) && (
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
                )}
              </div>
            </div>
          ))}
        </div>

        {/* About the Music Section */}
        <div className="mt-8 bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
            <Headphones className="w-5 h-5 text-gem-crystal" />
            About the Music
          </h2>
          <p className="text-gray-400 mb-4">
            All tracks are original compositions created and produced by{' '}
            <a
              href="https://farcaster.xyz/kateyarter"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gem-crystal hover:text-gem-gold transition-colors"
            >
              @kateyarter
            </a>
            {' '}of Honey High Records for the BizarreBeasts gaming ecosystem.
            Each piece is crafted to enhance the gaming experience and bring the world of BizarreBeasts to life.
            Reach out to{' '}
            <a
              href="https://farcaster.xyz/kateyarter"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gem-crystal hover:text-gem-gold transition-colors"
            >
              @kateyarter
            </a>
            {' '}for original tracks for your games or projects!
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