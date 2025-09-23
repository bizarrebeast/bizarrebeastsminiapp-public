'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X, User } from 'lucide-react';

interface UserSearchProps {
  defaultFid: number;
  onUserSelect: (fid: number) => void;
  currentFid: number;
}

interface SearchResult {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl?: string;
  followerCount: number;
  powerBadge: boolean;
}

export default function UserSearch({ defaultFid, onUserSelect, currentFid }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState<SearchResult | null>(null);

  // Fetch current user data
  useEffect(() => {
    fetchUserData(currentFid);
  }, [currentFid]);

  const fetchUserData = async (fid: number) => {
    try {
      const response = await fetch(`/api/admin/users/${fid}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentUser({
          fid: data.profile.fid,
          username: data.profile.username,
          displayName: data.profile.displayName,
          pfpUrl: data.profile.pfpUrl,
          followerCount: data.profile.followerCount,
          powerBadge: data.profile.powerBadge,
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length > 0) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = (user: SearchResult) => {
    onUserSelect(user.fid);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleDirectFidInput = () => {
    const fid = parseInt(searchQuery);
    if (!isNaN(fid) && fid > 0) {
      onUserSelect(fid);
      setSearchQuery('');
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative">
      <div className="bg-dark-card border border-gem-purple/30 rounded-lg p-4">
        <div className="flex items-center gap-4">
          {/* Current User Display */}
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">Currently Viewing</p>
            {currentUser ? (
              <div className="flex items-center gap-3">
                {currentUser.pfpUrl ? (
                  <img
                    src={currentUser.pfpUrl}
                    alt={currentUser.username}
                    className="w-10 h-10 rounded-full border border-gem-purple/30"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gem-purple/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-gem-crystal" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gem-crystal">
                      @{currentUser.username}
                    </span>
                    {currentUser.powerBadge && (
                      <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                        Power
                      </span>
                    )}
                    {currentFid === defaultFid && (
                      <span className="text-xs px-1.5 py-0.5 bg-gem-gold/20 text-gem-gold rounded">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    FID: {currentUser.fid} · {currentUser.followerCount.toLocaleString()} followers
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-700 animate-pulse" />
                <div>
                  <div className="h-4 w-24 bg-gray-700 rounded animate-pulse mb-1" />
                  <div className="h-3 w-32 bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            )}
          </div>

          {/* Search Input */}
          <div className="relative w-96">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleDirectFidInput();
                  }
                }}
                placeholder="Search by username or enter FID..."
                className="w-full pl-10 pr-10 py-2 bg-dark-bg border border-gem-purple/30 rounded-lg text-gem-crystal placeholder-gray-500 focus:outline-none focus:border-gem-purple/50"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowDropdown(false);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-500 hover:text-gem-crystal" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showDropdown && (
              <div className="absolute top-full mt-2 w-full bg-dark-card border border-gem-purple/30 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-gray-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gem-purple"></div>
                    <p className="mt-2 text-sm">Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((user) => (
                      <button
                        key={user.fid}
                        onClick={() => handleSelectUser(user)}
                        className="w-full px-4 py-3 hover:bg-gem-purple/10 transition-colors flex items-center gap-3"
                      >
                        {user.pfpUrl ? (
                          <img
                            src={user.pfpUrl}
                            alt={user.username}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gem-purple/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-gem-crystal" />
                          </div>
                        )}
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gem-crystal">@{user.username}</span>
                            {user.powerBadge && (
                              <span className="text-xs px-1 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                                Power
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">
                            FID: {user.fid} · {user.followerCount.toLocaleString()} followers
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : searchQuery.length > 0 ? (
                  <div className="p-4 text-center text-gray-400">
                    <p className="text-sm">No users found</p>
                    {!isNaN(parseInt(searchQuery)) && (
                      <button
                        onClick={handleDirectFidInput}
                        className="mt-2 text-gem-purple hover:text-gem-crystal text-sm"
                      >
                        View FID {searchQuery} directly →
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}