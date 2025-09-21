import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AccessTier } from '@/lib/empire';
import { debounceAsync } from '@/lib/debounce';

// Types
export interface UnifiedAuthState {
  // User Identity
  userId: string | null;

  // Wallet Data
  walletAddress: string | null;
  walletConnected: boolean;
  walletEns: string | null;

  // Farcaster Data
  farcasterFid: number | null;
  farcasterUsername: string | null;
  farcasterDisplayName: string | null;
  farcasterPfpUrl: string | null;
  farcasterBio: string | null;
  farcasterConnected: boolean;

  // Verified Addresses (from Farcaster)
  verifiedAddresses: string[];
  walletIsVerified?: boolean; // Whether current wallet is in verified addresses

  // Connection Status
  identitiesLinked: boolean;
  linkedAt: string | null;
  primaryIdentity: 'wallet' | 'farcaster' | null;

  // Empire Protocol Data
  empireTier: AccessTier;
  empireRank: number | null;
  empireScore: string | null;

  // Session Management
  sessionToken: string | null;
  refreshToken: string | null;
  sessionExpiry: string | null;

  // UI State
  isLoading: boolean;
  error: string | null;

  // User Preferences
  preferences: {
    showWalletFirst?: boolean;
    autoConnect?: boolean;
    rememberMe?: boolean;
  };

  // Actions - Wallet
  connectWallet: (address: string) => Promise<void>;
  changeWallet: (newAddress: string) => Promise<void>;
  disconnectWallet: () => void;

  // Actions - Farcaster
  connectFarcaster: (userData: any) => Promise<void>;
  disconnectFarcaster: () => void;

  // Actions - Identity Linking
  linkIdentities: () => Promise<boolean>;
  unlinkIdentities: () => Promise<void>;
  checkLinkStatus: () => Promise<void>;

  // Actions - Profile
  refreshProfile: () => Promise<void>;
  updatePreferences: (prefs: any) => void;

  // Actions - Session
  createSession: (token: string, expiry: string) => void;
  clearSession: () => void;
  isSessionValid: () => boolean;

  // Actions - General
  disconnect: () => void;
  reset: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Initial state
const initialState = {
  userId: null,
  walletAddress: null,
  walletConnected: false,
  walletEns: null,
  farcasterFid: null,
  farcasterUsername: null,
  farcasterDisplayName: null,
  farcasterPfpUrl: null,
  farcasterBio: null,
  farcasterConnected: false,
  verifiedAddresses: [],
  identitiesLinked: false,
  linkedAt: null,
  primaryIdentity: null,
  empireTier: AccessTier.NORMIE,
  empireRank: null,
  empireScore: null,
  sessionToken: null,
  refreshToken: null,
  sessionExpiry: null,
  isLoading: false,
  error: null,
  preferences: {}
};

// Create debounced refresh function (shared across all store instances)
const debouncedRefreshProfile = debounceAsync(async (params: URLSearchParams) => {
  const response = await fetch(`/api/auth/profile?${params}`);
  const data = await response.json();
  return data;
}, 1000); // 1 second debounce

// Create the store
export const useUnifiedAuthStore = create<UnifiedAuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Connect wallet
      connectWallet: async (address: string) => {
        set({ isLoading: true, error: null });

        try {
          // Check if user exists with this wallet
          const linkResponse = await fetch(`/api/auth/link?walletAddress=${address}`);
          const linkData = await linkResponse.json();

          if (linkData.user) {
            // User exists, update state with their data
            set({
              userId: linkData.user.id,
              walletAddress: address,
              walletConnected: true,
              farcasterFid: linkData.user.farcasterFid,
              farcasterUsername: linkData.user.username,
              farcasterDisplayName: linkData.user.displayName,
              farcasterConnected: !!linkData.user.farcasterFid,
              identitiesLinked: linkData.linked,
              linkedAt: linkData.user.linkedAt,
              primaryIdentity: linkData.user.primaryIdentity || 'wallet'
            });

            // Fetch full profile
            await get().refreshProfile();
          } else {
            // New wallet, create user
            const createResponse = await fetch('/api/auth/link', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ walletAddress: address })
            });

            const createData = await createResponse.json();

            if (createData.success) {
              set({
                userId: createData.user.id,
                walletAddress: address,
                walletConnected: true,
                primaryIdentity: 'wallet'
              });
            }
          }

          set({ isLoading: false });
        } catch (error) {
          console.error('Connect wallet error:', error);
          set({ error: 'Failed to connect wallet', isLoading: false });
        }
      },

      // Change wallet (for Farcaster users who want to use a different wallet)
      changeWallet: async (newAddress: string) => {
        const state = get();

        // Only allow wallet change if Farcaster is connected
        if (!state.farcasterConnected) {
          set({ error: 'Must be connected with Farcaster to change wallet' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          // Use the update-wallet endpoint
          const response = await fetch('/api/auth/update-wallet', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              farcasterFid: state.farcasterFid,
              newWalletAddress: newAddress,
              oldWalletAddress: state.walletAddress
            })
          });

          const data = await response.json();

          if (data.success) {
            set({
              walletAddress: newAddress,
              walletConnected: true,
              // Note if wallet is not verified
              walletIsVerified: state.verifiedAddresses.some(
                (addr: string) => addr.toLowerCase() === newAddress.toLowerCase()
              )
            });

            // Refresh profile to get updated Empire data
            await get().refreshProfile();
          } else {
            set({ error: data.error || 'Failed to change wallet' });
          }
        } catch (error) {
          console.error('Change wallet error:', error);
          set({ error: 'Failed to change wallet' });
        } finally {
          set({ isLoading: false });
        }
      },

      // Disconnect wallet
      disconnectWallet: () => {
        set({
          walletAddress: null,
          walletConnected: false,
          walletEns: null,
          empireTier: AccessTier.NORMIE,
          empireRank: null,
          empireScore: null
        });

        // If no Farcaster connection, fully disconnect
        if (!get().farcasterConnected) {
          get().reset();
        }
      },

      // Connect Farcaster
      connectFarcaster: async (userData: any) => {
        console.log('🏪 [Store] connectFarcaster called with:', userData);
        set({ isLoading: true, error: null });

        try {
          const farcasterData = {
            farcasterFid: userData.fid,
            farcasterData: {
              username: userData.username,
              displayName: userData.display_name || userData.displayName,
              pfpUrl: userData.pfp_url || userData.pfpUrl,
              bio: userData.bio,
              verifiedAddresses: userData.verified_addresses || userData.verifiedAddresses || []
            }
          };

          // Check if user exists or create/update
          const response = await fetch('/api/auth/link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...farcasterData,
              walletAddress: get().walletAddress // Include wallet if connected
            })
          });

          const data = await response.json();

          // Handle both success and conflict (user already exists)
          if (data.success || response.status === 409) {
            const verifiedAddresses = userData.verified_addresses?.eth_addresses ||
                                     userData.verifiedAddresses ||
                                     [];

            // Don't auto-select wallet if user already has a different one connected
            // This allows users to keep their non-verified wallet
            const autoWalletAddress = get().walletAddress ||
              (!get().walletConnected && verifiedAddresses.length > 0 ? verifiedAddresses[0] : null);

            set({
              userId: data.user?.id || null,
              farcasterFid: userData.fid,
              farcasterUsername: userData.username,
              farcasterDisplayName: userData.display_name || userData.displayName,
              farcasterPfpUrl: userData.pfp_url || userData.pfpUrl,
              farcasterBio: userData.bio,
              farcasterConnected: true,
              verifiedAddresses: verifiedAddresses,
              walletAddress: autoWalletAddress,
              walletConnected: !!autoWalletAddress,
              walletIsVerified: autoWalletAddress ? verifiedAddresses.some(
                (addr: string) => addr.toLowerCase() === autoWalletAddress.toLowerCase()
              ) : undefined,
              identitiesLinked: data.user?.identities_linked || data.alreadyLinked || !!autoWalletAddress,
              linkedAt: data.user?.linked_at,
              primaryIdentity: data.user?.primary_identity || 'farcaster'
            });

            // Check for auto-linking
            if (data.autoLinked || autoWalletAddress) {
              set({ identitiesLinked: true });
            }

            // Skip refreshProfile to prevent overwriting correct SDK data
            // The SDK data should be the source of truth in Farcaster miniapp
            console.log('🚫 Skipping refreshProfile to preserve SDK data');
          }

          set({ isLoading: false });
        } catch (error) {
          console.error('Connect Farcaster error:', error);
          set({ error: 'Failed to connect Farcaster', isLoading: false });
        }
      },

      // Disconnect Farcaster
      disconnectFarcaster: () => {
        set({
          farcasterFid: null,
          farcasterUsername: null,
          farcasterDisplayName: null,
          farcasterPfpUrl: null,
          farcasterBio: null,
          farcasterConnected: false,
          verifiedAddresses: []
        });

        // If no wallet connection, fully disconnect
        if (!get().walletConnected) {
          get().reset();
        }
      },

      // Link identities
      linkIdentities: async () => {
        const state = get();

        if (!state.walletAddress || !state.farcasterFid) {
          set({ error: 'Both wallet and Farcaster must be connected to link' });
          return false;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/auth/link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress: state.walletAddress,
              farcasterFid: state.farcasterFid,
              farcasterData: {
                username: state.farcasterUsername,
                displayName: state.farcasterDisplayName,
                pfpUrl: state.farcasterPfpUrl,
                bio: state.farcasterBio,
                verifiedAddresses: state.verifiedAddresses
              }
            })
          });

          const data = await response.json();

          if (data.success) {
            set({
              identitiesLinked: true,
              linkedAt: data.user.linked_at || new Date().toISOString(),
              userId: data.user.id
            });

            // Refresh profile to get updated data
            await get().refreshProfile();

            set({ isLoading: false });
            return true;
          } else {
            set({ error: data.error || 'Failed to link identities', isLoading: false });
            return false;
          }
        } catch (error) {
          console.error('Link identities error:', error);
          set({ error: 'Failed to link identities', isLoading: false });
          return false;
        }
      },

      // Unlink identities
      unlinkIdentities: async () => {
        const { userId } = get();

        if (!userId) {
          set({ error: 'No user to unlink' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`/api/auth/profile?userId=${userId}&unlinkOnly=true`, {
            method: 'DELETE'
          });

          const data = await response.json();

          if (data.success) {
            set({
              identitiesLinked: false,
              linkedAt: null
            });
          } else {
            set({ error: data.error || 'Failed to unlink identities' });
          }
        } catch (error) {
          console.error('Unlink error:', error);
          set({ error: 'Failed to unlink identities' });
        } finally {
          set({ isLoading: false });
        }
      },

      // Check link status
      checkLinkStatus: async () => {
        const state = get();

        if (!state.walletAddress && !state.farcasterFid) {
          return;
        }

        try {
          const params = new URLSearchParams();
          if (state.walletAddress) params.append('walletAddress', state.walletAddress);
          if (state.farcasterFid) params.append('farcasterFid', state.farcasterFid.toString());

          const response = await fetch(`/api/auth/link?${params}`);
          const data = await response.json();

          if (data.linked) {
            set({
              identitiesLinked: true,
              linkedAt: data.user.linkedAt,
              userId: data.user.id
            });
          }
        } catch (error) {
          console.error('Check link status error:', error);
        }
      },

      // Refresh profile (with debouncing)
      refreshProfile: async () => {
        const state = get();

        if (!state.userId && !state.walletAddress && !state.farcasterFid) {
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const params = new URLSearchParams();
          if (state.userId) params.append('userId', state.userId);
          else if (state.walletAddress) params.append('walletAddress', state.walletAddress);
          else if (state.farcasterFid) params.append('farcasterFid', state.farcasterFid.toString());
          params.append('refresh', 'true');

          // Use debounced version to prevent excessive API calls
          const data = await debouncedRefreshProfile(params);

          if (data.success) {
            const { profile } = data;

            set({
              userId: profile.id,
              walletAddress: profile.walletAddress,
              walletEns: profile.walletEns,
              farcasterFid: profile.farcasterFid,
              farcasterUsername: profile.farcasterUsername,
              farcasterDisplayName: profile.farcasterDisplayName,
              farcasterPfpUrl: profile.farcasterPfpUrl,
              farcasterBio: profile.farcasterBio,
              verifiedAddresses: profile.verifiedAddresses,
              identitiesLinked: profile.identitiesLinked,
              linkedAt: profile.linkedAt,
              primaryIdentity: profile.primaryIdentity,
              empireTier: profile.empireTier || AccessTier.NORMIE,
              empireRank: profile.empireRank,
              empireScore: profile.empireScore,
              preferences: profile.preferences || {}
            });
          }
        } catch (error: any) {
          // Ignore debounce cancellation errors
          if (error?.message !== 'Debounced') {
            console.error('Refresh profile error:', error);
            set({ error: 'Failed to refresh profile' });
          }
        } finally {
          set({ isLoading: false });
        }
      },

      // Update preferences
      updatePreferences: (prefs: any) => {
        set((state) => ({
          preferences: { ...state.preferences, ...prefs }
        }));

        // Optionally persist to backend
        const { userId } = get();
        if (userId) {
          fetch('/api/auth/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, preferences: prefs })
          }).catch(console.error);
        }
      },

      // Create session
      createSession: (token: string, expiry: string) => {
        set({
          sessionToken: token,
          sessionExpiry: expiry
        });
      },

      // Clear session
      clearSession: () => {
        set({
          sessionToken: null,
          refreshToken: null,
          sessionExpiry: null
        });
      },

      // Check if session is valid
      isSessionValid: () => {
        const { sessionToken, sessionExpiry } = get();

        if (!sessionToken || !sessionExpiry) {
          return false;
        }

        return new Date(sessionExpiry) > new Date();
      },

      // Disconnect all
      disconnect: () => {
        get().disconnectWallet();
        get().disconnectFarcaster();
        get().clearSession();
        get().reset();
      },

      // Reset store
      reset: () => {
        set(initialState);
      },

      // Set loading state
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // Set error
      setError: (error: string | null) => {
        set({ error });
      }
    }),
    {
      name: 'unified-auth-storage',
      partialize: (state) => ({
        userId: state.userId,
        walletAddress: state.walletAddress,
        farcasterFid: state.farcasterFid,
        farcasterUsername: state.farcasterUsername,
        farcasterDisplayName: state.farcasterDisplayName,
        farcasterPfpUrl: state.farcasterPfpUrl,
        identitiesLinked: state.identitiesLinked,
        primaryIdentity: state.primaryIdentity,
        sessionToken: state.sessionToken,
        sessionExpiry: state.sessionExpiry,
        preferences: state.preferences
      })
    }
  )
);