'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addDays, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = { fr }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

type Participant = {
  id: string
  nom: string
  email: string
  planning_id: string
  statut_saisie: 'pending' | 'completed'
}

type Planning = {
  id: string
  date_debut: string
  date_fin: string
  statut: string
  createur: string
}

type Contrainte = {
  date_garde: string
  type_contrainte: 'unavailable' | 'preferred' | 'available'
}

type ContraintesMap = Record<string, 'unavailable' | 'preferred' | 'available'>

export default function SaisiePage() {
  const params = useParams()
  const router = useRouter()
  const token = params?.token as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [planning, setPlanning] = useState<Planning | null>(null)
  const [contraintes, setContraintes] = useState<ContraintesMap>({})
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [confirming, setConfirming] = useState(false)

  // Charger les données
  useEffect(() => {
    fetchData()
  }, [token])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Récupérer le participant et son planning via l'API dédiée
      const response = await fetch(`/api/participants/${token}`)

      if (!response.ok) {
        setError('Lien invalide ou expiré')
        return
      }

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Erreur lors du chargement')
        return
      }

      const { participant: currentParticipant, planning: currentPlanning } = data

      if (currentPlanning.statut === 'finalized') {
        setError('Le planning est finalisé, vous ne pouvez plus modifier vos vœux')
        return
      }

      setParticipant(currentParticipant)
      setPlanning(currentPlanning)

      // Récupérer les contraintes existantes
      const contraintesRes = await fetch(
        `/api/contraintes?participant_id=${currentParticipant.id}`
      )
      const contraintesData = await contraintesRes.json()

      const contraintesMap: ContraintesMap = {}
      if (contraintesData.contraintes) {
        contraintesData.contraintes.forEach((c: Contrainte) => {
          contraintesMap[c.date_garde] = c.type_contrainte
        })
      }

      setContraintes(contraintesMap)
    } catch (err) {
      setError('Erreur lors du chargement des données')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Debounced save
  useEffect(() => {
    if (!participant) return

    const timeoutId = setTimeout(() => {
      saveContraintes()
    }, 2000)

    return () => clearTimeout(timeoutId)
  }, [contraintes, participant])

  const saveContraintes = async () => {
    if (!participant) return

    setSaving(true)
    try {
      // Sauvegarder chaque contrainte
      for (const [date, type] of Object.entries(contraintes)) {
        await fetch('/api/contraintes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participant_id: participant.id,
            date_garde: date,
            type_contrainte: type,
          }),
        })
      }
      setLastSaved(new Date())
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
    } finally {
      setSaving(false)
    }
  }

  // Gérer le clic sur une date
  const handleDateClick = async (date: Date) => {
    if (!participant || !planning) return

    const dateStr = format(date, 'yyyy-MM-dd')
    const planningStart = new Date(planning.date_debut)
    const planningEnd = new Date(planning.date_fin)

    // Vérifier que la date est dans la période du planning
    if (date < planningStart || date > planningEnd) {
      return
    }

    const currentType = contraintes[dateStr] || 'available'

    // Cycle: available → unavailable → preferred → available
    let nextType: 'unavailable' | 'preferred' | 'available'
    if (currentType === 'available') {
      nextType = 'unavailable'
    } else if (currentType === 'unavailable') {
      nextType = 'preferred'
    } else {
      nextType = 'available'
    }

    // Mettre à jour l'état local
    setContraintes((prev) => {
      const newContraintes = { ...prev }
      if (nextType === 'available') {
        delete newContraintes[dateStr]
      } else {
        newContraintes[dateStr] = nextType
      }
      return newContraintes
    })
  }

  // Confirmer les vœux
  const handleConfirm = async () => {
    if (!participant) return

    if (!confirm('Êtes-vous sûr de vouloir confirmer vos vœux ? Vous ne pourrez plus les modifier.')) {
      return
    }

    setConfirming(true)
    try {
      // Sauvegarder une dernière fois
      await saveContraintes()

      // Marquer comme complété
      const response = await fetch('/api/contraintes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participant_id: participant.id }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la confirmation')
      }

      alert('✅ Vos vœux ont été confirmés avec succès !')
      router.push('/')
    } catch (err) {
      alert('Erreur lors de la confirmation')
      console.error(err)
    } finally {
      setConfirming(false)
    }
  }

  // Calculer les stats
  const nbUnavailable = Object.values(contraintes).filter((t) => t === 'unavailable').length
  const nbPreferred = Object.values(contraintes).filter((t) => t === 'preferred').length

  // Custom day prop getter pour colorer les dates
  const dayPropGetter = useCallback(
    (date: Date) => {
      if (!planning) return {}

      const dateStr = format(date, 'yyyy-MM-dd')
      const type = contraintes[dateStr]
      const planningStart = new Date(planning.date_debut)
      const planningEnd = new Date(planning.date_fin)
      const isInRange = date >= planningStart && date <= planningEnd

      if (!isInRange) {
        return { style: { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } }
      }

      if (type === 'unavailable') {
        return { style: { backgroundColor: '#fecaca', cursor: 'pointer' } }
      } else if (type === 'preferred') {
        return { style: { backgroundColor: '#bbf7d0', cursor: 'pointer' } }
      }

      return { style: { backgroundColor: 'white', cursor: 'pointer' } }
    },
    [contraintes, planning]
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white shadow-md rounded-lg p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">❌ Erreur</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  if (!participant || !planning) return null

  const isCompleted = participant.statut_saisie === 'completed'

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📅 Saisie de vos vœux de garde
          </h1>
          <p className="text-gray-600 mb-4">
            Bonjour <strong>{participant.nom}</strong>, indiquez vos disponibilités pour la
            période du{' '}
            {new Date(planning.date_debut).toLocaleDateString('fr-FR')} au{' '}
            {new Date(planning.date_fin).toLocaleDateString('fr-FR')}
          </p>

          {isCompleted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">
                ✅ Vous avez déjà confirmé vos vœux. Vous pouvez encore les modifier tant que
                le planning n'est pas généré.
              </p>
            </div>
          )}

          {/* Légende */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="w-8 h-8 bg-red-300 rounded"></div>
              <div>
                <p className="font-medium text-gray-900">Rouge = Indisponible</p>
                <p className="text-xs text-gray-600">Vous ne pouvez PAS faire cette garde</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="w-8 h-8 bg-green-300 rounded"></div>
              <div>
                <p className="font-medium text-gray-900">Vert = Préférence</p>
                <p className="text-xs text-gray-600">Vous préférez faire cette garde</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-8 h-8 bg-white border-2 border-gray-300 rounded"></div>
              <div>
                <p className="font-medium text-gray-900">Blanc = Disponible</p>
                <p className="text-xs text-gray-600">Vous êtes disponible (par défaut)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Indisponibilités</p>
              <p className="text-3xl font-bold text-red-600">{nbUnavailable}</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Préférences</p>
              <p className="text-3xl font-bold text-green-600">{nbPreferred}</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Statut</p>
              <p className="text-lg font-semibold text-blue-900">
                {saving ? '💾 Enregistrement...' : lastSaved ? `✅ Enregistré ${lastSaved.toLocaleTimeString()}` : '⏳ En attente'}
              </p>
            </div>
          </div>
        </div>

        {/* Calendrier */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📆 Cliquez sur les dates pour indiquer vos contraintes
          </h2>
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={[]}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              views={['month']}
              defaultView="month"
              defaultDate={new Date(planning.date_debut)}
              dayPropGetter={dayPropGetter}
              onSelectSlot={(slotInfo) => handleDateClick(slotInfo.start)}
              onNavigate={() => {}}
              selectable
              messages={{
                next: 'Suivant',
                previous: 'Précédent',
                today: "Aujourd'hui",
                month: 'Mois',
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="text-sm text-gray-600">
              <p>💡 Vos vœux sont enregistrés automatiquement toutes les 2 secondes.</p>
              <p>N'oubliez pas de cliquer sur "Confirmer" quand vous avez terminé !</p>
            </div>

            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-semibold text-lg"
            >
              {confirming ? 'Confirmation...' : '✅ Confirmer mes vœux'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
