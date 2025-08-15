export default function AlertsPanel({ arb }: { arb: any[] }) {
  const active = (arb?.filter(a => a.flagged) ?? []).slice(0, 20);
  const pill = (a:any) => {
    const mag = Math.abs(Number(a.metric ?? 0));
    const sev = mag > 1e-2 ? 'HIGH' : mag > 1e-3 ? 'MED' : 'LOW';
    const cls = sev === 'HIGH' ? 'bg-red-500/20 text-red-300' : sev === 'MED' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300';
    return <span className={`px-2 py-0.5 rounded-full text-xs ${cls}`}>{sev}</span>;
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Arbitrage Alerts</h3>
      {active.length === 0 ? (
        <div className="text-sm opacity-70">No violations detected.</div>
      ) : (
        <ul className="space-y-2 text-sm">
          {active.map((a, i) => (
            <li key={i} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium flex items-center gap-2">
                  <span className="opacity-80">{a.type}</span>
                  {pill(a)}
                </div>
                <div className="opacity-70 break-words">
                  {a.detail ?? ''}
                </div>
              </div>
              <div className="text-right opacity-60 shrink-0">
                <div>{a.expiry}</div>
                <div className="font-mono">{Array.isArray(a.strikes) ? a.strikes.join(', ') : ''}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}