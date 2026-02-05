import { createClient } from '@supabase/supabase-js'

// Variables d'environnement Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Validation des variables d'environnement
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Les variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY doivent être définies dans .env.local'
  )
}

// Client Supabase (singleton)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types pour les tables (à compléter au fur et à mesure)
export type Planning = {
  id: string
  date_debut: string
  date_fin: string
  quota_min: number
  quota_max: number
  statut: 'draft' | 'collecting' | 'generated' | 'finalized'
  createur: string
  date_creation: string
  date_generation?: string
}

export type Participant = {
  id: string
  planning_id: string
  nom: string
  email: string
  token_unique: string
  statut_saisie: 'pending' | 'completed'
  date_completion?: string
}

export type Contrainte = {
  id: string
  participant_id: string
  date_garde: string
  type_contrainte: 'unavailable' | 'preferred' | 'available'
}

export type Resultat = {
  id: string
  planning_id: string
  date_garde: string
  participant_id: string
  est_dimanche: boolean
}

// Helper: Récupérer tous les plannings
export async function getAllPlannings() {
  const { data, error } = await supabase
    .from('plannings')
    .select('*')
    .order('date_creation', { ascending: false })

  if (error) throw new Error(error.message)
  return data as Planning[]
}

// Helper: Récupérer un planning par ID
export async function getPlanningById(id: string) {
  const { data, error } = await supabase
    .from('plannings')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data as Planning
}

// Helper: Récupérer les participants d'un planning
export async function getParticipantsByPlanning(planningId: string) {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('planning_id', planningId)
    .order('nom')

  if (error) throw new Error(error.message)
  return data as Participant[]
}

// Helper: Récupérer les contraintes d'un participant
export async function getContraintesByParticipant(participantId: string) {
  const { data, error } = await supabase
    .from('contraintes')
    .select('*')
    .eq('participant_id', participantId)
    .order('date_garde')

  if (error) throw new Error(error.message)
  return data as Contrainte[]
}
