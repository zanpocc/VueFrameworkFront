<template>
  <section class="dashboard">
    <header>
      <h1>工作台</h1>
      <p>平台基础能力会在这里逐步接入待办、系统状态、异步任务和流程统计。</p>
      <el-button v-permission="'system:user:create'" type="primary"> 新增用户 </el-button>
    </header>
    <div class="dashboard__grid">
      <el-card v-for="item in metrics" :key="item.label" shadow="never">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </el-card>
    </div>
  </section>
</template>

<script setup lang="ts">
const metrics = [
  { label: '待办任务', value: '0' },
  { label: '异步任务', value: '0' },
  { label: '系统配置', value: '0' },
  { label: '权限菜单', value: '0' },
];
</script>

<style scoped>
.dashboard header {
  display: grid;
  gap: 12px;
  justify-items: start;
  margin-bottom: 20px;
}

.dashboard h1 {
  margin: 0 0 8px;
  font-size: 24px;
}

.dashboard p {
  margin: 0;
  color: #64748b;
}

.dashboard__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.dashboard__grid span {
  display: block;
  margin-bottom: 12px;
  color: #64748b;
}

.dashboard__grid strong {
  font-size: 28px;
}
</style>
