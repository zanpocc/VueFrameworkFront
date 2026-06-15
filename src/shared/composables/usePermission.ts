import { useAuthStore } from '@/stores/auth';

/**
 * Composable for checking permissions in templates or script.
 *
 * Decouples permission logic from directly importing the auth store,
 * and supports future enhancements (caching, server-driven changes)
 * without touching every page.
 */
export function usePermission() {
  const authStore = useAuthStore();

  function hasPermission(code: string | string[]): boolean {
    if (Array.isArray(code)) {
      return code.every((c) => authStore.hasPermission(c));
    }
    return authStore.hasPermission(code);
  }

  return { hasPermission };
}
