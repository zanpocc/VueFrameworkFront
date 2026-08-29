<template>
  <el-breadcrumb separator="/" class="app-breadcrumb">
    <el-breadcrumb-item v-for="item in items" :key="item.path">
      <RouterLink v-if="item.to" :to="item.to">{{ item.title }}</RouterLink>
      <span v-else>{{ item.title }}</span>
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElBreadcrumb, ElBreadcrumbItem } from 'element-plus';

const route = useRoute();
const { t } = useI18n();

interface BreadcrumbItem {
  path: string;
  title: string;
  to?: string;
}

const items = computed<BreadcrumbItem[]>(() => {
  const matched = route.matched.filter((r) => r.meta?.title);
  const result: BreadcrumbItem[] = [{ path: '/', title: t('layout.breadcrumb.home'), to: '/' }];

  for (const r of matched) {
    const title = r.meta.title as string;
    if (title && title !== '首页') {
      const isLast = r === matched[matched.length - 1];
      result.push({
        path: r.path,
        title,
        to: isLast ? undefined : r.path,
      });
    }
  }

  return result;
});
</script>

<style scoped>
.app-breadcrumb {
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  white-space: nowrap;
}

.app-breadcrumb :deep(.el-breadcrumb__inner) {
  color: var(--qf-color-text-secondary);
  font-weight: 500;
}

.app-breadcrumb :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: var(--qf-color-text-primary);
  font-weight: 600;
}
</style>
