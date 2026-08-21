// When the Vite app is opened from a phone/other LAN device, env URLs that
// still say localhost would hit that device instead of this machine.
export function lanAwareUrl(url) {
  if (!url || typeof window === "undefined") {
    return url;
  }

  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return url;
  }

  return String(url).replace(/\b(localhost|127\.0\.0\.1)\b/g, host);
}

export const BACKEND_API_URL = lanAwareUrl(
  import.meta.env.VITE_APP_BACKEND_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:8080/api"
);

export const SOCKET_URL = lanAwareUrl(
  import.meta.env.VITE_APP_SOCKET_URL ||
    import.meta.env.VITE_SOCKET_URL ||
    "http://localhost:8080"
);
