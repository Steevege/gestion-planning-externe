# Guide de Démarrage Rapide - gestion-planning-externe

**Pour bien commencer avec le stack Next.js 16 + Supabase + React Big Calendar + jsLPSolver**

---

## 1️⃣ Installation des Dépendances

```bash
# Cloner le repo (si nécessaire)
git clone <your-repo>
cd gestion-planning-externe

# Installer les packages
npm install next@latest react@latest react-dom@latest
npm install @supabase/supabase-js
npm install react-big-calendar date-fns
npm install javascript-lp-solver
npm install -D typescript @types/react @types/node tailwindcss postcss autoprefixer

# Initialiser Tailwind (optionnel mais recommandé)
npx tailwindcss init -p
```

---

## 2️⃣ Configuration Supabase

### Créer un projet Supabase

1. Aller sur [https://supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Attendre la création (~ 2 minutes)
4. Copier les clés depuis Settings > API Keys:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Créer les tables essentielles

Dans l'éditeur SQL Supabase, exécuter:

```sql
-- Table: guards (gardes/personnels)
CREATE TABLE guards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 15.00,
  max_shifts_per_month INT DEFAULT 20,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: schedules (plannings/gardes)
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guard_id UUID REFERENCES guards(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  shift_type VARCHAR(20) DEFAULT 'full_day', -- 'morning', 'afternoon', 'night', 'full_day'
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'confirmed', 'completed'
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: shift_templates (modèles de créneaux)
CREATE TABLE shift_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  staff_needed INT NOT NULL DEFAULT 1,
  pay_multiplier DECIMAL(3, 2) DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE guards ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Utilisateurs ne voient que leurs propres données
CREATE POLICY "Users can see their own guards data"
  ON guards FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'authenticated');

CREATE POLICY "Users can see schedules for their guards"
  ON schedules FOR SELECT
  USING (
    guard_id IN (
      SELECT id FROM guards WHERE user_id = auth.uid()
    ) OR auth.role() = 'authenticated'
  );
```

---

## 3️⃣ Configuration Next.js

### Variables d'Environnement

1. Copier `.env.example` vers `.env.local`:
```bash
cp .env.example .env.local
```

2. Remplir les valeurs Supabase:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Structure des Dossiers Recommandée

```
app/
├── api/
│   ├── guards/
│   │   └── route.ts          # CRUD pour gardes
│   ├── schedules/
│   │   └── route.ts          # CRUD pour schedules
│   └── optimize/
│       └── route.ts          # Endpoint optimisation
├── components/
│   ├── GuardCalendar.tsx      # Composant calendrier
│   ├── GuardForm.tsx          # Formulaire ajout garde
│   └── SchedulesList.tsx      # Liste des schedules
├── lib/
│   ├── supabase.ts            # Client Supabase
│   └── optimizer.ts           # Logique optimisation
├── page.tsx                   # Page d'accueil
└── layout.tsx                 # Layout principal
```

---

## 4️⃣ Premier Composant: Client Supabase

Créer `app/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper: récupérer tous les gardes
export async function getAllGuards() {
  const { data, error } = await supabase
    .from('guards')
    .select('*')
    .order('name')

  if (error) throw new Error(error.message)
  return data
}

// Helper: récupérer les schedules d'une garde
export async function getGuardSchedules(guardId: string) {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('guard_id', guardId)
    .order('start_date')

  if (error) throw new Error(error.message)
  return data
}
```

---

## 5️⃣ Calendrier: Composant React

Créer `app/components/GuardCalendar.tsx`:

```typescript
'use client'

import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)

export default function GuardCalendar({ events }: { events: any[] }) {
  return (
    <div style={{ height: 500 }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
      />
    </div>
  )
}
```

---

## 6️⃣ Optimisation: Fonction Solver

Créer `app/lib/optimizer.ts`:

```typescript
import * as solver from 'javascript-lp-solver'

export function optimizeSchedules(guards: any[], shifts: any[]) {
  const model = {
    optimize: 'cost',
    opType: 'min' as const,
    constraints: {} as Record<string, any>,
    variables: {} as Record<string, any>,
    ints: {} as Record<string, number>
  }

  // Variables binaires pour chaque combinaison garde-shift
  for (const guard of guards) {
    for (const shift of shifts) {
      const varName = `x_${guard.id}_${shift.id}`
      model.variables[varName] = {
        cost: guard.hourly_rate
      }
      model.ints[varName] = 1
    }
  }

  // Contrainte: chaque shift couvert par exactement 1 garde
  for (const shift of shifts) {
    const constraint: Record<string, number> = {}
    for (const guard of guards) {
      constraint[`x_${guard.id}_${shift.id}`] = 1
    }
    model.constraints[`shift_${shift.id}`] = {
      equal: 1,
      ...constraint
    }
  }

  try {
    const result = solver.Solve(model)
    return result || null
  } catch (error) {
    console.error('Optimisation échouée:', error)
    return null
  }
}
```

---

## 7️⃣ Tester Localement

```bash
# Démarrer le serveur de développement
npm run dev

# Ouvrir http://localhost:3000
```

---

## 8️⃣ Déployer sur Vercel

### Option 1: Via Dashboard Vercel

1. Aller sur [https://vercel.com](https://vercel.com)
2. Importer le repo GitHub
3. Configurer les variables d'env
4. Déployer (automatic sur chaque push)

### Option 2: Via CLI Vercel

```bash
npm install -g vercel
vercel

# Configurer les env vars pour production
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## ✅ Checklist de Déploiement

- [ ] `.env.local` rempli avec clés Supabase
- [ ] Tables Supabase créées avec RLS activé
- [ ] `npm run dev` fonctionne sans erreurs
- [ ] Calendrier affiche les données depuis Supabase
- [ ] Authentification Supabase testée
- [ ] Optimisation renvoie une solution valide
- [ ] Tests responsive (mobile/desktop)
- [ ] Prêt à déployer sur Vercel

---

## 🆘 Troubleshooting Courant

### "Cannot find module '@supabase/supabase-js'"
```bash
npm install @supabase/supabase-js
```

### "RLS policy denying access"
- Vérifier que l'utilisateur est authentifié
- Vérifier les policies dans Supabase dashboard
- Utiliser `NEXT_PUBLIC_` pour les clés publiques

### "Calendar not rendering"
- Vérifier que `height` est défini en styles
- Vérifier que les events ont `start` et `end` en Date
- Importer le CSS: `react-big-calendar/lib/css/react-big-calendar.css`

### "Optimization returns null"
- Vérifier les contraintes sont bien définies
- Consolelog le model pour déboguer
- Vérifier que le problème est faisable (solution existe)

---

## 📚 Ressources Utiles

- Voir `LIBRARIES_DOCUMENTATION.md` pour détails complets
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- React Big Calendar: https://jquense.github.io/react-big-calendar/

---

**Auteur**: Claude Code
**Dernière mise à jour**: 2026-02-05
**Durée estimée**: 30 min pour la setup complète
