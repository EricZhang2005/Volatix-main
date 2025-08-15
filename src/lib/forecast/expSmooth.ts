export type IVForecast = { t: number; iv: number; ci: [number, number] };

export function expSmoothForecast(values: number[], alpha = 0.3, horizon = 8): IVForecast[] {
  if (!Array.isArray(values) || values.length === 0) return [];
  if (!Number.isFinite(alpha)) alpha = 0.3;
  alpha = Math.min(1, Math.max(1e-6, alpha));
  horizon = Math.max(1, Math.floor(horizon));

  const clean = values.filter(v => Number.isFinite(v));
  if (clean.length === 0) return [];

  let level = clean[0];
  for (let i = 1; i < clean.length; i++) level = alpha * clean[i] + (1 - alpha) * level;

  const residuals = clean.map(v => v - level);
  const denom = Math.max(1, residuals.length - 1);
  const s2 = residuals.reduce((s, x) => s + x * x, 0) / denom;
  const sigma = Math.sqrt(Math.max(s2, 1e-12));

  const z = 1.64;
  const mk = (iv: number): Omit<IVForecast, 't'> => {
    const lo = Math.max(0, iv - z * sigma);
    const hi = Math.max(lo, iv + z * sigma);
    return { iv: Math.max(0, iv), ci: [lo, hi] };
  };

  return Array.from({ length: horizon }, (_, i) => {
    const f = mk(level);
    return { t: i + 1, ...f };
  });
}