import { useEffect, useState } from "react";
import { Building2, Home, ShieldAlert } from "lucide-react";
import EntidadesPage from "./modules/entidades/EntidadesPage";
import FolhaPage from "./modules/folha/FolhaPage";
import EscritorioHome from "./modules/home/EscritorioHome";
import ImoveisPage from "./modules/imoveis/ImoveisPage";
import {
  getCurrentUser,
  hasEscritorioAccess,
} from "./modules/auth/auth.service";
import { clearToken, consumeAccessTokenFromUrl } from "./shared/services/api";
import "./App.css";

function AccessGate({ title, message, action }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f7f2] px-4 py-10 text-slate-900">
      <section className="w-full max-w-lg rounded-lg border border-emerald-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-800">
          <ShieldAlert aria-hidden="true" className="h-7 w-7" />
        </div>
        <span className="mt-5 block text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">
          Escritório
        </span>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">{title}</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">{message}</p>
        {action ? (
          <button
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800"
            onClick={action.onClick}
            type="button"
          >
            <Home aria-hidden="true" className="h-4 w-4" />
            {action.label}
          </button>
        ) : null}
      </section>
    </main>
  );
}

function EscritorioShell({ usuario }) {
  const [view, setView] = useState("home");

  function goHome() {
    setView("home");
  }

  return (
    <div className="min-h-screen bg-[#f4f7f2] text-slate-900">
      <header className="no-print sticky top-0 z-20 flex items-center justify-between border-b border-emerald-100 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
        <button
          className="inline-flex items-center gap-3 rounded-md px-2 py-1.5 text-left font-bold text-emerald-900 transition hover:bg-emerald-50"
          onClick={goHome}
          type="button"
        >
          <span className="grid h-10 w-10 place-items-center rounded-md bg-emerald-700 text-white">
            <Building2 aria-hidden="true" className="h-5 w-5" />
          </span>
          <span>Escritório</span>
        </button>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm font-semibold text-slate-600 sm:inline">
            {usuario.nome}
          </span>
          <button
            className="inline-flex items-center gap-2 rounded-md border border-emerald-200 px-3 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
            onClick={() => {
              window.location.href =
                import.meta.env.VITE_LOGIN_HOME_URL || "http://localhost:5173";
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
        <EscritorioHome onNavigate={setView} usuario={usuario} />
      )}
    </div>
  );
}

function App() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function validateAccess() {
      consumeAccessTokenFromUrl();

      try {
        const currentUser = await getCurrentUser();

        if (!mounted) {
          return;
        }

        if (!hasEscritorioAccess(currentUser)) {
          setError("Você não tem acesso a este módulo.");
          return;
        }

        setUsuario(currentUser);
      } catch (requestError) {
        clearToken();

        if (mounted) {
          setError(requestError.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    validateAccess();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <AccessGate message="Validando sua sessão." title="Carregando" />;
  }

  if (error || !usuario) {
    return (
      <AccessGate
        action={{
          label: "Voltar ao login",
          onClick: () => {
            window.location.href =
              import.meta.env.VITE_LOGIN_HOME_URL || "http://localhost:5173";
          },
        }}
        message={error || "Entre novamente para continuar."}
        title="Acesso bloqueado"
      />
    );
  }

  return <EscritorioShell usuario={usuario} />;
}

export default App;
