// src/lib/data/providers/polygon.ts
// Minimal Polygon options snapshot fetcher with graceful fallbacks.
// Requires: POLYGON_API_KEY in env. Returns a normalized quote row.

export type QuoteRow = { K: number; T: number; call: number; iv?: number };

const POLY_BASE = 'https://api.polygon.io';

async function json<T = any>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json() as Promise<T>;
}

type LastTradeResp = { results?: { p?: number; price?: number } };
type ContractsResp = { results?: Array<{ expiration_date?: string }> };
type SnapshotResp = {
  results?: Array<{
    details: { strike_price: number };
    last_trade?: { price?: number };
    last_quote?: { bid?: number; ask?: number };
    day?: { bid?: number; ask?: number };
  }>;
};

export async function fetchOptionChainPolygon(
  symbol: string
): Promise<{ spot: number; quotes: QuoteRow[] }> {
  const key = process.env.POLYGON_API_KEY;
  if (!key) throw new Error('POLYGON_API_KEY missing');

  // 1) Get last trade for underlying
  const u = await json<LastTradeResp>(
    `${POLY_BASE}/v2/last/trade/${encodeURIComponent(symbol)}?apiKey=${key}`
  );
  const spot = (u?.results?.p ?? u?.results?.price ?? 0) as number;

  // 2) Get expiries (normalize to string[])
  const cals = await json<ContractsResp>(
    `${POLY_BASE}/v3/reference/options/contracts?underlying_ticker=${encodeURIComponent(
      symbol
    )}&limit=200&apiKey=${key}`
  );
  const expiries: string[] = Array.from(
    new Set(
      (cals?.results ?? [])
        .map((c) => (c?.expiration_date ? String(c.expiration_date) : ''))
        .filter((s): s is string => s.length > 0)
    )
  )
    .sort()
    .slice(0, 5);

  // 3) For each expiry, pull a handful of strikes around spot using current quotes
  const out: QuoteRow[] = [];

  for (const exp of expiries) {
    const res = await json<SnapshotResp>(
      `${POLY_BASE}/v3/snapshot/options/${encodeURIComponent(
        symbol
      )}?expiration_date=${encodeURIComponent(exp)}&contract_type=call&limit=250&apiKey=${key}`
    );
    const rows = (res?.results ?? []) as NonNullable<SnapshotResp['results']>;
    if (!rows.length) continue;

    // sort by strike
    rows.sort((a, b) => a.details.strike_price - b.details.strike_price);

    // pick ~13 strikes around spot
    const nearestIndex =
      rows.reduce(
        (best, r, i) => {
          const d = Math.abs(r.details.strike_price - spot);
          return d < best.d ? { i, d } : best;
        },
        { i: 0, d: Number.POSITIVE_INFINITY }
      ).i ?? 0;

    const start = Math.max(0, nearestIndex - 6);
    const slice = rows.slice(start, start + 13);

    // T (years, ACT/365)
    const ms = +new Date(exp) - Date.now();
    const days = Math.max(1, Math.round(ms / 86_400_000));
    const T = days / 365;

    for (const r of slice) {
      const K = r.details.strike_price;
      const bid = r.day?.bid ?? r.last_quote?.bid ?? 0;
      const ask = r.day?.ask ?? r.last_quote?.ask ?? 0;
      const last = r.last_trade?.price ?? 0;
      const mid = bid > 0 && ask > 0 ? 0.5 * (bid + ask) : last;
      if (mid > 0 && Number.isFinite(K) && Number.isFinite(T)) {
        out.push({ K, T, call: mid });
      }
    }
  }

  return { spot, quotes: out };
}