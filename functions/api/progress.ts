import type { PagesFunction } from '@cloudflare/workers-types';
import { createClient } from '@supabase/supabase-js';
import type { Env } from '../lib/env';
import { requireUser } from '../lib/auth';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

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
  if (!user) return json({ error: 'Non autorisé — connectez-vous' }, 401);

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  const { data, error } = await supabase
    .from('progressions')
    .select('*')
    .eq('userId', user.id)
    .order('completedAt', { ascending: false });

  return json({ data, error }, error ? 500 : 200);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireUser(request, env);
  if (!user) return json({ error: 'Non autorisé — connectez-vous' }, 401);

  const body = (await request.json().catch(() => ({}))) as {
    moduleId?: string;
    status?: string;
    xpEarned?: number;
  };

  if (!body.moduleId || !body.status) {
    return json({ error: 'moduleId et status requis' }, 400);
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  const { data, error } = await supabase.from('progressions').upsert(
    {
      userId: user.id,
      moduleId: body.moduleId,
      status: body.status,
      xpEarned: body.xpEarned ?? 0,
      completedAt: body.status === 'COMPLETED' ? new Date().toISOString() : null,
    },
    { onConflict: 'userId,moduleId' }
  );

  return json({ data, error }, error ? 500 : 200);
};
