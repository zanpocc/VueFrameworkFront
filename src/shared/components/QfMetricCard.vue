<template>
  <QfCard class="qf-metric-card" :class="`qf-metric-card--${tone}`">
    <div class="qf-metric-card__body">
      <div class="qf-metric-card__icon" aria-hidden="true">
        <el-icon v-if="icon"><component :is="icon" /></el-icon>
      </div>
      <div class="qf-metric-card__content">
        <span class="qf-metric-card__label">{{ label }}</span>
        <strong class="qf-metric-card__value">{{ loading ? '...' : value }}</strong>
        <small class="qf-metric-card__caption">{{ error ? '加载失败' : caption }}</small>
      </div>
    </div>
  </QfCard>
</template>

<script setup lang="ts">
import QfCard from './QfCard.vue';

type MetricTone = 'primary' | 'success' | 'warning' | 'danger';

withDefaults(
  defineProps<{
    label: string;
    value: string | number;
    caption: string;
    tone?: MetricTone;
    icon?: object;
    loading?: boolean;
    error?: boolean;
  }>(),
  {
    tone: 'primary',
    icon: undefined,
    loading: false,
    error: false,
  },
);
</script>

<style scoped>
.qf-metric-card {
  --qf-metric-color: var(--el-color-primary);

  position: relative;
  overflow: hidden;
  min-height: 132px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.qf-metric-card :deep(.qf-card__body) {
  padding: 0;
}

.qf-metric-card__body {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: var(--qf-spacing-md);
  align-items: center;
  min-height: 132px;
  padding: var(--qf-spacing-lg);
}

.qf-metric-card::after {
  position: absolute;
  right: -34px;
  bottom: -48px;
  width: 136px;
  height: 136px;
  background: var(--qf-metric-color);
  border-radius: var(--qf-border-radius-round);
  content: '';
  opacity: 0.045;
}

.qf-metric-card:hover {
  border-color: color-mix(in srgb, var(--qf-metric-color) 28%, var(--qf-color-border-soft));
  box-shadow: var(--qf-shadow-panel-hover);
  transform: translateY(-2px);
}

.qf-metric-card--success {
  --qf-metric-color: var(--el-color-success);
}

.qf-metric-card--warning {
  --qf-metric-color: var(--el-color-warning);
}

.qf-metric-card--danger {
  --qf-metric-color: var(--el-color-danger);
}

.qf-metric-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: var(--qf-metric-color);
  background: color-mix(in srgb, var(--qf-metric-color) 12%, transparent);
  border-radius: var(--qf-border-radius-lg);
  font-size: 21px;
}

.qf-metric-card__content {
  display: grid;
  min-width: 0;
  gap: var(--qf-spacing-2xs);
}

.qf-metric-card__label,
.qf-metric-card__caption {
  overflow: hidden;
  color: var(--qf-color-text-secondary);
  text-overflow: ellipsis;
}

.qf-metric-card__label {
  font-size: var(--qf-font-size-body);
  font-weight: var(--qf-font-weight-semibold);
  white-space: nowrap;
}

.qf-metric-card__value {
  color: var(--qf-color-text-primary);
  font-size: 30px;
  font-weight: var(--qf-font-weight-heading);
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.qf-metric-card__caption {
  display: -webkit-box;
  font-size: var(--qf-font-size-caption);
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>
