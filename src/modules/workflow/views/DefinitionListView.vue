<template>
  <div>
    <div class="workflow-toolbar">
      <QfPermissionButton
        code="workflow:definition:update"
        type="primary"
        @click="dialog.openCreate()"
      >
        新建定义
      </QfPermissionButton>
    </div>

    <QfDataTable
      :columns="columns"
      :data="table.allRows.value"
      :loading="table.loading.value"
      :actions-width="260"
      :min-table-width="1120"
    >
      <template #status="{ row }">
        <QfStatusTag :status="row.status" :mapping="WORKFLOW_STATUS_MAP" />
      </template>
      <template #actions="{ row }">
        <QfTableActions :actions="getActions(row)" :max-inline="3" />
      </template>
    </QfDataTable>

    <!-- 新建流程定义对话框 -->
    <QfFormDialog
      v-model="dialog.visible.value"
      :title="dialog.isEditing.value ? '编辑流程定义' : '新建流程定义'"
      :model="dialog.form"
      :rules="rules"
      :loading="dialog.submitting.value"
      @submit="dialog.submit()"
      @cancel="dialog.cancel()"
    >
      <el-form-item label="流程编码" prop="processKey">
        <el-input
          v-model="dialog.form.processKey"
          :disabled="dialog.isEditing.value"
          placeholder="如: leave_approval"
        />
      </el-form-item>
      <el-form-item label="流程名称" prop="processName">
        <el-input v-model="dialog.form.processName" placeholder="如: 请假审批" />
      </el-form-item>
      <el-form-item label="关联表单" prop="formId">
        <el-select v-model="dialog.form.formId" placeholder="请选择表单" style="width: 100%">
          <el-option v-for="form in forms" :key="form.id" :label="form.formName" :value="form.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="审批人类型" prop="assigneeType">
        <el-select v-model="dialog.form.assigneeType" style="width: 100%">
          <el-option label="指定用户" value="USER" />
          <el-option label="指定角色" value="ROLE" />
          <el-option label="指定部门" value="DEPT" />
        </el-select>
      </el-form-item>
      <el-form-item label="审批人" prop="assigneeValue">
        <el-input v-model="dialog.form.assigneeValue" placeholder="如: admin" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="dialog.form.status" style="width: 100%">
          <el-option label="草稿" value="DRAFT" />
          <el-option label="已发布" value="PUBLISHED" />
        </el-select>
      </el-form-item>
    </QfFormDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  QfDataTable,
  QfFormDialog,
  QfStatusTag,
  QfTableActions,
  QfPermissionButton,
} from '@/shared';
import type { QfTableColumn, QfActionItem } from '@/shared';
import { useTable, useDialogForm } from '@/shared';
import { useRouter } from 'vue-router';
import {
  workflowApi,
  type ProcessDefinition,
  type ProcessDefinitionCommand,
  type FormDefinition,
} from '@/api/workflow';
import { WORKFLOW_STATUS_MAP } from '../constants';

defineOptions({ name: 'DefinitionList' });

const router = useRouter();

const columns: QfTableColumn<ProcessDefinition>[] = [
  { prop: 'processName', label: '流程名称', minWidth: 160 },
  { prop: 'processKey', label: '编码', minWidth: 140 },
  { prop: 'formName', label: '关联表单', minWidth: 120 },
  { prop: 'assigneeType', label: '审批人类型', width: 110 },
  { prop: 'assigneeValue', label: '审批人', width: 100 },
  { prop: 'status', label: '状态', width: 100, slot: 'status' },
  { prop: 'createdAt', label: '创建时间', width: 170 },
];

const forms = ref<FormDefinition[]>([]);

const table = useTable<ProcessDefinition>({
  fetcher: () => workflowApi.definitions(),
});

const dialog = useDialogForm<ProcessDefinitionCommand>({
  defaults: {
    processKey: '',
    processName: '',
    formId: 0,
    status: 'DRAFT',
    assigneeType: 'USER',
    assigneeValue: '',
  },
  async onSubmit(form, editingItem) {
    if (editingItem) {
      ElMessage.warning('暂不支持编辑流程定义，请新建新版本');
      return;
    }
    await workflowApi.createDefinition(form);
  },
  successMessage: () => '流程定义已创建',
});

const rules: FormRules = {
  processKey: [{ required: true, message: '请输入流程编码', trigger: 'blur' }],
  processName: [{ required: true, message: '请输入流程名称', trigger: 'blur' }],
  formId: [{ required: true, message: '请选择关联表单', trigger: 'change' }],
  assigneeValue: [{ required: true, message: '请输入审批人', trigger: 'blur' }],
};

async function loadForms() {
  forms.value = await workflowApi.forms();
}

onMounted(loadForms);

async function handleDelete(row: ProcessDefinition) {
  await ElMessageBox.confirm(`确定要删除流程定义「${row.processName}」吗？`, '删除确认', {
    type: 'warning',
  });
  ElMessage.warning('暂不支持删除流程定义');
}

async function handleStatusChange(row: ProcessDefinition) {
  const nextStatus = row.status === 'PUBLISHED' ? 'DISABLED' : 'PUBLISHED';
  const actionText = nextStatus === 'DISABLED' ? '禁用' : '发布';
  await ElMessageBox.confirm(
    `确定要${actionText}流程定义「${row.processName}」吗？`,
    `${actionText}确认`,
    {
      type: nextStatus === 'DISABLED' ? 'warning' : 'info',
    },
  );
  await workflowApi.updateDefinitionStatus(row.id, nextStatus);
  ElMessage.success(`流程定义已${actionText}`);
  await table.reload();
}

function getActions(row: unknown): QfActionItem[] {
  const r = row as ProcessDefinition;
  return [
    {
      label: '配置节点',
      type: 'primary',
      handler: () => {
        router.push({
          path: `/workflow/definition/${r.id}/editor`,
          query: { from: router.currentRoute.value.name as string },
        });
      },
    },
    {
      label: r.status === 'PUBLISHED' ? '禁用' : '发布',
      type: r.status === 'PUBLISHED' ? 'danger' : 'primary',
      permission: 'workflow:definition:update',
      handler: () => handleStatusChange(r),
    },
    {
      label: '删除',
      type: 'danger',
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
</style>
