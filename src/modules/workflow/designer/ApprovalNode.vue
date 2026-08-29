<template>
  <div class="qf-flow-node qf-flow-node--approval" :class="{ 'qf-flow-node--selected': selected }">
    <Handle type="target" :position="Position.Left" />
    <div class="qf-flow-node__body">
      <div class="qf-flow-node__head">
        <strong class="qf-flow-node__title">{{ data.label || data.nodeKey }}</strong>
        <span class="qf-flow-node__type-tag">审批</span>
      </div>
      <small class="qf-flow-node__key">{{ data.nodeKey }}</small>
      <small v-if="data.assigneeValue" class="qf-flow-node__assignee">
        {{ assigneeTypeLabel(data.assigneeType) }} / {{ data.assigneeValue }}
      </small>
      <small v-else class="qf-flow-node__assignee qf-flow-node__assignee--empty">
        未配置审批人
      </small>
    </div>
    <Handle type="source" :position="Position.Right" />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position, type NodeProps } from '@vue-flow/core';
import type { CanvasNodeData } from '../utils/canvasTypes';

defineProps<NodeProps<CanvasNodeData>>();

function assigneeTypeLabel(type?: string | null): string {
  const map: Record<string, string> = {
    USER: '用户',
    ROLE: '角色',
    DEPT: '部门',
    POST: '岗位',
  };
  return map[type ?? ''] ?? type ?? '';
}
</script>

<style scoped>
.qf-flow-node {
  display: grid;
  gap: 4px;
  min-width: 170px;
  padding: 10px 14px;
  background: var(--el-fill-color-blank);
  border: 2px solid var(--el-color-warning);
  border-radius: 8px;
  box-shadow: 0 1px 4px rgb(0 0 0 / 8%);
  font-size: 13px;
}

.qf-flow-node--selected {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}

.qf-flow-node__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.qf-flow-node__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.qf-flow-node__type-tag {
  flex: 0 0 auto;
  padding: 1px 6px;
  background: var(--el-color-warning-light-9);
  border-radius: 4px;
  color: var(--el-color-warning);
  font-size: 11px;
}

.qf-flow-node__key,
.qf-flow-node__assignee {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.qf-flow-node__assignee--empty {
  color: var(--el-color-danger);
}
</style>
