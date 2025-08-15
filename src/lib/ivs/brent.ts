import { bsPrice } from '../math/blackscholes';

export function brentImpliedVol(
  cp: 'C' | 'P',
  S: number,
  K: number,
  r: number,
  q: number,
  T: number,
  marketPrice: number,
  tol = 1e-8,
  maxIter = 100
): number {
  let low = 1e-9, high = 5.0;
  let fLow = bsPrice(cp, S, K, r, q, low, T) - marketPrice;
  let fHigh = bsPrice(cp, S, K, r, q, high, T) - marketPrice;

  if (fLow * fHigh > 0) throw new Error('No sign change: IV root not bracketed');

  for (let i = 0; i < maxIter; i++) {
    const mid = 0.5 * (low + high);
    const fMid = bsPrice(cp, S, K, r, q, mid, T) - marketPrice;
    if (Math.abs(fMid) < tol) return mid;
    if (fLow * fMid <= 0) {
      high = mid;
      fHigh = fMid;
    } else {
      low = mid;
      fLow = fMid;
    }
  }
  return 0.5 * (low + high);
}