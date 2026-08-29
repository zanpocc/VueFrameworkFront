<template>
  <QfPageShell class="dashboard">
    <section class="dashboard__welcome">
      <div class="dashboard__welcome-copy">
        <div class="dashboard__eyebrow">
          <span class="dashboard__eyebrow-mark" />
          <span>QUICKFRAMEWORK</span>
          <span class="dashboard__eyebrow-divider">/</span>
          <span>运营概览</span>
        </div>
        <QfPageHeader title="工作台" description="待处理事项、运行异常和平台基础数据的当前概览。">
          <template #actions>
            <el-button type="primary" :icon="Refresh" :loading="loading" @click="loadDashboard">
              刷新数据
            </el-button>
          </template>
        </QfPageHeader>
      </div>
      <div class="dashboard__welcome-meta">
        <span>概览日期</span>
        <strong>{{ todayLabel }}</strong>
        <small>数据自动同步</small>
      </div>
    </section>

    <section class="dashboard__metrics" aria-label="平台关键指标">
      <QfMetricCard
        v-for="metric in metrics"
        :key="metric.key"
        :label="metric.label"
        :value="metric.value"
        :caption="metric.caption"
        :tone="metric.tone"
        :icon="metric.icon"
        :loading="metric.loading"
        :error="metric.error"
      />
    </section>

    <section class="dashboard__content">
      <QfCard
        class="dashboard__panel dashboard__tasks-panel"
        title="待处理任务"
        description="优先关注异常与运行中的异步任务"
      >
        <template #actions>
          <span class="dashboard__summary">
            <span class="dashboard__summary-dot" />
            {{ taskSummary }}
          </span>
        </template>
        <el-table v-if="recentTasks.length > 0" :data="recentTasks" size="small">
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
        <div v-else class="dashboard__empty">
          <span class="dashboard__empty-icon"
            ><el-icon><CircleCheck /></el-icon
          ></span>
          <div>
            <strong>暂无待处理任务</strong>
            <span class="dashboard__empty-caption">新的异步任务会显示在这里</span>
          </div>
        </div>
      </QfCard>

      <div class="dashboard__side">
        <QfCard class="dashboard__panel dashboard__notice-panel" title="公告">
          <template #actions
            ><span>{{ publishedNotices.length }} 条已发布</span></template
          >
          <div class="dashboard__notice-list">
            <div
              v-for="(notice, index) in latestNotices"
              :key="notice.id"
              class="dashboard__notice"
            >
              <span class="dashboard__notice-index">{{ String(index + 1).padStart(2, '0') }}</span>
              <div class="dashboard__notice-copy">
                <strong>{{ notice.title }}</strong>
                <span>{{ notice.publishedAt ?? notice.updatedAt }}</span>
              </div>
              <el-icon class="dashboard__notice-arrow"><ArrowRight /></el-icon>
            </div>
            <div
              v-if="latestNotices.length === 0"
              class="dashboard__empty dashboard__empty--compact"
            >
              <span class="dashboard__empty-icon"
                ><el-icon><Bell /></el-icon
              ></span>
              <div>
                <strong>暂无公告</strong>
                <span class="dashboard__empty-caption">发布后的公告会显示在这里</span>
              </div>
            </div>
          </div>
        </QfCard>

        <QfCard class="dashboard__panel dashboard__facts-panel" title="平台基础">
          <template #actions><span>实时数据</span></template>
          <dl class="dashboard__facts">
            <div>
              <dt>系统配置</dt>
              <dd>
                <strong>{{ configs.length }}</strong
                ><small>项</small>
              </dd>
            </div>
            <div>
              <dt>启用菜单</dt>
              <dd>
                <strong>{{ enabledMenus }}</strong
                ><small>项</small>
              </dd>
            </div>
            <div>
              <dt>Outbox 待发布</dt>
              <dd>
                <strong>{{ pendingOutbox }}</strong
                ><small>条</small>
              </dd>
            </div>
          </dl>
        </QfCard>
      </div>
    </section>
  </QfPageShell>
</template>

<script setup lang="ts">
import { computed, markRaw, onMounted, reactive, ref } from 'vue';
import {
  ArrowRight,
  Bell,
  CircleCheck,
  Menu as MenuIcon,
  Refresh,
  Tickets,
  Warning,
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { iamApi, type SysMenu } from '@/api/iam';
import { systemApi, type Notice, type SysConfig } from '@/api/system';
import { taskApi, type AsyncTask, type OutboxMessage } from '@/api/task';
import { QfCard, QfMetricCard, QfPageHeader, QfPageShell, QfStatusTag } from '@/shared';

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
const todayLabel = new Intl.DateTimeFormat('zh-CN', {
  month: 'long',
  day: 'numeric',
  weekday: 'short',
}).format(new Date());
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
  gap: var(--qf-spacing-lg);
}

.dashboard__welcome {
  position: relative;
  display: flex;
  gap: var(--qf-spacing-xl);
  align-items: stretch;
  justify-content: space-between;
  min-height: 128px;
  padding: var(--qf-spacing-xl) 28px;
  overflow: hidden;
  background: var(--qf-color-dashboard-welcome);
  border: 1px solid var(--qf-color-border-soft);
  border-radius: var(--qf-border-radius-lg);
  box-shadow: var(--qf-shadow-panel);
}

.dashboard__welcome::before {
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: var(--qf-color-primary);
  content: '';
}

.dashboard__welcome::after {
  position: absolute;
  top: -74px;
  right: 160px;
  width: 190px;
  height: 190px;
  border: 1px solid var(--qf-color-brand-highlight);
  border-radius: var(--qf-border-radius-round);
  content: '';
  opacity: 0.7;
}

.dashboard__welcome-copy {
  position: relative;
  z-index: 1;
  display: grid;
  align-content: center;
  min-width: 0;
}

.dashboard__eyebrow {
  display: flex;
  gap: var(--qf-spacing-xs);
  align-items: center;
  margin-bottom: var(--qf-spacing-sm);
  color: var(--qf-color-primary-strong);
  font-size: var(--qf-font-size-caption);
  font-weight: var(--qf-font-weight-semibold);
  letter-spacing: 0.08em;
}

.dashboard__eyebrow-mark {
  width: 7px;
  height: 7px;
  margin-right: 2px;
  background: var(--qf-color-primary);
  border-radius: var(--qf-border-radius-round);
  box-shadow: 0 0 0 4px var(--qf-color-primary-soft);
}

.dashboard__eyebrow-divider {
  color: var(--qf-color-text-placeholder);
}

.dashboard__welcome :deep(.qf-page-header) {
  align-items: center;
}

.dashboard__welcome :deep(.qf-page-header h1) {
  margin-bottom: var(--qf-spacing-xs);
  font-size: 28px;
  letter-spacing: -0.03em;
}

.dashboard__welcome-meta {
  position: relative;
  z-index: 1;
  display: grid;
  align-content: center;
  min-width: 160px;
  padding-left: var(--qf-spacing-xl);
  border-left: 1px solid var(--qf-color-border);
}

.dashboard__welcome-meta span,
.dashboard__welcome-meta small {
  color: var(--qf-color-text-secondary);
}

.dashboard__welcome-meta span {
  font-size: var(--qf-font-size-caption);
}

.dashboard__welcome-meta strong {
  margin: 3px 0;
  color: var(--qf-color-text-primary);
  font-size: var(--qf-font-size-subtitle);
  font-weight: var(--qf-font-weight-heading);
}

.dashboard__welcome-meta small {
  font-size: var(--qf-font-size-caption);
}

.dashboard__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--qf-spacing-md);
}

.dashboard__content {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(260px, 0.75fr);
  gap: var(--qf-spacing-md);
  align-items: start;
}

.dashboard__side {
  display: grid;
  gap: var(--qf-spacing-md);
  align-content: start;
}

.dashboard__panel {
  min-width: 0;
}

.dashboard__tasks-panel :deep(.qf-card__body) {
  padding-top: var(--qf-spacing-sm);
}

.dashboard__summary {
  display: inline-flex;
  gap: var(--qf-spacing-xs);
  align-items: center;
  color: var(--qf-color-text-secondary);
  font-size: var(--qf-font-size-caption);
}

.dashboard__summary-dot {
  width: 6px;
  height: 6px;
  background: var(--qf-color-primary);
  border-radius: var(--qf-border-radius-round);
}

.dashboard__empty {
  display: flex;
  gap: var(--qf-spacing-md);
  align-items: center;
  justify-content: center;
  min-height: 166px;
  color: var(--qf-color-text-secondary);
}

.dashboard__empty--compact {
  min-height: 132px;
}

.dashboard__empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  color: var(--qf-color-primary);
  background: var(--qf-color-primary-soft);
  border-radius: var(--qf-border-radius-round);
  font-size: 19px;
}

.dashboard__empty div {
  display: grid;
  gap: var(--qf-spacing-2xs);
}

.dashboard__empty strong {
  color: var(--qf-color-text-primary);
  font-weight: var(--qf-font-weight-semibold);
}

.dashboard__empty-caption {
  font-size: var(--qf-font-size-caption);
}

.dashboard__notice-list {
  display: grid;
  gap: var(--qf-spacing-sm);
}

.dashboard__notice {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  gap: var(--qf-spacing-sm);
  align-items: center;
  min-height: 48px;
  padding-bottom: var(--qf-spacing-sm);
  border-bottom: 1px solid var(--qf-border-color);
}

.dashboard__notice:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.dashboard__notice-index {
  color: var(--qf-color-primary);
  font-size: var(--qf-font-size-caption);
  font-weight: var(--qf-font-weight-semibold);
}

.dashboard__notice-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.dashboard__notice strong {
  overflow: hidden;
  font-weight: var(--qf-font-weight-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dashboard__notice span {
  color: var(--qf-color-text-secondary);
  font-size: var(--qf-font-size-caption);
}

.dashboard__notice-arrow {
  color: var(--qf-color-text-placeholder);
  font-size: 14px;
}

.dashboard__facts {
  display: grid;
  gap: 0;
  margin: 0;
}

.dashboard__facts div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;
  border-bottom: 1px solid var(--qf-color-border-soft);
}

.dashboard__facts div:last-child {
  border-bottom: 0;
}

.dashboard__facts dt,
.dashboard__facts dd {
  margin: 0;
}

.dashboard__facts dt {
  color: var(--qf-color-text-secondary);
}

.dashboard__facts dd {
  display: inline-flex;
  gap: 3px;
  align-items: baseline;
}

.dashboard__facts dd strong {
  color: var(--qf-color-text-primary);
  font-size: var(--qf-font-size-subtitle);
  font-weight: var(--qf-font-weight-heading);
}

.dashboard__facts dd small {
  color: var(--qf-color-text-secondary);
  font-size: var(--qf-font-size-caption);
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
  .dashboard__welcome {
    min-height: 0;
    padding: var(--qf-spacing-lg);
  }

  .dashboard__welcome-meta {
    display: none;
  }

  .dashboard__welcome :deep(.qf-page-header__actions) {
    justify-content: flex-start;
  }

  .dashboard__metrics {
    grid-template-columns: 1fr;
  }
}
</style>
