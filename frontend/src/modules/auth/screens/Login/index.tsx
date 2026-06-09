import {
  Leaf,
  Lightbulb,
  Lock,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import StatusMessage from '@/shared/components/feedback/StatusMessage'
import { SYSTEM_MODULES } from '@/app/modules'
import type { AuthUser } from '@/shared/types'
import EnteringSystemState from './components/EnteringSystemState'
import Field from './components/Field'
import SubmitButton from './components/SubmitButton'
import { MODE_OPTIONS } from './constants'
import { useLoginAccess } from './hooks/useLoginAccess'

type LoginPageProps = {
  onAuthenticated: (usuario: AuthUser) => void
}

function LoginPage({ onAuthenticated }: LoginPageProps) {
  const {
    bootstrapForm,
    changeMode,
    content,
    enteringSystem,
    handleBootstrap,
    handleLogin,
    handleRequestAccess,
    loginForm,
    mode,
    requestForm,
    status,
    submitting,
    toggleRequestedModule,
    updateBootstrap,
    updateLogin,
    updateRequest,
  } = useLoginAccess({ onAuthenticated })

  if (enteringSystem) {
    return <EnteringSystemState />
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] px-4 py-6 text-slate-900 sm:px-6 lg:px-10">
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-xl lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative flex min-h-[360px] flex-col justify-center overflow-hidden bg-emerald-900 p-8 text-white sm:p-10">
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-lime-500/25 to-transparent" />
          <div className="relative z-10 max-w-md">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">
              <Lightbulb aria-hidden="true" className="h-5 w-5 text-lime-200" />
              Gestão 4A
            </div>
            <div className="mt-12">
              <span className="text-sm font-semibold uppercase tracking-[0.18em] text-lime-200">
                Agro e negócios
              </span>
              <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
                Gestão de negócios para o agro
              </h1>
              <p className="mt-5 text-base leading-7 text-emerald-50">
                Controle acessos, escritório e operações em um sistema simples
                para a rotina do campo.
              </p>
            </div>
          </div>
        </aside>

        <section
          aria-label="Acesso ao sistema"
          className="flex items-center justify-center p-6 sm:p-10"
        >
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-md bg-lime-100 text-emerald-800">
                <Leaf aria-hidden="true" className="h-6 w-6" />
              </span>
              <div>
                <span className="text-sm font-semibold text-emerald-700">
                  Sistema 4A
                </span>
                <h2 className="text-2xl font-bold text-slate-950">
                  {content.title}
                </h2>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-3 gap-1 rounded-md bg-slate-100 p-1">
              {MODE_OPTIONS.map((option) => (
                <button
                  className={`rounded-md px-3 py-2 text-xs font-bold transition sm:text-sm ${
                    mode === option.id
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  key={option.id}
                  onClick={() => changeMode(option.id)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>

            <p className="mb-5 text-sm leading-6 text-slate-600">
              {content.description}
            </p>

            <div className="mb-5">
              <StatusMessage status={status} />
            </div>

            {mode === 'login' ? (
              <form className="grid gap-4" onSubmit={handleLogin}>
                <Field
                  autoComplete="email"
                  icon={Mail}
                  label="E-mail"
                  onChange={(event) => updateLogin('email', event.target.value)}
                  type="email"
                  value={loginForm.email}
                />
                <Field
                  autoComplete="current-password"
                  icon={Lock}
                  label="Senha"
                  onChange={(event) => updateLogin('senha', event.target.value)}
                  type="password"
                  value={loginForm.senha}
                />
                <SubmitButton loading={submitting}>
                  {submitting ? content.loading : content.submit}
                </SubmitButton>
              </form>
            ) : mode === 'request' ? (
              <form className="grid gap-4" onSubmit={handleRequestAccess}>
                <Field
                  autoComplete="name"
                  icon={UserRound}
                  label="Nome"
                  onChange={(event) => updateRequest('nome', event.target.value)}
                  value={requestForm.nome}
                />
                <Field
                  autoComplete="email"
                  icon={Mail}
                  label="E-mail"
                  onChange={(event) => updateRequest('email', event.target.value)}
                  type="email"
                  value={requestForm.email}
                />
                <Field
                  autoComplete="new-password"
                  icon={Lock}
                  label="Senha"
                  minLength={8}
                  onChange={(event) => updateRequest('senha', event.target.value)}
                  type="password"
                  value={requestForm.senha}
                />
                <fieldset className="grid gap-3">
                  <legend className="text-sm font-semibold text-slate-700">
                    Módulos solicitados
                  </legend>
                  <div className="grid grid-cols-2 gap-2">
                    {SYSTEM_MODULES.map((module) => (
                      <label
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300"
                        key={module.id}
                      >
                        <input
                          checked={requestForm.modulos_solicitados.includes(
                            module.id,
                          )}
                          className="h-4 w-4 accent-emerald-700"
                          onChange={() => toggleRequestedModule(module.id)}
                          type="checkbox"
                        />
                        {module.nome}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <SubmitButton loading={submitting}>
                  {submitting ? content.loading : content.submit}
                </SubmitButton>
              </form>
            ) : (
              <form className="grid gap-4" onSubmit={handleBootstrap}>
                <div className="rounded-md border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
                  <ShieldCheck
                    aria-hidden="true"
                    className="mr-2 inline h-5 w-5 align-[-4px]"
                  />
                  O Core só permite esta criação quando não existe nenhuma
                  conta cadastrada.
                </div>
                <Field
                  autoComplete="name"
                  icon={UserRound}
                  label="Nome"
                  onChange={(event) =>
                    updateBootstrap('nome', event.target.value)
                  }
                  value={bootstrapForm.nome}
                />
                <Field
                  autoComplete="email"
                  icon={Mail}
                  label="E-mail"
                  onChange={(event) =>
                    updateBootstrap('email', event.target.value)
                  }
                  type="email"
                  value={bootstrapForm.email}
                />
                <Field
                  autoComplete="new-password"
                  icon={Lock}
                  label="Senha"
                  minLength={8}
                  onChange={(event) =>
                    updateBootstrap('senha', event.target.value)
                  }
                  type="password"
                  value={bootstrapForm.senha}
                />
                <SubmitButton loading={submitting}>
                  {submitting ? content.loading : content.submit}
                </SubmitButton>
              </form>
            )}
          </div>
        </section>
      </section>
    </main>
  )
}

export default LoginPage
