import { useState } from "react";
import { ArrowRight, LayoutGrid, Lock, Settings } from "lucide-react";
import EmDesenvolvimentoPage from "../../shared/components/EmDesenvolvimentoPage";
import { getToken } from "../../shared/services/api";
import { SYSTEM_MODULES, hasModuleAccess } from "./modules.constants";

function buildModuleUrl(moduleUrl) {
  const token = getToken();
  const url = new URL(moduleUrl, window.location.origin);

  if (token && url.origin !== window.location.origin) {
    url.searchParams.set("access_token", token);
  }

  return url.href;
}

function HomePage({ usuario, onStatus }) {
  const [developmentModule, setDevelopmentModule] = useState(null);

  function openModule(module) {
    if (!hasModuleAccess(usuario, module.id)) {
      setDevelopmentModule(null);
      onStatus({
        type: "error",
        message: "Você não tem acesso a este módulo.",
      });
      return;
    }

    if (!module.url) {
      onStatus(null);
      setDevelopmentModule(module);
      return;
    }

    window.location.assign(buildModuleUrl(module.url));
  }

  if (developmentModule) {
    return (
      <EmDesenvolvimentoPage
        moduleName={developmentModule.nome}
        onBack={() => setDevelopmentModule(null)}
      />
    );
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
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {SYSTEM_MODULES.map((module) => {
          const allowed = hasModuleAccess(usuario, module.id);
          const unavailable = !module.url;

          return (
            <button
              className={`min-h-44 rounded-lg border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                allowed
                  ? "border-emerald-100 hover:border-emerald-300"
                  : "border-slate-200 opacity-75"
              }`}
              key={module.id}
              onClick={() => openModule(module)}
              type="button"
            >
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                  allowed
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {allowed ? (
                  unavailable ? (
                    <Settings aria-hidden="true" className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                  )
                ) : (
                  <Lock aria-hidden="true" className="h-3.5 w-3.5" />
                )}
                {allowed ? module.status : "Sem acesso"}
              </span>
              <strong className="mt-5 block text-xl font-bold text-slate-950">
                {module.nome}
              </strong>
              <span className="mt-3 block min-h-12 text-sm leading-6 text-slate-600">
                {module.descricao}
              </span>
              <small className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-800">
                {unavailable && allowed ? "Em desenvolvimento" : "Abrir módulo"}
                {allowed && !unavailable ? (
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                ) : null}
              </small>
            </button>
          );
        })}
      </section>
    </main>
  );
}

export default HomePage;
