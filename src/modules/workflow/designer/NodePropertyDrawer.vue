<template>
  <div class="node-property-drawer">
    <div class="drawer__header">
      <span class="drawer__title">节点属性</span>
      <el-button size="small" type="primary" @click="$emit('edit')">编辑</el-button>
    </div>

    <div class="drawer__body">
      <div class="drawer__field">
        <span class="drawer__label">名称</span>
        <span class="drawer__value">{{ node.nodeName }}</span>
      </div>
      <div class="drawer__field">
        <span class="drawer__label">编码</span>
        <span class="drawer__value"><code>{{ node.nodeKey }}</code></span>
      </div>
      <div class="drawer__field">
        <span class="drawer__label">类型</span>
        <el-tag :type="typeTag" size="small">{{ typeLabel }}</el-tag>
      </div>

      <template v-if="node.nodeType === 'APPROVAL'">
        <el-divider />
        <div class="drawer__field">
          <span class="drawer__label">审批人类型</span>
          <span class="drawer__value">{{ assigneeTypeLabel }}</span>
        </div>
        <div class="drawer__field">
          <span class="drawer__label">审批人</span>
          <span class="drawer__value">{{ node.assigneeValue ?? '-' }}</span>
        </div>
        <div class="drawer__field">
          <span class="drawer__label">会签模式</span>
          <span class="drawer__value">{{ multiModeLabel }}</span>
        </div>
      </template>

      <div class="drawer__field">
        <span class="drawer__label">排序</span>
        <span class="drawer__value">{{ node.sortOrder }}</span>
      </div>
    </div>

    <el-divider />

    <div class="drawer__actions">
      <el-button size="small" type="danger" plain @click="$emit('delete')">删除节点</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DefinitionNode } from '@/api/workflow';

const props = defineProps<{
  node: DefinitionNode;
}>();

defineEmits<{
  edit: [];
  delete: [];
}>();

const assigneeTypeLabel = computed(() => {
  const map: Record<string, string> = {
    USER: '用户',
    ROLE: '角色',
    DEPT: '部门',
    POST: '岗位',
    ALL: '全部',
  };
  return map[props.node.assigneeType] ?? props.node.assigneeType;
});

const multiModeLabel = computed(() => {
  const map: Record<string, string> = {
    COUNTERSIGN: '会签',
  };
  return map[props.node.multiMode ?? ''] ?? '-';
});

const typeLabel = computed(() => {
  const map: Record<string, string> = { START: '开始', APPROVAL: '审批', END: '结束' };
  return map[props.node.nodeType] ?? props.node.nodeType;
});

const typeTag = computed(() => {
  const map: Record<string, 'success' | 'warning' | 'info'> = {
    START: 'success',
    APPROVAL: 'warning',
    END: 'info',
  };
  return map[props.node.nodeType] ?? 'info';
});
</script>

<style scoped>
.node-property-drawer {
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

.drawer__value code {
  font-family: var(--el-font-family-mono, monospace);
  font-size: 12px;
}

.drawer__actions {
  display: flex;
  justify-content: flex-end;
}
</style>