import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

// GET /api/resultats?planning_id=xxx - Récupérer les résultats d'un planning
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

    // Récupérer les résultats avec les infos des participants
    const { data, error } = await supabase
      .from('resultats')
      .select(`
        *,
        participants (
          nom
        )
      `)
      .eq('planning_id', planning_id)
      .order('date_garde')

    if (error) {
      console.error('Erreur Supabase:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des résultats' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      resultats: data,
    })
  } catch (error) {
    console.error('Erreur serveur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
