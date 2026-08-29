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
  gap: 0;
  min-width: 0;
  background: var(--qf-color-bg-surface);
  border: 1px solid var(--qf-color-border-soft);
  border-radius: var(--qf-border-radius);
  box-shadow: 0 1px 2px rgb(15 23 42 / 3%);
}

.qf-table-panel__toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  min-height: 58px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid var(--qf-color-border-soft);
}

.qf-table-panel__title {
  min-width: 0;
}

.qf-table-panel__title h2 {
  margin: 0;
  overflow: hidden;
  color: var(--qf-color-text-primary);
  font-size: 15px;
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
  padding: 0 16px;
}

.qf-table-panel :deep(.qf-data-table__pagination) {
  padding: 12px 16px 14px;
  border-top: 1px solid var(--qf-color-border-soft);
}

.qf-table-panel :deep(.el-table) {
  border-radius: 4px;
}

@media (width <= 640px) {
  .qf-table-panel__toolbar {
    align-items: stretch;
    flex-direction: column;
    padding-bottom: 14px;
  }

  .qf-table-panel__actions {
    justify-content: flex-start;
  }
}
</style>
