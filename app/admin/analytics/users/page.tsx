'use client';

import { useState, useEffect } from 'react';
import UserStatsDashboard from '@/components/admin/UserStatsDashboard';
import UserSearch from '@/components/admin/UserSearch';

// Your FID as the default
const DEFAULT_FID = 357897;

export default function UsersAnalyticsPage() {
  const [selectedFid, setSelectedFid] = useState<number>(DEFAULT_FID);
  const [isLoading, setIsLoading] = useState(false);

  const handleUserSelect = (fid: number) => {
    setSelectedFid(fid);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gem-gold mb-2">
            Farcaster User Analytics
          </h1>
          <p className="text-gray-400">
            Comprehensive user statistics and engagement metrics
          </p>
        </div>

        {/* Search Section */}
        <div className="mb-6">
          <UserSearch
            defaultFid={DEFAULT_FID}
            onUserSelect={handleUserSelect}
            currentFid={selectedFid}
          />
        </div>

        {/* Quick Links to Community Members */}
        <div className="mb-6">
          <div className="bg-dark-card border border-gem-purple/30 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Quick Access</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleUserSelect(DEFAULT_FID)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  selectedFid === DEFAULT_FID
                    ? 'bg-gem-purple/30 text-gem-crystal'
                    : 'bg-dark-bg text-gray-400 hover:bg-gem-purple/10'
                }`}
              >
                @bizarrebeast (You)
              </button>
              <button
                onClick={() => handleUserSelect(3)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  selectedFid === 3
                    ? 'bg-gem-purple/30 text-gem-crystal'
                    : 'bg-dark-bg text-gray-400 hover:bg-gem-purple/10'
                }`}
              >
                @dwr.eth
              </button>
              <button
                onClick={() => handleUserSelect(2)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  selectedFid === 2
                    ? 'bg-gem-purple/30 text-gem-crystal'
                    : 'bg-dark-bg text-gray-400 hover:bg-gem-purple/10'
                }`}
              >
                @v
              </button>
              <button
                onClick={() => handleUserSelect(5650)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  selectedFid === 5650
                    ? 'bg-gem-purple/30 text-gem-crystal'
                    : 'bg-dark-bg text-gray-400 hover:bg-gem-purple/10'
                }`}
              >
                @vitalik.eth
              </button>
            </div>
          </div>
        </div>

        {/* Main Dashboard */}
        <UserStatsDashboard fid={selectedFid} />
      </div>
    </div>
  );
}