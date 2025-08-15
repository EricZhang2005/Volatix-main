import { TrendingUp } from 'lucide-react';

export default function LiveTicker({ latest }: { latest?: any }) {
  const s = latest?.symbol ?? 'SPY';
  const px = latest?.underlier?.price ?? 0;
  const ts = latest?.ts ? new Date(latest.ts).toLocaleTimeString() : '';
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        <span className="font-medium">{s}</span>
        <span className="opacity-70">{px.toFixed(2)}</span>
      </div>
      <div className="text-xs opacity-60">{ts}</div>
    </div>
  );
}