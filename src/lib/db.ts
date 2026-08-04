import { createClient } from '@supabase/supabase-js';

// Client Supabase utilisé côté navigateur (Auth) : seules les variables
// préfixées PUBLIC_ sont exposées par Astro dans le bundle client.
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types base de données
export interface UserProgression {
  id: string;
  userId: string;
  moduleId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  xpEarned: number;
  completedAt: string | null;
  createdAt: string;
}

export interface VirtualPortfolio {
  id: string;
  userId: string;
  cash: number; // en FCFA
  positions: PortfolioPosition[];
  createdAt: string;
}

export interface PortfolioPosition {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice?: number;
}
