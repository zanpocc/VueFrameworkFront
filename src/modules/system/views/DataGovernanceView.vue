<template>
  <section class="page">
    <header class="page__header">
      <div>
        <h1>数据治理</h1>
        <p>查看数据源、分表路由、数据权限范围和近期慢 SQL。</p>
      </div>
      <el-button type="primary" @click="loadAll">刷新</el-button>
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
          <el-form
            :model="routeTable.filters"
            :rules="routeRules"
            inline
            @submit.prevent="routeTable.reload()"
          >
            <el-form-item label="日期" prop="date">
              <el-date-picker
                v-model="routeTable.filters.date"
                value-format="YYYY-MM-DD"
                type="date"
                placeholder="选择日期"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="routeTable.reload()">计算路由</el-button>
            </el-form-item>
          </el-form>
          <QfDataTable
            :columns="routeColumns"
            :data="routeTable.allRows.value"
            :loading="routeTable.loading.value"
            :page-size="20"
          />
        </div>
      </el-col>
    </el-row>

    <div class="governance-panel">
      <div class="governance-panel__header">
        <h2>数据权限范围</h2>
        <el-select
          v-model="selectedRoleId"
          placeholder="选择角色"
          style="width: 220px"
          @change="loadRoleScopes"
        >
          <el-option v-for="role in roles" :key="role.id" :label="role.roleName" :value="role.id" />
        </el-select>
      </div>
      <QfDataTable
        :columns="scopeColumns"
        :data="scopeRows"
        :loading="scopeLoading"
        :page-size="20"
      >
        <template #scopeType="{ row }">
          <el-tag>{{ scopeTypeText(row.scopeType) }}</el-tag>
        </template>
      </QfDataTable>
    </div>

    <div class="governance-panel">
      <div class="governance-panel__header">
        <h2>近期慢 SQL</h2>
      </div>
      <QfDataTable
        :columns="slowSqlColumns"
        :data="slowSqlTable.allRows.value"
        :loading="slowSqlTable.loading.value"
        :page-size="20"
      />
    </div>

    <div class="governance-panel">
      <div class="governance-panel__header">
        <h2>数据源明细</h2>
      </div>
      <QfDataTable
        :columns="sourceColumns"
        :data="sourceTable.allRows.value"
        :loading="sourceTable.loading.value"
        :page-size="20"
      >
        <template #defaultSource="{ row }">
          <el-tag v-if="row.defaultSource" type="success">默认</el-tag>
        </template>
        <template #health="{ row }">
          <QfStatusTag
            :status="row.health"
            :mapping="{ UP: 'success', DOWN: 'danger', UNKNOWN: 'info' }"
          />
        </template>
      </QfDataTable>
    </div>
  </section>
</template>

<script setup lang="ts">
defineOptions({ name: 'DataGovernance' });

import { ref } from 'vue';
import { iamApi, type RoleDataScope, type SysRole } from '@/api/iam';
import {
  dataGovernanceApi,
  type DataSourceDiagnostic,
  type ShardRoute,
  type SlowSqlRecord,
} from '@/api/data-governance';
import { QfDataTable, QfStatusTag } from '@/shared';
import type { QfTableColumn } from '@/shared';
import { useTable } from '@/shared';

interface ScopeRow extends RoleDataScope {
  roleName: string;
}

const routeColumns: QfTableColumn<ShardRoute>[] = [
  { prop: 'logicTable', label: '逻辑表', minWidth: 150 },
  { prop: 'routeKey', label: '路由键', width: 120 },
  { prop: 'actualTable', label: '实际表', minWidth: 180 },
];

const sourceColumns: QfTableColumn<DataSourceDiagnostic>[] = [
  { prop: 'name', label: '名称', width: 140 },
  { prop: 'defaultSource', label: '默认', width: 90, slot: 'defaultSource' },
  { prop: 'health', label: '健康', width: 110, slot: 'health' },
  { prop: 'url', label: '连接', minWidth: 360, showOverflowTooltip: true },
];

const scopeColumns: QfTableColumn<ScopeRow>[] = [
  { prop: 'roleName', label: '角色', minWidth: 160 },
  { prop: 'scopeType', label: '范围类型', width: 140, slot: 'scopeType' },
  { prop: 'scopeValue', label: '范围值', minWidth: 220, showOverflowTooltip: true },
];

const slowSqlColumns: QfTableColumn<SlowSqlRecord>[] = [
  { prop: 'occurredAt', label: '发生时间', width: 170 },
  { prop: 'durationMs', label: '耗时(ms)', width: 100 },
  { prop: 'thresholdMs', label: '阈值(ms)', width: 100 },
  { prop: 'statementId', label: '语句 ID', minWidth: 260, showOverflowTooltip: true },
  { prop: 'traceId', label: 'TraceId', minWidth: 160, showOverflowTooltip: true },
  { prop: 'sql', label: 'SQL', minWidth: 320, showOverflowTooltip: true },
];

const currentSource = ref('');
const readonlyProbe = ref('');
const roles = ref<SysRole[]>([]);
const selectedRoleId = ref<number | null>(null);
const scopeRows = ref<ScopeRow[]>([]);
const scopeLoading = ref(false);

const sourceTable = useTable<DataSourceDiagnostic>({
  fetcher: async () => {
    const [sourceRows, current, readonly] = await Promise.all([
      dataGovernanceApi.sources(),
      dataGovernanceApi.current(),
      dataGovernanceApi.readonlyProbe(),
    ]);
    currentSource.value = current;
    readonlyProbe.value = readonly;
    return sourceRows;
  },
});

const routeTable = useTable<ShardRoute, { date: string }>({
  fetcher: async (filters) => {
    const [operationLogRoute, asyncTaskRoute] = await Promise.all([
      dataGovernanceApi.operationLogRoute(filters.date),
      dataGovernanceApi.asyncTaskRoute(filters.date),
    ]);
    return [operationLogRoute, asyncTaskRoute];
  },
  defaultFilters: { date: '2026-06-05' },
  autoLoad: true,
});

const slowSqlTable = useTable<SlowSqlRecord>({
  fetcher: () => dataGovernanceApi.slowSql(),
});

const routeRules = {};

async function loadAll() {
  await Promise.all([
    sourceTable.reload(),
    routeTable.reload(),
    slowSqlTable.reload(),
    loadRoleScopes(),
  ]);
}

async function loadRoleScopes() {
  scopeLoading.value = true;
  try {
    if (roles.value.length === 0) {
      roles.value = await iamApi.roles();
      selectedRoleId.value = roles.value[0]?.id ?? null;
    }
    if (selectedRoleId.value === null) {
      scopeRows.value = [];
      return;
    }
    const role = roles.value.find((item) => item.id === selectedRoleId.value);
    const scopes = await iamApi.roleDataScopes(selectedRoleId.value);
    scopeRows.value = scopes.map((scope) => ({
      ...scope,
      roleName: role?.roleName ?? String(selectedRoleId.value),
      scopeValue: scope.scopeValue || '-',
    }));
  } finally {
    scopeLoading.value = false;
  }
}

function scopeTypeText(scopeType: string) {
  const textMap: Record<string, string> = {
    ALL: '全部数据',
    DEPT: '部门数据',
    SELF: '本人数据',
    CUSTOM: '自定义',
  };
  return textMap[scopeType] ?? scopeType;
}

void loadRoleScopes();
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

.governance-panel__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.governance-panel h2 {
  margin: 0;
  font-size: 16px;
}
</style>
