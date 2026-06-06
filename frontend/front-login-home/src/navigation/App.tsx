import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";
import AdminPage from "@/screens/Admin";
import LoginPage from "@/screens/Login";
import { getCurrentUser, logout } from "@/services/auth.service";
import type { AuthUser } from "@/types";
import HomePage from "@/screens/Home";
import ProfilePage from "@/screens/Profile";
import ProfileMenu from "@/components/layout/ProfileMenu";
import StatusMessage from "@/components/feedback/StatusMessage";
import type { StatusMessageState } from "@/types";
import { clearAuthSession, getStoredUser } from "@/services/api";

type AppRoute = "home" | "admin" | "profile";

function App() {
  const [usuario, setUsuario] = useState<AuthUser | null>(() =>
    getStoredUser<AuthUser>(),
  );
  const [route, setRoute] = useState<AppRoute>("home");
  const [status, setStatus] = useState<StatusMessageState>(null);
  const [loading, setLoading] = useState(Boolean(getStoredUser<AuthUser>()));

  const canManage = usuario?.possuiAdmin || usuario?.possuiGerente;

  useEffect(() => {
    if (!getStoredUser()) {
      return;
    }

    let mounted = true;

    async function hydrateSession() {
      try {
        const current = await getCurrentUser();

        if (mounted) {
          setUsuario(current);
        }
      } catch {
        clearAuthSession();

        if (mounted) {
          setUsuario(null);
          setRoute("home");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    hydrateSession();

    return () => {
      mounted = false;
    };
  }, []);

  function handleAuthenticated(currentUser: AuthUser) {
    setUsuario(currentUser);
    setRoute("home");
    setStatus(null);
  }

  function handleNavigate(nextRoute: AppRoute) {
    if (nextRoute === "admin" && !canManage) {
      setStatus({
        type: "error",
        message: "Você não tem acesso ao Menu Admin.",
      });
      return;
    }

    setRoute(nextRoute);
    setStatus(null);
  }

  function handleLogout() {
    logout();
    setUsuario(null);
    setRoute("home");
    setStatus(null);
  }

  if (!usuario) {
    return <LoginPage onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen bg-[#f4f7f2] text-slate-900">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-emerald-100 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
        <button
          className="inline-flex items-center gap-3 rounded-md px-2 py-1.5 text-left font-bold text-emerald-900 transition hover:bg-emerald-50"
          onClick={() => handleNavigate("home")}
          type="button"
        >
          <span className="grid h-10 w-10 place-items-center rounded-md bg-emerald-700 text-white">
            <Lightbulb aria-hidden="true" className="h-5 w-5" />
          </span>
          <span>Gestão Agronegócio</span>
        </button>

        <ProfileMenu
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          usuario={usuario}
        />
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        {loading ? (
          <StatusMessage
            status={{ type: "info", message: "Validando sessão..." }}
          />
        ) : (
          <StatusMessage status={status} />
        )}
      </div>

      {route === "admin" ? (
        <AdminPage onBack={() => handleNavigate("home")} usuario={usuario} />
      ) : route === "profile" ? (
        <ProfilePage
          onBack={() => handleNavigate("home")}
          onUserUpdated={setUsuario}
          usuario={usuario}
        />
      ) : (
        <HomePage onStatus={setStatus} usuario={usuario} />
      )}
    </div>
  );
}

export default App;
