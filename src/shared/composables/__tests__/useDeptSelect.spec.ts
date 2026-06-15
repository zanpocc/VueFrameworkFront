import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDeptSelect, resetDeptCache } from '../useDeptSelect';

vi.mock('@/api/iam', () => ({
  iamApi: {
    depts: vi.fn().mockResolvedValue([
      { id: 1, parentId: 0, deptName: '总部', sortOrder: 1, status: 'ENABLED' },
      { id: 2, parentId: 1, deptName: '技术部', sortOrder: 1, status: 'ENABLED' },
      { id: 3, parentId: 1, deptName: '市场部', sortOrder: 2, status: 'ENABLED' },
    ]),
  },
}));

describe('useDeptSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetDeptCache();
  });

  it('loadDepts fetches and caches department data', async () => {
    const { loadDepts } = useDeptSelect();
    const depts = await loadDepts();
    expect(depts).toHaveLength(3);
    expect(depts[0].deptName).toBe('总部');
  });

  it('loadDepts returns cached data on second call', async () => {
    const { loadDepts } = useDeptSelect();
    await loadDepts();
    await loadDepts();
    // iamApi.depts should only be called once due to caching
    const { iamApi } = await import('@/api/iam');
    expect(iamApi.depts).toHaveBeenCalledTimes(1);
  });

  it('getDeptTree returns tree structure', async () => {
    const { loadDepts, getDeptTree } = useDeptSelect();
    await loadDepts();
    const tree = getDeptTree().value;
    expect(tree).toHaveLength(1); // One root: 总部
    expect(tree[0].deptName).toBe('总部');
    expect(tree[0].children).toHaveLength(2); // 技术部 + 市场部
  });

  it('getDeptTree returns empty array when not loaded', () => {
    const { getDeptTree } = useDeptSelect();
    expect(getDeptTree().value).toEqual([]);
  });

  it('getDeptName resolves id to department name', async () => {
    const { loadDepts, getDeptName } = useDeptSelect();
    await loadDepts();
    expect(getDeptName(1)).toBe('总部');
    expect(getDeptName(2)).toBe('技术部');
  });

  it('getDeptName returns id string when not found or not loaded', () => {
    const { getDeptName } = useDeptSelect();
    expect(getDeptName(999)).toBe('999');
  });
});
