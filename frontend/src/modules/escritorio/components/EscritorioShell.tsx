import { useState } from "react";
import { Building2, Home } from "lucide-react";
import EntidadesPage from "@/modules/escritorio/screens/Entidades";
import FolhaPage from "@/modules/folha/screens/Folha";
import EscritorioHome from "@/modules/escritorio/screens/Home";
import ImoveisPage from "@/modules/escritorio/screens/Imoveis";
import { hasModuleAccess } from "@/shared/services/auth.service";
import type { AuthUser } from "@/shared/types";
import AccessGate from "./AccessGate";

type View = "home" | "entidades" | "imoveis" | "folha";

type EscritorioShellProps = {
  usuario: AuthUser;
};

function EscritorioShell({ usuario }: EscritorioShellProps) {
  const [view, setView] = useState<View>("home");

  function goHome() {
    setView("home");
  }

  function navigate(target: View) {
    if (target === "folha" && !hasModuleAccess(usuario, "FOLHA")) {
      setView("home");
      return;
    }

    setView(target);
  }

  if (view === "folha" && !hasModuleAccess(usuario, "FOLHA")) {
    return (
      <AccessGate
        action={{ label: "Voltar ao Escritório", onClick: goHome }}
        message="Você não tem acesso à Folha de Pagamento."
        title="Acesso bloqueado"
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f2] text-slate-900">
      <header className="no-print sticky top-0 z-20 flex items-center justify-between border-b border-emerald-100 bg-white/95 px-4 py-8 shadow-sm backdrop-blur sm:px-6">
        <button
          className="inline-flex items-center gap-4 rounded-md px-2 py-4 text-left font-bold text-emerald-900 transition hover:bg-emerald-50"
          onClick={goHome}
          type="button"
        >
          <span className="grid h-12 w-12 place-items-center rounded-md bg-emerald-700 text-white">
            <Building2 aria-hidden="true" className="h-6 w-6" />
          </span>
          <span className="text-lg">Escritório</span>
        </button>

        <div className="flex items-center gap-4">
          <span className="hidden text-sm font-semibold text-slate-600 sm:inline">
            {usuario.nome}
          </span>
          <button
            className="inline-flex items-center gap-2 rounded-md border border-emerald-200 px-4 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
            onClick={() => {
              window.location.href = "/";
            }}
            type="button"
          >
            <Home aria-hidden="true" className="h-4 w-4" />
            Home
          </button>
        </div>
      </header>

      {view === "entidades" ? (
        <EntidadesPage onBack={goHome} />
      ) : view === "imoveis" ? (
        <ImoveisPage onBack={goHome} />
      ) : view === "folha" ? (
        <FolhaPage onBack={goHome} />
      ) : (
        <EscritorioHome onNavigate={navigate} usuario={usuario} />
      )}
    </div>
  );
}

export default EscritorioShell;
