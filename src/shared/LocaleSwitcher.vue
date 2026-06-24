<template>
  <el-dropdown trigger="click" @command="onCommand">
    <el-button text>
      <el-icon><Globe /></el-icon>
      <span class="locale-switcher__label">{{ currentLabel }}</span>
      <el-icon><ArrowDown /></el-icon>
    </el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="option in options"
          :key="option.value"
          :command="option.value"
          :disabled="option.value === store.locale"
        >
          {{ option.label }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ArrowDown } from '@element-plus/icons-vue';
// Element Plus 没有 Globe，用 Place 兜底地球图标。
import { Place as Globe } from '@element-plus/icons-vue';
import { useLocaleStore } from '@/stores/locale';
import type { AppLocale } from '@/locales';

const store = useLocaleStore();

const options: { value: AppLocale; label: string }[] = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' },
];

const currentLabel = computed(
  () => options.find((option) => option.value === store.locale)?.label ?? store.locale,
);

function onCommand(value: string) {
  store.setLocale(value as AppLocale);
}
</script>

<style scoped>
.locale-switcher__label {
  margin: 0 4px;
}
</style>
