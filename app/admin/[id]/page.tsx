'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { generateSaisieUrl } from '@/app/lib/tokenGenerator'

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

export default function AdminDashboardPage() {
  const params = useParams()
  const id = params?.id as string

  const [planning, setPlanning] = useState<Planning | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // État formulaire ajout participant
  const [formData, setFormData] = useState({ nom: '', email: '' })
  const [addingParticipant, setAddingParticipant] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

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
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            📝 Liste des participants ({nbParticipants})
          </h2>

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

        {/* Actions */}
        <div className="mt-6 flex gap-4">
          <Link
            href="/"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            ← Retour à l'accueil
          </Link>

          {nbParticipants > 0 && progressPercent === 100 && (
            <button
              disabled
              className="px-6 py-3 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
            >
              🎲 Générer le planning (À venir - F4)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
