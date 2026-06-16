<template>
  <section class="page">
    <header class="page__header">
      <div>
        <h1>异步任务</h1>
        <p>查看本地消息、任务状态、执行日志，并处理失败任务。</p>
      </div>
      <div class="task-actions">
        <QfPermissionButton code="system:task:update" @click="dispatchTasks">
          执行待处理
        </QfPermissionButton>
        <QfPermissionButton code="system:task:update" type="primary" @click="openCreate">
          新建任务
        </QfPermissionButton>
      </div>
    </header>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="任务" name="tasks">
        <QfDataTable
          :columns="taskColumns"
          :data="taskTable.allRows.value"
          :loading="taskTable.loading.value"
          :page-size="20"
        >
          <template #status="{ row }">
            <QfStatusTag :status="row.status" :mapping="statusMapping" />
          </template>
          <template #retryInfo="{ row }"> {{ row.retryCount }}/{{ row.maxRetries }} </template>
          <template #actions="{ row }">
            <QfTableActions :actions="getTaskActions(row as AsyncTask)" :max-inline="2" />
          </template>
        </QfDataTable>
      </el-tab-pane>

      <el-tab-pane label="本地消息" name="outbox">
        <QfDataTable
          :columns="outboxColumns"
          :data="outboxTable.allRows.value"
          :loading="outboxTable.loading.value"
          :page-size="20"
          :actions-width="140"
        >
          <template #actions="{ row }">
            <QfTableActions :actions="getOutboxActions(row as OutboxMessage)" />
          </template>
        </QfDataTable>
      </el-tab-pane>
    </el-tabs>

    <QfFormDialog
      v-model="createDialogVisible"
      title="新建任务"
      :model="form"
      :rules="rules"
      :loading="submitting"
      width="560px"
      @submit="submitTask"
    >
      <el-form-item label="任务类型" prop="taskType">
        <el-select v-model="form.taskType">
          <el-option label="ECHO" value="ECHO" />
          <el-option label="ALWAYS_FAIL" value="ALWAYS_FAIL" />
        </el-select>
      </el-form-item>
      <el-form-item label="任务名称" prop="taskName">
        <el-input v-model="form.taskName" />
      </el-form-item>
      <el-form-item label="任务参数" prop="taskParam">
        <el-input v-model="form.taskParam" type="textarea" :rows="4" />
      </el-form-item>
      <el-form-item label="幂等 key" prop="idempotentKey">
        <el-input v-model="form.idempotentKey" />
      </el-form-item>
      <el-form-item label="最大重试次数" prop="maxRetries">
        <el-input-number v-model="form.maxRetries" :min="1" :max="10" />
      </el-form-item>
    </QfFormDialog>

    <QfDetailDrawer v-model="detailDialogVisible" title="任务详情" width="760px">
      <el-descriptions v-if="selectedTask" :column="2" border>
        <el-descriptions-item label="任务名称">{{ selectedTask.taskName }}</el-descriptions-item>
        <el-descriptions-item label="任务类型">{{ selectedTask.taskType }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ selectedTask.status }}</el-descriptions-item>
        <el-descriptions-item label="重试">
          {{ selectedTask.retryCount }}/{{ selectedTask.maxRetries }}
        </el-descriptions-item>
        <el-descriptions-item label="幂等 key" :span="2">
          {{ selectedTask.idempotentKey }}
        </el-descriptions-item>
        <el-descriptions-item label="最后错误" :span="2">
          {{ selectedTask.lastError || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="处理动作">{{
          selectedTask.manualAction || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="处理人">{{
          selectedTask.manualHandledBy || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="处理意见" :span="2">
          {{ selectedTask.manualComment || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ selectedTask.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ selectedTask.updatedAt }}</el-descriptions-item>
      </el-descriptions>
      <h3 class="detail-title">任务参数</h3>
      <pre class="json-block">{{ formatJson(selectedTask?.taskParam) }}</pre>
    </QfDetailDrawer>

    <QfDetailDrawer v-model="outboxDetailVisible" title="本地消息详情" width="760px">
      <el-descriptions v-if="selectedOutbox" :column="2" border>
        <el-descriptions-item label="事件">{{ selectedOutbox.eventType }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ selectedOutbox.status }}</el-descriptions-item>
        <el-descriptions-item label="聚合">{{ selectedOutbox.aggregateType }}</el-descriptions-item>
        <el-descriptions-item label="聚合 ID">{{
          selectedOutbox.aggregateId
        }}</el-descriptions-item>
        <el-descriptions-item label="幂等 key" :span="2">
          {{ selectedOutbox.idempotentKey || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="最后错误" :span="2">
          {{ selectedOutbox.lastError || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ selectedOutbox.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="发布时间">
          {{ selectedOutbox.publishedAt || '-' }}
        </el-descriptions-item>
      </el-descriptions>
      <h3 class="detail-title">消息 payload</h3>
      <pre class="json-block">{{ formatJson(selectedOutbox?.payload) }}</pre>
    </QfDetailDrawer>

    <QfDetailDrawer
      v-model="logDialogVisible"
      title="执行日志"
      width="720px"
      :loading="loadingLogs"
    >
      <QfDataTable :columns="logColumns" :data="taskLogs" :loading="loadingLogs" :page-size="10" />
    </QfDetailDrawer>
  </section>
</template>

<script setup lang="ts">
defineOptions({ name: 'TaskList' });
import { reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormRules } from 'element-plus';
import {
  QfDataTable,
  QfDetailDrawer,
  QfFormDialog,
  QfPermissionButton,
  QfStatusTag,
  QfTableActions,
} from '@/shared';
import type { QfTableColumn, QfActionItem } from '@/shared';
import { useTable } from '@/shared';
import {
  taskApi,
  type AsyncTask,
  type AsyncTaskCommand,
  type AsyncTaskLog,
  type OutboxMessage,
} from '@/api/task';

const statusMapping: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  SUCCESS: 'success',
  FAILED: 'danger',
  MANUAL_REQUIRED: 'warning',
  RETRY: 'warning',
  PENDING: 'info',
  CANCELED: 'info',
  IGNORED: 'info',
};

const taskColumns: QfTableColumn<AsyncTask>[] = [
  { prop: 'taskName', label: '任务名称', minWidth: 160 },
  { prop: 'taskType', label: '类型', width: 120 },
  { prop: 'status', label: '状态', width: 120, slot: 'status' },
  { prop: 'retryCount', label: '重试', width: 100, slot: 'retryInfo' },
  { prop: 'idempotentKey', label: '幂等 key', minWidth: 180 },
  { prop: 'lastError', label: '错误', minWidth: 180, showOverflowTooltip: true },
];

const outboxColumns: QfTableColumn<OutboxMessage>[] = [
  { prop: 'eventType', label: '事件', minWidth: 160 },
  { prop: 'aggregateType', label: '聚合', width: 120 },
  { prop: 'status', label: '状态', width: 120 },
  { prop: 'idempotentKey', label: '幂等 key', minWidth: 180 },
  { prop: 'lastError', label: '错误', minWidth: 180, showOverflowTooltip: true },
  { prop: 'createdAt', label: '创建时间', minWidth: 180 },
];

const logColumns: QfTableColumn<AsyncTaskLog>[] = [
  { prop: 'attemptNo', label: '次数', width: 80 },
  { prop: 'status', label: '状态', width: 130 },
  { prop: 'message', label: '消息', minWidth: 220 },
  { prop: 'startedAt', label: '开始时间', minWidth: 180 },
];

const activeTab = ref('tasks');
const loadingLogs = ref(false);
const submitting = ref(false);
const createDialogVisible = ref(false);
const detailDialogVisible = ref(false);
const outboxDetailVisible = ref(false);
const logDialogVisible = ref(false);
const taskLogs = ref<AsyncTaskLog[]>([]);
const selectedTask = ref<AsyncTask | null>(null);
const selectedOutbox = ref<OutboxMessage | null>(null);
const form = reactive<AsyncTaskCommand>({
  taskType: 'ECHO',
  taskName: '',
  taskParam: '{}',
  idempotentKey: '',
  maxRetries: 3,
});

const rules: FormRules<AsyncTaskCommand> = {
  taskType: [{ required: true, message: '请选择任务类型', trigger: 'change' }],
  taskName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  taskParam: [
    {
      validator: (_rule, value, callback) => {
        try {
          JSON.parse(value || '{}');
          callback();
        } catch {
          callback(new Error('请输入合法 JSON'));
        }
      },
      trigger: 'blur',
    },
  ],
  idempotentKey: [{ required: true, message: '请输入幂等 key', trigger: 'blur' }],
  maxRetries: [{ required: true, message: '请输入最大重试次数', trigger: 'change' }],
};

const taskTable = useTable<AsyncTask, { status: string }>({
  fetcher: (filters) => taskApi.tasks(filters.status),
  defaultFilters: { status: '' },
});

const outboxTable = useTable<OutboxMessage>({
  fetcher: () => taskApi.outbox(),
});

function canRetry(taskStatus: string) {
  return ['FAILED', 'MANUAL_REQUIRED', 'CANCELED'].includes(taskStatus);
}

function canIgnore(taskStatus: string) {
  return taskStatus === 'MANUAL_REQUIRED';
}

function canRestore(taskStatus: string) {
  return taskStatus === 'IGNORED';
}

function canRetryOutbox(status: string) {
  return status === 'FAILED';
}

function getTaskActions(row: AsyncTask): QfActionItem[] {
  return [
    { label: '详情', handler: () => openTaskDetail(row) },
    { label: '日志', handler: () => openLogs(row) },
    {
      label: '重试',
      permission: 'system:task:update',
      disabled: !canRetry(row.status),
      handler: () => retryTask(row),
    },
    {
      label: '忽略',
      type: 'danger',
      permission: 'system:task:update',
      disabled: !canIgnore(row.status),
      handler: () => ignoreTask(row),
    },
    {
      label: '恢复',
      permission: 'system:task:update',
      disabled: !canRestore(row.status),
      handler: () => restoreTask(row),
    },
    {
      label: '终止',
      type: 'danger',
      permission: 'system:task:update',
      disabled: row.status === 'SUCCESS' || row.status === 'CANCELED',
      handler: () => cancelTask(row),
    },
  ];
}

function getOutboxActions(row: OutboxMessage): QfActionItem[] {
  return [
    { label: '详情', handler: () => openOutboxDetail(row) },
    {
      label: '重试',
      permission: 'system:task:update',
      disabled: !canRetryOutbox(row.status),
      handler: () => retryOutbox(row),
    },
  ];
}

async function dispatchTasks() {
  const count = await taskApi.dispatch();
  ElMessage.success(`已执行 ${count} 个任务`);
  await Promise.all([taskTable.reload(), outboxTable.reload()]);
}

function openCreate() {
  Object.assign(form, {
    taskType: 'ECHO',
    taskName: '',
    taskParam: '{}',
    idempotentKey: `task-${Date.now()}`,
    maxRetries: 3,
  });
  createDialogVisible.value = true;
}

async function submitTask() {
  submitting.value = true;
  try {
    await taskApi.createTask(form);
    ElMessage.success('任务已创建');
    createDialogVisible.value = false;
    await Promise.all([taskTable.reload(), outboxTable.reload()]);
  } finally {
    submitting.value = false;
  }
}

async function openLogs(row: AsyncTask) {
  logDialogVisible.value = true;
  loadingLogs.value = true;
  try {
    taskLogs.value = await taskApi.taskLogs(row.id);
  } finally {
    loadingLogs.value = false;
  }
}

async function openTaskDetail(row: AsyncTask) {
  detailDialogVisible.value = true;
  selectedTask.value = await taskApi.taskDetail(row.id);
}

function openOutboxDetail(row: OutboxMessage) {
  selectedOutbox.value = row;
  outboxDetailVisible.value = true;
}

function formatJson(value: string | null | undefined) {
  if (!value) {
    return '-';
  }
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

async function retryTask(row: AsyncTask) {
  const comment = await promptComment('重试任务', `请输入 ${row.taskName} 的重试说明`);
  await taskApi.retryTask(row.id, comment);
  ElMessage.success('任务已重新入队');
  await Promise.all([taskTable.reload(), outboxTable.reload()]);
}

async function retryOutbox(row: OutboxMessage) {
  await taskApi.retryOutbox(row.id);
  ElMessage.success('本地消息已重新入队');
  await outboxTable.reload();
}

async function cancelTask(row: AsyncTask) {
  const comment = await promptComment('终止任务', `请输入终止 ${row.taskName} 的处理意见`);
  await taskApi.cancelTask(row.id, comment);
  ElMessage.success('任务已终止');
  await Promise.all([taskTable.reload(), outboxTable.reload()]);
}

async function ignoreTask(row: AsyncTask) {
  const comment = await promptComment('忽略任务', `请输入忽略 ${row.taskName} 的处理意见`);
  await taskApi.ignoreTask(row.id, comment);
  ElMessage.success('任务已忽略');
  await Promise.all([taskTable.reload(), outboxTable.reload()]);
}

async function restoreTask(row: AsyncTask) {
  const comment = await promptComment('恢复任务', `请输入恢复 ${row.taskName} 的处理意见`);
  await taskApi.restoreTask(row.id, comment);
  ElMessage.success('任务已恢复到人工介入');
  await Promise.all([taskTable.reload(), outboxTable.reload()]);
}

async function promptComment(title: string, message: string) {
  const result = await ElMessageBox.prompt(message, title, {
    inputType: 'textarea',
    inputPlaceholder: '请输入处理意见',
    inputValidator: (value) => (value && value.trim().length > 0) || '请输入处理意见',
    type: 'warning',
  });
  return result.value.trim();
}
</script>

<style scoped>
.task-actions {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.detail-title {
  margin: 16px 0 8px;
  font-size: 14px;
  font-weight: 600;
}

.json-block {
  max-height: 280px;
  padding: 12px;
  overflow: auto;
  color: #1f2937;
  white-space: pre-wrap;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}
</style>
