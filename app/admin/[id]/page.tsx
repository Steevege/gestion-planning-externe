import { supabase } from '@/app/lib/supabase'
import Link from 'next/link'

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Récupérer le planning
  const { data: planning, error } = await supabase
    .from('plannings')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !planning) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white shadow-md rounded-lg p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">❌ Planning introuvable</h1>
          <p className="text-gray-600 mb-6">Le planning demandé n'existe pas.</p>
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

  // Formater les dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-md rounded-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                ✅ Planning créé avec succès !
              </h1>
              <p className="text-gray-600">
                Créé par {planning.createur} le{' '}
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

          {/* Détails du planning */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Période</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatDate(planning.date_debut)} → {formatDate(planning.date_fin)}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Quota de gardes par externe</p>
              <p className="text-lg font-semibold text-gray-900">
                {planning.quota_min} - {planning.quota_max} gardes
              </p>
            </div>
          </div>

          {/* Prochaines étapes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">
              📋 Prochaines étapes
            </h2>
            <ol className="space-y-3 text-blue-800">
              <li className="flex items-start">
                <span className="font-bold mr-2">1.</span>
                <span>Ajouter les participants (externes) et générer leurs liens personnels</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">2.</span>
                <span>Envoyer les liens aux externes pour qu'ils saisissent leurs vœux</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">3.</span>
                <span>Suivre l'avancement (qui a complété ses vœux)</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">4.</span>
                <span>Lancer la génération automatique du planning</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">5.</span>
                <span>Visualiser et exporter le résultat</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white shadow-md rounded-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              disabled
              className="px-6 py-4 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed text-left"
            >
              <div className="font-semibold mb-1">👥 Gérer les participants</div>
              <div className="text-sm">À venir (Feature F2)</div>
            </button>

            <button
              disabled
              className="px-6 py-4 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed text-left"
            >
              <div className="font-semibold mb-1">📊 Dashboard de suivi</div>
              <div className="text-sm">À venir (Feature F3)</div>
            </button>

            <button
              disabled
              className="px-6 py-4 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed text-left"
            >
              <div className="font-semibold mb-1">🎲 Générer le planning</div>
              <div className="text-sm">À venir (Feature F4)</div>
            </button>

            <button
              disabled
              className="px-6 py-4 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed text-left"
            >
              <div className="font-semibold mb-1">📥 Exporter (Excel/PDF)</div>
              <div className="text-sm">À venir (Feature F6)</div>
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              ← Retour à l'accueil
            </Link>
          </div>
        </div>

        {/* Debug info */}
        <div className="mt-6 bg-gray-100 rounded-lg p-4">
          <details className="text-sm text-gray-600">
            <summary className="cursor-pointer font-medium">🔍 Debug - Données du planning</summary>
            <pre className="mt-2 p-4 bg-white rounded border overflow-auto text-xs">
              {JSON.stringify(planning, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  )
}
