'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Check, ExternalLink } from 'lucide-react';
import { openExternalUrl } from '@/lib/open-external-url';
import ShareButtons from '@/components/ShareButtons';
import Link from 'next/link';
import { getActiveCampaign } from '@/config/featured-ritual-config';
import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';

const featuredRitual = getActiveCampaign();

export default function FeaturedRitualClient() {
  const { farcasterConnected, walletConnected } = useUnifiedAuthStore();
  const [isCompleted, setIsCompleted] = useState(false);

  // Load completion status from localStorage
  useEffect(() => {
    const storedData = localStorage.getItem('bizarreRitualsData');
    if (storedData) {
      const data = JSON.parse(storedData);
      setIsCompleted(data.featuredCompleted || false);
    }
  }, []);

  const handleRitualCompleted = () => {
    console.log('Featured ritual share verified!');
    setIsCompleted(true);

    // Update localStorage
    const storedData = localStorage.getItem('bizarreRitualsData');
    const data = storedData ? JSON.parse(storedData) : {};
    data.featuredCompleted = true;
    localStorage.setItem('bizarreRitualsData', JSON.stringify(data));
  };

  if (!featuredRitual) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/rituals" className="inline-flex items-center gap-2 text-gem-crystal hover:text-gem-gold transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" />
          Back to Rituals
        </Link>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">No Featured Ritual Available</h1>
          <p className="text-gray-400">Check back soon for exciting featured opportunities!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Link href="/rituals" className="inline-flex items-center gap-2 text-gem-crystal hover:text-gem-gold transition-colors mb-6">
        <ChevronLeft className="w-4 h-4" />
        Back to Rituals
      </Link>

      {/* Hero Section with Banner */}
      <div className="bg-gradient-to-br from-gem-gold/20 via-dark-card to-gem-crystal/10 border-2 border-gem-gold rounded-2xl overflow-hidden shadow-xl mb-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-gem-gold/30 to-gem-crystal/30 px-6 py-3">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">⭐</span>
            <h1 className="text-xl font-bold">
              {featuredRitual.sponsorType ? (
                featuredRitual.sponsorType === 'sponsored' ? 'SPONSORED RITUAL' :
                featuredRitual.sponsorType === 'collab' ? 'COLLABORATION' :
                'PARTNER RITUAL'
              ) : (
                'FEATURED RITUAL'
              )}
            </h1>
            <span className="text-2xl">⭐</span>
          </div>
        </div>

        {/* Banner Image */}
        {featuredRitual.image && (
          <div className="relative h-64 md:h-96 overflow-hidden">
            <img
              src={featuredRitual.image}
              alt={featuredRitual.title}
              className="w-full h-full object-cover"
            />
            {isCompleted && (
              <div className="absolute top-4 right-4 bg-gem-gold/90 text-dark-bg px-3 py-1.5 rounded-lg font-semibold flex items-center gap-2">
                <Check className="w-4 h-4" />
                Completed
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Sponsor Info */}
          {featuredRitual.sponsorName && (
            <div className="flex items-center justify-center gap-2 mb-4">
              {featuredRitual.sponsorLogo && (
                <img
                  src={featuredRitual.sponsorLogo}
                  alt={featuredRitual.sponsorName}
                  className="h-8 w-auto object-contain"
                />
              )}
              <span className="text-sm text-gray-400">
                {featuredRitual.sponsorTagline || `In partnership with ${featuredRitual.sponsorName}`}
              </span>
            </div>
          )}

          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-gem-gold to-gem-crystal bg-clip-text text-transparent text-center">
            {featuredRitual.title}
          </h2>

          {/* Description */}
          <div className="text-gray-300 mb-6 space-y-4 max-w-2xl mx-auto">
            {featuredRitual.description.split('\n\n').map((paragraph, index) => (
              <p key={index} className="leading-relaxed">
                {paragraph}
              </p>
            ))}
            {featuredRitual.urgencyText && (
              <p className="text-gem-gold font-semibold text-center">
                ⏰ {featuredRitual.urgencyText}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <button
              onClick={async () => await openExternalUrl(featuredRitual.actionUrl)}
              className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform ${
                isCompleted
                  ? 'bg-gem-gold/20 text-gem-gold border border-gem-gold/40'
                  : 'bg-gradient-to-r from-gem-gold to-gem-crystal text-dark-bg hover:scale-105 hover:shadow-lg'
              }`}
            >
              {isCompleted ? (
                <>
                  <Check className="w-4 h-4" />
                  Completed
                </>
              ) : (
                <>
                  {featuredRitual.actionText}
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>

            {featuredRitual.learnMoreUrl && (
              <button
                onClick={async () => await openExternalUrl(featuredRitual.learnMoreUrl!)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 bg-dark-card border border-gem-crystal/50 text-gem-crystal hover:bg-gem-crystal/20"
              >
                {featuredRitual.learnMoreText || 'Learn More'}
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Share Section */}
          <div className="border-t border-gray-700 pt-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold mb-2">Share to Complete Ritual</h3>
              <p className="text-sm text-gray-400">
                {farcasterConnected || walletConnected
                  ? "Share this featured ritual to mark it as complete and earn rewards!"
                  : "Connect your account to verify shares and earn rewards"}
              </p>
            </div>

            <div className="flex justify-center">
              <ShareButtons
                customText={featuredRitual.shareText || `🚨 FEATURED RITUAL ALERT! 🚨\n\n${featuredRitual.shareTitle || featuredRitual.title}\n\n${featuredRitual.description.split('\n\n')[0]}`}
                shareType="ritual"
                ritualData={{
                  id: 999, // Special ID for featured ritual
                  title: featuredRitual.title,
                  description: featuredRitual.description,
                  actionUrl: featuredRitual.actionUrl
                }}
                buttonSize="md"
                showLabels={true}
                contextUrl={featuredRitual.shareEmbed || "https://bbapp.bizarrebeasts.io/rituals/featured"}
                onVerified={() => handleRitualCompleted()}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Partnership CTA */}
      <div className="text-center">
        <button
          onClick={async () => await openExternalUrl('https://bbapp.bizarrebeasts.io/partnerships')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-dark-card to-gem-gold/10 border border-gem-gold/30 text-gem-gold font-semibold rounded-lg hover:from-gem-gold/20 hover:to-gem-gold/30 hover:border-gem-gold/50 transition-all group"
        >
          <span className="text-lg">🤝</span>
          <span>Want to feature your project here?</span>
          <span className="text-sm opacity-70 group-hover:opacity-100">Learn more →</span>
        </button>
      </div>
    </div>
  );
}