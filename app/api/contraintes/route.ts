import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

// POST /api/contraintes - Upsert (créer ou mettre à jour) une contrainte
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { participant_id, date_garde, type_contrainte } = body

    // Validation
    if (!participant_id || !date_garde || !type_contrainte) {
      return NextResponse.json(
        { error: 'Les champs participant_id, date_garde et type_contrainte sont obligatoires' },
        { status: 400 }
      )
    }

    // Validation type_contrainte
    if (!['unavailable', 'preferred', 'available'].includes(type_contrainte)) {
      return NextResponse.json(
        { error: 'type_contrainte doit être "unavailable", "preferred" ou "available"' },
        { status: 400 }
      )
    }

    // Si type = available, on supprime la contrainte (retour à l'état par défaut)
    if (type_contrainte === 'available') {
      const { error } = await supabase
        .from('contraintes')
        .delete()
        .eq('participant_id', participant_id)
        .eq('date_garde', date_garde)

      if (error) {
        console.error('Erreur Supabase:', error)
        return NextResponse.json(
          { error: 'Erreur lors de la suppression de la contrainte' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Contrainte supprimée (retour à disponible)',
      })
    }

    // Sinon, upsert (créer ou mettre à jour)
    const { data, error } = await supabase
      .from('contraintes')
      .upsert(
        {
          participant_id,
          date_garde,
          type_contrainte,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'participant_id,date_garde',
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Erreur Supabase:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde de la contrainte' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      contrainte: data,
      message: 'Contrainte enregistrée',
    })
  } catch (error) {
    console.error('Erreur serveur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// GET /api/contraintes?participant_id=xxx - Récupérer les contraintes d'un participant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const participant_id = searchParams.get('participant_id')

    if (!participant_id) {
      return NextResponse.json(
        { error: 'Le paramètre participant_id est obligatoire' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('contraintes')
      .select('*')
      .eq('participant_id', participant_id)
      .order('date_garde')

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

// PATCH /api/contraintes - Marquer les vœux comme complétés
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { participant_id } = body

    if (!participant_id) {
      return NextResponse.json(
        { error: 'Le champ participant_id est obligatoire' },
        { status: 400 }
      )
    }

    // Mettre à jour le statut du participant
    const { data, error } = await supabase
      .from('participants')
      .update({
        statut_saisie: 'completed',
        date_completion: new Date().toISOString(),
      })
      .eq('id', participant_id)
      .select()
      .single()

    if (error) {
      console.error('Erreur Supabase:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du statut' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      participant: data,
      message: 'Vœux confirmés avec succès',
    })
  } catch (error) {
    console.error('Erreur serveur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
