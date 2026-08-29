<template>
  <section class="qf-table-panel">
    <div
      v-if="title || description || $slots.title || $slots.actions"
      class="qf-table-panel__toolbar"
    >
      <div class="qf-table-panel__title">
        <h2 v-if="title || $slots.title">
          <slot name="title">{{ title }}</slot>
        </h2>
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
  title?: string;
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
  box-shadow: var(--qf-shadow-panel);
}

.qf-table-panel__toolbar {
  display: flex;
  gap: var(--qf-spacing-lg);
  align-items: center;
  justify-content: space-between;
  min-height: 58px;
  padding: var(--qf-spacing-md) var(--qf-card-padding) var(--qf-spacing-sm);
  border-bottom: 1px solid var(--qf-color-border-soft);
}

.qf-table-panel__title {
  min-width: 0;
}

.qf-table-panel__title h2 {
  margin: 0;
  overflow: hidden;
  color: var(--qf-color-text-primary);
  font-size: var(--qf-font-size-subtitle);
  font-weight: 700;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qf-table-panel__title p {
  margin: var(--qf-spacing-2xs) 0 0;
  overflow: hidden;
  color: var(--qf-color-text-secondary);
  font-size: var(--qf-font-size-caption);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qf-table-panel__actions {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: var(--qf-spacing-sm);
  align-items: center;
  justify-content: flex-end;
}

.qf-table-panel :deep(.qf-data-table) {
  gap: 0;
}

.qf-table-panel :deep(.qf-data-table__scroll) {
  padding: 0 var(--qf-card-padding);
}

.qf-table-panel :deep(.qf-data-table__pagination) {
  padding: var(--qf-spacing-md) var(--qf-card-padding) var(--qf-spacing-lg);
  border-top: 1px solid var(--qf-color-border-soft);
}

.qf-table-panel :deep(.el-table) {
  border-radius: var(--qf-border-radius-sm);
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
