import { expect, test, type Page } from '@playwright/test';

const apiResult = <T>(data: T) => ({
  success: true,
  code: 'OK',
  message: 'success',
  data,
  timestamp: new Date().toISOString(),
});

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult({
          accessToken: 'visual-token',
          refreshToken: 'visual-refresh-token',
          tokenType: 'Bearer',
          expiresIn: 7200,
          user: { id: 1, username: 'admin', nickname: '管理员', email: null },
          permissions: [
            'dashboard:view',
            'system:user:create',
            'system:user:update',
            'system:user:disable',
            'system:user:view',
            'system:role:view',
            'system:role:update',
            'system:task:view',
            'system:task:update',
            'system:data:view',
          ],
        }),
      ),
    });
  });

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult({ id: 1, username: 'admin', nickname: '管理员', email: null }),
      ),
    });
  });

  await page.route('**/api/auth/permissions', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult([
          'dashboard:view',
          'system:user:create',
          'system:user:update',
          'system:user:disable',
          'system:user:view',
          'system:role:view',
          'system:role:update',
          'system:task:view',
          'system:task:update',
          'system:data:view',
        ]),
      ),
    });
  });

  await page.route('**/api/auth/menus', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult([
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
              menu(
                3,
                '用户管理',
                'system-user',
                '/system/users',
                'iam/UserListView',
                'system:user:view',
              ),
              menu(
                4,
                '角色管理',
                'system-role',
                '/system/roles',
                'iam/RoleListView',
                'system:role:view',
              ),
              menu(
                5,
                '异步任务',
                'system-task',
                '/system/tasks',
                'system/TaskListView',
                'system:task:view',
              ),
              menu(
                6,
                '数据治理',
                'system-data',
                '/system/data',
                'system/DataGovernanceView',
                'system:data:view',
              ),
            ],
          },
        ]),
      ),
    });
  });

  await page.route('**/api/iam/users**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult([
          {
            id: 1,
            username: 'admin',
            nickname: '管理员',
            email: 'admin@example.com',
            mobile: '13800000000',
            status: 'ENABLED',
            deptId: 1,
            roleIds: [1],
          },
        ]),
      ),
    });
  });

  await page.route('**/api/iam/users/1', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult({
          id: 1,
          username: 'admin',
          nickname: '管理员',
          email: 'admin@example.com',
          mobile: '13800000000',
          status: 'ENABLED',
          deptId: 1,
          roleIds: [1],
        }),
      ),
    });
  });

  await page.route('**/api/iam/depts**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult([{ id: 1, parentId: 0, deptName: '总部', status: 'ENABLED', sortOrder: 1 }]),
      ),
    });
  });

  await page.route('**/api/iam/roles/**/data-scopes', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(apiResult([{ scopeType: 'ALL', scopeValue: '' }])),
    });
  });

  await page.route('**/api/iam/roles**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult([
          { id: 1, roleCode: 'ADMIN', roleName: '超级管理员', sortOrder: 1, status: 'ENABLED' },
        ]),
      ),
    });
  });

  await page.route('**/api/iam/menus**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult([{ id: 1, parentId: 0, title: '工作台', status: 'ENABLED', sortOrder: 1 }]),
      ),
    });
  });

  await page.route('**/api/iam/permissions**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult([
          {
            id: 1,
            permissionCode: 'dashboard:view',
            permissionName: '查看工作台',
            status: 'ENABLED',
          },
        ]),
      ),
    });
  });

  await page.route('**/api/tasks/*/logs', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult([
          {
            id: 1,
            attemptNo: 1,
            status: 'SUCCESS',
            message: '任务执行成功',
            startedAt: '2026-06-15T00:00:00',
          },
        ]),
      ),
    });
  });

  await page.route('**/api/tasks/1', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(apiResult(taskRow())),
    });
  });

  await page.route('**/api/tasks/outbox**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult([
          {
            id: 1,
            eventType: 'TASK_SUBMITTED',
            aggregateType: 'TASK',
            aggregateId: '1',
            status: 'PUBLISHED',
            idempotentKey: 'task-1',
            lastError: null,
            payload: '{"ok":true}',
            createdAt: '2026-06-15T00:00:00',
            publishedAt: '2026-06-15T00:00:01',
          },
        ]),
      ),
    });
  });

  await page.route('**/api/tasks**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(apiResult([taskRow()])),
    });
  });

  await page.route('**/api/system/data/sources', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult([
          {
            name: 'default',
            url: 'jdbc:mysql://vm/quickframework',
            defaultSource: true,
            health: 'UP',
          },
        ]),
      ),
    });
  });
  await page.route('**/api/system/data/current', async (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(apiResult('default')) }),
  );
  await page.route('**/api/system/data/readonly-probe', async (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(apiResult('QUICKFRAMEWORK_READONLY')),
    }),
  );
  await page.route('**/api/system/data/sharding/operation-log**', async (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult({
          logicTable: 'sys_operation_log',
          routeKey: '2026-06',
          actualTable: 'sys_operation_log_202606',
        }),
      ),
    }),
  );
  await page.route('**/api/system/data/sharding/async-task**', async (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult({
          logicTable: 'sys_async_task',
          routeKey: '2026-06',
          actualTable: 'sys_async_task_202606',
        }),
      ),
    }),
  );
  await page.route('**/api/system/data/slow-sql', async (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult([
          {
            occurredAt: '2026-06-15T00:00:00',
            durationMs: 320,
            thresholdMs: 200,
            traceId: 'trace-1',
            statementId: 'com.quickframework.UserMapper.selectPage',
            sql: 'select * from sys_user',
          },
        ]),
      ),
    }),
  );
});

test('business pages keep unified visual structure', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: '登录' }).click();
  await expect(page.getByRole('heading', { name: '工作台' })).toBeVisible();

  await openSystemPage(page, /用户管理/, /用户管理/);
  await expect(page.getByRole('button', { name: '新增用户' })).toBeVisible();
  await page.getByRole('button', { name: '详情' }).first().click();
  await expect(page.locator('.el-drawer').filter({ hasText: '用户详情' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.el-drawer')).toBeHidden();

  await openSystemPage(page, /角色管理/, /角色管理/);
  await expect(page.getByRole('button', { name: '新增角色' })).toBeVisible();
  await page.getByRole('button', { name: /更多/ }).first().click();
  await page
    .locator('.el-dropdown-menu')
    .getByRole('menuitem', { name: /^用户$/ })
    .click();
  await expect(page.locator('.el-drawer').filter({ hasText: '关联用户' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.el-drawer')).toBeHidden();

  await openSystemPage(page, /异步任务/, /异步任务/);
  await expect(page.getByRole('button', { name: '新建任务' })).toBeVisible();
  await page.getByRole('button', { name: '日志' }).first().click();
  await expect(page.locator('.el-drawer').filter({ hasText: '执行日志' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: '执行日志' })).toBeHidden();

  await openSystemPage(page, /数据治理/, /数据治理/);
  await expect(page.getByRole('heading', { name: '数据源明细' })).toBeVisible();
  await expect(page.getByText('UP', { exact: true })).toBeVisible();
});

function menu(
  id: number,
  title: string,
  routeName: string,
  routePath: string,
  component: string,
  permissionCode: string,
) {
  return {
    id,
    parentId: 2,
    title,
    routeName,
    routePath,
    component,
    icon: 'Document',
    permissionCode,
    visible: true,
    children: [],
  };
}

function taskRow() {
  return {
    id: 1,
    taskType: 'ECHO',
    taskName: '成功示例任务',
    taskParam: '{"message":"ok"}',
    status: 'SUCCESS',
    retryCount: 0,
    maxRetries: 3,
    idempotentKey: 'task-1',
    lastError: null,
    manualAction: null,
    manualHandledBy: null,
    manualComment: null,
    createdAt: '2026-06-15T00:00:00',
    updatedAt: '2026-06-15T00:00:01',
  };
}

async function openSystemPage(page: Page, menuName: RegExp, heading: RegExp) {
  const menuItem = page.getByRole('menuitem', { name: menuName });
  if (!(await menuItem.isVisible())) {
    await page.getByText('系统管理').click();
  }
  await menuItem.click();
  await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  await expectMainNoHorizontalOverflow(page);
}

async function expectMainNoHorizontalOverflow(page: Page) {
  const metrics = await page.locator('.app-shell__main').evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 2);
}
