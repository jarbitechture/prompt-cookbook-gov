/**
 * Prepends the Vite base URL to an API path, avoiding double slashes.
 *
 * TODO(task-18): Migrate existing fetch("/api/...") callers to use this helper.
 *   Current callers in TryItSection, ChatbotWidget, Builder, Game still use
 *   bare paths and will break under subpath deploy until migrated.
 */
export function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
