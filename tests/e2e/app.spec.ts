import { expect, test } from '@playwright/test';

const apiResult = <T>(data: T) => ({
  success: true,
  code: 'OK',
  message: 'success',
  data,
  timestamp: new Date().toISOString(),
});

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/login', async (route) => {
    const payload = route.request().postDataJSON() as { username?: string };
    const isViewer = payload.username === 'viewer';
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult({
          accessToken: isViewer ? 'viewer-token' : 'e2e-token',
          refreshToken: isViewer ? 'viewer-refresh-token' : 'e2e-refresh-token',
          tokenType: 'Bearer',
          expiresIn: 7200,
          user: {
            id: isViewer ? 2 : 1,
            username: isViewer ? 'viewer' : 'admin',
            nickname: isViewer ? '只读用户' : '管理员',
            email: null,
          },
          permissions: isViewer
            ? ['dashboard:view']
            : [
                'dashboard:view',
                'system:user:create',
                'system:user:update',
                'system:user:disable',
                'system:user:view',
                'system:dept:view',
                'system:dept:update',
                'system:post:view',
                'system:post:update',
                'system:role:view',
                'system:role:update',
                'system:menu:view',
                'system:config:view',
                'system:config:update',
                'system:dict:view',
                'system:dict:update',
                'system:log:view',
                'system:task:view',
                'system:task:update',
                'system:data:view',
                'system:file:view',
                'workflow:view',
                'workflow:form:view',
                'workflow:form:update',
                'workflow:definition:view',
                'workflow:definition:update',
                'workflow:task:view',
                'workflow:task:update',
                'workflow:instance:view',
                'workflow:instance:start',
              ],
        }),
      ),
    });
  });
  await page.route('**/api/auth/logout', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(apiResult({ invalidated: true })),
    });
  });
  await page.route('**/api/auth/me', async (route) => {
    const isViewer = route.request().headers().authorization?.includes('viewer-token');
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult({
          id: isViewer ? 2 : 1,
          username: isViewer ? 'viewer' : 'admin',
          nickname: isViewer ? '只读用户' : '管理员',
          email: null,
        }),
      ),
    });
  });
  await page.route('**/api/auth/menus', async (route) => {
    const isViewer = route.request().headers().authorization?.includes('viewer-token');
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult(
          isViewer
            ? [
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
              ]
            : [
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
                    {
                      id: 4,
                      parentId: 2,
                      title: '部门管理',
                      routeName: 'system-dept',
                      routePath: '/system/depts',
                      component: 'iam/DeptListView',
                      icon: 'OfficeBuilding',
                      permissionCode: 'system:dept:view',
                      visible: true,
                      children: [],
                    },
                    {
                      id: 5,
                      parentId: 2,
                      title: '岗位管理',
                      routeName: 'system-post',
                      routePath: '/system/posts',
                      component: 'iam/PostListView',
                      icon: 'Briefcase',
                      permissionCode: 'system:post:view',
                      visible: true,
                      children: [],
                    },
                    {
                      id: 6,
                      parentId: 2,
                      title: '角色管理',
                      routeName: 'system-role',
                      routePath: '/system/roles',
                      component: 'iam/RoleListView',
                      icon: 'UserFilled',
                      permissionCode: 'system:role:view',
                      visible: true,
                      children: [],
                    },
                    {
                      id: 7,
                      parentId: 2,
                      title: '菜单管理',
                      routeName: 'system-menu',
                      routePath: '/system/menus',
                      component: 'iam/MenuListView',
                      icon: 'Menu',
                      permissionCode: 'system:menu:view',
                      visible: true,
                      children: [],
                    },
                    {
                      id: 8,
                      parentId: 2,
                      title: '系统配置',
                      routeName: 'system-config',
                      routePath: '/system/configs',
                      component: 'system/ConfigListView',
                      icon: 'Tools',
                      permissionCode: 'system:config:view',
                      visible: true,
                      children: [],
                    },
                    {
                      id: 9,
                      parentId: 2,
                      title: '字典管理',
                      routeName: 'system-dict',
                      routePath: '/system/dicts',
                      component: 'system/DictListView',
                      icon: 'Collection',
                      permissionCode: 'system:dict:view',
                      visible: true,
                      children: [],
                    },
                    {
                      id: 10,
                      parentId: 2,
                      title: '日志查询',
                      routeName: 'system-log',
                      routePath: '/system/logs',
                      component: 'system/LogListView',
                      icon: 'Document',
                      permissionCode: 'system:log:view',
                      visible: true,
                      children: [],
                    },
                    {
                      id: 11,
                      parentId: 2,
                      title: '异步任务',
                      routeName: 'system-task',
                      routePath: '/system/tasks',
                      component: 'system/TaskListView',
                      icon: 'Timer',
                      permissionCode: 'system:task:view',
                      visible: true,
                      children: [],
                    },
                    {
                      id: 12,
                      parentId: 2,
                      title: '数据治理',
                      routeName: 'system-data',
                      routePath: '/system/data',
                      component: 'system/DataGovernanceView',
                      icon: 'Connection',
                      permissionCode: 'system:data:view',
                      visible: true,
                      children: [],
                    },
                    {
                      id: 18,
                      parentId: 2,
                      title: '文件管理',
                      routeName: 'system-file',
                      routePath: '/system/files',
                      component: 'file/FileListView',
                      icon: 'Document',
                      permissionCode: 'system:file:view',
                      visible: true,
                      children: [],
                    },
                  ],
                },
                {
                  id: 13,
                  parentId: 0,
                  title: '工作流',
                  routeName: 'workflow',
                  routePath: '/workflow',
                  component: 'Layout',
                  icon: 'Share',
                  permissionCode: 'workflow:view',
                  visible: true,
                  children: [
                    {
                      id: 14,
                      parentId: 13,
                      title: '表单设计',
                      routeName: 'workflow-form',
                      routePath: '/workflow/forms',
                      component: 'workflow/WorkflowCenterView',
                      icon: 'EditPen',
                      permissionCode: 'workflow:form:view',
                      visible: true,
                      children: [],
                    },
                    {
                      id: 15,
                      parentId: 13,
                      title: '流程定义',
                      routeName: 'workflow-definition',
                      routePath: '/workflow/definitions',
                      component: 'workflow/WorkflowCenterView',
                      icon: 'Tickets',
                      permissionCode: 'workflow:definition:view',
                      visible: true,
                      children: [],
                    },
                    {
                      id: 16,
                      parentId: 13,
                      title: '待办任务',
                      routeName: 'workflow-task',
                      routePath: '/workflow/tasks',
                      component: 'workflow/WorkflowCenterView',
                      icon: 'Checked',
                      permissionCode: 'workflow:task:view',
                      visible: true,
                      children: [],
                    },
                    {
                      id: 17,
                      parentId: 13,
                      title: '流程实例',
                      routeName: 'workflow-instance',
                      routePath: '/workflow/instances',
                      component: 'workflow/WorkflowCenterView',
                      icon: 'Operation',
                      permissionCode: 'workflow:instance:view',
                      visible: true,
                      children: [],
                    },
                  ],
                },
              ],
        ),
      ),
    });
  });
  await page.route('**/api/auth/permissions', async (route) => {
    const isViewer = route.request().headers().authorization?.includes('viewer-token');
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult(
          isViewer
            ? ['dashboard:view']
            : [
                'dashboard:view',
                'system:user:create',
                'system:user:update',
                'system:user:disable',
                'system:user:view',
                'system:dept:view',
                'system:dept:update',
                'system:post:view',
                'system:post:update',
                'system:role:view',
                'system:role:update',
                'system:menu:view',
                'system:config:view',
                'system:config:update',
                'system:dict:view',
                'system:dict:update',
                'system:log:view',
                'system:task:view',
                'system:task:update',
                'system:data:view',
                'system:file:view',
                'workflow:view',
                'workflow:form:view',
                'workflow:form:update',
                'workflow:definition:view',
                'workflow:definition:update',
                'workflow:task:view',
                'workflow:task:update',
                'workflow:instance:view',
                'workflow:instance:start',
              ],
        ),
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
        apiResult([
          {
            id: 1,
            parentId: 0,
            deptName: '总部',
            sortOrder: 1,
            status: 'ENABLED',
          },
        ]),
      ),
    });
  });
  await page.route('**/api/iam/roles', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(
          apiResult({
            id: 2,
            roleCode: 'TEST',
            roleName: '测试角色',
            sortOrder: 2,
            status: 'ENABLED',
          }),
        ),
      });
      return;
    }
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
  await page.route('**/api/iam/posts', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult([
          {
            id: 1,
            postCode: 'admin',
            postName: '管理员',
            sortOrder: 1,
            status: 'ENABLED',
          },
        ]),
      ),
    });
  });
  await page.route('**/api/iam/menus', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult([
          {
            id: 1,
            parentId: 0,
            menuType: 'MENU',
            title: '工作台',
            routeName: 'dashboard',
            routePath: '/',
            component: 'system/DashboardView',
            icon: 'Monitor',
            permissionCode: 'dashboard:view',
            visible: true,
            sortOrder: 1,
            status: 'ENABLED',
          },
          {
            id: 2,
            parentId: 0,
            menuType: 'MENU',
            title: '系统管理',
            routeName: 'system',
            routePath: '/system',
            component: 'Layout',
            icon: 'Setting',
            permissionCode: 'system:view',
            visible: true,
            sortOrder: 10,
            status: 'ENABLED',
          },
        ]),
      ),
    });
  });
  await page.route('**/api/iam/permissions', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult([
          {
            id: 1,
            permissionCode: 'dashboard:view',
            permissionName: '查看工作台',
            resourceType: 'MENU',
            status: 'ENABLED',
          },
          {
            id: 2,
            permissionCode: 'system:user:create',
            permissionName: '新增用户',
            resourceType: 'BUTTON',
            status: 'ENABLED',
          },
        ]),
      ),
    });
  });
  await page.route('**/api/iam/roles/1/data-scopes', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(
          apiResult([
            {
              id: 1,
              roleId: 1,
              scopeType: 'ALL',
              scopeValue: '',
            },
          ]),
        ),
      });
      return;
    }
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(apiResult(null)),
    });
  });
  await page.route('**/api/iam/roles/1/menus', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(apiResult(null)),
    });
  });
  await page.route('**/api/iam/roles/1/permissions', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(apiResult(null)),
    });
  });
  await page.route('**/api/system/configs**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult([
          {
            id: 1,
            configGroup: 'security',
            configKey: 'password.min-length',
            configValue: '8',
            valueType: 'NUMBER',
            sensitive: false,
            editable: true,
            remark: '密码最小长度',
          },
        ]),
      ),
    });
  });
  await page.route('**/api/system/dict-types**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult([
          {
            id: 1,
            dictCode: 'common_status',
            dictName: '通用状态',
            status: 'ENABLED',
            remark: '启停状态',
          },
        ]),
      ),
    });
  });
  await page.route('**/api/system/dict-items**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult([
          {
            id: 1,
            dictCode: 'common_status',
            itemLabel: '启用',
            itemValue: 'ENABLED',
            sortOrder: 1,
            status: 'ENABLED',
            remark: null,
          },
        ]),
      ),
    });
  });
  await page.route('**/api/system/login-logs**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult([
          {
            id: 1,
            username: 'admin',
            success: true,
            message: '登录成功',
            loginIp: '127.0.0.1',
            userAgent: 'Playwright',
            loginAt: '2026-06-04T10:00:00',
          },
        ]),
      ),
    });
  });
  await page.route('**/api/system/operation-logs**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult([
          {
            id: 1,
            username: 'admin',
            moduleName: '系统配置',
            operationType: 'UPDATE',
            resourceName: 'password.min-length',
            success: true,
            message: '配置已更新',
            operatedAt: '2026-06-04T10:05:00',
          },
        ]),
      ),
    });
  });
  await page.route('**/api/tasks**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path.endsWith('/api/tasks/dispatch')) {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(apiResult(1)),
      });
      return;
    }

    if (path.endsWith('/api/tasks/outbox')) {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(
          apiResult([
            {
              id: 1,
              aggregateType: 'ASYNC_TASK',
              aggregateId: 'echo-demo',
              eventType: 'TASK_SUBMITTED',
              payload: '{"message":"hello"}',
              idempotentKey: 'echo-demo',
              status: 'PUBLISHED',
              retryCount: 0,
              maxRetries: 3,
              lastError: null,
              nextRetryAt: null,
              createdAt: '2026-06-04T10:10:00',
              publishedAt: '2026-06-04T10:11:00',
            },
          ]),
        ),
      });
      return;
    }

    if (path.endsWith('/api/tasks/1/logs')) {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(
          apiResult([
            {
              id: 1,
              taskId: 1,
              attemptNo: 1,
              status: 'SUCCESS',
              message: '任务执行成功',
              startedAt: '2026-06-04T10:10:00',
              finishedAt: '2026-06-04T10:11:00',
            },
          ]),
        ),
      });
      return;
    }

    if (path.endsWith('/api/tasks/2/retry') || path.endsWith('/api/tasks/2/cancel')) {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(
          apiResult({
            id: 2,
            outboxMessageId: 2,
            taskType: 'ALWAYS_FAIL',
            taskName: '失败示例任务',
            taskParam: '{"message":"fail"}',
            idempotentKey: 'fail-demo',
            status: path.endsWith('/cancel') ? 'CANCELED' : 'PENDING',
            retryCount: 1,
            maxRetries: 1,
            lastError: '示例任务执行失败',
            nextRetryAt: null,
            lockedBy: null,
            lockedAt: null,
            createdAt: '2026-06-04T10:12:00',
            updatedAt: '2026-06-04T10:13:00',
          }),
        ),
      });
      return;
    }

    if (request.method() === 'POST') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(
          apiResult({
            id: 3,
            outboxMessageId: 3,
            taskType: 'ECHO',
            taskName: '新建示例任务',
            taskParam: '{}',
            idempotentKey: 'new-demo',
            status: 'PENDING',
            retryCount: 0,
            maxRetries: 3,
            lastError: null,
            nextRetryAt: null,
            lockedBy: null,
            lockedAt: null,
            createdAt: '2026-06-04T10:14:00',
            updatedAt: '2026-06-04T10:14:00',
          }),
        ),
      });
      return;
    }

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult([
          {
            id: 1,
            outboxMessageId: 1,
            taskType: 'ECHO',
            taskName: '成功示例任务',
            taskParam: '{"message":"hello"}',
            idempotentKey: 'echo-demo',
            status: 'SUCCESS',
            retryCount: 0,
            maxRetries: 3,
            lastError: null,
            nextRetryAt: null,
            lockedBy: null,
            lockedAt: null,
            createdAt: '2026-06-04T10:10:00',
            updatedAt: '2026-06-04T10:11:00',
          },
          {
            id: 2,
            outboxMessageId: 2,
            taskType: 'ALWAYS_FAIL',
            taskName: '失败示例任务',
            taskParam: '{"message":"fail"}',
            idempotentKey: 'fail-demo',
            status: 'MANUAL_REQUIRED',
            retryCount: 1,
            maxRetries: 1,
            lastError: '示例任务执行失败',
            nextRetryAt: null,
            lockedBy: null,
            lockedAt: null,
            createdAt: '2026-06-04T10:12:00',
            updatedAt: '2026-06-04T10:13:00',
          },
        ]),
      ),
    });
  });
  await page.route('**/api/system/data/sources', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult([
          {
            name: 'default',
            url: 'jdbc:h2:mem:quickframework',
            defaultSource: true,
            health: 'UP',
          },
          {
            name: 'readonly',
            url: 'jdbc:h2:mem:quickframework_readonly',
            defaultSource: false,
            health: 'UP',
          },
        ]),
      ),
    });
  });
  await page.route('**/api/system/data/current', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(apiResult('default')),
    });
  });
  await page.route('**/api/system/data/readonly-probe', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(apiResult('QUICKFRAMEWORK_READONLY')),
    });
  });
  await page.route('**/api/system/data/sharding/operation-log**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult({
          logicTable: 'sys_operation_log',
          routeKey: '2026-06',
          actualTable: 'sys_operation_log_202606',
        }),
      ),
    });
  });
  await page.route('**/api/system/data/sharding/async-task**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult({
          logicTable: 'sys_async_task',
          routeKey: '2026-06',
          actualTable: 'sys_async_task_202606',
        }),
      ),
    });
  });
  await page.route('**/api/files**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path.endsWith('/api/files/1/download')) {
      await route.fulfill({
        contentType: 'text/plain',
        body: 'hello file',
      });
      return;
    }

    if (path.endsWith('/api/files/1/preview-info')) {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(
          apiResult({
            id: 1,
            originalFilename: 'demo.txt',
            contentType: 'text/plain',
            fileSize: 10,
            previewable: true,
            previewType: 'TEXT',
            previewUrl: '/api/files/1/download',
            reason: '',
          }),
        ),
      });
      return;
    }

    if (path.endsWith('/api/files/1')) {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(
          apiResult({
            id: 1,
            storageType: 'LOCAL',
            bucketName: 'default',
            objectKey: '2026/06/06/demo.txt',
            originalFilename: 'demo.txt',
            contentType: 'text/plain',
            fileSize: 10,
            fileSha256: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
            status: 'ACTIVE',
            uploadedBy: 'admin',
            createdAt: '2026-06-06T10:00:00',
            updatedAt: '2026-06-06T10:00:00',
          }),
        ),
      });
      return;
    }

    if (request.method() === 'POST') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(
          apiResult({
            id: 2,
            storageType: 'LOCAL',
            bucketName: 'default',
            objectKey: '2026/06/06/upload.txt',
            originalFilename: 'upload.txt',
            contentType: 'text/plain',
            fileSize: 12,
            fileSha256: 'sha-upload',
            status: 'ACTIVE',
            uploadedBy: 'admin',
            createdAt: '2026-06-06T10:05:00',
            updatedAt: '2026-06-06T10:05:00',
          }),
        ),
      });
      return;
    }

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult([
          {
            id: 1,
            storageType: 'LOCAL',
            bucketName: 'default',
            objectKey: '2026/06/06/demo.txt',
            originalFilename: 'demo.txt',
            contentType: 'text/plain',
            fileSize: 10,
            fileSha256: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
            status: 'ACTIVE',
            uploadedBy: 'admin',
            createdAt: '2026-06-06T10:00:00',
            updatedAt: '2026-06-06T10:00:00',
          },
        ]),
      ),
    });
  });
  await page.route('**/api/workflow/forms', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(
          apiResult({
            id: 2,
            formKey: 'leave_form_new',
            formName: '请假表单',
            version: 2,
            schemaJson: '{"fields":[]}',
            status: 'PUBLISHED',
            createdBy: 'admin',
            createdAt: '2026-06-05T00:00:00',
          }),
        ),
      });
      return;
    }
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult([
          {
            id: 1,
            formKey: 'leave_form',
            formName: '请假表单',
            version: 1,
            schemaJson: '{"fields":[{"name":"days"}]}',
            status: 'PUBLISHED',
            createdBy: 'admin',
            createdAt: '2026-06-05T00:00:00',
          },
        ]),
      ),
    });
  });
  await page.route('**/api/workflow/definitions', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(
          apiResult({
            id: 2,
            processKey: 'leave_new',
            processName: '请假审批',
            version: 2,
            formId: 1,
            formName: '请假表单',
            status: 'PUBLISHED',
            assigneeType: 'USER',
            assigneeValue: 'admin',
            createdBy: 'admin',
            createdAt: '2026-06-05T00:00:00',
          }),
        ),
      });
      return;
    }
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult([
          {
            id: 1,
            processKey: 'leave',
            processName: '请假审批',
            version: 1,
            formId: 1,
            formName: '请假表单',
            status: 'PUBLISHED',
            assigneeType: 'USER',
            assigneeValue: 'admin',
            createdBy: 'admin',
            createdAt: '2026-06-05T00:00:00',
          },
        ]),
      ),
    });
  });
  await page.route('**/api/workflow/instances', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(
          apiResult({
            id: 2,
            definitionId: 1,
            formId: 1,
            title: '年假申请',
            businessKey: 'leave-new',
            initiator: 'admin',
            status: 'RUNNING',
            currentAssignee: 'admin',
            formData: '{"days":3}',
            startedAt: '2026-06-05T00:00:00',
            endedAt: null,
          }),
        ),
      });
      return;
    }
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult([
          {
            id: 1,
            definitionId: 1,
            formId: 1,
            title: '年假申请',
            businessKey: 'leave-001',
            initiator: 'admin',
            status: 'RUNNING',
            currentAssignee: 'admin',
            formData: '{"days":3}',
            startedAt: '2026-06-05T00:00:00',
            endedAt: null,
          },
        ]),
      ),
    });
  });
  await page.route('**/api/workflow/tasks/todo', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult([
          {
            id: 1,
            instanceId: 1,
            processTitle: '年假申请',
            taskName: '审批',
            assignee: 'admin',
            status: 'TODO',
            createdAt: '2026-06-05T00:00:00',
            completedAt: null,
          },
        ]),
      ),
    });
  });
  await page.route('**/api/workflow/tasks/1/complete', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult({
          id: 1,
          definitionId: 1,
          formId: 1,
          title: '年假申请',
          businessKey: 'leave-001',
          initiator: 'admin',
          status: 'COMPLETED',
          currentAssignee: null,
          formData: '{"days":3}',
          startedAt: '2026-06-05T00:00:00',
          endedAt: '2026-06-05T00:10:00',
        }),
      ),
    });
  });
  await page.route('**/api/workflow/instances/1/history', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        apiResult([
          {
            id: 1,
            instanceId: 1,
            taskId: null,
            operator: 'admin',
            action: 'START',
            comment: '发起流程',
            createdAt: '2026-06-05T00:00:00',
          },
          {
            id: 2,
            instanceId: 1,
            taskId: 1,
            operator: 'admin',
            action: 'APPROVE',
            comment: '同意',
            createdAt: '2026-06-05T00:10:00',
          },
        ]),
      ),
    });
  });
});

test('logs in and shows dashboard with dynamic permissions', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'QuickFramework' })).toBeVisible();
  await page.getByRole('button', { name: '登录' }).click();

  await expect(page.getByRole('heading', { name: '工作台' })).toBeVisible();
  await expect(page.getByText('管理员')).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /工作台/ })).toBeVisible();
  await expect(page.getByRole('button', { name: '新增用户' })).toBeVisible();

  await page.getByText('系统管理').click();
  await page.getByRole('menuitem', { name: /用户管理/ }).click();
  await expect(page.getByRole('heading', { name: '用户管理' })).toBeVisible();
  await expect(page.getByText('admin', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '新增用户' })).toBeVisible();
  await expect(page.getByRole('button', { name: '详情' })).toBeVisible();
  await expect(page.getByRole('button', { name: '删除' })).toBeVisible();

  await page.getByRole('menuitem', { name: /部门管理/ }).click();
  await expect(page.getByRole('heading', { name: '部门管理' })).toBeVisible();
  await expect(page.getByText('总部')).toBeVisible();
  await expect(page.getByRole('button', { name: '新增部门' })).toBeVisible();

  await page.getByRole('menuitem', { name: /岗位管理/ }).click();
  await expect(page.getByRole('heading', { name: '岗位管理' })).toBeVisible();
  await expect(page.getByText('admin', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '新增岗位' })).toBeVisible();

  await page.getByRole('menuitem', { name: /角色管理/ }).click();
  await expect(page.getByRole('heading', { name: '角色管理' })).toBeVisible();
  await expect(page.getByRole('button', { name: '新增角色' })).toBeVisible();
  await expect(page.getByRole('button', { name: '禁用' })).toBeVisible();
  await page.getByRole('button', { name: '授权' }).click();
  await expect(page.getByRole('tab', { name: '数据范围' })).toBeVisible();
  await page.getByRole('tab', { name: '数据范围' }).click();
  await expect(page.getByText('范围类型')).toBeVisible();
  await page.getByRole('button', { name: '保存' }).click();

  await page.getByRole('menuitem', { name: /菜单管理/ }).click();
  await expect(page.getByRole('heading', { name: '菜单管理' })).toBeVisible();
  await expect(page.getByRole('main').getByText('工作台')).toBeVisible();
  await expect(page.getByRole('button', { name: '新增菜单' })).toBeVisible();

  await page.getByRole('menuitem', { name: /系统配置/ }).click();
  await expect(page.getByRole('heading', { name: '系统配置' })).toBeVisible();
  await expect(page.getByText('password.min-length')).toBeVisible();
  await expect(page.getByRole('button', { name: '新增配置' })).toBeVisible();

  await page.getByRole('menuitem', { name: /字典管理/ }).click();
  await expect(page.getByRole('heading', { name: '字典管理' })).toBeVisible();
  await expect(page.getByText('common_status')).toBeVisible();
  await expect(page.getByRole('button', { name: '新增类型' })).toBeVisible();

  await page.getByRole('menuitem', { name: /日志查询/ }).click();
  await expect(page.getByRole('heading', { name: '日志查询' })).toBeVisible();
  await expect(page.getByText('登录成功')).toBeVisible();
  await page.getByRole('tab', { name: '操作日志' }).click();
  await expect(page.getByText('password.min-length')).toBeVisible();

  await page.getByRole('menuitem', { name: /异步任务/ }).click();
  await expect(page.getByRole('heading', { name: '异步任务' })).toBeVisible();
  await expect(page.getByText('成功示例任务')).toBeVisible();
  await expect(page.getByText('失败示例任务')).toBeVisible();
  await page.getByRole('button', { name: '日志' }).first().click();
  await expect(page.getByText('任务执行成功')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '执行待处理' }).click();
  await expect(page.getByText('已执行 1 个任务')).toBeVisible();
  await page.getByRole('tab', { name: '本地消息' }).click();
  await expect(page.getByText('TASK_SUBMITTED')).toBeVisible();

  await page.getByRole('menuitem', { name: /数据治理/ }).click();
  await expect(page.getByRole('heading', { name: '数据治理' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'default' }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: 'readonly', exact: true })).toBeVisible();
  await expect(
    page.getByRole('cell', { name: 'QUICKFRAMEWORK_READONLY', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('sys_operation_log_202606')).toBeVisible();
  await expect(page.getByText('sys_async_task_202606')).toBeVisible();

  await page.getByRole('menuitem', { name: /文件管理/ }).click();
  await expect(page.getByRole('heading', { name: '文件管理' })).toBeVisible();
  await expect(page.getByText('demo.txt')).toBeVisible();
  await expect(page.getByText('10 B')).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles('tests/fixtures/upload.txt');
  await expect(page.getByText('文件已上传')).toBeVisible();
  await page.getByRole('button', { name: '详情' }).click();
  await expect(page.getByText('2026/06/06/demo.txt')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '预览' }).click();
  await expect(page.getByText('可预览')).toBeVisible();
  await expect(page.getByLabel('文件预览').getByText('TEXT', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByText('工作流').click();
  await page.getByRole('menuitem', { name: /表单设计/ }).click();
  await expect(page.getByRole('heading', { name: '工作流' })).toBeVisible();
  await expect(page.getByLabel('表单设计').getByText('请假表单')).toBeVisible();
  await page.getByRole('button', { name: '新建表单' }).click();
  await expect(page.getByText('表单已创建')).toBeVisible();

  await page.getByRole('tab', { name: '流程定义' }).click();
  await expect(page.getByText('请假审批')).toBeVisible();
  await page.getByRole('button', { name: '新建定义' }).click();
  await expect(page.getByText('流程定义已创建')).toBeVisible();

  await page.getByRole('tab', { name: '流程实例' }).click();
  await page.getByRole('button', { name: '发起流程' }).click();
  await expect(page.getByText('流程已发起')).toBeVisible();
  await expect(page.getByLabel('待办任务').getByText('年假申请')).toBeVisible();

  await page.getByRole('tab', { name: '待办任务' }).click();
  await expect(page.getByLabel('待办任务').getByText('审批', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '同意' }).click();
  await expect(page.getByText('已同意')).toBeVisible();

  await page.getByRole('tab', { name: '流程实例' }).click();
  await page.getByRole('button', { name: '历史' }).click();
  await expect(page.getByText('START')).toBeVisible();
  await expect(page.getByText('APPROVE')).toBeVisible();
});

test('limited role only sees allowed menus and buttons', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('textbox', { name: '账号' }).fill('viewer');
  await page.getByLabel('密码').fill('viewer123');
  await page.getByRole('button', { name: '登录' }).click();

  await expect(page.getByRole('heading', { name: '工作台' })).toBeVisible();
  await expect(page.getByText('只读用户')).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /工作台/ })).toBeVisible();
  await expect(page.getByText('系统管理')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '新增用户' })).toHaveCount(0);
});
