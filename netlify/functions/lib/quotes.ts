import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const CACHE_TTL = 60; // secondes

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  volume: number;
  timestamp: string;
  isMock?: boolean;
}

// Données de démo réalistes si l'API BRVM est indisponible
const MOCK_PRICES: Record<string, { name: string; base: number }> = {
  SNTS: { name: 'Sonatel', base: 28700 },
  SGBC: { name: "SGB Côte d'Ivoire", base: 9600 },
  CIEC: { name: 'CIE', base: 2200 },
  ORAC: { name: 'Orange CI', base: 4995 },
  BOAB: { name: 'BOA Burkina', base: 3450 },
  PALC: { name: 'PALM CI', base: 7200 },
};

function mockQuote(symbol: string): Quote {
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

export interface QuoteResult {
  source: 'cache' | 'api' | 'fallback';
  data: Quote;
}

// Récupère un cours (cache Redis → API BRVM → mock), utilisé à la fois par
// la fonction publique market-data et par portfolio (calcul du prix serveur).
export async function getQuote(rawSymbol: string): Promise<QuoteResult> {
  const symbol = rawSymbol.toUpperCase();
  const cacheKey = `market:${symbol}`;

  try {
    const cached = await redis.get<Quote>(cacheKey);
    if (cached) {
      return { source: 'cache', data: cached };
    }
  } catch (_) {
    // Redis indisponible → on continue sans cache
  }

  if (process.env.BRVM_API_KEY) {
    try {
      const res = await fetch(`https://api.brvm.org/v1/quote/${symbol}`, {
        headers: { Authorization: `Bearer ${process.env.BRVM_API_KEY}` },
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const data = (await res.json()) as Quote;
        await redis.setex(cacheKey, CACHE_TTL, data).catch(() => {});
        return { source: 'api', data };
      }
    } catch (_) {
      // timeout ou erreur réseau → fallback
    }
  }

  return { source: 'fallback', data: mockQuote(symbol) };
}
