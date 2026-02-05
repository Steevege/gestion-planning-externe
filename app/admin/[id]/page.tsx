'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format, addDays } from 'date-fns'
import { generateSaisieUrl } from '@/app/lib/tokenGenerator'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type Planning = {
  id: string
  date_debut: string
  date_fin: string
  nb_externes: number
  statut: string
  createur: string
  date_creation: string
}

type Participant = {
  id: string
  planning_id: string
  nom: string
  email: string
  token_unique: string
  statut_saisie: 'pending' | 'completed'
  date_completion: string | null
}

type Resultat = {
  id: string
  planning_id: string
  participant_id: string
  date_garde: string
  participant?: {
    nom: string
  }
}

type Contrainte = {
  id: string
  participant_id: string
  date_garde: string
  type_contrainte: 'unavailable' | 'preferred' | 'available'
}

type SatisfactionStats = {
  participant_id: string
  nom: string
  preferences_demandees: number
  preferences_obtenues: number
  taux_satisfaction: number
  nb_gardes: number
}

export default function AdminDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [planning, setPlanning] = useState<Planning | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [resultats, setResultats] = useState<Resultat[]>([])
  const [contraintes, setContraintes] = useState<Contrainte[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // État formulaire ajout participant
  const [formData, setFormData] = useState({ nom: '', email: '' })
  const [addingParticipant, setAddingParticipant] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  // État génération du planning
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [generateSuccess, setGenerateSuccess] = useState(false)
  const [generateStats, setGenerateStats] = useState<any>(null)

  // Charger le planning et les participants
  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch planning
      const planningRes = await fetch(`/api/plannings`)
      const planningData = await planningRes.json()
      const currentPlanning = planningData.plannings.find((p: Planning) => p.id === id)

      if (!currentPlanning) {
        setError('Planning introuvable')
        return
      }

      setPlanning(currentPlanning)

      // Fetch participants
      const participantsRes = await fetch(`/api/participants?planning_id=${id}`)
      const participantsData = await participantsRes.json()
      setParticipants(participantsData.participants || [])

      // Récupérer toutes les contraintes (pour stats et satisfaction)
      const participantIds = participantsData.participants.map((p: Participant) => p.id)
      if (participantIds.length > 0) {
        const contraintesRes = await fetch(`/api/contraintes/all?participant_ids=${participantIds.join(',')}`)
        const contraintesData = await contraintesRes.json()
        setContraintes(contraintesData.contraintes || [])
      }

      // Fetch résultats si le planning est généré
      if (currentPlanning.statut === 'generated' || currentPlanning.statut === 'finalized') {
        const resultatsRes = await fetch(`/api/resultats?planning_id=${id}`)
        const resultatsData = await resultatsRes.json()
        setResultats(resultatsData.resultats || [])
      }
    } catch (err) {
      setError('Erreur lors du chargement des données')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Ajouter un participant
  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setAddingParticipant(true)

    try {
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planning_id: id,
          nom: formData.nom,
          email: formData.email,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de l\'ajout du participant')
      }

      // Réinitialiser le formulaire et recharger
      setFormData({ nom: '', email: '' })
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setAddingParticipant(false)
    }
  }

  // Copier le lien dans le presse-papier
  const copyToClipboard = async (token: string) => {
    const url = generateSaisieUrl(token)
    try {
      await navigator.clipboard.writeText(url)
      setCopiedToken(token)
      setTimeout(() => setCopiedToken(null), 2000)
    } catch (err) {
      alert('Erreur lors de la copie du lien')
    }
  }

  // Générer PDF
  const generatePDF = () => {
    if (!planning || resultats.length === 0) return

    const doc = new jsPDF()

    // Titre
    doc.setFontSize(18)
    doc.text('Planning de gardes', 14, 20)

    // Infos planning
    doc.setFontSize(11)
    doc.text(
      `Période : ${new Date(planning.date_debut).toLocaleDateString('fr-FR')} au ${new Date(planning.date_fin).toLocaleDateString('fr-FR')}`,
      14,
      30
    )
    doc.text(`Créé par : ${planning.createur}`, 14, 37)

    // Tableau
    const tableData = resultats.map((resultat) => {
      const date = new Date(resultat.date_garde)
      const jourSemaine = date.toLocaleDateString('fr-FR', { weekday: 'long' })
      const dateFormatted = date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
      const isDimanche = date.getDay() === 0

      return [
        dateFormatted,
        jourSemaine.charAt(0).toUpperCase() + jourSemaine.slice(1),
        resultat.participant?.nom || 'N/A',
        isDimanche ? '★' : '',
      ]
    })

    autoTable(doc, {
      head: [['Date', 'Jour', 'Externe de garde', 'Dimanche']],
      body: tableData,
      startY: 45,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 35 },
        2: { cellWidth: 70 },
        3: { cellWidth: 20, halign: 'center' },
      },
    })

    // Légende
    const finalY = (doc as any).lastAutoTable.finalY || 45
    doc.setFontSize(9)
    doc.text('★ = Dimanche', 14, finalY + 10)

    // Télécharger
    const filename = `Planning_${format(new Date(planning.date_debut), 'dd-MM-yyyy')}_au_${format(new Date(planning.date_fin), 'dd-MM-yyyy')}.pdf`
    doc.save(filename)
  }

  // Copier tous les liens
  const copyAllLinks = async () => {
    if (participants.length === 0) return

    const allLinks = participants
      .map((p) => {
        const url = generateSaisieUrl(p.token_unique)
        return `${p.nom} - ${p.email}\n${url}\n`
      })
      .join('\n')

    try {
      await navigator.clipboard.writeText(allLinks)
      alert('✅ Tous les liens ont été copiés dans le presse-papier !')
    } catch (err) {
      alert('❌ Erreur lors de la copie des liens')
    }
  }

  // Supprimer un participant
  const handleDeleteParticipant = async (participantId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce participant ?')) {
      return
    }

    try {
      const response = await fetch(`/api/participants?id=${participantId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      await fetchData()
    } catch (err) {
      alert('Erreur lors de la suppression du participant')
    }
  }

  // Supprimer le planning
  const handleDeletePlanning = async () => {
    if (!confirm('⚠️ ATTENTION : Êtes-vous sûr de vouloir supprimer ce planning ?\n\nCette action supprimera :\n- Le planning\n- Tous les participants et leurs liens\n- Toutes les contraintes saisies\n- Tous les résultats générés\n\nCette action est IRRÉVERSIBLE !')) {
      return
    }

    if (!confirm('Confirmation finale : Supprimer définitivement ce planning ?')) {
      return
    }

    try {
      const response = await fetch(`/api/plannings/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      alert('✅ Planning supprimé avec succès')
      router.push('/')
    } catch (err) {
      alert('❌ Erreur lors de la suppression du planning')
      console.error(err)
    }
  }

  // Générer le planning
  const handleGenerate = async () => {
    if (!confirm('Êtes-vous sûr de vouloir générer le planning ? Cette opération peut prendre quelques secondes.')) {
      return
    }

    setGenerating(true)
    setGenerateError(null)
    setGenerateSuccess(false)
    setGenerateStats(null)

    try {
      const response = await fetch(`/api/plannings/${id}/generate`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération')
      }

      setGenerateSuccess(true)
      setGenerateStats(data)
      await fetchData() // Recharger les données pour voir le nouveau statut
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Une erreur est survenue'
      setGenerateError(errorMsg)
    } finally {
      setGenerating(false)
    }
  }

  // Formater les dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

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

  if (error && !planning) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white shadow-md rounded-lg p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">❌ Erreur</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  if (!planning) return null

  const nbParticipants = participants.length
  const nbCompleted = participants.filter((p) => p.statut_saisie === 'completed').length
  const progressPercent = nbParticipants > 0 ? Math.round((nbCompleted / nbParticipants) * 100) : 0

  // Calculer les stats de satisfaction
  const satisfactionStats: SatisfactionStats[] = participants.map((participant) => {
    // Trouver toutes les préférences de ce participant
    const preferences = contraintes.filter(
      (c) => c.participant_id === participant.id && c.type_contrainte === 'preferred'
    )

    // Trouver toutes les gardes assignées à ce participant
    const gardesAssignees = resultats.filter((r) => r.participant_id === participant.id)

    // Calculer combien de préférences ont été obtenues
    const preferencesObtenues = gardesAssignees.filter((garde) =>
      preferences.some((pref) => pref.date_garde === garde.date_garde)
    ).length

    const tauxSatisfaction =
      preferences.length > 0 ? Math.round((preferencesObtenues / preferences.length) * 100) : 100

    return {
      participant_id: participant.id,
      nom: participant.nom,
      preferences_demandees: preferences.length,
      preferences_obtenues: preferencesObtenues,
      taux_satisfaction: tauxSatisfaction,
      nb_gardes: gardesAssignees.length,
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-md rounded-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                📋 Dashboard Admin
              </h1>
              <p className="text-gray-600">
                Planning créé par {planning.createur} le{' '}
                {new Date(planning.date_creation).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                planning.statut === 'draft'
                  ? 'bg-gray-100 text-gray-800'
                  : planning.statut === 'collecting'
                  ? 'bg-blue-100 text-blue-800'
                  : planning.statut === 'generated'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-purple-100 text-purple-800'
              }`}
            >
              {planning.statut === 'draft' && '📝 Brouillon'}
              {planning.statut === 'collecting' && '📨 En collecte'}
              {planning.statut === 'generated' && '✅ Généré'}
              {planning.statut === 'finalized' && '🔒 Finalisé'}
            </span>
          </div>

          {/* Infos planning */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Période</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatDate(planning.date_debut)} → {formatDate(planning.date_fin)}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Nombre d'externes</p>
              <p className="text-lg font-semibold text-gray-900">
                {planning.nb_externes} externe{planning.nb_externes > 1 ? 's' : ''}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Participants</p>
              <p className="text-lg font-semibold text-gray-900">
                {nbParticipants} externe{nbParticipants > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Progression */}
          {nbParticipants > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-blue-900">
                  Progression : {nbCompleted}/{nbParticipants} vœux reçus
                </p>
                <span className="text-sm font-bold text-blue-900">{progressPercent}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Formulaire ajout participant */}
        <div className="bg-white shadow-md rounded-lg p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            👥 Ajouter un participant
          </h2>

          <form onSubmit={handleAddParticipant} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  id="nom"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Jean Dupont"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="jean.dupont@exemple.fr"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={addingParticipant}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {addingParticipant ? 'Ajout en cours...' : '+ Ajouter'}
            </button>
          </form>
        </div>

        {/* Liste des participants */}
        <div className="bg-white shadow-md rounded-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              📝 Liste des participants ({nbParticipants})
            </h2>
            {nbParticipants > 0 && (
              <button
                onClick={copyAllLinks}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                📋 Copier tous les liens
              </button>
            )}
          </div>

          {participants.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">Aucun participant ajouté</p>
              <p className="text-sm">Utilisez le formulaire ci-dessus pour ajouter des externes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {participants.map((participant) => {
                const url = generateSaisieUrl(participant.token_unique)
                const isCopied = copiedToken === participant.token_unique

                return (
                  <div
                    key={participant.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{participant.nom}</h3>
                        <p className="text-sm text-gray-600">{participant.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            participant.statut_saisie === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {participant.statut_saisie === 'completed' ? '✅ Complété' : '⏳ En attente'}
                        </span>
                        <button
                          onClick={() => handleDeleteParticipant(participant.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-2">Lien personnel de saisie :</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm bg-white px-3 py-2 rounded border border-gray-300 overflow-x-auto">
                          {url}
                        </code>
                        <button
                          onClick={() => copyToClipboard(participant.token_unique)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            isCopied
                              ? 'bg-green-600 text-white'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {isCopied ? '✅ Copié' : '📋 Copier'}
                        </button>
                      </div>
                    </div>

                    {participant.date_completion && (
                      <p className="text-xs text-gray-500 mt-2">
                        Vœux complétés le {new Date(participant.date_completion).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Résultats du planning généré */}
        {(planning.statut === 'generated' || planning.statut === 'finalized') && resultats.length > 0 && (
          <div className="bg-white shadow-md rounded-lg p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              📅 Planning généré ({resultats.length} gardes)
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jour
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Externe de garde
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resultats.map((resultat, index) => {
                    const date = new Date(resultat.date_garde)
                    const jourSemaine = date.toLocaleDateString('fr-FR', { weekday: 'long' })
                    const dateFormatted = date.toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })
                    const isDimanche = date.getDay() === 0

                    return (
                      <tr
                        key={resultat.id}
                        className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${
                          isDimanche ? 'bg-yellow-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {dateFormatted}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                          {jourSemaine}
                          {isDimanche && ' 🌟'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {resultat.participant?.nom || 'N/A'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Légende */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                🌟 = Dimanche
              </p>
            </div>

            {/* Boutons export */}
            <div className="mt-6 flex gap-4 flex-wrap">
              <a
                href={`/api/plannings/${id}/export`}
                download
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
              >
                📥 Télécharger Excel (.xlsx)
              </a>

              <button
                onClick={generatePDF}
                className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
              >
                📄 Télécharger PDF
              </button>
            </div>
          </div>
        )}

        {/* Taux de satisfaction par externe */}
        {(planning.statut === 'generated' || planning.statut === 'finalized') && satisfactionStats.length > 0 && (
          <div className="bg-white shadow-md rounded-lg p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              📊 Taux de satisfaction par externe
            </h2>

            <div className="space-y-4">
              {satisfactionStats
                .sort((a, b) => b.taux_satisfaction - a.taux_satisfaction)
                .map((stat) => {
                  const couleur =
                    stat.taux_satisfaction >= 75
                      ? 'bg-green-500'
                      : stat.taux_satisfaction >= 50
                      ? 'bg-orange-500'
                      : 'bg-red-500'

                  return (
                    <div key={stat.participant_id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{stat.nom}</h3>
                          <p className="text-sm text-gray-600">
                            {stat.nb_gardes} garde{stat.nb_gardes > 1 ? 's' : ''} assignée{stat.nb_gardes > 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">{stat.taux_satisfaction}%</p>
                          <p className="text-xs text-gray-600">
                            {stat.preferences_obtenues}/{stat.preferences_demandees} préférences
                          </p>
                        </div>
                      </div>

                      {/* Barre de progression */}
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`${couleur} h-3 rounded-full transition-all duration-500`}
                          style={{ width: `${stat.taux_satisfaction}%` }}
                        ></div>
                      </div>

                      {/* Indicateur textuel */}
                      <p className="text-xs text-gray-500 mt-1">
                        {stat.taux_satisfaction >= 75 && '🟢 Très satisfait'}
                        {stat.taux_satisfaction >= 50 && stat.taux_satisfaction < 75 && '🟠 Moyennement satisfait'}
                        {stat.taux_satisfaction < 50 && '🔴 Peu satisfait'}
                        {stat.preferences_demandees === 0 && '⚪ Aucune préférence exprimée'}
                      </p>
                    </div>
                  )
                })}
            </div>

            {/* Stats globales */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Satisfaction moyenne :</strong>{' '}
                {Math.round(
                  satisfactionStats.reduce((acc, s) => acc + s.taux_satisfaction, 0) /
                    satisfactionStats.length
                )}
                %
              </p>
            </div>
          </div>
        )}

        {/* Stats pré-génération */}
        {nbParticipants > 0 && progressPercent === 100 && planning.statut !== 'generated' && planning.statut !== 'finalized' && contraintes.length > 0 && (
          <div className="bg-white shadow-md rounded-lg p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              📊 Analyse des vœux avant génération
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total contraintes</p>
                <p className="text-3xl font-bold text-blue-600">{contraintes.length}</p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Indisponibilités</p>
                <p className="text-3xl font-bold text-red-600">
                  {contraintes.filter((c) => c.type_contrainte === 'unavailable').length}
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Préférences</p>
                <p className="text-3xl font-bold text-green-600">
                  {contraintes.filter((c) => c.type_contrainte === 'preferred').length}
                </p>
              </div>
            </div>

            {/* Alertes potentielles */}
            {(() => {
              const dateDebut = new Date(planning.date_debut)
              const dateFin = new Date(planning.date_fin)
              const alertes: string[] = []

              // Vérifier les participants sans préférences
              participants.forEach((p) => {
                const prefsCount = contraintes.filter(
                  (c) => c.participant_id === p.id && c.type_contrainte === 'preferred'
                ).length
                if (prefsCount === 0) {
                  alertes.push(`⚠️ ${p.nom} n'a exprimé aucune préférence`)
                }
              })

              // Vérifier les dates problématiques
              let currentDate = new Date(dateDebut)
              while (currentDate <= dateFin) {
                const dateStr = format(currentDate, 'yyyy-MM-dd')
                const indisposCount = contraintes.filter(
                  (c) => c.date_garde === dateStr && c.type_contrainte === 'unavailable'
                ).length

                if (indisposCount >= nbParticipants) {
                  alertes.push(
                    `🚨 ${new Date(dateStr).toLocaleDateString('fr-FR')} : TOUS les externes sont indisponibles !`
                  )
                } else if (indisposCount >= nbParticipants * 0.8) {
                  alertes.push(
                    `⚠️ ${new Date(dateStr).toLocaleDateString('fr-FR')} : ${indisposCount}/${nbParticipants} externes indisponibles`
                  )
                }

                currentDate = addDays(currentDate, 1)
              }

              return alertes.length > 0 ? (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Alertes détectées</h3>
                  <ul className="space-y-1 text-sm text-yellow-800">
                    {alertes.map((alerte, i) => (
                      <li key={i}>{alerte}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                  <p className="text-green-800 font-medium">
                    ✅ Aucun problème détecté, vous pouvez générer le planning !
                  </p>
                </div>
              )
            })()}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-4">
          {/* Message de succès */}
          {generateSuccess && generateStats && (
            <div className="p-6 bg-green-50 border-2 border-green-200 rounded-lg">
              <h3 className="text-xl font-bold text-green-800 mb-3">
                ✅ Planning généré avec succès !
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Gardes assignées</p>
                  <p className="text-2xl font-bold text-green-600">
                    {generateStats.nb_assignations}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Préférences respectées</p>
                  <p className="text-2xl font-bold text-green-600">
                    {generateStats.stats?.preferences_respectees || 0}/{generateStats.stats?.total_preferences || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    ({Math.round((generateStats.stats?.preferences_respectees / generateStats.stats?.total_preferences) * 100) || 0}%)
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Participants</p>
                  <p className="text-2xl font-bold text-green-600">
                    {generateStats.stats?.nb_participants || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Message d'erreur */}
          {generateError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">❌ {generateError}</p>
            </div>
          )}

          <div className="flex gap-4 flex-wrap">
            <Link
              href="/"
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              ← Retour à l'accueil
            </Link>

            <button
              onClick={handleDeletePlanning}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              🗑️ Supprimer ce planning
            </button>

            {nbParticipants > 0 && progressPercent === 100 && planning.statut !== 'generated' && planning.statut !== 'finalized' && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {generating ? '⏳ Génération en cours...' : '🎲 Générer le planning'}
              </button>
            )}

            {(planning.statut === 'generated' || planning.statut === 'finalized') && (
              <button
                onClick={handleGenerate}
                disabled={generating || planning.statut === 'finalized'}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? '⏳ Régénération...' : '🔄 Régénérer le planning'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
