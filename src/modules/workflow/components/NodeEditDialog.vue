<template>
  <el-dialog
    v-model="visible"
    :title="isEditing ? '编辑节点' : '添加节点'"
    width="500px"
    :close-on-click-modal="false"
    @open="onOpen"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="节点标识 (key)" prop="nodeKey">
        <el-input
          v-model="form.nodeKey"
          :disabled="isEditing"
          placeholder="如: start, approve, end"
        />
      </el-form-item>
      <el-form-item label="节点名称" prop="nodeName">
        <el-input v-model="form.nodeName" placeholder="如: 开始, 审批, 结束" />
      </el-form-item>
      <el-form-item label="节点类型" prop="nodeType">
        <el-select v-model="form.nodeType" style="width: 100%">
          <el-option label="开始节点" value="START" />
          <el-option label="审批节点" value="APPROVAL" />
          <el-option label="结束节点" value="END" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.nodeType === 'APPROVAL'" label="审批人类型" prop="assigneeType">
        <el-select v-model="form.assigneeType" style="width: 100%" @change="onAssigneeTypeChange">
          <el-option label="指定用户" value="USER" />
          <el-option label="指定角色" value="ROLE" />
          <el-option label="指定部门" value="DEPT" />
          <el-option label="指定岗位" value="POST" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.nodeType === 'APPROVAL'" label="审批人" prop="assigneeValue">
        <!-- USER nodes assign by username (Flowable taskAssignee); ROLE/DEPT/POST
             nodes assign by id (candidate group "role:1" etc). assigneeValue is
             stored as a string in the DB column either way. -->
        <QfUserSelect
          v-if="form.assigneeType === 'USER'"
          v-model="form.assigneeValue"
          value-key="username"
          placeholder="请选择用户"
        />
        <QfRoleSelect
          v-else-if="form.assigneeType === 'ROLE'"
          v-model="assigneeId"
          placeholder="请选择角色"
        />
        <QfDeptSelect
          v-else-if="form.assigneeType === 'DEPT'"
          v-model="assigneeId"
          placeholder="请选择部门"
        />
        <QfPostSelect
          v-else-if="form.assigneeType === 'POST'"
          v-model="assigneeId"
          placeholder="请选择岗位"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { FormRules, FormInstance } from 'element-plus';
import { ElMessage } from 'element-plus';
import { workflowApi, type DefinitionNode, type NodeCommand } from '@/api/workflow';
import { QfUserSelect, QfRoleSelect, QfDeptSelect, QfPostSelect } from '@/shared';

const props = defineProps<{
  definitionId: number;
  editNode?: DefinitionNode | null;
}>();

const emit = defineEmits<{
  saved: [];
}>();

const visible = defineModel<boolean>({ default: false });

const isEditing = computed(() => !!props.editNode);
const submitting = ref(false);
const formRef = ref<FormInstance>();

const form = ref<NodeCommand>({
  nodeKey: '',
  nodeName: '',
  nodeType: 'APPROVAL',
  assigneeType: 'USER',
  assigneeValue: '',
});

const rules: FormRules = {
  nodeKey: [{ required: true, message: '请输入节点标识', trigger: 'blur' }],
  nodeName: [{ required: true, message: '请输入节点名称', trigger: 'blur' }],
  nodeType: [{ required: true, message: '请选择节点类型', trigger: 'change' }],
};

/**
 * Bridges the string-backed `form.assigneeValue` (DB column is VARCHAR) with the
 * number-typed v-model of the Qf*Select components. Selectors emit number | null;
 * we stringify on write so the backend receives the id as a string.
 */
const assigneeId = computed<number | null>({
  get: () => {
    const v = form.value.assigneeValue;
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  },
  set: (v) => {
    form.value.assigneeValue = v === null || v === undefined ? '' : String(v);
  },
});

/** Clear the assignee value when the kind changes so a stale id from another kind
 *  doesn't leak into the new selector (e.g. a user id fed to QfRoleSelect). */
function onAssigneeTypeChange() {
  form.value.assigneeValue = '';
}

function onOpen() {
  if (props.editNode) {
    form.value = {
      nodeKey: props.editNode.nodeKey,
      nodeName: props.editNode.nodeName,
      nodeType: props.editNode.nodeType,
      assigneeType: props.editNode.assigneeType || 'USER',
      assigneeValue: props.editNode.assigneeValue || '',
    };
  } else {
    form.value = {
      nodeKey: '',
      nodeName: '',
      nodeType: 'APPROVAL',
      assigneeType: 'USER',
      assigneeValue: '',
    };
  }
}

async function handleSubmit() {
  if (!formRef.value) return;
  await formRef.value.validate();

  submitting.value = true;
  try {
    if (isEditing.value) {
      // Backend doesn't have update node endpoint — delete + re-add
      await workflowApi.deleteDefinitionNode(props.definitionId, props.editNode!.nodeKey);
      await workflowApi.addDefinitionNode(props.definitionId, form.value);
    } else {
      await workflowApi.addDefinitionNode(props.definitionId, form.value);
    }
    ElMessage.success(isEditing.value ? '节点已更新' : '节点已添加');
    visible.value = false;
    emit('saved');
  } finally {
    submitting.value = false;
  }
}
</script>
