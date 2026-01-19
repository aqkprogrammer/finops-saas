/**
 * API base URL for the FinOpsGuard backend.
 * - Set VITE_API_URL in production (e.g. on Vercel) to your Railway API URL.
 * - Local dev: defaults to http://localhost:3000 when VITE_API_URL is unset.
 *
 * Vercel: Project → Settings → Environment Variables → add:
 *   VITE_API_URL = https://finopsguardapi-production.up.railway.app
 */
const base = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
export const API_BASE = base;

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p}`;
}
