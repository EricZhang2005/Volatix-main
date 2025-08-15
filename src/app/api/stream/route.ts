import { NextRequest } from 'next/server';
import { bsPrice, greeks, impliedVol } from '@/lib/math/blackscholes';
import { butterflyCheck, calendarCheck } from '@/lib/arbitrage/checks';
import { fitSVI, surfaceGridFromSVI } from '@/lib/ivs/svi';
import { expSmoothForecast } from '@/lib/forecast/expSmooth';
import { fetchOptionChainPolygon } from '@/lib/data/providers/polygon';

export const runtime = 'nodejs';

type Quote = { K:number; T:number; call:number; iv?:number };

function randomWalk(px:number){ return px * Math.exp((Math.random()-0.5)*0.002); }

async function getMarket(symbol:string) {
  // Try live Polygon, fallback to synthetic
  try {
    const live = await fetchOptionChainPolygon(symbol);
    if (live && Array.isArray(live.quotes) && live.quotes.length) return live;
  } catch {}
  // synthetic
  let f0 = 500;
  const strikes = Array.from({length:13},(_,i)=> Math.round(400 + i*20));
  const tenors = [5/365, 15/365, 30/365, 60/365, 90/365];
  const r=0.02, q=0.00;
  const quotes: Quote[] = [];
  f0 = randomWalk(f0);
  for (const T of tenors){
    for (const K of strikes){
      const baseIv = 0.20 + 0.08*Math.max(0,(K-f0)/f0) + 0.02*(Math.random()-0.5);
      const price = bsPrice('C', f0, K, r, q, baseIv, T);
      quotes.push({ K, T, call: price, iv: baseIv });
    }
  }
  return { spot: f0, quotes };
}

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const history: { ts:number; atmIv:number }[] = [];   // rolling short history
  const greekGrid: { k:number; t:number; delta:number; gamma:number; vega:number }[] = [];

  const stream = new ReadableStream<Uint8Array>({
    start(controller){
      let symbol = 'SPY';
      const r=0.02, q=0.00;

      const tick = async () => {
        const { spot: f0, quotes } = await getMarket(symbol);

        // fill IVs if missing
        for (const qte of quotes) {
          if (qte.iv == null) {
            qte.iv = impliedVol('C', f0, qte.K, r, q, qte.T, qte.call);
          }
        }

        // SVI fit per tenor -> IV grid for heatmap
        const byT: Record<number, Quote[]> = {};
        quotes.forEach(q=>{ (byT[q.T] ??= []).push(q); });
        const fits: Record<number, ReturnType<typeof fitSVI>> = {};
        for (const T of Object.keys(byT).map(Number)){
          const row = byT[T];
          const ks = row.map(q => Math.log(q.K / f0));
          const w = row.map(q => (q.iv ?? 0.2)**2 * T);
          fits[T] = fitSVI(ks, w);
        }
        const strikes = Array.from(new Set(quotes.map(q=>q.K))).sort((a,b)=>a-b);
        const tenors  = Array.from(new Set(quotes.map(q=>q.T))).sort((a,b)=>a-b);
        const ivGrid = surfaceGridFromSVI(strikes, tenors, f0, r, q, fits);

        // Arbitrage checks
        const arb = [
          ...butterflyCheck(quotes.map(({K,call,T})=>({K,call,T}))),
          ...calendarCheck(quotes.map(({K,call,T})=>({K,call,T})))
        ];

        // Greeks grid at current IVs (approx)
        greekGrid.length = 0;
        for (const T of tenors){
          for (const K of strikes){
            const row = quotes.find(q=>q.T===T && q.K===K);
            const iv = row?.iv ?? 0.2;
            const g = greeks('C', f0, K, r, q, iv, T);
            greekGrid.push({ k:K, t:Math.round(T*365), delta:g.delta, gamma:g.gamma, vega:g.vega });
          }
        }

        // ATM IV history + forecast
        const atm = quotes
          .filter(q=>Math.abs(q.K-f0)===Math.min(...quotes.map(x=>Math.abs(x.K-f0))))
          .sort((a,b)=>a.T-b.T)
          .map(q=>q.iv ?? 0.2);
        const atmCurrent = atm[0] ?? 0.2;
        history.unshift({ ts: Date.now(), atmIv: atmCurrent });
        if (history.length > 240) history.pop();
        const forecast = expSmoothForecast(history.map(h=>h.atmIv), 0.35, 8);

        const payload = {
          ts: Date.now(),
          symbol,
          underlier: { price: f0 },
          ivGrid,
          arb,
          forecast,
          history: history.slice(0,120), // send last N
          greeks: greekGrid
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      const id = setInterval(() => { tick().catch(()=>{}); }, 1500);
      tick().catch(()=>{});

      const abort = () => { clearInterval(id); try { controller.close(); } catch {} };
      // @ts-ignore
      req.signal?.addEventListener('abort', abort);
    },
    cancel(){ /* noop */ }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    }
  });
}