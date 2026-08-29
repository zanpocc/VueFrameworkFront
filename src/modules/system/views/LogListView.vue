<template>
  <QfPageShell>
    <QfPageHeader title="日志查询" description="查看登录、操作、审计和异常日志。" />

    <el-tabs v-model="activeTab">
      <el-tab-pane label="登录日志" name="login">
        <QfTablePanel title="登录日志">
          <QfDataTable
            :columns="loginColumns"
            :data="loginTable.allRows.value"
            :loading="loginTable.loading.value"
            :page-size="20"
          >
            <template #filters="{ reload }">
              <el-form-item label="用户">
                <el-input v-model="loginTable.filters.username" clearable placeholder="用户名" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="reload()"> 查询 </el-button>
              </el-form-item>
            </template>
            <template #success="{ row }">
              <QfStatusTag
                :status="row.success ? 'SUCCESS' : 'FAILED'"
                :label="row.success ? '成功' : '失败'"
              />
            </template>
          </QfDataTable>
        </QfTablePanel>
      </el-tab-pane>

      <el-tab-pane label="操作日志" name="operation">
        <QfTablePanel title="操作日志">
          <QfDataTable
            :columns="operationColumns"
            :data="operationTable.allRows.value"
            :loading="operationTable.loading.value"
            :page-size="20"
          >
            <template #filters="{ reload }">
              <el-form-item label="用户">
                <el-input
                  v-model="operationTable.filters.username"
                  clearable
                  placeholder="用户名"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="reload()"> 查询 </el-button>
              </el-form-item>
            </template>
            <template #success="{ row }">
              <QfStatusTag
                :status="row.success ? 'SUCCESS' : 'FAILED'"
                :label="row.success ? '成功' : '失败'"
              />
            </template>
          </QfDataTable>
        </QfTablePanel>
      </el-tab-pane>

      <el-tab-pane label="审计日志" name="audit">
        <QfTablePanel title="审计日志">
          <QfDataTable
            :columns="auditColumns"
            :data="auditTable.allRows.value"
            :loading="auditTable.loading.value"
            :page-size="20"
          >
            <template #filters="{ reload }">
              <el-form-item label="模块">
                <el-input v-model="auditTable.filters.module" clearable placeholder="模块" />
              </el-form-item>
              <el-form-item label="用户">
                <el-input v-model="auditTable.filters.username" clearable placeholder="用户名" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="reload()"> 查询 </el-button>
              </el-form-item>
            </template>
            <template #success="{ row }">
              <QfStatusTag
                :status="row.success ? 'SUCCESS' : 'FAILED'"
                :label="row.success ? '成功' : '失败'"
              />
            </template>
          </QfDataTable>
        </QfTablePanel>
      </el-tab-pane>

      <el-tab-pane label="异常日志" name="exception">
        <QfTablePanel title="异常日志">
          <QfDataTable
            :columns="exceptionColumns"
            :data="exceptionTable.allRows.value"
            :loading="exceptionTable.loading.value"
            :page-size="20"
          >
            <template #filters="{ reload }">
              <el-form-item label="异常类">
                <el-input
                  v-model="exceptionTable.filters.exceptionClass"
                  clearable
                  placeholder="异常类"
                />
              </el-form-item>
              <el-form-item label="用户">
                <el-input
                  v-model="exceptionTable.filters.username"
                  clearable
                  placeholder="用户名"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="reload()"> 查询 </el-button>
              </el-form-item>
            </template>
          </QfDataTable>
        </QfTablePanel>
      </el-tab-pane>
    </el-tabs>
  </QfPageShell>
</template>

<script setup lang="ts">
defineOptions({ name: 'LogList' });
import { ref, watch } from 'vue';
import { QfDataTable, QfPageHeader, QfPageShell, QfStatusTag, QfTablePanel } from '@/shared';
import type { QfTableColumn } from '@/shared';
import { useTable } from '@/shared';
import {
  systemApi,
  type AuditEvent,
  type ExceptionLog,
  type LoginLog,
  type OperationLog,
} from '@/api/system';

const loginColumns: QfTableColumn<LoginLog>[] = [
  { prop: 'username', label: '用户', width: 130 },
  { prop: 'success', label: '结果', width: 100, slot: 'success' },
  { prop: 'message', label: '消息', minWidth: 160 },
  { prop: 'loginIp', label: 'IP', width: 140 },
  { prop: 'userAgent', label: 'UA', minWidth: 220 },
  { prop: 'loginAt', label: '时间', minWidth: 180 },
];

const operationColumns: QfTableColumn<OperationLog>[] = [
  { prop: 'username', label: '用户', width: 130 },
  { prop: 'moduleName', label: '模块', width: 130 },
  { prop: 'operationType', label: '操作', width: 110 },
  { prop: 'resourceName', label: '资源', minWidth: 180 },
  { prop: 'success', label: '结果', width: 100, slot: 'success' },
  { prop: 'message', label: '消息', minWidth: 160 },
  { prop: 'operatedAt', label: '时间', minWidth: 180 },
];

const auditColumns: QfTableColumn<AuditEvent>[] = [
  { prop: 'username', label: '用户', width: 130 },
  { prop: 'module', label: '模块', width: 130 },
  { prop: 'action', label: '动作', width: 130 },
  { prop: 'resourceType', label: '资源类型', width: 120 },
  { prop: 'resourceId', label: '资源 ID', width: 120 },
  { prop: 'success', label: '结果', width: 100, slot: 'success' },
  { prop: 'traceId', label: 'TraceId', minWidth: 180 },
  { prop: 'clientIp', label: 'IP', width: 140 },
  { prop: 'createdAt', label: '时间', minWidth: 180 },
];

const exceptionColumns: QfTableColumn<ExceptionLog>[] = [
  { prop: 'exceptionClass', label: '异常类', minWidth: 220 },
  { prop: 'message', label: '消息', minWidth: 220 },
  { prop: 'requestMethod', label: '方法', width: 90 },
  { prop: 'requestUri', label: '请求 URI', minWidth: 180 },
  { prop: 'username', label: '用户', width: 130 },
  { prop: 'traceId', label: 'TraceId', minWidth: 180 },
  { prop: 'clientIp', label: 'IP', width: 140 },
  { prop: 'createdAt', label: '时间', minWidth: 180 },
];

const activeTab = ref('login');

const loginTable = useTable<LoginLog, { username: string }>({
  fetcher: (filters) => systemApi.loginLogs(filters.username),
  defaultFilters: { username: '' },
});

const operationTable = useTable<OperationLog, { username: string }>({
  fetcher: (filters) => systemApi.operationLogs(filters.username),
  defaultFilters: { username: '' },
  autoLoad: false,
});

const auditTable = useTable<AuditEvent, { module: string; username: string }>({
  fetcher: (filters) => systemApi.auditEvents(filters.module, filters.username),
  defaultFilters: { module: '', username: '' },
  autoLoad: false,
});

const exceptionTable = useTable<ExceptionLog, { exceptionClass: string; username: string }>({
  fetcher: (filters) => systemApi.exceptionLogs(filters.exceptionClass, filters.username),
  defaultFilters: { exceptionClass: '', username: '' },
  autoLoad: false,
});

watch(activeTab, (tab) => {
  if (tab === 'login') {
    void loginTable.reload();
  } else if (tab === 'operation') {
    void operationTable.reload();
  } else if (tab === 'audit') {
    void auditTable.reload();
  } else if (tab === 'exception') {
    void exceptionTable.reload();
  }
});
</script>
