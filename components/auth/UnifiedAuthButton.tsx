'use client';

import React, { useState, useEffect } from 'react';
import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';
import { useNeynarContext, NeynarAuthButton } from '@neynar/react';
import { useWallet } from '@/hooks/useWallet';
import { Wallet, Users, Link2, LogOut, RefreshCw, ChevronDown, Crown, User } from 'lucide-react';
import { AccessTier } from '@/lib/empire';
import { empireService } from '@/lib/empire';
import {
  isInFarcasterMiniapp,
  checkIsInFarcasterMiniapp,
  shouldAutoLoginWithFarcaster,
  getFarcasterDataFromUrl,
  listenToFarcasterMessages,
  initializeFarcasterSDK
} from '@/lib/farcaster-miniapp';
import { FEATURE_FLAGS } from '@/config/features';

export function UnifiedAuthButton() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isFarcasterCheckComplete, setIsFarcasterCheckComplete] = useState(false);
  const [isInMiniapp, setIsInMiniapp] = useState(false);

  // Get Neynar context
  const neynarContext = useNeynarContext();
  const farcasterUser = neynarContext.user;

  // Get wallet state from existing hook
  const wallet = useWallet();

  // Get unified auth store
  const {
    userId,
    walletAddress,
    walletConnected,
    farcasterFid,
    farcasterConnected,
    farcasterUsername,
    farcasterDisplayName,
    farcasterPfpUrl,
    identitiesLinked,
    connectWallet: storeConnectWallet,
    connectFarcaster: storeConnectFarcaster,
    linkIdentities,
    disconnect: unifiedDisconnect,
    refreshProfile,
    isLoading
  } = useUnifiedAuthStore();

  // Sync Farcaster user with unified store - DISABLED
  // This is now handled by NeynarAuthIntegration component to avoid conflicts
  // useEffect(() => {
  //   if (farcasterUser) {
  //     // Real Farcaster user connected via Neynar
  //     storeConnectFarcaster({
  //       fid: farcasterUser.fid,
  //       username: farcasterUser.username,
  //       display_name: farcasterUser.display_name,
  //       displayName: farcasterUser.display_name,
  //       pfp_url: farcasterUser.pfp_url,
  //       pfpUrl: farcasterUser.pfp_url,
  //       bio: farcasterUser.profile?.bio?.text || '',
  //       verified_addresses: farcasterUser.verified_addresses || {},
  //       verifiedAddresses: farcasterUser.verified_addresses?.eth_addresses || []
  //     });
  //   }
  // }, [farcasterUser, storeConnectFarcaster]);

  // Detect miniapp context and handle auto-login
  useEffect(() => {
    console.log('🎯 UnifiedAuthButton useEffect started');
    const checkMiniappAuth = async () => {
      // Properly check if in miniapp using async function
      const inMiniapp = await checkIsInFarcasterMiniapp();
      setIsInMiniapp(inMiniapp);
      const shouldAutoLogin = await shouldAutoLoginWithFarcaster();
      console.log('🎯 Miniapp Detection:', {
        inMiniapp,
        shouldAutoLogin,
        farcasterConnected
      });

      // Initialize SDK if in miniapp
      if (inMiniapp) {
        const context = await initializeFarcasterSDK();
        console.log('📱 Farcaster SDK context:', context);
        console.log('📱 Current farcasterConnected state:', farcasterConnected);
        console.log('📱 Condition check - context?.user:', !!context?.user, '!farcasterConnected:', !farcasterConnected);

        // If we have user data from SDK, sync it
        if (context?.user && !farcasterConnected) {
          const userData = context.user;
          console.log('📱 Auto-connecting with Farcaster SDK user:', userData);

          // Connect with SDK user data
          const userDataWithAddresses = userData as any;
          // Use username as the display name if displayName is "Testuser" or not meaningful
          const actualDisplayName = (userData.displayName && userData.displayName !== 'Testuser')
            ? userData.displayName
            : userData.username || 'Anon';

          console.log('📱 Calling storeConnectFarcaster with:', {
            fid: userData.fid,
            username: userData.username,
            display_name: actualDisplayName,
            displayName: actualDisplayName,
            pfp_url: userData.pfpUrl,
            pfpUrl: userData.pfpUrl,
            bio: userDataWithAddresses.profile?.bio || '',
            verified_addresses: userDataWithAddresses.verifiedAddresses || {},
            verifiedAddresses: userDataWithAddresses.verifiedAddresses?.ethereum || []
          });

          storeConnectFarcaster({
            fid: userData.fid,
            username: userData.username,
            display_name: actualDisplayName,
            displayName: actualDisplayName,
            pfp_url: userData.pfpUrl,
            pfpUrl: userData.pfpUrl,
            bio: userDataWithAddresses.profile?.bio || '',
            verified_addresses: userDataWithAddresses.verifiedAddresses || {},
            verifiedAddresses: userDataWithAddresses.verifiedAddresses?.ethereum || []
          });

          console.log('📱 storeConnectFarcaster called successfully');

          // Try to get wallet from Farcaster SDK
          try {
            const sdk = await import('@farcaster/miniapp-sdk');
            const provider = await sdk.wallet.getEthereumProvider();

            if (provider) {
              console.log('📱 Got Ethereum provider from Farcaster SDK');
              // Request accounts
              const accounts = await provider.request({ method: 'eth_requestAccounts' });

              if (accounts && accounts[0]) {
                console.log('📱 Got wallet address from Farcaster SDK:', accounts[0]);
                await storeConnectWallet(accounts[0]);
              }
            }
          } catch (walletError) {
            console.log('📱 Could not get wallet from SDK:', walletError);

            // Fallback to verified addresses if available
            if (userDataWithAddresses.verifiedAddresses?.ethereum?.[0]) {
              console.log('📱 Using verified address:', userDataWithAddresses.verifiedAddresses.ethereum[0]);
              storeConnectWallet(userDataWithAddresses.verifiedAddresses.ethereum[0]);
            } else {
              console.log('📱 No wallet available');
            }
          }
        } else {
          console.log('📱 Skipping auto-connect because:', {
            hasUser: !!context?.user,
            alreadyConnected: farcasterConnected
          });
        }
      } else {
        // Check if we should auto-login with URL data
        const shouldAutoLogin = await shouldAutoLoginWithFarcaster();
        if (shouldAutoLogin && !farcasterConnected) {
          // Not in miniapp but have URL data
          const urlData = await getFarcasterDataFromUrl();
          console.log('📱 Auto-login with Farcaster URL data:', urlData);

          if (urlData?.fid) {
            setShowAuthModal(true);
          }
        }
      }
    };

    checkMiniappAuth().finally(() => {
      // Mark Farcaster check as complete regardless of outcome
      setIsFarcasterCheckComplete(true);
    });

    // Listen for messages from Farcaster parent (fallback for non-SDK)
    const setupMessageListener = async () => {
      const cleanup = await listenToFarcasterMessages((data) => {
        if (data.type === 'fc:frame:wallet_response' && data.data?.address) {
          console.log('📱 Received wallet from Farcaster:', data.data.address);
          storeConnectWallet(data.data.address);
        }
      });
      return cleanup;
    };

    const cleanupPromise = setupMessageListener();
    return () => {
      cleanupPromise.then(cleanup => cleanup());
    };
  }, [farcasterConnected, storeConnectWallet, storeConnectFarcaster]);

  // Sync wallet with unified store (skip in miniapp if using Farcaster wallet)
  useEffect(() => {
    const syncWallet = async () => {
      const inMiniapp = await checkIsInFarcasterMiniapp();
      if (!inMiniapp && wallet.isConnected && wallet.address && !walletConnected) {
        storeConnectWallet(wallet.address);
      }
    };
    syncWallet();
  }, [wallet.isConnected, wallet.address, walletConnected, storeConnectWallet]);

  // Handle wallet connection
  const handleWalletConnect = async () => {
    const inMiniapp = await checkIsInFarcasterMiniapp();

    if (inMiniapp) {
      console.log('📱 In miniapp - trying to get wallet from Farcaster SDK');

      try {
        const sdk = await import('@farcaster/miniapp-sdk');
        const provider = await sdk.wallet.getEthereumProvider();

        if (provider) {
          console.log('📱 Got Ethereum provider from Farcaster SDK');
          // Request accounts
          const accounts = await provider.request({ method: 'eth_requestAccounts' });

          if (accounts && accounts[0]) {
            console.log('📱 Connecting wallet from Farcaster SDK:', accounts[0]);
            await storeConnectWallet(accounts[0]);
            return;
          }
        }
      } catch (error) {
        console.error('📱 Could not get wallet from Farcaster SDK:', error);
      }

      // Fallback to showing auth modal
      setShowAuthModal(true);
    } else {
      // Regular wallet connect flow
      await wallet.connect();
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    if (wallet.isConnected) {
      await wallet.disconnect();
    }
    // Note: Neynar doesn't provide a logout method in the context
    // The user will need to disconnect through the Neynar button
    unifiedDisconnect();
    setIsDropdownOpen(false);
    // Force reload to clear Neynar session
    if (farcasterUser) {
      window.location.reload();
    }
  };

  // Loading state - include Farcaster check
  if (wallet.isInitializing || isLoading || !isFarcasterCheckComplete) {
    return (
      <button
        disabled
        className="flex items-center gap-1 px-2 py-1 text-xs bg-dark-card border border-gray-700 text-gray-400 rounded cursor-not-allowed"
      >
        <div className="animate-spin">
          <RefreshCw className="w-3 h-3" />
        </div>
        <span className="hidden sm:inline">Loading...</span>
      </button>
    );
  }

  // Use state-based miniapp detection (set async in useEffect)

  // Not connected state
  if (!walletConnected && !farcasterConnected) {
    return (
      <>
        <button
          onClick={() => setShowAuthModal(true)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-black font-semibold rounded hover:opacity-90 transition-all duration-300"
        >
          <Wallet className="w-3 h-3" />
          <span>{isInMiniapp ? 'Sign In' : 'Connect'}</span>
        </button>

        {/* Auth Modal - Farcaster Primary */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-6 max-w-sm w-full mx-4">
              <h2 className="text-xl font-bold text-white mb-4">
                {isInMiniapp ? 'Sign in with Farcaster' : 'Connect to BizarreBeasts'}
              </h2>

              {isInMiniapp && (
                <p className="text-sm text-gem-crystal mb-4">
                  📱 Farcaster miniapp detected - Sign in to continue
                </p>
              )}

              <div className="space-y-3">
                <NeynarAuthButton
                  className="w-full"
                />

                {!isInMiniapp && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-700" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-dark-card px-2 text-gray-400">or</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        handleWalletConnect();
                        setShowAuthModal(false);
                      }}
                      className="w-full px-4 py-3 bg-gray-800 text-gray-300 border border-gray-700 rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2"
                    >
                      <Wallet className="w-4 h-4" />
                      Connect Wallet Manually
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setShowAuthModal(false)}
                className="mt-4 w-full text-xs text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Connected state - build display
  const displayName = farcasterUsername || (walletAddress ? `${walletAddress.slice(0, 4)}...` : 'Connected');

  return (
    <>
      <div className="relative group">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="relative flex items-center gap-1 px-3 py-1.5 text-xs bg-dark-card rounded transition-all duration-300 hover:opacity-90 overflow-hidden"
        >
          {/* Gradient border effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink rounded" />
          <div className="absolute inset-[1px] bg-dark-card rounded" />

          {/* Content */}
          <div className="relative flex items-center gap-2">
            {/* Profile pic if Farcaster connected */}
            {farcasterPfpUrl && (
              <img
                src={farcasterPfpUrl}
                alt="Profile"
                className="w-4 h-4 rounded-full"
              />
            )}

            {/* Display name with gradient */}
            <span className="bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent font-semibold">
              {displayName}
            </span>

            {/* Link icon if identities linked */}
            {identitiesLinked && (
              <Link2 className="w-3 h-3 text-gem-gold" />
            )}

            <ChevronDown className="w-3 h-3 text-gem-crystal" />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-dark-card border border-gem-crystal/20 rounded-lg shadow-lg z-50">
            {/* Identity Section */}
            <div className="p-4 border-b border-gray-700">
              <div className="space-y-3">
                {/* Wallet Section */}
                {walletConnected ? (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">
                      {wallet.isViaFarcaster ? 'Verified Wallet' : 'Wallet'}
                    </p>
                    <p className="text-white font-mono text-xs break-all">{walletAddress}</p>
                    {wallet.isViaFarcaster && (
                      <p className="text-xs text-gem-crystal mt-1">✓ Connected via Farcaster</p>
                    )}
                    {wallet.empireRank && (
                      <div className="flex items-center gap-2 mt-1">
                        <Crown className="w-3 h-3 text-gem-gold" />
                        <span className="text-xs text-gem-gold">
                          Rank #{wallet.empireRank} • {wallet.empireTier}
                        </span>
                      </div>
                    )}
                  </div>
                ) : !farcasterConnected ? (
                  <button
                    onClick={handleWalletConnect}
                    className="w-full px-3 py-2 text-xs bg-gradient-to-r from-gem-crystal/20 to-gem-gold/20 text-gem-crystal border border-gem-crystal/30 rounded hover:opacity-80 transition"
                  >
                    <Wallet className="w-3 h-3 inline mr-2" />
                    Connect Wallet
                  </button>
                ) : null}

                {/* Farcaster Section */}
                {farcasterConnected ? (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Farcaster</p>
                    <div className="flex items-center gap-2">
                      {farcasterPfpUrl && (
                        <img src={farcasterPfpUrl} alt="" className="w-6 h-6 rounded-full" />
                      )}
                      <div>
                        <p className="text-white text-xs font-semibold">{farcasterDisplayName}</p>
                        <p className="text-gray-400 text-xs">@{farcasterUsername} • FID: {farcasterFid}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full">
                    <NeynarAuthButton
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {/* Status Messages */}
              {wallet.isViaFarcaster && (
                <div className="mt-3 px-2 py-1 bg-gem-crystal/10 rounded text-center">
                  <span className="text-xs text-gem-crystal">✓ Using Farcaster verified wallet</span>
                </div>
              )}

              {walletConnected && farcasterConnected && !wallet.isViaFarcaster && (
                <div className="mt-3 px-2 py-1 bg-yellow-500/10 rounded text-center">
                  <span className="text-xs text-yellow-500">⚠️ Manual wallet differs from Farcaster</span>
                </div>
              )}
            </div>

            {/* Empire Benefits Section */}
            {wallet.empireTier && wallet.empireTier !== AccessTier.NORMIE && (
              <div className="p-4 border-b border-gray-700">
                <p className="text-xs text-gray-400 mb-2">Empire Benefits</p>
                <ul className="text-xs text-gray-300 space-y-1">
                  {empireService.getTierBenefits(wallet.empireTier).slice(0, 3).map((benefit, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-gem-crystal">•</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="p-2 space-y-1">
              {(walletConnected || farcasterConnected) && FEATURE_FLAGS.ENABLE_PUBLIC_PROFILES && (
                <a
                  href="/profile"
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gem-gold hover:bg-gray-700 rounded transition"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <User className="w-4 h-4" />
                  View Profile
                </a>
              )}

              <button
                onClick={() => {
                  refreshProfile();
                  wallet.refreshEmpireData();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded transition"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Data
              </button>

              <button
                onClick={handleDisconnect}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700 rounded transition"
              >
                <LogOut className="w-4 h-4" />
                Disconnect All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal - Farcaster Primary (when fully disconnected) */}
      {showAuthModal && !walletConnected && !farcasterConnected && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-xl font-bold text-white mb-4">Connect to BizarreBeasts</h2>

            <p className="text-sm text-gray-400 mb-4">
              Sign in with Farcaster to automatically use your verified wallet
            </p>

            <div className="space-y-3">
              <NeynarAuthButton
                className="w-full"
              />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-dark-card px-2 text-gray-400">or</span>
                </div>
              </div>

              <button
                onClick={() => {
                  handleWalletConnect();
                  setShowAuthModal(false);
                }}
                className="w-full px-4 py-3 bg-gray-800 text-gray-300 border border-gray-700 rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet Manually
              </button>
            </div>

            <button
              onClick={() => setShowAuthModal(false)}
              className="mt-4 w-full text-xs text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}