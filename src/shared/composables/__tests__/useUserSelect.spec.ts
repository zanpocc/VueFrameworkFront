import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUserSelect, resetUserCache } from '../useUserSelect';

vi.mock('@/api/iam', () => ({
  iamApi: {
    users: vi.fn().mockImplementation((keyword = '') => {
      const all = [
        {
          id: 1,
          deptId: 1,
          username: 'admin',
          nickname: '管理员',
          email: null,
          mobile: null,
          status: 'ENABLED',
          roleIds: [1],
        },
        {
          id: 2,
          deptId: 1,
          username: 'zhangsan',
          nickname: '张三',
          email: null,
          mobile: null,
          status: 'ENABLED',
          roleIds: [],
        },
      ];
      if (!keyword) return Promise.resolve(all);
      return Promise.resolve(
        all.filter((u) => u.username.includes(keyword) || u.nickname.includes(keyword)),
      );
    }),
  },
}));

describe('useUserSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetUserCache();
  });

  it('loadUsers fetches and caches user data', async () => {
    const { loadUsers } = useUserSelect();
    const users = await loadUsers();
    expect(users).toHaveLength(2);
    expect(users[0].nickname).toBe('管理员');
  });

  it('loadUsers returns cached data on second call', async () => {
    const { loadUsers } = useUserSelect();
    await loadUsers();
    await loadUsers();
    // First call: loadUsers, second call: cache hit (no API call)
    const { iamApi } = await import('@/api/iam');
    expect(iamApi.users).toHaveBeenCalledTimes(1);
  });

  it('searchUsers calls API with keyword (not cached)', async () => {
    const { searchUsers } = useUserSelect();
    const results = await searchUsers('admin');
    expect(results).toHaveLength(1);
    expect(results[0].username).toBe('admin');
  });

  it('getUserList returns cached list as computed', async () => {
    const { loadUsers, getUserList } = useUserSelect();
    expect(getUserList().value).toEqual([]);
    await loadUsers();
    expect(getUserList().value).toHaveLength(2);
  });

  it('getUserName resolves id to nickname', async () => {
    const { loadUsers, getUserName } = useUserSelect();
    await loadUsers();
    expect(getUserName(1)).toBe('管理员');
    expect(getUserName(2)).toBe('张三');
  });

  it('getUserName returns id string when not found or not loaded', () => {
    const { getUserName } = useUserSelect();
    expect(getUserName(999)).toBe('999');
  });
});
