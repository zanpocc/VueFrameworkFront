<template>
  <section class="qf-search-panel">
    <el-form class="qf-search-panel__form" label-position="left" @submit.prevent="emit('search')">
      <div class="qf-search-panel__fields">
        <slot />
        <template v-if="expanded">
          <slot name="more" />
        </template>
      </div>
      <div class="qf-search-panel__actions">
        <el-button type="primary" :icon="Search" @click="emit('search')">查询</el-button>
        <el-button :icon="Refresh" @click="emit('reset')">重置</el-button>
        <el-button v-if="$slots.more" text type="primary" @click="expanded = !expanded">
          更多
          <el-icon class="qf-search-panel__more-icon" :class="{ 'is-expanded': expanded }">
            <ArrowDown />
          </el-icon>
        </el-button>
      </div>
    </el-form>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ArrowDown, Refresh, Search } from '@element-plus/icons-vue';

const expanded = ref(false);

const emit = defineEmits<{
  (event: 'search'): void;
  (event: 'reset'): void;
}>();
</script>

<style scoped>
.qf-search-panel {
  padding: 14px 16px;
  background: var(--qf-color-bg-surface);
  border: 1px solid var(--qf-color-border-soft);
  border-radius: var(--qf-border-radius);
  box-shadow: 0 1px 2px rgb(15 23 42 / 3%);
}

.qf-search-panel__form {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}

.qf-search-panel__fields {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 10px 22px;
  min-width: 0;
}

.qf-search-panel__actions {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
  padding-left: 18px;
  border-left: 1px solid var(--qf-color-border-soft);
}

.qf-search-panel__more-icon {
  margin-left: 2px;
  transition: transform 0.15s ease;
}

.qf-search-panel__more-icon.is-expanded {
  transform: rotate(180deg);
}

:deep(.el-form-item) {
  align-items: center;
  margin: 0;
}

:deep(.el-form-item__label) {
  height: 32px;
  padding-right: 10px;
  color: var(--qf-color-text-secondary);
  font-weight: 500;
  line-height: 32px;
}

@media (width <= 900px) {
  .qf-search-panel__form {
    flex-direction: column;
  }

  .qf-search-panel__actions {
    width: 100%;
    padding-left: 0;
    border-left: 0;
    justify-content: flex-end;
  }
}

@media (width <= 640px) {
  .qf-search-panel__actions {
    justify-content: flex-start;
  }
}
</style>
