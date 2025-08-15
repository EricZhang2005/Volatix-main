import { describe, it, expect } from 'vitest';
import { butterflyCheck, calendarCheck } from '@/lib/arbitrage/checks';

describe('Arbitrage tolerance tuning', () => {
  it('butterfly ignores tiny numerical noise', () => {
    const T=0.3;
    const quotes = [
      { K:100, T, call: 10.0000 },
      { K:105, T, call: 9.00005 },
      { K:110, T, call: 8.2000 }
    ];
    const flags = butterflyCheck(quotes).filter(f=>f.flagged);
    expect(flags.length).toBe(0);
  });

  it('calendar flags meaningful monotonicity breaks', () => {
    const K=100;
    const quotes = [
      { K, T:0.10, call: 5.00 },
      { K, T:0.20, call: 4.80 }
    ];
    const flags = calendarCheck(quotes).filter(f=>f.flagged);
    expect(flags.length).toBe(1);
  });
});