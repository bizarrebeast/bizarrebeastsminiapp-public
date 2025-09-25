/**
 * Production Test Page for BB Auth
 * BizarreBeasts Authentication System
 * Temporary page with extensive logging for testing in Farcaster production
 */

'use client';

import { useState, useEffect } from 'react';
import { useBBAuth } from '@/hooks/useBBAuth';
import { authenticatedFetch } from '@/lib/auth/authenticated-fetch';
import { initializeBBAuth } from '@/lib/auth/bb-auth-sdk';
import sdk from '@farcaster/miniapp-sdk';

// Debug log with timestamp
const debugLog = (message: string, data?: any) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`🔍 [${timestamp}] ${message}`, data || '');
};

export default function TestBBAuthProductionPage() {
  const auth = useBBAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [sdkContext, setSdkContext] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [detectedEnvironment, setDetectedEnvironment] = useState<any>({});

  // Add log entry
  const addLog = (message: string, data?: any) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const logEntry = `[${timestamp}] ${message}${data ? ': ' + JSON.stringify(data) : ''}`;
    setLogs(prev => [...prev, logEntry]);
    debugLog(message, data);
  };

  // Detect environment on mount
  useEffect(() => {
    detectEnvironment();
  }, []);

  // Log auth state changes
  useEffect(() => {
    addLog('Auth state changed', {
      initialized: auth.isInitialized,
      authenticated: auth.isAuthenticated,
      user: auth.user?.username,
      wallet: auth.wallet,
      inMiniapp: auth.isInMiniapp
    });
  }, [auth.isAuthenticated, auth.user, auth.wallet]);

  // Comprehensive environment detection
  const detectEnvironment = async () => {
    addLog('🚀 Starting environment detection...');

    const env: any = {
      userAgent: navigator.userAgent,
      referrer: document.referrer || 'NONE',
      url: window.location.href,
      origin: window.location.origin,
      isIframe: window !== window.top,
      hasParent: window.parent !== window,
    };

    // Check for Farcaster indicators
    env.hasFarcasterInUA = /farcaster|warpcast/i.test(navigator.userAgent);
    env.hasFarcasterInURL = window.location.href.includes('farcaster');

    // Check SDK
    try {
      env.isInMiniApp = await sdk.isInMiniApp();
      addLog('SDK isInMiniApp result', env.isInMiniApp);

      if (env.isInMiniApp) {
        // Wait for SDK ready
        await sdk.actions.ready();
        addLog('SDK ready signal sent');

        // Get context
        const context = await sdk.context;
        setSdkContext(context);
        addLog('SDK Context received', context);

        // Try to get user
        if (context?.user) {
          addLog('Farcaster user detected', {
            fid: context.user.fid,
            username: context.user.username
          });
        }

        // Try to get wallet provider
        try {
          const provider = await sdk.wallet.getEthereumProvider();
          env.hasWalletProvider = !!provider;
          addLog('Wallet provider available', env.hasWalletProvider);

          if (provider) {
            const accounts = await provider.request({ method: 'eth_accounts' });
            env.connectedWallet = accounts[0] || null;
            addLog('Connected wallet', env.connectedWallet);
          }
        } catch (walletError) {
          addLog('Wallet provider error', walletError);
        }
      }
    } catch (sdkError) {
      addLog('SDK error', sdkError);
      env.sdkError = sdkError?.toString();
    }

    setDetectedEnvironment(env);
    addLog('Environment detection complete', env);
  };

  // Test authenticated API
  const testAuthenticatedApi = async () => {
    setIsTestingApi(true);
    addLog('🧪 Starting API test...');

    try {
      // Test 1: Check auth status (using quickAuth for proper token)
      addLog('Test 1: Checking auth status with quickAuth...');
      const statusResponse = await sdk.quickAuth.fetch('/api/auth/v2/verify', {
        method: 'GET',
        headers: {
          'X-Wallet-Address': auth.wallet || ''
        }
      });
      const statusData = await statusResponse.json();
      addLog('Auth status result', statusData);

      // Test 2: Verify auth with wallet
      addLog('Test 2: Verifying authentication with wallet...');
      const verifyResponse = await sdk.quickAuth.fetch('/api/auth/v2/verify', {
        method: 'POST',
        headers: {
          'X-Wallet-Address': auth.wallet || ''
        }
      });
      const verifyData = await verifyResponse.json();
      addLog('Auth verification result', verifyData);

      // Test 3: Check session
      addLog('Test 3: Checking session...');
      const sessionResponse = await fetch('/api/auth/v2/session');
      const sessionData = await sessionResponse.json();
      addLog('Session check result', sessionData);

      setTestResults({
        status: statusData,
        verify: verifyData,
        session: sessionData
      });

      addLog('✅ All API tests complete');
    } catch (error) {
      addLog('❌ API test failed', error);
      setTestResults({ error: error instanceof Error ? error.message : 'Test failed' });
    } finally {
      setIsTestingApi(false);
    }
  };

  // Test wallet connection
  const testWalletConnection = async () => {
    addLog('💳 Testing wallet connection...');
    try {
      const wallet = await auth.connectWallet();
      addLog('Wallet connected', wallet);
    } catch (error) {
      addLog('Wallet connection failed', error);
    }
  };

  // Test quickAuth fetch with debug endpoint
  const testQuickAuth = async () => {
    addLog('🔐 Testing quickAuth.fetch with debug endpoint...');
    try {
      // First call debug endpoint to see what SDK sends
      const debugResponse = await sdk.quickAuth.fetch('/api/auth/v2/debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: true,
          fid: auth.user?.fid,
          wallet: auth.wallet
        })
      });
      const debugData = await debugResponse.json();
      addLog('QuickAuth Debug result', debugData);

      // Also call test endpoint for comparison
      const testResponse = await sdk.quickAuth.fetch('/api/auth/v2/test');
      const testData = await testResponse.json();
      addLog('QuickAuth Test result', testData);
    } catch (error) {
      addLog('QuickAuth failed', error);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-4">
          BB Auth Production Test 🧪
        </h1>

        {/* Timeout Retry Button */}
        {auth.hasTimedOut && (
          <div className="mb-4 p-4 bg-yellow-500/20 border border-yellow-500 rounded-lg">
            <p className="text-yellow-400 mb-2">
              Authentication timed out. This happens sometimes due to race conditions.
            </p>
            <button
              onClick={() => auth.retry()}
              className="px-4 py-2 bg-yellow-500 text-black font-semibold rounded hover:bg-yellow-400"
            >
              Retry (Refreshes Page)
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column - Status and Actions */}
          <div className="space-y-4">
            {/* Auth Status */}
            <div className="bg-dark-card rounded-lg p-4 border border-gem-crystal/20">
              <h2 className="text-lg font-semibold text-gem-crystal mb-3">
                Authentication Status
              </h2>
              <div className="space-y-1 text-xs">
                <div>Initialized: {auth.isInitialized ? '✅' : '⏳'}</div>
                <div>Authenticated: {auth.isAuthenticated ? '✅' : '❌'}</div>
                <div>Loading: {auth.isLoading ? '⏳' : '✅'}</div>
                <div>Context: {auth.isInMiniapp ? '📱 Miniapp' : '🌐 Web'}</div>
                {auth.error && <div className="text-red-400">Error: {auth.error}</div>}
              </div>
            </div>

            {/* User Info */}
            <div className="bg-dark-card rounded-lg p-4 border border-gem-crystal/20">
              <h2 className="text-lg font-semibold text-gem-crystal mb-3">
                User Information
              </h2>
              {auth.user ? (
                <div className="space-y-1 text-xs">
                  <div>FID: {auth.user.fid}</div>
                  <div>Username: @{auth.user.username}</div>
                  <div>Display: {auth.user.displayName}</div>
                  <div>Wallet: {auth.wallet ? `${auth.wallet.slice(0, 8)}...` : 'None'}</div>
                  <div>Verified: {auth.isWalletVerified ? '✅' : '❌'}</div>
                </div>
              ) : (
                <div className="text-xs text-gray-400">Not authenticated</div>
              )}
            </div>

            {/* SDK Context */}
            <div className="bg-dark-card rounded-lg p-4 border border-gem-crystal/20">
              <h2 className="text-lg font-semibold text-gem-crystal mb-3">
                SDK Context
              </h2>
              {sdkContext ? (
                <pre className="text-xs overflow-auto max-h-32">
                  {JSON.stringify(sdkContext, null, 2)}
                </pre>
              ) : (
                <div className="text-xs text-gray-400">No SDK context</div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-dark-card rounded-lg p-4 border border-gem-crystal/20">
              <h2 className="text-lg font-semibold text-gem-crystal mb-3">
                Test Actions
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {!auth.isAuthenticated ? (
                  <button
                    onClick={() => auth.login()}
                    className="px-3 py-1.5 bg-gem-crystal text-black text-xs rounded"
                    disabled={auth.isLoading}
                  >
                    Sign In
                  </button>
                ) : (
                  <button
                    onClick={() => auth.logout()}
                    className="px-3 py-1.5 bg-red-500 text-white text-xs rounded"
                  >
                    Logout
                  </button>
                )}

                <button
                  onClick={testWalletConnection}
                  className="px-3 py-1.5 bg-purple-500 text-white text-xs rounded"
                  disabled={auth.isLoading}
                >
                  Connect Wallet
                </button>

                <button
                  onClick={testAuthenticatedApi}
                  className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded"
                  disabled={isTestingApi}
                >
                  Test API
                </button>

                <button
                  onClick={testQuickAuth}
                  className="px-3 py-1.5 bg-yellow-500 text-black text-xs rounded"
                >
                  Test QuickAuth
                </button>

                <button
                  onClick={detectEnvironment}
                  className="px-3 py-1.5 bg-gray-600 text-white text-xs rounded"
                >
                  Re-detect Env
                </button>

                <button
                  onClick={() => auth.refresh()}
                  className="px-3 py-1.5 bg-gray-600 text-white text-xs rounded"
                >
                  Refresh
                </button>

                <button
                  onClick={() => setLogs([])}
                  className="px-3 py-1.5 bg-gray-700 text-white text-xs rounded"
                >
                  Clear Logs
                </button>

                <button
                  onClick={() => navigator.clipboard.writeText(logs.join('\n'))}
                  className="px-3 py-1.5 bg-green-600 text-white text-xs rounded"
                >
                  Copy Logs
                </button>
              </div>
            </div>

            {/* Environment */}
            <div className="bg-dark-card rounded-lg p-4 border border-gem-crystal/20">
              <h2 className="text-lg font-semibold text-gem-crystal mb-3">
                Environment Detection
              </h2>
              <pre className="text-xs overflow-auto max-h-40">
                {JSON.stringify(detectedEnvironment, null, 2)}
              </pre>
            </div>
          </div>

          {/* Right Column - Logs */}
          <div className="space-y-4">
            {/* Console Logs */}
            <div className="bg-dark-card rounded-lg p-4 border border-gem-crystal/20">
              <h2 className="text-lg font-semibold text-gem-crystal mb-3">
                Console Logs ({logs.length})
              </h2>
              <div className="bg-black p-2 rounded h-96 overflow-auto">
                {logs.length > 0 ? (
                  logs.map((log, i) => (
                    <div key={i} className="text-xs text-green-400 font-mono mb-1">
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-500">No logs yet...</div>
                )}
              </div>
            </div>

            {/* Test Results */}
            {testResults && (
              <div className="bg-dark-card rounded-lg p-4 border border-gem-crystal/20">
                <h2 className="text-lg font-semibold text-gem-crystal mb-3">
                  API Test Results
                </h2>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(testResults, null, 2)}
                </pre>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
              <h2 className="text-lg font-semibold text-yellow-400 mb-3">
                Production Test Instructions
              </h2>
              <ol className="text-xs text-yellow-200 space-y-1">
                <li>1. Deploy this to production</li>
                <li>2. Open in Farcaster desktop/mobile</li>
                <li>3. Watch console logs populate</li>
                <li>4. Test all buttons to see auth flow</li>
                <li>5. Copy logs and share results</li>
                <li>6. Check browser console for more details</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}