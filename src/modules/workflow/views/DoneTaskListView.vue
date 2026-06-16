<template>
  <div>
    <QfDataTable :columns="columns" :data="table.allRows.value" :loading="table.loading.value">
      <template #status="{ row }">
        <QfStatusTag :status="row.status" :mapping="TASK_STATUS_MAP" />
      </template>
    </QfDataTable>
  </div>
</template>

<script setup lang="ts">
import { QfDataTable, QfStatusTag } from '@/shared';
import type { QfTableColumn } from '@/shared';
import { useTable } from '@/shared';
import { workflowApi, type WorkflowTask } from '@/api/workflow';
import { TASK_STATUS_MAP } from '../constants';

defineOptions({ name: 'DoneTaskList' });

const columns: QfTableColumn<WorkflowTask>[] = [
  { prop: 'processTitle', label: '流程标题', minWidth: 180 },
  { prop: 'taskName', label: '任务名称', width: 140 },
  { prop: 'assignee', label: '处理人', width: 100 },
  { prop: 'status', label: '状态', width: 100, slot: 'status' },
  { prop: 'createdAt', label: '创建时间', width: 170 },
  { prop: 'completedAt', label: '完成时间', width: 170 },
];

const table = useTable<WorkflowTask>({
  fetcher: () => workflowApi.doneTasks(),
});
</script>
