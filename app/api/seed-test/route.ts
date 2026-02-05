import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { generateUniqueToken } from '@/app/lib/tokenGenerator'
import { addDays, format } from 'date-fns'

// GET /api/seed-test - Générer un planning de test complet avec données aléatoires
export async function GET() {
  try {
    console.log('🌱 Génération des données de test...')

    // 1. Créer un planning de test (30 jours à partir d'aujourd'hui)
    const dateDebut = new Date()
    const dateFin = addDays(dateDebut, 30)

    const { data: planning, error: planningError } = await supabase
      .from('plannings')
      .insert([
        {
          date_debut: format(dateDebut, 'yyyy-MM-dd'),
          date_fin: format(dateFin, 'yyyy-MM-dd'),
          nb_externes: 10,
          createur: 'Test Coordinateur',
          statut: 'collecting',
        },
      ])
      .select()
      .single()

    if (planningError || !planning) {
      throw new Error('Erreur création planning: ' + planningError?.message)
    }

    console.log(`✅ Planning créé: ${planning.id}`)

    // 2. Créer 10 participants
    const nomsTest = [
      'Dr. Martin Dupont',
      'Dr. Sophie Bernard',
      'Dr. Thomas Petit',
      'Dr. Marie Dubois',
      'Dr. Lucas Martin',
      'Dr. Emma Durand',
      'Dr. Paul Moreau',
      'Dr. Julie Laurent',
      'Dr. Antoine Simon',
      'Dr. Camille Michel',
    ]

    const participants = []

    for (const nom of nomsTest) {
      const email = nom.toLowerCase().replace(/\s+/g, '.').replace('dr.', '') + '@hopital.fr'
      const token = generateUniqueToken()

      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .insert([
          {
            planning_id: planning.id,
            nom,
            email,
            token_unique: token,
            statut_saisie: 'completed',
            date_completion: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (participantError || !participant) {
        throw new Error('Erreur création participant: ' + participantError?.message)
      }

      participants.push(participant)
    }

    console.log(`✅ ${participants.length} participants créés`)

    // 3. Générer des contraintes aléatoires pour chaque participant
    const contraintes = []
    let currentDate = new Date(dateDebut)

    while (currentDate <= dateFin) {
      const dateStr = format(currentDate, 'yyyy-MM-dd')

      // Pour chaque participant, générer aléatoirement des contraintes
      for (const participant of participants) {
        const random = Math.random()

        // 10% de chance d'être indisponible
        if (random < 0.1) {
          contraintes.push({
            participant_id: participant.id,
            date_garde: dateStr,
            type_contrainte: 'unavailable',
          })
        }
        // 15% de chance d'avoir une préférence
        else if (random < 0.25) {
          contraintes.push({
            participant_id: participant.id,
            date_garde: dateStr,
            type_contrainte: 'preferred',
          })
        }
        // Sinon: available (pas de contrainte enregistrée)
      }

      currentDate = addDays(currentDate, 1)
    }

    // Insérer les contraintes
    if (contraintes.length > 0) {
      const { error: contraintesError } = await supabase
        .from('contraintes')
        .insert(contraintes)

      if (contraintesError) {
        throw new Error('Erreur création contraintes: ' + contraintesError.message)
      }
    }

    console.log(`✅ ${contraintes.length} contraintes générées`)

    // 4. Retourner le lien vers le dashboard
    const dashboardUrl = `/admin/${planning.id}`

    return NextResponse.json({
      success: true,
      message: 'Données de test générées avec succès',
      planning_id: planning.id,
      dashboard_url: dashboardUrl,
      stats: {
        nb_participants: participants.length,
        nb_contraintes: contraintes.length,
        nb_jours: Math.ceil((dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24)),
      },
    })
  } catch (error) {
    console.error('❌ Erreur seed:', error)
    return NextResponse.json(
      {
        error: 'Erreur lors de la génération des données de test',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}
