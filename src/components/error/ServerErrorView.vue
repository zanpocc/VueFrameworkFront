<template>
  <div class="error-page">
    <div class="error-page__icon">500</div>
    <h1 class="error-page__title">服务器错误</h1>
    <p class="error-page__desc">服务器遇到了问题，请稍后重试。</p>
    <el-button type="primary" @click="retry">重试</el-button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ElButton } from 'element-plus';

const router = useRouter();

function retry() {
  router.go(0);
}
</script>

<style scoped>
.error-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}

.error-page__icon {
  font-size: 96px;
  font-weight: 700;
  color: var(--el-color-danger);
}

.error-page__title {
  margin-top: 16px;
  font-size: var(--qf-font-size-heading);
  font-weight: var(--qf-font-weight-heading);
  color: var(--qf-color-text-primary);
}

.error-page__desc {
  margin-top: 8px;
  margin-bottom: 24px;
  font-size: var(--qf-font-size-body);
  color: var(--qf-color-text-secondary);
}
</style>
