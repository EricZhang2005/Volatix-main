// Minimal Polygon options snapshot fetcher with graceful fallbacks.
// Requires: POLYGON_API_KEY in env. Returns a normalized quote row.

export type QuoteRow = { K:number; T:number; call:number; iv?:number };

const POLY_BASE = 'https://api.polygon.io';

async function json(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

export async function fetchOptionChainPolygon(symbol: string) {
  const key = process.env.POLYGON_API_KEY;
  if (!key) throw new Error('POLYGON_API_KEY missing');
  // Strategy: use aggregates for a few expiries and strikes near spot.
  // 1) Get last trade for underlier
  const u = await json(`${POLY_BASE}/v2/last/trade/${encodeURIComponent(symbol)}?apiKey=${key}`);
  const spot = u?.results?.p ?? u?.results?.price ?? 0;

  // 2) Find next few expiries
  const cals = await json(`${POLY_BASE}/v3/reference/options/contracts?underlying_ticker=${encodeURIComponent(symbol)}&limit=200&apiKey=${key}`);
  const expiries: string[] = Array.from(new Set((cals?.results ?? []).map((c:any)=>c.expiration_date))).sort().slice(0,5);

  // 3) For each expiry, pull a handful of strikes around spot using current quotes
  const out: QuoteRow[] = [];
  for (const exp of expiries) {
    const res = await json(`${POLY_BASE}/v3/snapshot/options/${encodeURIComponent(symbol)}?expiration_date=${exp}&contract_type=call&limit=250&apiKey=${key}`);
    const rows = (res?.results ?? []) as any[];
    if (!rows.length) continue;

    // keep ~13 strikes around spot
    rows.sort((a,b)=>a.details.strike_price - b.details.strike_price);
    const nearest = rows.reduce((best, r, i) => {
      const d = Math.abs(r.details.strike_price - spot);
      return d < best.d ? { i, d } : best;
    }, { i: 0, d: Infinity }).i;
    const start = Math.max(0, nearest - 6);
    const slice = rows.slice(start, start + 13);

    // T in years (ACT/365)
    const T = Math.max(1, Math.round((+new Date(exp) - Date.now()) / 86400000)) / 365;

    for (const r of slice) {
      const K = r.details.strike_price;
      // mid as (bid+ask)/2 fallback on last
      const bid = r.day?.bid ?? r.last_quote?.bid ?? 0;
      const ask = r.day?.ask ?? r.last_quote?.ask ?? 0;
      const last = r.last_trade?.price ?? 0;
      const mid = (bid > 0 && ask > 0) ? 0.5*(bid+ask) : last;
      if (mid > 0) out.push({ K, T, call: mid });
    }
  }

  return { spot, quotes: out };
}