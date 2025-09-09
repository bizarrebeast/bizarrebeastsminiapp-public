'use client';

import React, { useState } from 'react';
import { TrendingUp, Info, ArrowDownUp, ExternalLink, Copy, Check, BarChart3, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

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
  const [showInstructions, setShowInstructions] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(BB_TOKEN.address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Create Uniswap interface URL with BB token pre-selected
  const uniswapUrl = `https://app.uniswap.org/swap?outputCurrency=${BB_TOKEN.address}&chain=base`;
  
  // DexScreener chart URL for BB token
  const dexScreenerUrl = 'https://dexscreener.com/base/0x49e35c372ee285d22a774f8a415f8bf3ad6456c2';

  return (
    <div className="min-h-[calc(100vh-64px)] bg-dark-bg">
      <div className="max-w-7xl mx-auto px-4 py-8">
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
          <div className="bg-dark-card border border-gem-crystal/20 rounded-lg overflow-hidden w-full max-w-full">
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
                  className="text-gem-crystal hover:text-gem-gold transition-colors flex items-center gap-1 text-sm"
                >
                  Open in new tab
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            
            {/* Uniswap Iframe */}
            <div className="w-full overflow-x-auto">
              <iframe
                src={uniswapUrl}
                className="w-full min-w-[320px] h-[600px] border-0"
                title="Uniswap Swap Interface"
                allow="clipboard-read; clipboard-write"
              />
            </div>
          </div>
          
          {/* Chart Widget */}
          <div className="bg-dark-card border border-gem-crystal/20 rounded-lg overflow-hidden w-full max-w-full">
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
            
            {/* DexScreener Embed */}
            <div className="w-full overflow-x-auto">
              <iframe
                src={`${dexScreenerUrl}?embed=1&theme=dark&trades=0&info=0`}
                className="w-full min-w-[320px] h-[600px] border-0"
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
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-gem-crystal bg-gray-800 px-2 py-1 rounded flex-1 overflow-hidden text-ellipsis">
                      {BB_TOKEN.address}
                    </code>
                    <button
                      onClick={handleCopyAddress}
                      className="p-1 hover:bg-gray-700 rounded transition-colors"
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