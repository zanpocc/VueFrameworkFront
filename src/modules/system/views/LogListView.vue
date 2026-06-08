<template>
  <section class="page">
    <header class="page__header">
      <div>
        <h1>日志查询</h1>
        <p>查看登录日志和平台操作日志。</p>
      </div>
    </header>

    <el-form class="page__filters" inline @submit.prevent="loadLogs">
      <el-form-item label="用户">
        <el-input v-model="username" clearable placeholder="用户名" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadLogs"> 查询 </el-button>
      </el-form-item>
    </el-form>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="登录日志" name="login">
        <el-table v-loading="loading" :data="loginLogs" border row-key="id">
          <el-table-column prop="username" label="用户" width="130" />
          <el-table-column label="结果" width="100">
            <template #default="{ row }">
              <el-tag :type="row.success ? 'success' : 'danger'">
                {{ row.success ? '成功' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="message" label="消息" min-width="160" />
          <el-table-column prop="loginIp" label="IP" width="140" />
          <el-table-column prop="userAgent" label="UA" min-width="220" />
          <el-table-column prop="loginAt" label="时间" min-width="180" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="操作日志" name="operation">
        <el-table v-loading="loading" :data="operationLogs" border row-key="id">
          <el-table-column prop="username" label="用户" width="130" />
          <el-table-column prop="moduleName" label="模块" width="130" />
          <el-table-column prop="operationType" label="操作" width="110" />
          <el-table-column prop="resourceName" label="资源" min-width="180" />
          <el-table-column label="结果" width="100">
            <template #default="{ row }">
              <el-tag :type="row.success ? 'success' : 'danger'">
                {{ row.success ? '成功' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="message" label="消息" min-width="160" />
          <el-table-column prop="operatedAt" label="时间" min-width="180" />
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { systemApi, type LoginLog, type OperationLog } from '@/api/system';

const loading = ref(false);
const username = ref('');
const activeTab = ref('login');
const loginLogs = ref<LoginLog[]>([]);
const operationLogs = ref<OperationLog[]>([]);

async function loadLogs() {
  loading.value = true;
  try {
    if (activeTab.value === 'login') {
      loginLogs.value = await systemApi.loginLogs(username.value);
    } else {
      operationLogs.value = await systemApi.operationLogs(username.value);
    }
  } finally {
    loading.value = false;
  }
}

watch(activeTab, loadLogs);
onMounted(loadLogs);
</script>
