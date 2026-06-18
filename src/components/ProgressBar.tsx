import React from 'react';

interface ProgressBarProps {
  id: string;
  label: string;
  pct: number;
  benchmark: string;
  benchmarkKg: number;
}

// Utility to format carbon output values in tonnes or kg
const formatKgValue = (val: number): string => {
  return val >= 1000 ? `${(val / 1000).toFixed(1)}t` : `${Math.round(val)} kg`;
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  id,
  label,
  pct,
  benchmark,
  benchmarkKg,
}) => {
  const clampedPct = Math.min(pct, 200);
  const barWidth = Math.min(clampedPct / 2, 100);
  
  // Decide the gauge color block based on thresholds matching the cloned platform
  const colorClass = pct <= 100 ? 'bg-primary-500' : pct <= 150 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-bold text-gray-900">
          {pct.toFixed(0)}%{' '}
          <span className="font-normal text-gray-500">
            of {formatKgValue(benchmarkKg)}
          </span>
        </span>
      </div>
      <div
        className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={200}
        aria-label={`${label}: your footprint is ${pct.toFixed(0)}% of the ${benchmark} (${formatKgValue(benchmarkKg)}/year)`}
        id={id}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
          style={{ width: `${barWidth}%` }}
        />
        <div
          className="absolute top-0 h-full w-0.5 bg-gray-400 opacity-60"
          style={{ left: '50%' }}
          aria-hidden="true"
        />
      </div>
      <p className="text-xs text-gray-400">
        {pct <= 100
          ? `✅ You are below the ${benchmark}`
          : `⚠️ You are ${(pct - 100).toFixed(0)}% above the ${benchmark}`}
      </p>
    </div>
  );
};
export default ProgressBar;
