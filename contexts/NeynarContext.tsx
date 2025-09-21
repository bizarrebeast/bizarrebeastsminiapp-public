/**
 * Neynar Context Provider
 * Manages Farcaster user authentication and profile data
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NeynarUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl?: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  powerBadge?: boolean;
}

interface NeynarContextType {
  user: NeynarUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => void;
  verifyShare: (ritualId: number) => Promise<boolean>;
}

const NeynarContext = createContext<NeynarContextType | undefined>(undefined);

export function NeynarProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<NeynarUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // First check localStorage
        const stored = localStorage.getItem('neynar_user');
        if (stored) {
          const userData = JSON.parse(stored);
          setUser(userData);
        } else {
          // Check for cookie from callback
          const cookies = document.cookie.split(';');
          const neynarCookie = cookies.find(c => c.trim().startsWith('neynar_user='));
          if (neynarCookie) {
            const userData = JSON.parse(decodeURIComponent(neynarCookie.split('=')[1]));
            setUser(userData);
            // Store in localStorage for persistence
            localStorage.setItem('neynar_user', JSON.stringify(userData));
          }
        }

        // Check URL params for auth success
        const params = new URLSearchParams(window.location.search);
        if (params.get('auth') === 'success') {
          // Clean up URL
          window.history.replaceState({}, '', window.location.pathname);
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async () => {
    try {
      // Get the authorization URL
      const response = await fetch('/api/neynar/auth/siwn');
      const { authUrl } = await response.json();

      // Redirect to Neynar auth
      window.location.href = authUrl;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('neynar_user');
  };

  const verifyShare = async (ritualId: number): Promise<boolean> => {
    try {
      // If user is not authenticated, use test mode in development
      const fid = user?.fid || (process.env.NODE_ENV === 'development' ? 'test' : null);

      if (!fid) {
        console.warn('User not authenticated, cannot verify share');
        return false;
      }

      const response = await fetch('/api/neynar/verify-share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fid,
          ritualId,
        }),
      });

      const result = await response.json();
      return result.verified;
    } catch (error) {
      console.error('Share verification failed:', error);
      return false;
    }
  };

  return (
    <NeynarContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        verifyShare,
      }}
    >
      {children}
    </NeynarContext.Provider>
  );
}

export function useNeynar() {
  const context = useContext(NeynarContext);
  if (context === undefined) {
    throw new Error('useNeynar must be used within a NeynarProvider');
  }
  return context;
}