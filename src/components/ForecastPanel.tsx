export default function ForecastPanel({ forecasts }: { forecasts: { t: number; iv: number; ci: [number, number] }[] }) {
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">AI IV Forecast (short horizon)</h3>
      <ul className="space-y-2">
        {forecasts?.slice(0, 8).map((f, i) => (
          <li key={i} className="flex items-center justify-between text-sm">
            <span className="opacity-70">t+{f.t}m</span>
            <span className="font-mono">{(f.iv*100).toFixed(2)}% <span className="opacity-60">[{(f.ci[0]*100).toFixed(1)}%, {(f.ci[1]*100).toFixed(1)}%]</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}