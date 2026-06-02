const API_BASE_URL = import.meta.env.VITE_API_URL || "";
const TOKEN_KEY = "gestao_agro_token";
const USER_KEY = "gestao_agro_user";

export function getToken() {
  return (
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken")
  );
}

export function getStoredUser() {
  const stored = localStorage.getItem(USER_KEY);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function setAuthSession(token, usuario) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem("token", token);
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

export function updateStoredUser(usuario) {
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("accessToken");
}

function getHeaders(extraHeaders = {}) {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

function getAuthHeaders(extraHeaders = {}) {
  const token = getToken();

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

function getFilename(response, fallback) {
  const disposition = response.headers.get("Content-Disposition");
  const match = disposition?.match(/filename="?([^"]+)"?/i);
  return match?.[1] || fallback;
}

export function toQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

function getIssueMessage(issue) {
  if (!issue) {
    return null;
  }

  const field = issue.field || issue.path;
  const message = issue.message || issue;

  return field ? `${field}: ${message}` : String(message);
}

function getErrorMessage(payload, fallback) {
  if (!payload) {
    return fallback;
  }

  if (Array.isArray(payload.errors) && payload.errors.length) {
    return payload.errors.map(getIssueMessage).filter(Boolean).join("; ");
  }

  if (Array.isArray(payload.message)) {
    return payload.message.join("; ");
  }

  if (payload.message && typeof payload.message === "object") {
    return getErrorMessage(payload.message, fallback);
  }

  if (typeof payload.message === "string") {
    return payload.message;
  }

  if (typeof payload.error === "string") {
    return payload.error;
  }

  return fallback;
}

export async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: getHeaders(options.headers),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(payload, "Nao foi possivel concluir a requisicao."),
    );
  }

  return payload?.data ?? payload;
}

export async function requestFormData(path, formData, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method: options.method || "POST",
    body: formData,
    headers: getAuthHeaders(options.headers),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(payload, "Nao foi possivel concluir a requisicao."),
    );
  }

  return payload?.data ?? payload;
}

export async function downloadFile(path, fallbackFilename) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || "Nao foi possivel exportar o arquivo.");
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
