<template>
  <section class="qf-table-panel">
    <div class="qf-table-panel__toolbar">
      <div class="qf-table-panel__title">
        <h2>{{ title }}</h2>
        <p v-if="description">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="qf-table-panel__actions">
        <slot name="actions" />
      </div>
    </div>
    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>

<style scoped>
.qf-table-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  background: var(--qf-color-bg-surface);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
}

.qf-table-panel__toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  min-height: 54px;
  padding: 12px 14px 0;
}

.qf-table-panel__title {
  min-width: 0;
}

.qf-table-panel__title h2 {
  margin: 0;
  overflow: hidden;
  color: var(--qf-color-text-primary);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qf-table-panel__title p {
  margin: 2px 0 0;
  overflow: hidden;
  color: var(--qf-color-text-secondary);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qf-table-panel__actions {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
}

.qf-table-panel :deep(.qf-data-table) {
  gap: 0;
}

.qf-table-panel :deep(.qf-data-table__scroll) {
  padding: 0 14px;
}

.qf-table-panel :deep(.qf-data-table__pagination) {
  padding: 10px 14px 14px;
  border-top: 1px solid var(--el-border-color-extra-light);
}

.qf-table-panel :deep(.el-table) {
  border-radius: 4px;
}

@media (width <= 640px) {
  .qf-table-panel__toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .qf-table-panel__actions {
    justify-content: flex-start;
  }
}
</style>
