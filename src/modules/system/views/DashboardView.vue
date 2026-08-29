<template>
  <section class="dashboard">
    <header class="dashboard__header">
      <div>
        <h1>工作台</h1>
        <p>待处理事项、运行异常和平台基础数据的当前概览。</p>
      </div>
      <el-button :icon="Refresh" :loading="loading" @click="loadDashboard">刷新</el-button>
    </header>

    <div class="dashboard__metrics">
      <div
        v-for="metric in metrics"
        :key="metric.key"
        class="dashboard__metric"
        :class="`dashboard__metric--${metric.tone}`"
      >
        <el-icon class="dashboard__metric-icon">
          <component :is="metric.icon" />
        </el-icon>
        <div>
          <span>{{ metric.label }}</span>
          <strong>{{ metric.loading ? '...' : metric.value }}</strong>
          <small>{{ metric.error ? '加载失败' : metric.caption }}</small>
        </div>
      </div>
    </div>

    <div class="dashboard__content">
      <section class="dashboard__panel dashboard__panel--wide">
        <div class="dashboard__panel-header">
          <h2>待处理任务</h2>
          <span>{{ taskSummary }}</span>
        </div>
        <el-table :data="recentTasks" size="small" empty-text="暂无待处理任务">
          <el-table-column prop="taskName" label="任务" min-width="160" />
          <el-table-column prop="taskType" label="类型" width="140" />
          <el-table-column prop="status" label="状态" width="110">
            <template #default="{ row }">
              <QfStatusTag
                :status="row.status"
                :label="TASK_STATUS_LABELS[row.status] ?? row.status"
                :mapping="TASK_STATUS_MAP"
              />
            </template>
          </el-table-column>
          <el-table-column prop="updatedAt" label="更新时间" width="170" />
        </el-table>
      </section>

      <div class="dashboard__side">
        <section class="dashboard__panel">
          <div class="dashboard__panel-header">
            <h2>公告</h2>
            <span>{{ publishedNotices.length }} 条已发布</span>
          </div>
          <div class="dashboard__notice-list">
            <div v-for="notice in latestNotices" :key="notice.id" class="dashboard__notice">
              <strong>{{ notice.title }}</strong>
              <span>{{ notice.publishedAt ?? notice.updatedAt }}</span>
            </div>
            <el-empty v-if="latestNotices.length === 0" description="暂无公告" :image-size="52" />
          </div>
        </section>

        <section class="dashboard__panel">
          <div class="dashboard__panel-header">
            <h2>平台基础</h2>
            <span>配置与权限</span>
          </div>
          <dl class="dashboard__facts">
            <div>
              <dt>系统配置</dt>
              <dd>{{ configs.length }}</dd>
            </div>
            <div>
              <dt>启用菜单</dt>
              <dd>{{ enabledMenus }}</dd>
            </div>
            <div>
              <dt>Outbox 待发布</dt>
              <dd>{{ pendingOutbox }}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, markRaw, onMounted, reactive, ref } from 'vue';
import { Bell, Menu as MenuIcon, Refresh, Tickets, Warning } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { iamApi, type SysMenu } from '@/api/iam';
import { systemApi, type Notice, type SysConfig } from '@/api/system';
import { taskApi, type AsyncTask, type OutboxMessage } from '@/api/task';
import { QfStatusTag } from '@/shared';

defineOptions({ name: 'DashboardView' });

const TASK_STATUS_MAP = {
  SUCCESS: 'success',
  FAILED: 'danger',
  PENDING: 'warning',
  RUNNING: 'warning',
  MANUAL_REQUIRED: 'danger',
  CANCELLED: 'info',
} as const;

const TASK_STATUS_LABELS: Record<string, string> = {
  SUCCESS: '成功',
  FAILED: '失败',
  PENDING: '待处理',
  RUNNING: '运行中',
  MANUAL_REQUIRED: '需人工处理',
  CANCELLED: '已终止',
};

type MetricTone = 'primary' | 'success' | 'warning' | 'danger';

interface Metric {
  key: string;
  label: string;
  value: string;
  caption: string;
  tone: MetricTone;
  icon: object;
  loading: boolean;
  error: boolean;
}

const loading = ref(false);
const tasks = ref<AsyncTask[]>([]);
const outbox = ref<OutboxMessage[]>([]);
const configs = ref<SysConfig[]>([]);
const menus = ref<SysMenu[]>([]);
const notices = ref<Notice[]>([]);

const metrics = reactive<Metric[]>([
  {
    key: 'manualTasks',
    label: '需人工处理',
    value: '0',
    caption: '失败或进入人工介入的异步任务',
    tone: 'danger',
    icon: markRaw(Warning),
    loading: true,
    error: false,
  },
  {
    key: 'runningTasks',
    label: '运行中任务',
    value: '0',
    caption: 'RUNNING / PENDING 任务',
    tone: 'warning',
    icon: markRaw(Tickets),
    loading: true,
    error: false,
  },
  {
    key: 'publishedNotices',
    label: '发布公告',
    value: '0',
    caption: '当前可见公告',
    tone: 'success',
    icon: markRaw(Bell),
    loading: true,
    error: false,
  },
  {
    key: 'enabledMenus',
    label: '启用菜单',
    value: '0',
    caption: '可见且启用的菜单节点',
    tone: 'primary',
    icon: markRaw(MenuIcon),
    loading: true,
    error: false,
  },
]);

const manualTasks = computed(() =>
  tasks.value.filter((task) => ['FAILED', 'MANUAL_REQUIRED'].includes(task.status)),
);
const runningTasks = computed(() =>
  tasks.value.filter((task) => ['RUNNING', 'PENDING'].includes(task.status)),
);
const publishedNotices = computed(() =>
  notices.value.filter((notice) => notice.status === 'PUBLISHED'),
);
const enabledMenus = computed(
  () => menus.value.filter((menu) => menu.status === 'ENABLED' && menu.visible).length,
);
const pendingOutbox = computed(
  () => outbox.value.filter((message) => message.status !== 'PUBLISHED').length,
);
const recentTasks = computed(() => [...manualTasks.value, ...runningTasks.value].slice(0, 6));
const latestNotices = computed(() =>
  [...publishedNotices.value]
    .sort((a, b) => (b.publishedAt ?? b.updatedAt).localeCompare(a.publishedAt ?? a.updatedAt))
    .slice(0, 5),
);
const taskSummary = computed(
  () => `${manualTasks.value.length} 个异常，${runningTasks.value.length} 个运行中`,
);

async function loadDashboard() {
  loading.value = true;
  resetMetrics();
  const [taskResult, outboxResult, configResult, menuResult, noticeResult] =
    await Promise.allSettled([
      taskApi.tasks(),
      taskApi.outbox(),
      systemApi.configs(),
      iamApi.menus(),
      systemApi.notices('', 'PUBLISHED'),
    ]);

  tasks.value = valueOrEmpty(taskResult, 'manualTasks');
  outbox.value = valueOrEmpty(outboxResult);
  configs.value = valueOrEmpty(configResult);
  menus.value = valueOrEmpty(menuResult, 'enabledMenus');
  notices.value = valueOrEmpty(noticeResult, 'publishedNotices');

  updateMetric('manualTasks', String(manualTasks.value.length));
  updateMetric('runningTasks', String(runningTasks.value.length));
  updateMetric('publishedNotices', String(publishedNotices.value.length));
  updateMetric('enabledMenus', String(enabledMenus.value));
  loading.value = false;

  if (
    [taskResult, outboxResult, configResult, menuResult, noticeResult].some(
      (result) => result.status === 'rejected',
    )
  ) {
    ElMessage.warning('工作台部分数据加载失败');
  }
}

function resetMetrics() {
  metrics.forEach((metric) => {
    metric.loading = true;
    metric.error = false;
  });
}

function updateMetric(key: string, value: string) {
  const metric = metrics.find((item) => item.key === key);
  if (!metric) return;
  metric.value = value;
  metric.loading = false;
}

function markMetricError(key: string) {
  const metric = metrics.find((item) => item.key === key);
  if (!metric) return;
  metric.loading = false;
  metric.error = true;
}

function valueOrEmpty<T>(result: PromiseSettledResult<T[]>, metricKey?: string) {
  if (result.status === 'fulfilled') {
    return result.value;
  }
  if (metricKey) {
    markMetricError(metricKey);
  }
  return [];
}

onMounted(loadDashboard);
</script>

<style scoped>
.dashboard {
  display: grid;
  gap: 18px;
}

.dashboard__header {
  display: flex;
  gap: var(--qf-spacing-lg);
  align-items: flex-start;
  justify-content: space-between;
}

.dashboard__header h1 {
  margin: 0 0 6px;
  color: var(--qf-color-text-primary);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.dashboard__header p {
  margin: 0;
  color: var(--qf-color-text-secondary);
}

.dashboard__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.dashboard__metric {
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: var(--qf-spacing-md);
  align-items: center;
  min-height: 112px;
  padding: 18px;
  background: var(--qf-color-bg-surface);
  border: 1px solid var(--qf-color-border-soft);
  border-radius: var(--qf-border-radius);
  box-shadow: 0 1px 2px rgb(15 23 42 / 3%);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.dashboard__metric::after {
  position: absolute;
  right: -26px;
  bottom: -34px;
  width: 110px;
  height: 110px;
  background: currentcolor;
  border-radius: 50%;
  content: '';
  opacity: 0.035;
}

.dashboard__metric:hover {
  box-shadow: 0 8px 22px rgb(15 23 42 / 8%);
  transform: translateY(-2px);
}

.dashboard__metric--primary {
  color: var(--el-color-primary);
}

.dashboard__metric--success {
  color: var(--el-color-success);
}

.dashboard__metric--warning {
  color: var(--el-color-warning);
}

.dashboard__metric--danger {
  color: var(--el-color-danger);
}

.dashboard__metric-icon {
  width: 44px;
  height: 44px;
  color: currentcolor;
  background: color-mix(in srgb, currentcolor 12%, transparent);
  border-radius: 12px;
  font-size: 21px;
}

.dashboard__metric span,
.dashboard__metric small {
  display: block;
  color: var(--qf-color-text-secondary);
}

.dashboard__metric strong {
  display: block;
  margin: 4px 0;
  color: var(--qf-color-text-primary);
  font-size: 26px;
  line-height: 1;
}

.dashboard__content {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(260px, 0.75fr);
  gap: var(--qf-spacing-md);
}

.dashboard__side {
  display: grid;
  gap: var(--qf-spacing-md);
  align-content: start;
}

.dashboard__panel {
  min-width: 0;
  padding: 16px;
  background: var(--qf-color-bg-surface);
  border: 1px solid var(--qf-color-border-soft);
  border-radius: var(--qf-border-radius);
  box-shadow: 0 1px 2px rgb(15 23 42 / 3%);
}

.dashboard__panel-header {
  display: flex;
  gap: var(--qf-spacing-md);
  align-items: center;
  justify-content: space-between;
  min-height: 28px;
  margin-bottom: 14px;
}

.dashboard__panel-header h2 {
  margin: 0;
  color: var(--qf-color-text-primary);
  font-size: 15px;
  font-weight: 650;
}

.dashboard__panel-header span {
  color: var(--qf-color-text-secondary);
  font-size: 13px;
}

.dashboard__notice-list {
  display: grid;
  gap: 10px;
}

.dashboard__notice {
  display: grid;
  gap: 3px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--qf-border-color);
}

.dashboard__notice:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.dashboard__notice strong {
  font-weight: var(--qf-font-weight-semibold);
}

.dashboard__notice span {
  color: var(--qf-color-text-secondary);
  font-size: 12px;
}

.dashboard__facts {
  display: grid;
  gap: 12px;
  margin: 0;
}

.dashboard__facts div {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dashboard__facts dt,
.dashboard__facts dd {
  margin: 0;
}

.dashboard__facts dt {
  color: var(--qf-color-text-secondary);
}

.dashboard__facts dd {
  font-weight: var(--qf-font-weight-heading);
}

@media (width <= 1180px) {
  .dashboard__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 960px) {
  .dashboard__content {
    grid-template-columns: 1fr;
  }
}

@media (width <= 640px) {
  .dashboard__metrics {
    grid-template-columns: 1fr;
  }

  .dashboard__header {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
