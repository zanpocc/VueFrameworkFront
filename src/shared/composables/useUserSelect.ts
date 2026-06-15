import { computed, type ComputedRef } from 'vue';
import { iamApi, type SysUser } from '@/api/iam';

/**
 * Composable for loading and caching user data.
 *
 * - Full user list is cached at module level.
 * - Keyword search is NOT cached (real-time remote search).
 */

let _userCache: SysUser[] | null = null;
let _userPromise: Promise<SysUser[]> | null = null;

export interface UseUserSelectReturn {
  /** Load all users. Cached after first load. */
  loadUsers: () => Promise<SysUser[]>;
  /** Search users by keyword (not cached — calls API each time). */
  searchUsers: (keyword: string) => Promise<SysUser[]>;
  /** Get cached user list as computed. Returns empty array if not yet loaded. */
  getUserList: () => ComputedRef<SysUser[]>;
  /** Resolve a user id to its display name (nickname). Returns the id string if not found. */
  getUserName: (id: number) => string;
}

export function useUserSelect(): UseUserSelectReturn {
  async function loadUsers(): Promise<SysUser[]> {
    if (_userCache) return _userCache;

    if (_userPromise) return _userPromise;

    const promise = iamApi.users().then((users) => {
      _userCache = users;
      _userPromise = null;
      return users;
    });
    _userPromise = promise;
    return promise;
  }

  async function searchUsers(keyword: string): Promise<SysUser[]> {
    return iamApi.users(keyword);
  }

  function getUserList(): ComputedRef<SysUser[]> {
    return computed(() => _userCache ?? []);
  }

  function getUserName(id: number): string {
    if (!_userCache) return String(id);
    const user = _userCache.find((u) => u.id === id);
    return user?.nickname ?? String(id);
  }

  return { loadUsers, searchUsers, getUserList, getUserName };
}

/**
 * Reset module-level cache (for testing only).
 */
export function resetUserCache(): void {
  _userCache = null;
  _userPromise = null;
}
