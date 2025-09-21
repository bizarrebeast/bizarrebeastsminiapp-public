'use client';

import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';
import { useNeynarContext } from '@neynar/react';
import { useFarcaster } from '@/contexts/FarcasterContext';
import { useFarcasterSDK } from '@/contexts/SDKContext';
import { useWallet } from '@/hooks/useWallet';
import { useEffect, useState } from 'react';
import { sdk } from '@/lib/sdk-init';

export function FarcasterDebug() {
  const { user } = useNeynarContext();
  const store = useUnifiedAuthStore();
  const farcasterContext = useFarcaster();
  const { isSDKReady } = useFarcasterSDK();
  const wallet = useWallet();
  const [sdkContext, setSDKContext] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const fetchSDKContext = async () => {
      try {
        const ctx = await sdk.context;
        setSDKContext(ctx);
      } catch (err) {
        console.error('Failed to get SDK context:', err);
      }
    };
    if (isSDKReady) {
      fetchSDKContext();
    }
  }, [isSDKReady]);

  // Only show for @bizarrebeast (FID 357897) or in development
  const isBizarreBeast = store.farcasterFid === 357897 || sdkContext?.user?.fid === 357897;
  const hasIssue = store.farcasterConnected && !store.walletAddress;

  // Show only for bizarrebeast or in development with issues
  if (!isBizarreBeast && process.env.NODE_ENV !== 'development') {
    return null;
  }
  if (!isBizarreBeast && !hasIssue && process.env.NODE_ENV === 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 max-w-2xl bg-black/95 border border-gem-purple rounded-lg text-xs font-mono z-50">
      <div className="p-3 border-b border-gray-700 flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <h3 className="text-gem-gold font-bold">🔍 Auth Debug Panel</h3>
        <span className="text-white">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {/* Critical Issue Alert */}
          {hasIssue && (
            <div className="bg-red-900/50 border border-red-500 p-2 rounded">
              <div className="text-red-300 font-bold">⚠️ AUTHENTICATION ISSUE DETECTED</div>
              <div className="text-white mt-1">Farcaster connected but no wallet address!</div>
            </div>
          )}

          {/* SDK Context */}
          <div className="border border-gray-700 p-2 rounded">
            <div className="text-gem-crystal font-bold mb-1">🎮 Farcaster SDK:</div>
            <div className="grid grid-cols-2 gap-x-4">
              <div>SDK Ready: {isSDKReady ? '✅' : '❌'}</div>
              <div>In Miniapp: {farcasterContext.isInFarcaster ? '✅' : '❌'}</div>
              <div>Platform: {sdkContext?.client?.platformType || 'unknown'}</div>
              <div>Is Mobile: {farcasterContext.isMobile ? '📱' : '💻'}</div>
            </div>
            {sdkContext?.user && (
              <div className="mt-2 pt-2 border-t border-gray-800">
                <div className="text-yellow-400">SDK User:</div>
                <div>FID: {sdkContext.user.fid}</div>
                <div>Username: {sdkContext.user.username}</div>
                <div>Has PFP: {sdkContext.user.pfpUrl ? '✅' : '❌'}</div>
              </div>
            )}
          </div>

          {/* Neynar Context */}
          <div className="border border-gray-700 p-2 rounded">
            <div className="text-gem-crystal font-bold mb-1">🔮 Neynar Context:</div>
            {user ? (
              <div className="grid grid-cols-2 gap-x-4">
                <div>FID: {user.fid}</div>
                <div>Username: {user.username}</div>
                <div>Display: {user.display_name || 'none'}</div>
                <div>Has PFP: {user.pfp_url ? '✅' : '❌'}</div>
                <div>Has Profile: {user.profile ? '✅' : '❌'}</div>
                <div>ETH Addrs: {user.verified_addresses?.eth_addresses?.length || 0}</div>
              </div>
            ) : (
              <div className="text-red-500">No Neynar user detected</div>
            )}
            {user?.verified_addresses?.eth_addresses && user.verified_addresses.eth_addresses.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-800">
                <div className="text-yellow-400">Verified Addresses:</div>
                {user.verified_addresses.eth_addresses.slice(0, 3).map((addr: string, i: number) => (
                  <div key={i} className="truncate">{addr}</div>
                ))}
              </div>
            )}
          </div>

          {/* Unified Store */}
          <div className="border border-gray-700 p-2 rounded">
            <div className="text-gem-crystal font-bold mb-1">📦 Unified Auth Store:</div>
            <div className="grid grid-cols-2 gap-x-4">
              <div>User ID: {store.userId || 'null'}</div>
              <div>FC Connected: {store.farcasterConnected ? '✅' : '❌'}</div>
              <div>FC FID: {store.farcasterFid || 'null'}</div>
              <div>FC Username: {store.farcasterUsername || 'null'}</div>
              <div>Wallet Connected: {store.walletConnected ? '✅' : '❌'}</div>
              <div>Wallet Addr: {store.walletAddress ? `${store.walletAddress.slice(0, 6)}...` : 'null'}</div>
              <div>Verified Addrs: {store.verifiedAddresses?.length || 0}</div>
              <div>Wallet Verified: {store.walletIsVerified ? '✅' : store.walletAddress ? '❌' : 'N/A'}</div>
              <div>Identities Linked: {store.identitiesLinked ? '✅' : '❌'}</div>
              <div>Primary ID: {store.primaryIdentity || 'none'}</div>
            </div>
          </div>

          {/* Wallet Hook */}
          <div className="border border-gray-700 p-2 rounded">
            <div className="text-gem-crystal font-bold mb-1">💰 Wallet Hook:</div>
            <div className="grid grid-cols-2 gap-x-4">
              <div>Connected: {wallet.isConnected ? '✅' : '❌'}</div>
              <div>Address: {wallet.address ? `${wallet.address.slice(0, 6)}...` : 'null'}</div>
              <div>Via Farcaster: {wallet.isViaFarcaster ? '✅' : '❌'}</div>
              <div>Initializing: {wallet.isInitializing ? '⏳' : '✅'}</div>
            </div>
          </div>

          {/* Diagnostics */}
          <div className="border border-yellow-600 p-2 rounded bg-yellow-900/20">
            <div className="text-yellow-400 font-bold mb-1">📊 Diagnostics:</div>
            <div className="space-y-1">
              <div>✓ In Farcaster: {farcasterContext.isInFarcaster ? 'YES' : 'NO'}</div>
              <div>✓ Neynar User: {user ? 'YES' : 'NO'}</div>
              <div>✓ Store FC Connected: {store.farcasterConnected ? 'YES' : 'NO'}</div>
              <div>✓ Has Verified Addresses: {(user?.verified_addresses?.eth_addresses?.length || 0) > 0 ? 'YES' : 'NO'}</div>
              <div>✓ Store Wallet Connected: {store.walletConnected ? 'YES' : 'NO'}</div>
              <div>✓ Wallet Hook Connected: {wallet.isConnected ? 'YES' : 'NO'}</div>
            </div>
            <div className="mt-2 pt-2 border-t border-yellow-700">
              <div className="text-white font-bold">
                Issue: {
                  !user ? '❌ Not logged into Farcaster' :
                  !store.farcasterConnected ? '❌ Farcaster data not synced to store' :
                  !store.walletAddress && store.verifiedAddresses?.length > 0 ? '❌ Has verified addresses but wallet not connected' :
                  !store.walletAddress ? '❌ No wallet address available' :
                  !wallet.isConnected ? '❌ Wallet hook not detecting connection' :
                  '✅ Everything looks good'
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}