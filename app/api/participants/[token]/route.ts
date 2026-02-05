import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

// GET /api/participants/[token] - Récupérer un participant par son token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token) {
      return NextResponse.json(
        { error: 'Token manquant' },
        { status: 400 }
      )
    }

    // Récupérer le participant via son token
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .select('*')
      .eq('token_unique', token)
      .single()

    if (participantError || !participant) {
      return NextResponse.json(
        { error: 'Participant introuvable ou lien invalide' },
        { status: 404 }
      )
    }

    // Récupérer le planning associé
    const { data: planning, error: planningError } = await supabase
      .from('plannings')
      .select('*')
      .eq('id', participant.planning_id)
      .single()

    if (planningError || !planning) {
      return NextResponse.json(
        { error: 'Planning introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      participant,
      planning,
    })
  } catch (error) {
    console.error('Erreur serveur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
