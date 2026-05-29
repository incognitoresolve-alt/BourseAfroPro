import type { Handler } from '@netlify/functions';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const CACHE_TTL = 60; // secondes

// Données de démo réalistes si l'API BRVM est indisponible
const MOCK_PRICES: Record<string, { name: string; base: number }> = {
  SNTS: { name: 'Sonatel',          base: 28700 },
  SGBC: { name: 'SGB Côte d\'Ivoire', base: 9600  },
  CIEC: { name: 'CIE',               base: 2200  },
  ORAC: { name: 'Orange CI',         base: 4995  },
  BOAB: { name: 'BOA Burkina',       base: 3450  },
  PALC: { name: 'PALM CI',           base: 7200  },
};

function mockQuote(symbol: string) {
  const meta = MOCK_PRICES[symbol] ?? { name: symbol, base: 1000 };
  const noise = (Math.random() - 0.5) * meta.base * 0.02;
  return {
    symbol,
    name: meta.name,
    price: Math.round(meta.base + noise),
    change: parseFloat(((Math.random() - 0.5) * 4).toFixed(2)),
    volume: Math.floor(Math.random() * 500000 + 50000),
    timestamp: new Date().toISOString(),
    isMock: true,
  };
}

export const handler: Handler = async (event) => {
  const symbol = (event.queryStringParameters?.symbol || 'SNTS').toUpperCase();
  const cacheKey = `market:${symbol}`;

  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=30',
  };

  // 1. Vérifier cache Redis
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ source: 'cache', data: cached }),
      };
    }
  } catch (_) {
    // Redis indisponible → on continue sans cache
  }

  // 2. Appel API BRVM (si clé présente)
  if (process.env.BRVM_API_KEY) {
    try {
      const res = await fetch(`https://api.brvm.org/v1/quote/${symbol}`, {
        headers: { Authorization: `Bearer ${process.env.BRVM_API_KEY}` },
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const data = await res.json();
        await redis.setex(cacheKey, CACHE_TTL, data).catch(() => {});
        return { statusCode: 200, headers, body: JSON.stringify({ source: 'api', data }) };
      }
    } catch (_) {
      // timeout ou erreur réseau → fallback
    }
  }

  // 3. Fallback mock
  const data = mockQuote(symbol);
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ source: 'fallback', data }),
  };
};

