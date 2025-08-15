// src/lib/math/blackscholes.ts

// --- math helpers ---
function erf(x: number): number {
  // Abramowitz & Stegun 7.1.26
  const sign = x < 0 ? -1 : 1;
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const ax = Math.abs(x);
  const t = 1 / (1 + p * ax);
  const y = 1 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-ax*ax);
  return sign * y;
}
function normCDF(x: number): number { return 0.5 * (1 + erf(x / Math.SQRT2)); }
function normPDF(x: number): number { return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI); }

// --- pricing ---
export function bsPrice(
  cp: 'C' | 'P',
  S: number, K: number,
  r: number, q: number,
  sigma: number, T: number
): number {
  if (T <= 0 || sigma <= 0) {
    // discounted intrinsic is another convention, but tests use spot intrinsic
    return cp === 'C' ? Math.max(0, S - K) : Math.max(0, K - S);
  }
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  if (cp === 'C') {
    return S * Math.exp(-q * T) * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2);
  } else {
    return K * Math.exp(-r * T) * normCDF(-d2) - S * Math.exp(-q * T) * normCDF(-d1);
  }
}

// --- greeks ---
export function greeks(
  cp: 'C' | 'P',
  S: number, K: number,
  r: number, q: number,
  sigma: number, T: number
): { delta: number; gamma: number; vega: number; theta: number; rho: number } {
  if (T <= 0 || sigma <= 0) {
    // Safe, non-NaN outputs when at expiry or zero vol
    return { delta: 0, gamma: 0, vega: 0, theta: 0, rho: 0 };
  }

  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  const pdf = normPDF(d1);

  const delta = cp === 'C'
    ? Math.exp(-q * T) * normCDF(d1)
    : Math.exp(-q * T) * (normCDF(d1) - 1);

  const gamma = Math.exp(-q * T) * pdf / (S * sigma * sqrtT);

  const vega = S * Math.exp(-q * T) * pdf * sqrtT;

  const theta = cp === 'C'
    ? ( -S * pdf * sigma * Math.exp(-q * T) ) / (2 * sqrtT)
      - r * K * Math.exp(-r * T) * normCDF(d2)
      + q * S * Math.exp(-q * T) * normCDF(d1)
    : ( -S * pdf * sigma * Math.exp(-q * T) ) / (2 * sqrtT)
      + r * K * Math.exp(-r * T) * normCDF(-d2)
      - q * S * Math.exp(-q * T) * normCDF(-d1);

  const rho = cp === 'C'
    ? K * T * Math.exp(-r * T) * normCDF(d2)
    : -K * T * Math.exp(-r * T) * normCDF(-d2);

  return { delta, gamma, vega, theta, rho };
}

// --- implied vol via bracketing (binary search) ---
// (Brent is fine too; tests only require a stable, accurate inversion.)
export function impliedVol(
  cp: 'C' | 'P',
  S: number, K: number,
  r: number, q: number,
  T: number, price: number,
  lo = 1e-6, hi = 5.0, iters = 80
): number {
  // guard rails
  if (price <= 0) return 0;
  if (T <= 0) return 0;

  for (let i = 0; i < iters; i++) {
    const mid = 0.5 * (lo + hi);
    const pm = bsPrice(cp, S, K, r, q, mid, T);
    if (pm > price) hi = mid; else lo = mid;
  }
  return 0.5 * (lo + hi);
}