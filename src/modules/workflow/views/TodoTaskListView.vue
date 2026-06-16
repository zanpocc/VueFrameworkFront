<template>
  <div>
    <QfDataTable
      :columns="columns"
      :data="table.allRows.value"
      :loading="table.loading.value"
      :actions-width="120"
    >
      <template #status="{ row }">
        <QfStatusTag :status="row.status" :mapping="TASK_STATUS_MAP" />
      </template>
      <template #actions="{ row }">
        <QfPermissionButton
          code="workflow:task:update"
          text
          type="primary"
          @click="openAction(row as WorkflowTask)"
        >
          处理
        </QfPermissionButton>
      </template>
    </QfDataTable>

    <TaskActionDialog v-model="actionVisible" :task="currentTask" @completed="table.reload()" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { QfDataTable, QfStatusTag, QfPermissionButton } from '@/shared';
import type { QfTableColumn } from '@/shared';
import { useTable } from '@/shared';
import { workflowApi, type WorkflowTask } from '@/api/workflow';
import TaskActionDialog from '../components/TaskActionDialog.vue';
import { TASK_STATUS_MAP } from '../constants';

defineOptions({ name: 'TodoTaskList' });

const columns: QfTableColumn<WorkflowTask>[] = [
  { prop: 'processTitle', label: '流程标题', minWidth: 180 },
  { prop: 'taskName', label: '任务名称', width: 140 },
  { prop: 'assignee', label: '处理人', width: 100 },
  { prop: 'status', label: '状态', width: 100, slot: 'status' },
  { prop: 'createdAt', label: '创建时间', width: 170 },
];

const table = useTable<WorkflowTask>({
  fetcher: () => workflowApi.todoTasks(),
});

const actionVisible = ref(false);
const currentTask = ref<WorkflowTask | null>(null);

function openAction(task: WorkflowTask) {
  currentTask.value = task;
  actionVisible.value = true;
}
</script>
