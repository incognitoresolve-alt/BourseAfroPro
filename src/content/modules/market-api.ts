// Client-side market data fetcher
// Les appels directs aux APIs tierces passent par nos Netlify Functions

export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;       // % variation journalière
  volume: number;
  timestamp: string;
  isMock?: boolean;
}

// Titres BRVM de référence pour la démo
export const BRVM_WATCHLIST: Pick<MarketQuote, 'symbol' | 'name'>[] = [
  { symbol: 'SNTS', name: 'Sonatel' },
  { symbol: 'SGBC', name: 'SGB Côte d\'Ivoire' },
  { symbol: 'CIEC', name: 'CIE' },
  { symbol: 'ORAC', name: 'Orange CI' },
  { symbol: 'BOAB', name: 'BOA Burkina' },
  { symbol: 'PALC', name: 'PALM CI' },
];

export async function fetchQuote(symbol: string): Promise<MarketQuote> {
  const res = await fetch(`/.netlify/functions/api/market-data?symbol=${symbol}`);
  if (!res.ok) throw new Error('Erreur chargement cours');
  const { data } = await res.json();
  return data;
}

export async function fetchWatchlist(): Promise<MarketQuote[]> {
  const results = await Promise.allSettled(
    BRVM_WATCHLIST.map(t => fetchQuote(t.symbol))
  );
  return results
    .filter((r): r is PromiseFulfilledResult<MarketQuote> => r.status === 'fulfilled')
    .map(r => r.value);
}
