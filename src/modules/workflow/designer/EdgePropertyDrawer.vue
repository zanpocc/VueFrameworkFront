<template>
  <div class="edge-property-drawer">
    <div class="drawer__header">
      <span class="drawer__title">流转属性</span>
    </div>

    <div class="drawer__body">
      <div class="drawer__field">
        <span class="drawer__label">源节点</span>
        <span class="drawer__value">{{ fromNodeName || edge.fromNodeKey }}</span>
      </div>
      <div class="drawer__field">
        <span class="drawer__label">目标节点</span>
        <span class="drawer__value">{{ toNodeName || edge.toNodeKey }}</span>
      </div>
      <div class="drawer__field">
        <span class="drawer__label">动作</span>
        <el-tag :type="actionTag" size="small">{{ edge.action }}</el-tag>
      </div>

      <template v-if="edge.conditionExpression">
        <el-divider />
        <div class="drawer__field">
          <span class="drawer__label">条件表达式</span>
        </div>
        <div class="drawer__expr">
          <code>{{ edge.conditionExpression }}</code>
        </div>
      </template>
      <div v-else class="drawer__field">
        <span class="drawer__label">条件</span>
        <span class="drawer__value drawer__value--muted">无条件</span>
      </div>

      <div class="drawer__field">
        <span class="drawer__label">排序</span>
        <span class="drawer__value">{{ edge.sortOrder }}</span>
      </div>
    </div>

    <el-divider />

    <div class="drawer__actions">
      <el-button size="small" type="danger" plain @click="$emit('delete')">删除流转</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DefinitionTransition } from '@/api/workflow';

const props = defineProps<{
  edge: DefinitionTransition;
  fromNodeName?: string;
  toNodeName?: string;
}>();

defineEmits<{
  delete: [];
}>();

const actionTag = computed(() => {
  const map: Record<string, 'success' | 'danger' | 'primary' | 'info'> = {
    APPROVE: 'success',
    REJECT: 'danger',
    SUBMIT: 'primary',
  };
  return map[props.edge.action] ?? 'info';
});
</script>

<style scoped>
.edge-property-drawer {
  font-size: 13px;
}

.drawer__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.drawer__title {
  font-weight: 600;
}

.drawer__body {
  display: grid;
  gap: 8px;
}

.drawer__field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drawer__label {
  flex: 0 0 80px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.drawer__value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drawer__value--muted {
  color: var(--el-text-color-placeholder);
}

.drawer__expr {
  padding: 6px 8px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.drawer__expr code {
  font-family: var(--el-font-family-mono, monospace);
  font-size: 12px;
  word-break: break-all;
}

.drawer__actions {
  display: flex;
  justify-content: flex-end;
}
</style>