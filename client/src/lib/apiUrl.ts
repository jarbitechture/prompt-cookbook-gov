/**
 * Prepends the Vite base URL to an API path, avoiding double slashes.
 * Use for every API call from the client so subpath deployments (e.g. /cookbook/)
 * resolve correctly.
 */
export function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
