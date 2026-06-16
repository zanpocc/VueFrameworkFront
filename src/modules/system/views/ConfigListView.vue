<template>
  <section class="page">
    <header class="page__header">
      <div>
        <h1>系统配置</h1>
        <p>维护平台参数，敏感配置默认脱敏展示。</p>
      </div>
      <div class="page__actions">
        <QfPermissionButton code="system:config:update" :loading="refreshing" @click="refreshCache">
          刷新缓存
        </QfPermissionButton>
        <QfPermissionButton code="system:config:update" type="primary" @click="dialog.openCreate()">
          新增配置
        </QfPermissionButton>
      </div>
    </header>

    <QfDataTable
      :columns="columns"
      :data="table.allRows.value"
      :loading="table.loading.value"
      :actions-width="160"
    >
      <template #filters="{ filters, reload: doReload }">
        <el-input
          v-model="filters.keyword"
          clearable
          placeholder="分组或 key"
          style="width: 200px"
          @clear="doReload"
          @keyup.enter="doReload"
        />
        <el-button type="primary" @click="doReload">查询</el-button>
      </template>
      <template #attrs="{ row }">
        <el-tag v-if="row.sensitive" type="warning"> 敏感 </el-tag>
        <el-tag v-if="!row.editable" type="info"> 只读 </el-tag>
      </template>
      <template #actions="{ row }">
        <QfPermissionButton
          code="system:config:update"
          text
          type="primary"
          @click="openEditConfig(row as SysConfig)"
        >
          编辑
        </QfPermissionButton>
        <QfPermissionButton
          code="system:config:update"
          text
          type="danger"
          @click="handleDelete(row as SysConfig)"
        >
          删除
        </QfPermissionButton>
      </template>
    </QfDataTable>

    <QfFormDialog
      v-model="dialog.visible.value"
      :title="dialog.isEditing.value ? '编辑配置' : '新增配置'"
      :model="dialog.form"
      :rules="rules"
      :loading="dialog.submitting.value"
      width="560px"
      @submit="dialog.submit()"
      @cancel="dialog.cancel()"
    >
      <el-form-item label="分组" prop="configGroup">
        <el-input v-model="dialog.form.configGroup" />
      </el-form-item>
      <el-form-item label="配置 key" prop="configKey">
        <el-input v-model="dialog.form.configKey" />
      </el-form-item>
      <el-form-item label="配置值" prop="configValue">
        <el-input v-model="dialog.form.configValue" />
      </el-form-item>
      <el-form-item label="值类型" prop="valueType">
        <el-select v-model="dialog.form.valueType">
          <el-option label="字符串" value="STRING" />
          <el-option label="数字" value="NUMBER" />
          <el-option label="布尔" value="BOOLEAN" />
          <el-option label="JSON" value="JSON" />
        </el-select>
      </el-form-item>
      <el-form-item label="选项">
        <el-checkbox v-model="dialog.form.sensitive"> 敏感配置 </el-checkbox>
        <el-checkbox v-model="dialog.form.editable"> 允许编辑 </el-checkbox>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="dialog.form.remark" />
      </el-form-item>
    </QfFormDialog>
  </section>
</template>

<script setup lang="ts">
defineOptions({ name: 'ConfigList' });
import { ref } from 'vue';
import type { FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { QfDataTable, QfFormDialog, QfPermissionButton } from '@/shared';
import type { QfTableColumn } from '@/shared';
import { useTable, useDialogForm, useConfirmDelete } from '@/shared';
import { systemApi, type ConfigCommand, type SysConfig } from '@/api/system';

const columns: QfTableColumn<SysConfig>[] = [
  { prop: 'configGroup', label: '分组', minWidth: 120 },
  { prop: 'configKey', label: '配置 key', minWidth: 200 },
  { prop: 'configValue', label: '配置值', minWidth: 180 },
  { prop: 'valueType', label: '类型', width: 100 },
  { label: '属性', width: 150, slot: 'attrs' },
];

const rules: FormRules<ConfigCommand> = {
  configGroup: [{ required: true, message: '请输入分组', trigger: 'blur' }],
  configKey: [{ required: true, message: '请输入配置 key', trigger: 'blur' }],
  configValue: [{ required: true, message: '请输入配置值', trigger: 'blur' }],
};

const table = useTable<SysConfig, { keyword: string }>({
  fetcher: (filters) => systemApi.configs(filters.keyword),
  defaultFilters: { keyword: '' },
});

const dialog = useDialogForm<ConfigCommand>({
  defaults: {
    configGroup: '',
    configKey: '',
    configValue: '',
    valueType: 'STRING',
    sensitive: false,
    editable: true,
    remark: '',
  },
  async onSubmit(form, editingItem) {
    if (editingItem) {
      await systemApi.updateConfig((editingItem as SysConfig).id, form);
    } else {
      await systemApi.createConfig(form);
    }
    await table.reload();
  },
  successMessage: (isEdit) => (isEdit ? '配置已更新' : '配置已创建'),
});

const { confirmDelete } = useConfirmDelete();
const refreshing = ref(false);

function openEditConfig(row: SysConfig) {
  dialog.openEdit(row, {
    configGroup: row.configGroup,
    configKey: row.configKey,
    configValue: row.sensitive ? '' : (row.configValue ?? ''),
    valueType: row.valueType,
    sensitive: row.sensitive,
    editable: row.editable,
    remark: row.remark ?? '',
  });
}

async function handleDelete(row: SysConfig) {
  await confirmDelete(row.configKey, '配置');
  await systemApi.deleteConfig(row.id);
  await table.reload();
}

async function refreshCache() {
  refreshing.value = true;
  try {
    await systemApi.refreshConfigCache();
    ElMessage.success('配置缓存已刷新');
  } finally {
    refreshing.value = false;
  }
}
</script>
