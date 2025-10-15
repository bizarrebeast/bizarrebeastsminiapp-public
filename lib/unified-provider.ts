/**
 * Unified Provider for both Farcaster and Web3 contexts
 * Handles getting Ethereum provider regardless of wallet connection source
 */

import { ethers } from 'ethers';
import sdk from '@farcaster/miniapp-sdk';
import { isInFarcasterMiniapp } from './farcaster-miniapp';
import { web3Service } from './web3';

/**
 * Get Ethereum provider from either Farcaster SDK or web3Service
 * @returns ethers provider or null
 */
export async function getUnifiedProvider(): Promise<ethers.BrowserProvider | ethers.JsonRpcProvider | null> {
  try {
    // PRIORITY 1: Always use async SDK check as source of truth
    const isInMiniApp = await sdk.isInMiniApp();
    console.log('🔍 [unified-provider] sdk.isInMiniApp() (async SDK check):', isInMiniApp);

    // Also check cached value for comparison
    const inMiniapp = isInFarcasterMiniapp();
    console.log('🔍 [unified-provider] isInFarcasterMiniapp() (cached):', inMiniapp);

    if (isInMiniApp || inMiniapp) {
      console.log('📱 Getting provider from Farcaster SDK');

      if (isInMiniApp) {
        // PRIORITY 1: Try async getEthereumProvider() method (most reliable)
        try {
          console.log('🔍 Trying sdk.wallet.getEthereumProvider()...');
          const ethProvider = await sdk.wallet.getEthereumProvider();
          console.log('🔍 [unified-provider] getEthereumProvider returned:', ethProvider ? 'Provider object' : 'null');

          if (ethProvider) {
            console.log('✅ Got provider from getEthereumProvider(), creating BrowserProvider...');

            try {
              // Don't force network - let it auto-detect to avoid NETWORK_ERROR
              const provider = new ethers.BrowserProvider(ethProvider);
              console.log('✅ BrowserProvider created successfully');

              // Check what network we're on
              console.log('🔍 Checking network...');
              const network = await provider.getNetwork();
              const currentChainId = Number(network.chainId);
              console.log('📱 Farcaster provider network:', {
                chainId: currentChainId,
                name: network.name,
                isBase: currentChainId === 8453
              });

              // If not on Base, try to switch
              if (currentChainId !== 8453) {
                console.log('⚠️ Not on Base network, attempting to switch...');
                try {
                  await ethProvider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x2105' }], // 8453 in hex
                  });
                  console.log('✅ Successfully switched to Base network');

                  // Re-verify network after switch
                  const newNetwork = await provider.getNetwork();
                  console.log('✅ Confirmed on Base:', Number(newNetwork.chainId) === 8453);
                } catch (switchError: any) {
                  // If chain doesn't exist, try adding it
                  if (switchError.code === 4902) {
                    console.log('⚠️ Base network not found, attempting to add...');
                    try {
                      await ethProvider.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                          chainId: '0x2105',
                          chainName: 'Base',
                          nativeCurrency: {
                            name: 'Ether',
                            symbol: 'ETH',
                            decimals: 18,
                          },
                          rpcUrls: ['https://mainnet.base.org'],
                          blockExplorerUrls: ['https://basescan.org'],
                        }],
                      });
                      console.log('✅ Added and switched to Base network');
                    } catch (addError) {
                      console.error('❌ Failed to add Base network:', addError);
                      throw new Error('Please switch to Base network manually');
                    }
                  } else {
                    console.error('❌ Failed to switch network:', switchError);
                    throw new Error('Please switch to Base network manually');
                  }
                }
              }

              console.log('✅ [unified-provider] Returning BrowserProvider');
              return provider;
            } catch (providerError) {
              console.error('❌ [unified-provider] Error creating BrowserProvider or getting network:', providerError);
              // Continue to fallback
            }
          } else {
            console.log('⚠️ [unified-provider] getEthereumProvider returned null');
          }
        } catch (error) {
          console.log('⚠️ getEthereumProvider() call failed:', error);
        }

        // PRIORITY 2: Try property accessor as fallback
        if (sdk.wallet?.ethProvider) {
          console.log('✅ Got provider from ethProvider property');
          try {
            // Don't force network - let it auto-detect
            const provider = new ethers.BrowserProvider(sdk.wallet.ethProvider);

            const network = await provider.getNetwork();
            const currentChainId = Number(network.chainId);
            console.log('📱 Farcaster provider network:', {
              chainId: currentChainId,
              name: network.name,
              isBase: currentChainId === 8453
            });

            // If not on Base, try to switch
            if (currentChainId !== 8453) {
              console.log('⚠️ [ethProvider property] Not on Base, attempting to switch...');
              await sdk.wallet.ethProvider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x2105' }],
              });
            }

            return provider;
          } catch (error) {
            console.error('❌ Error with ethProvider property:', error);
            // Continue to fallback
          }
        }

        console.warn('📱 Farcaster SDK wallet not available, but SDK confirmed we are in miniapp');
        console.log('🔍 [unified-provider] Creating read-only JsonRpcProvider fallback...');
        // In Farcaster context but wallet not ready, assume Base network
        // Return a default Base provider (read-only) - using LlamaRPC for better reliability
        const fallbackProvider = new ethers.JsonRpcProvider('https://base.llamarpc.com');
        console.log('✅ [unified-provider] Returning JsonRpcProvider fallback');
        return fallbackProvider;
      } else {
        // We're in miniapp context (cached check), but SDK says no
        // Still return read-only fallback instead of null
        console.warn('⚠️ [unified-provider] Cache says miniapp, but sdk.isInMiniApp() returned false');
        console.log('🔍 [unified-provider] Returning read-only JsonRpcProvider fallback (SDK check failed)');
        return new ethers.JsonRpcProvider('https://base.llamarpc.com');
      }
    } else {
      console.log('🌐 Getting provider from web3Service');
      // Not in Farcaster, use regular web3Service
      return await web3Service.getProvider();
    }
  } catch (error) {
    console.error('❌ [unified-provider] OUTER CATCH - Error getting unified provider:', error);
    console.error('❌ [unified-provider] Error type:', typeof error);
    console.error('❌ [unified-provider] Error message:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Check if connected to Base network
 * @returns true if on Base, false otherwise
 */
export async function isOnBaseNetwork(): Promise<boolean> {
  try {
    // In Farcaster, assume Base network (it's the default)
    const inMiniapp = isInFarcasterMiniapp();
    if (inMiniapp) {
      console.log('📱 In Farcaster miniapp - assuming Base network');
      return true; // Farcaster wallets default to Base
    }

    // Otherwise check via provider
    const provider = await getUnifiedProvider();
    if (!provider) {
      console.log('⚠️ No provider available - defaulting to Base assumption');
      return true; // Optimistic: assume Base when no provider (user likely in Farcaster or will be prompted to connect)
    }

    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    const isBase = chainId === 8453;

    console.log('🌐 Network check:', {
      chainId,
      isBase,
      networkName: network.name
    });

    return isBase;
  } catch (error) {
    console.error('Error checking Base network:', error);
    // Default to true in case of error (optimistic)
    console.log('⚠️ Network check failed - defaulting to Base assumption');
    return true;
  }
}

/**
 * Get signer for transactions
 * @returns ethers signer or null
 */
export async function getUnifiedSigner(): Promise<ethers.JsonRpcSigner | null> {
  try {
    const provider = await getUnifiedProvider();
    if (!provider) return null;

    const signer = await provider.getSigner();
    return signer;
  } catch (error) {
    console.error('Error getting unified signer:', error);
    return null;
  }
}