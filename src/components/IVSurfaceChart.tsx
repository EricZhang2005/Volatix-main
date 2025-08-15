'use client';
import { useEffect, useRef } from 'react';

export default function IVSurfaceChart({ ivGrid }: { ivGrid: { k: number; t: number; iv: number }[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv || ivGrid.length === 0) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const dpr = (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1;
    const W = (cv.width = Math.floor(cv.clientWidth * dpr));
    const H = (cv.height = Math.floor(360 * dpr));
    const ks = Array.from(new Set(ivGrid.map(d => d.k))).sort((a,b)=>a-b);
    const ts = Array.from(new Set(ivGrid.map(d => d.t))).sort((a,b)=>a-b);
    const kIdx = new Map(ks.map((k,i)=>[k,i]));
    const tIdx = new Map(ts.map((t,i)=>[t,i]));
    const cols = ks.length, rows = ts.length;
    const cw = W / Math.max(1, cols), ch = H / Math.max(1, rows);
    const ivs = ivGrid.map(d=>d.iv);
    const mn = Math.min(...ivs), mx = Math.max(...ivs);
    if (!Number.isFinite(mn) || !Number.isFinite(mx)) return;
    const scale = (v:number)=> (mx===mn?0.5:(v-mn)/(mx-mn));

    ctx.clearRect(0,0,W,H);
    ivGrid.forEach(d => {
      const x = (kIdx.get(d.k) || 0) * cw;
      const y = (tIdx.get(d.t) || 0) * ch;
      const s = scale(d.iv);
      const r = Math.floor(20 + 100*s);
      const g = Math.floor(80 + 100*s);
      const b = Math.floor(200 + 30*s);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, Math.ceil(cw), Math.ceil(ch));
    });
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    for (let i=0;i<=cols;i++){ ctx.beginPath(); ctx.moveTo(i*cw,0); ctx.lineTo(i*cw,H); ctx.stroke(); }
    for (let j=0;j<=rows;j++){ ctx.beginPath(); ctx.moveTo(0,j*ch); ctx.lineTo(W,j*ch); ctx.stroke(); }
  }, [ivGrid]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-medium">IV Surface</h2>
        <div className="text-xs opacity-60">k=strike, t=days</div>
      </div>
      <canvas ref={ref} className="w-full h-[360px] rounded-xl border border-white/10" />
    </div>
  );
}