import { expect, test } from '@playwright/test';

/**
 * E2E coverage for the two auth flows most likely to break silently:
 *   1. Login failure surfaces a visible error and keeps the user on /login
 *      (no token written, no redirect away from /login).
 *   2. Session restore: a page reload while access/refresh tokens exist in
 *      localStorage rehydrates the session and lands the user on the work-
 *      bench without re-prompting credentials.
 *
 * Both flows use route mocking so the test does not depend on a live
 * backend — mirrors the pattern in app.spec.ts.
 */

const apiResult = <T>(data: T) => ({
  success: true,
  code: 'OK',
  message: 'success',
  data,
  timestamp: new Date().toISOString(),
});

const apiError = (code: string, message: string) => ({
  success: false,
  code,
  message,
  data: null,
  timestamp: new Date().toISOString(),
});

const ADMIN_PERMISSIONS = ['dashboard:view', 'system:user:view'];

const ADMIN_MENU = [
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
];

const USER_MANAGEMENT_MENU = [
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
  {
    id: 2,
    parentId: 0,
    title: '系统管理',
    routeName: 'system',
    routePath: '/system',
    component: 'Layout',
    icon: 'Setting',
    permissionCode: 'system:view',
    visible: true,
    children: [
      {
        id: 3,
        parentId: 2,
        title: '用户管理',
        routeName: 'system-user',
        routePath: '/system/users',
        component: 'iam/UserListView',
        icon: 'User',
        permissionCode: 'system:user:view',
        visible: true,
        children: [],
      },
    ],
  },
];

const ADMIN_USER = {
  id: 1,
  username: 'admin',
  nickname: '管理员',
  email: null,
};

test.beforeEach(async ({ page }) => {
  // DashboardView loads these platform widgets after auth. Keep auth tests
  // independent from a live backend so an unmocked 401 cannot clear tokens.
  await page.route('**/api/tasks**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(apiResult([])),
    });
  });
  await page.route('**/api/system/configs**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(apiResult([])),
    });
  });
  await page.route('**/api/system/notices**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(apiResult([])),
    });
  });
  await page.route('**/api/iam/menus**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(apiResult([])),
    });
  });
});

test.describe('login failure', () => {
  test('shows error message and stays on /login when credentials are wrong', async ({ page }) => {
    // Returning a 401 with the platform's standard error envelope simulates
    // a real BAD_CREDENTIALS response from platform-auth.
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify(apiError('BAD_CREDENTIALS', '账号或密码错误')),
      });
    });

    await page.goto('/login');
    await page.getByRole('textbox', { name: '账号' }).fill('admin');
    await page.getByLabel('密码').fill('wrong-password');
    await page.getByRole('button', { name: '登录' }).click();

    // The Element Plus el-alert renders the error title; the LoginView
    // surfaces the API message verbatim.
    await expect(page.getByText('账号或密码错误')).toBeVisible();

    // We must still be on /login — no token persisted, no router push.
    await expect(page).toHaveURL(/\/login(\?.*)?$/);
    const accessToken = await page.evaluate(() =>
      window.localStorage.getItem('quickframework.accessToken'),
    );
    expect(accessToken).toBeNull();
  });
});

test.describe('session restore', () => {
  test('reload with stored tokens rehydrates session without re-login', async ({ page }) => {
    // Common stubs that the rehydrated session will hit on reload.
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(apiResult(ADMIN_USER)),
      });
    });
    await page.route('**/api/auth/permissions', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(apiResult(ADMIN_PERMISSIONS)),
      });
    });
    await page.route('**/api/auth/menus', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(apiResult(ADMIN_MENU)),
      });
    });

    // Pre-seed localStorage as if the user had logged in in a previous tab.
    // Visit a same-origin page first so localStorage exists; then write
    // the tokens and reload to trigger the router guard's loadSession.
    await page.goto('/login');
    await page.evaluate(() => {
      window.localStorage.setItem('quickframework.accessToken', 'persisted-token');
      window.localStorage.setItem('quickframework.refreshToken', 'persisted-refresh-token');
    });

    await page.goto('/');

    // The dashboard heading is the unambiguous signal that the session
    // bootstrapped end-to-end (token → user → permissions → menu → routing).
    await expect(page.getByRole('heading', { name: '工作台' })).toBeVisible();
    await expect(page.getByText('管理员')).toBeVisible();

    // Tokens must still be there — session restore should not wipe them.
    const accessToken = await page.evaluate(() =>
      window.localStorage.getItem('quickframework.accessToken'),
    );
    expect(accessToken).toBe('persisted-token');
  });

  test('reload with an invalid token bounces user back to /login', async ({ page }) => {
    // /auth/me returning 401 simulates a stale token after a server-side
    // logout or signing-key rotation. The guard should clear state and
    // redirect to /login.
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify(apiError('UNAUTHENTICATED', '会话已过期')),
      });
    });
    await page.route('**/api/auth/permissions', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify(apiError('UNAUTHENTICATED', '会话已过期')),
      });
    });
    await page.route('**/api/auth/menus', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify(apiError('UNAUTHENTICATED', '会话已过期')),
      });
    });

    await page.goto('/login');
    await page.evaluate(() => {
      window.localStorage.setItem('quickframework.accessToken', 'stale-token');
    });

    await page.goto('/');

    // Land back on /login. The redirect query may or may not be present;
    // only the path matters for this contract.
    await expect(page).toHaveURL(/\/login(\?.*)?$/);
  });
});

test.describe('permission changes', () => {
  test('new permissions take effect after re-login', async ({ page }) => {
    let userPermissionGranted = false;

    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(
          apiResult({
            accessToken: userPermissionGranted
              ? 'token-with-user-permission'
              : 'token-without-user-permission',
            refreshToken: 'refresh-token',
            tokenType: 'Bearer',
            expiresIn: 7200,
            user: ADMIN_USER,
            permissions: userPermissionGranted
              ? ['dashboard:view', 'system:view', 'system:user:view', 'system:user:create']
              : ['dashboard:view', 'system:view'],
          }),
        ),
      });
    });
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(apiResult(ADMIN_USER)),
      });
    });
    await page.route('**/api/auth/permissions', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(
          apiResult(
            userPermissionGranted
              ? ['dashboard:view', 'system:view', 'system:user:view', 'system:user:create']
              : ['dashboard:view', 'system:view'],
          ),
        ),
      });
    });
    await page.route('**/api/auth/menus', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(apiResult(USER_MANAGEMENT_MENU)),
      });
    });
    await page.route('**/api/iam/users**', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(
          apiResult([
            {
              id: 1,
              deptId: 1,
              username: 'admin',
              nickname: '管理员',
              email: 'admin@quickframework.local',
              mobile: null,
              status: 'ENABLED',
              roleIds: [1],
            },
          ]),
        ),
      });
    });
    await page.route('**/api/iam/depts', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(
          apiResult([{ id: 1, parentId: 0, deptName: '总部', sortOrder: 1, status: 'ENABLED' }]),
        ),
      });
    });
    await page.route('**/api/iam/roles', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(
          apiResult([
            {
              id: 1,
              roleCode: 'SUPER_ADMIN',
              roleName: '超级管理员',
              sortOrder: 1,
              status: 'ENABLED',
            },
          ]),
        ),
      });
    });

    await page.goto('/login');
    await page.getByRole('button', { name: /登录|鐧诲綍/ }).click();
    await expect(page.getByRole('heading', { name: /工作台|宸ヤ綔鍙/ })).toBeVisible();

    await page.getByText(/系统管理|绯荤粺绠＄悊/).click();
    await page.getByRole('menuitem', { name: /用户管理|鐢ㄦ埛绠＄悊/ }).click();
    await expect(page.getByText('403')).toBeVisible();
    await expect(page.getByText(/没有权限|娌℃湁鏉冮檺/)).toBeVisible();

    userPermissionGranted = true;
    await page.evaluate(() => {
      window.localStorage.removeItem('quickframework.accessToken');
      window.localStorage.removeItem('quickframework.refreshToken');
    });

    await page.goto('/login');
    await page.getByRole('button', { name: /登录|鐧诲綍/ }).click();
    await expect(page.getByRole('heading', { name: /工作台|宸ヤ綔鍙/ })).toBeVisible();

    await page.getByText(/系统管理|绯荤粺绠＄悊/).click();
    await page.getByRole('menuitem', { name: /用户管理|鐢ㄦ埛绠＄悊/ }).click();
    await expect(page.getByRole('heading', { name: /用户管理|鐢ㄦ埛绠＄悊/ })).toBeVisible();
    await expect(page.getByText('admin', { exact: true })).toBeVisible();
  });
});
