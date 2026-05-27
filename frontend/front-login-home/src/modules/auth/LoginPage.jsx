import { useState } from 'react'
import LampMark from '../../shared/components/LampMark'
import StatusMessage from '../../shared/components/StatusMessage'
import {
  SYSTEM_MODULES,
  buildDefaultPermissions,
} from '../home/modules.constants'
import { createFirstAccount, login, requestAccess } from './auth.service'

const INITIAL_LOGIN = {
  email: '',
  senha: '',
}

const INITIAL_REQUEST = {
  nome: '',
  email: '',
  senha: '',
  modulos_solicitados: ['ESCRITORIO'],
}

const INITIAL_BOOTSTRAP = {
  nome: '',
  email: '',
  senha: '',
}

function LoginPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [loginForm, setLoginForm] = useState(INITIAL_LOGIN)
  const [requestForm, setRequestForm] = useState(INITIAL_REQUEST)
  const [bootstrapForm, setBootstrapForm] = useState(INITIAL_BOOTSTRAP)
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function updateLogin(field, value) {
    setLoginForm((current) => ({ ...current, [field]: value }))
  }

  function updateRequest(field, value) {
    setRequestForm((current) => ({ ...current, [field]: value }))
  }

  function updateBootstrap(field, value) {
    setBootstrapForm((current) => ({ ...current, [field]: value }))
  }

  function toggleRequestedModule(moduleId) {
    setRequestForm((current) => {
      const exists = current.modulos_solicitados.includes(moduleId)
      const modulos = exists
        ? current.modulos_solicitados.filter((item) => item !== moduleId)
        : [...current.modulos_solicitados, moduleId]

      return {
        ...current,
        modulos_solicitados: modulos.length ? modulos : ['ESCRITORIO'],
      }
    })
  }

  async function handleLogin(event) {
    event.preventDefault()
    setSubmitting(true)
    setStatus(null)

    try {
      const usuario = await login(loginForm)
      onAuthenticated(usuario)
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRequestAccess(event) {
    event.preventDefault()
    setSubmitting(true)
    setStatus(null)

    try {
      await requestAccess(requestForm)
      setRequestForm(INITIAL_REQUEST)
      setMode('login')
      setStatus({
        type: 'success',
        message: 'Pedido enviado. Aguarde a análise do administrador.',
      })
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleBootstrap(event) {
    event.preventDefault()
    setSubmitting(true)
    setStatus(null)

    try {
      await createFirstAccount({
        ...bootstrapForm,
        modulos: buildDefaultPermissions(['ADMIN', 'GERENTE', 'ESCRITORIO']),
      })
      const usuario = await login({
        email: bootstrapForm.email,
        senha: bootstrapForm.senha,
      })
      onAuthenticated(usuario)
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-screen">
      <section className="login-brand">
        <div className="brand-lockup">
          <LampMark />
          <div>
            <span>Gestão Agronegócio</span>
            <h1>Central de acesso</h1>
          </div>
        </div>
        <p>
          Entre no sistema e acesse apenas os módulos liberados para sua conta.
        </p>
      </section>

      <section className="auth-panel" aria-label="Acesso ao sistema">
        <div className="segmented-control">
          <button
            className={mode === 'login' ? 'active' : ''}
            type="button"
            onClick={() => setMode('login')}
          >
            Entrar
          </button>
          <button
            className={mode === 'request' ? 'active' : ''}
            type="button"
            onClick={() => setMode('request')}
          >
            Solicitar acesso
          </button>
          <button
            className={mode === 'bootstrap' ? 'active' : ''}
            type="button"
            onClick={() => setMode('bootstrap')}
          >
            Primeiro acesso
          </button>
        </div>

        <StatusMessage status={status} />

        {mode === 'login' ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <label>
              E-mail
              <input
                autoComplete="email"
                onChange={(event) => updateLogin('email', event.target.value)}
                required
                type="email"
                value={loginForm.email}
              />
            </label>
            <label>
              Senha
              <input
                autoComplete="current-password"
                minLength={6}
                onChange={(event) => updateLogin('senha', event.target.value)}
                required
                type="password"
                value={loginForm.senha}
              />
            </label>
            <button className="primary-button" disabled={submitting} type="submit">
              Entrar
            </button>
          </form>
        ) : mode === 'request' ? (
          <form className="auth-form" onSubmit={handleRequestAccess}>
            <label>
              Nome
              <input
                autoComplete="name"
                onChange={(event) => updateRequest('nome', event.target.value)}
                required
                type="text"
                value={requestForm.nome}
              />
            </label>
            <label>
              E-mail
              <input
                autoComplete="email"
                onChange={(event) => updateRequest('email', event.target.value)}
                required
                type="email"
                value={requestForm.email}
              />
            </label>
            <label>
              Senha
              <input
                autoComplete="new-password"
                minLength={6}
                onChange={(event) => updateRequest('senha', event.target.value)}
                required
                type="password"
                value={requestForm.senha}
              />
            </label>
            <div className="module-check-grid" aria-label="Módulos solicitados">
              {SYSTEM_MODULES.map((module) => (
                <label key={module.id} className="check-row">
                  <input
                    checked={requestForm.modulos_solicitados.includes(module.id)}
                    onChange={() => toggleRequestedModule(module.id)}
                    type="checkbox"
                  />
                  {module.nome}
                </label>
              ))}
            </div>
            <button className="primary-button" disabled={submitting} type="submit">
              Enviar pedido
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleBootstrap}>
            <label>
              Nome
              <input
                autoComplete="name"
                onChange={(event) => updateBootstrap('nome', event.target.value)}
                required
                type="text"
                value={bootstrapForm.nome}
              />
            </label>
            <label>
              E-mail
              <input
                autoComplete="email"
                onChange={(event) => updateBootstrap('email', event.target.value)}
                required
                type="email"
                value={bootstrapForm.email}
              />
            </label>
            <label>
              Senha
              <input
                autoComplete="new-password"
                minLength={6}
                onChange={(event) => updateBootstrap('senha', event.target.value)}
                required
                type="password"
                value={bootstrapForm.senha}
              />
            </label>
            <button className="primary-button" disabled={submitting} type="submit">
              Criar admin
            </button>
          </form>
        )}
      </section>
    </main>
  )
}

export default LoginPage
