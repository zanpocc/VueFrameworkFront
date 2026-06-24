<template>
  <div class="qf-flow-node qf-flow-node--start" :class="{ 'qf-flow-node--selected': selected }">
    <Handle type="source" :position="Position.Right" />
    <div class="qf-flow-node__icon">▶</div>
    <div class="qf-flow-node__body">
      <strong class="qf-flow-node__title">{{ data.label || '开始' }}</strong>
      <small class="qf-flow-node__key">{{ data.nodeKey }}</small>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position, type NodeProps } from '@vue-flow/core';
import type { CanvasNodeData } from '../utils/canvasTypes';

defineProps<NodeProps<CanvasNodeData>>();
</script>

<style scoped>
.qf-flow-node {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  min-width: 140px;
  padding: 8px 12px 8px 8px;
  background: var(--el-fill-color-blank);
  border: 2px solid var(--el-color-success);
  border-radius: 18px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  font-size: 13px;
}

.qf-flow-node--selected {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}

.qf-flow-node__icon {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  background: var(--el-color-success-light-9);
  border-radius: 50%;
  color: var(--el-color-success);
  font-size: 12px;
}

.qf-flow-node__body {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.qf-flow-node__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.qf-flow-node__key {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}
</style>
