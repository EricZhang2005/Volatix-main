import { describe, it, expect } from 'vitest';
import { fitSVI, surfaceGridFromSVI } from '@/lib/ivs/svi';

describe('SVI fit', () => {
  it('produces positive total variance and grid IVs', () => {
    const ks = [-0.2,-0.1,0,0.1,0.2];
    const T = 0.25; // 3 months
    const ivs = [0.24,0.22,0.2,0.22,0.25];
    const w = ivs.map(v=>v*v*T);
    const p = fitSVI(ks,w);
    const grid = surfaceGridFromSVI([90,100,110],[T],100,0.01,0, { [T]: p });
    expect(grid.length).toBe(3);
    expect(grid.every(cell => cell.iv > 0)).toBe(true);
  });
});
