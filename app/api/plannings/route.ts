import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

// POST /api/plannings - Créer un nouveau planning
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date_debut, date_fin, quota_min, quota_max, createur } = body

    // Validation des données
    if (!date_debut || !date_fin || !createur) {
      return NextResponse.json(
        { error: 'Les champs date_debut, date_fin et createur sont obligatoires' },
        { status: 400 }
      )
    }

    // Validation des quotas
    if (quota_min > quota_max) {
      return NextResponse.json(
        { error: 'Le quota minimum ne peut pas être supérieur au quota maximum' },
        { status: 400 }
      )
    }

    // Validation de la période
    const debut = new Date(date_debut)
    const fin = new Date(date_fin)
    const diffJours = Math.ceil((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24))

    if (debut >= fin) {
      return NextResponse.json(
        { error: 'La date de fin doit être après la date de début' },
        { status: 400 }
      )
    }

    if (diffJours < 30) {
      return NextResponse.json(
        { error: 'La période doit être d\'au moins 30 jours' },
        { status: 400 }
      )
    }

    if (diffJours > 120) {
      return NextResponse.json(
        { error: 'La période ne peut pas dépasser 120 jours' },
        { status: 400 }
      )
    }

    // Insertion dans Supabase
    const { data, error } = await supabase
      .from('plannings')
      .insert([
        {
          date_debut,
          date_fin,
          quota_min,
          quota_max,
          createur,
          statut: 'draft',
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Erreur Supabase:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la création du planning', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        planning: data,
        message: 'Planning créé avec succès',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur serveur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// GET /api/plannings - Récupérer tous les plannings
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('plannings')
      .select('*')
      .order('date_creation', { ascending: false })

    if (error) {
      console.error('Erreur Supabase:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des plannings' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        plannings: data,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur serveur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
