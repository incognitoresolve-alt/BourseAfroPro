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

-- =============================================
-- execute_order — exécution atomique d'un ordre simulé
-- =============================================
-- Verrouille la ligne du portefeuille (FOR UPDATE) le temps de la
-- transaction pour empêcher deux ordres concurrents du même utilisateur
-- de produire un cash négatif ou une position incohérente. Le prix
-- (p_price) doit toujours être calculé côté serveur, jamais reçu du client.
CREATE OR REPLACE FUNCTION execute_order(
  p_user_id   TEXT,
  p_symbol    TEXT,
  p_quantity  INTEGER,
  p_price     NUMERIC,
  p_side      TEXT
) RETURNS portfolios AS $$
DECLARE
  v_portfolio portfolios%ROWTYPE;
  v_total     NUMERIC;
  v_positions JSONB;
  v_idx       INTEGER;
  v_new_qty   INTEGER;
  v_new_avg   NUMERIC;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'quantite_invalide';
  END IF;
  IF p_price IS NULL OR p_price <= 0 THEN
    RAISE EXCEPTION 'prix_invalide';
  END IF;
  IF p_side NOT IN ('BUY', 'SELL') THEN
    RAISE EXCEPTION 'side_invalide';
  END IF;

  SELECT * INTO v_portfolio FROM portfolios WHERE "userId" = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'portefeuille_introuvable';
  END IF;

  v_total := p_quantity * p_price;
  v_positions := v_portfolio.positions;

  SELECT (ordinality - 1) INTO v_idx
  FROM jsonb_array_elements(v_positions) WITH ORDINALITY AS elem(value, ordinality)
  WHERE elem.value ->> 'symbol' = p_symbol;

  IF p_side = 'BUY' THEN
    IF v_portfolio.cash < v_total THEN
      RAISE EXCEPTION 'fonds_insuffisants';
    END IF;

    IF v_idx IS NOT NULL THEN
      v_new_qty := (v_positions -> v_idx ->> 'quantity')::INTEGER + p_quantity;
      v_new_avg := (
        (v_positions -> v_idx ->> 'avgPrice')::NUMERIC * (v_positions -> v_idx ->> 'quantity')::INTEGER + v_total
      ) / v_new_qty;
      v_positions := jsonb_set(
        v_positions, ARRAY[v_idx::TEXT],
        jsonb_build_object('symbol', p_symbol, 'quantity', v_new_qty, 'avgPrice', v_new_avg)
      );
    ELSE
      v_positions := v_positions || jsonb_build_array(
        jsonb_build_object('symbol', p_symbol, 'quantity', p_quantity, 'avgPrice', p_price)
      );
    END IF;

    UPDATE portfolios
    SET cash = cash - v_total, positions = v_positions, "updatedAt" = NOW()
    WHERE "userId" = p_user_id
    RETURNING * INTO v_portfolio;

  ELSE -- SELL
    IF v_idx IS NULL OR (v_positions -> v_idx ->> 'quantity')::INTEGER < p_quantity THEN
      RAISE EXCEPTION 'quantite_insuffisante';
    END IF;

    v_new_qty := (v_positions -> v_idx ->> 'quantity')::INTEGER - p_quantity;
    IF v_new_qty = 0 THEN
      v_positions := v_positions - v_idx;
    ELSE
      v_positions := jsonb_set(v_positions, ARRAY[v_idx::TEXT, 'quantity'], to_jsonb(v_new_qty));
    END IF;

    UPDATE portfolios
    SET cash = cash + v_total, positions = v_positions, "updatedAt" = NOW()
    WHERE "userId" = p_user_id
    RETURNING * INTO v_portfolio;
  END IF;

  INSERT INTO transactions ("userId", symbol, side, quantity, price, total)
  VALUES (p_user_id, p_symbol, p_side, p_quantity, p_price, v_total);

  RETURN v_portfolio;
END;
$$ LANGUAGE plpgsql;
