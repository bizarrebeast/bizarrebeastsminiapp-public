'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ExternalLink, Users, Sparkles, Image as ImageIcon,
  CheckCircle, Clock, Loader, Copy, Check, X
} from 'lucide-react';
import Link from 'next/link';
import { getAllCollections, NFTCollection } from '@/lib/nft-data';
import { fetchCollectionNFTs, NFTMetadata } from '@/lib/nft-api';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CollectionPage({ params }: PageProps) {
  const router = useRouter();
  const [collection, setCollection] = useState<NFTCollection | null>(null);
  const [nfts, setNfts] = useState<NFTMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [collectionId, setCollectionId] = useState<string>('');
  const [selectedNFT, setSelectedNFT] = useState<NFTMetadata | null>(null);

  useEffect(() => {
    params.then(({ id }) => {
      setCollectionId(id);
      const allCollections = getAllCollections();
      const found = allCollections.find(c => c.id === id);
      setCollection(found || null);

      // Use static images for VibeCards, API for others
      if (id === 'bbcp-vibemarket') {
        loadStaticVibeCards();
      } else if (found?.contractAddress) {
        loadNFTs(found.contractAddress);
      } else {
        setLoading(false);
      }
    });
  }, [params]);

  const loadStaticVibeCards = () => {
    setLoading(true);
    // Generate static NFT data for VibeCards (1-23)
    const vibeCards: NFTMetadata[] = Array.from({ length: 23 }, (_, i) => ({
      tokenId: String(i + 1),
      name: `VibeCard #${i + 1}`,
      description: 'BizarreBeasts ($BBCP) VibeMarket Card',
      image: `/assets/nft/vibe-card-previews/bizarrebeasts-bbcp-vibecards-${i + 1}.png`,
      animationUrl: null,
      externalUrl: null,
      attributes: []
    }));
    setNfts(vibeCards);
    setLoading(false);
  };

  const loadNFTs = async (contractAddress: string) => {
    setLoading(true);
    try {
      const data = await fetchCollectionNFTs(contractAddress);
      setNfts(data.nfts);
    } catch (error) {
      console.error('Failed to load NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    if (collection?.contractAddress) {
      navigator.clipboard.writeText(collection.contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return (
          <div className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
            <CheckCircle className="w-4 h-4" />
            Live
          </div>
        );
      case 'upcoming':
        return (
          <div className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-semibold">
            <Clock className="w-4 h-4" />
            Coming Soon
          </div>
        );
      case 'sold-out':
        return (
          <div className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm font-semibold">
            Sold Out
          </div>
        );
      case 'ended':
        return (
          <div className="px-3 py-1 bg-gray-600/20 text-gray-500 rounded-full text-sm font-semibold">
            Ended
          </div>
        );
      default:
        return null;
    }
  };

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Collection Not Found</h1>
          <Link href="/nft" className="text-gem-crystal hover:text-gem-gold">
            ← Back to Gallery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link
          href="/nft"
          className="inline-flex items-center gap-2 text-gem-crystal hover:text-gem-gold mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Gallery
        </Link>

        {/* Collection Header */}
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-crystal/5 border border-gem-crystal/20 rounded-2xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent mb-3">
                {collection.name}
              </h1>
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-dark-bg/80 px-3 py-1 rounded text-sm font-semibold">
                  {collection.type}
                </div>
                <div className="bg-dark-bg/80 px-3 py-1 rounded text-sm font-semibold">
                  {collection.symbol}
                </div>
                {getStatusBadge(collection.status)}
              </div>
              <p className="text-gray-300 text-lg mb-4">
                {collection.description}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-dark-bg/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gem-crystal">{collection.supply}</div>
              <div className="text-sm text-gray-400">Total Supply</div>
            </div>
            <div className="bg-dark-bg/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gem-gold">{collection.holders}</div>
              <div className="text-sm text-gray-400">Holders</div>
            </div>
            <div className="bg-dark-bg/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gem-pink">{nfts.length}</div>
              <div className="text-sm text-gray-400">NFTs Loaded</div>
            </div>
          </div>

          {/* Contract Address */}
          {collection.contractAddress && (
            <div className="bg-dark-bg/50 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="text-sm text-gray-400 mb-1">Contract Address</div>
                  <code className="text-sm text-gem-crystal font-mono break-all">
                    {collection.contractAddress}
                  </code>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyAddress}
                    className="flex items-center gap-2 bg-dark-bg border border-gem-crystal/30 text-gem-crystal px-4 py-2 rounded-lg hover:bg-gem-crystal/10 transition-all text-sm"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <a
                    href={`https://basescan.org/token/${collection.contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-dark-bg border border-gem-crystal/30 text-gem-crystal px-4 py-2 rounded-lg hover:bg-gem-crystal/10 transition-all text-sm"
                  >
                    View on BaseScan
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* NFTs Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-gem-crystal" />
            Collection Items
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader className="w-12 h-12 text-gem-crystal animate-spin" />
            </div>
          ) : nfts.length === 0 ? (
            <div className="text-center py-20">
              <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No NFTs found in this collection</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {nfts.map((nft, index) => (
                <div
                  key={`${nft.tokenId}-${index}`}
                  className="bg-gradient-to-br from-dark-card via-dark-card to-gem-crystal/5 border border-gem-crystal/20 rounded-lg overflow-hidden hover:border-gem-crystal/40 hover:shadow-lg transition-all duration-300 group cursor-pointer"
                  onClick={() => setSelectedNFT(nft)}
                >
                  {/* NFT Image */}
                  <div className="relative aspect-square bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                    {nft.image ? (
                      <>
                        <img
                          src={nft.image}
                          alt={nft.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-gray-600" />
                      </div>
                    )}
                  </div>

                  {/* NFT Info */}
                  <div className="p-3">
                    <h3 className="font-bold text-sm truncate group-hover:text-gem-crystal transition-colors">
                      {nft.name}
                    </h3>
                    {nft.tokenId && (
                      <p className="text-xs text-gray-400 truncate">
                        #{nft.tokenId}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NFT Detail Modal */}
        {selectedNFT && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedNFT(null)}
          >
            <div
              className="bg-dark-card border border-gem-crystal/30 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-dark-card border-b border-gem-crystal/20 p-4 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
                  {selectedNFT.name}
                </h2>
                <button
                  onClick={() => setSelectedNFT(null)}
                  className="p-2 hover:bg-gem-crystal/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gem-crystal" />
                </button>
              </div>

              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Image */}
                  <div className="bg-gradient-to-br from-gray-900 to-black rounded-lg overflow-hidden">
                    {selectedNFT.image && (
                      <img
                        src={selectedNFT.image}
                        alt={selectedNFT.name}
                        className="w-full h-auto"
                      />
                    )}
                  </div>

                  {/* Details */}
                  <div>
                    <div className="mb-4">
                      <div className="text-sm text-gray-400 mb-1">Token ID</div>
                      <div className="text-lg font-mono">#{selectedNFT.tokenId}</div>
                    </div>

                    {selectedNFT.description && (
                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-1">Description</div>
                        <div className="text-gray-300">{selectedNFT.description}</div>
                      </div>
                    )}

                    {selectedNFT.attributes && selectedNFT.attributes.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-2">Attributes</div>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedNFT.attributes.map((attr, idx) => (
                            <div key={idx} className="bg-dark-bg/50 rounded-lg p-3">
                              <div className="text-xs text-gray-400">{attr.trait_type}</div>
                              <div className="font-semibold text-gem-crystal">{attr.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Marketplace Links */}
                    <div className="space-y-2">
                      {collection?.id === 'bbcp-vibemarket' ? (
                        <a
                          href={`https://vibechain.com/market/bizarrebeasts?ref=BJT4EJBY0SJP&pnlId=28acae0d`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg px-4 py-3 rounded-lg font-bold hover:shadow-lg transition-all"
                        >
                          View on VibeMarket
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <a
                          href={`https://opensea.io/assets/base/${collection?.contractAddress}/${selectedNFT.tokenId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full bg-dark-bg border border-gem-crystal text-gem-crystal px-4 py-3 rounded-lg font-bold hover:bg-gem-crystal/10 transition-all"
                        >
                          View on OpenSea
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <a
                        href={`https://basescan.org/token/${collection?.contractAddress}?a=${selectedNFT.tokenId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-dark-bg border border-gray-600 text-gray-300 px-4 py-3 rounded-lg font-bold hover:bg-gray-800 transition-all"
                      >
                        View on BaseScan
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
