<template>
  <div class="def-editor">
    <div class="def-editor__header">
      <el-button text @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回定义列表
      </el-button>
      <span class="def-editor__title">
        流程定义：{{ definition?.processName ?? '' }}
        <el-tag v-if="definition" size="small" style="margin-left: 8px">{{
          definition.processKey
        }}</el-tag>
      </span>
    </div>

    <div v-loading="loading" class="def-editor__body">
      <section class="def-editor__canvas">
        <div class="def-editor__canvas-toolbar">
          <div class="def-editor__canvas-title">
            <strong>流程画布</strong>
            <span>点击节点后可在右侧配置，流转规则在右侧维护。</span>
          </div>
          <div class="def-editor__panel-actions">
            <el-button type="primary" @click="openNodeDialog()">添加节点</el-button>
            <el-button :disabled="nodes.length < 2" @click="transitionDialogVisible = true">
              添加流转
            </el-button>
            <el-button @click="exportModel">导出模型</el-button>
            <el-button :loading="importing" @click="openImportFile">导入模型</el-button>
            <input
              ref="importInputRef"
              class="def-editor__file-input"
              type="file"
              accept="application/json,.json"
              @change="handleImportFile"
            />
          </div>
        </div>

        <div class="def-editor__canvas-surface">
          <WorkflowDiagram
            :nodes="nodes"
            :transitions="transitions"
            :active-node-key="selectedNodeKey"
            interactive
            @node-click="selectNode"
          />
        </div>
      </section>

      <aside class="def-editor__inspector">
        <div class="def-editor__panel">
          <div class="def-editor__panel-header">
            <span>节点配置</span>
            <el-button
              size="small"
              type="primary"
              @click="openNodeDialog(selectedNode ?? undefined)"
            >
              {{ selectedNode ? '编辑节点' : '添加节点' }}
            </el-button>
          </div>

          <div v-if="selectedNode" class="def-editor__node-detail">
            <div class="def-editor__node-detail-title">
              <strong>{{ selectedNode.nodeName }}</strong>
              <el-tag size="small" :type="nodeTypeTag(selectedNode.nodeType)">
                {{ nodeTypeLabel(selectedNode.nodeType) }}
              </el-tag>
            </div>
            <dl>
              <dt>节点编码</dt>
              <dd>{{ selectedNode.nodeKey }}</dd>
              <dt>排序</dt>
              <dd>{{ selectedNode.sortOrder }}</dd>
              <template v-if="selectedNode.nodeType === 'APPROVAL'">
                <dt>审批人类型</dt>
                <dd>{{ selectedNode.assigneeType }}</dd>
                <dt>审批人</dt>
                <dd>{{ selectedNode.assigneeValue ?? '-' }}</dd>
              </template>
            </dl>
            <el-button type="danger" plain @click="handleDeleteNode(selectedNode)"
              >删除节点</el-button
            >
          </div>

          <el-empty v-else description="点击画布中的节点进行配置" :image-size="60" />
        </div>

        <div class="def-editor__panel">
          <div class="def-editor__panel-header">
            <span>流转规则 ({{ transitions.length }})</span>
            <el-button
              size="small"
              :disabled="nodes.length < 2"
              @click="transitionDialogVisible = true"
            >
              添加流转
            </el-button>
          </div>

          <div v-if="transitions.length > 0" class="def-editor__transition-list">
            <div
              v-for="transition in transitions"
              :key="transition.id"
              class="def-editor__transition-item"
            >
              <span>{{ nodeName(transition.fromNodeKey) }}</span>
              <el-tag size="small" :type="actionTagType(transition.action)">
                {{ transition.action }}
              </el-tag>
              <span>{{ nodeName(transition.toNodeKey) }}</span>
              <el-button
                size="small"
                text
                type="danger"
                @click="handleDeleteTransition(transition)"
              >
                删除
              </el-button>
              <div v-if="transition.conditionExpression" class="def-editor__transition-cond">
                条件：{{ transition.conditionExpression }}
              </div>
            </div>
          </div>

          <el-empty v-else description="暂无流转规则" :image-size="60" />
        </div>
      </aside>
    </div>

    <NodeEditDialog
      v-model="nodeDialogVisible"
      :definition-id="definitionId"
      :edit-node="editNode"
      @saved="loadNodes"
    />

    <TransitionEditDialog
      v-model="transitionDialogVisible"
      :definition-id="definitionId"
      :nodes="nodes"
      :form-id="definition?.formId"
      @saved="loadTransitions"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import {
  workflowApi,
  type ProcessDefinition,
  type DefinitionNode,
  type DefinitionTransition,
  type NodeCommand,
  type ProcessModelImportCommand,
  type TransitionCommand,
} from '@/api/workflow';
import NodeEditDialog from '../components/NodeEditDialog.vue';
import TransitionEditDialog from '../components/TransitionEditDialog.vue';
import WorkflowDiagram from '../components/WorkflowDiagram.vue';

defineOptions({ name: 'DefinitionEditor' });

const route = useRoute();
const router = useRouter();
const definitionId = Number(route.params.id);

const loading = ref(false);
const importing = ref(false);
const importInputRef = ref<HTMLInputElement>();
const definition = ref<ProcessDefinition | null>(null);
const nodes = ref<DefinitionNode[]>([]);
const transitions = ref<DefinitionTransition[]>([]);
const selectedNodeKey = ref<string | null>(null);
const selectedNode = computed(
  () => nodes.value.find((node) => node.nodeKey === selectedNodeKey.value) ?? null,
);

// Node dialog state
const nodeDialogVisible = ref(false);
const editNode = ref<DefinitionNode | null>(null);

// Transition dialog state
const transitionDialogVisible = ref(false);

function goBack() {
  router.push({ name: (route.query.from as string) ?? 'workflow' });
}

async function loadData() {
  loading.value = true;
  try {
    const defs = await workflowApi.definitions();
    definition.value = defs.find((d) => d.id === definitionId) ?? null;
    if (!definition.value) {
      ElMessage.error('流程定义不存在');
      goBack();
      return;
    }
    await Promise.all([loadNodes(), loadTransitions()]);
  } finally {
    loading.value = false;
  }
}

async function loadNodes() {
  nodes.value = await workflowApi.getDefinitionNodes(definitionId);
  if (!selectedNode.value) {
    selectedNodeKey.value = nodes.value[0]?.nodeKey ?? null;
  }
}

async function loadTransitions() {
  transitions.value = await workflowApi.getDefinitionTransitions(definitionId);
}

function exportModel() {
  const payload: ProcessModelImportCommand = {
    nodes: nodes.value.map((node) => ({
      nodeKey: node.nodeKey,
      nodeName: node.nodeName,
      nodeType: node.nodeType,
      assigneeType: node.assigneeType,
      assigneeValue: node.assigneeValue ?? undefined,
      sortOrder: node.sortOrder,
    })),
    transitions: transitions.value.map((transition) => ({
      fromNodeKey: transition.fromNodeKey,
      toNodeKey: transition.toNodeKey,
      action: transition.action,
      conditionExpression: transition.conditionExpression,
      sortOrder: transition.sortOrder,
    })),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${definition.value?.processKey ?? 'workflow-model'}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function openImportFile() {
  importInputRef.value?.click();
}

async function handleImportFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  let payload: ProcessModelImportCommand;
  try {
    payload = normalizeImportedModel(JSON.parse(await file.text()));
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '流程模型文件解析失败');
    return;
  }

  try {
    await ElMessageBox.confirm('导入模型会替换当前流程节点和流转规则，是否继续？', '导入确认', {
      type: 'warning',
    });
  } catch {
    return;
  }

  importing.value = true;
  try {
    const result = await workflowApi.importDefinitionModel(definitionId, payload);
    nodes.value = result.nodes;
    transitions.value = result.transitions;
    ElMessage.success('流程模型已导入');
  } finally {
    importing.value = false;
  }
}

function normalizeImportedModel(value: unknown): ProcessModelImportCommand {
  const record = asRecord(value, '流程模型');
  if (!Array.isArray(record.nodes) || record.nodes.length === 0) {
    throw new Error('流程模型 nodes 必须是非空数组');
  }
  if (record.transitions !== undefined && !Array.isArray(record.transitions)) {
    throw new Error('流程模型 transitions 必须是数组');
  }
  return {
    nodes: record.nodes.map((node, index) => normalizeImportedNode(node, index)),
    transitions: (record.transitions ?? []).map((transition, index) =>
      normalizeImportedTransition(transition, index),
    ),
  };
}

function normalizeImportedNode(value: unknown, index: number): NodeCommand {
  const record = asRecord(value, `nodes[${index}]`);
  return {
    nodeKey: requiredString(record, 'nodeKey', `nodes[${index}].nodeKey`),
    nodeName: requiredString(record, 'nodeName', `nodes[${index}].nodeName`),
    nodeType: optionalString(record, 'nodeType') ?? 'APPROVAL',
    assigneeType: optionalString(record, 'assigneeType') ?? 'USER',
    assigneeValue: optionalString(record, 'assigneeValue'),
    sortOrder: optionalNumber(record, 'sortOrder'),
  };
}

function normalizeImportedTransition(value: unknown, index: number): TransitionCommand {
  const record = asRecord(value, `transitions[${index}]`);
  return {
    fromNodeKey: requiredString(record, 'fromNodeKey', `transitions[${index}].fromNodeKey`),
    toNodeKey: requiredString(record, 'toNodeKey', `transitions[${index}].toNodeKey`),
    action: requiredString(record, 'action', `transitions[${index}].action`),
    conditionExpression: optionalString(record, 'conditionExpression'),
    sortOrder: optionalNumber(record, 'sortOrder'),
  };
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} 必须是对象`);
  }
  return value as Record<string, unknown>;
}

function requiredString(record: Record<string, unknown>, key: string, label: string) {
  const value = record[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} 必须是非空字符串`);
  }
  return value.trim();
}

function optionalString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') {
    throw new Error(`${key} 必须是字符串`);
  }
  return value.trim();
}

function optionalNumber(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`${key} 必须是数字`);
  }
  return value;
}

function openNodeDialog(node?: DefinitionNode) {
  editNode.value = node ?? null;
  nodeDialogVisible.value = true;
}

function selectNode(node: DefinitionNode) {
  selectedNodeKey.value = node.nodeKey;
}

async function handleDeleteNode(node: DefinitionNode) {
  await ElMessageBox.confirm(
    `确定要删除节点「${node.nodeName}」吗？关联的流转规则也将失效。`,
    '删除确认',
    { type: 'warning' },
  );
  await workflowApi.deleteDefinitionNode(definitionId, node.nodeKey);
  ElMessage.success('节点已删除');
  if (selectedNodeKey.value === node.nodeKey) {
    selectedNodeKey.value = null;
  }
  await loadNodes();
  await loadTransitions();
}

async function handleDeleteTransition(t: DefinitionTransition) {
  await ElMessageBox.confirm('确定要删除此流转规则吗？', '删除确认', { type: 'warning' });
  await workflowApi.deleteDefinitionTransition(definitionId, t.id);
  ElMessage.success('流转规则已删除');
  await loadTransitions();
}

function nodeTypeLabel(type: string): string {
  const map: Record<string, string> = { START: '开始', APPROVAL: '审批', END: '结束' };
  return map[type] ?? type;
}

function nodeName(nodeKey: string): string {
  return nodes.value.find((node) => node.nodeKey === nodeKey)?.nodeName ?? nodeKey;
}

function nodeTypeTag(type: string): 'success' | 'warning' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'info'> = {
    START: 'success',
    APPROVAL: 'warning',
    END: 'info',
  };
  return map[type] ?? 'info';
}

function actionTagType(action: string): 'success' | 'danger' | 'primary' | 'info' {
  const map: Record<string, 'success' | 'danger' | 'primary' | 'info'> = {
    APPROVE: 'success',
    REJECT: 'danger',
    SUBMIT: 'primary',
  };
  return map[action] ?? 'info';
}

onMounted(loadData);
</script>

<style scoped>
.def-editor__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.def-editor__title {
  font-size: 16px;
  font-weight: 600;
}

.def-editor__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 16px;
  min-height: 560px;
}

.def-editor__canvas {
  display: grid;
  grid-template-rows: auto minmax(420px, 1fr);
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
}

.def-editor__canvas-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.def-editor__canvas-title {
  display: grid;
  gap: 4px;
}

.def-editor__canvas-title span {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.def-editor__canvas-surface {
  min-width: 0;
  min-height: 420px;
  padding: 16px;
  overflow: auto;
  background:
    linear-gradient(var(--el-border-color-lighter) 1px, transparent 1px),
    linear-gradient(90deg, var(--el-border-color-lighter) 1px, transparent 1px);
  background-color: var(--el-fill-color-blank);
  background-size: 24px 24px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
}

.def-editor__inspector {
  display: grid;
  align-content: start;
  gap: 12px;
  min-width: 0;
}

.def-editor__panel {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  padding: 12px;
}

.def-editor__panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 14px;
}

.def-editor__panel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.def-editor__file-input {
  display: none;
}

.def-editor__node-detail {
  display: grid;
  gap: 12px;
}

.def-editor__node-detail-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.def-editor__node-detail dl {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 8px 10px;
  margin: 0;
}

.def-editor__node-detail dt {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.def-editor__node-detail dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
  font-size: 13px;
}

.def-editor__transition-list {
  display: grid;
  gap: 8px;
}

.def-editor__transition-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  font-size: 13px;
}

.def-editor__transition-item span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.def-editor__transition-cond {
  grid-column: 1 / -1;
  padding-top: 4px;
  border-top: 1px dashed var(--el-border-color-lighter);
  color: var(--el-text-color-secondary);
  font-family: var(--el-font-family-mono, monospace);
  font-size: 12px;
  word-break: break-all;
}

@media (max-width: 1100px) {
  .def-editor__body {
    grid-template-columns: 1fr;
  }

  .def-editor__canvas-toolbar {
    flex-direction: column;
  }
}
</style>
