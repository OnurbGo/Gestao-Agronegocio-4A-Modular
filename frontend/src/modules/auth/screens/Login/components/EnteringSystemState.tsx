import { Cog } from 'lucide-react'

function EnteringSystemState() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f7f2] px-4 py-8 text-slate-900">
      <section className="grid w-full max-w-md justify-items-center gap-5 rounded-lg border border-emerald-100 bg-white px-8 py-10 text-center shadow-xl">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-800 ring-8 ring-emerald-50/70">
          <Cog aria-hidden="true" className="h-8 w-8 animate-spin" />
        </span>
        <div className="grid gap-2">
          <h1 className="text-2xl font-bold text-slate-950">
            Entrando no sistema...
          </h1>
          <p className="text-sm leading-6 text-slate-600">
            Preparando sua área de trabalho.
          </p>
        </div>
      </section>
    </main>
  )
}

export default EnteringSystemState
