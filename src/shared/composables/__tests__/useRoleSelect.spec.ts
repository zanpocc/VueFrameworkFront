import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRoleSelect, resetRoleCache } from '../useRoleSelect';

vi.mock('@/api/iam', () => ({
  iamApi: {
    roles: vi.fn().mockResolvedValue([
      { id: 1, roleCode: 'SUPER_ADMIN', roleName: '超级管理员', sortOrder: 1, status: 'ENABLED' },
      { id: 2, roleCode: 'VIEWER', roleName: '只读用户', sortOrder: 2, status: 'ENABLED' },
    ]),
  },
}));

describe('useRoleSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRoleCache();
  });

  it('loadRoles fetches and caches role data', async () => {
    const { loadRoles } = useRoleSelect();
    const roles = await loadRoles();
    expect(roles).toHaveLength(2);
    expect(roles[0].roleName).toBe('超级管理员');
  });

  it('loadRoles returns cached data on second call', async () => {
    const { loadRoles } = useRoleSelect();
    await loadRoles();
    await loadRoles();
    const { iamApi } = await import('@/api/iam');
    expect(iamApi.roles).toHaveBeenCalledTimes(1);
  });

  it('getRoleList returns cached list as computed', async () => {
    const { loadRoles, getRoleList } = useRoleSelect();
    expect(getRoleList().value).toEqual([]);
    await loadRoles();
    expect(getRoleList().value).toHaveLength(2);
  });

  it('getRoleName resolves id to role name', async () => {
    const { loadRoles, getRoleName } = useRoleSelect();
    await loadRoles();
    expect(getRoleName(1)).toBe('超级管理员');
    expect(getRoleName(2)).toBe('只读用户');
  });

  it('getRoleName returns id string when not found or not loaded', () => {
    const { getRoleName } = useRoleSelect();
    expect(getRoleName(999)).toBe('999');
  });
});
