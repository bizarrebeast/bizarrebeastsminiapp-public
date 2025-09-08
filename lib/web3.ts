/**
 * Web3 Integration with Reown AppKit
 * Handles wallet connections and Empire ranking integration
 */

import { createAppKit } from '@reown/appkit';
import { mainnet, base, arbitrum, polygon } from '@reown/appkit/networks';
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
        networks: [base, mainnet, arbitrum, polygon], // Base first as it's where $BB is
        defaultNetwork: base,
        projectId: PROJECT_ID,
        metadata: {
          name: 'BizarreBeasts Miniapp',
          description: 'Create epic memes with BizarreBeasts - Empire powered features',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://app.bizarrebeats.io',
          icons: ['/icon.png']
        },
        features: {
          analytics: true,       // Enable analytics
          email: false,          // Disable email login
          socials: false,        // Disable social logins
          onramp: true,         // Enable crypto on-ramp
          swaps: false          // Disable swaps
        },
        themeMode: 'dark',
        themeVariables: {
          // Core colors
          '--w3m-color-mix': '#1a1a1a',
          '--w3m-color-mix-strength': 40,
          '--w3m-accent': '#44D0A7',
          
          // Background colors
          '--w3m-background-color': '#000000',
          '--w3m-background-color-secondary': '#0a0a0a',
          '--w3m-background-border-radius': '8px',
          '--w3m-container-border-radius': '8px',
          '--w3m-wallet-icon-border-radius': '8px',
          '--w3m-input-border-radius': '8px',
          '--w3m-button-border-radius': '8px',
          '--w3m-secondary-button-border-radius': '8px',
          '--w3m-icon-button-border-radius': '8px',
          '--w3m-button-hover-highlight-border-radius': '8px',
          
          // Text colors
          '--w3m-text-primary-color': '#ffffff',
          '--w3m-text-secondary-color': '#888888',
          
          // Other
          '--w3m-overlay-background-color': 'rgba(0, 0, 0, 0.8)',
          '--w3m-overlay-backdrop-filter': 'blur(4px)',
          '--w3m-z-index': 9999,
          '--w3m-font-family': 'system-ui, -apple-system, sans-serif',
          '--w3m-font-size-master': '14px'
        }
      });

      // Set up event listeners
      this.setupEventListeners();
      
      // Inject custom CSS to override modal colors
      this.injectCustomModalStyles();
      
      this.isInitialized = true;
      console.log('Web3Service initialized with Reown AppKit');

      // Auto-connect if previously connected
      await this.checkConnection();
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

    // Listen for account changes
    this.appKit.subscribeState(async (state: any) => {
      const newAddress = state.address || null;
      
      if (newAddress !== this.currentState.address) {
        // Address changed
        if (newAddress) {
          // Wallet connected - fetch Empire data
          const empireData = await empireService.getUserByAddress(newAddress);
          
          this.currentState = {
            isConnected: true,
            address: newAddress,
            ensName: state.ensName || null,
            empireRank: empireData?.rank || null,
            empireScore: empireData?.balance || null,
            empireTier: empireService.getUserTier(empireData?.rank || null)
          };
        } else {
          // Wallet disconnected
          this.currentState = {
            isConnected: false,
            address: null,
            ensName: null,
            empireRank: null,
            empireScore: null,
            empireTier: AccessTier.VISITOR
          };
        }
        
        // Notify all listeners
        this.notifyStateChange();
      }
    });
  }

  /**
   * Open wallet connection modal
   */
  async connect(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    await this.appKit.open();
  }

  /**
   * Disconnect wallet
   */
  async disconnect(): Promise<void> {
    if (!this.appKit) return;
    
    await this.appKit.disconnect();
    
    this.currentState = {
      isConnected: false,
      address: null,
      ensName: null,
      empireRank: null,
      empireScore: null,
      empireTier: AccessTier.VISITOR
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
    
    const state = this.appKit.getState();
    
    if (state.address) {
      // Fetch Empire data for connected wallet
      const empireData = await empireService.getUserByAddress(state.address);
      
      this.currentState = {
        isConnected: true,
        address: state.address,
        ensName: state.ensName || null,
        empireRank: empireData?.rank || null,
        empireScore: empireData?.balance || null,
        empireTier: empireService.getUserTier(empireData?.rank || null)
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
   * Get signer for transactions
   */
  async getSigner(): Promise<ethers.Signer | null> {
    if (!this.currentState.isConnected) return null;
    
    const provider = await this.getProvider();
    if (!provider) return null;
    
    return provider.getSigner();
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
   * Format address for display
   */
  formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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