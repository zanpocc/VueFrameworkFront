<template>
  <section class="page">
    <header class="page__header">
      <div>
        <h1>异步任务</h1>
        <p>查看本地消息表、任务状态、执行日志，并处理失败任务。</p>
      </div>
      <div class="task-actions">
        <el-button v-permission="'system:task:update'" @click="dispatchTasks">
          执行待处理
        </el-button>
        <el-button v-permission="'system:task:update'" type="primary" @click="openCreate">
          新建任务
        </el-button>
      </div>
    </header>

    <el-form class="page__filters" inline @submit.prevent="loadAll">
      <el-form-item label="任务状态">
        <el-select v-model="status" clearable placeholder="全部" style="width: 180px">
          <el-option label="待处理" value="PENDING" />
          <el-option label="重试中" value="RETRY" />
          <el-option label="成功" value="SUCCESS" />
          <el-option label="人工处理" value="MANUAL_REQUIRED" />
          <el-option label="已取消" value="CANCELED" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadAll"> 查询 </el-button>
      </el-form-item>
    </el-form>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="任务" name="tasks">
        <el-table v-loading="loadingTasks" :data="tasks" border row-key="id">
          <el-table-column prop="taskName" label="任务名称" min-width="160" />
          <el-table-column prop="taskType" label="类型" width="120" />
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="statusTag(row.status)">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="重试" width="100">
            <template #default="{ row }"> {{ row.retryCount }}/{{ row.maxRetries }} </template>
          </el-table-column>
          <el-table-column prop="idempotentKey" label="幂等 key" min-width="180" />
          <el-table-column prop="lastError" label="错误" min-width="180" show-overflow-tooltip />
          <el-table-column label="操作" width="220">
            <template #default="{ row }">
              <el-button text type="primary" @click="openLogs(row)"> 日志 </el-button>
              <el-button
                v-permission="'system:task:update'"
                text
                type="primary"
                :disabled="!canRetry(row.status)"
                @click="retryTask(row)"
              >
                重试
              </el-button>
              <el-button
                v-permission="'system:task:update'"
                text
                type="danger"
                :disabled="row.status === 'SUCCESS' || row.status === 'CANCELED'"
                @click="cancelTask(row)"
              >
                终止
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="本地消息" name="outbox">
        <el-table v-loading="loadingOutbox" :data="outboxMessages" border row-key="id">
          <el-table-column prop="eventType" label="事件" min-width="160" />
          <el-table-column prop="aggregateType" label="聚合" width="120" />
          <el-table-column prop="status" label="状态" width="120" />
          <el-table-column prop="idempotentKey" label="幂等 key" min-width="180" />
          <el-table-column prop="lastError" label="错误" min-width="180" show-overflow-tooltip />
          <el-table-column prop="createdAt" label="创建时间" min-width="180" />
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="createDialogVisible" title="新建任务" width="560px">
      <el-form label-position="top">
        <el-form-item label="任务类型">
          <el-select v-model="form.taskType">
            <el-option label="ECHO" value="ECHO" />
            <el-option label="ALWAYS_FAIL" value="ALWAYS_FAIL" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务名称">
          <el-input v-model="form.taskName" />
        </el-form-item>
        <el-form-item label="任务参数">
          <el-input v-model="form.taskParam" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="幂等 key">
          <el-input v-model="form.idempotentKey" />
        </el-form-item>
        <el-form-item label="最大重试次数">
          <el-input-number v-model="form.maxRetries" :min="1" :max="10" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false"> 取消 </el-button>
        <el-button type="primary" :loading="submitting" @click="submitTask"> 保存 </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="logDialogVisible" title="执行日志" width="720px">
      <el-table v-loading="loadingLogs" :data="taskLogs" border row-key="id">
        <el-table-column prop="attemptNo" label="次数" width="80" />
        <el-table-column prop="status" label="状态" width="130" />
        <el-table-column prop="message" label="消息" min-width="220" />
        <el-table-column prop="startedAt" label="开始时间" min-width="180" />
      </el-table>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  taskApi,
  type AsyncTask,
  type AsyncTaskCommand,
  type AsyncTaskLog,
  type OutboxMessage,
} from '@/api/task';

const activeTab = ref('tasks');
const status = ref('');
const loadingTasks = ref(false);
const loadingOutbox = ref(false);
const loadingLogs = ref(false);
const submitting = ref(false);
const createDialogVisible = ref(false);
const logDialogVisible = ref(false);
const tasks = ref<AsyncTask[]>([]);
const outboxMessages = ref<OutboxMessage[]>([]);
const taskLogs = ref<AsyncTaskLog[]>([]);
const form = reactive<AsyncTaskCommand>({
  taskType: 'ECHO',
  taskName: '',
  taskParam: '{}',
  idempotentKey: '',
  maxRetries: 3,
});

async function loadTasks() {
  loadingTasks.value = true;
  try {
    tasks.value = await taskApi.tasks(status.value);
  } finally {
    loadingTasks.value = false;
  }
}

async function loadOutbox() {
  loadingOutbox.value = true;
  try {
    outboxMessages.value = await taskApi.outbox();
  } finally {
    loadingOutbox.value = false;
  }
}

async function loadAll() {
  await Promise.all([loadTasks(), loadOutbox()]);
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
    await loadAll();
  } finally {
    submitting.value = false;
  }
}

async function dispatchTasks() {
  const count = await taskApi.dispatch();
  ElMessage.success(`已执行 ${count} 个任务`);
  await loadAll();
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

async function retryTask(row: AsyncTask) {
  await taskApi.retryTask(row.id);
  ElMessage.success('任务已重新入队');
  await loadAll();
}

async function cancelTask(row: AsyncTask) {
  await ElMessageBox.confirm(`确认终止任务 ${row.taskName}？`, '终止任务', { type: 'warning' });
  await taskApi.cancelTask(row.id);
  ElMessage.success('任务已终止');
  await loadAll();
}

function canRetry(taskStatus: string) {
  return ['FAILED', 'MANUAL_REQUIRED', 'CANCELED'].includes(taskStatus);
}

function statusTag(taskStatus: string) {
  if (taskStatus === 'SUCCESS') {
    return 'success';
  }
  if (taskStatus === 'MANUAL_REQUIRED' || taskStatus === 'FAILED') {
    return 'danger';
  }
  if (taskStatus === 'RETRY') {
    return 'warning';
  }
  return 'info';
}

onMounted(loadAll);
</script>

<style scoped>
.task-actions {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}
</style>
