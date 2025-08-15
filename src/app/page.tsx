'use client';
import { useEffect, useMemo, useState } from 'react';
import LiveTicker from '@/components/LiveTicker';
import IVSurfaceChart from '@/components/IVSurfaceChart';
import ArbitrageTable from '@/components/ArbitrageTable';
import ForecastPanel from '@/components/ForecastPanel';
import AlertsPanel from '@/components/AlertsPanel';
import IVHistoryChart from '@/components/IVHistoryChart';
import GreeksHeatmap from '@/components/GreeksHeatmap';

export default function Page() {
  const [stream, setStream] = useState<any[]>([]);

  useEffect(() => {
    const ev = new EventSource('/api/stream');
    ev.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        setStream((s) => [msg, ...s].slice(0, 200));
      } catch {}
    };
    ev.onerror = () => ev.close();
    return () => ev.close();
  }, []);

  const latest = stream[0];
  const ivGrid = useMemo(() => latest?.ivGrid ?? [], [latest]);
  const arbFlags = useMemo(() => latest?.arb ?? [], [latest]);
  const forecasts = useMemo(() => latest?.forecast ?? [], [latest]);
  const history = useMemo(() => latest?.history ?? [], [latest]);
  const greeks = useMemo(() => latest?.greeks ?? [], [latest]);

  return (
    <main className="grid gap-6 md:grid-cols-3">
      <section className="md:col-span-2 card p-4 space-y-4">
        <LiveTicker latest={latest} />
        <IVSurfaceChart ivGrid={ivGrid} />
        <IVHistoryChart series={history} />
      </section>

      <aside className="card p-4 space-y-4">
        <ForecastPanel forecasts={forecasts} />
        <AlertsPanel arb={arbFlags} />
      </aside>

      <section className="md:col-span-3 grid md:grid-cols-3 gap-4">
        <div className="card p-4"><GreeksHeatmap grid={greeks} field="delta" /></div>
        <div className="card p-4"><GreeksHeatmap grid={greeks} field="gamma" /></div>
        <div className="card p-4"><GreeksHeatmap grid={greeks} field="vega" /></div>
      </section>

      <section className="md:col-span-3 card p-4">
        <ArbitrageTable arb={arbFlags} />
      </section>
    </main>
  );
}