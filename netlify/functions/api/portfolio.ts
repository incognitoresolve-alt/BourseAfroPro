import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { getQuote } from '../lib/quotes';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
};

const INITIAL_CASH = 10_000_000; // 10 millions FCFA

export const handler: Handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  const user = context.clientContext?.user;
  if (!user) {
    return {
      statusCode: 401,
      headers: CORS,
      body: JSON.stringify({ error: 'Non autorisé' }),
    };
  }

  const userId = user.sub;

  if (event.httpMethod === 'GET') {
    // Récupérer ou créer le portefeuille virtuel
    let { data } = await supabase
      .from('portfolios')
      .select('*')
      .eq('userId', userId)
      .single();

    if (!data) {
      const { data: newPortfolio } = await supabase
        .from('portfolios')
        .insert({ userId, cash: INITIAL_CASH, positions: [] })
        .select()
        .single();
      data = newPortfolio;
    }

    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    };
  }

  if (event.httpMethod === 'POST') {
    // Exécuter un ordre simulé — le prix est toujours recalculé côté
    // serveur (jamais fourni par le client) pour empêcher toute manipulation.
    const order = JSON.parse(event.body || '{}');
    const { symbol, quantity, side } = order; // side: 'BUY' | 'SELL'

    if (!symbol || typeof symbol !== 'string') {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: 'Paramètre manquant: symbol' }),
      };
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: 'quantity doit être un entier positif' }),
      };
    }
    if (side !== 'BUY' && side !== 'SELL') {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: "side doit être 'BUY' ou 'SELL'" }),
      };
    }

    const { data: quote } = await getQuote(symbol);

    // execute_order verrouille la ligne du portefeuille (SELECT ... FOR
    // UPDATE) et applique cash/positions en une seule transaction atomique,
    // ce qui élimine les races entre ordres concurrents du même utilisateur.
    const { data, error } = await supabase.rpc('execute_order', {
      p_user_id: userId,
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
      const message = knownErrors[error.message] ?? 'Erreur lors de l\'exécution de l\'ordre';
      const statusCode = error.message === 'portefeuille_introuvable' ? 404 : 400;
      return { statusCode, headers: CORS, body: JSON.stringify({ error: message }) };
    }

    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, executedPrice: quote.price }),
    };
  }

  return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };
};
