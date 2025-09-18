'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ExternalLink,
  FileText,
  Gamepad2,
  Palette,
  CheckSquare,
  PlayCircle
} from 'lucide-react';
import { Contest } from '@/lib/supabase';

interface ContestActionButtonsProps {
  contest: Contest;
  contestId: string;
  variant?: 'default' | 'compact' | 'stacked';
  showIcons?: boolean;
  className?: string;
  onCtaClick?: () => void;
  onSubmitClick?: () => void;
}

export default function ContestActionButtons({
  contest,
  contestId,
  variant = 'default',
  showIcons = true,
  className = '',
  onCtaClick,
  onSubmitClick
}: ContestActionButtonsProps) {
  const router = useRouter();
  const [ctaClicked, setCtaClicked] = useState(false);

  // Get appropriate icon based on contest type or CTA type
  const getCtaIcon = () => {
    if (contest.cta_type === 'game' || contest.type === 'game_score') {
      return <Gamepad2 className="w-4 h-4" />;
    }
    if (contest.cta_type === 'tool' || contest.type === 'creative') {
      return <Palette className="w-4 h-4" />;
    }
    if (contest.type === 'onboarding') {
      return <CheckSquare className="w-4 h-4" />;
    }
    if (contest.cta_type === 'external') {
      return <ExternalLink className="w-4 h-4" />;
    }
    return <PlayCircle className="w-4 h-4" />;
  };

  const handleCtaClick = async (e: React.MouseEvent) => {
    // Track CTA click if enabled
    if (contest.track_cta_clicks) {
      setCtaClicked(true);

      // Send tracking request
      try {
        const walletAddress = typeof window !== 'undefined'
          ? localStorage.getItem('walletAddress')
          : null;

        await fetch('/api/contests/track-cta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contestId: contest.id,
            walletAddress
          })
        });
      } catch (error) {
        console.error('Error tracking CTA click:', error);
      }

      onCtaClick?.();
    }

    // Handle external links
    if (contest.cta_type === 'external' || contest.cta_new_tab) {
      e.preventDefault();
      window.open(contest.cta_url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSubmitClick = () => {
    // If a custom handler is provided, use it
    // Otherwise navigate to the contest page (fallback)
    if (onSubmitClick) {
      onSubmitClick();
    } else {
      router.push(`/contests/${contestId}`);
    }
  };

  // Determine button text
  const ctaButtonText = contest.cta_button_text ||
    (contest.type === 'game_score' ? 'Play Game' :
     contest.type === 'creative' ? 'Create Entry' :
     contest.type === 'onboarding' ? 'View Tasks' : 'Start Contest');

  const isCtaExternal = contest.cta_type === 'external' || contest.cta_new_tab;

  // Stacked layout for mobile or when specified
  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {contest.cta_url ? (
          <>
            {isCtaExternal ? (
              <button
                onClick={handleCtaClick}
                className="w-full px-4 py-3 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink
                         text-dark-bg font-semibold rounded-lg hover:opacity-90 transition
                         flex items-center justify-center gap-2 group"
              >
                {showIcons && getCtaIcon()}
                <span>{ctaButtonText}</span>
                {isCtaExternal && <ExternalLink className="w-3 h-3 opacity-70" />}
              </button>
            ) : (
              <Link
                href={contest.cta_url}
                onClick={handleCtaClick}
                className="w-full px-4 py-3 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink
                         text-dark-bg font-semibold rounded-lg hover:opacity-90 transition
                         flex items-center justify-center gap-2 group"
              >
                {showIcons && getCtaIcon()}
                <span>{ctaButtonText}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </>
        ) : (
          // Default CTA button when no URL is set - shows contest type specific action
          <button
            onClick={() => {
              // For contests without a CTA URL, the main action is to submit
              if (onSubmitClick) onSubmitClick();
            }}
            className="w-full px-4 py-3 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink
                     text-dark-bg font-semibold rounded-lg hover:opacity-90 transition
                     flex items-center justify-center gap-2 group"
          >
            {showIcons && getCtaIcon()}
            <span>{ctaButtonText}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
        <button
          onClick={handleSubmitClick}
          className="w-full px-4 py-3 bg-dark-card border border-gem-crystal/50
                   text-gem-crystal font-semibold rounded-lg hover:bg-gem-crystal/10
                   transition flex items-center justify-center gap-2"
        >
          {showIcons && <FileText className="w-4 h-4" />}
          <span>Submit Entry</span>
        </button>
      </div>
    );
  }

  // Compact layout for cards
  if (variant === 'compact') {
    return (
      <div className={`flex gap-2 ${className}`}>
        {contest.cta_url && (
          <>
            {isCtaExternal ? (
              <button
                onClick={handleCtaClick}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink
                         text-dark-bg text-sm font-semibold rounded-lg hover:opacity-90 transition
                         flex items-center justify-center gap-1"
                title={ctaButtonText}
              >
                {showIcons && getCtaIcon()}
                <span className="truncate">{ctaButtonText}</span>
              </button>
            ) : (
              <Link
                href={contest.cta_url}
                onClick={handleCtaClick}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink
                         text-dark-bg text-sm font-semibold rounded-lg hover:opacity-90 transition
                         flex items-center justify-center gap-1"
                title={ctaButtonText}
              >
                {showIcons && getCtaIcon()}
                <span className="truncate">{ctaButtonText}</span>
              </Link>
            )}
          </>
        )}
        <button
          onClick={handleSubmitClick}
          className="px-3 py-2 bg-dark-card border border-gem-crystal/50
                   text-gem-crystal text-sm font-semibold rounded-lg hover:bg-gem-crystal/10
                   transition flex items-center gap-1"
          title="Submit Entry"
        >
          {showIcons && <FileText className="w-3.5 h-3.5" />}
          <span>Submit</span>
        </button>
      </div>
    );
  }

  // Default side-by-side layout
  return (
    <div className={`flex gap-3 ${className}`}>
      {contest.cta_url && (
        <>
          {isCtaExternal ? (
            <button
              onClick={handleCtaClick}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink
                       text-dark-bg font-semibold rounded-lg hover:opacity-90 transition
                       flex items-center justify-center gap-2 group"
            >
              {showIcons && getCtaIcon()}
              <span>{ctaButtonText}</span>
              {isCtaExternal && <ExternalLink className="w-3.5 h-3.5 opacity-70" />}
            </button>
          ) : (
            <Link
              href={contest.cta_url}
              onClick={handleCtaClick}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink
                       text-dark-bg font-semibold rounded-lg hover:opacity-90 transition
                       flex items-center justify-center gap-2 group"
            >
              {showIcons && getCtaIcon()}
              <span>{ctaButtonText}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </>
      )}
      <button
        onClick={handleSubmitClick}
        className="flex-1 px-4 py-2.5 bg-dark-card border border-gem-crystal/50
                 text-gem-crystal font-semibold rounded-lg hover:bg-gem-crystal/10
                 transition flex items-center justify-center gap-2"
      >
        {showIcons && <FileText className="w-4 h-4" />}
        <span>Submit Entry</span>
      </button>
    </div>
  );
}