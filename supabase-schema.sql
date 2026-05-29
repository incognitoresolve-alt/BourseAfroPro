-- =============================================
-- Bourse Afrique Academy — Schéma Supabase
-- À exécuter dans l'éditeur SQL de Supabase
-- =============================================

-- Table des progressions utilisateurs
CREATE TABLE IF NOT EXISTS progressions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId"    TEXT NOT NULL,
  "moduleId"  TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'NOT_STARTED'
                CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
  "xpEarned"  INTEGER NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE ("userId", "moduleId")
);

-- Table des portefeuilles virtuels
CREATE TABLE IF NOT EXISTS portfolios (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId"   TEXT NOT NULL UNIQUE,
  cash       NUMERIC(15, 2) NOT NULL DEFAULT 10000000,
  positions  JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Table des transactions simulées (historique)
CREATE TABLE IF NOT EXISTS transactions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId"   TEXT NOT NULL,
  symbol     TEXT NOT NULL,
  side       TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
  quantity   INTEGER NOT NULL,
  price      NUMERIC(12, 2) NOT NULL,
  total      NUMERIC(15, 2) NOT NULL,
  "executedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Index utiles
CREATE INDEX IF NOT EXISTS idx_progressions_user ON progressions ("userId");
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions ("userId");

-- Row Level Security (RLS) — chaque user ne voit que ses données
ALTER TABLE progressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Les policies RLS utilisent le JWT Netlify Identity
-- Note: adaptez selon votre configuration d'auth Supabase/Netlify
