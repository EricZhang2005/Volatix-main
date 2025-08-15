import { describe, it, expect } from 'vitest';
import { bsPrice, impliedVol, greeks } from '@/lib/math/blackscholes';

describe('Black–Scholes', () => {
  it('implied vol inverts pricing within tolerance', () => {
    const cp = 'C' as const; const S=100, K=100, r=0.01, q=0, sigma=0.2, T=0.5;
    const p = bsPrice(cp,S,K,r,q,sigma,T);
    const iv = impliedVol(cp,S,K,r,q,T,p);
    expect(Math.abs(iv - sigma)).toBeLessThan(1e-2);
  });

  it('call price increases with S', () => {
    const p1 = bsPrice('C', 100, 100, 0.01, 0, 0.2, 1);
    const p2 = bsPrice('C', 101, 100, 0.01, 0, 0.2, 1);
    expect(p2).toBeGreaterThan(p1);
  });

  it('gamma non-negative (approx)', () => {
    const g = greeks('C', 100, 100, 0.01, 0, 0.2, 1);
    expect(g.gamma).toBeGreaterThanOrEqual(0);
  });
});