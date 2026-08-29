<template>
  <section class="qf-card">
    <header v-if="title || description || $slots.header || $slots.actions" class="qf-card__header">
      <div v-if="title || description || $slots.header" class="qf-card__heading">
        <slot name="header">
          <h2 v-if="title">{{ title }}</h2>
          <p v-if="description">{{ description }}</p>
        </slot>
      </div>
      <div v-if="$slots.actions" class="qf-card__actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="qf-card__body">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
  description?: string;
}>();
</script>

<style scoped>
.qf-card {
  min-width: 0;
  overflow: hidden;
  background: var(--qf-color-bg-surface);
  border: 1px solid var(--qf-color-border-soft);
  border-radius: var(--qf-border-radius);
  box-shadow: var(--qf-shadow-panel);
}

.qf-card__header {
  display: flex;
  gap: var(--qf-spacing-md);
  align-items: center;
  justify-content: space-between;
  min-height: 58px;
  padding: var(--qf-spacing-md) var(--qf-card-padding);
  border-bottom: 1px solid var(--qf-color-border-soft);
}

.qf-card__heading {
  min-width: 0;
}

.qf-card__heading h2 {
  margin: 0;
  overflow: hidden;
  color: var(--qf-color-text-primary);
  font-size: var(--qf-font-size-subtitle);
  font-weight: var(--qf-font-weight-semibold);
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qf-card__heading p {
  margin: var(--qf-spacing-2xs) 0 0;
  overflow: hidden;
  color: var(--qf-color-text-secondary);
  font-size: var(--qf-font-size-caption);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qf-card__actions {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: var(--qf-spacing-sm);
  justify-content: flex-end;
}

.qf-card__body {
  padding: var(--qf-card-padding);
}

@media (width <= 640px) {
  .qf-card__header {
    align-items: stretch;
    flex-direction: column;
  }

  .qf-card__actions {
    justify-content: flex-start;
  }
}
</style>
