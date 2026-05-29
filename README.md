# 📈 Bourse Afrique Academy

Plateforme éducative pour apprendre à investir sur les marchés boursiers africains — BRVM, NSE, JSE.

**Stack :** Astro 4 · Tailwind CSS · Netlify Functions · Supabase · Upstash Redis · Netlify Identity

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/VOTRE-USER/bourse-afrique-academy)

---

## 🚀 Mise en ligne — guide pas à pas

### Étape 1 — Créer les services externes

Créer un compte sur chaque service (tous gratuits au démarrage) :

| Service | Lien | Usage | Plan gratuit |
|---------|------|-------|-------------|
| **Supabase** | https://supabase.com | Base de données PostgreSQL | 500 MB |
| **Upstash** | https://upstash.com | Cache Redis serverless | 10 000 req/jour |
| **BRVM API** | https://api.brvm.org | Cours boursiers en temps réel | Optionnel (mock si absent) |

**Supabase — initialiser la base de données :**
1. Créer un projet sur supabase.com
2. Aller dans **SQL Editor**
3. Coller et exécuter le contenu de `supabase-schema.sql`
4. Récupérer les clés dans **Project Settings → API** :
   - `SUPABASE_URL`
   - `anon public` → `SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_KEY`

**Upstash — créer une base Redis :**
1. Créer une database sur upstash.com (région Europe de préférence)
2. Récupérer dans **REST API** :
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

---

### Étape 2 — Pousser le code sur GitHub

```bash
# Cloner / initialiser le repo
git init
git add .
git commit -m "feat: initial commit — Bourse Afrique Academy"

# Créer un repo GitHub (sans README, sans .gitignore)
# Puis :
git remote add origin https://github.com/VOTRE-USER/bourse-afrique-academy.git
git branch -M main
git push -u origin main
```

---

### Étape 3 — Connecter Netlify au repo GitHub

1. Aller sur [app.netlify.com](https://app.netlify.com) → **Add new site → Import from Git**
2. Sélectionner **GitHub** → choisir le repo `bourse-afrique-academy`
3. Les paramètres de build sont auto-détectés depuis `netlify.toml` :
   - Build command : `npm run build`
   - Publish directory : `dist`
4. Cliquer **Deploy site**

---

### Étape 4 — Ajouter les variables d'environnement dans Netlify

**Site settings → Environment variables → Add a variable** (une par une) :

```
SUPABASE_URL              https://xxxx.supabase.co
SUPABASE_ANON_KEY         eyJ...
SUPABASE_SERVICE_KEY      eyJ...
UPSTASH_REDIS_REST_URL    https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN  AXxx...
BRVM_API_KEY              (optionnel — mock activé si absent)
```

Puis **Deploys → Trigger deploy → Deploy site** pour rebuilder avec les variables.

---

### Étape 5 — Activer Netlify Identity (authentification)

**Site settings → Identity → Enable Identity**

Options recommandées :
- Registration : **Invite only** (contrôle des accès) ou **Open** (inscription libre)
- External providers : Google, GitHub (optionnel)

---

### Étape 6 — Ajouter les secrets GitHub Actions (CI/CD)

Pour que le workflow `deploy.yml` fonctionne, ajouter dans **GitHub → Settings → Secrets and variables → Actions** :

| Secret | Où le trouver |
|--------|--------------|
| `SUPABASE_URL` | Supabase → Project Settings → API |
| `SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_KEY` | Supabase → Project Settings → API |
| `UPSTASH_REDIS_REST_URL` | Upstash → Database → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash → Database → REST API |
| `BRVM_API_KEY` | api.brvm.org (optionnel) |
| `NETLIFY_AUTH_TOKEN` | Netlify → User settings → Applications → New access token |
| `NETLIFY_SITE_ID` | Netlify → Site settings → General → Site ID |

---

## 💻 Développement local

```bash
# 1. Cloner
git clone https://github.com/VOTRE-USER/bourse-afrique-academy.git
cd bourse-afrique-academy

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# → Ouvrir .env et remplir les clés

# 4. Lancer le serveur de dev
npm run dev
# → http://localhost:4321
```

Autres commandes :
```bash
npm run build    # Build production
npm run preview  # Prévisualiser le build local
npm run lint     # Vérifier le code
```

---

## 📁 Structure du projet

```
bourse-afrique-academy/
├── src/
│   ├── pages/              # Routes Astro (index, academy, simulateur, profil)
│   │   └── academy/        # Page liste des modules
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── content/
│   │   └── modules/        # Contenu pédagogique en MDX
│   │       ├── niveau-1/   # Initiation
│   │       ├── niveau-2/   # Fondamentaux
│   │       ├── niveau-3/   # Stratégie
│   │       └── niveau-4/   # Avancé
│   ├── lib/
│   │   ├── db.ts           # Client Supabase + types
│   │   └── market-api.ts   # Fetcher données BRVM
│   └── styles/
│       └── global.css      # Tailwind + composants globaux
├── netlify/
│   └── functions/
│       └── api/
│           ├── market-data.ts   # Proxy cours BRVM (avec cache Redis)
│           ├── portfolio.ts     # CRUD portefeuille virtuel
│           └── progress.ts      # Progression & XP utilisateur
├── .github/
│   └── workflows/
│       └── deploy.yml      # CI/CD GitHub Actions → Netlify
├── supabase-schema.sql     # Schéma DB à exécuter sur Supabase
├── astro.config.mjs
├── netlify.toml
├── tailwind.config.mjs
├── .env.example            # Template variables d'environnement
└── package.json
```

---

## 💰 Estimation des coûts

| Phase | Utilisateurs actifs | Coût/mois estimé |
|-------|---------------------|-----------------|
| MVP | < 1 000 | **0 €** |
| Croissance | ~10 000 | ~54 € |
| Scale | ~100 000 | ~204 € |

---

## 📌 Notes importantes

- **Données de marché** : si `BRVM_API_KEY` est absent, les cours sont générés via un mock réaliste (données fictives avec bruit aléatoire ±1%). Suffisant pour les tests et l'apprentissage.
- **Authentification** : gérée par Netlify Identity (JWT). Les Netlify Functions valident le token via `context.clientContext.user`.
- **RLS Supabase** : les politiques Row Level Security sont à configurer manuellement selon votre configuration d'auth (voir commentaires dans `supabase-schema.sql`).
