import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { generateUniqueToken } from '@/app/lib/tokenGenerator'

// POST /api/participants - Créer un nouveau participant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { planning_id, nom, email } = body

    // Validation des données
    if (!planning_id || !nom || !email) {
      return NextResponse.json(
        { error: 'Les champs planning_id, nom et email sont obligatoires' },
        { status: 400 }
      )
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format email invalide' },
        { status: 400 }
      )
    }

    // Vérifier que le planning existe
    const { data: planning, error: planningError } = await supabase
      .from('plannings')
      .select('id')
      .eq('id', planning_id)
      .single()

    if (planningError || !planning) {
      return NextResponse.json(
        { error: 'Planning introuvable' },
        { status: 404 }
      )
    }

    // Vérifier si l'email existe déjà pour ce planning
    const { data: existingParticipant } = await supabase
      .from('participants')
      .select('id')
      .eq('planning_id', planning_id)
      .eq('email', email)
      .single()

    if (existingParticipant) {
      return NextResponse.json(
        { error: 'Un participant avec cet email existe déjà pour ce planning' },
        { status: 409 }
      )
    }

    // Générer un token unique
    let token = generateUniqueToken()
    let tokenExists = true
    let attempts = 0

    // S'assurer que le token est unique (très improbable qu'il y ait collision avec UUID v4)
    while (tokenExists && attempts < 5) {
      const { data } = await supabase
        .from('participants')
        .select('id')
        .eq('token_unique', token)
        .single()

      if (!data) {
        tokenExists = false
      } else {
        token = generateUniqueToken()
        attempts++
      }
    }

    if (tokenExists) {
      return NextResponse.json(
        { error: 'Impossible de générer un token unique' },
        { status: 500 }
      )
    }

    // Insertion du participant
    const { data, error } = await supabase
      .from('participants')
      .insert([
        {
          planning_id,
          nom,
          email,
          token_unique: token,
          statut_saisie: 'pending',
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Erreur Supabase:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la création du participant', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        participant: data,
        message: 'Participant créé avec succès',
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

// GET /api/participants?planning_id=xxx - Récupérer les participants d'un planning
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const planning_id = searchParams.get('planning_id')

    if (!planning_id) {
      return NextResponse.json(
        { error: 'Le paramètre planning_id est obligatoire' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('planning_id', planning_id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erreur Supabase:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des participants' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        participants: data,
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

// DELETE /api/participants?id=xxx - Supprimer un participant
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Le paramètre id est obligatoire' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur Supabase:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du participant' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Participant supprimé avec succès',
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
