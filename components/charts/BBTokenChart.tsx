'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, LineStyle, Time, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';

const BB_POOL_ADDRESS = '0x49e35c372ee285d22a774f8a415f8bf3ad6456c2';

type Timeframe = {
  label: string;
  value: string;
  interval: 'minute' | 'hour' | 'day';
  aggregate: number;
  limit: number;
};

const TIMEFRAMES: Timeframe[] = [
  { label: '1H', value: '1H', interval: 'minute', aggregate: 1, limit: 60 },
  { label: '24H', value: '24H', interval: 'hour', aggregate: 1, limit: 24 },
  { label: '7D', value: '7D', interval: 'day', aggregate: 1, limit: 7 },
  { label: '30D', value: '30D', interval: 'day', aggregate: 1, limit: 30 },
  { label: 'ALL', value: 'ALL', interval: 'day', aggregate: 1, limit: 365 },
];

type PriceStats = {
  current: number;
  change24h: number;
  changePercentage24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
};

export function BBTokenChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>(TIMEFRAMES[1]); // Default 24H
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [priceStats, setPriceStats] = useState<PriceStats | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0a0a' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: 'rgba(197, 203, 206, 0.1)' },
        horzLines: { color: 'rgba(197, 203, 206, 0.1)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      timeScale: {
        borderColor: '#2B2B43',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#2B2B43',
        scaleMargins: {
          top: 0.1,
          bottom: 0.3,
        },
        visible: true,
      },
      leftPriceScale: {
        visible: false,
      },
      crosshair: {
        vertLine: {
          color: '#9CA3AF',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#4B5563',
        },
        horzLine: {
          color: '#9CA3AF',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#4B5563',
        },
      },
    });

    // Create candlestick series with BB colors
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', // green
      downColor: '#ef4444', // red
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    // Create volume histogram series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#fbbf24',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Create separate scale for volume
    });

    chart.priceScale('').applyOptions({
      scaleMargins: {
        top: 0.7, // Volume takes bottom 30%
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;

    // Crosshair tooltip
    chart.subscribeCrosshairMove((param) => {
      if (!tooltipRef.current) return;

      // Hide tooltip if cursor is outside chart or no data
      if (!param.time || !param.seriesData || param.point === undefined) {
        tooltipRef.current.style.display = 'none';
        return;
      }

      const candleData = param.seriesData.get(candlestickSeries);
      const volumeData = param.seriesData.get(volumeSeries);

      if (candleData) {
        const data = candleData as any;
        tooltipRef.current.style.display = 'block';
        tooltipRef.current.innerHTML = `
          <div style="font-size: 12px; line-height: 1.5;">
            <div style="color: #d1d5db; margin-bottom: 4px;">
              <strong>Time:</strong> ${new Date(Number(param.time) * 1000).toLocaleString()}
            </div>
            <div style="color: #10b981;"><strong>O:</strong> ${formatPrice(data.open)}</div>
            <div style="color: #10b981;"><strong>H:</strong> ${formatPrice(data.high)}</div>
            <div style="color: #ef4444;"><strong>L:</strong> ${formatPrice(data.low)}</div>
            <div style="color: #10b981;"><strong>C:</strong> ${formatPrice(data.close)}</div>
            ${volumeData ? `<div style="color: #fbbf24; margin-top: 4px;"><strong>Vol:</strong> ${formatVolume((volumeData as any).value)}</div>` : ''}
          </div>
        `;

        const toolbarHeight = 50;
        tooltipRef.current.style.left = Math.min(
          param.point?.x || 0,
          chartContainerRef.current!.clientWidth - 200
        ) + 'px';
        tooltipRef.current.style.top = toolbarHeight + 'px';
      } else {
        tooltipRef.current.style.display = 'none';
      }
    });

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    fetchChartData();
  }, [selectedTimeframe]);

  const fetchChartData = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Fetch OHLCV data
      const ohlcvResponse = await fetch(
        `https://api.geckoterminal.com/api/v2/networks/base/pools/${BB_POOL_ADDRESS}/ohlcv/${selectedTimeframe.interval}?aggregate=${selectedTimeframe.aggregate}&limit=${selectedTimeframe.limit}`
      );

      if (!ohlcvResponse.ok) {
        throw new Error('Failed to fetch chart data');
      }

      const ohlcvData = await ohlcvResponse.json();

      // Fetch current pool stats
      const poolResponse = await fetch(
        `https://api.geckoterminal.com/api/v2/networks/base/pools/${BB_POOL_ADDRESS}`
      );

      if (!poolResponse.ok) {
        throw new Error('Failed to fetch pool stats');
      }

      const poolData = await poolResponse.json();
      const poolAttributes = poolData.data.attributes;

      // Parse OHLCV data for candlestick chart
      // Format: [timestamp, open, high, low, close, volume]
      const candleData = ohlcvData.data.attributes.ohlcv_list
        .map((item: any[]) => ({
          time: Number(item[0]) as Time,
          open: Number(item[1]) || 0,
          high: Number(item[2]) || 0,
          low: Number(item[3]) || 0,
          close: Number(item[4]) || 0,
        }))
        .filter((d: any) => d.close > 0) // Filter out invalid data
        .reverse(); // Reverse to have oldest first

      // Parse volume data
      const volumeData = ohlcvData.data.attributes.ohlcv_list
        .map((item: any[]) => {
          const close = Number(item[4]) || 0;
          const open = Number(item[1]) || 0;
          const volume = Number(item[5]) || 0;
          const isUp = close >= open;
          return {
            time: Number(item[0]) as Time,
            value: volume,
            color: isUp ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)',
          };
        })
        .filter((d: any) => d.value > 0) // Filter out invalid data
        .reverse();

      // Calculate stats - ensure proper parsing of string numbers
      const currentPrice = Number(poolAttributes.base_token_price_usd) || 0;
      const change24h = Number(poolAttributes.price_change_percentage?.h24) || 0;
      const volume24h = Number(poolAttributes.volume_usd?.h24) || 0;
      const marketCap = Number(poolAttributes.fdv_usd) || 0;

      console.log('Chart data:', {
        currentPrice,
        change24h,
        volume24h,
        marketCap,
        candleDataLength: candleData.length,
      });

      // Calculate 24h high/low from data
      const last24hData = candleData.slice(-24);
      const high24h = last24hData.length > 0 ? Math.max(...last24hData.map((d: any) => d.high)) : currentPrice;
      const low24h = last24hData.length > 0 ? Math.min(...last24hData.map((d: any) => d.low)) : currentPrice;
      const priceChange24h = currentPrice - (currentPrice / (1 + change24h / 100));

      setPriceStats({
        current: currentPrice,
        change24h: priceChange24h,
        changePercentage24h: change24h,
        high24h,
        low24h,
        volume24h,
        marketCap,
      });

      // Update chart
      if (candlestickSeriesRef.current && volumeSeriesRef.current) {
        candlestickSeriesRef.current.setData(candleData);
        volumeSeriesRef.current.setData(volumeData);
        chartRef.current?.timeScale().fitContent();
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError('Failed to load chart data');
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number): string => {
    if (!price || price === 0) return '$0.00';

    // For very small numbers
    if (price < 0.0000001) {
      return `$${price.toExponential(2)}`;
    }
    if (price < 0.000001) {
      return `$${price.toFixed(9)}`;
    }
    if (price < 0.00001) {
      return `$${price.toFixed(8)}`;
    }
    if (price < 0.001) {
      return `$${price.toFixed(7)}`;
    }
    if (price < 1) {
      return `$${price.toFixed(6)}`;
    }
    return `$${price.toFixed(2)}`;
  };

  const formatVolume = (volume: number): string => {
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(2)}M`;
    }
    if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(2)}K`;
    }
    return `$${volume.toFixed(2)}`;
  };

  const formatChange = (change: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  return (
    <div className="w-full space-y-4">
      {/* Price Stats - Two Rows */}
      {priceStats && (
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-lg p-4">
          {/* Row 1 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">Price</p>
              <p className="text-base font-bold text-white">{formatPrice(priceStats.current)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">24h Change</p>
              <div className="flex items-center gap-1">
                {priceStats.changePercentage24h >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
                <p
                  className={`text-base font-bold ${
                    priceStats.changePercentage24h >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {formatChange(priceStats.changePercentage24h)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">24h High</p>
              <p className="text-base font-bold text-green-400">{formatPrice(priceStats.high24h)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">24h Low</p>
              <p className="text-base font-bold text-red-400">{formatPrice(priceStats.low24h)}</p>
            </div>
          </div>
          {/* Row 2 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-gray-700/50">
            <div>
              <p className="text-xs text-gray-400 mb-1">24h Volume</p>
              <p className="text-base font-bold text-gem-crystal">{formatVolume(priceStats.volume24h)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Market Cap</p>
              <p className="text-base font-bold text-gem-gold">{formatVolume(priceStats.marketCap)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Symbol</p>
              <p className="text-base font-bold text-gem-pink">$BB</p>
            </div>
          </div>
        </div>
      )}

      {/* Timeframe Selector */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2">
          {TIMEFRAMES.map((timeframe) => (
            <button
              key={timeframe.value}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                selectedTimeframe.value === timeframe.value
                  ? 'bg-gradient-to-r from-gem-gold to-gem-crystal text-dark-bg'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {timeframe.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative bg-dark-bg rounded-lg overflow-hidden border border-gem-crystal/20">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-dark-bg/80 z-10">
            <Loader2 className="w-8 h-8 text-gem-gold animate-spin" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-dark-bg/80 z-10">
            <p className="text-red-500">{error}</p>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full" />

        {/* Tooltip */}
        <div
          ref={tooltipRef}
          style={{
            position: 'absolute',
            display: 'none',
            padding: '8px',
            background: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '6px',
            color: 'white',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 20,
            maxWidth: '200px',
          }}
        />
      </div>

      {/* Chart Info */}
      <div className="text-xs text-gray-500 text-center">
        Powered by GeckoTerminal • Live data from Base network
      </div>
    </div>
  );
}
