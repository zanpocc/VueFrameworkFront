import { computed, type ComputedRef } from 'vue';
import { iamApi, type SysPost } from '@/api/iam';

/**
 * Composable for loading and caching post data.
 *
 * Mirrors {@link useRoleSelect}: module-level cache so multiple components
 * sharing post data do not re-fetch.
 */

let _postCache: SysPost[] | null = null;
let _postPromise: Promise<SysPost[]> | null = null;

export interface UsePostSelectReturn {
  /** Load all posts. Cached after first load. */
  loadPosts: () => Promise<SysPost[]>;
  /** Get cached post list as computed. Returns empty array if not yet loaded. */
  getPostList: () => ComputedRef<SysPost[]>;
  /** Resolve a post id to its name. Returns the id string if not found. */
  getPostName: (id: number) => string;
}

export function usePostSelect(): UsePostSelectReturn {
  async function loadPosts(): Promise<SysPost[]> {
    if (_postCache) return _postCache;

    if (_postPromise) return _postPromise;

    const promise = iamApi.posts().then((posts) => {
      _postCache = posts;
      _postPromise = null;
      return posts;
    });
    _postPromise = promise;
    return promise;
  }

  function getPostList(): ComputedRef<SysPost[]> {
    return computed(() => _postCache ?? []);
  }

  function getPostName(id: number): string {
    if (!_postCache) return String(id);
    const post = _postCache.find((p) => p.id === id);
    return post?.postName ?? String(id);
  }

  return { loadPosts, getPostList, getPostName };
}

/**
 * Reset module-level cache (for testing only).
 */
export function resetPostCache(): void {
  _postCache = null;
  _postPromise = null;
}
