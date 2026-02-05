import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

// GET /api/contraintes/all?participant_ids=xxx,yyy - Récupérer toutes les contraintes de plusieurs participants
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const participant_ids_str = searchParams.get('participant_ids')

    if (!participant_ids_str) {
      return NextResponse.json(
        { error: 'Le paramètre participant_ids est obligatoire' },
        { status: 400 }
      )
    }

    const participant_ids = participant_ids_str.split(',')

    const { data, error } = await supabase
      .from('contraintes')
      .select('*')
      .in('participant_id', participant_ids)

    if (error) {
      console.error('Erreur Supabase:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des contraintes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      contraintes: data,
    })
  } catch (error) {
    console.error('Erreur serveur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
