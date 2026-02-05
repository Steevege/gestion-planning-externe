export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4">
          🏥 Gestion Planning Gardes
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Application de génération automatique de plannings de gardes pour externes en médecine
        </p>

        <div className="flex gap-4 justify-center">
          <a
            href="/admin/new"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Créer un planning (Admin)
          </a>

          <a
            href="/saisie/demo"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Saisir mes vœux (Externe)
          </a>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          <p>✅ MVP Setup complet</p>
          <p>✅ Next.js 16 + Supabase + React Big Calendar</p>
          <p>✅ Coût : 0€ (Vercel Free + Supabase Free)</p>
        </div>
      </div>
    </main>
  );
}
