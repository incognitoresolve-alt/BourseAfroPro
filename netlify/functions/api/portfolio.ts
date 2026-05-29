import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

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
    // Exécuter un ordre simulé
    const order = JSON.parse(event.body || '{}');
    const { symbol, quantity, price, side } = order; // side: 'BUY' | 'SELL'

    if (!symbol || !quantity || !price || !side) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: 'Paramètres manquants: symbol, quantity, price, side' }),
      };
    }

    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('*')
      .eq('userId', userId)
      .single();

    if (!portfolio) {
      return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Portefeuille introuvable' }) };
    }

    const totalCost = quantity * price;
    let { cash, positions = [] } = portfolio;

    if (side === 'BUY') {
      if (cash < totalCost) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Fonds insuffisants' }) };
      }
      cash -= totalCost;

      const existing = positions.find((p: any) => p.symbol === symbol);
      if (existing) {
        existing.avgPrice = (existing.avgPrice * existing.quantity + price * quantity) / (existing.quantity + quantity);
        existing.quantity += quantity;
      } else {
        positions.push({ symbol, quantity, avgPrice: price });
      }
    } else if (side === 'SELL') {
      const existing = positions.find((p: any) => p.symbol === symbol);
      if (!existing || existing.quantity < quantity) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Quantité insuffisante en portefeuille' }) };
      }
      cash += totalCost;
      existing.quantity -= quantity;
      if (existing.quantity === 0) {
        positions = positions.filter((p: any) => p.symbol !== symbol);
      }
    }

    const { data, error } = await supabase
      .from('portfolios')
      .update({ cash, positions })
      .eq('userId', userId)
      .select()
      .single();

    return {
      statusCode: error ? 500 : 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, error }),
    };
  }

  return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };
};

