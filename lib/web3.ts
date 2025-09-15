/**
 * Web3 Integration with Reown AppKit
 * Handles wallet connections and Empire ranking integration
 */

import { createAppKit } from '@reown/appkit';
import { mainnet, base, arbitrum, polygon, baseSepolia } from '@reown/appkit/networks';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { ethers } from 'ethers';
import { empireService, AccessTier } from './empire';

// Reown Project ID
const PROJECT_ID = '569afd0d3f8efc1ba7a63a57045ee717';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  ensName?: string | null;
  empireRank?: number | null;
  empireScore?: string | null;
  empireTier?: AccessTier;
}

class Web3Service {
  private static instance: Web3Service;
  private appKit: any = null;
  private ethersAdapter: any = null;
  private isInitialized: boolean = false;
  private currentState: WalletState = {
    isConnected: false,
    address: null,
  };
  private stateChangeCallbacks: ((state: WalletState) => void)[] = [];

  static getInstance(): Web3Service {
    if (!Web3Service.instance) {
      Web3Service.instance = new Web3Service();
    }
    return Web3Service.instance;
  }

  /**
   * Initialize Reown AppKit with ethers adapter
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create ethers adapter
      this.ethersAdapter = new EthersAdapter();

      // Create the AppKit instance
      this.appKit = createAppKit({
        adapters: [this.ethersAdapter],
        networks: [base], // Only Base network to force it
        defaultNetwork: base,
        projectId: PROJECT_ID,
        metadata: {
          name: 'BizarreBeasts Miniapp',
          description: 'Create epic memes with BizarreBeasts - Empire powered features',
          url: 'https://bbapp.bizarrebeasts.io', // Use consistent URL for CORS
          icons: ['https://bbapp.bizarrebeasts.io/icon.png']
        },
        features: {
          analytics: true,       // Enable analytics
          email: false,          // Disable email login
          socials: false,        // Disable social logins
          onramp: true,         // Enable crypto on-ramp
          swaps: false,          // Disable swaps
          allWallets: true      // Show all wallets including Smart Wallet
        },
        // Coinbase configuration for Smart Wallet
        enableCoinbase: true,    // Enable Coinbase support
        coinbasePreference: 'all', // Support both regular and smart wallet
        themeMode: 'dark',
        themeVariables: {
          // Core colors
          '--w3m-color-mix': '#1a1a1a',
          '--w3m-color-mix-strength': 40,
          '--w3m-accent': '#44D0A7',
          
          // Border radius
          '--w3m-border-radius-master': '8px',
          
          // Z-index
          '--w3m-z-index': 9999
        } as any,
        // Featured wallets - Coinbase first for Smart Wallet
        featuredWalletIds: [
          'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet (includes Smart Wallet)
          '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
          'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
          '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
        ],
        // Enable debug mode to see what's happening
        debug: false,
        // Enable auto-reconnection
        enableOnramp: true
      } as any);

      // Set up event listeners
      this.setupEventListeners();
      
      // Inject custom CSS to override modal colors
      this.injectCustomModalStyles();
      
      this.isInitialized = true;
      console.log('Web3Service initialized with Reown AppKit');

      // Auto-connect if previously connected - add delay for AppKit to fully initialize
      setTimeout(async () => {
        await this.checkConnection();
      }, 500);
    } catch (error) {
      console.error('Failed to initialize Web3Service:', error);
      throw error;
    }
  }

  /**
   * Set up event listeners for wallet events
   */
  private setupEventListeners(): void {
    if (!this.appKit) return;

    // Subscribe to all state changes
    this.appKit.subscribeState(async (newState: any) => {
      console.log('WalletConnect state changed:', newState);
      
      const newAddress = newState.address || null;
      const wasConnected = this.currentState.isConnected;
      const isNowConnected = !!newAddress;
      
      // Update if connection status or address changed
      if (wasConnected !== isNowConnected || newAddress !== this.currentState.address) {
        if (newAddress) {
          // Wallet connected - fetch Empire data
          console.log('Wallet connected:', newAddress);

          // Force switch to Base network if on wrong network
          await this.switchToBase();

          const empireData = await empireService.getUserByAddress(newAddress);

          this.currentState = {
            isConnected: true,
            address: newAddress,
            ensName: newState.ensName || null,
            empireRank: empireData?.rank || null,
            empireScore: empireData?.balance || null,
            empireTier: empireService.getUserTier(empireData?.rank || null)
          };
        } else {
          // Wallet disconnected
          console.log('Wallet disconnected');
          this.currentState = {
            isConnected: false,
            address: null,
            ensName: null,
            empireRank: null,
            empireScore: null,
            empireTier: AccessTier.NORMIE
          };
        }
        
        // Notify all listeners
        this.notifyStateChange();
      }
    });

    // Also subscribe to account changes specifically
    if (this.appKit.subscribeAccount) {
      this.appKit.subscribeAccount(async (account: any) => {
        console.log('Account changed:', account);
        if (account?.address && account.address !== this.currentState.address) {
          const empireData = await empireService.getUserByAddress(account.address);
          
          this.currentState = {
            isConnected: true,
            address: account.address,
            ensName: account.ensName || null,
            empireRank: empireData?.rank || null,
            empireScore: empireData?.balance || null,
            empireTier: empireService.getUserTier(empireData?.rank || null)
          };
          
          this.notifyStateChange();
        }
      });
    }
  }

  /**
   * Open wallet connection modal
   */
  async connect(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Just open the modal - let Reown handle the mobile/desktop detection
    await this.appKit.open();
    
    // Check connection after modal interaction
    setTimeout(async () => {
      await this.checkConnection();
    }, 1000);
  }


  /**
   * Disconnect wallet
   */
  async disconnect(): Promise<void> {
    // Disconnect from AppKit if connected
    if (this.appKit) {
      await this.appKit.disconnect();
    }
    
    this.currentState = {
      isConnected: false,
      address: null,
      ensName: null,
      empireRank: null,
      empireScore: null,
      empireTier: AccessTier.NORMIE
    };
    
    this.notifyStateChange();
  }

  /**
   * Inject custom CSS to override modal colors
   */
  private injectCustomModalStyles(): void {
    const styleId = 'bb-w3m-custom-styles';
    
    // Check if styles already exist
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      /* Override WalletConnect Modal colors */
      w3m-modal, w3m-router {
        --w3m-color-mix: #000000 !important;
        --w3m-accent: #44D0A7 !important;
        --w3m-background-color: #000000 !important;
      }
      
      /* Dark background for modal */
      w3m-modal::part(container) {
        background: #000000 !important;
      }
      
      /* Override yellow/gold colors */
      w3m-modal [data-variant="fill-primary"] {
        background: #44D0A7 !important;
        color: #000000 !important;
      }
      
      /* Wallet list items */
      w3m-wallet-button {
        background: #0a0a0a !important;
        border-color: #1a1a1a !important;
      }
      
      w3m-wallet-button:hover {
        background: #1a1a1a !important;
      }
      
      /* Headers and text */
      w3m-modal h1, w3m-modal h2, w3m-modal h3 {
        color: #ffffff !important;
      }
      
      w3m-modal p, w3m-modal span {
        color: #888888 !important;
      }
      
      /* Buttons */
      w3m-button[variant="fill-primary"] {
        background: linear-gradient(90deg, #FFD700, #44D0A7) !important;
        color: #000000 !important;
      }
      
      /* Remove any yellow backgrounds */
      [style*="background-color: rgb(255, 215, 0)"],
      [style*="background: rgb(255, 215, 0)"] {
        background: #44D0A7 !important;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Check current connection status
   */
  async checkConnection(): Promise<void> {
    if (!this.appKit) return;
    
    // Get the current state from AppKit
    const state = this.appKit.getState();
    console.log('Checking connection, current state:', state);
    
    // Check if we have an active account
    const account = this.appKit.getAccount?.() || state.account || state;
    const address = account?.address || state?.address;
    
    if (address) {
      console.log('Found connected wallet:', address);
      // Fetch Empire data for connected wallet
      const empireData = await empireService.getUserByAddress(address);
      
      this.currentState = {
        isConnected: true,
        address: address,
        ensName: account?.ensName || state?.ensName || null,
        empireRank: empireData?.rank || null,
        empireScore: empireData?.balance || null,
        empireTier: empireService.getUserTier(empireData?.rank || null)
      };
      
      this.notifyStateChange();
    } else {
      console.log('No wallet connected');
      this.currentState = {
        isConnected: false,
        address: null,
        ensName: null,
        empireRank: null,
        empireScore: null,
        empireTier: AccessTier.NORMIE
      };
      
      this.notifyStateChange();
    }
  }

  /**
   * Get current wallet state
   */
  getState(): WalletState {
    return { ...this.currentState };
  }

  /**
   * Subscribe to wallet state changes
   */
  onStateChange(callback: (state: WalletState) => void): () => void {
    this.stateChangeCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.stateChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.stateChangeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyStateChange(): void {
    const state = this.getState();
    this.stateChangeCallbacks.forEach(callback => callback(state));
  }

  /**
   * Get provider
   */
  async getProvider(): Promise<ethers.BrowserProvider | null> {
    if (!this.appKit) return null;

    const walletProvider = await this.appKit.getWalletProvider();
    if (!walletProvider) return null;

    return new ethers.BrowserProvider(walletProvider);
  }

  /**
   * Get signer for contract interactions
   */
  async getSigner(): Promise<ethers.Signer | null> {
    const provider = await this.getProvider();
    if (!provider) return null;

    try {
      const signer = await provider.getSigner();
      return signer;
    } catch (error) {
      console.error('Failed to get signer:', error);
      return null;
    }
  }

  /**
   * Format address for display
   */
  formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Switch to Base network if on wrong network
   */
  async switchToBase(): Promise<void> {
    try {
      const provider = await this.getProvider();
      if (!provider) return;

      // Get current network
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);

      // Base mainnet chain ID is 8453
      const BASE_CHAIN_ID = 8453;

      if (currentChainId !== BASE_CHAIN_ID) {
        console.log(`Current network: ${currentChainId}, switching to Base (${BASE_CHAIN_ID})`);

        // Request network switch
        const walletProvider = await this.appKit.getWalletProvider();
        if (walletProvider && walletProvider.request) {
          try {
            // Try to switch to Base network
            await walletProvider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${BASE_CHAIN_ID.toString(16)}` }]
            });
            console.log('Successfully switched to Base network');
          } catch (switchError: any) {
            // If the chain is not added, add it
            if (switchError.code === 4902) {
              console.log('Base network not found, adding it...');
              await walletProvider.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${BASE_CHAIN_ID.toString(16)}`,
                  chainName: 'Base',
                  nativeCurrency: {
                    name: 'Ethereum',
                    symbol: 'ETH',
                    decimals: 18
                  },
                  rpcUrls: ['https://mainnet.base.org'],
                  blockExplorerUrls: ['https://basescan.org']
                }]
              });
              console.log('Base network added successfully');
            } else {
              console.error('Failed to switch network:', switchError);
            }
          }
        }
      } else {
        console.log('Already on Base network');
      }
    } catch (error) {
      console.error('Error in switchToBase:', error);
    }
  }

  /**
   * Refresh Empire data for current wallet
   */
  async refreshEmpireData(): Promise<void> {
    if (!this.currentState.address) return;

    // Clear cache to force fresh data
    empireService.clearCache();

    // Fetch updated Empire data
    const empireData = await empireService.getUserByAddress(this.currentState.address);

    this.currentState = {
      ...this.currentState,
      empireRank: empireData?.rank || null,
      empireScore: empireData?.balance || null,
      empireTier: empireService.getUserTier(empireData?.rank || null)
    };

    this.notifyStateChange();
  }
}

export const web3Service = Web3Service.getInstance();

// Expose globally for debugging and direct access
if (typeof window !== 'undefined') {
  (window as any).web3Service = web3Service;
}