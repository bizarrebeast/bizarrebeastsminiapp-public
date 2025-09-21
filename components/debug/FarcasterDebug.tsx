'use client';

import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';
import { useNeynarContext } from '@neynar/react';

export function FarcasterDebug() {
  const { user } = useNeynarContext();
  const {
    farcasterConnected,
    farcasterFid,
    farcasterUsername,
    farcasterDisplayName,
    farcasterPfpUrl,
    farcasterBio
  } = useUnifiedAuthStore();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 w-96 bg-black/90 border border-gem-purple p-4 rounded-lg text-xs font-mono z-50">
      <h3 className="text-gem-gold font-bold mb-2">🔍 Farcaster Debug Panel</h3>

      <div className="space-y-2">
        <div className="border-b border-gray-700 pb-2">
          <div className="text-gem-crystal">Neynar Context:</div>
          {user ? (
            <>
              <div>FID: {user.fid}</div>
              <div>Username: {user.username}</div>
              <div>Display: {user.display_name}</div>
              <div>PFP: {user.pfp_url ? '✅' : '❌'} {user.pfp_url?.substring(0, 50)}...</div>
              <div>Profile: {user.profile ? '✅' : '❌'}</div>
            </>
          ) : (
            <div className="text-red-500">No Neynar user</div>
          )}
        </div>

        <div>
          <div className="text-gem-crystal">Unified Store:</div>
          <div>Connected: {farcasterConnected ? '✅' : '❌'}</div>
          <div>FID: {farcasterFid || 'null'}</div>
          <div>Username: {farcasterUsername || 'null'}</div>
          <div>Display: {farcasterDisplayName || 'null'}</div>
          <div>PFP: {farcasterPfpUrl ? '✅' : '❌'} {farcasterPfpUrl?.substring(0, 50)}...</div>
          <div>Bio: {farcasterBio ? '✅' : '❌'}</div>
        </div>

        <div className="border-t border-gray-700 pt-2">
          <div className="text-yellow-400">
            Status: {
              !user ? 'Not logged in' :
              !farcasterConnected ? 'Neynar user exists, store not synced' :
              !farcasterPfpUrl ? 'Connected but missing PFP' :
              'Fully synced'
            }
          </div>
        </div>
      </div>
    </div>
  );
}