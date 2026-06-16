<template>
  <el-dialog
    v-model="visible"
    title="添加流转规则"
    width="500px"
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
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { FormRules, FormInstance } from 'element-plus';
import { ElMessage } from 'element-plus';
import { workflowApi, type DefinitionNode, type TransitionCommand } from '@/api/workflow';

const props = defineProps<{
  definitionId: number;
  nodes: DefinitionNode[];
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
});

const rules: FormRules = {
  fromNodeKey: [{ required: true, message: '请选择源节点', trigger: 'change' }],
  action: [{ required: true, message: '请选择动作', trigger: 'change' }],
  toNodeKey: [{ required: true, message: '请选择目标节点', trigger: 'change' }],
};

function onOpen() {
  form.value = { fromNodeKey: '', toNodeKey: '', action: 'APPROVE' };
  customAction.value = '';
}

async function handleSubmit() {
  if (!formRef.value) return;
  await formRef.value.validate();

  const action = form.value.action === '__custom__' ? customAction.value : form.value.action;
  if (!action) {
    ElMessage.error('请输入自定义动作名称');
    return;
  }

  submitting.value = true;
  try {
    await workflowApi.addDefinitionTransition(props.definitionId, {
      fromNodeKey: form.value.fromNodeKey,
      toNodeKey: form.value.toNodeKey,
      action,
    });
    ElMessage.success('流转规则已添加');
    visible.value = false;
    emit('saved');
  } finally {
    submitting.value = false;
  }
}
</script>
