# Documentation des Bibliothèques - gestion-planning-externe

**Généré le**: 2026-02-05
**Projet**: Système de Planning de Gardes avec Next.js + Supabase

---

## 📋 Résumé Exécutif

Ce document centralise la documentation à jour de 4 bibliothèques clés pour le projet. Chaque section contient : version recommandée, liens officiels, points clés et exemples de base.

---

## 1. Next.js 16

### Version & Liens Officiels

| Critère | Détail |
|---------|--------|
| **Version actuelle** | **16.1.6** (dernière stable) |
| **Recommandée pour le projet** | 16+ |
| **Site officiel** | https://nextjs.org |
| **Documentation** | https://nextjs.org/docs |
| **GitHub** | https://github.com/vercel/next.js |

### Points Clés

#### App Router (Modern)
- Routage basé fichier système dans le dossier `/app`
- Support natif des Server Components et Client Components
- Meilleure performance que Pages Router
- Déploiement optimisé sur Vercel
- Documentation officielle: https://nextjs.org/docs/app/building-your-application/routing

#### API Routes (Route Handlers)
- Créer des endpoints API dans `/app/api`
- Utiliser des fichiers `route.ts` ou `route.js`
- Support complet des méthodes HTTP (GET, POST, PUT, DELETE, etc.)
- Utiliser les Web Standards `Request` et `Response`
- Documentation: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

#### Déploiement Vercel
- Deployment natif et optimisé pour Vercel
- Pages SSR et API routes deviennent automatiquement des Serverless Functions
- Scaling infini
- Support Git integration (GitHub, GitLab, Bitbucket)
- Documentation: https://vercel.com/docs/frameworks/full-stack/nextjs

### Exemple Basique : Route Handler API

```typescript
// app/api/guards/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Récupérer les gardes depuis Supabase
  const guards = [{ id: 1, name: 'John' }]
  return NextResponse.json(guards)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  // Créer une nouvelle garde
  return NextResponse.json({ success: true }, { status: 201 })
}
```

### Installation

```bash
npx create-next-app@latest --typescript --tailwind
# ou pour un projet existant :
npm install next@latest react@latest react-dom@latest
```

### Configuration Vercel

```bash
# Connecter votre repo Git à Vercel
# Les variables d'env se configurent dans le dashboard Vercel
# Ou via vercel CLI:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## 2. Supabase JavaScript Client

### Version & Liens Officiels

| Critère | Détail |
|---------|--------|
| **Package NPM** | `@supabase/supabase-js` |
| **Version actuelle** | **2.94.1** |
| **Recommandée pour le projet** | 2.94.0+ (pour Realtime Auth: v2.44.0+) |
| **Site officiel** | https://supabase.com |
| **Docs JavaScript** | https://supabase.com/docs/reference/javascript |
| **GitHub** | https://github.com/supabase/supabase-js |

### Points Clés

#### Authentification
- Support OAuth 2.1 Server
- JWT (JSON Web Tokens) pour les sessions
- Auth tokens automatiquement joints à chaque requête CRUD
- Intégration directe avec Row Level Security (RLS)
- Documentation: https://supabase.com/docs/guides/auth

#### CRUD Operations
- Méthodes: `.select()`, `.insert()`, `.update()`, `.delete()`
- Utilise automatiquement l'Auth Token de l'utilisateur connecté
- Chaînable et async/await compatible
- Important: Attention à la configuration RLS lors d'inserts (voir `returning: 'minimal'`)

#### Row Level Security (RLS)
- Contrôle d'accès au niveau ligne dans PostgreSQL
- Les requêtes sont filtrées automatiquement par l'Auth Token
- Policies définies en SQL PostgreSQL
- Utiliser `returning: 'minimal'` pour éviter les problèmes de permissions en insert
- Documentation: https://supabase.com/docs/guides/database/postgres/row-level-security

#### Sous-packages Inclus
```json
{
  "@supabase/auth-js": "2.94.1",
  "@supabase/functions-js": "2.94.1",
  "@supabase/postgrest-js": "2.94.1",
  "@supabase/realtime-js": "2.94.1",
  "@supabase/storage-js": "2.94.1"
}
```

### Exemple Basique : Setup + CRUD

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Utilisation dans un Server Component
export async function getGuards() {
  const { data, error } = await supabase
    .from('guards')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

// Créer une garde
export async function createGuard(guardData: GuardInput) {
  const { data, error } = await supabase
    .from('guards')
    .insert([guardData])
    .select()
    .single()

  if (error) throw error
  return data
}

// Mettre à jour une garde
export async function updateGuard(id: string, updates: Partial<Guard>) {
  const { data, error } = await supabase
    .from('guards')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Supprimer une garde
export async function deleteGuard(id: string) {
  const { error } = await supabase
    .from('guards')
    .delete()
    .eq('id', id)

  if (error) throw error
}
```

### Authentification Utilisateur

```typescript
// S'inscrire
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure_password'
})

// Se connecter
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure_password'
})

// Récupérer l'utilisateur actuel
const { data: { user } } = await supabase.auth.getUser()

// Se déconnecter
await supabase.auth.signOut()
```

### Installation

```bash
npm install @supabase/supabase-js
```

### Configuration Vercel/Environment

```bash
# .env.local (développement)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Production: Configurer dans le dashboard Vercel
# Ces variables restent publiques (NEXT_PUBLIC_)
```

---

## 3. React Big Calendar

### Version & Liens Officiels

| Critère | Détail |
|---------|--------|
| **Package NPM** | `react-big-calendar` |
| **Version actuelle** | **1.19.4** |
| **Recommandée pour le projet** | 1.19.0+ |
| **GitHub** | https://github.com/jquense/react-big-calendar |
| **Documentation Storybook** | https://jquense.github.io/react-big-calendar/examples/index.html |
| **CodeSandbox** | https://codesandbox.io/examples/package/react-big-calendar |

### Points Clés

#### Fonctionnalités
- Calendrier Google Calendar / Outlook-like
- Support multi-vue (Month, Week, Day, Agenda)
- Événements interactifs
- Layout Flexbox (moderne, responsive)
- Entièrement développé pour React avec hooks

#### Localisation (4 Options)
1. **Moment.js** - Classique mais heavy
2. **date-fns** - Moderne avec tree-shaking (recommandé)
3. **Day.js** - Ultra-léger (2kB)
4. **Globalize.js** - Pour i18n avancée

#### Customization
- Importable SASS pour styler les couleurs et tailles
- CSS par défaut: `react-big-calendar/lib/css/react-big-calendar.css`
- Support des templates personnalisés pour événements

### Exemple Basique : Calendrier Simple

```typescript
// app/components/GuardCalendar.tsx
'use client'

import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)

interface GuardEvent {
  id: string
  title: string
  start: Date
  end: Date
  resourceId?: string
}

export default function GuardCalendar({ events }: { events: GuardEvent[] }) {
  const handleSelectSlot = (slotInfo: any) => {
    console.log('Slot sélectionné:', slotInfo)
    // Ouvrir un modal pour créer un événement
  }

  const handleSelectEvent = (event: GuardEvent) => {
    console.log('Événement sélectionné:', event)
    // Ouvrir un modal pour éditer
  }

  return (
    <div style={{ height: 600 }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        selectable
        popup
        view="month"
      />
    </div>
  )
}
```

### Intégration avec Supabase (Pattern Recommandé)

```typescript
// app/components/GuardCalendarContainer.tsx
'use client'

import { useEffect, useState } from 'react'
import GuardCalendar from './GuardCalendar'
import { supabase } from '@/lib/supabase'

interface Schedule {
  id: string
  guard_id: string
  start_date: string
  end_date: string
  type: 'morning' | 'afternoon' | 'night'
}

export default function GuardCalendarContainer() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    fetchSchedules()
  }, [])

  async function fetchSchedules() {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .order('start_date', { ascending: true })

    if (error) {
      console.error('Erreur:', error)
      return
    }

    // Transformer Supabase rows en événements pour React Big Calendar
    const calendarEvents = data.map((schedule: Schedule) => ({
      id: schedule.id,
      title: `Garde ${schedule.type}`,
      start: new Date(schedule.start_date),
      end: new Date(schedule.end_date),
      resourceId: schedule.guard_id
    }))

    setEvents(calendarEvents)
  }

  return <GuardCalendar events={events} />
}
```

### Installation avec date-fns (Recommandé)

```bash
npm install react-big-calendar date-fns
# Alternative: moment
npm install react-big-calendar moment
```

### Styler le Calendrier (SASS)

```typescript
// app/globals.scss
@import 'react-big-calendar/lib/sass/styles';

// Surcharger les variables
$rbc-color-brand: #3b82f6;      // Bleu Tailwind
$rbc-color-today: #fef08a;      // Jaune clair
$rbc-font-size: 14px;
```

---

## 4. Algorithme d'Optimisation - JavaScript Linear Programming Solver

### Version & Liens Officiels

| Critère | Détail |
|---------|--------|
| **Package NPM** | `javascript-lp-solver` |
| **Versions disponibles** | `javascript-lp-solver`, `@bygdle/javascript-lp-solver` (fork) |
| **Version recommandée** | Dernière version stable du fork `@bygdle` |
| **GitHub** | https://github.com/JWally/jsLPSolver |
| **Documentation API** | https://github.com/JWally/jsLPSolver/blob/master/API.md |

### Points Clés

#### Capacités
- **Linear Programming (LP)** - Algorithme Simplex, optimisation continue
- **Mixed-Integer Programming (MIP)** - Branch-and-cut, variables entières/binaires
- **Multi-Objective Optimization** - Équilibrer plusieurs objectifs
- **Zéro dépendances externes** - Pur JavaScript/TypeScript
- **Performance** - Millisecondes pour petits LP, centaines ms pour MIP complexes

#### Use Cases pour Planning de Gardes
1. **Minimiser coûts** : Réduire heures supplémentaires
2. **Maximiser couverture** : Couvrir tous les créneaux avec personnel disponible
3. **Contraintes multiples** :
   - Nombre max de gardes par personne
   - Repos minimum entre gardes
   - Préférences personnelles
   - Compétences requises par créneau
   - Limites budgétaires

#### Alternatives
| Solution | Avantages | Inconvénients |
|----------|-----------|---------------|
| **jsLPSolver** | Simple, pur JS, performance acceptable | Maintenance variable, apprentissage courbe |
| **YALPS** | Plus rapide que jsLPSolver | Moins de stabilité, moins d'exemples |
| **Cassowary.js** | Contraintes hiérarchiques | Moins adapté aux optimisations globales |
| **Google OR-Tools** | Professionnel, robuste | Pas de binding JS direct, complexe |

### Exemple Basique : Minimiser Coûts de Gardes

```typescript
// lib/optimizer.ts
import * as solver from 'javascript-lp-solver'

interface GuardConstraint {
  guardId: string
  maxShifts: number
  hourlyRate: number
  availability: string[] // dates disponibles
}

interface ShiftData {
  shiftId: string
  date: string
  staffNeeded: number
  payMultiplier: number // 1.0 normal, 1.5 premium, 2.0 dimanche
}

export function optimizeSchedule(
  guards: GuardConstraint[],
  shifts: ShiftData[]
) {
  const model = {
    optimize: 'cost',
    opType: 'min',
    constraints: {} as Record<string, any>,
    variables: {} as Record<string, any>,
    ints: {} as Record<string, number>
  }

  // Variables de décision: pour chaque combinaison guard-shift
  // x_guard_shift = 1 si le garde g est assigné au shift s, 0 sinon
  for (const guard of guards) {
    for (const shift of shifts) {
      const varName = `assign_${guard.guardId}_${shift.shiftId}`

      // Fonction objectif: minimiser le coût
      model.variables[varName] = {
        cost: guard.hourlyRate * shift.payMultiplier
      }

      // Variable binaire
      model.ints[varName] = 1
    }
  }

  // Contrainte 1: chaque shift doit être couvert
  for (const shift of shifts) {
    const constraint: Record<string, number> = {}
    for (const guard of guards) {
      const varName = `assign_${guard.guardId}_${shift.shiftId}`
      constraint[varName] = 1
    }
    model.constraints[`coverage_${shift.shiftId}`] = {
      equal: shift.staffNeeded
    }
    Object.assign(model.constraints[`coverage_${shift.shiftId}`], constraint)
  }

  // Contrainte 2: chaque garde ne dépasse pas son max de shifts
  for (const guard of guards) {
    const constraint: Record<string, number> = {}
    for (const shift of shifts) {
      // Vérifier disponibilité
      if (guard.availability.includes(shift.date)) {
        const varName = `assign_${guard.guardId}_${shift.shiftId}`
        constraint[varName] = 1
      }
    }
    if (Object.keys(constraint).length > 0) {
      model.constraints[`max_shifts_${guard.guardId}`] = {
        max: guard.maxShifts,
        ...constraint
      }
    }
  }

  try {
    const result = solver.Solve(model)
    console.log('Optimisation réussie:', result)
    return result
  } catch (error) {
    console.error('Erreur optimisation:', error)
    return null
  }
}
```

### Utilisation avec React Hook

```typescript
// app/hooks/useScheduleOptimizer.ts
import { useState, useCallback } from 'react'
import { optimizeSchedule } from '@/lib/optimizer'

export function useScheduleOptimizer() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [solution, setSolution] = useState(null)

  const optimize = useCallback(async (guards: any[], shifts: any[]) => {
    setLoading(true)
    setError(null)

    try {
      const result = optimizeSchedule(guards, shifts)
      if (result) {
        setSolution(result)
      } else {
        setError('Pas de solution trouvée')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { optimize, loading, error, solution }
}
```

### Installation

```bash
# Version officielle
npm install javascript-lp-solver

# Ou fork maintenu
npm install @bygdle/javascript-lp-solver
```

### Configuration TypeScript

```typescript
// types/solver.d.ts (si nécessaire)
declare module 'javascript-lp-solver' {
  interface Model {
    optimize: string
    opType: 'min' | 'max'
    constraints: Record<string, any>
    variables: Record<string, any>
    ints?: Record<string, number>
    binaries?: string[]
  }

  function Solve(model: Model): Record<string, number> | false
}
```

---

## 📊 Comparaison Résumée

| Aspect | Next.js 16 | Supabase JS | React Big Calendar | jsLPSolver |
|--------|-----------|-----------|-------------------|-----------|
| **Version** | 16.1.6 | 2.94.1 | 1.19.4 | Dernier stable |
| **Taille** | ~20MB | ~370KB | ~50KB | ~30KB |
| **Dépendances** | 5 | 5 | Moment/date-fns | 0 |
| **Courbe apprentissage** | Moyenne | Facile | Facile | Moyenne |
| **Déploiement** | Vercel (natif) | Externe | Client-side | Client-side |
| **Maintenance** | Excellent | Excellent | Bon | Acceptable |
| **Docs** | Excellentes | Excellentes | Bonnes | Moyennes |

---

## 🔗 Ressources Additionnelles

### Documentation Officielle Complète
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [React Big Calendar Storybook](https://jquense.github.io/react-big-calendar/examples/index.html)
- [jsLPSolver API Docs](https://github.com/JWally/jsLPSolver/blob/master/API.md)

### Patterns d'Intégration
- **Next.js + Supabase**: Voir [Supabase Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- **Calendrier + Supabase**: Fetcher les schedules en Server Component, passer en props au Client Component
- **Optimisation + Next.js API Route**: POST vers `/api/optimize` avec les données, retourner la solution

### Community & Support
- **Next.js Discord**: https://discord.gg/nextjs
- **Supabase Discord**: https://discord.supabase.com
- **React Big Calendar Issues**: https://github.com/jquense/react-big-calendar/issues
- **jsLPSolver Issues**: https://github.com/JWally/jsLPSolver/issues

---

## ✅ Checklist Avant de Commencer

- [ ] Versions confirmées: Next 16.1.6, Supabase 2.94.1, React Big Calendar 1.19.4, jsLPSolver latest
- [ ] Dépendances installées: `npm install next@latest @supabase/supabase-js react-big-calendar date-fns javascript-lp-solver`
- [ ] Variables d'env configurées: `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Projet Supabase créé et tables initialisées
- [ ] Vercel connecté pour Git (optionnel mais recommandé)
- [ ] TypeScript configuré dans Next.js
- [ ] Tailwind CSS pour le styling (optionnel, recommandé)

---

**Dernière mise à jour**: 2026-02-05
**Auteur**: Claude Code via Context7 Research
**Statut**: Prêt pour implémentation
