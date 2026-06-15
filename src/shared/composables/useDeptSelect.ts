import { computed, type ComputedRef } from 'vue';
import { iamApi, type SysDept } from '@/api/iam';
import { buildTree, type TreeNode } from '@/shared/utils';

/**
 * Composable for loading and caching department data.
 *
 * Uses module-level cache so multiple components sharing department
 * data do not re-fetch.
 */

// Module-level mutable cache (reset between tests via resetDeptCache)
let _deptCache: SysDept[] | null = null;
let _deptPromise: Promise<SysDept[]> | null = null;

export interface UseDeptSelectReturn {
  /** Load all departments. Cached after first load. */
  loadDepts: () => Promise<SysDept[]>;
  /** Get cached department tree as computed. Returns empty array if not yet loaded. */
  getDeptTree: () => ComputedRef<TreeNode<SysDept>[]>;
  /** Resolve a department id to its name. Returns the id string if not found. */
  getDeptName: (id: number) => string;
}

export function useDeptSelect(): UseDeptSelectReturn {
  async function loadDepts(): Promise<SysDept[]> {
    if (_deptCache) return _deptCache;

    if (_deptPromise) return _deptPromise;

    const promise = iamApi.depts().then((depts) => {
      _deptCache = depts;
      _deptPromise = null;
      return depts;
    });
    _deptPromise = promise;
    return promise;
  }

  function getDeptTree(): ComputedRef<TreeNode<SysDept>[]> {
    return computed(() =>
      _deptCache
        ? buildTree(_deptCache, { idKey: 'id', parentKey: 'parentId', sortKey: 'sortOrder' })
        : [],
    );
  }

  function getDeptName(id: number): string {
    if (!_deptCache) return String(id);
    const dept = _deptCache.find((d) => d.id === id);
    return dept?.deptName ?? String(id);
  }

  return { loadDepts, getDeptTree, getDeptName };
}

/**
 * Reset module-level cache (for testing only).
 */
export function resetDeptCache(): void {
  _deptCache = null;
  _deptPromise = null;
}
