'use client';

import { NeynarAuthButton, useNeynarContext } from '@neynar/react';
import { FarcasterAwareAuthButton } from '@/components/auth/FarcasterAwareAuthButton';
import { useEffect, useState } from 'react';
import sdk from '@farcaster/miniapp-sdk';

export default function TestNeynarPage() {
  const { user } = useNeynarContext();
  const [farcasterUser, setFarcasterUser] = useState<any>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setDebugLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    // Try to get user from Farcaster Miniapp SDK
    const initSDK = async () => {
      try {
        addLog('Starting SDK initialization...');

        // Check if we're in a miniapp
        const isInMiniApp = await sdk.isInMiniApp();
        addLog(`Is in Farcaster miniapp: ${isInMiniApp}`);
        console.log('Is in Farcaster miniapp:', isInMiniApp);

        if (isInMiniApp) {
          addLog('Attempting to get SDK context...');
          const context = await sdk.context;
          addLog(`SDK context received: ${context ? 'SUCCESS' : 'FAILED'}`);
          console.log('Farcaster SDK Context:', context);

          if (context?.user) {
            addLog(`User data found: FID ${context.user.fid}, username: ${context.user.username}`);
            setFarcasterUser(context.user);
          } else {
            addLog('No user data in context');
          }
        }
        setSdkLoaded(true);
        addLog('SDK initialization complete');
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        addLog(`SDK error: ${errorMsg}`);
        console.log('Not in Farcaster miniapp or SDK error:', error);
        setSdkLoaded(true);
      }
    };
    initSDK();
  }, []);

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
            isIframe: typeof window !== 'undefined' && window.parent !== window,
            farcasterSDKLoaded: sdkLoaded,
            farcasterSDKUser: farcasterUser
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

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Smart Auth Button (With Farcaster Detection):</h2>
        <FarcasterAwareAuthButton />
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Debug Logs:</h2>
        <div className="bg-gray-900 rounded p-4 max-h-64 overflow-y-auto">
          {debugLogs.length === 0 ? (
            <p className="text-gray-500 text-sm">No logs yet...</p>
          ) : (
            debugLogs.map((log, index) => (
              <div key={index} className="text-xs text-green-400 mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8 text-sm text-gray-500">
        <p>This is a minimal test page to verify Neynar authentication works.</p>
        <p>If this doesn't work, the issue is with Neynar configuration.</p>
        <p>If this works but the main app doesn't, the issue is with our custom logic.</p>
      </div>
    </div>
  );
}