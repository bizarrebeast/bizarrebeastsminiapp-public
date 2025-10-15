'use client';

import React, { useState } from 'react';
import { ArrowDownUp, ExternalLink, Copy, Check, BarChart3, Sparkles, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useFarcaster } from '@/contexts/FarcasterContext';
import { sdk, withSDKRetry } from '@/lib/sdk-init';
import { BBTokenChart } from '@/components/charts/BBTokenChart';
import ShareButtons from '@/components/ShareButtons';

// BB Token on Base
const BB_TOKEN = {
  address: '0x0520bf1d3cEE163407aDA79109333aB1599b4004',
  chainId: 8453, // Base
  decimals: 18,
  name: 'BizarreBeasts',
  symbol: 'BB',
};

// CAIP-19 format for tokens
const BB_TOKEN_CAIP = 'eip155:8453/erc20:0x0520bf1d3cEE163407aDA79109333aB1599b4004';
const ETH_BASE_CAIP = 'eip155:8453/native';

type SwapStatus = 'idle' | 'loading' | 'success' | 'error';

export default function SwapClient() {
  const { isInFarcaster } = useFarcaster();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [swapStatus, setSwapStatus] = useState<SwapStatus>('idle');
  const [transactionHashes, setTransactionHashes] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(BB_TOKEN.address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleSwap = async () => {
    if (!isInFarcaster) {
      setErrorMessage('Swap is only available in Farcaster app');
      return;
    }

    try {
      setSwapStatus('loading');
      setErrorMessage('');
      setTransactionHashes([]);

      console.log('Opening swap interface:', {
        sellToken: ETH_BASE_CAIP,
        buyToken: BB_TOKEN_CAIP,
      });

      // Add timeout wrapper
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out after 30 seconds')), 30000)
      );

      const sdkPromise = withSDKRetry(async () =>
        await sdk.actions.swapToken({
          sellToken: ETH_BASE_CAIP,
          buyToken: BB_TOKEN_CAIP,
        })
      );

      const result: any = await Promise.race([sdkPromise, timeoutPromise]);

      console.log('Swap result:', result);

      if (result && result.success) {
        setSwapStatus('success');
        setTransactionHashes(result.swap.transactions);
      } else {
        console.error('Swap failed:', result);
        setSwapStatus('error');
        setErrorMessage(
          result.reason === 'rejected_by_user'
            ? 'You cancelled the swap'
            : result.error?.message || 'Swap failed. Please try again.'
        );
      }
    } catch (error: any) {
      console.error('Swap error:', error);
      setSwapStatus('error');
      setErrorMessage(error?.message || 'An error occurred. Please try again.');
    }
  };

  const resetSwap = () => {
    setSwapStatus('idle');
    setTransactionHashes([]);
    setErrorMessage('');
  };

  // DexScreener chart URL for BB token
  const dexScreenerUrl = 'https://dexscreener.com/base/0x49e35c372ee285d22a774f8a415f8bf3ad6456c2';
  const uniswapUrl = `https://app.uniswap.org/swap?outputCurrency=${BB_TOKEN.address}&chain=base`;

  // Farcaster-native experience
  return (
    <div className="min-h-[calc(100vh-64px)] bg-dark-bg overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Title and Description */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent leading-tight pb-2">
            Buy $BB Tokens
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Swap ETH for $BB tokens directly in Farcaster. Quick, secure, and seamless.
          </p>
        </div>

        {/* Single Column Layout */}
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Swap Interface - Native Farcaster or Uniswap */}
          <div className="bg-dark-card border border-gem-crystal/20 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    {isInFarcaster ? (
                      <>
                        <Sparkles className="w-5 h-5 text-gem-gold" />
                        Native Farcaster Swap
                      </>
                    ) : (
                      <>
                        <ArrowDownUp className="w-5 h-5 text-gem-gold" />
                        Uniswap Interface
                      </>
                    )}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {isInFarcaster
                      ? "Powered by Farcaster's secure swap protocol"
                      : "Swap tokens on Uniswap - Base Network"
                    }
                  </p>
                </div>
                {!isInFarcaster && (
                  <a
                    href={uniswapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gem-crystal hover:text-gem-gold transition-colors flex items-center gap-1 text-sm"
                  >
                    Open in new tab
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {isInFarcaster ? (
              <div className="p-6 space-y-6">
                {swapStatus === 'idle' && (
                  <>
                    {/* Swap Info */}
                    <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-2xl">
                          Ξ
                        </div>
                        <ArrowDownUp className="w-6 h-6 text-gem-gold" />
                        <img
                          src="/assets/page-assets/logos/bb-token.png"
                          alt="$BB"
                          className="w-12 h-12 object-contain"
                        />
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-white">Swap ETH for $BB</h3>
                        <p className="text-sm text-gray-400">
                          Opens the native Farcaster swap interface where you can enter your desired amount and complete the swap securely.
                        </p>
                      </div>
                    </div>

                    {/* Swap Button */}
                    <button
                      onClick={handleSwap}
                      className="w-full px-6 py-4 bg-gradient-to-r from-gem-gold via-gem-crystal to-gem-pink text-dark-bg font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-lg"
                    >
                      <ArrowDownUp className="w-6 h-6" />
                      Open Swap Interface
                    </button>

                    <p className="text-xs text-gray-500 text-center">
                      The swap interface will open where you can enter your amount and confirm. Gas fees apply.
                    </p>
                  </>
                )}

                {swapStatus === 'loading' && (
                  <div className="text-center py-12 space-y-4">
                    <Loader2 className="w-16 h-16 text-gem-gold animate-spin mx-auto" />
                    <h3 className="text-xl font-semibold text-white">Processing Swap...</h3>
                    <p className="text-gray-400">Please confirm in your wallet</p>
                  </div>
                )}

                {swapStatus === 'success' && (
                  <div className="text-center py-8 space-y-6">
                    <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto" />
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">Swap Successful! 🎉</h3>
                      <p className="text-gray-400">Your $BB tokens are on the way</p>
                    </div>

                    {transactionHashes.length > 0 && (
                      <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
                        <p className="text-sm text-gray-400">Transaction{transactionHashes.length > 1 ? 's' : ''}:</p>
                        {transactionHashes.map((hash, idx) => (
                          <a
                            key={hash}
                            href={`https://basescan.org/tx/${hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between text-sm bg-gray-700/50 px-3 py-2 rounded hover:bg-gray-700 transition-colors"
                          >
                            <code className="text-gem-crystal font-mono">
                              {hash.slice(0, 10)}...{hash.slice(-8)}
                            </code>
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Share Buttons */}
                    <div className="bg-gray-800/30 rounded-lg p-4">
                      <p className="text-sm text-gray-400 text-center mb-3">Share your swap!</p>
                      <ShareButtons
                        shareType="swap"
                        swapData={{
                          txHash: transactionHashes[0]
                        }}
                        contextUrl="https://bbapp.bizarrebeasts.io/swap"
                        showLabels={false}
                        buttonSize="lg"
                      />
                    </div>

                    <button
                      onClick={resetSwap}
                      className="w-full px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Make Another Swap
                    </button>
                  </div>
                )}

                {swapStatus === 'error' && (
                  <div className="text-center py-8 space-y-6">
                    <AlertCircle className="w-20 h-20 text-red-500 mx-auto" />
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">Swap Failed</h3>
                      <p className="text-gray-400">{errorMessage}</p>
                    </div>

                    <button
                      onClick={resetSwap}
                      className="w-full px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full">
                <iframe
                  src={uniswapUrl}
                  className="w-full border-0"
                  style={{ height: '600px', minWidth: '100%' }}
                  title="Uniswap Swap Interface"
                  allow="clipboard-read; clipboard-write"
                />
                <div className="p-4 bg-gray-800/50 border-t border-gray-700">
                  <p className="text-sm text-gray-400 text-center">
                    💡 <strong>Tip:</strong> For a seamless native experience, open this in the Farcaster app!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Chart Section */}
          <div className="bg-dark-card border border-gem-crystal/20 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-gem-gold" />
                    $BB Price Chart
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">Real-time price data from GeckoTerminal</p>
                </div>
                <a
                  href={dexScreenerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gem-crystal hover:text-gem-gold transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  View on DexScreener
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Chart */}
            <div className="p-6">
              <BBTokenChart />
            </div>
          </div>

          {/* Token Info */}
          <div className="space-y-6">
            {/* BB Token Info */}
            <div className="bg-dark-card border border-gem-gold/20 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/assets/page-assets/logos/bb-token.png"
                  alt="$BB Token"
                  className="w-12 h-12 object-contain"
                />
                <div>
                  <h3 className="text-xl font-semibold text-white">BizarreBeasts</h3>
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
                      title="Copy address"
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
                  className="w-full bg-gray-700/50 hover:bg-gray-700 text-gray-300 py-2 rounded text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  View on BaseScan
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={dexScreenerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gray-700/50 hover:bg-gray-700 text-gray-300 py-2 rounded text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  View on DexScreener
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Benefits Card */}
            <div className="bg-gradient-to-br from-gem-gold/10 to-gem-crystal/10 border border-gem-gold/30 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-3">Why Buy $BB?</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-gem-gold mt-0.5">✓</span>
                  <span>Access exclusive BizarreBeasts features</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gem-gold mt-0.5">✓</span>
                  <span>Participate in community contests</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gem-gold mt-0.5">✓</span>
                  <span>Earn rewards through rituals</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gem-gold mt-0.5">✓</span>
                  <span>Tip other community members</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
