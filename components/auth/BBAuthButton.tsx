/**
 * BB Auth Button Component
 * Uses the new BB Auth system with Farcaster SDK
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useBBAuth } from '@/hooks/useBBAuth';
import { Wallet, Users, Link2, LogOut, RefreshCw, ChevronDown, Crown, User, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

export function BBAuthButton() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const auth = useBBAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // Handle sign in
  const handleSignIn = async () => {
    const success = await auth.login();
    if (!success && !auth.isInMiniapp) {
      // For web context, Neynar auth will redirect
      console.log('Redirecting to Neynar auth...');
    }
  };

  // Handle wallet connection
  const handleConnectWallet = async () => {
    const wallet = await auth.connectWallet();
    if (wallet) {
      console.log('Wallet connected:', wallet);
    }
  };

  // Loading state
  if (!auth.isInitialized || auth.isLoading) {
    return (
      <button
        disabled
        className="flex items-center gap-1 px-2 py-1 text-xs bg-dark-card border border-gray-700 text-gray-400 rounded cursor-not-allowed"
      >
        <RefreshCw className="w-3 h-3 animate-spin" />
        <span className="hidden sm:inline">Loading...</span>
      </button>
    );
  }

  // Timeout state with retry
  if (auth.hasTimedOut) {
    return (
      <button
        onClick={auth.retry}
        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-yellow-500/20 border border-yellow-500 text-yellow-400 font-semibold rounded hover:bg-yellow-500/30 transition-all duration-300"
      >
        <AlertCircle className="w-3 h-3" />
        <span>Retry Auth</span>
      </button>
    );
  }

  // Not authenticated
  if (!auth.isAuthenticated) {
    return (
      <button
        onClick={handleSignIn}
        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-black font-semibold rounded hover:opacity-90 transition-all duration-300"
      >
        <Wallet className="w-3 h-3" />
        <span>{auth.isInMiniapp ? 'Sign In' : 'Connect'}</span>
      </button>
    );
  }

  // Authenticated - build display
  const displayName = auth.user?.username || (auth.wallet ? `${auth.wallet.slice(0, 4)}...` : 'Connected');

  return (
    <div className="relative group" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="relative flex items-center gap-1 px-3 py-1.5 text-xs bg-dark-card rounded transition-all duration-300 hover:opacity-90 overflow-hidden"
      >
        {/* Gradient border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink rounded" />
        <div className="absolute inset-[2px] bg-dark-card rounded" />

        {/* Content */}
        <div className="relative flex items-center gap-2">
          {/* Profile pic if available */}
          {auth.user?.pfpUrl && (
            <img
              src={auth.user.pfpUrl}
              alt="Profile"
              className="w-4 h-4 rounded-full"
            />
          )}

          {/* Display name with gradient */}
          <span className="bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent font-semibold">
            {displayName}
          </span>

          {/* Verified wallet indicator */}
          {auth.isWalletVerified && (
            <span title="Verified wallet">
              <Link2 className="w-3 h-3 text-gem-gold" />
            </span>
          )}

          <ChevronDown className="w-3 h-3 text-gem-crystal" />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-dark-card border border-gem-crystal/20 rounded-lg shadow-lg z-50">
          {/* User Info Section */}
          <div className="p-4 border-b border-gray-700">
            <div className="space-y-3">
              {/* Farcaster Info */}
              {auth.user && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Farcaster</p>
                  <div className="flex items-center gap-2">
                    {auth.user.pfpUrl && (
                      <img src={auth.user.pfpUrl} alt="" className="w-6 h-6 rounded-full" />
                    )}
                    <div>
                      <p className="text-white text-xs font-semibold">{auth.user.displayName}</p>
                      <p className="text-gray-400 text-xs">@{auth.user.username} • FID: {auth.user.fid}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Wallet Section */}
              {auth.wallet ? (
                <div>
                  <p className="text-xs text-gray-400 mb-1">
                    Wallet {auth.isWalletVerified && '✓ Verified'}
                  </p>
                  <p className="text-white font-mono text-xs break-all">{auth.wallet}</p>
                  {auth.isWalletVerified && (
                    <p className="text-xs text-gem-crystal mt-1">Connected via Farcaster</p>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleConnectWallet}
                  className="w-full px-3 py-2 text-xs bg-gradient-to-r from-gem-crystal/20 to-gem-gold/20 text-gem-crystal border border-gem-crystal/30 rounded hover:opacity-80 transition"
                >
                  <Wallet className="w-3 h-3 inline mr-2" />
                  Connect Wallet
                </button>
              )}
            </div>

            {/* Status Messages */}
            {auth.isInMiniapp && (
              <div className="mt-3 px-2 py-1 bg-gem-crystal/10 rounded text-center">
                <span className="text-xs text-gem-crystal">📱 Connected via Farcaster</span>
              </div>
            )}

            {auth.error && (
              <div className="mt-3 px-2 py-1 bg-red-500/10 rounded">
                <span className="text-xs text-red-400">{auth.error}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-2 space-y-1">
            <button
              onClick={auth.refresh}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>

            {!auth.wallet && auth.isAuthenticated && (
              <button
                onClick={handleConnectWallet}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gem-crystal hover:bg-gray-700 rounded transition"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
            )}

            <button
              onClick={auth.logout}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700 rounded transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          {/* Debug Info (temporary) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="p-2 border-t border-gray-700 text-xs text-gray-500">
              <div>Context: {auth.isInMiniapp ? 'Miniapp' : 'Web'}</div>
              <div>Retry Count: {auth.retryCount}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}