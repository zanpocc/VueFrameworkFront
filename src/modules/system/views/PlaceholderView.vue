<template>
  <QfPageShell>
    <QfPageHeader :title="title" description="该模块的管理页面将在后续里程碑中接入。" />
  </QfPageShell>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { QfPageHeader, QfPageShell } from '@/shared';

const route = useRoute();
const title = computed(() => String(route.meta.title || '平台模块'));
</script>
