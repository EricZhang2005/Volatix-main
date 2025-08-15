'use client';
import { useEffect, useRef } from 'react';

type Cell = { k:number; t:number; delta:number; gamma:number; vega:number };

export default function GreeksHeatmap({ grid, field }: { grid: Cell[]; field: 'delta'|'gamma'|'vega' }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current; if (!cv || !grid?.length) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;

    const ks = Array.from(new Set(grid.map(d=>d.k))).sort((a,b)=>a-b);
    const ts = Array.from(new Set(grid.map(d=>d.t))).sort((a,b)=>a-b);
    const kIdx = new Map(ks.map((k,i)=>[k,i]));
    const tIdx = new Map(ts.map((t,i)=>[t,i]));
    const dpr = (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1;
    const W = cv.width = Math.floor(cv.clientWidth * dpr);
    const H = cv.height = Math.floor(260 * dpr);
    const cw = W / Math.max(1, ks.length);
    const ch = H / Math.max(1, ts.length);

    const vals = grid.map(d => d[field]);
    const mn = Math.min(...vals), mx = Math.max(...vals) || 1;
    const scale = (v:number)=> (mx===mn?0.5:(v-mn)/(mx-mn));

    ctx.clearRect(0,0,W,H);
    grid.forEach(d => {
      const x = (kIdx.get(d.k) || 0) * cw;
      const y = (tIdx.get(d.t) || 0) * ch;
      const s = scale(d[field]);
      const r = Math.floor(30 + 80*s);
      const g = Math.floor(60 + 140*s);
      const b = Math.floor(220 - 120*s);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, Math.ceil(cw), Math.ceil(ch));
    });

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    for (let i=0;i<=ks.length;i++){ ctx.beginPath(); ctx.moveTo(i*cw,0); ctx.lineTo(i*cw,H); ctx.stroke(); }
    for (let j=0;j<=ts.length;j++){ ctx.beginPath(); ctx.moveTo(0,j*ch); ctx.lineTo(W,j*ch); ctx.stroke(); }
  }, [grid, field]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">Greeks Heatmap — {field}</h3>
        <div className="text-xs opacity-60">k=strike, t=days</div>
      </div>
      <canvas ref={ref} className="w-full h-[260px] rounded-xl border border-white/10" />
    </div>
  );
}