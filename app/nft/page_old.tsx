'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles, Trophy, Image, Users, ExternalLink,
  Wallet, Clock, CheckCircle, Coins, Loader
} from 'lucide-react';
import Link from 'next/link';
import {
  getAllCollections,
  getFeaturedCollection,
  getLiveCollections,
  getTotalNFTs,
  getTotalHolders,
  getFloorPrice,
  NFTCollection,
  DGEN1_CONTRACT
} from '@/lib/nft-data';
import { fetchCollectionNFTs, NFTMetadata } from '@/lib/nft-api';

export default function NFTGalleryPage() {
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const [featuredDrop, setFeaturedDrop] = useState<NFTCollection | undefined>();
  const [liveCollections, setLiveCollections] = useState<NFTCollection[]>([]);
  const [collectionImages, setCollectionImages] = useState<Map<string, NFTMetadata[]>>(new Map());
  const [loadingImages, setLoadingImages] = useState<boolean>(true);

  useEffect(() => {
    setCollections(getAllCollections());
    setFeaturedDrop(getFeaturedCollection());
    setLiveCollections(getLiveCollections());
  }, []);

  // Fetch real NFT images for live collections
  useEffect(() => {
    const loadCollectionImages = async () => {
      setLoadingImages(true);
      const live = getLiveCollections();
      const imagesMap = new Map<string, NFTMetadata[]>();

      // Fetch images for each collection in parallel
      await Promise.allSettled(
        live.map(async (collection) => {
          try {
            const data = await fetchCollectionNFTs(collection.contractAddress);
            imagesMap.set(collection.contractAddress, data.nfts);
            console.log(`Loaded ${data.nfts.length} NFTs for ${collection.name}`);
          } catch (error) {
            console.error(`Failed to load images for ${collection.name}:`, error);
          }
        })
      );

      setCollectionImages(imagesMap);
      setLoadingImages(false);
    };

    loadCollectionImages();
  }, []);

  const totalNFTs = getTotalNFTs();
  const totalHolders = getTotalHolders();
  const floorPrice = getFloorPrice();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
            <CheckCircle className="w-3 h-3" />
            Live
          </div>
        );
      case 'upcoming':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-semibold">
            <Clock className="w-3 h-3" />
            Coming Soon
          </div>
        );
      case 'sold-out':
        return (
          <div className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-semibold">
            Sold Out
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-8">
      <div className="max-w-7xl mx-auto">

        {/* Title & Description */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent leading-tight pb-2">
            BizarreBeasts NFT Gallery
          </h1>
          <p className="text-lg text-gray-300 max-w-4xl mx-auto px-4">
            Discover and collect original BizarreBeasts artwork as NFTs. From hand-drawn 1/1 masterpieces to exclusive collections, each piece unlocks unique perks and utilities in the BizarreBeasts ecosystem.
          </p>
        </div>

        {/* Quick Stats - Matching Games/Empire Style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-gold/5 border border-gem-gold/20 rounded-lg p-4 text-center transition-all duration-300 hover:border-gem-gold/40">
            <Image className="w-8 h-8 text-gem-gold mx-auto mb-2" />
            <div className="text-2xl font-bold text-gem-gold">{collections.length}</div>
            <div className="text-xs sm:text-sm text-gray-400">Collections</div>
          </div>

          <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-crystal/5 border border-gem-crystal/20 rounded-lg p-4 text-center transition-all duration-300 hover:border-gem-crystal/40">
            <Sparkles className="w-8 h-8 text-gem-crystal mx-auto mb-2" />
            <div className="text-2xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
              {totalNFTs}
            </div>
            <div className="text-xs sm:text-sm text-gray-400">Total NFTs</div>
          </div>

          <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-pink/5 border border-gem-pink/20 rounded-lg p-4 text-center transition-all duration-300 hover:border-gem-pink/40">
            <Users className="w-8 h-8 text-gem-pink mx-auto mb-2" />
            <div className="text-2xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
              {totalHolders}
            </div>
            <div className="text-xs sm:text-sm text-gray-400">Collectors</div>
          </div>

          <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-purple/5 border border-gem-purple/20 rounded-lg p-4 text-center transition-all duration-300 hover:border-gem-purple/40">
            <Trophy className="w-8 h-8 text-gem-purple mx-auto mb-2" />
            <div className="text-2xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
              {floorPrice || 'TBA'}
            </div>
            <div className="text-xs sm:text-sm text-gray-400">Floor Price</div>
          </div>
        </div>

        {/* Featured Drop Banner - DGEN1 Exclusive */}
        {featuredDrop && (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-gold/10 border border-gem-gold/30 rounded-2xl overflow-hidden hover:border-gem-gold/50 transition-all duration-300">
              <div className="relative">
                {/* Placeholder banner - gradient background */}
                <div className="w-full h-64 sm:h-80 bg-gradient-to-br from-gem-crystal/20 via-gem-gold/20 to-gem-pink/20 flex items-center justify-center relative overflow-hidden">
                  {/* Animated background effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>

                  {/* Centered content */}
                  <div className="relative z-10 text-center">
                    <Sparkles className="w-24 h-24 text-gem-gold mx-auto mb-4 animate-pulse" />
                    <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
                      DGEN1 Exclusive
                    </div>
                  </div>
                </div>

                {/* Status badges */}
                <div className="absolute top-4 right-4 bg-gem-gold/90 text-dark-bg px-3 py-1 rounded-full text-sm font-bold">
                  UPCOMING
                </div>
                <div className="absolute top-4 left-4 bg-red-500/90 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  DGEN1 HOLDERS ONLY
                </div>
              </div>

              <div className="p-6">
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
                  {featuredDrop.name}
                </h2>
                <p className="text-gray-300 mb-4 text-base sm:text-lg">
                  {featuredDrop.description}
                </p>

                <div className="grid sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-dark-bg/30 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-gem-crystal">{featuredDrop.supply}</div>
                    <div className="text-xs text-gray-400">Total Supply</div>
                  </div>
                  <div className="bg-dark-bg/30 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-gem-gold">{featuredDrop.holders} / {featuredDrop.supply}</div>
                    <div className="text-xs text-gray-400">Claimed</div>
                  </div>
                  <div className="bg-dark-bg/30 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-gem-pink">$2 USD</div>
                    <div className="text-xs text-gray-400">Price</div>
                  </div>
                </div>

                {/* Eligibility Info */}
                <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-yellow-400 mb-1">DGEN1 Holder Exclusive</div>
                      <div className="text-sm text-gray-300">
                        Only wallets holding the DGEN1 NFT can claim this exclusive drop.
                        Live verification on each claim. {DGEN1_CONTRACT.address && (
                          <a
                            href={`https://basescan.org/token/${DGEN1_CONTRACT.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gem-crystal hover:text-gem-gold transition-colors inline-flex items-center gap-1"
                          >
                            View DGEN1 Contract <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {featuredDrop.claimable ? (
                  <Link
                    href={`/nft/claim/${featuredDrop.id}`}
                    className="block w-full bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg px-6 py-3 rounded-lg font-bold hover:shadow-lg hover:scale-105 transition-all duration-300 text-center"
                  >
                    Claim Your NFT →
                  </Link>
                ) : (
                  <button
                    disabled
                    className="block w-full bg-gray-600 text-gray-400 px-6 py-3 rounded-lg font-bold cursor-not-allowed text-center"
                  >
                    Coming Soon
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Collections Grid - Like Games Grid */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-4">All Collections</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

            {liveCollections.map((collection, index) => {
              // Rotate border colors
              const borderColors = [
                'border-gem-crystal/20 hover:shadow-gem-crystal/20',
                'border-gem-gold/20 hover:shadow-gem-gold/20',
                'border-gem-pink/20 hover:shadow-gem-pink/20'
              ];
              const borderStyle = borderColors[index % borderColors.length];

              // Get first NFT image for this collection
              const collectionNFTs = collectionImages.get(collection.contractAddress);
              const coverImage = collectionNFTs && collectionNFTs.length > 0 ? collectionNFTs[0].image : null;

              return (
                <Link key={collection.id} href={`/nft/collection/${collection.id}`}>
                  <div className={`bg-gradient-to-br from-dark-card via-dark-card to-gem-crystal/5 border ${borderStyle} rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer group h-full`}>

                    {/* Collection Image - Real or Placeholder */}
                    <div className="relative aspect-square bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden flex items-center justify-center">
                      {loadingImages ? (
                        // Loading state
                        <>
                          <div className="absolute inset-0 bg-gradient-to-br from-gem-crystal/10 via-gem-gold/10 to-gem-pink/10 animate-pulse"></div>
                          <Loader className="w-12 h-12 text-gray-600 animate-spin" />
                        </>
                      ) : coverImage ? (
                        // Real NFT image
                        <>
                          <img
                            src={coverImage}
                            alt={collection.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          {/* Overlay gradient on hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </>
                      ) : (
                        // Fallback placeholder
                        <>
                          <div className="absolute inset-0 bg-gradient-to-br from-gem-crystal/10 via-gem-gold/10 to-gem-pink/10"></div>
                          <Image className="w-24 h-24 text-gray-600 group-hover:text-gem-crystal transition-colors duration-300" />
                        </>
                      )}

                      {/* Type badge */}
                      <div className="absolute top-2 right-2 bg-dark-bg/80 px-2 py-1 rounded text-xs font-semibold">
                        {collection.type}
                      </div>

                      {/* Status badge */}
                      <div className="absolute top-2 left-2">
                        {getStatusBadge(collection.status)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col">
                      <h4 className="text-xl font-bold mb-2 group-hover:text-gem-crystal transition-colors min-h-[2rem]">
                        {collection.name}
                      </h4>
                      <p className="text-gray-400 text-sm mb-3 flex-1 line-clamp-2 min-h-[2.5rem]">
                        {collection.description}
                      </p>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <div className="text-xs text-gray-400">Supply</div>
                          <div className="font-bold text-gem-crystal">{collection.supply}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400">Holders</div>
                          <div className="font-bold text-gem-gold">{collection.holders}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-700 mt-auto">
                        <span className="text-sm text-gray-400">View Collection</span>
                        <ExternalLink className="w-4 h-4 text-gem-crystal group-hover:text-gem-gold transition-colors" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* Coming Soon Placeholder */}
            <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-pink/5 border border-gem-pink/20 rounded-lg overflow-hidden flex flex-col opacity-60 h-full">
              <div className="relative aspect-square bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden flex items-center justify-center">
                <Sparkles className="w-16 h-16 text-gem-pink animate-pulse" />
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <h4 className="text-xl font-bold mb-2 min-h-[2rem]">More Collections</h4>
                <p className="text-gray-400 text-sm mb-3 flex-1 min-h-[2.5rem]">
                  New collections dropping regularly. Follow @bizarrebeast on Farcaster for announcements!
                </p>

                <div className="flex items-center justify-center pt-2 border-t border-gray-700 mt-auto">
                  <span className="text-sm text-gray-400">Coming Soon</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Contract Addresses - Like Home Page */}
        <div className="bg-dark-card border border-gem-crystal/20 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-gem-crystal" />
            Collection Contracts on Base
          </h3>

          <div className="space-y-3">
            {liveCollections.map((collection) => (
              <div key={collection.id} className="bg-dark-bg/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm text-gray-400">{collection.name} ({collection.type})</div>
                  <div className="text-xs text-gray-500">{collection.holders} holders</div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs text-gem-crystal font-mono break-all">
                    {collection.contractAddress}
                  </code>
                  <a
                    href={`https://basescan.org/token/${collection.contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gem-crystal hover:text-gem-gold transition-colors flex-shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}

            {/* DGEN1 Contract Reference */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <div className="text-sm font-semibold text-yellow-400">DGEN1 Holder Verification Contract</div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs text-gem-crystal font-mono break-all">
                  {DGEN1_CONTRACT.address}
                </code>
                <a
                  href={`https://basescan.org/token/${DGEN1_CONTRACT.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gem-crystal hover:text-gem-gold transition-colors flex-shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                1,531 holders eligible for exclusive drops
              </div>
            </div>
          </div>
        </div>

        {/* Holder Benefits Section */}
        <div className="mt-8 bg-gradient-to-br from-dark-card via-dark-card to-gem-purple/5 border border-gem-purple/20 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Coins className="w-5 h-5 text-gem-purple" />
            NFT Holder Benefits
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gem-crystal/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-gem-crystal" />
              </div>
              <div>
                <div className="font-semibold mb-1">Exclusive Access</div>
                <div className="text-sm text-gray-400">
                  Early access to new collections, holder-only drops, and community events
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gem-gold/20 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-4 h-4 text-gem-gold" />
              </div>
              <div>
                <div className="font-semibold mb-1">Empire Boosts</div>
                <div className="text-sm text-gray-400">
                  NFT holders receive bonus multipliers on the Empire leaderboard
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gem-pink/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-gem-pink" />
              </div>
              <div>
                <div className="font-semibold mb-1">Community Perks</div>
                <div className="text-sm text-gray-400">
                  Voting rights, exclusive Discord roles, and input on future drops
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gem-purple/20 flex items-center justify-center flex-shrink-0">
                <Coins className="w-4 h-4 text-gem-purple" />
              </div>
              <div>
                <div className="font-semibold mb-1">Future Utilities</div>
                <div className="text-sm text-gray-400">
                  NFT staking, governance, and more utilities coming soon
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Shimmer animation for placeholder */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
