import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

// DELETE /api/plannings/[id] - Supprimer un planning et toutes ses données
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    console.log(`🗑️ Suppression du planning ${id}...`)

    // 1. Supprimer les résultats
    const { error: resultatsError } = await supabase
      .from('resultats')
      .delete()
      .eq('planning_id', id)

    if (resultatsError) {
      console.error('Erreur suppression résultats:', resultatsError)
    }

    // 2. Supprimer les contraintes (via les participants)
    const { data: participants } = await supabase
      .from('participants')
      .select('id')
      .eq('planning_id', id)

    if (participants && participants.length > 0) {
      const participantIds = participants.map((p) => p.id)

      const { error: contraintesError } = await supabase
        .from('contraintes')
        .delete()
        .in('participant_id', participantIds)

      if (contraintesError) {
        console.error('Erreur suppression contraintes:', contraintesError)
      }
    }

    // 3. Supprimer les participants
    const { error: participantsError } = await supabase
      .from('participants')
      .delete()
      .eq('planning_id', id)

    if (participantsError) {
      console.error('Erreur suppression participants:', participantsError)
    }

    // 4. Supprimer le planning
    const { error: planningError } = await supabase
      .from('plannings')
      .delete()
      .eq('id', id)

    if (planningError) {
      console.error('Erreur suppression planning:', planningError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du planning' },
        { status: 500 }
      )
    }

    console.log('✅ Planning supprimé avec succès')

    return NextResponse.json({
      success: true,
      message: 'Planning supprimé avec succès',
    })
  } catch (error) {
    console.error('❌ Erreur serveur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
