import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../lib/env';
import { getQuote } from '../lib/quotes';
import { toonResponse } from '../lib/toon';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const symbol = url.searchParams.get('symbol') || 'SNTS';
  const result = await getQuote(symbol, env);

  return toonResponse(result, 200, { 'Cache-Control': 'public, max-age=30' });
};
