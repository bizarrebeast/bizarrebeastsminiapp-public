'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import ShareButtons from '@/components/ShareButtons';
import { rituals } from './metadata';
import { sdk } from '@/lib/sdk-init';
import { openExternalUrl } from '@/lib/open-external-url';
import { getRitualInstructions } from './RitualInstructions';
import { Sparkles, Clock, CheckCircle, ExternalLink, Share2, ArrowLeft } from 'lucide-react';

// Dynamically import AttestationClient for ritual 10
const AttestationClient = dynamic(() => import('../10/AttestationClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gem-gold mx-auto mb-4"></div>
        <p className="text-gray-400">Loading proof data...</p>
      </div>
    </div>
  )
});

export default function RitualDetailClient() {
  const params = useParams();
  const router = useRouter();
  const ritualId = parseInt(params.id as string);
  const ritual = rituals.find(r => r.id === ritualId);

  // Special handling for ritual 10 - attestation page
  if (ritualId === 10) {
    return <AttestationClient />;
  }
  const [isCompleted, setIsCompleted] = useState(false);
  const [isInMiniApp, setIsInMiniApp] = useState(false);

  useEffect(() => {
    // Check if we're in a miniapp
    const checkMiniApp = async () => {
      const inMiniApp = await sdk.isInMiniApp();
      setIsInMiniApp(inMiniApp);
    };
    checkMiniApp();

    // Check if ritual is completed (would normally fetch from API)
    // For demo, we'll use localStorage
    const completed = localStorage.getItem(`ritual_${ritualId}_completed`) === 'true';
    setIsCompleted(completed);
  }, [ritualId]);

  const handleActionClick = async (e: React.MouseEvent) => {
    if (ritual?.actionUrl) {
      e.preventDefault();
      await openExternalUrl(ritual.actionUrl);
    }
  };

  if (!ritual) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Ritual Not Found</h1>
          <Link
            href="/rituals"
            className="text-gem-crystal hover:text-gem-blue transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Rituals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Hero Section with Banner */}
      <div className="relative h-[40vh] sm:h-[50vh] w-full overflow-hidden">
        <Image
          src={ritual.image}
          alt={ritual.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/80 to-transparent" />

        {/* Back Button Overlay */}
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => router.push('/rituals')}
            className="flex items-center gap-2 px-4 py-2 bg-dark-bg/90 backdrop-blur-sm rounded-lg border border-gem-crystal/30 hover:border-gem-crystal/50 hover:bg-dark-panel/90 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 text-gem-crystal" />
            <span className="hidden sm:inline text-gem-crystal">Back to Rituals</span>
            <span className="sm:hidden text-gem-crystal">Back</span>
          </button>
        </div>

        {/* Ritual Number Badge */}
        <div className="absolute top-4 right-4 z-10">
          <div className="px-4 py-2 bg-dark-bg/90 backdrop-blur-sm rounded-lg border border-gem-gold/30">
            <span className="bg-gradient-to-r from-gem-crystal to-gem-gold bg-clip-text text-transparent font-bold">
              Ritual #{ritualId}
            </span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title and Status */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
              {ritual.title}
            </h1>
            <p className="text-gray-400 text-lg">{ritual.description}</p>
          </div>

          {/* Completion Status */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-dark-card to-dark-panel border border-dark-border">
            {isCompleted ? (
              <>
                <CheckCircle className="w-5 h-5 text-gem-crystal" />
                <span className="text-gem-crystal font-semibold">Completed</span>
              </>
            ) : (
              <>
                <Clock className="w-5 h-5 text-gem-gold" />
                <span className="text-gem-gold font-semibold">Pending</span>
              </>
            )}
          </div>
        </div>

        {/* Action Card */}
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-crystal/5 rounded-xl p-6 mb-6 border border-gem-crystal/20">
          <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-gem-crystal to-gem-gold bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gem-crystal" />
            How to Complete
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gem-crystal/20 to-gem-gold/20 flex items-center justify-center flex-shrink-0 mt-1 border border-gem-crystal/30">
                <span className="text-gem-crystal font-bold">1</span>
              </div>
              <div className="flex-1">
                <p className="text-gray-300">Click the button below to visit the ritual destination</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gem-gold/20 to-gem-pink/20 flex items-center justify-center flex-shrink-0 mt-1 border border-gem-gold/30">
                <span className="text-gem-gold font-bold">2</span>
              </div>
              <div className="flex-1">
                <p className="text-gray-300">{getRitualInstructions(ritualId).action}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gem-pink/20 to-gem-crystal/20 flex items-center justify-center flex-shrink-0 mt-1 border border-gem-pink/30">
                <span className="text-gem-pink font-bold">3</span>
              </div>
              <div className="flex-1">
                <p className="text-gray-300">Share your completion to complete the ritual and support the $BB ecosystem! Sharing counts towards your daily check-in.</p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-6">
            <a
              href={ritual.actionUrl}
              onClick={handleActionClick}
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg font-bold rounded-lg transition-all duration-300 transform hover:scale-[1.02]"
            >
              <span>Start Ritual</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Share Section */}
        <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-gold/5 rounded-xl p-6 border border-gem-gold/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-gem-gold" />
                <span className="bg-gradient-to-r from-gem-gold to-gem-pink bg-clip-text text-transparent">
                  Share This Ritual
                </span>
              </h3>
              <p className="text-gray-400 text-sm">Complete the ritual by sharing your progress</p>
            </div>

            <ShareButtons
              shareType="ritual"
              ritualData={{
                id: ritual.id,
                title: ritual.title,
                description: ritual.description,
                actionUrl: ritual.actionUrl
              }}
              contextUrl={`https://bbapp.bizarrebeasts.io/rituals/${ritual.id}`}
              buttonSize="md"
              showLabels={false}
            />
          </div>
        </div>

        {/* Navigation to Other Rituals */}
        <div className="mt-8 pt-8 border-t border-dark-border">
          <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-gem-crystal to-gem-gold bg-clip-text text-transparent">
            More Daily Rituals
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rituals
              .filter(r => r.id !== ritualId)
              .slice(0, 4)
              .map(r => (
                <Link
                  key={r.id}
                  href={`/rituals/${r.id}`}
                  className="flex items-center gap-3 p-3 bg-gradient-to-br from-dark-card to-dark-panel rounded-lg hover:from-dark-panel hover:to-gem-crystal/10 transition-all duration-300 border border-dark-border hover:border-gem-crystal/30 group"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-gem-crystal/20 to-gem-gold/20 flex items-center justify-center flex-shrink-0 border border-gem-crystal/30 group-hover:border-gem-crystal/50">
                    <span className="text-gem-crystal font-bold">#{r.id}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate group-hover:text-gem-crystal transition-colors">
                      {r.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{r.description}</p>
                  </div>
                </Link>
              ))}
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/rituals"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg font-bold rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              View All Rituals
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}