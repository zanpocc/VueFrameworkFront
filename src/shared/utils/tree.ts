/**
 * Generic tree builder. Converts a flat list of items with parent-key
 * references into a nested tree structure.
 *
 * Each result node is a shallow spread of the original item plus a `children`
 * array. Items whose parent is not found in the list become root nodes.
 *
 * @example
 * ```ts
 * // Dept tree (idKey='id', parentIdKey='parentId')
 * const tree = buildTree(depts, { idKey: 'id', parentKey: 'parentId' })
 *
 * // Menu tree with custom sort
 * const menuTree = buildTree(menus, {
 *   idKey: 'id',
 *   parentKey: 'parentId',
 *   sortKey: 'sortOrder',
 * })
 * ```
 */
export interface BuildTreeOptions {
  /** Property name that holds the item's unique identifier. Default: 'id' */
  idKey?: string;
  /** Property name that holds the parent's identifier. Default: 'parentId' */
  parentKey?: string;
  /** Property name used for sorting children. If omitted, insertion order is kept. */
  sortKey?: string;
  /** Sort direction for sortKey. Default: 'asc' */
  sortOrder?: 'asc' | 'desc';
}

export type TreeNode<T> = T & { children: TreeNode<T>[] };

export function buildTree<T extends object>(
  items: T[],
  options: BuildTreeOptions = {},
): TreeNode<T>[] {
  const { idKey = 'id', parentKey = 'parentId', sortKey, sortOrder = 'asc' } = options;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeMap = new Map<unknown, TreeNode<any>>();
  const roots: TreeNode<T>[] = [];

  // First pass: create all nodes with empty children arrays.
  for (const item of items) {
    const id = (item as Record<string, unknown>)[idKey];
    nodeMap.set(id, { ...item, children: [] });
  }

  // Second pass: attach children to their parents; orphan nodes become roots.
  for (const node of nodeMap.values()) {
    const pid = (node as Record<string, unknown>)[parentKey];
    const parent = pid != null ? nodeMap.get(pid) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Optional sort.
  if (sortKey) {
    const dir = sortOrder === 'asc' ? 1 : -1;
    const sortNodes = (nodes: TreeNode<T>[]) => {
      nodes.sort((a, b) => {
        const va = (a as Record<string, unknown>)[sortKey];
        const vb = (b as Record<string, unknown>)[sortKey];
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va ?? '').localeCompare(String(vb ?? '')) * dir;
      });
      nodes.forEach((n) => sortNodes(n.children));
    };
    sortNodes(roots);
  }

  return roots;
}
