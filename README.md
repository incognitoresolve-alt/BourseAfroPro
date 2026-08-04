# 📈 Bourse Afrique Academy

Plateforme éducative pour apprendre à investir sur les marchés boursiers africains — BRVM, NSE, JSE.

**Stack :** Astro 4 · Tailwind CSS · Cloudflare Pages Functions · Supabase (DB + Auth) · Upstash Redis

---

## 🚀 Mise en ligne — guide pas à pas

### Étape 1 — Créer les services externes

Créer un compte sur chaque service (tous gratuits au démarrage) :

| Service | Lien | Usage | Plan gratuit |
|---------|------|-------|-------------|
| **Cloudflare** | https://dash.cloudflare.com | Hébergement (Pages + Functions) | 500 builds/mois, requêtes illimitées |
| **Supabase** | https://supabase.com | Base de données PostgreSQL + Auth | 500 MB |
| **Upstash** | https://upstash.com | Cache Redis serverless | 10 000 req/jour |
| **BRVM API** | https://api.brvm.org | Cours boursiers en temps réel | Optionnel (mock si absent) |

**Supabase — initialiser la base de données :**
1. Créer un projet sur supabase.com
2. Aller dans **SQL Editor**
3. Coller et exécuter le contenu de `supabase-schema.sql` (crée les tables, la fonction `execute_order()` et les policies RLS)
4. Récupérer les clés dans **Project Settings → API** :
   - `SUPABASE_URL` (aussi utilisée comme `PUBLIC_SUPABASE_URL`)
   - `anon public` → `PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_KEY` (⚠️ ne jamais exposer côté client)

**Supabase — activer l'authentification par lien magique :**
1. **Authentication → Providers → Email**
2. Vérifier que **Email** est activé (lien magique, sans mot de passe — c'est le flux utilisé par `src/pages/profil.astro`)
3. **Authentication → URL Configuration** : ajouter l'URL de votre site Cloudflare Pages (ex. `https://bourse-afrique-academy.pages.dev`) aux **Redirect URLs**

**Upstash — créer une base Redis :**
1. Créer une database sur upstash.com (région Europe de préférence)
2. Récupérer dans **REST API** :
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

---

### Étape 2 — Pousser le code sur GitHub

```bash
git init
git add .
git commit -m "feat: initial commit — Bourse Afrique Academy"

git remote add origin https://github.com/VOTRE-USER/bourse-afrique-academy.git
git branch -M main
git push -u origin main
```

---

### Étape 3 — Connecter Cloudflare Pages au repo GitHub

1. Aller sur [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Pages → Connect to Git**
2. Sélectionner le repo `bourse-afrique-academy`
3. Paramètres de build :
   - Framework preset : **Astro**
   - Build command : `npm run build`
   - Build output directory : `dist`
4. Le dossier `functions/` à la racine du repo est détecté et déployé automatiquement comme Pages Functions (routes `/api/*`) — aucune config supplémentaire n'est nécessaire.
5. Cliquer **Save and Deploy**

---

### Étape 4 — Ajouter les variables d'environnement dans Cloudflare Pages

**Workers & Pages → votre projet → Settings → Environment variables** (pour les environnements *Production* et *Preview*) :

```
PUBLIC_SUPABASE_URL        https://xxxx.supabase.co   (build + functions)
PUBLIC_SUPABASE_ANON_KEY   eyJ...                      (build + functions)
SUPABASE_URL                https://xxxx.supabase.co   (functions uniquement)
SUPABASE_SERVICE_KEY        eyJ...                      (functions uniquement — secret)
UPSTASH_REDIS_REST_URL      https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN    AXxx...
BRVM_API_KEY                (optionnel — mock activé si absent)
```

Marquer `SUPABASE_SERVICE_KEY`, `UPSTASH_REDIS_REST_TOKEN` et `BRVM_API_KEY` comme **secrets** (chiffrés, non ré-affichés). Puis redéployer (**Deployments → Retry deployment**) pour que le build reprenne les nouvelles valeurs.

---

### Étape 5 — Ajouter les secrets GitHub Actions (CI/CD)

Pour que le workflow `deploy.yml` fonctionne, ajouter dans **GitHub → Settings → Secrets and variables → Actions** :

| Secret | Où le trouver |
|--------|--------------|
| `PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → Create Token (template *Edit Cloudflare Workers*) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → barre latérale droite de n'importe quelle page |

Les variables server-only (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `UPSTASH_*`, `BRVM_API_KEY`) ne sont pas nécessaires en CI : elles vivent uniquement dans les Environment variables du projet Cloudflare Pages (étape 4), lues au runtime par les Functions.

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

# 4. Lancer le serveur de dev (site statique uniquement, sans les Functions)
npm run dev
# → http://localhost:4321
```

Pour tester le site **avec** les Pages Functions (`/api/*`) en local, via Wrangler :
```bash
npm run cf:dev
# → build + wrangler pages dev ./dist (lit les variables depuis .env / --binding)
```

Autres commandes :
```bash
npm run build    # Build production
npm run preview  # Prévisualiser le build statique local (sans les Functions)
npm run lint     # Vérifier le code
npm run deploy   # Build + déploiement manuel via wrangler pages deploy
```

---

## 📁 Structure du projet

```
bourse-afrique-academy/
├── src/
│   ├── pages/
│   │   ├── index.astro                 # Accueil
│   │   ├── simulateur.astro
│   │   ├── profil.astro                # Connexion Supabase Auth (lien magique)
│   │   └── academy/
│   │       ├── index.astro             # Liste des niveaux/modules
│   │       └── [niveau]/[module].astro # Page d'un module (rendu MDX + quiz)
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── content/
│   │   ├── config.ts        # Schéma (zod) des modules
│   │   └── modules/         # Contenu pédagogique en MDX
│   │       ├── initiation/    # Niveau 1
│   │       ├── fondamentaux/  # Niveau 2
│   │       ├── strategie/     # Niveau 3
│   │       └── avance/        # Niveau 4
│   ├── lib/
│   │   ├── db.ts           # Client Supabase (Auth, navigateur)
│   │   └── market-api.ts   # Fetcher données BRVM (côté client)
│   └── styles/
│       └── global.css      # Tailwind + composants globaux
├── functions/                    # Cloudflare Pages Functions (routes /api/*)
│   ├── lib/
│   │   ├── env.ts               # Typage des variables d'environnement
│   │   ├── auth.ts              # Vérification du JWT Supabase Auth
│   │   └── quotes.ts            # Cours BRVM (cache Redis + API + mock), partagé
│   └── api/
│       ├── market-data.ts       # Proxy cours BRVM (avec cache Redis)
│       ├── portfolio.ts         # CRUD portefeuille virtuel (prix calculé serveur)
│       └── progress.ts          # Progression & XP utilisateur
├── public/
│   ├── _headers            # Headers de sécurité (CSP, etc.) — format Cloudflare Pages
│   └── favicon.svg
├── .github/
│   └── workflows/
│       └── deploy.yml      # CI/CD GitHub Actions → Cloudflare Pages
├── supabase-schema.sql     # Schéma DB + fonction execute_order() + policies RLS
├── astro.config.mjs
├── wrangler.toml            # Config Cloudflare Pages/Functions (nodejs_compat, etc.)
├── tailwind.config.mjs
├── .env.example             # Template variables d'environnement
└── package.json
```

> Seul le module `initiation/01-ecosysteme` est rédigé pour l'instant — les 22 autres
> modules listés dans `src/pages/academy/index.astro` restent à écrire en MDX dans
> `src/content/modules/<niveau>/`.

---

## 💰 Estimation des coûts

| Phase | Utilisateurs actifs | Coût/mois estimé |
|-------|---------------------|-----------------|
| MVP | < 1 000 | **0 €** (Cloudflare Pages/Functions gratuit, Supabase + Upstash free tier) |
| Croissance | ~10 000 | ~25 € |
| Scale | ~100 000 | ~150 € |

---

## 📌 Notes importantes

- **Données de marché** : si `BRVM_API_KEY` est absent, les cours sont générés via un mock réaliste (données fictives avec bruit aléatoire ±1%). Suffisant pour les tests et l'apprentissage.
- **Authentification** : gérée par Supabase Auth (lien magique par email, sans mot de passe). Les Pages Functions valident le token via `supabase.auth.getUser(<access_token>)` (voir `functions/lib/auth.ts`). Le client envoie le token dans l'en-tête `Authorization: Bearer <access_token>` pour les appels à `/api/portfolio` et `/api/progress`.
- **RLS Supabase** : activées avec de vraies policies basées sur `auth.uid()` (voir `supabase-schema.sql`). Les Functions utilisent la clé `service_role` (qui contourne RLS) ; les policies sont une deuxième ligne de défense si le client interroge un jour Supabase directement avec la clé `anon`.
- **Prix des ordres simulés** : toujours recalculé côté serveur (`functions/lib/quotes.ts`), jamais reçu du client, pour empêcher toute manipulation. L'exécution est atomique via la fonction Postgres `execute_order()` (verrou `FOR UPDATE`).
