<template>
  <section class="page">
    <header class="page__header">
      <div>
        <h1>系统配置</h1>
        <p>维护平台参数，敏感配置默认脱敏展示。</p>
      </div>
      <el-button v-permission="'system:config:update'" type="primary" @click="openCreate">
        新增配置
      </el-button>
    </header>

    <el-form class="page__filters" inline @submit.prevent="loadConfigs">
      <el-form-item label="关键字">
        <el-input v-model="keyword" clearable placeholder="分组或 key" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadConfigs"> 查询 </el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="configs" border row-key="id">
      <el-table-column prop="configGroup" label="分组" min-width="120" />
      <el-table-column prop="configKey" label="配置 key" min-width="200" />
      <el-table-column prop="configValue" label="配置值" min-width="180" />
      <el-table-column prop="valueType" label="类型" width="100" />
      <el-table-column label="属性" width="150">
        <template #default="{ row }">
          <el-tag v-if="row.sensitive" type="warning"> 敏感 </el-tag>
          <el-tag v-if="!row.editable" type="info"> 只读 </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button
            v-permission="'system:config:update'"
            text
            type="primary"
            @click="openEdit(row)"
          >
            编辑
          </el-button>
          <el-button
            v-permission="'system:config:update'"
            text
            type="danger"
            @click="deleteConfig(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="editingConfig ? '编辑配置' : '新增配置'"
      width="560px"
    >
      <el-form label-position="top">
        <el-form-item label="分组">
          <el-input v-model="form.configGroup" />
        </el-form-item>
        <el-form-item label="配置 key">
          <el-input v-model="form.configKey" />
        </el-form-item>
        <el-form-item label="配置值">
          <el-input v-model="form.configValue" />
        </el-form-item>
        <el-form-item label="值类型">
          <el-select v-model="form.valueType">
            <el-option label="字符串" value="STRING" />
            <el-option label="数字" value="NUMBER" />
            <el-option label="布尔" value="BOOLEAN" />
            <el-option label="JSON" value="JSON" />
          </el-select>
        </el-form-item>
        <el-form-item label="选项">
          <el-checkbox v-model="form.sensitive"> 敏感配置 </el-checkbox>
          <el-checkbox v-model="form.editable"> 允许编辑 </el-checkbox>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false"> 取消 </el-button>
        <el-button type="primary" :loading="submitting" @click="submit"> 保存 </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { systemApi, type ConfigCommand, type SysConfig } from '@/api/system';

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const keyword = ref('');
const configs = ref<SysConfig[]>([]);
const editingConfig = ref<SysConfig | null>(null);
const form = reactive<ConfigCommand>({
  configGroup: '',
  configKey: '',
  configValue: '',
  valueType: 'STRING',
  sensitive: false,
  editable: true,
  remark: '',
});

async function loadConfigs() {
  loading.value = true;
  try {
    configs.value = await systemApi.configs(keyword.value);
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingConfig.value = null;
  Object.assign(form, {
    configGroup: '',
    configKey: '',
    configValue: '',
    valueType: 'STRING',
    sensitive: false,
    editable: true,
    remark: '',
  });
  dialogVisible.value = true;
}

function openEdit(row: SysConfig) {
  editingConfig.value = row;
  Object.assign(form, {
    configGroup: row.configGroup,
    configKey: row.configKey,
    configValue: row.sensitive ? '' : row.configValue,
    valueType: row.valueType,
    sensitive: row.sensitive,
    editable: row.editable,
    remark: row.remark ?? '',
  });
  dialogVisible.value = true;
}

async function submit() {
  submitting.value = true;
  try {
    if (editingConfig.value) {
      await systemApi.updateConfig(editingConfig.value.id, form);
      ElMessage.success('配置已更新');
    } else {
      await systemApi.createConfig(form);
      ElMessage.success('配置已创建');
    }
    dialogVisible.value = false;
    await loadConfigs();
  } finally {
    submitting.value = false;
  }
}

async function deleteConfig(row: SysConfig) {
  await ElMessageBox.confirm(`确认删除配置 ${row.configKey}？`, '删除配置', { type: 'warning' });
  await systemApi.deleteConfig(row.id);
  ElMessage.success('配置已删除');
  await loadConfigs();
}

onMounted(loadConfigs);
</script>
