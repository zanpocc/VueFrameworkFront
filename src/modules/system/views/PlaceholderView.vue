<template>
  <section class="placeholder-view">
    <h1>{{ title }}</h1>
    <p>该模块的管理页面将在后续里程碑中接入。</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const title = computed(() => String(route.meta.title || '平台模块'));
</script>

<style scoped>
.placeholder-view {
  display: grid;
  gap: 8px;
}

.placeholder-view h1 {
  margin: 0;
  font-size: 24px;
}

.placeholder-view p {
  margin: 0;
  color: #64748b;
}
</style>
