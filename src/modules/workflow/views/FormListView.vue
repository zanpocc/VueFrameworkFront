<template>
  <div>
    <div class="workflow-toolbar">
      <QfPermissionButton code="workflow:form:update" type="primary" @click="openCreateDialog">
        新建表单
      </QfPermissionButton>
    </div>

    <QfDataTable
      :columns="columns"
      :data="table.allRows.value"
      :loading="table.loading.value"
      :actions-width="200"
    >
      <template #status="{ row }">
        <QfStatusTag :status="row.status" :mapping="WORKFLOW_STATUS_MAP" />
      </template>
      <template #actions="{ row }">
        <QfTableActions :actions="getActions(row)" :max-inline="3" />
      </template>
    </QfDataTable>

    <!-- 新建/编辑表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑表单' : '新建表单'"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-position="top">
        <el-form-item label="表单编码" prop="formKey">
          <el-input v-model="formData.formKey" :disabled="isEditing" placeholder="如: leave_form" />
        </el-form-item>
        <el-form-item label="表单名称" prop="formName">
          <el-input v-model="formData.formName" placeholder="如: 请假表单" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" style="width: 100%">
            <el-option label="草稿" value="DRAFT" />
            <el-option label="已发布" value="PUBLISHED" />
          </el-select>
        </el-form-item>

        <!-- Schema 编辑器 / JSON 切换 -->
        <el-tabs v-model="schemaTab" class="form-list__schema-tabs">
          <el-tab-pane label="可视化编辑" name="visual">
            <QfFormEditor v-model="schemaObj" />
          </el-tab-pane>
          <el-tab-pane label="JSON" name="json">
            <el-input
              v-model="formData.schemaJson"
              type="textarea"
              :rows="10"
              :placeholder="schemaJsonPlaceholder"
              @change="onJsonChange"
            />
          </el-tab-pane>
        </el-tabs>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog v-model="previewVisible" title="表单预览" width="600px">
      <QfFormRenderer
        v-if="previewSchema"
        :schema="previewSchema"
        :model-value="previewData"
        :disabled="true"
      />
      <el-empty v-else description="无法解析表单 Schema" :image-size="60" />
    </el-dialog>

    <QfFormDialog
      v-model="bindingVisible"
      title="绑定业务表"
      :model="bindingForm"
      :rules="bindingRules"
      :loading="bindingSubmitting"
      @submit="submitBinding"
      @cancel="bindingVisible = false"
    >
      <el-form-item label="数据源" prop="datasourceKey">
        <el-select v-model="bindingForm.datasourceKey" style="width: 100%">
          <el-option
            v-for="source in dataSources"
            :key="source.name"
            :label="source.defaultSource ? `${source.name}（默认）` : source.name"
            :value="source.name"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="更新模式" prop="updateMode">
        <el-segmented v-model="bindingForm.updateMode" :options="updateModeOptions" />
      </el-form-item>
      <el-form-item label="业务表" prop="physicalTable">
        <el-input v-model="bindingForm.physicalTable" placeholder="如: demo_repair_order" />
      </el-form-item>
      <el-form-item label="主键列" prop="businessPkColumn">
        <el-input v-model="bindingForm.businessPkColumn" placeholder="如: id" />
      </el-form-item>
      <el-form-item label="Schema / 数据库名">
        <el-input v-model="bindingForm.dbSchema" placeholder="可选" />
      </el-form-item>
      <el-form-item
        v-if="bindingForm.updateMode === 'REMOTE_CALLBACK'"
        label="目标服务"
        prop="serviceName"
      >
        <el-input v-model="bindingForm.serviceName" placeholder="如: platform-demo-service" />
      </el-form-item>
    </QfFormDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { FormRules, FormInstance } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  QfDataTable,
  QfFormDialog,
  QfStatusTag,
  QfTableActions,
  QfPermissionButton,
} from '@/shared';
import type { QfTableColumn, QfActionItem } from '@/shared';
import { useTable } from '@/shared';
import { dataGovernanceApi, type DataSourceDiagnostic } from '@/api/data-governance';
import {
  QfFormRenderer,
  QfFormEditor,
  parseSchema,
  serializeSchema,
  buildFormDefaults,
} from '@/form-engine';
import type { FormSchema } from '@/form-engine';
import {
  workflowApi,
  type FormDefinition,
  type FormDefinitionCommand,
  type FormTableBindingCommand,
} from '@/api/workflow';
import { WORKFLOW_STATUS_MAP } from '../constants';

defineOptions({ name: 'FormList' });

const columns: QfTableColumn<FormDefinition>[] = [
  { prop: 'formName', label: '表单名称', minWidth: 160 },
  { prop: 'formKey', label: '编码', minWidth: 160 },
  { prop: 'version', label: '版本', width: 80 },
  { prop: 'status', label: '状态', width: 100, slot: 'status' },
  { prop: 'createdBy', label: '创建人', width: 100 },
  { prop: 'createdAt', label: '创建时间', width: 170 },
];

const table = useTable<FormDefinition>({
  fetcher: () => workflowApi.forms(),
});
const dataSources = ref<DataSourceDiagnostic[]>([]);

// ---- Dialog state ----
const dialogVisible = ref(false);
const isEditing = ref(false);
const submitting = ref(false);
const schemaTab = ref('visual');
const formRef = ref<FormInstance>();

const formData = ref<FormDefinitionCommand>({
  formKey: '',
  formName: '',
  schemaJson: '{"version":1,"fields":[]}',
  status: 'DRAFT',
});

const schemaObj = ref<FormSchema>({ version: 1, fields: [] });
const schemaJsonPlaceholder =
  '{"version":1,"fields":[{"key":"title","label":"标题","type":"input","required":true}]}';

// 同步 schemaObj → schemaJson
watch(
  schemaObj,
  (val) => {
    formData.value.schemaJson = serializeSchema(val);
  },
  { deep: true },
);

// 同步 schemaJson → schemaObj（当从 JSON tab 编辑时）
function onJsonChange() {
  try {
    schemaObj.value = parseSchema(formData.value.schemaJson);
  } catch {
    // JSON 无效时保持当前 schemaObj
  }
}

const rules: FormRules = {
  formKey: [{ required: true, message: '请输入表单编码', trigger: 'blur' }],
  formName: [{ required: true, message: '请输入表单名称', trigger: 'blur' }],
};

function openCreateDialog() {
  isEditing.value = false;
  formData.value = {
    formKey: '',
    formName: '',
    schemaJson: '{"version":1,"fields":[]}',
    status: 'DRAFT',
  };
  schemaObj.value = { version: 1, fields: [] };
  schemaTab.value = 'visual';
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!formRef.value) return;
  await formRef.value.validate();

  // 确保 schemaJson 与 schemaObj 同步
  formData.value.schemaJson = serializeSchema(schemaObj.value);

  // 校验 schema
  try {
    parseSchema(formData.value.schemaJson);
  } catch (e) {
    ElMessage.error(`表单 Schema 无效：${(e as Error).message}`);
    return;
  }

  submitting.value = true;
  try {
    if (isEditing.value) {
      ElMessage.warning('暂不支持编辑表单，请新建新版本');
      return;
    }
    await workflowApi.createForm(formData.value);
    ElMessage.success('表单已创建');
    dialogVisible.value = false;
    await table.reload();
  } finally {
    submitting.value = false;
  }
}

// ---- Preview ----
const previewVisible = ref(false);
const previewSchema = ref<FormSchema | null>(null);
const previewData = ref<Record<string, unknown>>({});

const bindingVisible = ref(false);
const bindingSubmitting = ref(false);
const bindingFormId = ref<number | null>(null);
const bindingForm = ref<FormTableBindingCommand>({
  datasourceKey: 'default',
  updateMode: 'LOCAL_DB',
  physicalTable: '',
  businessPkColumn: 'id',
  dbSchema: '',
  serviceName: '',
});
const updateModeOptions = [
  { label: '本地数据源', value: 'LOCAL_DB' },
  { label: '远程回调', value: 'REMOTE_CALLBACK' },
];
const bindingRules: FormRules = {
  datasourceKey: [{ required: true, message: '请选择数据源', trigger: 'change' }],
  updateMode: [{ required: true, message: '请选择更新模式', trigger: 'change' }],
  physicalTable: [{ required: true, message: '请输入业务表名', trigger: 'blur' }],
  businessPkColumn: [{ required: true, message: '请输入主键列', trigger: 'blur' }],
  serviceName: [
    {
      validator: (_rule, value, callback) => {
        if (bindingForm.value.updateMode === 'REMOTE_CALLBACK' && !String(value ?? '').trim()) {
          callback(new Error('远程回调模式必须填写目标服务'));
          return;
        }
        callback();
      },
      trigger: 'blur',
    },
  ],
};

function openPreview(row: FormDefinition) {
  try {
    previewSchema.value = parseSchema(row.schemaJson);
    previewData.value = buildFormDefaults(previewSchema.value);
  } catch {
    previewSchema.value = null;
  }
  previewVisible.value = true;
}

async function handleDelete(row: FormDefinition) {
  await ElMessageBox.confirm(`确定要删除表单「${row.formName}」吗？`, '删除确认', {
    type: 'warning',
  });
  ElMessage.warning('暂不支持删除表单');
}

async function openBinding(row: FormDefinition) {
  bindingFormId.value = row.id;
  if (dataSources.value.length === 0) {
    dataSources.value = await dataGovernanceApi.sources();
  }
  const existing = await workflowApi.getFormBinding(row.id);
  bindingForm.value = {
    datasourceKey:
      existing?.datasourceKey ??
      dataSources.value.find((item) => item.defaultSource)?.name ??
      'default',
    updateMode: existing?.updateMode ?? (existing?.serviceName ? 'REMOTE_CALLBACK' : 'LOCAL_DB'),
    physicalTable: existing?.physicalTable ?? '',
    businessPkColumn: existing?.businessPkColumn ?? 'id',
    dbSchema: existing?.dbSchema ?? '',
    serviceName: existing?.serviceName ?? '',
  };
  bindingVisible.value = true;
}

async function submitBinding() {
  if (bindingFormId.value === null) return;
  bindingSubmitting.value = true;
  try {
    const payload = {
      ...bindingForm.value,
      dbSchema: bindingForm.value.dbSchema || undefined,
      serviceName:
        bindingForm.value.updateMode === 'REMOTE_CALLBACK'
          ? bindingForm.value.serviceName
          : '__SELF__',
    };
    await workflowApi.bindForm(bindingFormId.value, payload);
    ElMessage.success('业务表绑定已保存');
    bindingVisible.value = false;
  } finally {
    bindingSubmitting.value = false;
  }
}

function getActions(row: unknown): QfActionItem[] {
  const r = row as FormDefinition;
  return [
    {
      label: '预览',
      type: 'primary',
      permission: 'workflow:form:view',
      handler: () => openPreview(r),
    },
    {
      label: '绑定业务表',
      type: 'primary',
      permission: 'workflow:form:update',
      handler: () => openBinding(r),
    },
    {
      label: '删除',
      type: 'danger',
      permission: 'workflow:form:update',
      handler: () => handleDelete(r),
    },
  ];
}
</script>

<style scoped>
.workflow-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.form-list__schema-tabs {
  margin-top: 8px;
}
</style>
