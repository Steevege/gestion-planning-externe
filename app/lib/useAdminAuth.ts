import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function useAdminAuth() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Vérifier si on a un token admin
    const token = localStorage.getItem('admin_token')

    if (!token) {
      // Pas de token, rediriger vers login
      router.push('/admin/login')
    } else {
      // Token présent, authentifié
      setIsAuthenticated(true)
    }

    setIsLoading(false)
  }, [router])

  const logout = () => {
    localStorage.removeItem('admin_token')
    router.push('/admin/login')
  }

  return { isAuthenticated, isLoading, logout }
}
