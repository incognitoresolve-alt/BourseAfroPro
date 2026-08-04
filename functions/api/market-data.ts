import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../lib/env';
import { getQuote } from '../lib/quotes';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const symbol = url.searchParams.get('symbol') || 'SNTS';
  const result = await getQuote(symbol, env);

  return new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=30',
    },
  });
};
