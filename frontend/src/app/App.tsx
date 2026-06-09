import { useEffect, useState, type ReactNode } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { Lightbulb } from "lucide-react";
import { Toaster } from "sonner";
import AdminPage from "@/modules/admin/screens/Admin";
import LoginPage from "@/modules/auth/screens/Login";
import ProfilePage from "@/modules/auth/screens/Profile";
import EscritorioShell from "@/modules/escritorio/components/EscritorioShell";
import HomePage from "@/modules/home/screens/Home";
import SiloShell from "@/modules/silo/components/SiloShell";
import ProfileMenu from "@/shared/components/layout/ProfileMenu";
import StatusMessage from "@/shared/components/feedback/StatusMessage";
import {
  getCurrentUser,
  hasEscritorioAccess,
  hasSiloAccess,
  logout,
} from "@/shared/services/auth.service";
import { clearAuthSession, getStoredUser, getToken } from "@/shared/services/api";
import type { AuthUser, StatusMessageState } from "@/shared/types";

type PortalRoute = "home" | "admin" | "profile";

type ProtectedRouteProps = {
  children: ReactNode;
  loading: boolean;
  usuario: AuthUser | null;
};

function ProtectedRoute({ children, loading, usuario }: ProtectedRouteProps) {
  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <StatusMessage
          status={{ type: "info", message: "Validando sessao..." }}
        />
      </div>
    );
  }

  if (!usuario) {
    return <Navigate replace to="/login" />;
  }

  return <>{children}</>;
}

function AccessBlocked({ message }: { message: string }) {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-3xl place-items-center px-4 py-8">
      <div className="w-full rounded-md border border-emerald-100 bg-white p-6 shadow-sm">
        <StatusMessage status={{ type: "error", message }} />
        <a
          className="mt-4 inline-flex rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-800"
          href="/"
        >
          Voltar para Home
        </a>
      </div>
    </main>
  );
}

type PortalShellProps = {
  children: ReactNode;
  onLogout: () => void;
  onStatus: (status: StatusMessageState) => void;
  status: StatusMessageState;
  usuario: AuthUser;
};

function PortalShell({
  children,
  onLogout,
  onStatus,
  status,
  usuario,
}: PortalShellProps) {
  const navigate = useNavigate();
  const canManage = usuario?.possuiAdmin || usuario?.possuiGerente;

  function handleNavigate(nextRoute: PortalRoute) {
    if (nextRoute === "admin" && !canManage) {
      onStatus({
        type: "error",
        message: "Voce nao tem acesso ao Menu Admin.",
      });
      return;
    }

    onStatus(null);
    navigate(nextRoute === "home" ? "/" : `/${nextRoute}`);
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
          <span>Gestao Agronegocio</span>
        </button>

        <ProfileMenu
          onLogout={onLogout}
          onNavigate={handleNavigate}
          usuario={usuario}
        />
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <StatusMessage status={status} />
      </div>

      {children}
    </div>
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<AuthUser | null>(() =>
    getStoredUser<AuthUser>(),
  );
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [status, setStatus] = useState<StatusMessageState>(null);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
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
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void hydrateSession();

    return () => {
      mounted = false;
    };
  }, []);

  function handleAuthenticated(currentUser: AuthUser) {
    setUsuario(currentUser);
    setStatus(null);
    navigate("/");
  }

  function handleLogout() {
    logout();
    setUsuario(null);
    setStatus(null);
    navigate("/login");
  }

  return (
    <Routes>
      <Route
        element={
          usuario && !loading ? (
            <Navigate replace to="/" />
          ) : (
            <LoginPage onAuthenticated={handleAuthenticated} />
          )
        }
        path="/login"
      />

      <Route
        element={
          <ProtectedRoute loading={loading} usuario={usuario}>
            {usuario ? (
              <PortalShell
                onLogout={handleLogout}
                onStatus={setStatus}
                status={status}
                usuario={usuario}
              >
                <HomePage onStatus={setStatus} usuario={usuario} />
              </PortalShell>
            ) : null}
          </ProtectedRoute>
        }
        path="/"
      />

      <Route
        element={
          <ProtectedRoute loading={loading} usuario={usuario}>
            {usuario ? (
              <PortalShell
                onLogout={handleLogout}
                onStatus={setStatus}
                status={status}
                usuario={usuario}
              >
                <AdminPage onBack={() => navigate("/")} usuario={usuario} />
              </PortalShell>
            ) : null}
          </ProtectedRoute>
        }
        path="/admin"
      />

      <Route
        element={
          <ProtectedRoute loading={loading} usuario={usuario}>
            {usuario ? (
              <PortalShell
                onLogout={handleLogout}
                onStatus={setStatus}
                status={status}
                usuario={usuario}
              >
                <ProfilePage
                  onBack={() => navigate("/")}
                  onUserUpdated={setUsuario}
                  usuario={usuario}
                />
              </PortalShell>
            ) : null}
          </ProtectedRoute>
        }
        path="/profile"
      />

      <Route
        element={
          <ProtectedRoute loading={loading} usuario={usuario}>
            {usuario && hasEscritorioAccess(usuario) ? (
              <EscritorioShell usuario={usuario} />
            ) : (
              <AccessBlocked message="Voce nao tem acesso ao modulo Escritorio." />
            )}
          </ProtectedRoute>
        }
        path="/escritorio/*"
      />

      <Route
        element={
          <ProtectedRoute loading={loading} usuario={usuario}>
            {usuario && hasSiloAccess(usuario) ? (
              <SiloShell usuario={usuario} />
            ) : (
              <AccessBlocked message="Voce nao tem acesso ao modulo Silo." />
            )}
          </ProtectedRoute>
        }
        path="/silo/*"
      />

      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Toaster closeButton position="top-right" richColors />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
