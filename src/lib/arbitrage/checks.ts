export type ArbFlag = {
  type: string;
  expiry: string;
  strikes: number[];
  metric: number;
  flagged: boolean;
  detail?: string;
};

const BUTTERFLY_TOL = 5e-4;
const CALENDAR_TOL  = 1e-6;
const MIN_SPACING   = 1e-6;
const SMOOTH_LAMBDA = 0.10;

export function butterflyCheck(quotes: {K:number; call:number; T:number}[]): ArbFlag[] {
  const out: ArbFlag[] = [];
  const byT: Record<number, {K:number; call:number; T:number}[]> = {};
  for (const q of quotes) (byT[q.T] ??= []).push(q);

  for (const T of Object.keys(byT).map(Number)) {
    const arr = byT[T].slice().sort((a,b)=>a.K-b.K);
    for (let i=1; i<arr.length-1; i++) {
      const K1=arr[i-1].K, K2=arr[i].K, K3=arr[i+1].K;
      const C1=arr[i-1].call, C2=arr[i].call, C3=arr[i+1].call;
      const h1=K2-K1, h2=K3-K2;
      if (h1 < MIN_SPACING || h2 < MIN_SPACING) continue;

      const C2s = (C1 + SMOOTH_LAMBDA*C2 + C3) / (2 + SMOOTH_LAMBDA);
      const metric = h2*(C2s - C1) - h1*(C3 - C2s);
      const flagged = metric > BUTTERFLY_TOL;

      out.push({
        type: 'butterfly',
        expiry: `T=${T.toFixed(3)}`,
        strikes: [K1,K2,K3],
        metric,
        flagged,
        detail: `Δ=${metric.toExponential(2)} @ [${K1}, ${K2}, ${K3}]`
      });
    }
  }
  return out;
}

export function calendarCheck(quotes: {K:number; call:number; T:number}[]): ArbFlag[] {
  const out: ArbFlag[] = [];
  const byK: Record<number, {K:number; call:number; T:number}[]> = {};
  for (const q of quotes) (byK[q.K] ??= []).push(q);

  for (const K of Object.keys(byK).map(Number)) {
    const arr = byK[K].slice().sort((a,b)=>a.T-b.T);
    for (let i=0; i<arr.length-1; i++) {
      const shorter = arr[i], longer = arr[i+1];
      // Flag if longer expiry is *cheaper* by more than tol
      const flagged = longer.call + CALENDAR_TOL < shorter.call;
      const diff = shorter.call - longer.call;
      out.push({
        type: 'calendar',
        expiry: `${shorter.T.toFixed(3)}→${longer.T.toFixed(3)}`,
        strikes: [K],
        metric: diff,
        flagged,
        detail: `Δ=${diff.toExponential(2)} @ K=${K}`
      });
    }
  }
  return out;
}