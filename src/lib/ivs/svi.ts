// Raw SVI: w(k) = a + b*(rho*(k-m) + sqrt((k-m)^2 + sigma^2)) where w=iv^2*T
type SVI = { a:number; b:number; rho:number; m:number; sigma:number };

function wSVI(k:number, p:SVI) {
  return p.a + p.b*(p.rho*(k-p.m) + Math.sqrt((k-p.m)**2 + p.sigma**2));
}

export function fitSVI(logMoneyness:number[], totalVar:number[]): SVI {
  if (logMoneyness.length !== totalVar.length || totalVar.length === 0) {
    throw new Error('fitSVI: inputs must be same nonzero length');
  }
  const a0 = Math.max(1e-8, Math.min(...totalVar)*0.9);
  const m0 = logMoneyness.reduce((s,x)=>s+x,0)/Math.max(1,logMoneyness.length);
  let best: SVI = { a: a0, b: 0.1, rho: 0.0, m: m0, sigma: 0.2 };
  let bestLoss = Number.POSITIVE_INFINITY;
  const rng = (lo:number,hi:number,steps:number)=>Array.from({length:steps},(_,i)=>lo+(hi-lo)*i/(steps-1));

  for (const b of rng(0.01, 2.0, 8))
  for (const rho of rng(-0.9, 0.9, 7))
  for (const sigma of rng(0.01, 1.0, 8)){
    const p = { a:a0, b, rho, m:m0, sigma };
    const loss = totalVar.reduce((s,w,i)=>{ const e=wSVI(logMoneyness[i], p)-w; return s+e*e; },0);
    if (loss < bestLoss) { best = p; bestLoss = loss; }
  }
  for (let it=0; it<200; it++){
    const da = (Math.random()-0.5)*0.002;
    const dm = (Math.random()-0.5)*0.01;
    const db = (Math.random()-0.5)*0.01;
    const dr = (Math.random()-0.5)*0.02;
    const ds = (Math.random()-0.5)*0.01;
    const cand = {
      a: Math.max(1e-6, best.a+da),
      b: Math.max(1e-6, best.b+db),
      rho: Math.max(-0.999, Math.min(0.999, best.rho+dr)),
      m: best.m+dm,
      sigma: Math.max(1e-4, best.sigma+ds)
    };
    const loss = totalVar.reduce((s,w,i)=>{ const e=wSVI(logMoneyness[i], cand)-w; return s+e*e; },0);
    if (loss < bestLoss) { best=cand as SVI; bestLoss=loss; }
  }
  return best;
}

export function surfaceGridFromSVI(
  strikes:number[], tenors:number[], f0:number, r:number, q:number, fits: Record<number, ReturnType<typeof fitSVI>>
){
  const grid: {k:number; t:number; iv:number}[] = [];
  for (const T of tenors){
    const p = fits[T]; if (!p) continue;
    for (const K of strikes){
      const k = Math.log(K / f0);
      const w = wSVI(k,p);
      const iv = Math.sqrt(Math.max(w,1e-8)/Math.max(T,1e-6));
      grid.push({ k: K, t: Math.round(T*365), iv });
    }
  }
  return grid;
}