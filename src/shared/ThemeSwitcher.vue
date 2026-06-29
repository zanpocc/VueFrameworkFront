<template>
  <el-dropdown trigger="click" @command="onCommand">
    <el-button text :title="t('layout.topbar.theme.label')">
      <el-icon><component :is="currentIcon" /></el-icon>
      <el-icon><ArrowDown /></el-icon>
    </el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="option in options"
          :key="option.value"
          :command="option.value"
          :disabled="option.value === store.mode"
        >
          <el-icon><component :is="option.icon" /></el-icon>
          <span class="theme-switcher__label">{{ t(option.labelKey) }}</span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue';
import { ArrowDown, Monitor, Moon, Sunny } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { useThemeStore, type ThemeMode } from '@/stores/theme';

const { t } = useI18n();
const store = useThemeStore();

const options: { value: ThemeMode; labelKey: string; icon: Component }[] = [
  { value: 'light', labelKey: 'layout.topbar.theme.light', icon: Sunny },
  { value: 'dark', labelKey: 'layout.topbar.theme.dark', icon: Moon },
  { value: 'system', labelKey: 'layout.topbar.theme.system', icon: Monitor },
];

const currentIcon = computed(
  () => options.find((option) => option.value === store.mode)?.icon ?? Monitor,
);

function onCommand(value: string) {
  store.setMode(value as ThemeMode);
}
</script>

<style scoped>
.theme-switcher__label {
  margin-left: 6px;
}
</style>
