export default function ArbitrageTable({ arb }: { arb: any[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-medium">Arbitrage Checks</h2>
        <div className="text-xs opacity-60">butterfly / calendar</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left opacity-70">
            <tr>
              <th className="py-2">Type</th>
              <th>Expiry</th>
              <th>Strikes</th>
              <th>Metric</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {arb?.slice(0, 50).map((a, i) => (
              <tr key={i} className="border-t border-white/10 hover:bg-white/5">
                <td className="py-2">{a.type}</td>
                <td>{a.expiry}</td>
                <td>{Array.isArray(a.strikes) ? a.strikes.join(', ') : ''}</td>
                <td className="font-mono">{typeof a.metric === 'number' ? a.metric.toFixed(4) : '-'}</td>
                <td className={a.flagged ? 'text-red-400' : 'text-emerald-400'}>
                  {a.flagged ? 'VIOLATION' : 'OK'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}