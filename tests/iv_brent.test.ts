import { describe, it, expect } from 'vitest';
import { bsPrice, impliedVol } from '@/lib/math/blackscholes';

describe('Implied vol (Brent) robustness', () => {
  it('deep OTM call inversion is accurate', () => {
    const cp='C' as const; const S=100, K=150, r=0.01, q=0, T=1, sigma=0.35;
    const p = bsPrice(cp,S,K,r,q,sigma,T);
    const iv = impliedVol(cp,S,K,r,q,T,p);
    expect(Math.abs(iv - sigma)).toBeLessThan(2e-2);
  });

  it('deep ITM region behaves', () => {
    const cp='C' as const; const S=100, K=60, r=0.015, q=0.0, T=0.5, sigma=0.25;
    const p = bsPrice(cp,S,K,r,q,sigma,T);
    const iv = impliedVol(cp,S,K,r,q,T,p);
    expect(Math.abs(iv - sigma)).toBeLessThan(2e-2);
  });
});