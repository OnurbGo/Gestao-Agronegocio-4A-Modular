import { ArrowLeft, Settings } from "lucide-react";

function EmDesenvolvimentoPage({ moduleName = "Funcionalidade", onBack }) {
  return (
    <main className="grid min-h-[calc(100vh-96px)] place-items-center px-4 py-10">
      <section className="w-full max-w-xl rounded-lg border border-emerald-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-800">
          <Settings aria-hidden="true" className="h-8 w-8" />
        </div>
        <span className="mt-6 block text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">
          {moduleName}
        </span>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">
          Em desenvolvimento
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Esta funcionalidade ainda será implementada. Quando estiver pronta,
          ela aparecerá aqui com o mesmo controle de acesso.
        </p>
        {onBack ? (
          <button
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-md border border-emerald-200 px-4 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
            onClick={onBack}
            type="button"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Voltar aos módulos
          </button>
        ) : null}
      </section>
    </main>
  );
}

export default EmDesenvolvimentoPage;
