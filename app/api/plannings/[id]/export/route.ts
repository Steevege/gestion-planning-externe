import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import * as XLSX from 'xlsx'

// GET /api/plannings/[id]/export - Exporter le planning en Excel
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    console.log(`📥 Export Excel du planning ${id}...`)

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

    // Vérifier que le planning est généré
    if (planning.statut !== 'generated' && planning.statut !== 'finalized') {
      return NextResponse.json(
        { error: 'Le planning doit être généré avant l\'export' },
        { status: 400 }
      )
    }

    // 2. Récupérer les résultats avec les participants
    const { data: resultats, error: resultatsError } = await supabase
      .from('resultats')
      .select(`
        *,
        participants (
          nom
        )
      `)
      .eq('planning_id', id)
      .order('date_garde')

    if (resultatsError || !resultats || resultats.length === 0) {
      return NextResponse.json(
        { error: 'Aucun résultat trouvé pour ce planning' },
        { status: 404 }
      )
    }

    console.log(`✅ ${resultats.length} résultats à exporter`)

    // 3. Préparer les données pour Excel
    const excelData = resultats.map((resultat) => {
      const date = new Date(resultat.date_garde)
      const jourSemaine = date.toLocaleDateString('fr-FR', { weekday: 'long' })
      const dateFormatted = date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
      const isDimanche = date.getDay() === 0

      return {
        Date: dateFormatted,
        Jour: jourSemaine.charAt(0).toUpperCase() + jourSemaine.slice(1),
        'Externe de garde': resultat.participants?.nom || 'N/A',
        Dimanche: isDimanche ? 'OUI' : '',
      }
    })

    // 4. Créer le workbook Excel
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Ajuster la largeur des colonnes
    const colWidths = [
      { wch: 25 }, // Date
      { wch: 15 }, // Jour
      { wch: 30 }, // Externe de garde
      { wch: 20 }, // Dimanche
    ]
    ws['!cols'] = colWidths

    // Ajouter la feuille au workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Planning de gardes')

    // 5. Générer le buffer Excel
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // 6. Créer le nom du fichier
    const dateDebut = new Date(planning.date_debut).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).replace(/\//g, '-')
    const dateFin = new Date(planning.date_fin).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).replace(/\//g, '-')
    const filename = `Planning_${dateDebut}_au_${dateFin}.xlsx`

    console.log(`✅ Fichier Excel généré: ${filename}`)

    // 7. Retourner le fichier
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('❌ Erreur export Excel:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'export Excel' },
      { status: 500 }
    )
  }
}
