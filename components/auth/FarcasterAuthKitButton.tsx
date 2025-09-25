'use client';

import React, { useCallback, useState } from 'react';
import {
  SignInButton,
  UseSignInData,
  useProfile,
  AuthClientError
} from '@farcaster/auth-kit';
import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';
import { Wallet, Loader2 } from 'lucide-react';

interface FarcasterAuthKitButtonProps {
  onSuccess?: () => void;
  className?: string;
}

export function FarcasterAuthKitButton({ onSuccess, className }: FarcasterAuthKitButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { connectFarcaster, connectWallet } = useUnifiedAuthStore();
  const profile = useProfile();

  const handleSuccess = useCallback(async (res: UseSignInData) => {
    console.log('🎉 AuthKit Sign In Success:', res);
    setIsLoading(true);

    try {
      // Extract user data from the response
      if (res.fid && res.username) {
        // Update Farcaster connection in unified store
        await connectFarcaster({
          fid: res.fid,
          username: res.username,
          display_name: res.displayName || res.username,
          displayName: res.displayName || res.username,
          pfp_url: res.pfpUrl || '',
          pfpUrl: res.pfpUrl || '',
          bio: res.bio || '',
          verified_addresses: res.verifications || [],
          verifiedAddresses: res.verifications || []
        });

        // If user has a verified address, also connect wallet
        if (res.verifications && res.verifications.length > 0) {
          const primaryAddress = res.verifications[0];
          await connectWallet(primaryAddress);
        }

        console.log('✅ AuthKit user connected to unified store');
        onSuccess?.();
      }
    } catch (error) {
      console.error('❌ AuthKit connection error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [connectFarcaster, connectWallet, onSuccess]);

  const handleError = useCallback((error?: AuthClientError) => {
    console.error('❌ AuthKit Sign In Error:', error);
    setIsLoading(false);
  }, []);

  const handleSignOut = useCallback(() => {
    console.log('👋 AuthKit Sign Out');
    // Handle signout if needed
  }, []);

  // If already signed in via AuthKit, show profile
  if (profile?.isAuthenticated) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-dark-card border border-gem-crystal/30 rounded-lg">
        {profile.profile?.pfpUrl && (
          <img
            src={profile.profile.pfpUrl}
            alt="Profile"
            className="w-6 h-6 rounded-full"
          />
        )}
        <span className="text-sm font-semibold text-gem-crystal">
          @{profile.profile?.username || 'Connected'}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <SignInButton
        onSuccess={handleSuccess}
        onError={handleError}
        onSignOut={handleSignOut}
      />
      {/* Custom styled button overlay */}
      <style jsx global>{`
        /* Style the AuthKit button to match BizarreBeasts theme */
        .fc-authkit-signin-button {
          background: linear-gradient(to right, #40E0D0, #FFD700, #FF69B4) !important;
          color: #0a0a0a !important;
          font-weight: 700 !important;
          padding: 0.75rem 2rem !important;
          border-radius: 0.5rem !important;
          border: none !important;
          transition: all 0.3s ease !important;
          font-size: 0.875rem !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 0.5rem !important;
          width: 100% !important;
          cursor: pointer !important;
          text-align: center !important;
        }

        .fc-authkit-signin-button:hover {
          transform: scale(1.05) !important;
          box-shadow: 0 10px 20px rgba(64, 224, 208, 0.3) !important;
        }

        .fc-authkit-signin-button:active {
          transform: scale(0.98) !important;
        }

        /* QR code modal styling */
        .fc-authkit-modal {
          background: #0a0a0a !important;
          border: 1px solid rgba(64, 224, 208, 0.3) !important;
          border-radius: 0.75rem !important;
        }

        .fc-authkit-modal-heading {
          color: #fff !important;
          font-weight: 700 !important;
        }

        .fc-authkit-modal-body {
          color: #999 !important;
        }

        .fc-authkit-qr-code {
          background: white !important;
          padding: 1rem !important;
          border-radius: 0.5rem !important;
        }
      `}</style>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-sm text-gem-crystal mt-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Connecting...</span>
        </div>
      )}
    </div>
  );
}