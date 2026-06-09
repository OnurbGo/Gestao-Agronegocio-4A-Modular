import type { PaginatedResponse, QueryParams } from "@/shared/types";

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

function traduzirErro(message: unknown): string {
  if (typeof message !== "string") {
    return String(message);
  }

  if (/property \w+ should not exist/.test(message)) {
    return "Campo desconhecido enviado ao servidor";
  }
  if (/\w+ should not be empty/.test(message)) {
    return "Campo obrigatorio nao preenchido";
  }
  if (/\w+ must be a string/.test(message)) {
    return "Valor invalido: deve ser texto";
  }
  if (/\w+ must be an integer number/.test(message)) {
    return "Deve ser um numero inteiro";
  }
  if (/\w+ must be a number/.test(message)) {
    return "Deve ser um numero valido";
  }
  if (/\w+ must be a valid enum value/.test(message)) {
    return "Valor selecionado invalido";
  }
  if (/\w+ must be a boolean/.test(message)) {
    return "Valor deve ser verdadeiro ou falso";
  }

  return message;
}

function getIssueMessage(issue: unknown): string | null {
  if (!issue) {
    return null;
  }

  const field = isRecord(issue) ? issue.field || issue.path : undefined;
  const message = isRecord(issue) ? issue.message || issue : issue;

  return field ? `${field}: ${message}` : String(message);
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (!isRecord(payload)) {
    return fallback;
  }

  if (Array.isArray(payload.errors) && payload.errors.length) {
    return payload.errors.map(getIssueMessage).filter(Boolean).join("\n");
  }

  if (Array.isArray(payload.message)) {
    return [...new Set(payload.message.map(traduzirErro))]
      .filter(Boolean)
      .join("\n");
  }

  if (payload.message && typeof payload.message === "object") {
    return getErrorMessage(payload.message, fallback);
  }

  if (typeof payload.message === "string") {
    return traduzirErro(payload.message);
  }

  if (typeof payload.error === "string") {
    return payload.error;
  }

  return fallback;
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
      getErrorMessage(payload, "Nao foi possivel concluir a requisicao."),
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
      getErrorMessage(payload, "Nao foi possivel concluir a requisicao."),
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
      getErrorMessage(payload, "Nao foi possivel exportar o arquivo."),
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
