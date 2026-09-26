/**
 * Utility to get the platform base portal URL.
 * Prioritizes environment variables (VITE_PUBLIC_URL / VITE_APP_URL) if specified,
 * otherwise automatically uses the current browser origin (window.location.origin, which
 * resolves to the Ngrok tunnel, custom domain, or local host seamlessly).
 */
export function getPublicOrigin(): string {
  if (typeof window === 'undefined') return '';
  
  // 1. Check environment variables
  const envUrl = ((import.meta as any).env?.VITE_PUBLIC_URL || (import.meta as any).env?.VITE_APP_URL || '') as string;
  if (envUrl && (envUrl.startsWith('http://') || envUrl.startsWith('https://'))) {
    return envUrl.replace(/\/+$/, '');
  }

  // 2. Default to active browser location origin (e.g. https://xxx.ngrok-free.app or http://localhost:5173)
  return window.location.origin;
}
