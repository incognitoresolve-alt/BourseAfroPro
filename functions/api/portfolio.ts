import type { PagesFunction } from '@cloudflare/workers-types';
import { createClient } from '@supabase/supabase-js';
import type { Env } from '../lib/env';
import { getQuote } from '../lib/quotes';
import { requireUser } from '../lib/auth';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const INITIAL_CASH = 10_000_000; // 10 millions FCFA

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: CORS });

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireUser(request, env);
  if (!user) return json({ error: 'Non autorisé' }, 401);

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  // Récupérer ou créer le portefeuille virtuel
  let { data } = await supabase
    .from('portfolios')
    .select('*')
    .eq('userId', user.id)
    .single();

  if (!data) {
    const { data: newPortfolio } = await supabase
      .from('portfolios')
      .insert({ userId: user.id, cash: INITIAL_CASH, positions: [] })
      .select()
      .single();
    data = newPortfolio;
  }

  return json({ data });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireUser(request, env);
  if (!user) return json({ error: 'Non autorisé' }, 401);

  // Exécuter un ordre simulé — le prix est toujours recalculé côté
  // serveur (jamais fourni par le client) pour empêcher toute manipulation.
  const order = (await request.json().catch(() => ({}))) as {
    symbol?: string;
    quantity?: number;
    side?: string;
  };
  const { symbol, quantity, side } = order;

  if (!symbol || typeof symbol !== 'string') {
    return json({ error: 'Paramètre manquant: symbol' }, 400);
  }
  if (!Number.isInteger(quantity) || (quantity as number) <= 0) {
    return json({ error: 'quantity doit être un entier positif' }, 400);
  }
  if (side !== 'BUY' && side !== 'SELL') {
    return json({ error: "side doit être 'BUY' ou 'SELL'" }, 400);
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  const { data: quote } = await getQuote(symbol, env);

  // execute_order verrouille la ligne du portefeuille (SELECT ... FOR
  // UPDATE) et applique cash/positions en une seule transaction atomique,
  // ce qui élimine les races entre ordres concurrents du même utilisateur.
  const { data, error } = await supabase.rpc('execute_order', {
    p_user_id: user.id,
    p_symbol: quote.symbol,
    p_quantity: quantity,
    p_price: quote.price,
    p_side: side,
  });

  if (error) {
    const knownErrors: Record<string, string> = {
      fonds_insuffisants: 'Fonds insuffisants',
      quantite_insuffisante: 'Quantité insuffisante en portefeuille',
      portefeuille_introuvable: 'Portefeuille introuvable',
    };
    const message = knownErrors[error.message] ?? "Erreur lors de l'exécution de l'ordre";
    const statusCode = error.message === 'portefeuille_introuvable' ? 404 : 400;
    return json({ error: message }, statusCode);
  }

  return json({ data, executedPrice: quote.price });
};
