import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { generateOptimalPlanning } from '@/app/lib/solver'

// POST /api/plannings/[id]/generate - Générer le planning optimal
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    console.log(`🚀 Génération du planning ${id}...`)

    // 1. Récupérer le planning
    const { data: planning, error: planningError } = await supabase
      .from('plannings')
      .select('*')
      .eq('id', id)
      .single()

    if (planningError || !planning) {
      return NextResponse.json(
        { error: 'Planning introuvable' },
        { status: 404 }
      )
    }

    // Vérifier que le planning est en état approprié
    if (planning.statut === 'finalized') {
      return NextResponse.json(
        { error: 'Le planning est déjà finalisé, impossible de le régénérer' },
        { status: 400 }
      )
    }

    // 2. Récupérer tous les participants
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('id, nom')
      .eq('planning_id', id)

    if (participantsError || !participants || participants.length === 0) {
      return NextResponse.json(
        { error: 'Aucun participant trouvé pour ce planning' },
        { status: 400 }
      )
    }

    // Vérifier que tous les participants ont complété leurs vœux
    const { data: allParticipants } = await supabase
      .from('participants')
      .select('id, nom, statut_saisie')
      .eq('planning_id', id)

    const notCompleted = allParticipants?.filter((p) => p.statut_saisie !== 'completed') || []
    if (notCompleted.length > 0) {
      return NextResponse.json(
        {
          error: `${notCompleted.length} participant(s) n'ont pas encore complété leurs vœux`,
          participants_pending: notCompleted.map((p) => p.nom),
        },
        { status: 400 }
      )
    }

    // 3. Récupérer toutes les contraintes
    const participantIds = participants.map((p) => p.id)
    const { data: contraintes, error: contraintesError } = await supabase
      .from('contraintes')
      .select('*')
      .in('participant_id', participantIds)

    if (contraintesError) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des contraintes' },
        { status: 500 }
      )
    }

    console.log(`📋 ${participants.length} participants, ${contraintes?.length || 0} contraintes`)

    // 4. Lancer l'algorithme de génération
    const result = await generateOptimalPlanning(
      planning,
      participants,
      contraintes || []
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Échec de la génération' },
        { status: 400 }
      )
    }

    console.log(`✅ Solution trouvée: ${result.assignments?.length} assignations`)

    // 5. Supprimer les anciens résultats (si régénération)
    await supabase
      .from('resultats')
      .delete()
      .eq('planning_id', id)

    // 6. Sauvegarder les nouveaux résultats
    if (result.assignments && result.assignments.length > 0) {
      const resultsToInsert = result.assignments.map((assignment) => ({
        planning_id: id,
        participant_id: assignment.participant_id,
        date_garde: assignment.date_garde,
      }))

      const { error: insertError } = await supabase
        .from('resultats')
        .insert(resultsToInsert)

      if (insertError) {
        console.error('❌ Erreur insertion résultats:', insertError)
        return NextResponse.json(
          { error: 'Erreur lors de la sauvegarde des résultats' },
          { status: 500 }
        )
      }
    }

    // 7. Mettre à jour le statut du planning
    const { error: updateError } = await supabase
      .from('plannings')
      .update({ statut: 'generated' })
      .eq('id', id)

    if (updateError) {
      console.error('❌ Erreur mise à jour statut:', updateError)
    }

    console.log('🎉 Planning généré avec succès!')

    return NextResponse.json({
      success: true,
      message: 'Planning généré avec succès',
      stats: result.stats,
      nb_assignations: result.assignments?.length || 0,
    })
  } catch (error) {
    console.error('❌ Erreur serveur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
