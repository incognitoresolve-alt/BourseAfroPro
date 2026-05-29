import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export const handler: Handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  const user = context.clientContext?.user;
  if (!user) {
    return {
      statusCode: 401,
      headers: CORS,
      body: JSON.stringify({ error: 'Non autorisé — connectez-vous' }),
    };
  }

  if (event.httpMethod === 'GET') {
    const { data, error } = await supabase
      .from('progressions')
      .select('*')
      .eq('userId', user.sub)
      .order('completedAt', { ascending: false });

    return {
      statusCode: error ? 500 : 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, error }),
    };
  }

  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}');

    if (!body.moduleId || !body.status) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: 'moduleId et status requis' }),
      };
    }

    const { data, error } = await supabase
      .from('progressions')
      .upsert(
        {
          userId: user.sub,
          moduleId: body.moduleId,
          status: body.status,
          xpEarned: body.xpEarned ?? 0,
          completedAt: body.status === 'COMPLETED' ? new Date().toISOString() : null,
        },
        { onConflict: '"userId","moduleId"' }  // guillemets pour colonnes camelCase Postgres
      );

    return {
      statusCode: error ? 500 : 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, error }),
    };
  }

  return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };
};
