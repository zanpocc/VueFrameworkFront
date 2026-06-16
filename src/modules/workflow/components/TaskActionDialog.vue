<template>
  <el-dialog
    :model-value="modelValue"
    title="处理任务"
    width="720px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
    @open="loadData"
  >
    <div v-if="loading" v-loading="true" style="min-height: 200px" />

    <template v-else-if="task">
      <!-- 任务基本信息 -->
      <el-descriptions :column="2" border class="task-action__info">
        <el-descriptions-item label="流程标题">{{ task.processTitle }}</el-descriptions-item>
        <el-descriptions-item label="任务名称">{{ task.taskName }}</el-descriptions-item>
        <el-descriptions-item label="处理人">{{ task.assignee }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ task.createdAt }}</el-descriptions-item>
      </el-descriptions>

      <!-- 表单数据（只读） -->
      <template v-if="formSchema && formDataObj">
        <el-divider content-position="left">表单数据</el-divider>
        <QfFormRenderer :schema="formSchema" :model-value="formDataObj" :disabled="true" />
      </template>

      <!-- 审批操作 -->
      <el-divider content-position="left">审批操作</el-divider>
      <el-form-item label="审批意见">
        <el-input v-model="comment" type="textarea" :rows="3" placeholder="请输入审批意见" />
      </el-form-item>

      <div class="task-action__buttons">
        <el-button
          v-for="action in availableActions"
          :key="action.value"
          :type="action.type"
          :loading="submitting"
          @click="handleAction(action.value)"
        >
          {{ action.label }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { QfFormRenderer, parseSchema } from '@/form-engine';
import type { FormSchema } from '@/form-engine';
import {
  workflowApi,
  type WorkflowTask,
  type ProcessInstance,
  type DefinitionTransition,
} from '@/api/workflow';

const props = defineProps<{
  modelValue: boolean;
  task: WorkflowTask | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  completed: [];
}>();

const loading = ref(false);
const submitting = ref(false);
const comment = ref('');
const instance = ref<ProcessInstance | null>(null);
const formSchema = ref<FormSchema | null>(null);
const formDataObj = ref<Record<string, unknown> | null>(null);
const transitions = ref<DefinitionTransition[]>([]);

const availableActions = computed(() => {
  const actions: Array<{ value: string; label: string; type: '' | 'primary' | 'danger' }> = [];

  // 如果有 transitions，从中提取可用操作
  const currentTransitions = transitions.value.filter((t) => t.fromNodeKey === props.task?.nodeKey);

  if (currentTransitions.length > 0) {
    for (const t of currentTransitions) {
      const actionType = t.action === 'APPROVE' ? 'primary' : t.action === 'REJECT' ? 'danger' : '';
      const actionLabel = actionLabelMap[t.action] || t.action;
      actions.push({ value: t.action, label: actionLabel, type: actionType });
    }
  } else {
    // 无 transitions 的单步流程
    actions.push({ value: 'APPROVE', label: '同意', type: 'primary' });
    actions.push({ value: 'REJECT', label: '拒绝', type: 'danger' });
  }

  return actions;
});

const actionLabelMap: Record<string, string> = {
  APPROVE: '同意',
  REJECT: '拒绝',
  RETURN: '退回',
  DELEGATE: '委派',
  HOLD: '暂存',
  START: '提交',
};

async function loadData() {
  if (!props.task) return;
  loading.value = true;
  comment.value = '';

  try {
    // 获取流程实例
    const instances = await workflowApi.instances();
    instance.value = instances.find((i) => i.id === props.task!.instanceId) ?? null;

    // 解析表单数据
    if (instance.value?.formData) {
      try {
        formDataObj.value = JSON.parse(instance.value.formData);
      } catch {
        formDataObj.value = null;
      }
    }

    // 获取表单 schema
    if (instance.value?.formId) {
      try {
        const forms = await workflowApi.forms();
        const form = forms.find((f) => f.id === instance.value!.formId);
        if (form?.schemaJson) {
          formSchema.value = parseSchema(form.schemaJson);
        }
      } catch {
        formSchema.value = null;
      }
    }

    // 获取流转规则
    if (instance.value?.definitionId) {
      try {
        transitions.value = await workflowApi.getDefinitionTransitions(instance.value.definitionId);
      } catch {
        transitions.value = [];
      }
    }
  } finally {
    loading.value = false;
  }
}

async function handleAction(action: string) {
  if (!props.task) return;
  submitting.value = true;
  try {
    await workflowApi.completeTask(props.task.id, {
      action,
      comment: comment.value || undefined,
    });
    ElMessage.success('操作成功');
    emit('update:modelValue', false);
    emit('completed');
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.task-action__info {
  margin-bottom: 16px;
}

.task-action__buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
