import type { PaginatedResponse, QueryParams } from "@/shared/types";
import { getApiErrorMessage } from "@/shared/services/api-error";

export type { PaginatedResponse, QueryParams } from "@/shared/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";
const TOKEN_KEY = "gestao_agro_token";
const USER_KEY = "gestao_agro_user";

type ApiEnvelope<TData> = {
  data?: TData;
  errors?: unknown;
  message?: unknown;
  error?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getToken(): string | null {
  return (
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken")
  );
}

export function getStoredUser<TData = unknown>(): TData | null {
  const stored = localStorage.getItem(USER_KEY);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as TData;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function setAuthSession(token: string, usuario: unknown): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem("token", token);
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

export function updateStoredUser(usuario: unknown): void {
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

export function resolveAssetUrl(url?: string | null): string {
  const value = String(url || "").trim();

  if (!value) {
    return "";
  }

  if (/^(blob:|data:|https?:\/\/)/i.test(value)) {
    return value;
  }

  const normalized = value.replace(/^\/api\/core\/uploads\//, "/uploads/");

  if (!normalized.startsWith("/")) {
    return normalized;
  }

  if (!API_BASE_URL) {
    return normalized;
  }

  try {
    const apiUrl = new URL(API_BASE_URL, window.location.origin);
    return `${apiUrl.origin}${normalized}`;
  } catch {
    return normalized;
  }
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem("token", token);
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("accessToken");
}

export const clearToken = clearAuthSession;

export function consumeAccessTokenFromUrl(): void {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("access_token") || params.get("token");

  if (!token) {
    return;
  }

  setToken(token);
  params.delete("access_token");
  params.delete("token");

  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  window.history.replaceState(null, "", nextUrl);
}

function getHeaders(extraHeaders: HeadersInit = {}): HeadersInit {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

function getAuthHeaders(extraHeaders: HeadersInit = {}): HeadersInit {
  const token = getToken();

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

function getFilename(response: Response, fallback: string): string {
  const disposition = response.headers.get("Content-Disposition");
  const match = disposition?.match(/filename="?([^"]+)"?/i);
  return match?.[1] || fallback;
}

export function toQuery(params: QueryParams = {}): string {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export function normalizePaginated<TItem>(
  payload: PaginatedResponse<TItem> | TItem[] | null | undefined,
  fallbackLimit = 20,
): PaginatedResponse<TItem> {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      total: payload.length,
      page: 1,
      limit: fallbackLimit,
      totalPages: 1,
    };
  }

  return {
    items: payload?.items || [],
    total: payload?.total || 0,
    page: payload?.page || 1,
    limit: payload?.limit || fallbackLimit,
    totalPages: payload?.totalPages || 1,
  };
}

export async function requestJson<TData = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<TData> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: getHeaders(options.headers),
  });

  const payload = (await response.json().catch(() => null)) as
    | ApiEnvelope<TData>
    | TData
    | null;

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(payload, "Não foi possível concluir a requisição."),
    );
  }

  return (isRecord(payload) && "data" in payload ? payload.data : payload) as TData;
}

export async function requestFormData<TData = unknown>(
  path: string,
  formData: FormData,
  options: RequestInit = {},
): Promise<TData> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method: options.method || "POST",
    body: formData,
    headers: getAuthHeaders(options.headers),
  });

  const payload = (await response.json().catch(() => null)) as
    | ApiEnvelope<TData>
    | TData
    | null;

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(payload, "Não foi possível concluir a requisição."),
    );
  }

  return (isRecord(payload) && "data" in payload ? payload.data : payload) as TData;
}

export async function downloadFile(
  path: string,
  fallbackFilename: string,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(
      getApiErrorMessage(payload, "Não foi possível exportar o arquivo."),
    );
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = getFilename(response, fallbackFilename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
