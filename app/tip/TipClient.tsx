'use client';

import React, { useState } from 'react';
import { Send, Search, ExternalLink, CheckCircle2, AlertCircle, Loader2, User, Sparkles } from 'lucide-react';
import { useFarcaster } from '@/contexts/FarcasterContext';
import { sdk, withSDKRetry } from '@/lib/sdk-init';
import ShareButtons from '@/components/ShareButtons';

// BB Token on Base
const BB_TOKEN = {
  address: '0x0520bf1d3cEE163407aDA79109333aB1599b4004',
  chainId: 8453,
  decimals: 18,
  name: 'BizarreBeasts',
  symbol: 'BB',
};

// CAIP-19 format for BB token
const BB_TOKEN_CAIP = 'eip155:8453/erc20:0x0520bf1d3cEE163407aDA79109333aB1599b4004';

// Preset tip amounts
const PRESET_AMOUNTS = [
  { label: '10,000 $BB', value: '10000' },
  { label: '50,000 $BB', value: '50000' },
  { label: '100,000 $BB', value: '100000' },
  { label: '1,000,000 $BB', value: '1000000' },
];

type UserSearchResult = {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio?: string;
  followerCount: number;
  followingCount: number;
  powerBadge: boolean;
};

type TipStatus = 'idle' | 'searching' | 'ready' | 'loading' | 'success' | 'error';

export default function TipClient() {
  const { isInFarcaster } = useFarcaster();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [tipAmount, setTipAmount] = useState(PRESET_AMOUNTS[0].value); // Default 10,000 $BB
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [tipStatus, setTipStatus] = useState<TipStatus>('idle');
  const [transactionHash, setTransactionHash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchError, setSearchError] = useState('');

  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setTipStatus('searching');
    setSearchError('');
    setSearchResults([]);
    setSelectedUser(null);

    try {
      const cleanQuery = searchQuery.trim();
      const response = await fetch(`/api/neynar/search-users?q=${encodeURIComponent(cleanQuery)}`);
      const data = await response.json();

      if (data.success && data.users && data.users.length > 0) {
        setSearchResults(data.users);
        // If only one result, auto-select it
        if (data.users.length === 1) {
          setSelectedUser(data.users[0]);
          setTipStatus('ready');
        } else {
          setTipStatus('idle');
        }
      } else {
        setSearchError(`No users found matching "${cleanQuery}"`);
        setTipStatus('idle');
      }
    } catch (error) {
      console.error('User search error:', error);
      setSearchError('Failed to search for users. Please try again.');
      setTipStatus('idle');
    }
  };

  const handleSelectUser = (user: UserSearchResult) => {
    setSelectedUser(user);
    setSearchResults([]);
    setTipStatus('ready');
  };

  const handlePresetAmount = (value: string) => {
    setIsCustom(false);
    setTipAmount(value);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomAmount(value);
    setIsCustom(true);
    if (value) {
      setTipAmount(value);
    }
  };

  const handleSendTip = async () => {
    if (!isInFarcaster) {
      setErrorMessage('Tipping is only available in Farcaster app');
      return;
    }

    if (!selectedUser) {
      setErrorMessage('Please select a user first');
      return;
    }

    const amount = isCustom ? customAmount : tipAmount;
    if (!amount || parseFloat(amount) <= 0) {
      setErrorMessage('Please enter a valid amount');
      return;
    }

    try {
      setTipStatus('loading');
      setErrorMessage('');
      setTransactionHash('');

      // Convert BB tokens to smallest unit (18 decimals)
      // Use BigInt to avoid scientific notation issues
      const bbAmount = parseFloat(amount);
      const tokenAmount = BigInt(Math.floor(bbAmount)).toString() + '0'.repeat(18);

      console.log('Sending tip:', {
        token: BB_TOKEN_CAIP,
        amount: tokenAmount,
        bbAmount,
        recipientFid: selectedUser.fid,
        recipient: selectedUser.username
      });

      // Add timeout wrapper
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out after 30 seconds')), 30000)
      );

      const sdkPromise = withSDKRetry(async () =>
        await sdk.actions.sendToken({
          token: BB_TOKEN_CAIP,
          amount: tokenAmount,
          recipientFid: selectedUser.fid,
        })
      );

      const result: any = await Promise.race([sdkPromise, timeoutPromise]);

      console.log('Tip result:', result);

      if (result && result.success) {
        setTipStatus('success');
        setTransactionHash(result.send.transaction);
      } else {
        console.error('Tip failed:', result);
        setTipStatus('error');
        setErrorMessage(
          result.reason === 'rejected_by_user'
            ? 'You cancelled the tip'
            : result.error?.message || 'Tip failed. Please try again.'
        );
      }
    } catch (error: any) {
      console.error('Tip error:', error);
      setTipStatus('error');
      setErrorMessage(error?.message || 'An error occurred. Please try again.');
    }
  };

  const resetTip = () => {
    setTipStatus('ready');
    setTransactionHash('');
    setErrorMessage('');
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
    setTipStatus('idle');
    setSearchError('');
    setCustomAmount('');
    setIsCustom(false);
    setTipAmount(PRESET_AMOUNTS[0].value);
  };

  if (!isInFarcaster) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-dark-bg overflow-x-hidden">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent leading-tight pb-2">
              Tip $BB Tokens
            </h1>
            <p className="text-lg text-gray-300">
              Send $BB tokens to Farcaster users
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-8">
              <div className="text-center space-y-6">
                <div className="text-6xl">💸</div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Best Experience in Farcaster</h2>
                  <p className="text-gray-400">
                    The native tipping feature allows you to search for any Farcaster user and send $BB instantly
                  </p>
                </div>

                <div className="bg-gradient-to-r from-gem-gold/10 to-gem-crystal/10 border border-gem-gold/30 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Features in Farcaster:</h3>
                  <ul className="space-y-2 text-sm text-gray-300 text-left max-w-md mx-auto">
                    <li className="flex items-start gap-2">
                      <span className="text-gem-gold mt-0.5">✓</span>
                      <span>Search users by Farcaster username</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gem-gold mt-0.5">✓</span>
                      <span>See profile previews before tipping</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gem-gold mt-0.5">✓</span>
                      <span>One-click tip with preset amounts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gem-gold mt-0.5">✓</span>
                      <span>Instant confirmation and transaction tracking</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4">
                  <p className="text-sm text-gray-500">
                    Open <span className="text-gem-crystal font-semibold">bbapp.bizarrebeasts.io</span> in the Farcaster app to access native tipping
                  </p>
                </div>
              </div>
            </div>

            {/* Alternative: Manual tip info */}
            <div className="bg-dark-card border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Alternative: Manual Transfer</h3>
              <p className="text-sm text-gray-400 mb-4">
                You can also send $BB tokens manually through any Web3 wallet using the token contract address:
              </p>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <code className="text-xs font-mono text-gem-crystal break-all">
                    {BB_TOKEN.address}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(BB_TOKEN.address)}
                    className="ml-3 p-2 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                    title="Copy address"
                  >
                    <span className="text-xs text-gray-400">Copy</span>
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Network: Base • Symbol: $BB • Decimals: 18
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-dark-bg overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent leading-tight pb-2">
            Tip $BB Tokens
          </h1>
          <p className="text-lg text-gray-300">
            Send $BB tokens to other Farcaster users
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* User Search */}
          {tipStatus !== 'success' && (
            <div className="bg-dark-card border border-gem-crystal/20 rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-gem-gold" />
                  Find User
                </h2>
                <p className="text-sm text-gray-400 mt-1">Search by username (partial match supported)</p>
              </div>

              <div className="p-6 space-y-4">
                <form onSubmit={handleSearchUser} className="space-y-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by username..."
                        disabled={tipStatus === 'searching' || selectedUser !== null}
                        className="w-full pl-8 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gem-crystal disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    {!selectedUser ? (
                      <button
                        type="submit"
                        disabled={!searchQuery.trim() || tipStatus === 'searching'}
                        className="px-6 py-3 bg-gem-crystal text-dark-bg font-semibold rounded-lg hover:bg-gem-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {tipStatus === 'searching' ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Search className="w-5 h-5" />
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={clearSearch}
                        className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {searchError && (
                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg">
                      <AlertCircle className="w-4 h-4" />
                      <span>{searchError}</span>
                    </div>
                  )}
                </form>

                {/* Search Results List */}
                {searchResults.length > 0 && !selectedUser && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">
                      Found {searchResults.length} {searchResults.length === 1 ? 'user' : 'users'}:
                    </p>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.fid}
                          onClick={() => handleSelectUser(user)}
                          className="w-full bg-gray-800/50 hover:bg-gray-800 rounded-lg p-4 transition-colors text-left"
                        >
                          <div className="flex items-center gap-4">
                            <img
                              src={user.pfpUrl}
                              alt={user.displayName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-semibold text-white truncate">
                                  {user.displayName}
                                </h3>
                                {user.powerBadge && (
                                  <span className="text-purple-400 flex-shrink-0">⚡</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-400">@{user.username}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span>{user.followerCount.toLocaleString()} followers</span>
                              </div>
                            </div>
                          </div>
                          {user.bio && (
                            <p className="text-xs text-gray-500 mt-2 line-clamp-1">{user.bio}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected User Display */}
                {selectedUser && (
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={selectedUser.pfpUrl}
                        alt={selectedUser.displayName}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-white">
                            {selectedUser.displayName}
                          </h3>
                          {selectedUser.powerBadge && (
                            <span className="text-purple-400">⚡</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">@{selectedUser.username}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span>{selectedUser.followerCount.toLocaleString()} followers</span>
                          <span>{selectedUser.followingCount.toLocaleString()} following</span>
                        </div>
                      </div>
                    </div>
                    {selectedUser.bio && (
                      <p className="text-sm text-gray-400 mt-3 line-clamp-2">{selectedUser.bio}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Amount Selection */}
          {selectedUser && tipStatus !== 'success' && tipStatus !== 'loading' && (
            <div className="bg-dark-card border border-gem-crystal/20 rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-gem-gold" />
                  Select Amount
                </h2>
                <p className="text-sm text-gray-400 mt-1">Choose how much $BB to tip</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Preset Amounts */}
                <div className="grid grid-cols-2 gap-3">
                  {PRESET_AMOUNTS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handlePresetAmount(preset.value)}
                      className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                        !isCustom && tipAmount === preset.value
                          ? 'bg-gradient-to-r from-gem-gold to-gem-crystal text-dark-bg'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Custom Amount */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Or enter custom amount ($BB)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    placeholder="100"
                    className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                      isCustom
                        ? 'border-gem-crystal focus:ring-gem-crystal'
                        : 'border-gray-700 focus:ring-gem-gold'
                    }`}
                  />
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSendTip}
                  className="w-full px-6 py-4 bg-gradient-to-r from-gem-gold via-gem-crystal to-gem-pink text-dark-bg font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-lg"
                >
                  <Send className="w-6 h-6" />
                  Send {isCustom && customAmount ? customAmount : tipAmount} $BB
                </button>

                <p className="text-xs text-gray-500 text-center">
                  Your wallet will open to confirm the transaction. Gas fees apply.
                </p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {tipStatus === 'loading' && (
            <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-12">
              <div className="text-center space-y-4">
                <Loader2 className="w-16 h-16 text-gem-gold animate-spin mx-auto" />
                <h3 className="text-xl font-semibold text-white">Sending Tip...</h3>
                <p className="text-gray-400">Please confirm in your wallet</p>
              </div>
            </div>
          )}

          {/* Success State */}
          {tipStatus === 'success' && selectedUser && (
            <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-12">
              <div className="text-center space-y-6">
                <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto" />
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Tip Sent! 🎉</h3>
                  <p className="text-gray-400">
                    Successfully sent {isCustom && customAmount ? customAmount : tipAmount} $BB to @{selectedUser.username}
                  </p>
                </div>

                {transactionHash && (
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-2">Transaction:</p>
                    <a
                      href={`https://basescan.org/tx/${transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between text-sm bg-gray-700/50 px-3 py-2 rounded hover:bg-gray-700 transition-colors"
                    >
                      <code className="text-gem-crystal font-mono">
                        {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                      </code>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </a>
                  </div>
                )}

                {/* Share Buttons */}
                {selectedUser && (
                  <div className="bg-gray-800/30 rounded-lg p-4">
                    <p className="text-sm text-gray-400 text-center mb-3">Share your tip!</p>
                    <ShareButtons
                      shareType="tip"
                      tipData={{
                        amount: Number(isCustom && customAmount ? customAmount : tipAmount).toLocaleString(),
                        recipient: selectedUser.username,
                        recipientFid: selectedUser.fid,
                        txHash: transactionHash
                      }}
                      contextUrl="https://bbapp.bizarrebeasts.io/tip"
                      showLabels={false}
                      buttonSize="lg"
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={resetTip}
                    className="flex-1 px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Send Another Tip
                  </button>
                  <button
                    onClick={clearSearch}
                    className="flex-1 px-6 py-3 bg-gem-crystal text-dark-bg font-semibold rounded-lg hover:bg-gem-gold transition-colors"
                  >
                    New User
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {tipStatus === 'error' && (
            <div className="bg-dark-card border border-gem-crystal/20 rounded-lg p-12">
              <div className="text-center space-y-6">
                <AlertCircle className="w-20 h-20 text-red-500 mx-auto" />
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Tip Failed</h3>
                  <p className="text-gray-400">{errorMessage}</p>
                </div>

                <button
                  onClick={resetTip}
                  className="w-full px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Card */}
        {!selectedUser && tipStatus === 'idle' && (
          <div className="mt-8 bg-gradient-to-br from-gem-gold/10 to-gem-crystal/10 border border-gem-gold/30 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-3">About Tipping</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-gem-gold mt-0.5">✓</span>
                <span>Search for any Farcaster user by their username</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gem-gold mt-0.5">✓</span>
                <span>Choose from preset amounts or enter a custom tip</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gem-gold mt-0.5">✓</span>
                <span>Transactions happen directly on Base network</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gem-gold mt-0.5">✓</span>
                <span>Show appreciation for great content and contributors</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
