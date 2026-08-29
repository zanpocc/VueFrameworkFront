import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardView from '../DashboardView.vue';
import { iamApi } from '@/api/iam';
import { systemApi } from '@/api/system';
import { taskApi } from '@/api/task';

vi.mock('@/api/iam', () => ({
  iamApi: {
    menus: vi.fn(),
  },
}));

vi.mock('@/api/system', () => ({
  systemApi: {
    configs: vi.fn(),
    notices: vi.fn(),
  },
}));

vi.mock('@/api/task', () => ({
  taskApi: {
    tasks: vi.fn(),
    outbox: vi.fn(),
  },
}));

vi.mock('element-plus', async (importOriginal) => ({
  ...(await importOriginal<typeof import('element-plus')>()),
  ElMessage: {
    warning: vi.fn(),
  },
}));

vi.mock('@/shared', () => ({
  QfPageShell: { template: '<section><slot /></section>' },
  QfMetricCard: {
    props: ['label', 'value', 'caption', 'tone', 'loading', 'error'],
    template:
      '<section><span>{{ label }}</span><strong>{{ loading ? "..." : value }}</strong></section>',
  },
  QfPageHeader: {
    template:
      '<header><h1>{{ title }}</h1><p>{{ description }}</p><slot name="actions" /></header>',
    props: ['title', 'description'],
  },
  QfCard: {
    template: '<section><slot name="actions" /><slot /></section>',
    props: ['title', 'description'],
  },
  QfStatusTag: {
    props: ['status', 'label'],
    template: '<span>{{ label || status }}</span>',
  },
}));

describe('DashboardView', () => {
  beforeEach(() => {
    vi.mocked(taskApi.tasks).mockResolvedValue([
      task('FAILED', '失败任务'),
      task('RUNNING', '运行任务'),
      task('SUCCESS', '成功任务'),
    ]);
    vi.mocked(taskApi.outbox).mockResolvedValue([outbox('PENDING'), outbox('PUBLISHED')]);
    vi.mocked(systemApi.configs).mockResolvedValue([config('site.name'), config('security.jwt')]);
    vi.mocked(iamApi.menus).mockResolvedValue([
      menu('ENABLED', true),
      menu('DISABLED', true),
      menu('ENABLED', false),
    ]);
    vi.mocked(systemApi.notices).mockResolvedValue([
      notice('升级窗口', '2026-06-14 10:00:00'),
      notice('巡检完成', '2026-06-13 18:00:00'),
    ]);
  });

  it('renders dashboard metrics from backend APIs', async () => {
    const wrapper = mount(DashboardView, {
      global: {
        stubs: {
          ElButton: { template: '<button><slot /></button>' },
          ElIcon: { template: '<i><slot /></i>' },
          ElTable: {
            props: ['data'],
            template:
              '<div><slot /><div v-for="row in data" :key="row.id">{{ row.taskName }}</div></div>',
          },
          ElTableColumn: true,
          ElEmpty: true,
        },
      },
    });

    await flushPromises();

    expect(taskApi.tasks).toHaveBeenCalled();
    expect(taskApi.outbox).toHaveBeenCalled();
    expect(systemApi.configs).toHaveBeenCalled();
    expect(iamApi.menus).toHaveBeenCalled();
    expect(systemApi.notices).toHaveBeenCalledWith('', 'PUBLISHED');
    expect(wrapper.text()).toContain('1 个异常，1 个运行中');
    expect(wrapper.text()).toContain('失败任务');
    expect(wrapper.text()).toContain('升级窗口');
    expect(wrapper.text()).toContain('系统配置');
    expect(wrapper.text()).toContain('Outbox 待发布');
  });
});

function task(status: string, taskName: string) {
  return {
    id: Math.random(),
    outboxMessageId: 0,
    taskType: 'DEMO',
    taskName,
    taskParam: null,
    idempotentKey: taskName,
    status,
    retryCount: 0,
    maxRetries: 3,
    lastError: null,
    nextRetryAt: null,
    lockedBy: null,
    lockedAt: null,
    manualAction: null,
    manualComment: null,
    manualHandledBy: null,
    manualHandledAt: null,
    createdAt: '2026-06-14 09:00:00',
    updatedAt: '2026-06-14 10:00:00',
  };
}

function outbox(status: string) {
  return {
    id: Math.random(),
    aggregateType: 'DEMO',
    aggregateId: '1',
    eventType: 'CREATED',
    payload: null,
    idempotentKey: null,
    status,
    retryCount: 0,
    maxRetries: 3,
    lastError: null,
    nextRetryAt: null,
    createdAt: '2026-06-14 09:00:00',
    publishedAt: status === 'PUBLISHED' ? '2026-06-14 10:00:00' : null,
  };
}

function config(configKey: string) {
  return {
    id: Math.random(),
    configGroup: 'system',
    configKey,
    configValue: 'value',
    valueType: 'STRING',
    sensitive: false,
    editable: true,
    remark: null,
  };
}

function menu(status: string, visible: boolean) {
  return {
    id: Math.random(),
    parentId: 0,
    menuType: 'MENU',
    title: '菜单',
    routeName: 'menu',
    routePath: '/menu',
    component: 'MenuView',
    icon: null,
    permissionCode: null,
    visible,
    sortOrder: 0,
    status,
  };
}

function notice(title: string, publishedAt: string) {
  return {
    id: Math.random(),
    title,
    noticeType: 'SYSTEM',
    content: title,
    status: 'PUBLISHED',
    pinned: false,
    sortOrder: 0,
    publisher: 'admin',
    publishedAt,
    createdBy: 'admin',
    updatedBy: 'admin',
    createdAt: publishedAt,
    updatedAt: publishedAt,
  };
}
