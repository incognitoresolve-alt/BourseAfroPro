import type { Handler } from '@netlify/functions';
import { getQuote } from '../lib/quotes';

export const handler: Handler = async (event) => {
  const symbol = event.queryStringParameters?.symbol || 'SNTS';

  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=30',
  };

  const result = await getQuote(symbol);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(result),
  };
};
