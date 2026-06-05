import {
  clearAuthSession,
  requestJson,
  setAuthSession,
  updateStoredUser,
} from "@/services/api";
import type {
  AccessRequestPayload,
  AuthSession,
  AuthUser,
  Credentials,
  FirstAccountPayload,
} from "@/types";

const CORE_BASE = "/api/core";

function normalizeEmail(email: string): string {
  return String(email || "").trim().toLowerCase();
}

export async function login(credentials: Credentials): Promise<AuthUser> {
  const session = await requestJson<AuthSession>(`${CORE_BASE}/auth/login`, {
    method: "POST",
    body: JSON.stringify({
      ...credentials,
      email: normalizeEmail(credentials.email),
    }),
  });

  setAuthSession(session.token, session.usuario);
  return session.usuario;
}

export function logout(): void {
  clearAuthSession();
}

export async function getCurrentUser(): Promise<AuthUser> {
  const usuario = await requestJson<AuthUser>(`${CORE_BASE}/auth/me`);
  updateStoredUser(usuario);
  return usuario;
}

export async function requestAccess(data: AccessRequestPayload): Promise<unknown> {
  return requestJson(`${CORE_BASE}/contas/solicitacoes`, {
    method: "POST",
    body: JSON.stringify({
      ...data,
      email: normalizeEmail(data.email),
    }),
  });
}

export function createFirstAccount(data: FirstAccountPayload): Promise<unknown> {
  return requestJson(`${CORE_BASE}/contas`, {
    method: "POST",
    body: JSON.stringify({
      ...data,
      email: normalizeEmail(data.email),
    }),
  });
}
