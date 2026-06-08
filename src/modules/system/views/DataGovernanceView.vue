<template>
  <section class="page">
    <header class="page__header">
      <div>
        <h1>数据治理</h1>
        <p>诊断多数据源健康状态、当前路由和分表规则。</p>
      </div>
      <el-button type="primary" @click="loadAll"> 刷新 </el-button>
    </header>

    <el-row :gutter="16">
      <el-col :span="12">
        <div class="governance-panel">
          <h2>数据源</h2>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="当前数据源">
              {{ currentSource || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="只读探测">
              {{ readonlyProbe || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="governance-panel">
          <h2>分表诊断</h2>
          <el-form inline @submit.prevent="loadRoutes">
            <el-form-item label="日期">
              <el-date-picker
                v-model="routeDate"
                value-format="YYYY-MM-DD"
                type="date"
                placeholder="选择日期"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadRoutes"> 计算路由 </el-button>
            </el-form-item>
          </el-form>
          <el-table :data="routes" border row-key="logicTable">
            <el-table-column prop="logicTable" label="逻辑表" min-width="150" />
            <el-table-column prop="routeKey" label="路由键" width="120" />
            <el-table-column prop="actualTable" label="物理表" min-width="180" />
          </el-table>
        </div>
      </el-col>
    </el-row>

    <el-table v-loading="loadingSources" :data="sources" border row-key="name">
      <el-table-column prop="name" label="名称" width="140" />
      <el-table-column label="默认" width="90">
        <template #default="{ row }">
          <el-tag v-if="row.defaultSource" type="success"> 默认 </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="health" label="健康" width="110" />
      <el-table-column prop="url" label="连接" min-width="360" show-overflow-tooltip />
    </el-table>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import {
  dataGovernanceApi,
  type DataSourceDiagnostic,
  type ShardRoute,
} from '@/api/data-governance';

const loadingSources = ref(false);
const sources = ref<DataSourceDiagnostic[]>([]);
const currentSource = ref('');
const readonlyProbe = ref('');
const routeDate = ref('2026-06-05');
const routes = ref<ShardRoute[]>([]);

async function loadSources() {
  loadingSources.value = true;
  try {
    const [sourceRows, current, readonly] = await Promise.all([
      dataGovernanceApi.sources(),
      dataGovernanceApi.current(),
      dataGovernanceApi.readonlyProbe(),
    ]);
    sources.value = sourceRows;
    currentSource.value = current;
    readonlyProbe.value = readonly;
  } finally {
    loadingSources.value = false;
  }
}

async function loadRoutes() {
  const [operationLogRoute, asyncTaskRoute] = await Promise.all([
    dataGovernanceApi.operationLogRoute(routeDate.value),
    dataGovernanceApi.asyncTaskRoute(routeDate.value),
  ]);
  routes.value = [operationLogRoute, asyncTaskRoute];
}

async function loadAll() {
  await Promise.all([loadSources(), loadRoutes()]);
}

onMounted(loadAll);
</script>

<style scoped>
.governance-panel {
  display: grid;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.governance-panel h2 {
  margin: 0;
  font-size: 16px;
}
</style>
