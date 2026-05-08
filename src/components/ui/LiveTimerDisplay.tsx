import React, { useState, useEffect } from 'react';

export function LiveTimerDisplay({ startTime, initialMinutes = 0 }: { startTime: number, initialMinutes?: number }) {
  const [elapsed, setElapsed] = useState(Date.now() - startTime);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const totalSeconds = Math.floor(elapsed / 1000) + (initialMinutes * 60);
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');

  return (
    <span className="font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium border border-blue-100">
      {h}:{m}:{s}
    </span>
  );
}
