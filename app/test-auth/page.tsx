'use client';

import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';
import { useState } from 'react';

export default function TestAuthPage() {
  const {
    walletAddress,
    walletConnected,
    farcasterFid,
    farcasterConnected,
    farcasterUsername,
    identitiesLinked,
    userId,
    connectWallet,
    connectFarcaster,
    disconnectWallet,
    disconnectFarcaster,
    linkIdentities,
    disconnect,
    refreshProfile,
    isLoading,
    error
  } = useUnifiedAuthStore();

  const [testWallet] = useState(`0x${Math.random().toString(16).substr(2, 40).padEnd(40, '0')}`);
  const [customFid, setCustomFid] = useState('357897');

  const handleConnectFarcaster = async () => {
    // Simulate Farcaster connection with your FID
    const mockFarcasterUser = {
      fid: parseInt(customFid),
      username: 'testuser',
      display_name: 'Test User',
      displayName: 'Test User',
      pfp_url: 'https://i.imgur.com/default.png',
      pfpUrl: 'https://i.imgur.com/default.png',
      bio: 'Testing unified auth',
      verified_addresses: [walletAddress].filter(Boolean),
      verifiedAddresses: [walletAddress].filter(Boolean)
    };

    await connectFarcaster(mockFarcasterUser);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Unified Auth Test Page</h1>

        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Current State:</h2>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex gap-2">
              <span className="text-gray-400">User ID:</span>
              <span className="text-green-400">{userId || 'Not connected'}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-400">Wallet Connected:</span>
              <span>{walletConnected ? '✅' : '❌'}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-400">Wallet Address:</span>
              <span className="text-blue-400">{walletAddress || 'None'}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-400">Farcaster Connected:</span>
              <span>{farcasterConnected ? '✅' : '❌'}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-400">Farcaster FID:</span>
              <span className="text-purple-400">{farcasterFid || 'None'}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-400">Farcaster Username:</span>
              <span className="text-purple-400">{farcasterUsername || 'None'}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-400">Identities Linked:</span>
              <span className={identitiesLinked ? 'text-green-400' : 'text-yellow-400'}>
                {identitiesLinked ? '✅ Linked!' : '❌ Not Linked'}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-400">Loading:</span>
              <span>{isLoading ? 'Yes...' : 'No'}</span>
            </div>
            {error && (
              <div className="flex gap-2">
                <span className="text-gray-400">Error:</span>
                <span className="text-red-400">{error}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Actions:</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Wallet Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-blue-400">Wallet</h3>
              {!walletConnected ? (
                <button
                  onClick={() => connectWallet(testWallet)}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Connect Test Wallet
                </button>
              ) : (
                <button
                  onClick={disconnectWallet}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Disconnect Wallet
                </button>
              )}
            </div>

            {/* Farcaster Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-purple-400">Farcaster</h3>
              {!farcasterConnected ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customFid}
                    onChange={(e) => setCustomFid(e.target.value)}
                    placeholder="Enter FID"
                    className="w-full px-3 py-2 bg-gray-700 rounded text-white"
                  />
                  <button
                    onClick={handleConnectFarcaster}
                    disabled={isLoading}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Connect Farcaster (FID: {customFid})
                  </button>
                </div>
              ) : (
                <button
                  onClick={disconnectFarcaster}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Disconnect Farcaster
                </button>
              )}
            </div>
          </div>

          {/* Link/Unlink Actions */}
          <div className="border-t border-gray-700 pt-4 space-y-4">
            {walletConnected && farcasterConnected && !identitiesLinked && (
              <button
                onClick={linkIdentities}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                🔗 Link Wallet + Farcaster Identities
              </button>
            )}

            <div className="flex gap-4">
              <button
                onClick={refreshProfile}
                disabled={isLoading || !userId}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔄 Refresh Profile
              </button>

              <button
                onClick={disconnect}
                disabled={isLoading || (!walletConnected && !farcasterConnected)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Disconnect All
              </button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-900 rounded">
            <p className="text-sm text-gray-400 mb-2">
              <strong>Instructions:</strong>
            </p>
            <ol className="list-decimal list-inside text-sm text-gray-400 space-y-1">
              <li>Connect a test wallet (or use the generated one)</li>
              <li>Connect Farcaster with your FID (357897)</li>
              <li>Click "Link Identities" to connect them in the database</li>
              <li>Watch the state update in real-time above</li>
            </ol>
            <p className="text-xs text-gray-500 mt-4">
              Note: This is using mock Farcaster data for testing. Real Farcaster connection
              will come when we integrate the actual Neynar button in Phase 2.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}