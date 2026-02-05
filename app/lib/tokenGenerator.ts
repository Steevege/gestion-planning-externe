import { v4 as uuidv4 } from 'uuid'

/**
 * Génère un token unique sécurisé (UUID v4)
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 *
 * @returns Token unique de 36 caractères
 */
export function generateUniqueToken(): string {
  return uuidv4()
}

/**
 * Génère une URL complète pour l'accès externe
 *
 * @param token - Token unique du participant
 * @param baseUrl - URL de base de l'application (optionnel, détecté auto en production)
 * @returns URL complète vers la page de saisie
 */
export function generateSaisieUrl(token: string, baseUrl?: string): string {
  // En développement, utiliser localhost
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${base}/saisie/${token}`
}

/**
 * Valide qu'un token a le bon format UUID v4
 *
 * @param token - Token à valider
 * @returns true si le token est valide
 */
export function isValidToken(token: string): boolean {
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidV4Regex.test(token)
}
