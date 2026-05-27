import { useEffect, useState } from 'react'
import AdminPage from './modules/admin/AdminPage'
import LoginPage from './modules/auth/LoginPage'
import { getCurrentUser, logout } from './modules/auth/auth.service'
import HomePage from './modules/home/HomePage'
import ProfilePage from './modules/profile/ProfilePage'
import LampMark from './shared/components/LampMark'
import ProfileMenu from './shared/components/ProfileMenu'
import StatusMessage from './shared/components/StatusMessage'
import { clearAuthSession, getStoredUser } from './shared/services/api'
import './App.css'

function App() {
  const [usuario, setUsuario] = useState(() => getStoredUser())
  const [route, setRoute] = useState('home')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(Boolean(getStoredUser()))

  const canManage = usuario?.possuiAdmin || usuario?.possuiGerente

  useEffect(() => {
    if (!getStoredUser()) {
      return
    }

    let mounted = true

    async function hydrateSession() {
      try {
        const current = await getCurrentUser()

        if (mounted) {
          setUsuario(current)
        }
      } catch {
        clearAuthSession()

        if (mounted) {
          setUsuario(null)
          setRoute('home')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    hydrateSession()

    return () => {
      mounted = false
    }
  }, [])

  function handleAuthenticated(currentUser) {
    setUsuario(currentUser)
    setRoute('home')
    setStatus(null)
  }

  function handleNavigate(nextRoute) {
    if (nextRoute === 'admin' && !canManage) {
      setStatus({ type: 'error', message: 'Sem permissão no Menu Admin.' })
      return
    }

    setRoute(nextRoute)
    setStatus(null)
  }

  function handleLogout() {
    logout()
    setUsuario(null)
    setRoute('home')
    setStatus(null)
  }

  if (!usuario) {
    return <LoginPage onAuthenticated={handleAuthenticated} />
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <button
          className="brand-button"
          onClick={() => handleNavigate('home')}
          type="button"
        >
          <LampMark compact />
          <span>Gestão Agronegócio</span>
        </button>

        <ProfileMenu
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          usuario={usuario}
        />
      </header>

      <div className="app-status">
        {loading ? (
          <StatusMessage status={{ type: 'info', message: 'Validando sessão...' }} />
        ) : (
          <StatusMessage status={status} />
        )}
      </div>

      {route === 'admin' ? (
        <AdminPage onBack={() => handleNavigate('home')} />
      ) : route === 'profile' ? (
        <ProfilePage
          onBack={() => handleNavigate('home')}
          onUserUpdated={setUsuario}
          usuario={usuario}
        />
      ) : (
        <HomePage onStatus={setStatus} usuario={usuario} />
      )}
    </div>
  )
}

export default App
