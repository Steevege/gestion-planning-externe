# Architecture Technique - gestion-planning-externe

## 🎯 Stack Technique Retenu

### Frontend
- **Framework** : Next.js 16.1.6 (App Router)
- **UI Library** : React 19.x
- **Styling** : Tailwind CSS 3.4+
- **Composant Calendrier** : React Big Calendar 1.19.4
- **Build Tool** : Next.js (intégré)

### Backend
- **Runtime** : Node.js 20.x LTS
- **Framework API** : Next.js API Routes (Route Handlers)
- **Algorithme Optimisation** : javascript-lp-solver (latest)
- **Emails** : Resend (free tier 100 emails/jour) - V1

### Base de données
- **Provider** : Supabase (PostgreSQL 15)
- **ORM/Client** : @supabase/supabase-js 2.94.1
- **Sécurité** : Row Level Security (RLS)

### Hébergement & Déploiement
- **Frontend + Backend** : Vercel (free tier, domaine .vercel.app)
- **Base de données** : Supabase (projet existant partagé)
- **CI/CD** : GitHub + Vercel (déploiement automatique)

---

## 🏗️ Architecture Globale

```
┌──────────────────────────────────────────────────────────────┐
│                    UTILISATEURS                               │
│  Admin (coordinateur) | Externes (via liens personnels)      │
└─────────────────┬────────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────────┐
│                   NEXT.JS 16 APPLICATION                      │
│                  (Déployé sur Vercel)                         │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Pages (App Router)                                           │
│  ├─ /               → Landing page                            │
│  ├─ /admin/new      → Créer planning (Admin uniquement)       │
│  ├─ /admin/[id]     → Dashboard admin (suivi participants)    │
│  ├─ /saisie/[token] → Saisie vœux (Externe, lien unique)     │
│  └─ /resultat/[id]  → Visualisation planning final            │
│                                                                │
│  Components                                                    │
│  ├─ GuardCalendar.tsx    → React Big Calendar (interactif)   │
│  ├─ ParticipantsList.tsx → Dashboard admin                    │
│  └─ ResultsView.tsx      → Affichage résultat + stats        │
│                                                                │
│  API Routes (Route Handlers)                                  │
│  ├─ /api/plannings          → CRUD plannings                  │
│  ├─ /api/participants       → Gestion participants + tokens   │
│  ├─ /api/contraintes        → Enregistrer vœux (dates)        │
│  ├─ /api/generate           → Lancer optimisation             │
│  └─ /api/export             → Export Excel/iCal               │
│                                                                │
│  Lib                                                           │
│  ├─ supabase.ts      → Client Supabase                        │
│  ├─ optimizer.ts     → Algorithme jsLPSolver                  │
│  └─ tokenGenerator.ts → UUID v4 pour liens sécurisés         │
│                                                                │
└─────────────────┬────────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND                           │
│                 (PostgreSQL + Auth + Storage)                 │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Tables PostgreSQL :                                          │
│  ├─ plannings       → Config période, statut, créateur        │
│  ├─ participants    → Noms, emails, tokens uniques            │
│  ├─ contraintes     → Vœux par date (unavailable/preferred)   │
│  ├─ resultats       → Planning généré (assignations finales)  │
│  └─ emails_log      → Traçabilité envois (V1)                │
│                                                                │
│  Row Level Security (RLS) :                                   │
│  ├─ Isolation par token (1 externe = 1 token = SES données)  │
│  └─ Admin voit tout (via flag is_admin)                       │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

---

## 📁 Structure du Projet

```
gestion-planning-externe/
├── app/
│   ├── api/
│   │   ├── plannings/
│   │   │   └── route.ts              # CRUD plannings
│   │   ├── participants/
│   │   │   └── route.ts              # Ajout externes + génération tokens
│   │   ├── contraintes/
│   │   │   └── route.ts              # Enregistrer vœux (rouge/vert/blanc)
│   │   ├── generate/
│   │   │   └── route.ts              # Lancer optimisation (async)
│   │   └── export/
│   │       └── route.ts              # Export Excel/iCal
│   ├── admin/
│   │   ├── new/
│   │   │   └── page.tsx              # Créer nouveau planning
│   │   └── [id]/
│   │       └── page.tsx              # Dashboard admin (suivi)
│   ├── saisie/
│   │   └── [token]/
│   │       └── page.tsx              # Calendrier interactif externe
│   ├── resultat/
│   │   └── [id]/
│   │       └── page.tsx              # Visualisation résultat final
│   ├── components/
│   │   ├── GuardCalendar.tsx         # React Big Calendar
│   │   ├── ParticipantsList.tsx      # Liste participants + statuts
│   │   ├── ResultsView.tsx           # Calendrier résultat + stats
│   │   └── ExportButtons.tsx         # Boutons export (Excel/iCal)
│   ├── lib/
│   │   ├── supabase.ts               # Client Supabase
│   │   ├── optimizer.ts              # Algorithme optimisation
│   │   ├── tokenGenerator.ts         # UUID v4 sécurisé
│   │   └── exporters.ts              # Export Excel/iCal
│   ├── layout.tsx                    # Layout global
│   └── page.tsx                      # Landing page
├── public/
│   └── assets/                       # Images, icônes
├── .env.local                        # Variables d'env (NON commité)
├── .env.example                      # Template variables
├── .gitignore
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── PRD.md
├── ARCHITECTURE.md
├── CLAUDE.md
└── README.md
```

---

## 🗃️ Modèle de Données (Supabase)

### Table `plannings`
```sql
CREATE TABLE plannings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  quota_min INT NOT NULL DEFAULT 8,
  quota_max INT NOT NULL DEFAULT 10,
  statut VARCHAR(20) NOT NULL DEFAULT 'draft',
    -- Valeurs: 'draft' | 'collecting' | 'generated' | 'finalized'
  createur VARCHAR(255), -- Email ou nom admin
  date_creation TIMESTAMP DEFAULT NOW(),
  date_generation TIMESTAMP, -- Quand l'algo a tourné
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table `participants`
```sql
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_id UUID REFERENCES plannings(id) ON DELETE CASCADE,
  nom VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  token_unique VARCHAR(64) UNIQUE NOT NULL, -- UUID v4 pour lien sécurisé
  statut_saisie VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- Valeurs: 'pending' | 'completed'
  date_completion TIMESTAMP, -- Quand vœux soumis
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(planning_id, email)
);

-- Index pour recherche rapide par token
CREATE INDEX idx_participants_token ON participants(token_unique);
```

### Table `contraintes`
```sql
CREATE TABLE contraintes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  date_garde DATE NOT NULL,
  type_contrainte VARCHAR(20) NOT NULL,
    -- Valeurs: 'unavailable' (rouge) | 'preferred' (vert) | 'available' (blanc/par défaut)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(participant_id, date_garde) -- 1 contrainte par externe par jour
);

-- Index pour recherche par participant
CREATE INDEX idx_contraintes_participant ON contraintes(participant_id);
-- Index pour recherche par date
CREATE INDEX idx_contraintes_date ON contraintes(date_garde);
```

### Table `resultats`
```sql
CREATE TABLE resultats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_id UUID REFERENCES plannings(id) ON DELETE CASCADE,
  date_garde DATE NOT NULL,
  participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  est_dimanche BOOLEAN DEFAULT FALSE, -- Badge spécial dans affichage
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(planning_id, date_garde) -- 1 garde par jour
);

-- Index pour recherche rapide
CREATE INDEX idx_resultats_planning ON resultats(planning_id);
```

### Table `emails_log` (V1 - Optionnel MVP)
```sql
CREATE TABLE emails_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  type_email VARCHAR(50) NOT NULL, -- 'invitation' | 'relance' | 'resultat'
  statut VARCHAR(20) NOT NULL DEFAULT 'sent',
    -- Valeurs: 'sent' | 'delivered' | 'failed'
  date_envoi TIMESTAMP DEFAULT NOW(),
  erreur_message TEXT -- Si échec envoi
);
```

---

## 🔐 Sécurité

### Gestion des Secrets
- **Variables d'environnement** : Toutes les clés dans `.env.local`
- **Git** : `.env.local` dans `.gitignore` (jamais commité)
- **Vercel** : Variables configurées dans dashboard (Build > Environment Variables)

```bash
# .env.local (NON commité)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...  # Uniquement côté serveur
RESEND_API_KEY=re_xxx                    # Pour emails (V1)
```

### Authentification
**MVP** : Authentification par token unique (liens sécurisés)
- Token = UUID v4 (32 caractères alphanumériques)
- Format URL : `https://app.vercel.app/saisie/{token}`
- Validation backend : Token existe en BDD + planning pas finalisé

**V1** : Magic links email (optionnel, amélioration UX)
- Supabase Auth avec email passwordless
- Liens expirables (configurable)

### Protection des Données
- **Row Level Security (RLS)** : Activer sur TOUTES les tables
- **Isolation stricte** : Chaque externe voit UNIQUEMENT ses vœux
- **Validation backend** : Tous les inputs validés côté serveur (zod ou joi)
- **Rate limiting** : Middleware Next.js (limiter 10 requêtes/min par IP)

#### Exemple RLS Policy (Supabase)
```sql
-- Policy: Isolation par token
CREATE POLICY "Externes voient uniquement leurs contraintes"
  ON contraintes FOR SELECT
  USING (
    participant_id IN (
      SELECT id FROM participants WHERE token_unique = current_setting('app.current_token')::VARCHAR
    )
  );

-- Admin voit tout (flag is_admin via JWT custom claims - V1)
CREATE POLICY "Admin voit tout"
  ON contraintes FOR ALL
  USING (auth.jwt() ->> 'is_admin' = 'true');
```

---

## 🧪 Stratégie de Tests

### Tests Unitaires
- **Outil** : Vitest (rapide, compatible Next.js)
- **Couverture** : Lib (optimizer.ts, tokenGenerator.ts, exporters.ts)
- **Commande** : `npm run test`

### Tests d'Interface
- **Outil** : Playwright (déjà installé globalement selon CLAUDE.md)
- **Scénarios** :
  - Admin crée planning → Vérifie tokens générés
  - Externe remplit vœux → Vérifie sauvegarde BDD
  - Génération planning → Vérifie contraintes respectées
  - Responsive mobile/tablet/desktop
- **Commande** : `npx playwright test`

### Tests de Performance
- **Algorithme** : Tester avec 11 externes × 90 jours = ~990 variables
- **Objectif** : < 60 secondes de calcul
- **Tool** : Console.time() dans optimizer.ts

---

## 📦 Dépendances Principales

### Production
```json
{
  "next": "16.1.6",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "@supabase/supabase-js": "2.94.1",
  "react-big-calendar": "1.19.4",
  "date-fns": "^3.0.0",
  "javascript-lp-solver": "latest",
  "uuid": "^10.0.0",
  "zod": "^3.22.0"
}
```

### Développement
```json
{
  "typescript": "^5.3.0",
  "@types/react": "^19.0.0",
  "@types/node": "^20.0.0",
  "tailwindcss": "^3.4.0",
  "postcss": "^8.4.0",
  "autoprefixer": "^10.4.0",
  "vitest": "^1.0.0",
  "@playwright/test": "^1.40.0"
}
```

### V1 (Emails)
```json
{
  "resend": "^3.0.0"
}
```

---

## 🚀 Déploiement

### Environnements
- **Développement** : `localhost:3000` (npm run dev)
- **Staging** : Branche `develop` → `staging-planning-gardes.vercel.app` (auto)
- **Production** : Branche `main` → `planning-gardes.vercel.app` (auto)

### Process de Déploiement

#### 1. Setup Initial Vercel
```bash
# Installer CLI Vercel (optionnel, GUI suffit)
npm install -g vercel

# Lier le projet (première fois)
vercel link

# Configurer variables d'env
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

#### 2. Déploiement Continu (Git)
1. Push sur GitHub → Vercel détecte automatiquement
2. Build + Deploy (~2-3 min)
3. Preview URL générée (branches non-main)
4. Production URL (branche main uniquement)

#### 3. Variables d'Environnement
**Configurer dans Vercel Dashboard** :
```
NEXT_PUBLIC_SUPABASE_URL      = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY     = eyJhbGciOi... (Server-only)
RESEND_API_KEY                = re_xxx (V1, optionnel)
```

---

## ⚡ Performance

### Optimisations Prévues
1. **Server Components** : Fetch données côté serveur (SEO + perf)
2. **Client Components** : Calendrier uniquement (`'use client'`)
3. **Code Splitting** : Lazy load optimizer.ts (import dynamique)
4. **Caching** :
   - SWR/React Query pour données Supabase (client)
   - `revalidate: 60` pour Server Components
5. **Images** : Next.js `<Image>` (optimisation auto)

### Cibles de Performance (Lighthouse)
- **First Contentful Paint** : < 1.5s
- **Time to Interactive** : < 3s
- **Largest Contentful Paint** : < 2.5s
- **Cumulative Layout Shift** : < 0.1

---

## 🔄 Évolutivité

### Prévu pour Scale
- **Serverless** : Next.js API routes = scale automatique (Vercel)
- **Database** : PostgreSQL (Supabase) = scale horizontal
- **Algorithme** : jsLPSolver fonctionne jusqu'à ~15 externes (MVP validé)

### Limitations Connues & Solutions
| Limitation | Seuil | Solution (si dépassé) |
|------------|-------|----------------------|
| **jsLPSolver** | >15 externes | Migrer vers Google OR-Tools (Python) ou GLPK |
| **Supabase Free** | >500 MB BDD | Upgrade plan ($25/mois) ou nettoyage historique |
| **Vercel Free** | >100 GB bandwidth | Upgrade Pro ($20/mois) ou optimiser assets |

---

## 📚 Décisions Techniques

### Pourquoi Next.js 16 ?
**Alternatives considérées** : Remix, Astro, Nuxt.js (Vue)
**Raison du choix** :
- ✅ App Router moderne (Server/Client Components)
- ✅ Déploiement Vercel natif (1 clic)
- ✅ Excellent DX (TypeScript, HMR)
- ✅ Écosystème React mature

### Pourquoi Supabase ?
**Alternatives considérées** : Firebase, PlanetScale, Neon
**Raison du choix** :
- ✅ PostgreSQL (relationnel = adapté au problème)
- ✅ Row Level Security natif (isolation tokens)
- ✅ Free tier généreux (500 MB, 2 GB bandwidth)
- ✅ Déjà disponible (utilisateur possède compte)

### Pourquoi React Big Calendar ?
**Alternatives considérées** : FullCalendar, react-calendar, DayPilot
**Raison du choix** :
- ✅ UX Google Calendar (familier)
- ✅ Léger (pas de jQuery, React natif)
- ✅ Open source (MIT license)
- ✅ Maintenance active (1.19.4 = récent)

### Pourquoi jsLPSolver ?
**Alternatives considérées** : Google OR-Tools (Python), Optaplanner (Java), algo glouton custom
**Raison du choix** :
- ✅ Pur JavaScript (pas de dépendance externe)
- ✅ Suffisant pour MVP (8-11 externes)
- ✅ Zéro config (npm install direct)
- ⚠️ Limité si scale >15 externes → Prévoir migration Python (V2)

---

## ❓ Points à Clarifier

- [x] Hébergement : 0€ obligatoire → **Validé (Vercel + Supabase free)**
- [x] Supabase disponible → **Validé (utilisateur possède compte)**
- [ ] **Email obligatoire** : Si externe sans email, fallback SMS ou copie manuelle ?
- [ ] **Réouverture saisie** : Bloquer ou permettre regénération après 1er calcul ?
- [ ] **Vœux anonymes** : Cacher qui a mis quoi avant génération finale ?
- [ ] **Validation admin** : Coordinateur peut-il modifier vœux d'un externe absent ?
- [ ] **Expiration tokens** : Liens actifs combien de temps (30 jours, 90 jours, illimité) ?

---

## 📝 Notes d'Implémentation

### Workflow Technique Détaillé

#### Phase 1 : Setup Planning (Admin)
1. Admin remplit formulaire (`/admin/new`)
2. API POST `/api/plannings` → Insert BDD (statut = `draft`)
3. Admin ajoute participants (noms + emails)
4. Pour chaque participant :
   - Génération UUID v4 (`lib/tokenGenerator.ts`)
   - Insert table `participants` (statut = `pending`)
5. Interface affiche liens : `https://app.vercel.app/saisie/{token}`
6. (V1) Envoi emails automatiques via Resend

#### Phase 2 : Saisie Vœux (Externes)
1. Externe clique lien → Page `/saisie/[token]`
2. Backend valide token :
   - Token existe en BDD
   - Planning.statut ≠ `finalized`
3. Affichage calendrier (React Big Calendar) :
   - Dates du planning (date_debut → date_fin)
   - Clic sur date → Cycle Rouge → Vert → Blanc
4. Sauvegarde auto (debounce 2 sec) :
   - API POST `/api/contraintes`
   - Upsert contraintes (1 par jour)
5. Bouton "Valider mes vœux" :
   - Update participant.statut_saisie = `completed`
   - Update participant.date_completion = NOW()

#### Phase 3 : Dashboard Admin
1. Admin ouvre `/admin/[id]`
2. Fetch participants + statuts
3. Affichage :
   - ✅ "Jean : Complété le 05/02"
   - ⏳ "Marie : En attente"
4. Bouton "Lancer génération" :
   - Actif uniquement si 100% complétés
   - Ou option "Générer avec X/Y participants" (V1)

#### Phase 4 : Génération Planning
1. Admin clique "Lancer génération"
2. API POST `/api/generate` :
   - Fetch toutes les contraintes
   - Appel `optimizer.ts` (jsLPSolver)
   - **Contraintes dures** :
     - 1 externe par jour (∑ x_ij = 1 pour chaque jour j)
     - Respect indisponibilités (x_ij = 0 si rouge)
     - Pas de gardes consécutives (x_ij + x_i(j+1) ≤ 1)
     - Quota 8-10 gardes (8 ≤ ∑ x_ij ≤ 10 pour chaque i)
   - **Objectif** : Maximiser préférences (poids +1 si vert)
3. Si solution trouvée :
   - Insert table `resultats` (assignations)
   - Update planning.statut = `generated`
   - Update planning.date_generation = NOW()
4. Si échec :
   - Retourner erreur + suggestions (relaxer contraintes)

#### Phase 5 : Visualisation Résultat
1. Tous accèdent `/resultat/[id]`
2. Affichage calendrier + tableau stats :
   - "Jean : 9 gardes, 4/10 préférences, 2 dimanches"
3. Export Excel/iCal :
   - API GET `/api/export?format=xlsx&planning_id=xxx`
   - Génération fichier dynamique (lib/exporters.ts)

---

### Algorithme d'Optimisation (Détails)

#### Variables de Décision
```
x_ij ∈ {0, 1}  // 1 si externe i assigné au jour j, 0 sinon
```

#### Fonction Objectif
```
Maximiser: ∑∑ (préférence_ij × x_ij)
Où préférence_ij = {
  +1 si vert (preferred)
  0  si blanc (available)
  -∞ si rouge (unavailable) → Remplacé par contrainte dure
}
```

#### Contraintes
```
1. Un externe par jour :
   ∑_i x_ij = 1  ∀j (pour chaque jour)

2. Indisponibilités :
   x_ij = 0  ∀(i,j) où contrainte = 'unavailable'

3. Pas de gardes consécutives :
   x_ij + x_i(j+1) ≤ 1  ∀i, ∀j

4. Quota gardes :
   quota_min ≤ ∑_j x_ij ≤ quota_max  ∀i

5. (V1) Équité dimanches :
   min_dimanches ≤ ∑_(j∈dimanches) x_ij  ∀i
```

#### Fallback si Infeasible
1. Relâcher contrainte "pas de gardes consécutives" (permettre 1 occurrence)
2. Suggérer d'augmenter quota_max
3. Suggérer de réduire indisponibilités (demander aux externes)

---

## 🎓 Courbes d'Apprentissage

| Techno | Temps | Notes |
|--------|-------|-------|
| **Next.js 16 (App Router)** | 2-3 jours | Router moderne, bien documenté |
| **Supabase JS** | 1 jour | API simple (select/insert/update) |
| **React Big Calendar** | 1 jour | Exemples clairs, customisation CSS |
| **jsLPSolver** | 2-3 jours | Besoin comprendre LP/MIP (tutoriels dispo) |
| **Vercel Deploy** | 1 heure | Setup automatique, zéro config |

**Total estimé** : **1 semaine** pour maîtriser le stack + produire MVP

---

## 📞 Support & Ressources

### Documentation Complète
- Voir fichiers générés par Context7 :
  - `LIBRARIES_DOCUMENTATION.md` (détails complets)
  - `QUICK_START.md` (setup 30 min)
  - `INTEGRATION_EXAMPLES.md` (code TypeScript)

### Communautés
- **Next.js Discord** : https://discord.gg/nextjs
- **Supabase Discord** : https://discord.supabase.com
- **Stack Overflow** : Tags `next.js`, `supabase`, `react-big-calendar`

---

## 🎯 Prochaines Étapes

1. ✅ **Architecture validée** (ce document)
2. ⏭️ **Phase 3 : Setup** (selon CLAUDE.md)
   - Configuration Git + .env
   - Installation dépendances
   - Setup Supabase (tables + RLS)
3. ⏭️ **Phase 4 : Build MVP**
   - Feature 1 : Configuration planning (F1)
   - Feature 2 : Gestion participants + tokens (F2)
   - Feature 3 : Interface saisie contraintes (F3)
   - Feature 4 : Algorithme génération (F4)
   - Feature 5 : Visualisation résultat (F5)
   - Feature 6 : Export Excel (F6)

---

**Dernière mise à jour** : 05/02/2025
**Version** : 1.0
**Stack validé** : ✅ Next.js 16 + Supabase + React Big Calendar + jsLPSolver
**Coût total** : 0€ (Vercel Free + Supabase Free)
