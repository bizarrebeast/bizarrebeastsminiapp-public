'use client';

import { NeynarAuthButton, useNeynarContext } from '@neynar/react';

export default function TestNeynarPage() {
  const { user } = useNeynarContext();

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-8">Neynar Authentication Test</h1>

      <div className="mb-8 p-4 bg-gray-900 rounded">
        <h2 className="text-lg font-semibold mb-4">Debug Info:</h2>
        <pre className="text-xs text-gray-400">
          {JSON.stringify({
            clientId: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID,
            currentUrl: typeof window !== 'undefined' ? window.location.href : 'SSR',
            userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'SSR',
            isMobile: typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
            isIframe: typeof window !== 'undefined' && window.parent !== window
          }, null, 2)}
        </pre>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Auth Status:</h2>
        {user ? (
          <div className="p-4 bg-green-900 rounded">
            <p className="mb-2">✅ Authenticated!</p>
            <p>FID: {user.fid}</p>
            <p>Username: {user.username}</p>
            <p>Display Name: {user.display_name}</p>
          </div>
        ) : (
          <div className="p-4 bg-red-900 rounded">
            <p>❌ Not authenticated</p>
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Login Button (Direct Neynar):</h2>
        <NeynarAuthButton />
      </div>

      <div className="mt-8 text-sm text-gray-500">
        <p>This is a minimal test page to verify Neynar authentication works.</p>
        <p>If this doesn't work, the issue is with Neynar configuration.</p>
        <p>If this works but the main app doesn't, the issue is with our custom logic.</p>
      </div>
    </div>
  );
}