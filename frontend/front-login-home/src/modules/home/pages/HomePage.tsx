import { useState } from 'react'
import { LayoutGrid } from 'lucide-react'
import EmDesenvolvimentoPage from '@/shared/components/feedback/EmDesenvolvimentoPage'
import { getToken } from '@/shared/services/api'
import ModuleCard from '../components/ModuleCard'
import { SYSTEM_MODULES, hasModuleAccess } from '../constants/modules.constants'

function buildModuleUrl(moduleUrl) {
  const token = getToken()
  const url = new URL(moduleUrl, window.location.origin)

  if (token && url.origin !== window.location.origin) {
    url.searchParams.set('access_token', token)
  }

  return url.href
}

function HomePage({ usuario, onStatus }) {
  const [developmentModule, setDevelopmentModule] = useState(null)

  function openModule(module) {
    if (!hasModuleAccess(usuario, module.id)) {
      setDevelopmentModule(null)
      onStatus({
        type: 'error',
        message: 'Você não tem acesso a este módulo.',
      })
      return
    }

    if (!module.url) {
      onStatus(null)
      setDevelopmentModule(module)
      return
    }

    window.location.assign(buildModuleUrl(module.url))
  }

  if (developmentModule) {
    return (
      <EmDesenvolvimentoPage
        moduleName={developmentModule.nome}
        onBack={() => setDevelopmentModule(null)}
      />
    )
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">
            Olá, {usuario.nome}
          </span>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            Módulos do sistema
          </h1>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-md border border-emerald-100 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 shadow-sm">
          <LayoutGrid aria-hidden="true" className="h-4 w-4" />
          Acesso por permissão
        </div>
      </section>

      <section
        aria-label="Módulos"
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
      >
        {SYSTEM_MODULES.map((module) => {
          const allowed = hasModuleAccess(usuario, module.id)
          const unavailable = !module.url

          return (
            <ModuleCard
              allowed={allowed}
              key={module.id}
              module={module}
              onOpen={() => openModule(module)}
              unavailable={unavailable}
            />
          )
        })}
      </section>
    </main>
  )
}

export default HomePage
