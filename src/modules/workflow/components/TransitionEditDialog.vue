<template>
  <el-dialog
    v-model="visible"
    title="添加流转规则"
    width="560px"
    :close-on-click-modal="false"
    @open="onOpen"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="源节点" prop="fromNodeKey">
        <el-select v-model="form.fromNodeKey" placeholder="请选择源节点" style="width: 100%">
          <el-option
            v-for="node in nodes"
            :key="node.nodeKey"
            :label="`${node.nodeName} (${node.nodeKey})`"
            :value="node.nodeKey"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="动作" prop="action">
        <el-select v-model="form.action" placeholder="请选择动作" style="width: 100%">
          <el-option label="同意 (APPROVE)" value="APPROVE" />
          <el-option label="拒绝 (REJECT)" value="REJECT" />
          <el-option label="提交 (SUBMIT)" value="SUBMIT" />
          <el-option label="自定义" value="__custom__" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.action === '__custom__'" label="自定义动作名称" prop="customAction">
        <el-input v-model="customAction" placeholder="如: CANCEL, RETURN" />
      </el-form-item>
      <el-form-item label="目标节点" prop="toNodeKey">
        <el-select v-model="form.toNodeKey" placeholder="请选择目标节点" style="width: 100%">
          <el-option
            v-for="node in nodes"
            :key="node.nodeKey"
            :label="`${node.nodeName} (${node.nodeKey})`"
            :value="node.nodeKey"
          />
        </el-select>
      </el-form-item>

      <el-divider content-position="left">流转条件</el-divider>

      <el-form-item label="条件模式">
        <el-radio-group v-model="conditionMode">
          <el-radio value="NONE">无条件</el-radio>
          <el-radio value="VISUAL" :disabled="formFields.length === 0">可视化</el-radio>
          <el-radio value="EXPRESSION">表达式</el-radio>
        </el-radio-group>
        <div v-if="conditionMode === 'VISUAL' && formFields.length === 0" class="cond-hint">
          当前流程未绑定表单或表单无字段，无法使用可视化模式，请改用表达式模式。
        </div>
      </el-form-item>

      <template v-if="conditionMode === 'VISUAL'">
        <el-form-item label="表单字段">
          <el-select v-model="visual.field" placeholder="请选择字段" style="width: 100%">
            <el-option
              v-for="f in formFields"
              :key="f.key"
              :value="f.key"
              :label="`${f.label} (${f.key})`"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作符">
          <el-select v-model="visual.op" style="width: 100%">
            <el-option
              v-for="op in operatorsFor(currentField?.type)"
              :key="op"
              :value="op"
              :label="op"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="值">
          <el-input-number
            v-if="currentField?.type === 'number'"
            v-model="numberValue"
            style="width: 100%"
          />
          <el-select
            v-else-if="currentField && hasOptions(currentField)"
            v-model="visual.value"
            style="width: 100%"
          >
            <el-option
              v-for="opt in currentField.options"
              :key="String(opt.value)"
              :value="String(opt.value)"
              :label="opt.label"
            />
          </el-select>
          <el-input v-else v-model="visual.value" placeholder="比较值" />
        </el-form-item>
        <div class="cond-preview">预览：{{ visualPreview }}</div>
      </template>

      <template v-if="conditionMode === 'EXPRESSION'">
        <el-form-item label="条件表达式">
          <el-input
            v-model="rawExpression"
            type="textarea"
            :rows="3"
            placeholder="如：amount > 10000 && type == 'URGENT'"
          />
          <div class="cond-hint">
            可用字段：
            <el-tag
              v-for="f in formFields"
              :key="f.key"
              size="small"
              class="cond-field-tag"
              @click="insertField(f.key)"
            >
              {{ f.label }} ({{ f.key }})
            </el-tag>
            <span v-if="formFields.length === 0">当前流程未绑定表单字段。</span>
          </div>
        </el-form-item>
      </template>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { FormRules, FormInstance } from 'element-plus';
import { ElMessage } from 'element-plus';
import { workflowApi, type DefinitionNode, type TransitionCommand } from '@/api/workflow';
import type { FormField } from '@/form-engine/types';
import { useFormFields } from '../composables/useFormFields';
import {
  operatorsFor,
  serializeVisual,
  type ConditionOp,
  type VisualCondition,
} from '../utils/conditionSerializer';

const props = defineProps<{
  definitionId: number;
  nodes: DefinitionNode[];
  /** Form id of the current process definition, used to load field list for
   *  visual condition authoring. */
  formId?: number | null;
  /** When set, the dialog pre-selects these keys on open (used by Vue Flow
   *  canvas connect handler). */
  presetFromKey?: string | null;
  presetToKey?: string | null;
}>();

const emit = defineEmits<{
  saved: [];
}>();

const visible = defineModel<boolean>({ default: false });

const submitting = ref(false);
const formRef = ref<FormInstance>();
const customAction = ref('');

const form = ref<TransitionCommand>({
  fromNodeKey: '',
  toNodeKey: '',
  action: 'APPROVE',
  conditionExpression: null,
});

const rules: FormRules = {
  fromNodeKey: [{ required: true, message: '请选择源节点', trigger: 'change' }],
  action: [{ required: true, message: '请选择动作', trigger: 'change' }],
  toNodeKey: [{ required: true, message: '请选择目标节点', trigger: 'change' }],
};

// ---- condition authoring ----
const { fields: formFields, load: loadFormFields } = useFormFields();
const conditionMode = ref<'NONE' | 'VISUAL' | 'EXPRESSION'>('NONE');
const visual = ref<VisualCondition>({ field: '', op: '==', value: '' });
const rawExpression = ref('');

const currentField = computed<FormField | undefined>(() =>
  formFields.value.find((f) => f.key === visual.value.field),
);

const numberValue = computed<number>({
  get: () => Number(visual.value.value) || 0,
  set: (v) => {
    visual.value.value = String(v);
  },
});

const visualPreview = computed(() => {
  if (!visual.value.field) return '（未选择字段）';
  return serializeVisual(
    visual.value.field,
    visual.value.op,
    visual.value.value,
    currentField.value?.type,
  );
});

function hasOptions(field: FormField): boolean {
  return Array.isArray(field.options) && field.options.length > 0;
}

function insertField(key: string) {
  rawExpression.value = `${rawExpression.value}${key}`;
}

function buildConditionExpression(): string | null {
  if (conditionMode.value === 'NONE') return null;
  if (conditionMode.value === 'EXPRESSION') {
    return rawExpression.value.trim() || null;
  }
  // VISUAL
  if (!visual.value.field) return null;
  return serializeVisual(
    visual.value.field,
    visual.value.op,
    visual.value.value,
    currentField.value?.type,
  );
}

function resetCondition() {
  conditionMode.value = 'NONE';
  visual.value = { field: '', op: '==', value: '' };
  rawExpression.value = '';
}

async function onOpen() {
  form.value = {
    fromNodeKey: props.presetFromKey ?? '',
    toNodeKey: props.presetToKey ?? '',
    action: 'APPROVE',
    conditionExpression: null,
  };
  customAction.value = '';
  resetCondition();
  await loadFormFields(props.formId);
  // If the form has fields, default to VISUAL for friendliness; otherwise NONE.
  if (formFields.value.length > 0) {
    conditionMode.value = 'NONE'; // keep NONE default; user opts in
  }
}

// Keep op valid when field changes (a text field can't keep '>')
watch(currentField, (field) => {
  const allowed = operatorsFor(field?.type);
  if (!allowed.includes(visual.value.op as ConditionOp)) {
    visual.value.op = allowed[0];
  }
});

async function handleSubmit() {
  if (!formRef.value) return;
  await formRef.value.validate();

  const action = form.value.action === '__custom__' ? customAction.value : form.value.action;
  if (!action) {
    ElMessage.error('请输入自定义动作名称');
    return;
  }

  if (conditionMode.value === 'VISUAL' && !visual.value.field) {
    ElMessage.error('可视化条件请选择表单字段');
    return;
  }

  submitting.value = true;
  try {
    await workflowApi.addDefinitionTransition(props.definitionId, {
      fromNodeKey: form.value.fromNodeKey,
      toNodeKey: form.value.toNodeKey,
      action,
      conditionExpression: buildConditionExpression(),
    });
    ElMessage.success('流转规则已添加');
    visible.value = false;
    emit('saved');
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.cond-hint {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.cond-field-tag {
  margin: 2px 4px 2px 0;
  cursor: pointer;
}

.cond-preview {
  margin-top: 4px;
  padding: 6px 8px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  font-family: var(--el-font-family-mono, monospace);
  font-size: 13px;
  color: var(--el-text-color-regular);
}
</style>
