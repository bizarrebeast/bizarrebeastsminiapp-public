'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Info, ArrowDownUp, ExternalLink, Copy, Check, BarChart3, ChevronDown, ChevronUp, Lightbulb, Monitor, Smartphone } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useFarcaster } from '@/contexts/FarcasterContext';

// BB Token on Base
const BB_TOKEN = {
  address: '0x0520bf1d3cEE163407aDA79109333aB1599b4004',
  chainId: 8453, // Base
  decimals: 18,
  name: 'BizarreBeasts',
  symbol: 'BB',
};

export default function SwapPage() {
  const { address } = useWallet();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const { isInFarcaster } = useFarcaster();
  const [showInstructions, setShowInstructions] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if user is on mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(BB_TOKEN.address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Create Uniswap widget URL with BB token pre-selected
  const uniswapUrl = `https://app.uniswap.org/swap?outputCurrency=${BB_TOKEN.address}&chain=base`;
  const uniswapWidgetUrl = `https://app.uniswap.org/swap?outputCurrency=${BB_TOKEN.address}&chain=base&theme=dark`;
  
  // DexScreener chart URL for BB token
  const dexScreenerUrl = 'https://dexscreener.com/base/0x49e35c372ee285d22a774f8a415f8bf3ad6456c2';

  return (
    <div className="min-h-[calc(100vh-64px)] bg-dark-bg overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 py-8 overflow-x-hidden">
        {/* Header */}
        <div className="mb-8 flex justify-center">
          <img 
            src="/assets/page-assets/banners/token-swap-bb-chart-banner.png" 
            alt="Token Swap - Swap any token on Base. Default output is $BB token."
            className="w-full max-w-4xl object-contain rounded-2xl"
          />
        </div>
        
        {/* Description */}
        <p className="text-lg text-gray-300 mb-8 max-w-4xl mx-auto px-4 text-center">
          Track $BB token performance and swap tokens directly in the app! View real-time price charts, trading volume, and market data for BizarreBeasts ($BB) token. Seamlessly swap $BB or any token with built-in Uniswap integration.
        </p>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-[1fr_350px] gap-6">
          {/* Left Column - Swap and Chart */}
          <div className="order-2 lg:order-1 space-y-6">
          {/* Swap Widget Container */}
          <div className="bg-dark-card border border-gem-crystal/20 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Uniswap Interface</h2>
                  <p className="text-sm text-gray-400">Powered by Uniswap on Base Network</p>
                </div>
                <a
                  href={uniswapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    // For Farcaster desktop, ensure it opens in new browser tab
                    if (isInFarcaster && !isMobile) {
                      e.preventDefault();
                      window.open(uniswapUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="text-gem-crystal hover:text-gem-gold transition-colors flex items-center gap-1 text-sm"
                >
                  Open in new tab
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            
            {/* Uniswap Interface - Mobile vs Desktop */}
            {isMobile ? (
              // Mobile Experience - Better UX for Farcaster users
              <div className="p-6 bg-gradient-to-b from-gray-800/50 to-gray-900/50">
                <div className="space-y-6">
                  <div className="text-center space-y-3">
                    <div className="flex justify-center mb-4">
                      <div className="relative">
                        <ArrowDownUp className="w-16 h-16 text-gem-gold" />
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white">Swap $BB Tokens</h3>
                    <p className="text-gray-400">
                      Trade BizarreBeasts tokens on Uniswap
                    </p>
                  </div>

                  {/* Primary CTA - Open Uniswap */}
                  <a
                    href={uniswapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      // For Farcaster, ensure it opens in new browser tab
                      if (isInFarcaster) {
                        e.preventDefault();
                        window.open(uniswapUrl, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    className="block w-full"
                  >
                    <button className="w-full px-6 py-4 bg-gradient-to-r from-gem-gold via-gem-crystal to-gem-pink text-dark-bg font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-lg">
                      <ArrowDownUp className="w-6 h-6" />
                      Open Uniswap to Swap
                      <ExternalLink className="w-5 h-5" />
                    </button>
                  </a>

                  {/* Mobile Tips */}
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gem-crystal/20">
                    <div className="flex items-center gap-2 text-gem-crystal mb-3">
                      <Smartphone className="w-5 h-5" />
                      <span className="font-semibold">Mobile Trading</span>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <span className="text-gem-gold mt-0.5">✓</span>
                        <span>$BB is pre-selected as output token</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gem-gold mt-0.5">✓</span>
                        <span>Connect your wallet in Uniswap</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gem-gold mt-0.5">✓</span>
                        <span>View live charts below</span>
                      </li>
                    </ul>
                  </div>

                  {/* Navigation Help */}
                  <div className="text-center text-sm text-gray-500">
                    <p>Swipe back or use your browser's back button to return</p>
                  </div>
                </div>
              </div>
            ) : (
              // Desktop Iframe
              <div className="w-full overflow-x-auto overflow-y-hidden">
                <iframe
                  src={uniswapUrl}
                  className="w-full border-0"
                  style={{ height: '600px', minWidth: '100%' }}
                  title="Uniswap Swap Interface"
                  allow="clipboard-read; clipboard-write"
                />
              </div>
            )}
          </div>
          
          {/* Chart Widget */}
          <div className="bg-dark-card border border-gem-crystal/20 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-gem-gold" />
                    $BB Price Chart
                  </h2>
                  <p className="text-sm text-gray-400">Live price data from DexScreener</p>
                </div>
                <a
                  href={dexScreenerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gem-crystal hover:text-gem-gold transition-colors flex items-center gap-1 text-sm"
                >
                  View on DexScreener
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            
            {/* DexScreener Embed - Responsive */}
            <div className="w-full overflow-x-auto overflow-y-hidden">
              <iframe
                src={`${dexScreenerUrl}?embed=1&theme=dark&trades=0&info=0`}
                className="w-full border-0"
                style={{ height: '600px', minWidth: '100%' }}
                title="BB Token Chart"
              />
            </div>
          </div>
        </div>

          {/* Sidebar - Shows first on mobile, stays right on desktop */}
          <div className="order-1 lg:order-2 space-y-6">
            {/* BB Token Info */}
            <div className="bg-dark-card border border-gem-gold/20 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="/assets/page-assets/logos/bb-token.png" 
                  alt="$BB Token" 
                  className="w-10 h-10 object-contain"
                />
                <div>
                  <h3 className="text-lg font-semibold text-white">BizarreBeasts</h3>
                  <p className="text-sm text-gray-400">$BB Token</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Contract Address:</p>
                  <div className="flex items-start gap-2">
                    <code className="text-xs font-mono text-gem-crystal bg-gray-800 px-2 py-1 rounded flex-1 break-all">
                      {BB_TOKEN.address}
                    </code>
                    <button
                      onClick={handleCopyAddress}
                      className="p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                    >
                      {copiedAddress ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Network:</span>
                  <span className="text-white">Base</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Decimals:</span>
                  <span className="text-white">18</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700 space-y-2">
                <a
                  href={`https://basescan.org/token/${BB_TOKEN.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gray-700/50 hover:bg-gray-700 text-gray-300 py-1.5 rounded text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  View on BaseScan
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={dexScreenerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gray-700/50 hover:bg-gray-700 text-gray-300 py-1.5 rounded text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  View Charts on DexScreener
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Instructions - Collapsible */}
            <div className="bg-gray-800/50 rounded-lg border border-gray-700">
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-700/30 transition-colors"
              >
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Info className="w-4 h-4 text-gem-crystal" />
                  How to Swap
                </h4>
                {showInstructions ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {showInstructions && (
                <div className="px-4 pb-4 border-t border-gray-700">
                  <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside mt-3">
                    <li>Connect your wallet in the Uniswap interface</li>
                    <li>Select the token you want to swap from</li>
                    <li>$BB is pre-selected as the output token</li>
                    <li>Enter the amount and review the rate</li>
                    <li>Click Swap and confirm in your wallet</li>
                  </ol>
                </div>
              )}
            </div>

            {/* Tips - Collapsible */}
            <div className="bg-gray-800/50 rounded-lg border border-gray-700">
              <button
                onClick={() => setShowTips(!showTips)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-700/30 transition-colors"
              >
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-gem-gold" />
                  Pro Tips
                </h4>
                {showTips ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {showTips && (
                <div className="px-4 pb-4 border-t border-gray-700">
                  <ul className="text-xs text-gray-400 space-y-1 mt-3">
                    <li>• Check slippage settings for volatile tokens</li>
                    <li>• Large swaps may have price impact</li>
                    <li>• Always verify token addresses</li>
                    <li>• Keep some ETH for gas fees</li>
                    <li>• Use limit orders for better rates</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}