import { getToken } from '../../shared/services/api'
import { SYSTEM_MODULES, hasModuleAccess } from './modules.constants'

function buildModuleUrl(moduleUrl) {
  const token = getToken()
  const url = new URL(moduleUrl, window.location.origin)

  if (token && url.origin !== window.location.origin) {
    url.searchParams.set('access_token', token)
  }

  return url.href
}

function HomePage({ usuario, onStatus }) {
  function openModule(module) {
    if (!hasModuleAccess(usuario, module.id)) {
      onStatus({ type: 'error', message: 'Sem permissão nesse módulo.' })
      return
    }

    if (!module.url) {
      onStatus({
        type: 'warning',
        message: `${module.nome} ainda não está disponível.`,
      })
      return
    }

    window.location.assign(buildModuleUrl(module.url))
  }

  return (
    <main className="home-layout">
      <section className="home-heading">
        <span>Olá, {usuario.nome}</span>
        <h1>Módulos do sistema</h1>
      </section>

      <section className="module-grid" aria-label="Módulos">
        {SYSTEM_MODULES.map((module) => {
          const allowed = hasModuleAccess(usuario, module.id)
          const unavailable = !module.url

          return (
            <button
              className={`module-tile ${allowed ? '' : 'locked'}`}
              key={module.id}
              onClick={() => openModule(module)}
              type="button"
            >
              <span className="module-tile__status">
                {allowed ? module.status : 'Sem acesso'}
              </span>
              <strong>{module.nome}</strong>
              <span>{module.descricao}</span>
              <small>{unavailable && allowed ? 'Front em breve' : 'Abrir módulo'}</small>
            </button>
          )
        })}
      </section>
    </main>
  )
}

export default HomePage
