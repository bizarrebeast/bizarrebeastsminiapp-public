'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface AttestationCooldownProps {
  lastAttestationTime: string | null;
}

export default function AttestationCooldown({ lastAttestationTime }: AttestationCooldownProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!lastAttestationTime) {
        setIsReady(true);
        setTimeLeft('Ready to Prove!');
        return;
      }

      const lastTime = new Date(lastAttestationTime).getTime();
      const now = Date.now();
      const cooldownEnd = lastTime + (20 * 60 * 60 * 1000); // 20 hours in milliseconds
      const diff = cooldownEnd - now;

      if (diff <= 0) {
        setIsReady(true);
        setTimeLeft('Ready to Prove!');
        return;
      }

      setIsReady(false);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    calculateTimeLeft(); // Initial calculation
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [lastAttestationTime]);

  return (
    <div className="bg-dark-card/80 border border-gray-700 rounded-lg p-3 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${isReady ? 'text-green-500' : 'text-gem-crystal'}`} />
          <span className="text-sm text-gray-400">Attestation Cooldown</span>
        </div>
        <div className="text-right">
          <div className={`font-mono text-lg font-bold ${
            isReady
              ? 'text-green-500'
              : 'bg-gradient-to-r from-gem-crystal to-gem-gold bg-clip-text text-transparent'
          }`}>
            {timeLeft || '00:00:00'}
          </div>
          <div className="text-xs text-gray-500">
            {isReady ? 'Available now' : '20-hour cooldown'}
          </div>
        </div>
      </div>
    </div>
  );
}