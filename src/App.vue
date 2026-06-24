<template>
  <el-config-provider :locale="localeStore.elementLocale">
    <RouterView />
  </el-config-provider>
</template>

<script setup lang="ts">
import { ElConfigProvider } from 'element-plus';
import { useLocaleStore } from '@/stores/locale';

// Reactive Element Plus locale so el-table / el-pagination 内置文案跟随切换。
const localeStore = useLocaleStore();
</script>
