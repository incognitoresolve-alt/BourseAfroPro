import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

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
