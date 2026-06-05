const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isLocalHost(hostname: string) {
  return LOCAL_HOSTS.has(hostname);
}

function normalizeLocalhostUrl(url: URL) {
  if (
    isLocalHost(url.hostname) &&
    typeof window !== "undefined" &&
    !isLocalHost(window.location.hostname)
  ) {
    url.hostname = window.location.hostname;
  }

  return url;
}

export function resolveEscritorioUrl(configuredUrl?: string) {
  const value = configuredUrl?.trim();

  if (value) {
    return normalizeLocalhostUrl(new URL(value, window.location.origin)).href;
  }

  if (window.location.port === "5173") {
    const url = new URL(window.location.href);
    url.port = "5174";
    url.pathname = "/";
    url.search = "";
    url.hash = "";
    return url.href;
  }

  return "/escritorio/";
}
