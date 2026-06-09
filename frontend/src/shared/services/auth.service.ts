import {
  clearAuthSession,
  requestJson,
  setAuthSession,
  updateStoredUser,
} from "@/shared/services/api";
import type {
  AccessRequestPayload,
  AuthSession,
  AuthUser,
  Credentials,
  FirstAccountPayload,
} from "@/shared/types";

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

export function hasModuleAccess(
  usuario: AuthUser | null | undefined,
  moduleId: string,
): boolean {
  if (usuario?.possuiAdmin || usuario?.possuiGerente) {
    return true;
  }

  return Boolean(
    usuario?.modulos?.some(
      (permissao) =>
        permissao.modulo === moduleId && permissao.pode_visualizar,
    ),
  );
}

export function canCreate(usuario: AuthUser | null | undefined, moduleId: string) {
  if (usuario?.possuiAdmin || usuario?.possuiGerente) {
    return true;
  }

  return Boolean(
    usuario?.modulos?.some(
      (permissao) => permissao.modulo === moduleId && permissao.pode_criar,
    ),
  );
}

export function canEdit(usuario: AuthUser | null | undefined, moduleId: string) {
  if (usuario?.possuiAdmin || usuario?.possuiGerente) {
    return true;
  }

  return Boolean(
    usuario?.modulos?.some(
      (permissao) => permissao.modulo === moduleId && permissao.pode_editar,
    ),
  );
}

export function hasEscritorioAccess(usuario: AuthUser | null | undefined): boolean {
  return hasModuleAccess(usuario, "ESCRITORIO");
}

export function hasSiloAccess(usuario: AuthUser | null | undefined): boolean {
  return (
    hasModuleAccess(usuario, "SILO") ||
    hasModuleAccess(usuario, "LANCAMENTOS_SILO") ||
    hasModuleAccess(usuario, "BALANCA") ||
    hasModuleAccess(usuario, "CLASSIFICACAO")
  );
}
