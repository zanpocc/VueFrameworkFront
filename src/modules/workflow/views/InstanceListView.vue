<template>
  <div>
    <div class="workflow-toolbar">
      <QfPermissionButton code="workflow:instance:start" type="primary" @click="openStartDialog">
        发起流程
      </QfPermissionButton>
    </div>

    <QfDataTable
      :columns="columns"
      :data="table.allRows.value"
      :loading="table.loading.value"
      :actions-width="120"
    >
      <template #status="{ row }">
        <QfStatusTag :status="row.status" :mapping="WORKFLOW_STATUS_MAP" />
      </template>
      <template #actions="{ row }">
        <el-button text type="primary" @click="openDetail(row as ProcessInstance)">
          详情
        </el-button>
      </template>
    </QfDataTable>

    <!-- 发起流程对话框 -->
    <QfFormDialog
      v-model="startDialog.visible.value"
      title="发起流程"
      :model="startDialog.form"
      :rules="startRules"
      :loading="startDialog.submitting.value"
      width="700px"
      @submit="startDialog.submit()"
      @cancel="startDialog.cancel()"
    >
      <el-form-item label="流程定义" prop="processKey">
        <el-select
          v-model="startDialog.form.processKey"
          placeholder="请选择流程"
          style="width: 100%"
          @change="onDefinitionChange"
        >
          <el-option
            v-for="def in publishedDefinitions"
            :key="def.processKey"
            :label="def.processName"
            :value="def.processKey"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="标题" prop="title">
        <el-input v-model="startDialog.form.title" placeholder="如: 年假申请" />
      </el-form-item>
      <el-form-item label="业务标识" prop="businessKey">
        <el-input v-model="startDialog.form.businessKey" placeholder="可选" />
      </el-form-item>

      <!-- 动态表单 -->
      <template v-if="startFormSchema">
        <el-divider content-position="left">表单数据</el-divider>
        <QfFormRenderer
          :schema="startFormSchema"
          :model-value="startFormData"
          @update:model-value="startFormData = $event"
        />
      </template>
    </QfFormDialog>

    <!-- 实例详情抽屉 -->
    <InstanceDetailDrawer
      v-model="detailVisible"
      :instance="currentInstance"
      @actioned="table.reload()"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { FormRules } from 'element-plus';
import { QfDataTable, QfStatusTag, QfFormDialog, QfPermissionButton } from '@/shared';
import type { QfTableColumn } from '@/shared';
import { useTable, useDialogForm } from '@/shared';
import { QfFormRenderer, parseSchema, buildFormDefaults } from '@/form-engine';
import type { FormSchema } from '@/form-engine';
import {
  workflowApi,
  type ProcessInstance,
  type ProcessDefinition,
  type StartProcessCommand,
} from '@/api/workflow';
import InstanceDetailDrawer from '../components/InstanceDetailDrawer.vue';
import { WORKFLOW_STATUS_MAP } from '../constants';

defineOptions({ name: 'InstanceList' });

const columns: QfTableColumn<ProcessInstance>[] = [
  { prop: 'title', label: '标题', minWidth: 180 },
  { prop: 'initiator', label: '发起人', width: 100 },
  { prop: 'status', label: '状态', width: 100, slot: 'status' },
  { prop: 'currentAssignee', label: '当前处理人', width: 120 },
  { prop: 'startedAt', label: '发起时间', width: 170 },
  { prop: 'endedAt', label: '结束时间', width: 170 },
];

const table = useTable<ProcessInstance>({
  fetcher: () => workflowApi.instances(),
});

const publishedDefinitions = ref<ProcessDefinition[]>([]);
const startFormSchema = ref<FormSchema | null>(null);
const startFormData = ref<Record<string, unknown>>({});

const startDialog = useDialogForm<StartProcessCommand & { businessKey: string }>({
  defaults: { processKey: '', title: '', businessKey: '' },
  async onSubmit(form) {
    const payload: StartProcessCommand = {
      processKey: form.processKey,
      title: form.title,
      businessKey: form.businessKey || undefined,
      formData: startFormSchema.value ? JSON.stringify(startFormData.value) : undefined,
    };
    await workflowApi.startProcess(payload);
  },
  successMessage: () => '流程已发起',
});

const startRules: FormRules = {
  processKey: [{ required: true, message: '请选择流程', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
};

const detailVisible = ref(false);
const currentInstance = ref<ProcessInstance | null>(null);

async function loadDefinitions() {
  const defs = await workflowApi.definitions();
  publishedDefinitions.value = defs.filter((d) => d.status === 'PUBLISHED');
}

onMounted(loadDefinitions);

async function onDefinitionChange(processKey: string) {
  const def = publishedDefinitions.value.find((d) => d.processKey === processKey);
  if (!def) {
    startFormSchema.value = null;
    startFormData.value = {};
    return;
  }

  try {
    const forms = await workflowApi.forms();
    const form = forms.find((f) => f.id === def.formId);
    if (form?.schemaJson) {
      startFormSchema.value = parseSchema(form.schemaJson);
      startFormData.value = buildFormDefaults(startFormSchema.value);
    } else {
      startFormSchema.value = null;
      startFormData.value = {};
    }
  } catch {
    startFormSchema.value = null;
  }
}

function openStartDialog() {
  startFormSchema.value = null;
  startFormData.value = {};
  startDialog.openCreate();
}

function openDetail(row: ProcessInstance) {
  currentInstance.value = row;
  detailVisible.value = true;
}
</script>

<style scoped>
.workflow-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}
</style>
