<template>
  <div class="error-page">
    <div class="error-page__icon">403</div>
    <h1 class="error-page__title">无权限访问</h1>
    <p class="error-page__desc">您没有权限访问该页面，请联系管理员。</p>
    <el-button type="primary" @click="goBack">返回上一页</el-button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ElButton } from 'element-plus';

const router = useRouter();

function goBack() {
  if (window.history.length > 1) {
    router.go(-1);
  } else {
    router.replace('/');
  }
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
  color: var(--el-color-warning);
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
