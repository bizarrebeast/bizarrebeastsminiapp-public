'use client';

import React, { useEffect, useCallback } from 'react';
import { NeynarAuthButton } from '@neynar/react';

interface NeynarAuthButtonEnhancedProps {
  className?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

/**
 * Enhanced Neynar Auth Button that handles the document.referrer issue
 * Stores origin URL before auth and provides fallback for missing referrer
 */
export function NeynarAuthButtonEnhanced({
  className,
  onSuccess,
  onError
}: NeynarAuthButtonEnhancedProps) {

  useEffect(() => {
    // Store the current page URL when component mounts
    // This ensures we have a fallback origin even if referrer is lost
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.href;
      sessionStorage.setItem('neynar_auth_origin', currentUrl);

      // Also store in localStorage as backup
      localStorage.setItem('neynar_auth_origin_backup', currentUrl);

      console.log('📍 Stored auth origin URL:', currentUrl);
    }
  }, []);

  // Handle auth button click
  const handleAuthClick = useCallback(() => {
    // Store current URL again right before auth
    const currentUrl = window.location.href;
    sessionStorage.setItem('neynar_auth_origin', currentUrl);
    sessionStorage.setItem('neynar_auth_timestamp', Date.now().toString());

    // Store the referrer if it exists
    if (document.referrer) {
      sessionStorage.setItem('neynar_original_referrer', document.referrer);
    }

    console.log('🔐 Auth initiated with fallback data:', {
      origin: currentUrl,
      referrer: document.referrer || 'none',
      timestamp: Date.now()
    });
  }, []);

  // Fix for missing referrer - inject it if needed
  useEffect(() => {
    if (typeof window !== 'undefined' && !document.referrer) {
      // Check if we're on a Neynar auth page
      const isNeynarAuthPage = window.location.href.includes('neynar.com') ||
                               window.location.href.includes('/api/neynar/auth');

      if (isNeynarAuthPage) {
        // Try to recover the origin from storage
        const storedOrigin = sessionStorage.getItem('neynar_auth_origin') ||
                            localStorage.getItem('neynar_auth_origin_backup') ||
                            'https://bbapp.bizarrebeasts.io';

        console.log('⚠️ Missing referrer detected, using stored origin:', storedOrigin);

        // Attempt to set referrer property (this might not work in all browsers)
        try {
          Object.defineProperty(document, 'referrer', {
            value: storedOrigin,
            configurable: true
          });
        } catch (e) {
          console.warn('Could not override referrer:', e);
        }
      }
    }
  }, []);

  // Wrap the Neynar button with our enhancements
  return (
    <div
      className={className}
      onClick={handleAuthClick}
    >
      <NeynarAuthButton />

      {/* Add custom styles to ensure the button is clickable */}
      <style jsx global>{`
        /* Ensure Neynar button is properly clickable */
        .neynar-auth-button {
          cursor: pointer !important;
          user-select: none !important;
        }

        /* Fix for button not responding to clicks */
        .neynar-auth-button * {
          pointer-events: none !important;
        }

        .neynar-auth-button {
          pointer-events: auto !important;
        }
      `}</style>
    </div>
  );
}

/**
 * Hook to handle Neynar auth callback and recovery
 */
export function useNeynarAuthRecovery() {
  useEffect(() => {
    // Check if we're returning from auth
    const urlParams = new URLSearchParams(window.location.search);
    const isAuthCallback = urlParams.has('code') || urlParams.has('error');

    if (isAuthCallback && !document.referrer) {
      // Try to recover the origin
      const storedOrigin = sessionStorage.getItem('neynar_auth_origin');
      const authTimestamp = sessionStorage.getItem('neynar_auth_timestamp');

      if (storedOrigin && authTimestamp) {
        const timeDiff = Date.now() - parseInt(authTimestamp);
        // If auth was initiated less than 5 minutes ago
        if (timeDiff < 5 * 60 * 1000) {
          console.log('🔄 Recovering from auth with stored origin:', storedOrigin);

          // Clean up storage
          sessionStorage.removeItem('neynar_auth_origin');
          sessionStorage.removeItem('neynar_auth_timestamp');

          // If there's an error, redirect back with the error
          if (urlParams.has('error')) {
            const error = urlParams.get('error');
            console.error('Auth error:', error);
            // Redirect back to origin with error
            window.location.href = `${storedOrigin}?auth_error=${error}`;
          }
        }
      }
    }
  }, []);
}