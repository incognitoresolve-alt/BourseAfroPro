import { createClient } from '@supabase/supabase-js';
import type { Env } from './env';

// Vérifie le JWT Supabase Auth envoyé par le client (Authorization: Bearer <access_token>).
export async function requireUser(request: Request, env: Env) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return null;

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}
