import { useEffect, useState } from 'react'
import ContratosPage from './modules/contratos/ContratosPage'
import DocumentosPage from './modules/documentos/DocumentosPage'
import EntidadesPage from './modules/entidades/EntidadesPage'
import FolhaPage from './modules/folha/FolhaPage'
import EscritorioHome from './modules/home/EscritorioHome'
import ImoveisPage from './modules/imoveis/ImoveisPage'
import { getCurrentUser, hasEscritorioAccess } from './modules/auth/auth.service'
import { clearToken, consumeAccessTokenFromUrl } from './shared/services/api'
import './App.css'

function AccessGate({ title, message, action }) {
  return (
    <main className="access-gate">
      <section>
        <span>Escritorio</span>
        <h1>{title}</h1>
        <p>{message}</p>
        {action ? (
          <button className="primary-button" onClick={action.onClick} type="button">
            {action.label}
          </button>
        ) : null}
      </section>
    </main>
  )
}

function EscritorioShell({ usuario }) {
  const [view, setView] = useState('home')

  function goHome() {
    setView('home')
  }

  return (
    <div className="app-shell">
      <header className="module-header no-print">
        <button className="brand-link" onClick={goHome} type="button">
          <span className="brand-mark">GA</span>
          <span>Escritorio</span>
        </button>
        <div className="header-user">
          <span>{usuario.nome}</span>
          <button
            className="ghost-button"
            onClick={() => {
              window.location.href =
                import.meta.env.VITE_LOGIN_HOME_URL || 'http://localhost:5173'
            }}
            type="button"
          >
            Home
          </button>
        </div>
      </header>

      {view === 'entidades' ? (
        <EntidadesPage onBack={goHome} />
      ) : view === 'imoveis' ? (
        <ImoveisPage onBack={goHome} />
      ) : view === 'documentos' ? (
        <DocumentosPage onBack={goHome} onNavigate={setView} />
      ) : view === 'contratos' ? (
        <ContratosPage onBack={goHome} />
      ) : view === 'folha' ? (
        <FolhaPage onBack={goHome} />
      ) : (
        <EscritorioHome onNavigate={setView} usuario={usuario} />
      )}
    </div>
  )
}

function App() {
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    async function validateAccess() {
      consumeAccessTokenFromUrl()

      try {
        const currentUser = await getCurrentUser()

        if (!mounted) {
          return
        }

        if (!hasEscritorioAccess(currentUser)) {
          setError('Sem permissao nesse modulo.')
          return
        }

        setUsuario(currentUser)
      } catch (requestError) {
        clearToken()

        if (mounted) {
          setError(requestError.message)
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
            window.location.href =
              import.meta.env.VITE_LOGIN_HOME_URL || 'http://localhost:5173'
          },
        }}
        message={error || 'Entre novamente para continuar.'}
        title="Acesso bloqueado"
      />
    )
  }

  return <EscritorioShell usuario={usuario} />
}

export default App
