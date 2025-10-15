'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles, Trophy, Image as ImageIcon, Users, ExternalLink,
  Wallet, Clock, CheckCircle, Coins, Loader, ChevronDown, ChevronUp, Grid, List, Flame
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
  const [bbcpCollection, setBbcpCollection] = useState<NFTCollection | undefined>();
  const [collectionImages, setCollectionImages] = useState<Map<string, NFTMetadata[]>>(new Map());
  const [loadingImages, setLoadingImages] = useState<boolean>(true);
  const [contractsExpanded, setContractsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Featured Collections', 'Popular Collections']));

  // Preload critical banner images immediately
  useEffect(() => {
    const preloadBannerImages = () => {
      // Preload BBCP banner
      const bbcpBanner = new Image();
      bbcpBanner.src = '/assets/page-assets/banners/nft-banners/BBCP-vibemarket.png';

      // Preload DGEN1 artwork
      const dgen1Art = new Image();
      dgen1Art.src = '/assets/nft/dgen1-claim-art.png';
    };

    preloadBannerImages();

    const allCollections = getAllCollections();
    setCollections(allCollections);

    // Find featured collections
    const inAppExclusive = allCollections.find(c => c.id === 'in-app-exclusive');
    const bbcp = allCollections.find(c => c.id === 'bbcp-vibemarket');
    const dgen1 = allCollections.find(c => c.id === 'dgen1-genesis');

    setBbcpCollection(bbcp);
    // Show both: in-app exclusive AND dgen1
    setFeaturedDrop(inAppExclusive);
  }, []);

  // Fetch cover images with priority loading and batching
  useEffect(() => {
    const loadCollectionImages = async () => {
      const allCollections = getAllCollections();
      // Keep existing images in the map
      const imagesMap = new Map<string, NFTMetadata[]>(collectionImages);

      // Pre-populate local images (for collections without contract addresses)
      allCollections.forEach(collection => {
        if (!collection.contractAddress && collection.coverImage) {
          imagesMap.set(collection.id, [{
            tokenId: '0',
            name: collection.name,
            description: collection.description,
            image: collection.coverImage,
            animationUrl: null,
            attributes: [],
            externalUrl: null,
          }]);
        }
      });

      // Update state with pre-populated images
      setCollectionImages(new Map(imagesMap));

      // Categorize collections
      const categorizedCollections = allCollections.map(collection => {
        let category = 'More Collections';
        let priority = 3; // Default priority

        if (collection.category === 'Featured Collections') {
          category = 'Featured Collections';
          priority = 1; // Highest priority
        } else if (collection.status === 'upcoming') {
          return null; // Skip upcoming
        } else if (collection.category === 'Popular Collections' || collection.holders > 100) {
          category = 'Popular Collections';
          priority = 2; // High priority
        } else if (collection.category === 'Game Collections' || ['Head Crush', 'Rodeo Posts', 'Memory Game', 'Bizarre Bounce', 'Checkerz', 'Treasure Quest'].some(g => collection.name.includes(g))) {
          category = 'Game Collections';
          priority = 3;
        } else if (collection.category?.includes('Archive') || collection.category?.includes('1/1') || collection.category?.includes('Physical') || collection.status === 'ended') {
          category = 'Archive Collections';
          priority = 4; // Lowest priority
        }

        return { collection, category, priority };
      }).filter(Boolean) as Array<{ collection: NFTCollection; category: string; priority: number }>;

      // Filter to only expanded categories, has contract address, and not already loaded
      const collectionsToLoad = categorizedCollections
        .filter(({ category, collection }) =>
          expandedCategories.has(category) &&
          collection.contractAddress &&
          !imagesMap.has(collection.contractAddress)
        )
        .sort((a, b) => a.priority - b.priority); // Sort by priority

      // Only show loading if there are actually images to fetch
      if (collectionsToLoad.length === 0) {
        setLoadingImages(false);
        return;
      }

      setLoadingImages(true);

      // Load in batches with priority
      const BATCH_SIZE = 5;
      const loadBatch = async (batch: typeof collectionsToLoad) => {
        await Promise.allSettled(
          batch.map(async ({ collection }) => {
            try {
              const url = collection.coverTokenId
                ? `/api/nft/cover-image/${collection.contractAddress}?tokenId=${collection.coverTokenId}`
                : `/api/nft/cover-image/${collection.contractAddress}`;

              const response = await fetch(url);
              const data = await response.json();
              if (data.success && data.image) {
                imagesMap.set(collection.contractAddress, [{
                  tokenId: data.tokenId,
                  name: data.name,
                  description: '',
                  image: data.image,
                  animationUrl: null,
                  attributes: [],
                  externalUrl: null,
                }]);
                // Update UI progressively as each batch completes
                setCollectionImages(new Map(imagesMap));
              }
            } catch (error) {
              console.error(`Failed to load images for ${collection.name}:`, error);
            }
          })
        );
      };

      // Load in batches
      for (let i = 0; i < collectionsToLoad.length; i += BATCH_SIZE) {
        const batch = collectionsToLoad.slice(i, i + BATCH_SIZE);
        await loadBatch(batch);
      }

      setLoadingImages(false);
    };

    loadCollectionImages();
  }, [expandedCategories]); // Reload when categories expand/collapse

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
      case 'ended':
        return (
          <div className="px-2 py-1 bg-gray-600/20 text-gray-500 rounded-full text-xs font-semibold">
            Ended
          </div>
        );
      default:
        return null;
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
      // Pre-emptively set loading state for better UX
      setLoadingImages(true);
    }
    setExpandedCategories(newExpanded);
  };

  // Group collections by category (merged into fewer categories)
  const groupedCollections = collections.reduce((acc, collection) => {
    // Determine category
    let category = 'More Collections';

    if (collection.category === 'Featured Collections') {
      category = 'Featured Collections';
    } else if (collection.status === 'upcoming') {
      return acc; // Skip (shown separately)
    } else if (collection.category === 'Popular Collections' || collection.holders > 100) {
      category = 'Popular Collections';
    } else if (collection.category === 'Game Collections' || ['Head Crush', 'Rodeo Posts', 'Memory Game', 'Bizarre Bounce', 'Checkerz', 'Treasure Quest'].some(g => collection.name.includes(g))) {
      category = 'Game Collections';
    } else if (collection.category?.includes('Archive') || collection.category?.includes('1/1') || collection.category?.includes('Physical') || collection.status === 'ended') {
      category = 'Archive Collections';
    } else {
      category = 'More Collections';
    }

    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(collection);
    return acc;
  }, {} as Record<string, NFTCollection[]>);

  // Define category order (simplified)
  const categoryOrder = [
    'Featured Collections',
    'Popular Collections',
    'Game Collections',
    'More Collections',
    'Archive Collections',
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-8">
      <div className="max-w-7xl mx-auto">

        {/* Title & Description */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent leading-tight pb-2 mb-4">
            BizarreBeasts NFT Gallery
          </h1>
          <p className="text-lg text-gray-300 max-w-4xl mx-auto px-4">
            Discover and collect original BizarreBeasts artwork as NFTs. From hand-drawn 1/1 masterpieces to exclusive collections, each piece unlocks unique perks and utilities in the BizarreBeasts ecosystem.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-gold/5 border border-gem-gold/20 rounded-lg p-4 text-center transition-all duration-300 hover:border-gem-gold/40">
            <ImageIcon className="w-8 h-8 text-gem-gold mx-auto mb-2" />
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
        </div>

        {/* BBCP VibeMarket Cards - Featured Collection */}
        {bbcpCollection && (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-crystal/10 border border-gem-crystal/30 rounded-2xl overflow-hidden hover:border-gem-crystal/50 transition-all duration-300">
              <div className="relative">
                {/* Banner Image */}
                <div className="w-full bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">
                  <img
                    src="/assets/page-assets/banners/nft-banners/BBCP-vibemarket.png"
                    alt="BizarreBeasts VibeMarket Cards"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
                    {bbcpCollection.name}
                  </h2>
                  <div className="bg-green-500/90 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    LIVE
                  </div>
                </div>

                <p className="text-gray-300 mb-3 text-sm">
                  {bbcpCollection.description}
                </p>

                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="bg-dark-bg/30 rounded p-2 text-center">
                    <div className="text-lg font-bold text-gem-crystal">{bbcpCollection.supply}</div>
                    <div className="text-xs text-gray-400">Cards</div>
                  </div>
                  <div className="bg-dark-bg/30 rounded p-2 text-center">
                    <div className="text-lg font-bold text-gem-gold">31</div>
                    <div className="text-xs text-gray-400">Designs</div>
                  </div>
                  <div className="bg-dark-bg/30 rounded p-2 text-center">
                    <div className="text-lg font-bold text-gem-pink">{bbcpCollection.holders}+</div>
                    <div className="text-xs text-gray-400">Holders</div>
                  </div>
                  <div className="bg-dark-bg/30 rounded p-2 text-center">
                    <div className="text-lg font-bold text-gem-purple">$89K</div>
                    <div className="text-xs text-gray-400">Market Cap</div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-2">
                  <a
                    href="https://vibechain.com/market/bizarrebeasts?ref=BJT4EJBY0SJP&pnlId=28acae0d"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg px-4 py-2 rounded-lg font-bold hover:shadow-lg hover:scale-105 transition-all duration-300 text-center text-sm"
                  >
                    Trade on VibeMarket →
                  </a>
                  <Link
                    href={`/nft/collection/${bbcpCollection.id}`}
                    className="block w-full bg-dark-bg border border-gem-crystal text-gem-crystal px-4 py-2 rounded-lg font-bold hover:bg-gem-crystal/10 transition-all duration-300 text-center text-sm"
                  >
                    View Collection
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Featured Drops - Side by Side */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* BizBe's Booty Shake */}
          {featuredDrop && (
            <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-crystal/5 border border-gem-crystal/20 rounded-2xl overflow-hidden hover:border-gem-crystal/40 hover:shadow-lg transition-all duration-300">
              {/* NFT Image */}
              <div className="aspect-square bg-gradient-to-br from-gem-crystal/20 via-gem-gold/20 to-gem-pink/20 flex items-center justify-center relative overflow-hidden">
                <img
                  src={featuredDrop.coverImage}
                  alt={featuredDrop.name}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <div className="bg-green-500/90 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    LIVE
                  </div>
                  <div className="bg-gem-gold/90 text-dark-bg px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Coins className="w-3 h-3" />
                    BB ONLY
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
                  BizBe's Booty Shake
                  <div className="text-lg">In-App Exclusive</div>
                </h3>

                <p className="text-gray-300 text-sm mb-4">
                  First In-App Exclusive! Animated BizBe NFT with dynamic pricing (5M-20M BB). Limited to 500.
                </p>

                <div className="bg-gem-crystal/10 border border-gem-crystal/30 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="w-4 h-4 text-gem-gold" />
                    <span className="text-xs font-semibold text-gem-gold">Proceeds</span>
                  </div>
                  <div className="text-xs text-gray-300">
                    100% of proceeds used to fund community rewards, treasury drops, and token burns
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-dark-bg/30 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-gem-crystal">500</div>
                    <div className="text-xs text-gray-400">Supply</div>
                  </div>
                  <div className="bg-dark-bg/30 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-gem-gold">5</div>
                    <div className="text-xs text-gray-400">Max/Wallet</div>
                  </div>
                </div>

                <Link
                  href="/nft/mint/in-app-exclusive"
                  className="block w-full bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg px-4 py-3 rounded-lg font-bold hover:shadow-lg hover:scale-105 transition-all duration-300 text-center"
                >
                  Mint Now →
                </Link>
              </div>
            </div>
          )}

          {/* DGEN1 Claim */}
          {collections.find(c => c.id === 'dgen1-genesis') && (
            <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-gold/5 border border-gem-gold/20 rounded-2xl overflow-hidden hover:border-gem-gold/40 hover:shadow-lg transition-all duration-300">
              {/* NFT Image */}
              <div className="aspect-square bg-gradient-to-br from-gem-crystal/20 via-gem-gold/20 to-gem-pink/20 flex items-center justify-center relative overflow-hidden">
                <img
                  src="/assets/nft/dgen1-claim-art.png"
                  alt="DGEN1 Exclusive Genesis"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <div className="bg-gem-gold/90 text-dark-bg px-2 py-1 rounded-full text-xs font-bold">
                    UPCOMING
                  </div>
                  <div className="bg-red-500/90 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    DGEN1 ONLY
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
                  dGEN1 Exclusive NFT
                  <div className="text-lg">Device Holders Can Claim In-App</div>
                </h3>

                <p className="text-gray-300 text-sm mb-4">
                  First miniapp-exclusive NFT drop! Only DGEN1 holders can claim. Hand-drawn original artwork with unique utilities.
                </p>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-semibold text-yellow-400">Holder Exclusive</span>
                  </div>
                  <div className="text-xs text-gray-300">
                    Must hold DGEN1 NFT to claim.{' '}
                    <a
                      href="https://paragraph.com/@bizarrebeasts/bizarrebeasts-miniapp-and-treasure-quest-now-live-in-the-dgen1-app-store"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gem-crystal hover:text-gem-gold transition-colors"
                    >
                      Learn more →
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-dark-bg/30 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-gem-crystal">TBD</div>
                    <div className="text-xs text-gray-400">Supply</div>
                  </div>
                  <div className="bg-dark-bg/30 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-gem-gold">1</div>
                    <div className="text-xs text-gray-400">Per Holder</div>
                  </div>
                </div>

                <Link
                  href="/dgen1-claim"
                  className="block w-full bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg px-4 py-3 rounded-lg font-bold hover:shadow-lg hover:scale-105 transition-all duration-300 text-center"
                >
                  View Claim Page →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* NFT Collections Section Title with View Toggle */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
            NFT Collections
          </h2>
          {/* View Mode Toggle */}
          <div className="flex gap-1 bg-dark-card border border-gem-crystal/20 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-all ${
                viewMode === 'grid'
                  ? 'bg-gem-crystal/20 text-gem-crystal'
                  : 'text-gray-400 hover:text-gem-crystal'
              }`}
              title="Grid View"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-all ${
                viewMode === 'list'
                  ? 'bg-gem-crystal/20 text-gem-crystal'
                  : 'text-gray-400 hover:text-gem-crystal'
              }`}
              title="List View"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Collections by Category - Collapsible */}
        {categoryOrder.map((categoryName) => {
          const categoryCollections = groupedCollections[categoryName];
          if (!categoryCollections || categoryCollections.length === 0) return null;

          const isExpanded = expandedCategories.has(categoryName);
          const isFeatured = categoryName === 'Featured Collections';

          return (
            <div key={categoryName} className="mb-8">
              {/* Category Header - Collapsible */}
              <button
                onClick={() => toggleCategory(categoryName)}
                className="w-full flex items-center justify-between mb-4 group"
              >
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold group-hover:text-gem-crystal transition-colors">
                    {categoryName}
                  </h3>
                  <span className="text-sm text-gray-400">
                    ({categoryCollections.length})
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-6 h-6 text-gem-crystal" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-400 group-hover:text-gem-crystal" />
                )}
              </button>

              {/* Collections Grid/List */}
              {isExpanded && (
                <div className={
                  viewMode === 'grid'
                    ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : ''
                }>
                  {categoryCollections.map((collection, index) => {
                    const borderColors = [
                      'border-gem-crystal/20 hover:shadow-gem-crystal/20',
                      'border-gem-gold/20 hover:shadow-gem-gold/20',
                      'border-gem-pink/20 hover:shadow-gem-pink/20'
                    ];
                    const borderStyle = borderColors[index % borderColors.length];
                    const collectionNFTs = collectionImages.get(collection.contractAddress) || collectionImages.get(collection.id);
                    const coverImage = collectionNFTs && collectionNFTs.length > 0 ? collectionNFTs[0].image : null;

                    // Grid View
                    if (viewMode === 'grid') {
                      return (
                        <Link key={collection.id} href={`/nft/collection/${collection.id}`}>
                          <div className={`bg-gradient-to-br from-dark-card via-dark-card to-gem-crystal/5 border ${borderStyle} rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer group h-full`}>
                            {/* Image */}
                            <div className="relative aspect-square bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden flex items-center justify-center">
                              {loadingImages ? (
                                <div className="w-full h-full relative">
                                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-750 to-gray-800 animate-pulse"></div>
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/50 to-transparent animate-shimmer"></div>
                                </div>
                              ) : coverImage ? (
                                <>
                                  <img
                                    src={coverImage}
                                    alt={collection.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </>
                              ) : (
                                <>
                                  <div className="absolute inset-0 bg-gradient-to-br from-gem-crystal/10 via-gem-gold/10 to-gem-pink/10"></div>
                                  <ImageIcon className="w-24 h-24 text-gray-600 group-hover:text-gem-crystal transition-colors duration-300" />
                                </>
                              )}
                            </div>

                            {/* Content */}
                            <div className="p-4 flex-1 flex flex-col">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="text-xl font-bold group-hover:text-gem-crystal transition-colors flex-1 min-h-[2rem]">
                                  {collection.name}
                                </h4>
                                <div className="flex gap-1 flex-shrink-0">
                                  {getStatusBadge(collection.status)}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 mb-3">
                                <div className="bg-dark-bg/80 px-2 py-1 rounded text-xs font-semibold">
                                  {collection.type}
                                </div>
                              </div>

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
                    }

                    // List View
                    return (
                      <Link key={collection.id} href={`/nft/collection/${collection.id}`} className="block mb-3">
                        <div className={`bg-gradient-to-br from-dark-card via-dark-card to-gem-crystal/5 border ${borderStyle} rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group`}>
                          <div className="flex items-center gap-4 p-4">
                            {/* Small Image */}
                            <div className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden">
                              {loadingImages ? (
                                <div className="w-full h-full relative">
                                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-750 to-gray-800 animate-pulse"></div>
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/50 to-transparent animate-shimmer"></div>
                                </div>
                              ) : coverImage ? (
                                <img
                                  src={coverImage}
                                  alt={collection.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gem-crystal/10 via-gem-gold/10 to-gem-pink/10">
                                  <ImageIcon className="w-8 h-8 text-gray-600" />
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-lg font-bold group-hover:text-gem-crystal transition-colors truncate">
                                  {collection.name}
                                </h4>
                                {getStatusBadge(collection.status)}
                                <div className="bg-dark-bg/80 px-2 py-1 rounded text-xs font-semibold">
                                  {collection.type}
                                </div>
                              </div>
                              <p className="text-gray-400 text-sm line-clamp-1">
                                {collection.description}
                              </p>
                            </div>

                            {/* Stats */}
                            <div className="flex gap-6 flex-shrink-0">
                              <div className="text-center">
                                <div className="text-sm font-bold text-gem-crystal">{collection.supply}</div>
                                <div className="text-xs text-gray-400">Supply</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm font-bold text-gem-gold">{collection.holders}</div>
                                <div className="text-xs text-gray-400">Holders</div>
                              </div>
                            </div>

                            <ExternalLink className="w-5 h-5 text-gem-crystal group-hover:text-gem-gold transition-colors flex-shrink-0" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {/* Contract Addresses - Collapsible */}
        <div className="bg-dark-card border border-gem-crystal/20 rounded-xl p-6 mb-8">
          <button
            onClick={() => setContractsExpanded(!contractsExpanded)}
            className="w-full flex items-center justify-between group cursor-pointer"
          >
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Wallet className="w-5 h-5 text-gem-crystal" />
              Collection Contracts on Base
            </h3>
            {contractsExpanded ? (
              <ChevronUp className="w-5 h-5 text-gem-crystal group-hover:text-gem-gold transition-colors" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gem-crystal group-hover:text-gem-gold transition-colors" />
            )}
          </button>

          {contractsExpanded && (
            <div className="space-y-3 mt-4">
              {collections.filter(c => c.contractAddress).map((collection) => (
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
          )}
        </div>

        {/* Holder Benefits Section */}
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-purple/5 border border-gem-purple/20 rounded-xl p-6">
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

      {/* Shimmer animation */}
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
