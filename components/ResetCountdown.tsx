'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

export default function ResetCountdown() {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();

      // Calculate next midnight UTC using UTC methods
      const resetTime = new Date();
      resetTime.setUTCHours(24, 0, 0, 0); // This sets to next midnight UTC

      // Calculate time difference
      const diff = resetTime.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    calculateTimeLeft(); // Initial calculation
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-gem-crystal" />
        <span className="text-sm text-gray-400">Daily Reset In</span>
      </div>
      <div className="text-right">
        <div className="font-mono text-lg font-bold bg-gradient-to-r from-gem-crystal to-gem-gold bg-clip-text text-transparent">
          {timeLeft || '00:00:00'}
        </div>
        <div className="text-xs text-gray-500">
          Midnight UTC
        </div>
      </div>
    </div>
  );
}