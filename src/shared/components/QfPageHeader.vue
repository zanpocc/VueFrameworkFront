<template>
  <header class="qf-page-header">
    <div class="qf-page-header__copy">
      <h1>{{ title }}</h1>
      <p v-if="description || $slots.description">
        <slot name="description">{{ description }}</slot>
      </p>
    </div>
    <div v-if="$slots.actions" class="qf-page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>

<style scoped>
.qf-page-header {
  display: flex;
  gap: var(--qf-spacing-lg);
  align-items: flex-start;
  justify-content: space-between;
}

.qf-page-header__copy {
  min-width: 0;
}

.qf-page-header h1 {
  margin: 0 0 var(--qf-spacing-2xs);
  color: var(--qf-color-text-primary);
  font-size: var(--qf-font-size-heading);
  font-weight: var(--qf-font-weight-heading);
  line-height: 1.3;
  letter-spacing: -0.01em;
}

.qf-page-header p {
  margin: 0;
  color: var(--qf-color-text-secondary);
  font-size: var(--qf-font-size-body);
  line-height: var(--qf-line-height-body);
}

.qf-page-header__actions {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: var(--qf-spacing-sm);
  align-items: center;
  justify-content: flex-end;
}

@media (width <= 640px) {
  .qf-page-header {
    align-items: stretch;
    flex-direction: column;
  }

  .qf-page-header__actions {
    justify-content: flex-start;
  }
}
</style>
