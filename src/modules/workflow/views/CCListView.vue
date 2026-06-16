<template>
  <div>
    <QfDataTable
      :columns="columns"
      :data="table.allRows.value"
      :loading="table.loading.value"
      :actions-width="120"
    >
      <template #readStatus="{ row }">
        <QfStatusTag :status="row.readAt ? 'read' : 'unread'" :mapping="READ_STATUS_MAP" />
      </template>
      <template #actions="{ row }">
        <el-button v-if="!row.readAt" text type="primary" @click="markRead(row as CCRecord)">
          标记已读
        </el-button>
        <span v-else class="cc-list__read">已读</span>
      </template>
    </QfDataTable>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { QfDataTable, QfStatusTag } from '@/shared';
import type { QfTableColumn } from '@/shared';
import { useTable } from '@/shared';
import { workflowApi, type CCRecord } from '@/api/workflow';

defineOptions({ name: 'CCList' });

const READ_STATUS_MAP = {
  read: 'success',
  unread: 'warning',
} as const satisfies Record<string, 'success' | 'warning' | 'danger' | 'info'>;

const columns: QfTableColumn<CCRecord>[] = [
  { prop: 'title', label: '标题', minWidth: 180 },
  { prop: 'ccFrom', label: '抄送人', width: 100 },
  { prop: 'nodeKey', label: '节点', width: 120 },
  { prop: 'createdAt', label: '抄送时间', width: 170 },
  { prop: 'readAt', label: '阅读状态', width: 100, slot: 'readStatus' },
];

const table = useTable<CCRecord>({
  fetcher: () => workflowApi.getCCList(),
});

async function markRead(row: CCRecord) {
  await workflowApi.markCCRead(row.id);
  ElMessage.success('已标记为已读');
  await table.reload();
}
</script>

<style scoped>
.cc-list__read {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
