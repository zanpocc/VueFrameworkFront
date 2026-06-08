import { setActivePinia, createPinia } from 'pinia';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { useAuthStore } from '@/stores/auth';
import { authApi } from '@/api/auth';

vi.mock('@/api/auth', () => ({
  authApi: {
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
    menus: vi.fn(),
    permissions: vi.fn(),
  },
}));

const mockedAuthApi = vi.mocked(authApi);

describe('auth store permissions', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
    setActivePinia(createPinia());
  });

  it('checks whether a permission is granted', () => {
    const store = useAuthStore();
    store.permissions = ['dashboard:view'];

    expect(store.hasPermission('dashboard:view')).toBe(true);
    expect(store.hasPermission('system:user:create')).toBe(false);
  });

  it('persists token after login and loads current session data', async () => {
    mockedAuthApi.login.mockResolvedValue({
      accessToken: 'token-1',
      refreshToken: 'refresh-1',
      tokenType: 'Bearer',
      expiresIn: 7200,
      user: {
        id: 1,
        username: 'admin',
        nickname: '管理员',
        email: null,
      },
      permissions: ['dashboard:view'],
    });
    mockedAuthApi.me.mockResolvedValue({
      id: 1,
      username: 'admin',
      nickname: '管理员',
      email: null,
    });
    mockedAuthApi.menus.mockResolvedValue([
      {
        id: 1,
        parentId: null,
        title: '工作台',
        routeName: 'dashboard',
        routePath: '/',
        component: 'DashboardView',
        icon: 'Monitor',
        permissionCode: 'dashboard:view',
        visible: true,
        children: [],
      },
    ]);
    mockedAuthApi.permissions.mockResolvedValue(['dashboard:view', 'system:user:create']);

    const store = useAuthStore();
    await store.login({ username: 'admin', password: 'admin123' });

    expect(store.token).toBe('token-1');
    expect(store.refreshToken).toBe('refresh-1');
    expect(store.displayName).toBe('管理员');
    expect(store.menus).toHaveLength(1);
    expect(store.hasPermission('system:user:create')).toBe(true);
    expect(window.localStorage.getItem('quickframework.accessToken')).toBe('token-1');
    expect(window.localStorage.getItem('quickframework.refreshToken')).toBe('refresh-1');
  });

  it('clears session on logout', async () => {
    mockedAuthApi.logout.mockResolvedValue({ invalidated: true });
    const store = useAuthStore();
    store.setSession(
      'token-1',
      'refresh-1',
      {
        id: 1,
        username: 'admin',
        nickname: '管理员',
        email: null,
      },
      ['dashboard:view'],
    );

    await store.logout();

    expect(store.isAuthenticated).toBe(false);
    expect(mockedAuthApi.logout).toHaveBeenCalledOnce();
    expect(store.permissions).toEqual([]);
    expect(window.localStorage.getItem('quickframework.accessToken')).toBeNull();
    expect(window.localStorage.getItem('quickframework.refreshToken')).toBeNull();
  });

  it('refreshes session with refresh token', async () => {
    mockedAuthApi.refresh.mockResolvedValue({
      accessToken: 'token-2',
      refreshToken: 'refresh-2',
      tokenType: 'Bearer',
      expiresIn: 7200,
      user: {
        id: 1,
        username: 'admin',
        nickname: '管理员',
        email: null,
      },
      permissions: ['dashboard:view'],
    });
    mockedAuthApi.me.mockResolvedValue({
      id: 1,
      username: 'admin',
      nickname: '管理员',
      email: null,
    });
    mockedAuthApi.menus.mockResolvedValue([]);
    mockedAuthApi.permissions.mockResolvedValue(['dashboard:view']);

    const store = useAuthStore();
    store.refreshToken = 'refresh-1';
    const refreshed = await store.refreshSession();

    expect(refreshed).toBe(true);
    expect(mockedAuthApi.refresh).toHaveBeenCalledWith({ refreshToken: 'refresh-1' });
    expect(store.token).toBe('token-2');
    expect(window.localStorage.getItem('quickframework.refreshToken')).toBe('refresh-2');
  });
});
