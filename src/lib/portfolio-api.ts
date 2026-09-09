// Client-side portfolio fetcher — requêtes/réponses en TOON, authentifiées
// par le token de session Supabase Auth.
import { decode, encode } from '@toon-format/toon';
import { supabase } from './db';
import type { PortfolioPosition, VirtualPortfolio } from './db';

const TOON_CONTENT_TYPE = 'text/toon; charset=utf-8';

async function authHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('NOT_AUTHENTICATED');
  return { Authorization: `Bearer ${session.access_token}` };
}

async function parseToon<T>(res: Response): Promise<T> {
  const text = await res.text();
  return (text ? decode(text) : {}) as T;
}

export async function getPortfolio(): Promise<VirtualPortfolio> {
  const headers = await authHeaders();
  const res = await fetch('/api/portfolio', { headers });
  const body = await parseToon<{ data: VirtualPortfolio; error?: string }>(res);
  if (!res.ok) throw new Error(body.error || 'Erreur de chargement du portefeuille');
  return body.data;
}

export interface OrderInput {
  symbol: string;
  quantity: number;
  side: 'BUY' | 'SELL';
}

export interface OrderResult {
  data: VirtualPortfolio;
  executedPrice: number;
}

export async function placeOrder(order: OrderInput): Promise<OrderResult> {
  const headers = await authHeaders();
  const res = await fetch('/api/portfolio', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': TOON_CONTENT_TYPE },
    body: encode(order),
  });
  const body = await parseToon<OrderResult & { error?: string }>(res);
  if (!res.ok) throw new Error(body.error || "Erreur lors de l'exécution de l'ordre");
  return body;
}

export type { PortfolioPosition, VirtualPortfolio };
