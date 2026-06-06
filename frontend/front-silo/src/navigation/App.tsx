import { useEffect, useState } from 'react'
import { clearToken, consumeAccessTokenFromUrl } from '@/services/api'
import { getCurrentUser, hasSiloAccess } from '@/services/auth.service'
import type { AuthUser } from '@/types'
import { resolveLoginHomeUrl } from '@/utils/frontend-url'
import AccessGate from './components/AccessGate'
import SiloShell from './components/SiloShell'

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Nao foi possivel validar o acesso.'
}

function App() {
  const [usuario, setUsuario] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function validateAccess() {
      consumeAccessTokenFromUrl()

      try {
        const currentUser = await getCurrentUser()

        if (!mounted) return

        if (!hasSiloAccess(currentUser)) {
          setError('Voce nao tem acesso a este modulo.')
          return
        }

        setUsuario(currentUser)
      } catch (requestError) {
        clearToken()

        if (mounted) {
          setError(getErrorMessage(requestError))
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    validateAccess()

    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return <AccessGate message="Validando sua sessao." title="Carregando" />
  }

  if (error || !usuario) {
    return (
      <AccessGate
        action={{
          label: 'Voltar ao login',
          onClick: () => {
            window.location.href = resolveLoginHomeUrl(
              import.meta.env.VITE_LOGIN_HOME_URL,
            )
          },
        }}
        message={error || 'Entre novamente para continuar.'}
        title="Acesso bloqueado"
      />
    )
  }

  return <SiloShell usuario={usuario} />
}

export default App
