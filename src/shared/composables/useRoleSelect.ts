import { computed, type ComputedRef } from 'vue';
import { iamApi, type SysRole } from '@/api/iam';

/**
 * Composable for loading and caching role data.
 *
 * Uses module-level cache so multiple components sharing role
 * data do not re-fetch.
 */

let _roleCache: SysRole[] | null = null;
let _rolePromise: Promise<SysRole[]> | null = null;

export interface UseRoleSelectReturn {
  /** Load all roles. Cached after first load. */
  loadRoles: () => Promise<SysRole[]>;
  /** Get cached role list as computed. Returns empty array if not yet loaded. */
  getRoleList: () => ComputedRef<SysRole[]>;
  /** Resolve a role id to its name. Returns the id string if not found. */
  getRoleName: (id: number) => string;
}

export function useRoleSelect(): UseRoleSelectReturn {
  async function loadRoles(): Promise<SysRole[]> {
    if (_roleCache) return _roleCache;

    if (_rolePromise) return _rolePromise;

    const promise = iamApi.roles().then((roles) => {
      _roleCache = roles;
      _rolePromise = null;
      return roles;
    });
    _rolePromise = promise;
    return promise;
  }

  function getRoleList(): ComputedRef<SysRole[]> {
    return computed(() => _roleCache ?? []);
  }

  function getRoleName(id: number): string {
    if (!_roleCache) return String(id);
    const role = _roleCache.find((r) => r.id === id);
    return role?.roleName ?? String(id);
  }

  return { loadRoles, getRoleList, getRoleName };
}

/**
 * Reset module-level cache (for testing only).
 */
export function resetRoleCache(): void {
  _roleCache = null;
  _rolePromise = null;
}
