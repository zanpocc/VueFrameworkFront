import { setActivePinia, createPinia } from 'pinia';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { MenuTreeNode } from '@/api/auth';
import { router } from '@/router';
import { useAuthStore } from '@/stores/auth';
import PlaceholderView from '@/modules/system/views/PlaceholderView.vue';
import UserListView from '@/modules/iam/views/UserListView.vue';
import ConfigListView from '@/modules/system/views/ConfigListView.vue';

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

function makeMenu(overrides: Partial<MenuTreeNode>): MenuTreeNode {
  return {
    id: 0,
    parentId: null,
    title: '',
    routeName: '',
    routePath: '',
    component: null,
    icon: null,
    permissionCode: null,
    visible: true,
    children: [],
    ...overrides,
  };
}

async function bootstrapWithMenus(menus: MenuTreeNode[], permissions: string[] = []) {
  const store = useAuthStore();
  store.token = 'token-menu';
  store.refreshToken = 'refresh-menu';
  store.user = { id: 1, username: 'admin', nickname: '管理员', email: null };
  store.menus = menus;
  store.permissions = permissions;
  store.bootstrapped = true;
  return store;
}

async function safePush(target: string) {
  try {
    await router.push(target);
  } catch {
    // ignore guard rejections; assertions inspect router state directly.
  }
  await router.isReady();
}

describe('dynamic menu route registration', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    vi.clearAllMocks();
    setActivePinia(createPinia());
    await router.push('/login');
    await router.isReady();
  });

  it('resolves a child menu route to the expected component', async () => {
    const menus: MenuTreeNode[] = [
      makeMenu({
        id: 10,
        title: '系统管理',
        routeName: 'sys-parent-a',
        routePath: '/sys-parent-a',
        permissionCode: 'system:view',
        children: [
          makeMenu({
            id: 11,
            parentId: 10,
            title: '用户管理',
            routeName: 'sys-user-child-a',
            routePath: '/sys-parent-a/users',
            component: 'iam/UserListView',
            permissionCode: 'system:user:view',
          }),
        ],
      }),
    ];
    await bootstrapWithMenus(menus, ['system:view', 'system:user:view']);

    await safePush('/sys-parent-a/users');

    expect(router.hasRoute('sys-user-child-a')).toBe(true);
    const resolved = router.resolve('/sys-parent-a/users');
    expect(resolved.matched.length).toBeGreaterThan(0);
    const matched = resolved.matched[resolved.matched.length - 1];
    expect(matched.components?.default).toBe(UserListView);
  });

  it('falls back to PlaceholderView when the menu has no component', async () => {
    const menus: MenuTreeNode[] = [
      makeMenu({
        id: 20,
        title: '占位菜单',
        routeName: 'placeholder-route-b',
        routePath: '/placeholder-route-b',
        component: null,
        permissionCode: null,
      }),
    ];
    await bootstrapWithMenus(menus, []);

    await safePush('/placeholder-route-b');

    expect(router.hasRoute('placeholder-route-b')).toBe(true);
    const resolved = router.resolve('/placeholder-route-b');
    const matched = resolved.matched[resolved.matched.length - 1];
    expect(matched.components?.default).toBe(PlaceholderView);
  });

  it('does not register a route twice when the same menu is processed again', async () => {
    const menus: MenuTreeNode[] = [
      makeMenu({
        id: 30,
        title: '配置管理',
        routeName: 'config-once-c',
        routePath: '/config-once-c',
        component: 'system/ConfigListView',
        permissionCode: 'system:config:view',
      }),
    ];
    const store = await bootstrapWithMenus(menus, ['system:config:view']);

    await safePush('/config-once-c');
    expect(router.hasRoute('config-once-c')).toBe(true);

    const addRouteSpy = vi.spyOn(router, 'addRoute');

    // re-trigger the guard with the same menus; registerMenuRoutes should detect
    // the existing route and skip addRoute.
    await safePush('/login');
    await safePush('/config-once-c');

    const reAddedForRoute = addRouteSpy.mock.calls.some((call) => {
      const last = call[call.length - 1] as { name?: string } | undefined;
      return last?.name === 'config-once-c';
    });
    expect(reAddedForRoute).toBe(false);
    expect(router.hasRoute('config-once-c')).toBe(true);

    addRouteSpy.mockRestore();
    void store;
  });

  it('propagates permissionCode into the registered route meta.permissions', async () => {
    const menus: MenuTreeNode[] = [
      makeMenu({
        id: 40,
        title: '权限菜单',
        routeName: 'permcode-route-d',
        routePath: '/permcode-route-d',
        component: 'system/ConfigListView',
        permissionCode: 'system:config:view',
      }),
    ];
    await bootstrapWithMenus(menus, ['system:config:view']);

    await safePush('/permcode-route-d');

    expect(router.hasRoute('permcode-route-d')).toBe(true);
    const resolved = router.resolve('/permcode-route-d');
    const matched = resolved.matched[resolved.matched.length - 1];
    expect(matched.meta.permissions).toEqual(['system:config:view']);
    expect(matched.components?.default).toBe(ConfigListView);
  });
});
