'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewPlanningPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // État du formulaire
  const [formData, setFormData] = useState({
    date_debut: '',
    date_fin: '',
    quota_min: 8,
    quota_max: 10,
    createur: '',
  })

  // Validation des dates
  const validateDates = () => {
    if (!formData.date_debut || !formData.date_fin) {
      setError('Les dates de début et fin sont obligatoires')
      return false
    }

    const debut = new Date(formData.date_debut)
    const fin = new Date(formData.date_fin)
    const diffJours = Math.ceil((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24))

    if (debut >= fin) {
      setError('La date de fin doit être après la date de début')
      return false
    }

    if (diffJours < 30) {
      setError('La période doit être d\'au moins 30 jours')
      return false
    }

    if (diffJours > 120) {
      setError('La période ne peut pas dépasser 120 jours')
      return false
    }

    return true
  }

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateDates()) {
      return
    }

    if (!formData.createur.trim()) {
      setError('Le nom du créateur est obligatoire')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/plannings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création du planning')
      }

      const data = await response.json()

      // Redirection vers le dashboard admin
      router.push(`/admin/${data.planning.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      setLoading(false)
    }
  }

  // Calculer le nombre de jours
  const calculateDays = () => {
    if (!formData.date_debut || !formData.date_fin) return 0
    const debut = new Date(formData.date_debut)
    const fin = new Date(formData.date_fin)
    const diff = Math.ceil((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }

  const nbJours = calculateDays()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏥 Créer un nouveau planning
          </h1>
          <p className="text-gray-600">
            Configurez la période et les contraintes pour générer le planning de gardes
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white shadow-md rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom du créateur */}
            <div>
              <label htmlFor="createur" className="block text-sm font-medium text-gray-700 mb-2">
                Votre nom (coordinateur) *
              </label>
              <input
                type="text"
                id="createur"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Dr. Martin Dupont"
                value={formData.createur}
                onChange={(e) => setFormData({ ...formData, createur: e.target.value })}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date_debut" className="block text-sm font-medium text-gray-700 mb-2">
                  Date de début *
                </label>
                <input
                  type="date"
                  id="date_debut"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.date_debut}
                  onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="date_fin" className="block text-sm font-medium text-gray-700 mb-2">
                  Date de fin *
                </label>
                <input
                  type="date"
                  id="date_fin"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.date_fin}
                  onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                />
              </div>
            </div>

            {/* Indicateur nombre de jours */}
            {nbJours > 0 && (
              <div className={`p-4 rounded-lg ${
                nbJours < 30 ? 'bg-red-50 text-red-800' :
                nbJours > 120 ? 'bg-red-50 text-red-800' :
                'bg-blue-50 text-blue-800'
              }`}>
                <p className="text-sm font-medium">
                  📅 Période : {nbJours} jours
                  {nbJours < 30 && ' (minimum 30 jours requis)'}
                  {nbJours > 120 && ' (maximum 120 jours autorisé)'}
                </p>
              </div>
            )}

            {/* Quota gardes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="quota_min" className="block text-sm font-medium text-gray-700 mb-2">
                  Quota minimum de gardes *
                </label>
                <input
                  type="number"
                  id="quota_min"
                  min="1"
                  max="15"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.quota_min}
                  onChange={(e) => setFormData({ ...formData, quota_min: parseInt(e.target.value) })}
                />
                <p className="text-xs text-gray-500 mt-1">Gardes minimum par externe</p>
              </div>

              <div>
                <label htmlFor="quota_max" className="block text-sm font-medium text-gray-700 mb-2">
                  Quota maximum de gardes *
                </label>
                <input
                  type="number"
                  id="quota_max"
                  min="1"
                  max="15"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.quota_max}
                  onChange={(e) => setFormData({ ...formData, quota_max: parseInt(e.target.value) })}
                />
                <p className="text-xs text-gray-500 mt-1">Gardes maximum par externe</p>
              </div>
            </div>

            {/* Validation quota */}
            {formData.quota_min > formData.quota_max && (
              <div className="p-4 bg-red-50 text-red-800 rounded-lg">
                <p className="text-sm font-medium">
                  ⚠️ Le quota minimum ne peut pas être supérieur au quota maximum
                </p>
              </div>
            )}

            {/* Message d'erreur */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Erreur :</strong> {error}
                </p>
              </div>
            )}

            {/* Boutons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || formData.quota_min > formData.quota_max}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Création...' : 'Créer le planning'}
              </button>
            </div>
          </form>
        </div>

        {/* Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Après création, vous pourrez ajouter les participants et générer leurs liens personnels.</p>
        </div>
      </div>
    </div>
  )
}
