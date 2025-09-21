/**
 * Sign In With Neynar Button Component
 * Uses official Neynar React SDK for authentication
 */

'use client';

import { NeynarAuthButton, useNeynarContext } from '@neynar/react';
import { User, CheckCircle, LogOut } from 'lucide-react';

export function SignInWithNeynar() {
  const { user } = useNeynarContext();

  if (user) {
    return (
      <div className="bg-dark-card border border-gem-crystal/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user.pfp_url ? (
              <img
                src={user.pfp_url}
                alt={user.display_name || user.username}
                className="w-10 h-10 rounded-full border-2 border-gem-crystal"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gem-crystal/20 flex items-center justify-center">
                <User className="w-6 h-6 text-gem-crystal" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{user.display_name || user.username}</span>
                <CheckCircle className="w-4 h-4 text-gem-crystal" />
              </div>
              <span className="text-xs text-gray-400">@{user.username} • FID: {user.fid}</span>
            </div>
          </div>
          <NeynarAuthButton />
        </div>
        <div className="mt-3 pt-3 border-t border-gem-crystal/20">
          <p className="text-xs text-gray-400">
            ✅ Signed in with Farcaster - Your shares will be verified automatically
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gem-crystal/10 to-gem-gold/10 border border-gem-crystal/30 rounded-xl p-4">
      <div className="mb-3">
        <h3 className="font-bold text-gem-crystal mb-1">🔐 Enable Share Verification</h3>
        <p className="text-xs text-gray-400">
          Sign in with Farcaster to verify your ritual shares and earn real rewards!
        </p>
      </div>
      <NeynarAuthButton />
      <p className="text-xs text-gray-500 mt-2 text-center">
        No Farcaster account? Shares will be marked but not verified.
      </p>
    </div>
  );
}