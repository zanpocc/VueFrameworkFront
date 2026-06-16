import { setActivePinia, createPinia } from 'pinia';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { authApi } from '@/api/auth';
import { router } from '@/router';
import { useAuthStore } from '@/stores/auth';

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

async function navigate(target: string) {
  try {
    await router.push(target);
  } catch {
    // vue-router throws on guard cancellation/redirect in some setups; swallow to inspect final state.
  }
  await router.isReady();
}

describe('router beforeEach guard', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    vi.clearAllMocks();
    setActivePinia(createPinia());
    await router.push('/login');
    await router.isReady();
  });

  it('allows access to public routes without authentication', async () => {
    await navigate('/login');
    expect(router.currentRoute.value.name).toBe('login');

    await navigate('/403');
    expect(router.currentRoute.value.name).toBe('forbidden');
  });

  it('redirects unauthenticated requests to /login carrying the redirect query', async () => {
    await navigate('/');

    expect(router.currentRoute.value.name).toBe('login');
    expect(router.currentRoute.value.query.redirect).toBe('/');
  });

  it('bootstraps session and resumes original destination when authenticated but un-bootstrapped', async () => {
    const store = useAuthStore();
    store.token = 'token-1';
    store.refreshToken = 'refresh-1';
    store.permissions = ['dashboard:view'];
    store.bootstrapped = false;

    mockedAuthApi.me.mockResolvedValue({
      id: 1,
      username: 'admin',
      nickname: '管理员',
      email: null,
    });
    mockedAuthApi.menus.mockResolvedValue([]);
    mockedAuthApi.permissions.mockResolvedValue(['dashboard:view']);

    await navigate('/');

    expect(mockedAuthApi.me).toHaveBeenCalled();
    expect(mockedAuthApi.menus).toHaveBeenCalled();
    expect(mockedAuthApi.permissions).toHaveBeenCalled();
    expect(store.bootstrapped).toBe(true);
    expect(router.currentRoute.value.path).toBe('/');
    expect(router.currentRoute.value.name).toBe('dashboard');
  });

  it('navigates successfully when authenticated, bootstrapped, and permitted', async () => {
    const store = useAuthStore();
    store.token = 'token-1';
    store.refreshToken = 'refresh-1';
    store.user = { id: 1, username: 'admin', nickname: '管理员', email: null };
    store.permissions = ['dashboard:view'];
    store.menus = [];
    store.bootstrapped = true;

    await navigate('/');

    expect(router.currentRoute.value.name).toBe('dashboard');
    expect(mockedAuthApi.me).not.toHaveBeenCalled();
  });

  it('redirects to /forbidden when required permissions are missing', async () => {
    const store = useAuthStore();
    store.token = 'token-1';
    store.refreshToken = 'refresh-1';
    store.user = { id: 1, username: 'admin', nickname: '管理员', email: null };
    store.permissions = [];
    store.menus = [];
    store.bootstrapped = true;

    await navigate('/');

    expect(router.currentRoute.value.name).toBe('forbidden');
  });
});
