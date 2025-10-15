'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Wallet, Check, AlertCircle, Loader2,
  TrendingUp, Users, Coins, ExternalLink, ArrowLeft,
  Flame, Gift
} from 'lucide-react';
import Link from 'next/link';
import ShareButtons from '@/components/ShareButtons';
import { useUnifiedAuthStore } from '@/store/useUnifiedAuthStore';
import { getUnifiedProvider, getUnifiedSigner } from '@/lib/unified-provider';
import { isInFarcasterMiniapp } from '@/lib/farcaster-miniapp';
import { ethers } from 'ethers';
import sdk from '@farcaster/miniapp-sdk';

// Public Base RPC for transaction receipts (Farcaster provider has limited method support)
const publicBaseProvider = new ethers.JsonRpcProvider('https://mainnet.base.org');

// Contract configuration
const CONTRACT_CONFIG = {
  address: '0x177D2210B8fd8Ee3bF77D37F2C4a561f6479d0F0',
  bbTokenAddress: '0x0520bf1d3cEE163407aDA79109333aB1599b4004',
  chainId: 8453,
  tokenId: 0,
  maxSupply: 500,
  maxPerWallet: 5,
  startingPrice: '5000000000000000000000000', // 5M * 10^18
  endingPrice: '20000000000000000000000000', // 20M * 10^18
};

// ERC20 ABI for approve
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
];

// NFT Contract ABI
const NFT_ABI = [
  'function mint(uint256 tokenId, uint256 amount) external',
  'function calculateTotalCost(uint256 tokenId, uint256 amount) view returns (uint256)',
];

interface TokenStats {
  totalMinted: number;
  remainingSupply: number;
  currentPrice: string;
  userBalance: number;
  userCanMint: number;
  isPaused: boolean;
}

type MintStep = 'idle' | 'approving' | 'minting' | 'success' | 'error';

export default function MintClient() {
  const { walletAddress, walletConnected } = useUnifiedAuthStore();
  const [mintAmount, setMintAmount] = useState(1);
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [bbBalance, setBBBalance] = useState('0');
  const [bbAllowance, setBBAllowance] = useState('0');
  const [mintStep, setMintStep] = useState<MintStep>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPWA, setIsPWA] = useState(false);
  const [showPWAWarning, setShowPWAWarning] = useState(false);
  const [isInFarcaster, setIsInFarcaster] = useState(false);

  // Ref for success section to scroll to after mint
  const successSectionRef = useRef<HTMLDivElement>(null);

  // Scroll to success section when mint succeeds
  useEffect(() => {
    if (mintStep === 'success' && successSectionRef.current) {
      successSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [mintStep]);

  // Detect PWA mode and check if user is in Farcaster
  useEffect(() => {
    const checkEnvironment = () => {
      const inPWA = window.matchMedia('(display-mode: standalone)').matches ||
                    (window.navigator as any).standalone === true;
      const inFarcaster = isInFarcasterMiniapp();

      setIsPWA(inPWA);
      setIsInFarcaster(inFarcaster);

      // Show PWA warning if in PWA AND not in Farcaster
      setShowPWAWarning(inPWA && !inFarcaster && walletConnected);
    };

    checkEnvironment();
    setLoading(false);
  }, [walletConnected]);

  // Check and enforce Base network on mount
  useEffect(() => {
    const checkNetwork = async () => {
      if (!walletConnected) return;

      try {
        const provider = await getUnifiedProvider();
        if (provider) {
          const network = await provider.getNetwork();
          const currentChainId = Number(network.chainId);

          if (currentChainId !== CONTRACT_CONFIG.chainId) {
            console.log('⚠️ Wrong network detected:', currentChainId, 'Need:', CONTRACT_CONFIG.chainId);
            console.log('ℹ️ Network switching is handled by unified-provider.ts during transactions');
            // Network switching is now handled automatically in unified-provider.ts
            // during the approve/mint transaction flow, so we don't need to block here
          }
        }
      } catch (error) {
        console.error('Network check failed:', error);
      }
    };

    checkNetwork();
  }, [walletConnected]);

  // Load contract stats (always load basic stats, user stats only when connected)
  useEffect(() => {
    loadStats();
    if (walletConnected && walletAddress) {
      loadBBBalance();
      loadBBAllowance();
    }
  }, [walletConnected, walletAddress]);

  const loadStats = async () => {
    try {
      // Read from contract using JSON-RPC
      const response = await fetch('/api/nft/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress: CONTRACT_CONFIG.address,
          tokenId: CONTRACT_CONFIG.tokenId,
          userAddress: walletAddress || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStats({
          totalMinted: data.totalMinted || 50,
          remainingSupply: CONTRACT_CONFIG.maxSupply - (data.totalMinted || 50),
          currentPrice: data.currentPrice || CONTRACT_CONFIG.startingPrice,
          userBalance: data.userBalance || 0,
          userCanMint: Math.min(
            CONTRACT_CONFIG.maxPerWallet - (data.userBalance || 0),
            CONTRACT_CONFIG.maxSupply - (data.totalMinted || 50)
          ),
          isPaused: data.isPaused || false,
        });
      } else {
        // Fallback to estimated values based on creator reserves
        setStats({
          totalMinted: 50,
          remainingSupply: 450,
          currentPrice: CONTRACT_CONFIG.startingPrice,
          userBalance: 0,
          userCanMint: 5,
          isPaused: false,
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Fallback to estimated values
      setStats({
        totalMinted: 50,
        remainingSupply: 450,
        currentPrice: CONTRACT_CONFIG.startingPrice,
        userBalance: 0,
        userCanMint: 5,
        isPaused: false,
      });
    }
  };

  const loadBBBalance = async () => {
    if (!walletAddress) return;

    try {
      const response = await fetch('/api/token/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenAddress: CONTRACT_CONFIG.bbTokenAddress,
          walletAddress: walletAddress,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setBBBalance(data.balance);
      }
    } catch (error) {
      console.error('Failed to load BB balance:', error);
    }
  };

  const loadBBAllowance = async () => {
    if (!walletAddress) return;

    try {
      // Use reliable public RPC for read-only calls
      const provider = new ethers.JsonRpcProvider('https://base.llamarpc.com');

      const bbTokenContract = new ethers.Contract(
        CONTRACT_CONFIG.bbTokenAddress,
        ERC20_ABI,
        provider
      );

      const allowance = await bbTokenContract.allowance(
        walletAddress,
        CONTRACT_CONFIG.address
      );

      console.log('📊 BB Allowance loaded:', ethers.formatUnits(allowance, 18));
      setBBAllowance(allowance.toString());
    } catch (error) {
      console.error('Failed to load allowance:', error);
      // Set to 0 on error so user knows they need to approve
      setBBAllowance('0');
    }
  };

  const calculateTotalCost = (): string => {
    if (!stats) return '0';

    // Calculate cost based on bonding curve (all values in wei)
    let totalCost = BigInt(0);
    const startPrice = BigInt(CONTRACT_CONFIG.startingPrice);
    const endPrice = BigInt(CONTRACT_CONFIG.endingPrice);
    const maxSupply = BigInt(CONTRACT_CONFIG.maxSupply);

    for (let i = 0; i < mintAmount; i++) {
      const mintNumber = BigInt(stats.totalMinted + i);
      const priceIncrease = (endPrice - startPrice) * mintNumber / maxSupply;
      const price = startPrice + priceIncrease;
      totalCost += price;
    }

    return totalCost.toString();
  };

  const needsApproval = (): boolean => {
    const totalCost = calculateTotalCost();
    try {
      const needs = BigInt(bbAllowance) < BigInt(totalCost);
      console.log('🔍 Needs approval?', needs, '| Allowance:', bbAllowance, '| Cost:', totalCost);
      return needs;
    } catch (error) {
      console.log('⚠️ Error checking approval:', error);
      return true;
    }
  };

  const hasEnoughBB = (): boolean => {
    const totalCost = calculateTotalCost();
    try {
      const hasEnough = BigInt(bbBalance) >= BigInt(totalCost);
      console.log('🔍 Has enough BB?', hasEnough, '| Balance:', bbBalance, '| Cost:', totalCost);
      return hasEnough;
    } catch (error) {
      console.log('⚠️ Error checking balance:', error);
      return false;
    }
  };

  // Helper to wait for transaction receipt using public RPC
  // Farcaster SDK provider doesn't support eth_getTransactionReceipt
  const waitForTransaction = async (txHash: string, timeout = 120000) => {
    console.log(`⏳ Waiting for transaction ${txHash} using public RPC...`);

    const startTime = Date.now();
    const pollInterval = 2000; // Check every 2 seconds

    while (Date.now() - startTime < timeout) {
      try {
        const receipt = await publicBaseProvider.getTransactionReceipt(txHash);

        if (receipt) {
          console.log('✅ Transaction confirmed:', {
            blockNumber: receipt.blockNumber,
            status: receipt.status === 1 ? 'Success' : 'Failed',
            gasUsed: receipt.gasUsed.toString()
          });

          if (receipt.status === 0) {
            throw new Error('Transaction failed on-chain');
          }

          return receipt;
        }
      } catch (error: any) {
        // If it's not a "transaction not found" error, throw it
        if (!error.message?.includes('not found') && !error.message?.includes('null')) {
          throw error;
        }
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      console.log(`⏳ Still waiting for ${txHash}...`);
    }

    throw new Error('Transaction confirmation timeout - please check Basescan');
  };

  // Helper to find the correct wallet provider when multiple are installed
  const getCorrectProvider = async () => {
    const log = (msg: string) => {
      console.log(msg);
    };

    log('🔍 [getCorrectProvider] Starting...');

    // Manually check SDK to capture in debug logs
    try {
      const sdkCheck = await sdk.isInMiniApp();
      log(`🔍 [SDK CHECK] sdk.isInMiniApp() returned: ${sdkCheck}`);

      // Try to get wallet provider directly to see if it's available
      try {
        const walletProvider = await sdk.wallet.getEthereumProvider();
        log(`🔍 [WALLET CHECK] sdk.wallet.getEthereumProvider() returned: ${walletProvider ? 'Provider object' : 'null'}`);
      } catch (walletError) {
        log(`❌ [WALLET CHECK] sdk.wallet.getEthereumProvider() failed: ${walletError}`);
      }
    } catch (error) {
      log(`❌ [SDK CHECK] sdk.isInMiniApp() failed: ${error}`);
    }

    // Check cached value
    const cachedCheck = isInFarcasterMiniapp();
    log(`🔍 [CACHED CHECK] isInFarcasterMiniapp() returned: ${cachedCheck}`);

    // If in Farcaster, ALWAYS use SDK provider
    let connectedProvider;

    // Temporarily capture console.error to see unified-provider errors
    const originalError = console.error;
    const capturedErrors: string[] = [];
    console.error = (...args: any[]) => {
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      capturedErrors.push(message);
      originalError(...args);
    };

    try {
      connectedProvider = await getUnifiedProvider();
      log(`✅ [PROVIDER] getUnifiedProvider() completed without error`);

      // Log any captured errors
      if (capturedErrors.length > 0) {
        capturedErrors.forEach(err => log(`🔴 [CONSOLE.ERROR] ${err}`));
      }
    } catch (providerError) {
      log(`❌ [PROVIDER] getUnifiedProvider() threw error: ${providerError}`);
      connectedProvider = null;
    } finally {
      // Restore console.error
      console.error = originalError;
    }
    log(`🔍 [getCorrectProvider] getUnifiedProvider returned: ${JSON.stringify({
      isNull: connectedProvider === null,
      type: connectedProvider?.constructor?.name,
      canSign: connectedProvider instanceof ethers.BrowserProvider
    })}`);

    // Check if we're in Farcaster miniapp
    const inFarcaster = isInFarcasterMiniapp();
    log(`🔍 [getCorrectProvider] In Farcaster? ${inFarcaster}`);

    if (inFarcaster) {
      log('📱 [getCorrectProvider] In Farcaster - using SDK provider');

      // Check if it's a read-only provider (JsonRpcProvider) vs transaction-capable (BrowserProvider)
      if (connectedProvider instanceof ethers.JsonRpcProvider && !(connectedProvider instanceof ethers.BrowserProvider)) {
        log('❌ [getCorrectProvider] Got READ-ONLY JsonRpcProvider - cannot sign transactions!');
        log('❌ This means sdk.wallet.getEthereumProvider() returned null');
      }

      return connectedProvider;
    }

    const logs = await connectedProvider?.getNetwork();
    if (logs) {
      console.log('🔍 Unified provider network:', Number(logs.chainId));
    }

    // Only check window.ethereum for browser wallets (not in Farcaster)
    if (window.ethereum) {
      // Check if multiple providers exist
      const providers = (window as any).ethereum?.providers || [window.ethereum];
      console.log(`🔍 Found ${providers.length} wallet provider(s)`);

      // Try each provider to find the one with our connected address
      for (const provider of providers) {
        try {
          const accounts = await provider.request({ method: 'eth_accounts' });
          console.log('🔍 Provider accounts:', accounts);

          if (walletAddress && accounts.some((addr: string) => addr.toLowerCase() === walletAddress.toLowerCase())) {
            console.log('✅ Found matching provider for:', walletAddress);
            return new ethers.BrowserProvider(provider);
          }
        } catch (error) {
          console.log('⚠️ Provider check failed:', error);
        }
      }
    }

    // Fallback to unified provider
    console.log('⚠️ Using unified provider fallback');
    return connectedProvider;
  };

  const handleApprove = async () => {
    if (!walletAddress) {
      setErrorMessage('Please connect your wallet first');
      return;
    }

    setMintStep('approving');
    setErrorMessage('');

    try {
      console.log('Starting BB token approval...');

      // Get the correct provider for the connected wallet
      const connectedProvider = await getCorrectProvider();
      if (!connectedProvider) {
        throw new Error('No wallet provider found');
      }

      // Check current network
      const network = await connectedProvider.getNetwork();
      const currentChainId = Number(network.chainId);

      console.log('Current network:', currentChainId, 'Need:', CONTRACT_CONFIG.chainId);
      console.log('Connected wallet:', walletAddress);

      if (currentChainId !== CONTRACT_CONFIG.chainId) {
        console.log('Wrong network! Need to switch to Base...');

        // Get raw provider for network switching
        const rawProvider = (connectedProvider as any).provider;
        if (!rawProvider || !rawProvider.request) {
          throw new Error('Cannot switch network - wallet does not support network switching');
        }

        try {
          console.log('📱 Requesting network switch to Base...');
          await rawProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${CONTRACT_CONFIG.chainId.toString(16)}` }],
          });

          console.log('⏳ Waiting for network switch to complete...');
          // Wait for network switch to propagate (Farcaster needs more time)
          await new Promise(resolve => setTimeout(resolve, 3000));

          // Verify the switch actually happened
          console.log('🔍 Verifying network switch...');
          const postSwitchNetwork = await connectedProvider.getNetwork();
          const postSwitchChainId = Number(postSwitchNetwork.chainId);
          console.log('🔍 Network after switch:', postSwitchChainId);

          if (postSwitchChainId !== CONTRACT_CONFIG.chainId) {
            throw new Error(`Network switch failed. Still on chain ${postSwitchChainId}. Please manually switch to Base network in your wallet.`);
          }

          console.log('✅ Network switch confirmed!');

        } catch (switchError: any) {
          // Network doesn't exist, add it
          if (switchError.code === 4902) {
            await rawProvider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${CONTRACT_CONFIG.chainId.toString(16)}`,
                chainName: 'Base',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://mainnet.base.org'],
                blockExplorerUrls: ['https://basescan.org'],
              }],
            });

            // Wait for network to be added
            await new Promise(resolve => setTimeout(resolve, 1500));
          } else {
            throw switchError;
          }
        }
      }

      // Get fresh provider after network switch and create signer
      const freshProvider = await getUnifiedProvider();
      if (!freshProvider) {
        throw new Error('Failed to get provider');
      }

      // Verify we're actually on Base network before proceeding
      const verifiedNetwork = await freshProvider.getNetwork();
      const verifiedChainId = Number(verifiedNetwork.chainId);
      console.log('✅ Verified current network:', verifiedChainId);

      if (verifiedChainId !== CONTRACT_CONFIG.chainId) {
        throw new Error(
          `Network switch incomplete. Please ensure your wallet is on Base network (Chain ID ${CONTRACT_CONFIG.chainId}). ` +
          `Current network: ${verifiedChainId}`
        );
      }

      const signer = await freshProvider.getSigner();

      // Verify we're signing with the correct wallet
      const signerAddress = await signer.getAddress();
      console.log('✅ Signer address:', signerAddress);

      if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error(`Wallet mismatch! Connected: ${walletAddress}, Signing with: ${signerAddress}`);
      }

      // Check Base ETH balance for gas
      const ethBalance = await freshProvider.getBalance(walletAddress);
      console.log('Base ETH balance:', ethers.formatEther(ethBalance), 'ETH');

      if (ethBalance < ethers.parseEther('0.0001')) {
        throw new Error(
          '⚠️ Insufficient Base ETH for gas fees. You need at least 0.0001 Base ETH to pay for the approval transaction. ' +
          'You can bridge ETH to Base at bridge.base.org or get Base ETH from a faucet.'
        );
      }

      const bbTokenContract = new ethers.Contract(
        CONTRACT_CONFIG.bbTokenAddress,
        ERC20_ABI,
        signer
      );

      // Approve max amount for convenience (don't need to approve again)
      const maxUint256 = ethers.MaxUint256;
      console.log('Approving', maxUint256.toString(), 'BB tokens to', CONTRACT_CONFIG.address);

      // Try to send approval with explicit gas limit as fallback for providers with gas estimation issues
      let tx;
      try {
        tx = await bbTokenContract.approve(CONTRACT_CONFIG.address, maxUint256);
      } catch (gasError: any) {
        console.warn('Gas estimation failed, trying with manual gas limit:', gasError);
        // Fallback: Use a reasonable gas limit for ERC20 approval (typically ~50k, we'll use 100k for safety)
        tx = await bbTokenContract.approve(CONTRACT_CONFIG.address, maxUint256, {
          gasLimit: 100000
        });
      }
      console.log('Approval tx sent:', tx.hash);

      // Wait for confirmation using public RPC (Farcaster provider doesn't support eth_getTransactionReceipt)
      await waitForTransaction(tx.hash);
      console.log('Approval confirmed!');

      // Wait a bit for RPC to catch up
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Reload allowance
      await loadBBAllowance();
      setMintStep('idle');
    } catch (error: any) {
      console.error('Approval failed:', error);
      setMintStep('error');

      // Parse error message for user-friendly display
      let errorMsg = error?.message || 'Failed to approve BB tokens';

      // Handle popup blocker error
      if (errorMsg.includes('Pop up window failed to open') || error?.code === -32603) {
        errorMsg = '⚠️ Wallet popup blocked!\n\n' +
          'If you\'re using the PWA (installed app):\n' +
          '• Open this page in your browser instead (Safari/Chrome)\n' +
          '• PWAs can\'t open wallet popups in standalone mode\n\n' +
          'If you\'re in a browser:\n' +
          '• Allow popups for this site in browser settings\n' +
          '• Look for popup blocker icon in address bar';
      }
      // Handle "missing revert data" error (usually means insufficient gas or wrong network)
      else if (errorMsg.includes('missing revert data') || error?.code === 'CALL_EXCEPTION') {
        errorMsg = '⚠️ Transaction failed. This usually means:\n' +
          '1. You don\'t have enough Base ETH for gas fees\n' +
          '2. Your wallet is on the wrong network (need Base mainnet)\n\n' +
          'Please check your Base ETH balance and network.';
      }

      setErrorMessage(errorMsg);
    }
  };

  const handleMint = async () => {
    if (!walletAddress) {
      setErrorMessage('Please connect your wallet first');
      return;
    }

    setMintStep('minting');
    setErrorMessage('');

    try {
      console.log('Starting NFT mint...');

      // Get the correct provider for the connected wallet
      const connectedProvider = await getCorrectProvider();
      if (!connectedProvider) {
        throw new Error('No wallet provider found');
      }

      // Check current network
      const network = await connectedProvider.getNetwork();
      const currentChainId = Number(network.chainId);

      console.log('Current network:', currentChainId, 'Need:', CONTRACT_CONFIG.chainId);
      console.log('Connected wallet:', walletAddress);

      if (currentChainId !== CONTRACT_CONFIG.chainId) {
        console.log('Wrong network! Need to switch to Base...');

        // Get raw provider for network switching
        const rawProvider = (connectedProvider as any).provider;
        if (!rawProvider || !rawProvider.request) {
          throw new Error('Cannot switch network - wallet does not support network switching');
        }

        try {
          console.log('📱 Requesting network switch to Base...');
          await rawProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${CONTRACT_CONFIG.chainId.toString(16)}` }],
          });

          console.log('⏳ Waiting for network switch to complete...');
          // Wait for network switch to propagate (Farcaster needs more time)
          await new Promise(resolve => setTimeout(resolve, 3000));

          // Verify the switch actually happened
          console.log('🔍 Verifying network switch...');
          const postSwitchNetwork = await connectedProvider.getNetwork();
          const postSwitchChainId = Number(postSwitchNetwork.chainId);
          console.log('🔍 Network after switch:', postSwitchChainId);

          if (postSwitchChainId !== CONTRACT_CONFIG.chainId) {
            throw new Error(`Network switch failed. Still on chain ${postSwitchChainId}. Please manually switch to Base network in your wallet.`);
          }

          console.log('✅ Network switch confirmed!');

        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await rawProvider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${CONTRACT_CONFIG.chainId.toString(16)}`,
                chainName: 'Base',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://mainnet.base.org'],
                blockExplorerUrls: ['https://basescan.org'],
              }],
            });

            // Wait for network to be added
            await new Promise(resolve => setTimeout(resolve, 1500));
          } else {
            throw switchError;
          }
        }
      }

      // Get fresh provider after network switch and create signer
      const freshProvider = await getUnifiedProvider();
      if (!freshProvider) {
        throw new Error('Failed to get provider');
      }

      // Verify we're actually on Base network before proceeding
      const verifiedNetwork = await freshProvider.getNetwork();
      const verifiedChainId = Number(verifiedNetwork.chainId);
      console.log('✅ Verified current network:', verifiedChainId);

      if (verifiedChainId !== CONTRACT_CONFIG.chainId) {
        throw new Error(
          `Network switch incomplete. Please ensure your wallet is on Base network (Chain ID ${CONTRACT_CONFIG.chainId}). ` +
          `Current network: ${verifiedChainId}`
        );
      }

      const signer = await freshProvider.getSigner();

      // Verify we're signing with the correct wallet
      const signerAddress = await signer.getAddress();
      console.log('✅ Signer address:', signerAddress);

      if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error(`Wallet mismatch! Connected: ${walletAddress}, Signing with: ${signerAddress}`);
      }

      // Pre-flight checks before minting
      console.log('Running pre-flight checks...');

      // 1. Check Base ETH balance for gas
      const ethBalance = await freshProvider.getBalance(walletAddress);
      console.log('Base ETH balance:', ethers.formatEther(ethBalance), 'ETH');

      if (ethBalance < ethers.parseEther('0.0001')) {
        throw new Error(
          '⚠️ Insufficient Base ETH for gas fees. You need Base ETH to pay for the transaction. ' +
          'You can bridge ETH to Base at bridge.base.org'
        );
      }

      // 2. Check $BB balance using public RPC (Farcaster provider has issues with read calls)
      console.log('📊 Checking $BB balance...');
      const bbTokenContractReadOnly = new ethers.Contract(
        CONTRACT_CONFIG.bbTokenAddress,
        ERC20_ABI,
        publicBaseProvider // Use public RPC instead of user's wallet provider
      );

      const currentBBBalance = await bbTokenContractReadOnly.balanceOf(walletAddress);
      console.log('$BB balance:', ethers.formatEther(currentBBBalance), 'BB');

      // Calculate total cost for the mint amount using bonding curve
      const totalCostWei = calculateTotalCost();
      console.log('Total cost for', mintAmount, 'NFT(s):', ethers.formatEther(totalCostWei), 'BB');

      if (currentBBBalance < BigInt(totalCostWei)) {
        const requiredFormatted = Number(ethers.formatEther(totalCostWei)).toLocaleString(undefined, { maximumFractionDigits: 2 });
        const balanceFormatted = Number(ethers.formatEther(currentBBBalance)).toLocaleString(undefined, { maximumFractionDigits: 2 });
        throw new Error(
          `⚠️ Insufficient $BB balance. You need ${requiredFormatted} $BB but only have ${balanceFormatted} $BB`
        );
      }

      // 3. Check $BB allowance using public RPC
      const currentAllowance = await bbTokenContractReadOnly.allowance(walletAddress, CONTRACT_CONFIG.address);
      console.log('$BB allowance:', ethers.formatEther(currentAllowance), 'BB');

      if (currentAllowance < BigInt(totalCostWei)) {
        throw new Error(
          '⚠️ Insufficient $BB allowance. Please approve $BB tokens first using the Approve button.'
        );
      }

      console.log('✅ All pre-flight checks passed!');

      const nftContract = new ethers.Contract(
        CONTRACT_CONFIG.address,
        NFT_ABI,
        signer
      );

      console.log('Minting', mintAmount, 'NFT(s) for token ID', CONTRACT_CONFIG.tokenId);

      // Try to mint with explicit gas limit as fallback for providers with gas estimation issues
      let tx;
      try {
        tx = await nftContract.mint(CONTRACT_CONFIG.tokenId, mintAmount);
      } catch (gasError: any) {
        console.warn('Gas estimation failed, trying with manual gas limit:', gasError);
        // Fallback: Use a higher gas limit for minting (typically ~200k, we'll use 300k for safety)
        tx = await nftContract.mint(CONTRACT_CONFIG.tokenId, mintAmount, {
          gasLimit: 300000
        });
      }
      console.log('Mint tx sent:', tx.hash);
      setTransactionHash(tx.hash);

      // Wait for confirmation using public RPC (Farcaster provider doesn't support eth_getTransactionReceipt)
      await waitForTransaction(tx.hash);
      console.log('Mint confirmed!');

      setMintStep('success');

      // Reload data
      await loadStats();
      await loadBBBalance();
      await loadBBAllowance();
    } catch (error: any) {
      console.error('Mint failed:', error);
      setMintStep('error');

      // Parse error message for user-friendly display
      let errorMsg = error?.message || 'Failed to mint NFT';

      if (errorMsg.includes('Pop up window failed to open') || error?.code === -32603) {
        errorMsg = '⚠️ Wallet popup blocked!\n\n' +
          'Your browser is blocking the wallet confirmation popup. Please:\n' +
          '1. Allow popups for this site in your browser settings\n' +
          '2. Look for a popup blocker icon in your address bar\n' +
          '3. Try again after allowing popups';
      } else if (errorMsg.includes('InsufficientBBBalance')) {
        errorMsg = 'Insufficient BB token balance';
      } else if (errorMsg.includes('InsufficientBBAllowance')) {
        errorMsg = 'Please approve BB tokens first';
      } else if (errorMsg.includes('ExceedsMaxSupply')) {
        errorMsg = 'Sold out! All NFTs have been minted';
      } else if (errorMsg.includes('ExceedsMaxPerWallet')) {
        errorMsg = 'You have reached the maximum of 5 NFTs per wallet';
      } else if (errorMsg.includes('ContractPaused')) {
        errorMsg = 'Minting is currently paused';
      } else if (errorMsg.includes('user rejected')) {
        errorMsg = 'Transaction cancelled';
      }

      setErrorMessage(errorMsg);
    }
  };

  const formatBB = (amount: string): string => {
    // Convert from wei (18 decimals) to tokens
    const num = parseFloat(amount) / 1e18;
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    return num.toLocaleString();
  };

  const totalCost = calculateTotalCost();
  const progressPercent = stats ? (stats.totalMinted / CONTRACT_CONFIG.maxSupply) * 100 : 0;

  // Calculate current price based on totalMinted (client-side bonding curve)
  const nextMintPrice = stats ? (() => {
    const startPrice = BigInt(CONTRACT_CONFIG.startingPrice);
    const endPrice = BigInt(CONTRACT_CONFIG.endingPrice);
    const maxSupply = BigInt(CONTRACT_CONFIG.maxSupply);
    const minted = BigInt(stats.totalMinted);

    const priceIncrease = (endPrice - startPrice) * minted / maxSupply;
    const currentPrice = startPrice + priceIncrease;

    return currentPrice.toString();
  })() : '0';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-gem-crystal animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-8">
      <div className="max-w-5xl mx-auto">

        {/* Back Button */}
        <Link
          href="/nft"
          className="inline-flex items-center gap-2 text-gem-crystal hover:text-gem-gold mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Gallery
        </Link>

        {/* Success State */}
        {mintStep === 'success' && (
          <div ref={successSectionRef} className="bg-gradient-to-br from-gem-crystal/20 to-gem-gold/20 border border-gem-crystal/30 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gem-crystal/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-6 h-6 text-gem-crystal" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gem-crystal mb-2">
                  Mint Successful! 🎉
                </h3>
                <p className="text-gray-300 mb-4">
                  You've successfully minted {mintAmount} BizBe's Booty Shake NFT{mintAmount > 1 ? 's' : ''}!
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://basescan.org/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-dark-bg border border-gem-crystal text-gem-crystal px-4 py-2 rounded-lg hover:bg-gem-crystal/10 transition-all text-sm"
                  >
                    View Transaction
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <Link
                    href="/nft/collection/in-app-exclusive"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg px-4 py-2 rounded-lg font-bold hover:shadow-lg transition-all text-sm"
                  >
                    View Collection
                  </Link>
                </div>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="mt-6 pt-6 border-t border-gem-crystal/20">
              <p className="text-sm text-gray-400 mb-3">Share your mint:</p>
              <ShareButtons
                customText={`Just minted BizBe's Booty Shake NFT! ✨\n\nMint #${stats?.totalMinted} of the In-App Exclusive collection.\n\nOnly ${stats?.remainingSupply} left! Get yours with $BB tokens:\n\nhttps://bbapp.bizarrebeasts.io/nft/mint/in-app-exclusive`}
                contextUrl="https://bbapp.bizarrebeasts.io/nft/mint/in-app-exclusive"
              />
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">

          {/* Left: NFT Preview */}
          <div>
            <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-pink/10 border border-gem-pink/30 rounded-2xl overflow-hidden">
              {/* Animated GIF */}
              <div className="aspect-square bg-gradient-to-br from-gem-crystal/20 via-gem-gold/20 to-gem-pink/20 flex items-center justify-center relative overflow-hidden">
                <img
                  src="/assets/nft/nfts-for-inapp-mint/treasure-quest-inapp-exclusive-bizbe-booty-shaking-animation-1.gif"
                  alt="BizBe's Booty Shake"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-gem-gold/20 text-gem-gold px-3 py-1 rounded-full text-xs font-bold">
                    IN-APP EXCLUSIVE
                  </div>
                  <div className="bg-gem-crystal/20 text-gem-crystal px-3 py-1 rounded-full text-xs font-bold">
                    EDITION 1
                  </div>
                </div>

                <h1 className="text-3xl font-bold bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent mb-3">
                  BizBe's Booty Shake
                </h1>

                <p className="text-gray-300 mb-4 text-sm">
                  The first-ever BizarreBeasts In-App Exclusive NFT! Watch BizBe shake their legendary booty in this animated collectible.
                </p>

                {/* Proceeds Info */}
                <div className="bg-dark-bg/50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-gem-gold" />
                    <span className="font-semibold text-gem-gold">Proceeds Allocation</span>
                  </div>
                  <div className="text-sm text-gray-300">
                    100% of proceeds used to fund community rewards, treasury drops, and token burns
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-dark-bg/30 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Max Supply</div>
                    <div className="text-lg font-bold text-gem-crystal">{CONTRACT_CONFIG.maxSupply}</div>
                  </div>
                  <div className="bg-dark-bg/30 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Max Per Wallet</div>
                    <div className="text-lg font-bold text-gem-gold">{CONTRACT_CONFIG.maxPerWallet}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Minting Interface */}
          <div>
            {/* Combined Pricing & Progress */}
            <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-gold/5 border border-gem-gold/20 rounded-2xl p-6 mb-6">
              {/* Dynamic Pricing */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Coins className="w-5 h-5 text-gem-gold" />
                  <span className="font-semibold">Dynamic Pricing</span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Current Price:</span>
                    <span className="text-2xl font-bold text-gem-gold">
                      {formatBB(nextMintPrice)} BB
                    </span>
                  </div>

                  <div className="bg-dark-bg/30 rounded-lg p-3 text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-400">Starting Price:</span>
                      <span className="text-gem-crystal">{formatBB(CONTRACT_CONFIG.startingPrice)} BB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Final Price:</span>
                      <span className="text-gem-pink">{formatBB(CONTRACT_CONFIG.endingPrice)} BB</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400">
                    💡 Price increases with each mint. Early supporters get the best deals!
                  </div>
                </div>
              </div>

              {/* Mint Progress */}
              <div className="pt-6 border-t border-gem-gold/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-gem-crystal" />
                    <span className="font-semibold">Mint Progress</span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {stats?.totalMinted || 0} / {CONTRACT_CONFIG.maxSupply}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-dark-bg/50 rounded-full h-3 mb-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="text-sm text-gray-400">
                  {stats?.remainingSupply || 0} remaining
                </div>
              </div>
            </div>

            {/* Wallet Connect Section */}
            {!walletConnected && (
              <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-crystal/10 border-2 border-gem-crystal/40 rounded-2xl p-6 mb-6 shadow-lg shadow-gem-crystal/20">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink bg-clip-text text-transparent">
                    Connect Wallet to Mint
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Mint with <span className="font-bold text-gem-gold">$BB tokens</span> on Base
                  </p>

                  <p className="text-sm text-gray-400">
                    Use the wallet button in the top navigation to connect your wallet.
                  </p>

                  <div className="text-xs text-gray-500 mt-4">
                    Live on Base Mainnet
                  </div>
                </div>
              </div>
            )}

            {/* Full minting UI */}
            {walletConnected && (
              <div className="bg-gradient-to-br from-dark-card via-dark-card to-gem-crystal/5 border border-gem-crystal/20 rounded-2xl p-6">

                {/* BB Balance */}
                <div className="bg-dark-bg/30 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Your BB Balance:</span>
                    <span className="font-bold text-lg">
                      {formatBB(bbBalance)} BB
                    </span>
                  </div>
                  {!hasEnoughBB() && (
                    <Link
                      href="/swap"
                      className="block w-full bg-gem-crystal/10 border border-gem-crystal/30 text-gem-crystal px-4 py-2 rounded-lg hover:bg-gem-crystal/20 transition-all text-center text-sm mt-2"
                    >
                      Buy BB Tokens →
                    </Link>
                  )}
                </div>

                {/* Amount Selector */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold">Amount to Mint:</label>
                    <span className="text-xs text-gray-400">
                      Max {stats?.userCanMint || 0} more
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => setMintAmount(num)}
                        disabled={num > (stats?.userCanMint || 0)}
                        className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                          mintAmount === num
                            ? 'bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg'
                            : num > (stats?.userCanMint || 0)
                            ? 'bg-dark-bg/30 text-gray-600 cursor-not-allowed'
                            : 'bg-dark-bg/50 text-gray-300 hover:bg-dark-bg'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Total Cost */}
                <div className="bg-dark-bg/50 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Cost:</span>
                    <span className="text-2xl font-bold text-gem-gold">
                      {formatBB(totalCost)} BB
                    </span>
                  </div>
                </div>

                {/* PWA Warning */}
                {showPWAWarning && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-yellow-400 mb-1">⚠️ PWA Mode Detected</div>
                        <div className="text-sm text-gray-300">
                          You're using the installed app (PWA). To mint NFTs with Coinbase Wallet, please open this page in your browser instead:
                          <div className="mt-2">
                            <a
                              href={window.location.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-yellow-400 hover:text-yellow-300 underline"
                            >
                              Open in Browser
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <div className="mt-2 text-xs text-gray-400">
                            Or use desktop browser to mint
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {mintStep === 'error' && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-red-400 mb-1">Error</div>
                        <div className="text-sm text-gray-300 whitespace-pre-line">{errorMessage}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Approve Button */}
                {needsApproval() && (
                  <button
                    onClick={handleApprove}
                    disabled={!hasEnoughBB() || mintStep === 'approving'}
                    className="w-full bg-gem-crystal text-dark-bg px-6 py-4 rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-3 flex items-center justify-center gap-2"
                  >
                    {mintStep === 'approving' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Approve BB Tokens
                      </>
                    )}
                  </button>
                )}

                {/* Mint Button */}
                <button
                  onClick={handleMint}
                  disabled={
                    !hasEnoughBB() ||
                    needsApproval() ||
                    mintStep === 'minting' ||
                    mintStep === 'approving' ||
                    (stats?.userCanMint || 0) === 0
                  }
                  className="w-full bg-gradient-to-r from-gem-crystal via-gem-gold to-gem-pink text-dark-bg px-6 py-4 rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {mintStep === 'minting' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Minting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Mint {mintAmount} NFT{mintAmount > 1 ? 's' : ''}
                    </>
                  )}
                </button>

                {(stats?.userCanMint || 0) === 0 && (
                  <p className="text-center text-sm text-gray-400 mt-3">
                    You've reached the max of {CONTRACT_CONFIG.maxPerWallet} per wallet
                  </p>
                )}

                {/* Debug Info & Refresh */}
                <div className="mt-4 pt-4 border-t border-gray-700/30 text-xs text-gray-500">
                  <div className="flex justify-between items-center">
                    <span>Allowance: {bbAllowance === '0' ? 'Not approved' : '✓ Approved'}</span>
                    <button
                      onClick={() => {
                        console.log('🔄 Manually refreshing allowance...');
                        loadBBAllowance();
                      }}
                      className="text-gem-crystal hover:text-gem-gold underline"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
