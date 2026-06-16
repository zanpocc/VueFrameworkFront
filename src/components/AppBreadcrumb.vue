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
import { ElBreadcrumb, ElBreadcrumbItem } from 'element-plus';

const route = useRoute();

interface BreadcrumbItem {
  path: string;
  title: string;
  to?: string;
}

const items = computed<BreadcrumbItem[]>(() => {
  const matched = route.matched.filter((r) => r.meta?.title);
  const result: BreadcrumbItem[] = [{ path: '/', title: '首页', to: '/' }];

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
  font-size: 13px;
}
</style>
