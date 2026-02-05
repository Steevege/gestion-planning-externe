import solver from 'javascript-lp-solver'
import { format, addDays, getDay } from 'date-fns'

type Participant = {
  id: string
  nom: string
}

type Contrainte = {
  participant_id: string
  date_garde: string
  type_contrainte: 'unavailable' | 'preferred' | 'available'
}

type Planning = {
  id: string
  date_debut: string
  date_fin: string
  nb_externes: number
}

type SolverResult = {
  success: boolean
  assignments?: Array<{ participant_id: string; date_garde: string }>
  error?: string
  stats?: {
    total_jours: number
    nb_participants: number
    gardes_par_personne: { [participant_id: string]: number }
    dimanches_par_personne: { [participant_id: string]: number }
    preferences_respectees: number
    total_preferences: number
  }
}

/**
 * Génère un planning optimal en utilisant la programmation linéaire
 */
export async function generateOptimalPlanning(
  planning: Planning,
  participants: Participant[],
  contraintes: Contrainte[]
): Promise<SolverResult> {
  try {
    // 1. Générer toutes les dates du planning
    const dates: string[] = []
    const sundays: string[] = []
    let currentDate = new Date(planning.date_debut)
    const endDate = new Date(planning.date_fin)

    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      dates.push(dateStr)

      // Identifier les dimanches (0 = dimanche)
      if (getDay(currentDate) === 0) {
        sundays.push(dateStr)
      }

      currentDate = addDays(currentDate, 1)
    }

    const nbJours = dates.length
    const nbParticipants = participants.length

    console.log(`📊 Génération planning: ${nbJours} jours, ${nbParticipants} participants, ${sundays.length} dimanches`)

    // 2. Calculer le nombre de gardes par personne
    const gardesMin = Math.floor(nbJours / nbParticipants)
    const gardesMax = Math.ceil(nbJours / nbParticipants)

    console.log(`📊 Gardes par personne: min=${gardesMin}, max=${gardesMax}`)

    // 3. Indexer les contraintes
    const contraintesMap: { [key: string]: 'unavailable' | 'preferred' } = {}
    contraintes.forEach((c) => {
      if (c.type_contrainte !== 'available') {
        contraintesMap[`${c.participant_id}_${c.date_garde}`] = c.type_contrainte
      }
    })

    // 4. Construire le modèle de programmation linéaire
    const model: any = {
      optimize: 'score',
      opType: 'max',
      constraints: {},
      variables: {},
      ints: {},
    }

    // Variables de décision: x[participant_id][date] = 1 si assigné, 0 sinon
    participants.forEach((participant) => {
      dates.forEach((date) => {
        const varName = `x_${participant.id}_${date}`
        const key = `${participant.id}_${date}`
        const contrainte = contraintesMap[key]

        // Score de la variable dans la fonction objectif
        let score = 1 // Score de base

        if (contrainte === 'preferred') {
          score += 10 // Bonus pour les préférences
        }

        // Bonus léger pour les dimanches pour aider à les équilibrer
        if (sundays.includes(date)) {
          score += 2
        }

        model.variables[varName] = {
          score,
          // Contrainte par variable
          [`day_${date}`]: 1, // Pour la contrainte "1 externe par jour"
          [`person_${participant.id}`]: 1, // Pour compter les gardes par personne
        }

        // Si dimanche, ajouter à la contrainte de dimanches
        if (sundays.includes(date)) {
          model.variables[varName][`sunday_${participant.id}`] = 1
        }

        // Variables binaires (0 ou 1)
        model.ints[varName] = 1

        // Contrainte dure: si indisponible, forcer à 0
        if (contrainte === 'unavailable') {
          model.variables[varName][`unavail_${key}`] = 1
        }
      })
    })

    // 5. Ajouter les contraintes

    // Contrainte 1: Exactement 1 externe par jour
    dates.forEach((date) => {
      model.constraints[`day_${date}`] = { equal: 1 }
    })

    // Contrainte 2: Respect des indisponibilités
    participants.forEach((participant) => {
      dates.forEach((date) => {
        const key = `${participant.id}_${date}`
        if (contraintesMap[key] === 'unavailable') {
          model.constraints[`unavail_${key}`] = { max: 0 }
        }
      })
    })

    // Contrainte 3: Équité - chaque personne fait entre gardesMin et gardesMax gardes
    participants.forEach((participant) => {
      model.constraints[`person_${participant.id}`] = {
        min: gardesMin,
        max: gardesMax,
      }
    })

    // Contrainte 4: Minimum 1 dimanche par personne (si possible)
    if (sundays.length >= nbParticipants) {
      participants.forEach((participant) => {
        model.constraints[`sunday_${participant.id}`] = { min: 1 }
      })
    }

    // Contrainte 5: Pas de gardes consécutives
    participants.forEach((participant) => {
      for (let i = 0; i < dates.length - 1; i++) {
        const date1 = dates[i]
        const date2 = dates[i + 1]
        const var1 = `x_${participant.id}_${date1}`
        const var2 = `x_${participant.id}_${date2}`

        // Créer une contrainte: var1 + var2 <= 1
        const constraintName = `no_consecutive_${participant.id}_${i}`
        model.constraints[constraintName] = { max: 1 }

        // Ajouter les deux variables à cette contrainte
        if (model.variables[var1]) {
          model.variables[var1][constraintName] = 1
        }
        if (model.variables[var2]) {
          model.variables[var2][constraintName] = 1
        }
      }
    })

    // 6. Résoudre le modèle
    console.log('🔍 Résolution du modèle de programmation linéaire...')
    const solution = solver.Solve(model)

    if (!solution || solution.feasible === false) {
      return {
        success: false,
        error: 'Aucune solution trouvée - Les contraintes sont impossibles à satisfaire. Vérifiez les indisponibilités.',
      }
    }

    console.log('✅ Solution trouvée! Score:', solution.result)

    // 7. Extraire les assignations de la solution
    const assignments: Array<{ participant_id: string; date_garde: string }> = []
    const gardesParPersonne: { [id: string]: number } = {}
    const dimanchesParPersonne: { [id: string]: number } = {}
    let preferencesRespectees = 0
    let totalPreferences = 0

    // Initialiser les compteurs
    participants.forEach((p) => {
      gardesParPersonne[p.id] = 0
      dimanchesParPersonne[p.id] = 0
    })

    // Compter le total de préférences
    contraintes.forEach((c) => {
      if (c.type_contrainte === 'preferred') {
        totalPreferences++
      }
    })

    // Extraire les affectations
    Object.keys(solution).forEach((varName) => {
      if (varName.startsWith('x_') && solution[varName] === 1) {
        const parts = varName.split('_')
        const participant_id = parts[1]
        const date_garde = parts.slice(2).join('-')

        assignments.push({ participant_id, date_garde })

        // Compter les gardes
        gardesParPersonne[participant_id] = (gardesParPersonne[participant_id] || 0) + 1

        // Compter les dimanches
        if (sundays.includes(date_garde)) {
          dimanchesParPersonne[participant_id] = (dimanchesParPersonne[participant_id] || 0) + 1
        }

        // Compter les préférences respectées
        const key = `${participant_id}_${date_garde}`
        if (contraintesMap[key] === 'preferred') {
          preferencesRespectees++
        }
      }
    })

    // Trier par date
    assignments.sort((a, b) => a.date_garde.localeCompare(b.date_garde))

    console.log('📈 Statistiques:')
    console.log('  - Assignations:', assignments.length)
    console.log('  - Préférences respectées:', preferencesRespectees, '/', totalPreferences)
    console.log('  - Gardes par personne:', gardesParPersonne)
    console.log('  - Dimanches par personne:', dimanchesParPersonne)

    return {
      success: true,
      assignments,
      stats: {
        total_jours: nbJours,
        nb_participants: nbParticipants,
        gardes_par_personne: gardesParPersonne,
        dimanches_par_personne: dimanchesParPersonne,
        preferences_respectees: preferencesRespectees,
        total_preferences: totalPreferences,
      },
    }
  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}
