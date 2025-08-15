import { NextRequest } from 'next/server';
import { greeks, bsPrice } from '@/lib/math/blackscholes';

export const runtime = 'edge';

export async function POST(req: NextRequest){
  const body = await req.json();
  const { cp, S, K, r, q, sigma, T } = body;
  const price = bsPrice(cp, S, K, r, q, sigma, T);
  const g = greeks(cp, S, K, r, q, sigma, T);
  return new Response(JSON.stringify({ price, greeks: g }), { headers: { 'content-type':'application/json' } });
}