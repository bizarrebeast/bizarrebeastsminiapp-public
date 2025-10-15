'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useBBAuth } from '@/hooks/useBBAuth';
import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';
import { sdk } from '@/lib/sdk-init';
import { getSDKContext, isSDKReady } from '@/lib/sdk-ultimate';
import { authenticatedFetch } from '@/lib/auth/authenticated-fetch';
import { detectFarcasterContext } from '@/lib/auth/farcaster-detection';
import { FEATURES } from '@/lib/feature-flags';

function TestAuthPageContent() {
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
  const wallet = useWallet();
  const bbAuth = useBBAuth();
  const unifiedStore = useUnifiedAuthStore();
  const [sdkInfo, setSdkInfo] = useState<any>({});
  const [fetchTest, setFetchTest] = useState<any>(null);
  const [isInMiniapp, setIsInMiniapp] = useState<boolean>(false);
  const [ritualData, setRitualData] = useState<any>(null);
  const [verifiedAddresses, setVerifiedAddresses] = useState<any>(null);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  // Capture console logs
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const logs: string[] = [];

    // Override console methods
    console.log = (...args) => {
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      // Filter for relevant auth logs
      if (message.includes('BB Auth') ||
          message.includes('UnifiedStore') ||
          message.includes('Sync') ||
          message.includes('sync') ||
          message.includes('Farcaster') ||
          message.includes('wallet') ||
          message.includes('SDK') ||
          message.includes('getCorrectProvider') ||
          message.includes('getUnifiedProvider') ||
          message.includes('✅') ||
          message.includes('❌') ||
          message.includes('⚠️') ||
          message.includes('🔍') ||
          message.includes('📱')) {
        logs.push(`[LOG] ${message}`);
        setConsoleLogs(prev => [...prev.slice(-50), `[LOG] ${message}`]); // Keep last 50 logs
      }
      originalLog.apply(console, args);
    };

    console.error = (...args) => {
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      logs.push(`[ERROR] ${message}`);
      setConsoleLogs(prev => [...prev.slice(-50), `[ERROR] ${message}`]);
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      logs.push(`[WARN] ${message}`);
      setConsoleLogs(prev => [...prev.slice(-50), `[WARN] ${message}`]);
      originalWarn.apply(console, args);
    };

    return () => {
      // Restore original console methods
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  useEffect(() => {
    const checkSDK = async () => {
      try {
        // Use both detection methods for comparison
        let inApp = false;
        let enhancedDetection = { isInMiniapp: false, method: 'none' };

        // Safely try SDK method
        try {
          if (sdk && typeof sdk.isInMiniApp === 'function') {
            inApp = await sdk.isInMiniApp();
          }
        } catch (sdkError) {
          console.error('[TestAuth] SDK isInMiniApp error:', sdkError);
        }

        // Enhanced detection should be safe
        try {
          enhancedDetection = await detectFarcasterContext();
          setIsInMiniapp(enhancedDetection.isInMiniapp);
        } catch (detectError) {
          console.error('[TestAuth] Enhanced detection error:', detectError);
        }

        const context = getSDKContext();
        const ready = isSDKReady();

        setSdkInfo({
          isInMiniApp: inApp,
          enhancedDetection: enhancedDetection,
          isReady: ready,
          context: context,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
          url: typeof window !== 'undefined' ? window.location.href : 'N/A',
          referrer: typeof document !== 'undefined' ? document.referrer : 'N/A'
        });

        // Log everything to console
        console.log('=== TEST AUTH PAGE DEBUG INFO ===');
        console.log('SDK In Miniapp:', inApp);
        console.log('SDK Ready:', ready);
        console.log('SDK Context:', context);
        console.log('Window Location:', window.location.href);
        console.log('User Agent:', navigator.userAgent);
      } catch (e) {
        console.error('SDK check failed:', e);
        setSdkInfo({ error: e?.toString() });
      }
    };

    checkSDK();
  }, []);

  const testAuthenticatedFetch = async () => {
    try {
      console.log('Testing authenticatedFetch...');
      const response = await authenticatedFetch('/api/rituals/complete');
      const data = await response.json();
      console.log('authenticatedFetch result:', data);
      setFetchTest(data);
    } catch (e) {
      console.error('authenticatedFetch test failed:', e);
      setFetchTest({ error: e?.toString() });
    }
  };

  const testRitualLoad = async () => {
    try {
      console.log('Testing ritual load...');
      const url = wallet.address
        ? `/api/rituals/complete?wallet=${wallet.address}`
        : '/api/rituals/complete';

      const response = await authenticatedFetch(url);
      const data = await response.json();
      console.log('Ritual load result:', data);
      setRitualData(data);
    } catch (e) {
      console.error('Ritual load test failed:', e);
      setRitualData({ error: e?.toString() });
    }
  };

  const testVerifiedAddresses = async () => {
    try {
      console.log('Testing verified addresses fetch...');
      const response = await authenticatedFetch('/api/auth/verified-addresses');

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const data = await response.json();
      console.log('Verified addresses result:', data);
      setVerifiedAddresses(data);
    } catch (e) {
      console.error('Verified addresses test failed:', e);
      setVerifiedAddresses({ error: e?.toString() });
    }
  };

  const copyDebugInfo = () => {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      wallet: {
        address: wallet.address,
        isConnected: wallet.isConnected
      },
      bbAuth: {
        isAuthenticated: bbAuth.isAuthenticated,
        user: bbAuth.user,
        isInMiniapp: bbAuth.isInMiniapp
      },
      unifiedStore: {
        walletAddress: unifiedStore.walletAddress,
        farcasterConnected: unifiedStore.farcasterConnected,
        farcasterUsername: unifiedStore.farcasterUsername,
        farcasterFid: unifiedStore.farcasterFid
      },
      sdk: sdkInfo,
      fetchTest: fetchTest,
      ritualData: ritualData,
      verifiedAddresses: verifiedAddresses,
      browser: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        vendor: navigator.vendor,
        url: window.location.href
      },
      consoleLogs: consoleLogs // Include console logs
    };

    const debugText = JSON.stringify(debugInfo, null, 2);
    navigator.clipboard.writeText(debugText);
    alert('Debug info with console logs copied to clipboard!');
    console.log('=== FULL DEBUG INFO ===');
    console.log(debugInfo);
  };

  const forceDisconnect = async () => {
    console.log('🔴 Force disconnect initiated...');

    // Clear ALL localStorage items
    const keysToRemove = [
      'unified-auth-storage',
      'connected_wallet',
      'bb_session_token',
      'neynar_auth_token',
      'bizarreRitualsData',
      'walletconnect',
      'wagmi.store',
      'wagmi.cache',
      'wagmi.wallet',
      'wagmi.connected',
      'wagmi.connectedRdns'
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    // Also clear items that start with these prefixes
    const prefixesToClear = ['wagmi.', 'wc@2:', 'walletconnect'];
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (prefixesToClear.some(prefix => key.startsWith(prefix))) {
        localStorage.removeItem(key);
      }
    });

    // Clear session storage too
    sessionStorage.clear();

    // Reset all stores
    unifiedStore.reset();
    await bbAuth.logout();
    await wallet.disconnect();

    alert('Force disconnect complete! The page will now refresh.');
    window.location.reload();
  };

  return (
    <div className="min-h-screen px-2 py-3 max-w-full overflow-x-hidden">
      <h1 className="text-lg font-bold mb-3 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
        Auth Debug
      </h1>

      <div className="space-y-3">
        {/* Quick Status */}
        <div className="bg-gray-800/50 border border-gem-gold/30 rounded p-2">
          <h2 className="text-sm font-bold mb-2 text-gem-crystal">Status</h2>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div>Miniapp: {isInMiniapp ? '✅' : '❌'}</div>
            <div>Wallet: {wallet.address ? '✅' : '❌'}</div>
            <div>BB Auth: {bbAuth.isAuthenticated ? '✅' : '❌'}</div>
            <div>Farcaster: {unifiedStore.farcasterConnected ? '✅' : '❌'}</div>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="border border-gem-gold/30 rounded p-2">
          <h2 className="text-sm font-bold mb-2 text-gem-crystal">Tests</h2>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={testAuthenticatedFetch}
              className="px-2 py-1.5 text-xs bg-gem-gold text-black rounded"
            >
              Auth Fetch
            </button>
            <button
              onClick={testRitualLoad}
              className="px-2 py-1.5 text-xs bg-gem-crystal text-black rounded"
            >
              Rituals
            </button>
            <button
              onClick={testVerifiedAddresses}
              className="px-2 py-1.5 text-xs bg-purple-600 text-white rounded"
            >
              Addresses
            </button>
            <button
              onClick={copyDebugInfo}
              className="px-2 py-1.5 text-xs bg-gem-pink text-black rounded"
            >
              📋 Copy
            </button>
            <button
              onClick={forceDisconnect}
              className="px-2 py-1.5 text-xs bg-red-600 text-white rounded col-span-2"
              title="Clears ALL auth data and refreshes"
            >
              🔴 Force Reset
            </button>
          </div>
        </div>

        {/* Wallet Info */}
        <details className="border border-gem-gold/30 rounded">
          <summary className="p-2 text-sm font-bold text-gem-crystal cursor-pointer">
            Wallet
          </summary>
          <div className="p-2 pt-0">
            <pre className="text-xs overflow-x-auto bg-black/50 p-1 rounded whitespace-pre-wrap break-all">
              {JSON.stringify({
                address: wallet.address?.slice(0, 20) + '...',
                isConnected: wallet.isConnected
              }, null, 2)}
            </pre>
          </div>
        </details>

        {/* BB Auth Info */}
        <details className="border border-gem-gold/30 rounded">
          <summary className="p-2 text-sm font-bold text-gem-crystal cursor-pointer">
            BB Auth
          </summary>
          <div className="p-2 pt-0">
            <pre className="text-xs overflow-x-auto bg-black/50 p-1 rounded whitespace-pre-wrap break-all">
              {JSON.stringify({
                isAuthenticated: bbAuth.isAuthenticated,
                user: bbAuth.user ? { fid: bbAuth.user.fid, username: bbAuth.user.username } : null,
                isInMiniapp: bbAuth.isInMiniapp
              }, null, 2)}
            </pre>
          </div>
        </details>

        {/* Unified Store */}
        <details className="border border-gem-gold/30 rounded">
          <summary className="p-2 text-sm font-bold text-gem-crystal cursor-pointer">
            Unified Store
          </summary>
          <div className="p-2 pt-0">
            <pre className="text-xs overflow-x-auto bg-black/50 p-1 rounded whitespace-pre-wrap break-all">
              {JSON.stringify({
                walletAddress: unifiedStore.walletAddress?.slice(0, 20) + '...',
                farcasterConnected: unifiedStore.farcasterConnected,
                farcasterUsername: unifiedStore.farcasterUsername,
                farcasterFid: unifiedStore.farcasterFid
              }, null, 2)}
            </pre>
          </div>
        </details>

        {/* SDK Info */}
        <details className="border border-gem-gold/30 rounded">
          <summary className="p-2 text-sm font-bold text-gem-crystal cursor-pointer">
            SDK Info
          </summary>
          <div className="p-2 pt-0">
            <pre className="text-xs overflow-x-auto bg-black/50 p-1 rounded whitespace-pre-wrap break-all">
              {JSON.stringify(sdkInfo, null, 2)}
            </pre>
          </div>
        </details>

        {/* Test Results */}
        {fetchTest && (
          <details className="border border-gem-gold/30 rounded" open>
            <summary className="p-2 text-sm font-bold text-gem-crystal cursor-pointer">
              Auth Fetch Result
            </summary>
            <div className="p-2 pt-0">
              <pre className="text-xs overflow-x-auto bg-black/50 p-1 rounded whitespace-pre-wrap break-all">
                {JSON.stringify(fetchTest, null, 2)}
              </pre>
            </div>
          </details>
        )}

        {ritualData && (
          <details className="border border-gem-gold/30 rounded" open>
            <summary className="p-2 text-sm font-bold text-gem-crystal cursor-pointer">
              Ritual Result
            </summary>
            <div className="p-2 pt-0">
              <pre className="text-xs overflow-x-auto bg-black/50 p-1 rounded whitespace-pre-wrap break-all">
                {JSON.stringify(ritualData, null, 2)}
              </pre>
            </div>
          </details>
        )}

        {verifiedAddresses && (
          <details className="border border-gem-gold/30 rounded" open>
            <summary className="p-2 text-sm font-bold text-gem-crystal cursor-pointer">
              Addresses Result
            </summary>
            <div className="p-2 pt-0">
              <pre className="text-xs overflow-x-auto bg-black/50 p-1 rounded whitespace-pre-wrap break-all">
                {JSON.stringify(verifiedAddresses, null, 2)}
              </pre>
            </div>
          </details>
        )}

        {/* Console Logs */}
        <details className="border border-gem-crystal/30 rounded" open>
          <summary className="p-2 text-sm font-bold text-gem-crystal cursor-pointer">
            📜 Console Logs ({consoleLogs.length})
          </summary>
          <div className="p-2 pt-0">
            <div className="bg-black/50 rounded p-2 max-h-48 overflow-y-auto">
              {consoleLogs.length > 0 ? (
                <div className="space-y-1">
                  {consoleLogs.map((log, i) => (
                    <div
                      key={i}
                      className={`text-xs font-mono ${
                        log.startsWith('[ERROR]')
                          ? 'text-red-400'
                          : log.startsWith('[WARN]')
                          ? 'text-yellow-400'
                          : log.includes('✅')
                          ? 'text-green-400'
                          : log.includes('❌')
                          ? 'text-red-400'
                          : 'text-gray-300'
                      }`}
                    >
                      {log}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-500">No relevant logs yet...</div>
              )}
            </div>
            <button
              onClick={() => setConsoleLogs([])}
              className="mt-2 px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
            >
              Clear Logs
            </button>
          </div>
        </details>

        {/* Instructions */}
        <div className="border border-gray-600 rounded p-2 text-xs text-gray-300">
          <p className="font-bold text-gem-gold mb-1">📱 Instructions:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-xs">
            <li>Tap test buttons</li>
            <li>Tap "Copy" to share</li>
            <li>Send to developer</li>
          </ol>
          <p className="mt-2 text-yellow-400 text-xs">
            ⚠️ Console logs now visible above!
          </p>
        </div>
      </div>
    </div>
  );
}

// Error boundary wrapper
export default function TestAuthPage() {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Catch any errors during render
    const handleError = (event: ErrorEvent) => {
      console.error('[TestAuth] Page error:', event.error);
      setHasError(true);
      setErrorMessage(event.error?.message || 'Unknown error');
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-dark-bg p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Error in Test Auth Page</h1>
            <p className="text-gray-300 mb-2">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  try {
    return <TestAuthPageContent />;
  } catch (error) {
    console.error('[TestAuth] Render error:', error);
    return (
      <div className="min-h-screen bg-dark-bg p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-yellow-500 mb-4">Test Auth Page Error</h1>
            <p className="text-gray-300">Failed to render test auth page. Check console for details.</p>
          </div>
        </div>
      </div>
    );
  }
}