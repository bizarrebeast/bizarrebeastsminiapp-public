'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/app/contracts/config';
import bizarreCheckInAbi from '@/app/contracts/abi/BizarreCheckIn.json';

interface ContractStats {
  contractBalance: string;
  totalCheckIns: number;
  totalUniquePlayers: number;
  totalRewardsDistributed: string;
  topStreakers: { address: string; streak: number }[];
}

interface TierBreakdown {
  tier: string;
  userCount: number;
  fiveDay: number;
  fifteenDay: number;
  thirtyDay: number;
  monthlyPerUser: number;
  monthlyTotal: number;
}

export default function CheckInAnalyticsPage() {
  const [contractStats, setContractStats] = useState<ContractStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentRewards, setCurrentRewards] = useState<Record<string, string>>({});

  const tiers: TierBreakdown[] = [
    {
      tier: 'BIZARRE',
      userCount: 25,
      fiveDay: 250000,
      fifteenDay: 500000,
      thirtyDay: 1000000,
      monthlyPerUser: 3250000,
      monthlyTotal: 81250000
    },
    {
      tier: 'WEIRDO',
      userCount: 25,
      fiveDay: 100000,
      fifteenDay: 250000,
      thirtyDay: 500000,
      monthlyPerUser: 1550000,
      monthlyTotal: 38750000
    },
    {
      tier: 'ODDBALL',
      userCount: 50,
      fiveDay: 50000,
      fifteenDay: 100000,
      thirtyDay: 200000,
      monthlyPerUser: 650000,
      monthlyTotal: 32500000
    },
    {
      tier: 'MISFIT',
      userCount: 150,
      fiveDay: 25000,
      fifteenDay: 50000,
      thirtyDay: 100000,
      monthlyPerUser: 325000,
      monthlyTotal: 48750000
    },
    {
      tier: 'NORMIE',
      userCount: 0,
      fiveDay: 25000,
      fifteenDay: 0,
      thirtyDay: 0,
      monthlyPerUser: 150000,
      monthlyTotal: 0
    }
  ];

  useEffect(() => {
    fetchContractData();
  }, []);

  const fetchContractData = async () => {
    try {
      const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
      const checkInContract = new ethers.Contract(
        CONTRACT_ADDRESSES.bizarreCheckIn,
        bizarreCheckInAbi.abi,
        provider
      );

      // Try to get balance using the contract's getContractBalance function first
      let balance;
      try {
        balance = await checkInContract.getContractBalance();
        console.log('Got balance from getContractBalance:', balance.toString());
      } catch (e) {
        console.log('Falling back to token contract balanceOf');
        // Fallback to checking token balance directly
        const bbTokenContract = new ethers.Contract(
          CONTRACT_ADDRESSES.bbToken,
          ['function balanceOf(address) view returns (uint256)'],
          provider
        );
        balance = await bbTokenContract.balanceOf(CONTRACT_ADDRESSES.bizarreCheckIn);
        console.log('Got balance from token contract:', balance.toString());
      }

      // Fetch other contract stats
      const [totalCheckIns, uniquePlayers, distributed] = await Promise.all([
        checkInContract.totalCheckIns(),
        checkInContract.totalUniquePlayers(),
        checkInContract.totalRewardsDistributed()
      ]);

      // Fetch top streakers
      let topStreakers: { address: string; streak: number }[] = [];
      try {
        const topStreaksData = await checkInContract.getTopStreaks(10);
        topStreakers = topStreaksData[0].map((address: string, i: number) => ({
          address,
          streak: Number(topStreaksData[1][i])
        }));
      } catch (e) {
        console.log('Could not fetch top streakers');
      }

      // Fetch current tier rewards
      const tierNames = ['BIZARRE', 'WEIRDO', 'ODDBALL', 'MISFIT', 'NORMIE'];
      const rewards: Record<string, string> = {};
      for (const tier of tierNames) {
        try {
          const reward = await checkInContract.tierDailyRewards(tier);
          rewards[tier] = ethers.formatEther(reward);
        } catch (e) {
          console.log(`Could not fetch reward for ${tier}, using default`);
          // Use the hardcoded values we know are in the contract
          const defaults: Record<string, string> = {
            'BIZARRE': '250000',
            'WEIRDO': '100000',
            'ODDBALL': '50000',
            'MISFIT': '25000',
            'NORMIE': '25000'
          };
          rewards[tier] = defaults[tier] || '0';
        }
      }

      setCurrentRewards(rewards);
      setContractStats({
        contractBalance: ethers.formatEther(balance),
        totalCheckIns: Number(totalCheckIns),
        totalUniquePlayers: Number(uniquePlayers),
        totalRewardsDistributed: ethers.formatEther(distributed),
        topStreakers
      });
    } catch (error) {
      console.error('Error fetching contract data:', error);
      // Set some default values even on error
      setContractStats({
        contractBalance: '0',
        totalCheckIns: 0,
        totalUniquePlayers: 0,
        totalRewardsDistributed: '0',
        topStreakers: []
      });
    } finally {
      setLoading(false);
    }
  };

  const totalMonthlyLiability = tiers.reduce((sum, tier) => sum + tier.monthlyTotal, 0);
  const daysOfFunding = contractStats
    ? (parseFloat(contractStats.contractBalance) / (totalMonthlyLiability / 30))
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="text-gem-crystal">Loading analytics...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-gem-gold via-gem-crystal to-gem-pink bg-clip-text text-transparent">
          📊 Check-In Analytics Dashboard
        </h1>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-dark-card border border-gem-gold/20 rounded-xl p-6">
            <div className="text-gem-gold text-sm mb-2">Contract Balance</div>
            <div className="text-2xl font-bold text-white">
              {contractStats ? `${parseFloat(contractStats.contractBalance).toLocaleString()} BB` : 'N/A'}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              ~{daysOfFunding.toFixed(1)} days of funding
            </div>
          </div>

          <div className="bg-dark-card border border-gem-crystal/20 rounded-xl p-6">
            <div className="text-gem-crystal text-sm mb-2">Total Distributed</div>
            <div className="text-2xl font-bold text-white">
              {contractStats ? `${parseFloat(contractStats.totalRewardsDistributed).toLocaleString()} BB` : 'N/A'}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              All-time rewards paid
            </div>
          </div>

          <div className="bg-dark-card border border-gem-purple/20 rounded-xl p-6">
            <div className="text-gem-purple text-sm mb-2">Active Users</div>
            <div className="text-2xl font-bold text-white">
              {contractStats?.totalUniquePlayers || 0}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Unique participants
            </div>
          </div>

          <div className="bg-dark-card border border-gem-pink/20 rounded-xl p-6">
            <div className="text-gem-pink text-sm mb-2">Total Check-Ins</div>
            <div className="text-2xl font-bold text-white">
              {contractStats?.totalCheckIns || 0}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              All-time check-ins
            </div>
          </div>
        </div>

        {/* Liability Analysis */}
        <div className="bg-dark-card border border-gem-gold/20 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-gem-gold mb-4">💰 Monthly Liability Projection</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-black/40 rounded-lg p-4">
              <div className="text-sm text-gray-400">Daily Liability</div>
              <div className="text-xl font-bold text-white">
                {(totalMonthlyLiability / 30).toLocaleString()} BB
              </div>
            </div>
            <div className="bg-black/40 rounded-lg p-4">
              <div className="text-sm text-gray-400">Monthly Liability (Top 250)</div>
              <div className="text-xl font-bold text-gem-gold">
                {(totalMonthlyLiability / 1000000).toFixed(2)}M BB
              </div>
            </div>
            <div className="bg-black/40 rounded-lg p-4">
              <div className="text-sm text-gray-400">Annual Projection</div>
              <div className="text-xl font-bold text-white">
                {(totalMonthlyLiability * 12 / 1000000).toFixed(2)}M BB
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-gem-gold/10 to-transparent rounded-lg p-3 mt-4">
            <div className="text-sm text-gem-crystal">
              ⚠️ Assumes all top 250 users maintain perfect streaks. Actual distribution will be lower due to missed check-ins.
            </div>
          </div>
        </div>

        {/* Tier Breakdown */}
        <div className="bg-dark-card border border-gem-crystal/20 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-gem-crystal mb-4">🏆 Reward Tiers Breakdown</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gem-crystal/30">
                  <th className="text-left py-3 text-gem-crystal">Tier</th>
                  <th className="text-right py-3 text-gem-crystal">Users</th>
                  <th className="text-right py-3 text-gem-crystal">5-Day</th>
                  <th className="text-right py-3 text-gem-crystal">15-Day</th>
                  <th className="text-right py-3 text-gem-crystal">30-Day</th>
                  <th className="text-right py-3 text-gem-crystal">Monthly/User</th>
                  <th className="text-right py-3 text-gem-crystal">Total Monthly</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier) => (
                  <tr key={tier.tier} className="border-b border-gem-crystal/10">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{tier.tier}</span>
                        {currentRewards[tier.tier] && (
                          <span className="text-xs text-gem-gold">
                            ({parseFloat(currentRewards[tier.tier]).toLocaleString()} BB)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-right py-3 text-gray-300">
                      {tier.userCount || '-'}
                    </td>
                    <td className="text-right py-3 text-gray-300">
                      {tier.fiveDay.toLocaleString()}
                    </td>
                    <td className="text-right py-3 text-gray-300">
                      {tier.fifteenDay ? tier.fifteenDay.toLocaleString() : '-'}
                    </td>
                    <td className="text-right py-3 text-gray-300">
                      {tier.thirtyDay ? tier.thirtyDay.toLocaleString() : '-'}
                    </td>
                    <td className="text-right py-3 font-semibold text-white">
                      {(tier.monthlyPerUser / 1000000).toFixed(2)}M
                    </td>
                    <td className="text-right py-3 font-bold text-gem-gold">
                      {tier.monthlyTotal ? `${(tier.monthlyTotal / 1000000).toFixed(2)}M` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-xs text-gray-400">
            * Monthly calculation: (5-day reward × 6 cycles) + 15-day bonus + 30-day bonus
          </div>
        </div>

        {/* Top Streakers */}
        {contractStats && contractStats.topStreakers.length > 0 && (
          <div className="bg-dark-card border border-gem-purple/20 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-gem-purple mb-4">🔥 Top Streakers</h2>

            <div className="space-y-2">
              {contractStats.topStreakers.map((streaker, index) => (
                <div key={streaker.address} className="flex items-center justify-between bg-black/40 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-gem-gold font-bold">#{index + 1}</span>
                    <span className="text-gray-300 font-mono text-sm">
                      {streaker.address.slice(0, 6)}...{streaker.address.slice(-4)}
                    </span>
                  </div>
                  <div className="text-white font-bold">
                    {streaker.streak} days
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contract Info */}
        <div className="bg-dark-card border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-300 mb-4">📝 Contract Information</h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Check-In Contract:</span>
              <span className="text-gray-300 font-mono">{CONTRACT_ADDRESSES.bizarreCheckIn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">BB Token Contract:</span>
              <span className="text-gray-300 font-mono">{CONTRACT_ADDRESSES.bbToken}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Network:</span>
              <span className="text-gray-300">Base Mainnet</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Cooldown Period:</span>
              <span className="text-gray-300">20 hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Streak Break Period:</span>
              <span className="text-gray-300">44 hours</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}