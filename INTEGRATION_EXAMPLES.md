# Exemples d'Intégration Détaillée

**Pour**: Référence pendant le développement
**Contient**: Code complet prêt à copier-coller (adapter les noms variables)

---

## 1️⃣ Setup Supabase Client

### Fichier: `app/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Types (adapter selon votre schema)
export interface Guard {
  id: string
  user_id: string
  name: string
  email: string
  hourly_rate: number
  max_shifts_per_month: number
  created_at: string
  updated_at: string
}

export interface Schedule {
  id: string
  guard_id: string
  start_date: string
  end_date: string
  shift_type: 'morning' | 'afternoon' | 'night' | 'full_day'
  status: 'draft' | 'confirmed' | 'completed'
  notes: string | null
  created_at: string
  updated_at: string
}

// CRUD Operations - Guards

export async function getGuards() {
  const { data, error } = await supabase
    .from('guards')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw new Error(`Failed to fetch guards: ${error.message}`)
  return data as Guard[]
}

export async function getGuard(id: string) {
  const { data, error } = await supabase
    .from('guards')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(`Failed to fetch guard: ${error.message}`)
  return data as Guard
}

export async function createGuard(guard: Omit<Guard, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('guards')
    .insert([guard])
    .select()
    .single()

  if (error) throw new Error(`Failed to create guard: ${error.message}`)
  return data as Guard
}

export async function updateGuard(id: string, updates: Partial<Guard>) {
  const { data, error } = await supabase
    .from('guards')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Failed to update guard: ${error.message}`)
  return data as Guard
}

export async function deleteGuard(id: string) {
  const { error } = await supabase
    .from('guards')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Failed to delete guard: ${error.message}`)
}

// CRUD Operations - Schedules

export async function getSchedules(startDate?: string, endDate?: string) {
  let query = supabase
    .from('schedules')
    .select('*')

  if (startDate) {
    query = query.gte('start_date', startDate)
  }

  if (endDate) {
    query = query.lte('end_date', endDate)
  }

  const { data, error } = await query.order('start_date', { ascending: true })

  if (error) throw new Error(`Failed to fetch schedules: ${error.message}`)
  return data as Schedule[]
}

export async function getGuardSchedules(guardId: string) {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('guard_id', guardId)
    .order('start_date', { ascending: true })

  if (error) throw new Error(`Failed to fetch schedules: ${error.message}`)
  return data as Schedule[]
}

export async function createSchedule(schedule: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('schedules')
    .insert([schedule])
    .select()
    .single()

  if (error) throw new Error(`Failed to create schedule: ${error.message}`)
  return data as Schedule
}

export async function updateSchedule(id: string, updates: Partial<Schedule>) {
  const { data, error } = await supabase
    .from('schedules')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Failed to update schedule: ${error.message}`)
  return data as Schedule
}

export async function deleteSchedule(id: string) {
  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Failed to delete schedule: ${error.message}`)
}

// Authentication

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()

  if (error) throw new Error(`Failed to get user: ${error.message}`)
  return data.user
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })

  if (error) throw new Error(`Sign up failed: ${error.message}`)
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) throw new Error(`Sign in failed: ${error.message}`)
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) throw new Error(`Sign out failed: ${error.message}`)
}
```

---

## 2️⃣ API Route: Authentification

### Fichier: `app/api/auth/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/auth - Sign up
export async function POST(request: NextRequest) {
  try {
    const { action, email, password } = await request.json()

    if (action === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json(data, { status: 201 })
    }

    if (action === 'signin') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }

      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## 3️⃣ API Route: Guards CRUD

### Fichier: `app/api/guards/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getGuards, createGuard } from '@/lib/supabase'

// GET /api/guards - Fetch all guards
export async function GET(request: NextRequest) {
  try {
    const guards = await getGuards()
    return NextResponse.json(guards)
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}

// POST /api/guards - Create new guard
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validation
    if (!body.name || !body.email || body.hourly_rate === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const guard = await createGuard(body)
    return NextResponse.json(guard, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
```

### Fichier: `app/api/guards/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getGuard, updateGuard, deleteGuard } from '@/lib/supabase'

// GET /api/guards/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const guard = await getGuard(params.id)
    return NextResponse.json(guard)
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 404 }
    )
  }
}

// PUT /api/guards/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const guard = await updateGuard(params.id, body)
    return NextResponse.json(guard)
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}

// DELETE /api/guards/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteGuard(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
```

---

## 4️⃣ API Route: Optimisation

### Fichier: `app/api/optimize/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import * as solver from 'javascript-lp-solver'

interface OptimizeRequest {
  guards: Array<{
    id: string
    name: string
    hourly_rate: number
    max_shifts: number
    available_dates: string[]
  }>
  shifts: Array<{
    id: string
    date: string
    type: string
    staff_needed: number
    pay_multiplier: number
  }>
}

// POST /api/optimize
export async function POST(request: NextRequest) {
  try {
    const body: OptimizeRequest = await request.json()

    // Validation
    if (!body.guards || !body.shifts) {
      return NextResponse.json(
        { error: 'Missing guards or shifts' },
        { status: 400 }
      )
    }

    // Construire le modèle de programmation linéaire
    const model = {
      optimize: 'cost',
      opType: 'min' as const,
      constraints: {} as Record<string, any>,
      variables: {} as Record<string, any>,
      ints: {} as Record<string, number>
    }

    // Variables: x_{guard_id}_{shift_id} = 1 si assigné, 0 sinon
    for (const guard of body.guards) {
      for (const shift of body.shifts) {
        // Vérifier disponibilité
        if (!guard.available_dates.includes(shift.date)) {
          continue
        }

        const varName = `assign_${guard.id}_${shift.id}`

        // Fonction objectif: minimiser coût
        model.variables[varName] = {
          cost: guard.hourly_rate * shift.pay_multiplier
        }

        // Variable binaire
        model.ints[varName] = 1
      }
    }

    // Contrainte 1: chaque shift couvert
    for (const shift of body.shifts) {
      const constraint: Record<string, number> = {}
      let hasVariables = false

      for (const guard of body.guards) {
        const varName = `assign_${guard.id}_${shift.id}`
        if (model.variables[varName]) {
          constraint[varName] = 1
          hasVariables = true
        }
      }

      if (hasVariables) {
        model.constraints[`shift_coverage_${shift.id}`] = {
          equal: shift.staff_needed,
          ...constraint
        }
      }
    }

    // Contrainte 2: max shifts par garde
    for (const guard of body.guards) {
      const constraint: Record<string, number> = {}
      let hasVariables = false

      for (const shift of body.shifts) {
        const varName = `assign_${guard.id}_${shift.id}`
        if (model.variables[varName]) {
          constraint[varName] = 1
          hasVariables = true
        }
      }

      if (hasVariables) {
        model.constraints[`max_shifts_${guard.id}`] = {
          max: guard.max_shifts,
          ...constraint
        }
      }
    }

    // Résoudre
    const result = solver.Solve(model)

    if (!result) {
      return NextResponse.json(
        { error: 'No feasible solution found' },
        { status: 400 }
      )
    }

    // Formater la réponse
    const assignments = Object.entries(result)
      .filter(([key, value]) => key.startsWith('assign_') && value > 0.5)
      .map(([key]) => {
        const [, guardId, shiftId] = key.split('_')
        return { guardId, shiftId }
      })

    const totalCost = Object.entries(result)
      .filter(([key]) => key.startsWith('assign_'))
      .reduce((sum, [key, value]) => {
        const guardId = key.split('_')[1]
        const shiftId = key.split('_')[2]
        const guard = body.guards.find(g => g.id === guardId)
        const shift = body.shifts.find(s => s.id === shiftId)
        if (guard && shift) {
          sum += (value as number) * guard.hourly_rate * shift.pay_multiplier
        }
        return sum
      }, 0)

    return NextResponse.json({
      success: true,
      assignments,
      totalCost,
      rawSolution: result
    })
  } catch (error) {
    console.error('Optimization error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
```

---

## 5️⃣ Composant: Calendrier

### Fichier: `app/components/GuardCalendar.tsx`

```typescript
'use client'

import { Calendar, momentLocalizer, Event } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import styles from './GuardCalendar.module.css'

const localizer = momentLocalizer(moment)

interface GuardCalendarProps {
  events: Event[]
  onSelectEvent?: (event: Event) => void
  onSelectSlot?: (slotInfo: any) => void
}

export default function GuardCalendar({
  events,
  onSelectEvent,
  onSelectSlot
}: GuardCalendarProps) {
  return (
    <div className={styles.container}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        onSelectEvent={onSelectEvent}
        onSelectSlot={onSelectSlot}
        selectable
        popup
        defaultView="month"
        views={['month', 'week', 'day']}
      />
    </div>
  )
}
```

### Fichier: `app/components/GuardCalendar.module.css`

```css
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.container :global(.rbc-calendar) {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.container :global(.rbc-header) {
  padding: 0.5rem;
  font-weight: 600;
  background-color: #f3f4f6;
}

.container :global(.rbc-today) {
  background-color: #fef3c7;
}

.container :global(.rbc-event) {
  background-color: #3b82f6;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.container :global(.rbc-event:hover) {
  background-color: #1d4ed8;
  cursor: pointer;
}

@media (max-width: 768px) {
  .container {
    padding: 0.5rem;
  }

  .container :global(.rbc-calendar) {
    font-size: 0.875rem;
  }
}
```

---

## 6️⃣ Page: Dashboard Gardes

### Fichier: `app/components/GuardsPage.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Guard, getGuards, deleteGuard } from '@/lib/supabase'

export default function GuardsPage() {
  const [guards, setGuards] = useState<Guard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchGuards()
  }, [])

  async function fetchGuards() {
    try {
      setLoading(true)
      const data = await getGuards()
      setGuards(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Confirmer suppression?')) return

    try {
      await deleteGuard(id)
      setGuards(guards.filter(g => g.id !== id))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  if (loading) return <div>Chargement...</div>
  if (error) return <div className="text-red-600">Erreur: {error}</div>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Gardes</h1>

      <table className="w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-left">Nom</th>
            <th className="border p-2 text-left">Email</th>
            <th className="border p-2 text-right">Taux/h</th>
            <th className="border p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {guards.map(guard => (
            <tr key={guard.id} className="hover:bg-gray-50">
              <td className="border p-2">{guard.name}</td>
              <td className="border p-2">{guard.email}</td>
              <td className="border p-2 text-right">${guard.hourly_rate.toFixed(2)}</td>
              <td className="border p-2 text-right">
                <button
                  onClick={() => handleDelete(guard.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

---

## 7️⃣ Hook: Utiliser l'Optimiseur

### Fichier: `app/hooks/useOptimizer.ts`

```typescript
import { useState, useCallback } from 'react'

interface Guard {
  id: string
  name: string
  hourly_rate: number
  max_shifts: number
  available_dates: string[]
}

interface Shift {
  id: string
  date: string
  type: string
  staff_needed: number
  pay_multiplier: number
}

interface OptimizeResult {
  success: boolean
  assignments: Array<{ guardId: string; shiftId: string }>
  totalCost: number
  rawSolution: Record<string, number>
}

export function useOptimizer() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<OptimizeResult | null>(null)

  const optimize = useCallback(async (guards: Guard[], shifts: Shift[]) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guards, shifts })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Optimization failed')
      }

      const data: OptimizeResult = await response.json()
      setResult(data)
      return data
    } catch (err) {
      const message = (err as Error).message
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { optimize, loading, error, result }
}
```

---

## 8️⃣ Page: Exécuter Optimisation

### Fichier: `app/components/OptimizePage.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useOptimizer } from '@/hooks/useOptimizer'
import { getGuards, getSchedules } from '@/lib/supabase'

export default function OptimizePage() {
  const [guards, setGuards] = useState([])
  const [schedules, setSchedules] = useState([])
  const { optimize, loading, error, result } = useOptimizer()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const guardsData = await getGuards()
      setGuards(guardsData)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleOptimize() {
    try {
      await optimize(
        guards.map(g => ({
          id: g.id,
          name: g.name,
          hourly_rate: g.hourly_rate,
          max_shifts: g.max_shifts_per_month,
          available_dates: [] // À compléter selon votre logique
        })),
        [] // À remplir avec shifts à couvrir
      )
    } catch (err) {
      console.error('Optimization failed:', err)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Optimiser Planning</h1>

      <button
        onClick={handleOptimize}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Optimisation...' : 'Lancer optimisation'}
      </button>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 rounded">
          Erreur: {error}
        </div>
      )}

      {result && (
        <div className="p-4 bg-green-100 border border-green-400 rounded">
          <p>Succès! Coût total: ${result.totalCost.toFixed(2)}</p>
          <p>Assignations: {result.assignments.length}</p>
        </div>
      )}
    </div>
  )
}
```

---

## ✅ Checklist Intégration

- [ ] `app/lib/supabase.ts` - Setup client et CRUD
- [ ] `app/api/auth/route.ts` - Auth endpoints
- [ ] `app/api/guards/route.ts` et `[id]/route.ts` - Guards API
- [ ] `app/api/optimize/route.ts` - Optimisation endpoint
- [ ] `app/components/GuardCalendar.tsx` - Calendrier UI
- [ ] `app/hooks/useOptimizer.ts` - Hook optimiseur
- [ ] `.env.local` - Variables d'env remplies
- [ ] Tests locaux: `npm run dev`

---

**Prêt à commencer?** Faire un copier-coller adapté à votre projet!
