'use client';
import { useEffect, useRef } from 'react';

export default function IVHistoryChart({ series }: { series: { ts:number; atmIv:number }[] }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current; if (!cv || !series?.length) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const dpr = (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1;
    const W = cv.width = Math.floor(cv.clientWidth * dpr);
    const H = cv.height = Math.floor(200 * dpr);

    ctx.clearRect(0,0,W,H);
    const xs = series.map((_,i)=>i);
    const ys = series.map(p=>p.atmIv);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const pad = 0.02;
    const yMin = Math.max(0, minY * (1 - pad));
    const yMax = maxY * (1 + pad);

    const xTo = (i:number)=> W * (1 - i / Math.max(1, xs.length-1));
    const yTo = (v:number)=> H - ( (v - yMin) / Math.max(1e-9, (yMax - yMin)) ) * H;

    // grid
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    for (let i=0;i<5;i++){ const y=H*i/4; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // line
    ctx.beginPath();
    ctx.moveTo(xTo(0), yTo(ys[0]));
    for (let i=1;i<ys.length;i++) ctx.lineTo(xTo(i), yTo(ys[i]));
    ctx.strokeStyle = 'rgba(120,180,255,0.9)';
    ctx.lineWidth = 2*dpr;
    ctx.stroke();
  }, [series]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">ATM IV (history)</h3>
        <div className="text-xs opacity-60">last ~3–5 min</div>
      </div>
      <canvas ref={ref} className="w-full h-[200px] rounded-xl border border-white/10" />
    </div>
  );
}