import { NextRequest, NextResponse } from 'next/server'

// POST /api/admin/login - Vérifier le mot de passe admin
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { error: 'Mot de passe requis' },
        { status: 400 }
      )
    }

    // Récupérer le mot de passe depuis les variables d'environnement
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

    if (password !== adminPassword) {
      return NextResponse.json(
        { error: 'Mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Générer un token simple (pour MVP, juste un timestamp encodé)
    const token = Buffer.from(`admin_${Date.now()}`).toString('base64')

    return NextResponse.json({
      success: true,
      token,
      message: 'Connexion réussie',
    })
  } catch (error) {
    console.error('Erreur login:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
