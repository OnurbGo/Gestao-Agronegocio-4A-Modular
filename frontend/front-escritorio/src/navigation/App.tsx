import { useEffect, useState } from "react";
import { clearToken, consumeAccessTokenFromUrl } from "@/services/api";
import {
  getCurrentUser,
  hasEscritorioAccess,
} from "@/services/auth.service";
import type { AuthUser } from "@/types";
import { resolveLoginHomeUrl } from "@/utils/frontend-url";
import AccessGate from "./components/AccessGate";
import EscritorioShell from "./components/EscritorioShell";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Nao foi possivel validar o acesso.";
}

function App() {
  const [usuario, setUsuario] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          setError(getErrorMessage(requestError));
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
            window.location.href = resolveLoginHomeUrl(
              import.meta.env.VITE_LOGIN_HOME_URL,
            );
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
