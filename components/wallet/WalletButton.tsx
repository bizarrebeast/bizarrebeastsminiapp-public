'use client';

import React from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Wallet, Crown, LogOut, RefreshCw } from 'lucide-react';
import { AccessTier } from '@/lib/empire';
import { empireService } from '@/lib/empire';

export function WalletButton() {
  const { 
    isConnected, 
    address, 
    empireRank, 
    empireScore,
    empireTier, 
    connect, 
    disconnect,
    refreshEmpireData,
    formatAddress,
    isInitializing 
  } = useWallet();

  const getTierColor = () => {
    // Always use site gradient colors when connected
    return 'from-gem-crystal via-gem-gold to-gem-pink';
  };

  const getTierBadge = () => {
    switch(empireTier) {
      case AccessTier.BIZARRE:
        return '👑';
      case AccessTier.WEIRDO:
        return '🏆';
      case AccessTier.ODDBALL:
        return '⭐';
      case AccessTier.MISFIT:
        return '✨';
      default:
        return '';
    }
  };

  if (isInitializing) {
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

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-black font-semibold rounded hover:opacity-90 transition-all duration-300"
      >
        <Wallet className="w-3 h-3" />
        <span>Connect</span>
      </button>
    );
  }

  return (
    <div className="relative group">
      <button
        className="relative flex items-center gap-1 px-3 py-1.5 text-xs bg-dark-card rounded transition-all duration-300 hover:opacity-90 overflow-hidden"
      >
        {/* Gradient border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink rounded" />
        <div className="absolute inset-[1px] bg-dark-card rounded" />
        
        {/* Content */}
        <div className="relative flex items-center gap-1 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent font-semibold">
          {empireRank && (
            <>
              <span className="text-sm">{getTierBadge()}</span>
              <span className="font-semibold">#{empireRank}</span>
              <span className="hidden lg:inline opacity-75 mx-1">|</span>
            </>
          )}
          <span className="hidden lg:inline">
            {formatAddress(address!)}
          </span>
          <span className="lg:hidden">
            {address?.slice(0, 4)}...
          </span>
        </div>
      </button>

      {/* Dropdown Menu */}
      <div className="absolute right-0 mt-2 w-80 bg-dark-card border border-gem-crystal/20 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
        <div className="p-4 border-b border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Connected Wallet</p>
          <p className="text-white font-mono text-xs break-all">{address}</p>
          
          {empireRank && (
            <>
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Empire Rank</span>
                  <span className="text-white font-bold">#{empireRank}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400">Score</span>
                  <span className="text-white text-xs">{empireService.formatScore(empireScore || '0')}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400">Tier</span>
                  <span className={`text-xs font-semibold uppercase ${
                    empireTier === AccessTier.BIZARRE ? 'text-gem-gold' :
                    empireTier === AccessTier.WEIRDO ? 'text-gem-purple' :
                    empireTier === AccessTier.ODDBALL ? 'text-gem-blue' :
                    empireTier === AccessTier.MISFIT ? 'text-gem-crystal' :
                    'text-gray-400'
                  }`}>
                    {empireTier}
                  </span>
                </div>
              </div>

              {/* Tier Benefits */}
              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-400 mb-2">Your Benefits</p>
                <ul className="text-xs text-gray-300 space-y-1">
                  {empireService.getTierBenefits(empireTier!).slice(0, 3).map((benefit, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-gem-crystal">•</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {!empireRank && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-400">Not ranked in Empire</p>
              <p className="text-xs text-gray-500 mt-1">
                Hold $BB tokens to join the leaderboard
              </p>
            </div>
          )}
        </div>

        <div className="p-2 space-y-1">
          <button
            onClick={refreshEmpireData}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Empire Data
          </button>
          
          <button
            onClick={disconnect}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700 rounded transition"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}