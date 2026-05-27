import {
  clearAuthSession,
  requestJson,
  setAuthSession,
  updateStoredUser,
} from "../../shared/services/api";

const CORE_BASE = "/api/core";

export async function login(credentials) {
  const session = await requestJson(`${CORE_BASE}/auth/login`, {
    method: "POST",
    body: JSON.stringify(credentials),
  });

  setAuthSession(session.token, session.usuario);
  return session.usuario;
}

export function logout() {
  clearAuthSession();
}

export async function getCurrentUser() {
  const usuario = await requestJson(`${CORE_BASE}/auth/me`);
  updateStoredUser(usuario);
  return usuario;
}

export async function requestAccess(data) {
  return requestJson(`${CORE_BASE}/contas/solicitacoes`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function createFirstAccount(data) {
  return requestJson(`${CORE_BASE}/contas`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
