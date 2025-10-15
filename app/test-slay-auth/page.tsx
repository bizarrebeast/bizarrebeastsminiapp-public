/**
 * Test Page for Slay Auth Implementation
 * Tests the new authentication flow in different contexts
 */

'use client';

import { useState } from 'react';
import { useSlayAuth } from '@/hooks/useSlayAuth';
import { authenticatedFetch } from '@/lib/auth/authenticated-fetch';
import { FEATURES } from '@/lib/feature-flags';

export default function TestSlayAuthPage() {
  // Block access if test pages are disabled
  if (!FEATURES.TEST_PAGES) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Page Not Available</h1>
          <p className="text-gray-400">Test pages are disabled in production.</p>
        </div>
      </div>
    );
  }
  const auth = useSlayAuth();
  const [testResults, setTestResults] = useState<any>(null);
  const [isTestingApi, setIsTestingApi] = useState(false);

  // Test authenticated API call
  const testAuthenticatedApi = async () => {
    setIsTestingApi(true);
    try {
      console.log('🧪 Testing authenticated API call...');

      // Test the verify endpoint
      const response = await authenticatedFetch('/api/auth/v2/verify', {
        method: 'GET'
      });

      const data = await response.json();
      setTestResults(data);
      console.log('API Test Result:', data);
    } catch (error) {
      console.error('API test failed:', error);
      setTestResults({ error: error instanceof Error ? error.message : 'Test failed' });
    } finally {
      setIsTestingApi(false);
    }
  };

  // Test wallet connection
  const testWalletConnection = async () => {
    try {
      const wallet = await auth.connectWallet();
      console.log('Wallet connected:', wallet);
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          Slay Auth Test Page
        </h1>

        {/* Auth Status */}
        <div className="bg-dark-card rounded-lg p-6 mb-6 border border-gem-crystal/20">
          <h2 className="text-xl font-semibold text-gem-crystal mb-4">
            Authentication Status
          </h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Initialized:</span>
              <span className={auth.isInitialized ? 'text-green-400' : 'text-red-400'}>
                {auth.isInitialized ? '✅ Yes' : '❌ No'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Authenticated:</span>
              <span className={auth.isAuthenticated ? 'text-green-400' : 'text-red-400'}>
                {auth.isAuthenticated ? '✅ Yes' : '❌ No'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Context:</span>
              <span className="text-white">
                {auth.isInMiniapp ? '📱 Farcaster Miniapp' : '🌐 Web'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Loading:</span>
              <span className="text-white">{auth.isLoading ? 'Yes' : 'No'}</span>
            </div>

            {auth.error && (
              <div className="mt-2 p-2 bg-red-500/10 rounded text-red-400 text-xs">
                Error: {auth.error}
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        {auth.user && (
          <div className="bg-dark-card rounded-lg p-6 mb-6 border border-gem-crystal/20">
            <h2 className="text-xl font-semibold text-gem-crystal mb-4">
              User Information
            </h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">FID:</span>
                <span className="text-white">{auth.user.fid}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Username:</span>
                <span className="text-white">@{auth.user.username}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Display Name:</span>
                <span className="text-white">{auth.user.displayName}</span>
              </div>

              {auth.user.pfpUrl && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Profile Picture:</span>
                  <img
                    src={auth.user.pfpUrl}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wallet Info */}
        <div className="bg-dark-card rounded-lg p-6 mb-6 border border-gem-crystal/20">
          <h2 className="text-xl font-semibold text-gem-crystal mb-4">
            Wallet Information
          </h2>

          {auth.wallet ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Address:</span>
                <span className="text-white font-mono text-xs">
                  {auth.wallet.slice(0, 8)}...{auth.wallet.slice(-6)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Verified:</span>
                <span className={auth.isWalletVerified ? 'text-green-400' : 'text-yellow-400'}>
                  {auth.isWalletVerified ? '✅ Verified' : '⚠️ Not Verified'}
                </span>
              </div>

              <button
                onClick={() => auth.disconnectWallet()}
                className="mt-2 px-4 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
              >
                Disconnect Wallet
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-400 mb-4">No wallet connected</p>
              <button
                onClick={testWalletConnection}
                className="px-4 py-2 bg-gem-crystal/20 text-gem-crystal rounded hover:bg-gem-crystal/30"
              >
                Connect Wallet
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-dark-card rounded-lg p-6 mb-6 border border-gem-crystal/20">
          <h2 className="text-xl font-semibold text-gem-crystal mb-4">
            Actions
          </h2>

          <div className="flex flex-wrap gap-2">
            {!auth.isAuthenticated ? (
              <button
                onClick={() => auth.login()}
                className="px-4 py-2 bg-gradient-to-r from-gem-crystal to-gem-gold text-black font-semibold rounded hover:opacity-90"
                disabled={auth.isLoading}
              >
                {auth.isLoading ? 'Loading...' : 'Sign In'}
              </button>
            ) : (
              <button
                onClick={() => auth.logout()}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                disabled={auth.isLoading}
              >
                Logout
              </button>
            )}

            <button
              onClick={() => auth.refresh()}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
              disabled={auth.isLoading}
            >
              Refresh
            </button>

            <button
              onClick={testAuthenticatedApi}
              className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30"
              disabled={isTestingApi}
            >
              {isTestingApi ? 'Testing...' : 'Test API'}
            </button>
          </div>
        </div>

        {/* Test Results */}
        {testResults && (
          <div className="bg-dark-card rounded-lg p-6 border border-gem-crystal/20">
            <h2 className="text-xl font-semibold text-gem-crystal mb-4">
              API Test Results
            </h2>
            <pre className="text-xs text-gray-300 overflow-auto">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-yellow-500/10 rounded-lg p-6 border border-yellow-500/20">
          <h2 className="text-xl font-semibold text-yellow-400 mb-4">
            Testing Instructions
          </h2>

          <div className="space-y-2 text-sm text-yellow-200">
            <p>1. Open this page in Farcaster desktop/mobile to test miniapp auth</p>
            <p>2. Open in regular browser to test web auth</p>
            <p>3. Click "Sign In" to authenticate</p>
            <p>4. Click "Connect Wallet" to test wallet integration</p>
            <p>5. Click "Test API" to verify authenticated requests</p>
            <p>6. Check console for detailed logs</p>
          </div>
        </div>
      </div>
    </div>
  );
}