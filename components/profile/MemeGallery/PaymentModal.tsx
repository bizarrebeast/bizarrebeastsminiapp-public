'use client';

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { DaimoPayButton } from '@daimo/pay';
import {
  X, CreditCard, Wallet, Coins, Check,
  Loader, ShoppingBag, Sparkles
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PaymentModalProps {
  userId: string;
  walletAddress?: string;
  currentSlots: number;
  isFirstPurchase: boolean;
  onClose: () => void;
  onSuccess: (slots: number) => void;
}

type PaymentMethod = 'usd' | 'eth' | 'bb';

export default function PaymentModal({
  userId,
  walletAddress,
  currentSlots,
  isFirstPurchase,
  onClose,
  onSuccess
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('usd');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate prices
  const basePrice = isFirstPurchase ? 2.00 : 1.00;
  const bbPrice = isFirstPurchase ? 1.50 : 0.75; // 25% discount
  const bbTokenAmount = isFirstPurchase ? '10M' : '5M'; // Adjusted token amounts

  const handleUSDPayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      // DaimoPay integration is now handled by the DaimoPayButton component directly
      // The button handles payment processing and calls onPaymentCompleted when successful
      console.log('USD payment initiated via DaimoPayButton');
      setError('Please complete payment using the Daimo Pay button above.');
    } catch (err: any) {
      console.error('USD payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleETHPayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      if (!walletAddress) {
        throw new Error('Please connect your wallet first');
      }

      // Convert USD to ETH (mock conversion, should use real price feed)
      const ethPrice = 0.0006; // ~$2 at $3300/ETH

      // Request payment through wallet
      const provider = (window as any).ethereum;
      if (!provider) {
        throw new Error('No wallet provider found');
      }

      const transactionParams = {
        from: walletAddress,
        to: process.env.NEXT_PUBLIC_TREASURY_WALLET,
        value: `0x${(ethPrice * 1e18).toString(16)}`, // Convert to wei
        data: '0x' // No data needed
      };

      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [transactionParams]
      });

      // Wait for confirmation
      // In production, you'd want to properly wait for confirmations
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Update database
      await updateGalleryAccess(9);
      onSuccess(currentSlots + 9);
    } catch (err: any) {
      console.error('ETH payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleBBPayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      if (!walletAddress) {
        throw new Error('Please connect your wallet first');
      }

      // BB token contract address (would need the actual deployed address)
      const BB_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_BB_TOKEN_ADDRESS;

      if (!BB_TOKEN_ADDRESS) {
        throw new Error('BB token not configured');
      }

      // ERC20 transfer ABI
      const transferABI = [{
        "constant": false,
        "inputs": [
          { "name": "_to", "type": "address" },
          { "name": "_value", "type": "uint256" }
        ],
        "name": "transfer",
        "outputs": [{ "name": "", "type": "bool" }],
        "type": "function"
      }];

      const provider = (window as any).ethereum;
      if (!provider) {
        throw new Error('No wallet provider found');
      }

      // Calculate token amount (with decimals)
      const tokenAmount = isFirstPurchase ? 10000000 : 5000000; // 10M or 5M
      const decimals = 18; // Standard ERC20 decimals
      const value = `0x${(tokenAmount * Math.pow(10, decimals)).toString(16)}`;

      // Encode transfer function
      const data = `0xa9059cbb` + // transfer function signature
        process.env.NEXT_PUBLIC_TREASURY_WALLET!.substring(2).padStart(64, '0') +
        value.substring(2).padStart(64, '0');

      const transactionParams = {
        from: walletAddress,
        to: BB_TOKEN_ADDRESS,
        data: data
      };

      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [transactionParams]
      });

      // Wait for confirmation
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Update database
      await updateGalleryAccess(9);
      onSuccess(currentSlots + 9);
    } catch (err: any) {
      console.error('BB payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const updateGalleryAccess = async (additionalSlots: number) => {
    const { error } = await supabase
      .from('unified_users')
      .update({
        gallery_slots: currentSlots + additionalSlots,
        gallery_unlocked: true,
        gallery_purchased_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
  };

  const handlePayment = () => {
    switch (paymentMethod) {
      case 'usd':
        handleUSDPayment();
        break;
      case 'eth':
        handleETHPayment();
        break;
      case 'bb':
        handleBBPayment();
        break;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-xl p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-gem-gold" />
            {isFirstPurchase ? 'Unlock Meme Gallery' : 'Expand Gallery'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Benefits */}
        <div className="mb-6 p-4 bg-gem-purple/10 border border-gem-purple/30 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gem-gold" />
            What you get:
          </h3>
          <ul className="space-y-1 text-sm text-gray-300">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-gem-crystal" />
              9 meme storage slots
            </li>
            {isFirstPurchase && (
              <>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-gem-crystal" />
                  Featured meme showcase
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-gem-crystal" />
                  Public gallery profile
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3 mb-6">
          {/* USD via Daimo Pay Button */}
          <div className="w-full p-4 bg-gradient-to-r from-gem-crystal/10 to-gem-purple/10 border border-gem-crystal/30 rounded-lg">
            <div className="mb-3 text-center">
              <div className="text-lg font-semibold">Pay ${basePrice.toFixed(2)} USD</div>
              <div className="text-sm text-gray-400">Quick and easy payment via Daimo Pay</div>
            </div>
            <DaimoPayButton
              appId={process.env.NEXT_PUBLIC_DAIMO_APP_ID!}
              toAddress={(process.env.NEXT_PUBLIC_TREASURY_WALLET || '0x34e6f66f8bff0ec8b896f6a7a39f58f47f9d76c3') as `0x${string}`}
              toChain={8453} // Base chain ID
              toToken={'0x0000000000000000000000000000000000000000' as `0x${string}`} // ETH
              toUnits={Math.floor(basePrice * 0.0003 * 1e18).toString()} // Convert $30 USD to ~0.009 ETH at $3300/ETH
              intent="Purchase Gallery Slots"
              onPaymentCompleted={async () => {
                // Update database
                await updateGalleryAccess(9);
                onSuccess(currentSlots + 9);
              }}
              onPaymentStarted={() => {
                setProcessing(true);
                setError(null);
              }}
            />
          </div>

          {/* ETH on Base */}
          <button
            onClick={() => setPaymentMethod('eth')}
            className={`w-full p-4 rounded-lg border-2 transition ${
              paymentMethod === 'eth'
                ? 'border-gem-crystal bg-gem-crystal/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-blue-400" />
                <div className="text-left">
                  <div className="font-semibold">Pay with ETH</div>
                  <div className="text-xs text-gray-400">on Base</div>
                </div>
              </div>
              <div className="text-xl font-bold">~0.0006 ETH</div>
            </div>
          </button>

          {/* BB Tokens with discount */}
          <button
            onClick={() => setPaymentMethod('bb')}
            className={`w-full p-4 rounded-lg border-2 transition relative ${
              paymentMethod === 'bb'
                ? 'border-gem-gold bg-gem-gold/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="absolute -top-2 -right-2 px-2 py-1 bg-gem-gold text-dark-bg text-xs font-bold rounded">
              25% OFF
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Coins className="w-5 h-5 text-gem-gold" />
                <div className="text-left">
                  <div className="font-semibold">Pay with $BB</div>
                  <div className="text-xs text-gray-400">25% discount</div>
                </div>
              </div>
              <div>
                <div className="text-xl font-bold">{bbTokenAmount} $BB</div>
                <div className="text-xs text-gray-400 line-through">${basePrice.toFixed(2)}</div>
              </div>
            </div>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={processing}
            className="flex-1 py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={processing || !walletAddress && paymentMethod !== 'usd'}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-gem-purple to-gem-crystal text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <Loader className="w-4 h-4 inline mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>Complete Purchase</>
            )}
          </button>
        </div>

        {/* Wallet Connection Warning */}
        {!walletAddress && paymentMethod !== 'usd' && (
          <p className="mt-3 text-xs text-yellow-500 text-center">
            Please connect your wallet to use {paymentMethod === 'eth' ? 'ETH' : '$BB'} payment
          </p>
        )}
      </div>
    </div>
  );
}