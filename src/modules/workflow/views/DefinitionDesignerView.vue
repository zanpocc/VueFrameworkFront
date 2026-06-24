<template>
  <div class="designer">
    <div class="designer__header">
      <el-button text @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回定义列表
      </el-button>
      <span class="designer__title">
        画板设计：{{ definition?.processName ?? '' }}
        <el-tag v-if="definition" size="small" style="margin-left: 8px">{{
          definition.processKey
        }}</el-tag>
      </span>
      <div class="designer__toolbar">
        <el-button @click="handleAutoLayout">自动布局</el-button>
        <el-button @click="exportModel">导出模型</el-button>
        <el-button :loading="importing" @click="openImportFile">导入模型</el-button>
        <el-button type="primary" :loading="savingLayout" @click="saveLayout">保存布局</el-button>
        <input
          ref="importInputRef"
          class="designer__file-input"
          type="file"
          accept="application/json,.json"
          @change="handleImportFile"
        />
      </div>
    </div>

    <div v-loading="loading" class="designer__body">
      <!-- 左侧：节点托盘 -->
      <aside class="designer__palette">
        <div class="designer__panel-title">节点托盘</div>
        <div
          v-for="palette in palettes"
          :key="palette.type"
          class="palette__item"
          draggable="true"
          @dragstart="onDragStart($event, palette.type)"
        >
          <span class="palette__icon" :style="{ background: palette.color }">{{
            palette.icon
          }}</span>
          <div>
            <strong>{{ palette.label }}</strong>
            <small>{{ palette.hint }}</small>
          </div>
        </div>
        <el-divider />
        <div class="palette__tip">
          拖拽节点到画布；点击节点查看右侧属性；从节点右侧连接桩拖出连线创建流转。
        </div>
      </aside>

      <!-- 中间：Vue Flow 画布 -->
      <section
        ref="canvasWrapperRef"
        class="designer__canvas"
        @drop="onDrop"
        @dragover.prevent
      >
        <VueFlow
          v-model:nodes="flowNodes"
          v-model:edges="flowEdges"
          :node-types="nodeTypes"
          :default-edge-options="defaultEdgeOptions"
          fit-view-on-init
          @nodes-change="onNodesChange"
          @edge-click="onEdgeClick"
          @node-click="onNodeClick"
          @connect="onConnect"
          @pane-click="clearSelection"
        >
          <Background pattern-color="#e4e7ed" :gap="16" />
          <Controls />
        </VueFlow>
        <div v-if="flowNodes.length === 0" class="designer__empty">
          画布为空：从左侧托盘拖入开始 / 审批 / 结束节点。
        </div>
      </section>

      <!-- 右侧：属性检查器 -->
      <aside class="designer__inspector">
        <div v-if="selectedNode" class="inspector__section">
          <NodePropertyDrawer
            :node="selectedNode"
            @edit="openNodeDialog(selectedNode)"
            @delete="handleDeleteNode(selectedNode)"
          />
        </div>
        <div v-else-if="selectedEdge" class="inspector__section">
          <EdgePropertyDrawer
            :edge="selectedEdge"
            :from-node-name="nodeName(selectedEdge.fromNodeKey)"
            :to-node-name="nodeName(selectedEdge.toNodeKey)"
            @delete="handleDeleteTransition(selectedEdge)"
          />
        </div>
        <el-empty
          v-else
          description="点击画布中的节点或连线进行配置"
          :image-size="60"
        />
      </aside>
    </div>

    <NodeEditDialog
      v-model="nodeDialogVisible"
      :definition-id="definitionId"
      :edit-node="editNode"
      @saved="onNodeSaved"
    />

    <TransitionEditDialog
      v-model="transitionDialogVisible"
      :definition-id="definitionId"
      :nodes="nodes"
      :form-id="definition?.formId"
      :preset-from-key="connectionPresetFrom"
      :preset-to-key="connectionPresetTo"
      @saved="onTransitionSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import {
  VueFlow,
  type Node,
  type Edge,
  type Connection,
} from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';

import {
  workflowApi,
  type ProcessDefinition,
  type DefinitionNode,
  type DefinitionTransition,
  type ProcessModelImportCommand,
} from '@/api/workflow';
import StartNode from '../designer/StartNode.vue';
import ApprovalNode from '../designer/ApprovalNode.vue';
import EndNode from '../designer/EndNode.vue';
import NodePropertyDrawer from '../designer/NodePropertyDrawer.vue';
import EdgePropertyDrawer from '../designer/EdgePropertyDrawer.vue';
import NodeEditDialog from '../components/NodeEditDialog.vue';
import TransitionEditDialog from '../components/TransitionEditDialog.vue';
import { autoLayout } from '../utils/autoLayout';
import { toCanvasNodeType } from '../utils/canvasTypes';

defineOptions({ name: 'DefinitionDesigner' });

const route = useRoute();
const router = useRouter();
const definitionId = Number(route.params.id);

// ---- data ----
const loading = ref(false);
const importing = ref(false);
const savingLayout = ref(false);
const definition = ref<ProcessDefinition | null>(null);
const nodes = ref<DefinitionNode[]>([]);
const transitions = ref<DefinitionTransition[]>([]);

/**
 * Vue Flow stores its own internal node/edge model (with computed, handles, etc.).
 * The full generic `Node<CanvasNodeData>` / `Edge<CanvasEdgeData>` can hit
 * `vue-tsc` type-instantiation-depth errors (TS2589). We hold the canvas model
 * loosely typed and let Vue Flow accept it via v-model — runtime shape matches.
 */
const flowNodes = ref<Node[]>([]);
const flowEdges = ref<Edge[]>([]);

const selectedNodeKey = ref<string | null>(null);
const selectedEdgeId = ref<number | null>(null);

const selectedNode = computed(
  () => nodes.value.find((n) => n.nodeKey === selectedNodeKey.value) ?? null,
);
const selectedEdge = computed(
  () => transitions.value.find((t) => t.id === selectedEdgeId.value) ?? null,
);

// ---- Vue Flow registry ----
// markRaw prevents Vue from making the components reactive (Vue Flow accesses
// the component meta internally and reactivity adds unnecessary overhead).
const nodeTypes = {
  start: markRaw(StartNode),
  approval: markRaw(ApprovalNode),
  end: markRaw(EndNode),
};

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: false,
  style: { stroke: '#909399', strokeWidth: 1.5 },
};

// ---- palette config ----
const palettes = [
  { type: 'START', label: '开始节点', icon: '▶', color: '#67c23a', hint: '流程入口（每个流程只能有一个）' },
  { type: 'APPROVAL', label: '审批节点', icon: '✓', color: '#e6a23c', hint: '人工审批 / 候选人组' },
  { type: 'END', label: '结束节点', icon: '■', color: '#909399', hint: '流程出口' },
];

// ---- Node edit dialog ----
const nodeDialogVisible = ref(false);
const editNode = ref<DefinitionNode | null>(null);
const pendingPosition = ref<{ x: number; y: number } | null>(null);
const pendingNodeType = ref<string | null>(null);

// ---- Transition dialog ----
const transitionDialogVisible = ref(false);
const connectionPresetFrom = ref<string | null>(null);
const connectionPresetTo = ref<string | null>(null);

// ---- drag-drop ----
const canvasWrapperRef = ref<HTMLElement>();
const importInputRef = ref<HTMLInputElement>();

function onDragStart(event: DragEvent, nodeType: string) {
  if (!event.dataTransfer) return;
  event.dataTransfer.setData('application/qf-node-type', nodeType);
  event.dataTransfer.effectAllowed = 'move';
}

function onDrop(event: DragEvent) {
  event.preventDefault();
  const nodeType = event.dataTransfer?.getData('application/qf-node-type');
  if (!nodeType) return;
  const wrapper = canvasWrapperRef.value;
  if (!wrapper) return;
  const rect = wrapper.getBoundingClientRect();
  pendingPosition.value = {
    x: event.clientX - rect.left - 80,
    y: event.clientY - rect.top - 20,
  };
  pendingNodeType.value = nodeType;
  // Reuse NodeEditDialog by pre-populating type; the dialog already has the
  // assigneeType/value pickers built. Sort order = next.
  editNode.value = null;
  nodeDialogVisible.value = true;
}

// ---- data loading ----
function goBack() {
  router.push({ name: 'workflow' });
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
    rebuildCanvas();
  } finally {
    loading.value = false;
  }
}

async function loadNodes() {
  nodes.value = await workflowApi.getDefinitionNodes(definitionId);
}

async function loadTransitions() {
  transitions.value = await workflowApi.getDefinitionTransitions(definitionId);
}

function rebuildCanvas() {
  // Compute fallback positions for any node missing pos_x/pos_y
  const missingPos = nodes.value.some((n) => n.posX === null || n.posY === null);
  const fallback = missingPos ? autoLayout(nodes.value, transitions.value) : null;

  // Cast through `unknown` then `Node[]` — Vue Flow's Node generic recurses too
  // deeply for vue-tsc to instantiate against the fresh object literal.
  flowNodes.value = nodes.value.map((node) => {
    const fb = fallback?.get(node.nodeKey);
    const x = node.posX ?? fb?.x ?? 60;
    const y = node.posY ?? fb?.y ?? 40;
    return {
      id: node.nodeKey,
      type: toCanvasNodeType(node.nodeType),
      position: { x, y },
      data: {
        label: node.nodeName,
        nodeKey: node.nodeKey,
        nodeType: node.nodeType,
        assigneeType: node.assigneeType,
        assigneeValue: node.assigneeValue,
        sortOrder: node.sortOrder,
        rawId: node.id,
      },
      selected: node.nodeKey === selectedNodeKey.value,
    };
  }) as unknown as Node[];

  flowEdges.value = transitions.value.map((t) => ({
    id: `e-${t.id}`,
    source: t.fromNodeKey,
    target: t.toNodeKey,
    label: t.action,
    data: {
      rawId: t.id,
      action: t.action,
      conditionExpression: t.conditionExpression,
      sortOrder: t.sortOrder,
    },
    style: edgeStyle(t.action),
    labelStyle: { fontSize: '12px' },
  })) as unknown as Edge[];
}

function edgeStyle(action: string): Record<string, string | number> {
  const palette: Record<string, string> = {
    APPROVE: '#67c23a',
    REJECT: '#f56c6c',
    SUBMIT: '#409eff',
  };
  return { stroke: palette[action] ?? '#909399', strokeWidth: 1.5 };
}

// ---- selection ----
// `event.node` / `event.edge` come back as Vue Flow's full internal model;
// we only read the bits we put into them, so loose typing is sufficient here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onNodeClick(event: { node: any }) {
  selectedNodeKey.value = event.node.id;
  selectedEdgeId.value = null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onEdgeClick(event: { edge: any }) {
  selectedEdgeId.value = event.edge.data?.rawId ?? null;
  selectedNodeKey.value = null;
}

function clearSelection() {
  selectedNodeKey.value = null;
  selectedEdgeId.value = null;
}

// ---- node changes (drag) ----
function onNodesChange(_changes: unknown) {
  // Vue Flow handles position internally via v-model — we just need to know a
  // change happened so the user can "Save layout". Selection is tracked via
  // node-click handler. Param is required by the event signature but unused.
  void _changes;
}

// ---- new connection (edge drag) ----
function onConnect(connection: Connection) {
  if (!connection.source || !connection.target) return;
  connectionPresetFrom.value = connection.source;
  connectionPresetTo.value = connection.target;
  transitionDialogVisible.value = true;
}

// ---- CRUD callbacks ----
async function onNodeSaved() {
  // After dialog closes, sync DB + persist drag-drop position (if any) to the
  // newly created node so a fresh page load keeps it.
  await loadNodes();
  if (pendingPosition.value && pendingNodeType.value && !editNode.value) {
    // The most recently created node (last in sort order) — find by key match.
    // NodeEditDialog doesn't expose the new node, so we sweep for nodes with
    // missing posX/posY and only patch the freshly added one (which is the
    // only one created in this flow).
    const fresh = nodes.value.find((n) => n.posX === null);
    if (fresh) {
      await workflowApi.updateNodePositions(definitionId, [
        { nodeKey: fresh.nodeKey, posX: pendingPosition.value.x, posY: pendingPosition.value.y },
      ]);
      await loadNodes();
    }
  }
  pendingPosition.value = null;
  pendingNodeType.value = null;
  rebuildCanvas();
}

async function onTransitionSaved() {
  connectionPresetFrom.value = null;
  connectionPresetTo.value = null;
  await loadTransitions();
  rebuildCanvas();
}

function openNodeDialog(node?: DefinitionNode) {
  editNode.value = node ?? null;
  nodeDialogVisible.value = true;
}

async function handleDeleteNode(node: DefinitionNode) {
  await ElMessageBox.confirm(
    `确定要删除节点「${node.nodeName}」吗？关联的流转规则也将失效。`,
    '删除确认',
    { type: 'warning' },
  );
  await workflowApi.deleteDefinitionNode(definitionId, node.nodeKey);
  ElMessage.success('节点已删除');
  if (selectedNodeKey.value === node.nodeKey) selectedNodeKey.value = null;
  await loadNodes();
  await loadTransitions();
  rebuildCanvas();
}

async function handleDeleteTransition(t: DefinitionTransition) {
  await ElMessageBox.confirm('确定要删除此流转规则吗？', '删除确认', { type: 'warning' });
  await workflowApi.deleteDefinitionTransition(definitionId, t.id);
  ElMessage.success('流转规则已删除');
  selectedEdgeId.value = null;
  await loadTransitions();
  rebuildCanvas();
}

// ---- layout actions ----
function handleAutoLayout() {
  const layout = autoLayout(nodes.value, transitions.value);
  // Cast through `unknown[]` so the spread doesn't try to instantiate the deep
  // generic Vue Flow Node type for each callback invocation.
  const current = flowNodes.value as unknown as Array<Record<string, unknown>>;
  flowNodes.value = current.map((n) => {
    const pos = layout.get(n.id as string);
    return pos ? { ...n, position: pos } : n;
  }) as unknown as Node[];
  ElMessage.success('已重新布局，记得点"保存布局"');
}

async function saveLayout() {
  const current = flowNodes.value as unknown as Array<Record<string, unknown>>;
  const positions = current.map((n) => ({
    nodeKey: n.id as string,
    posX: (n.position as Record<string, number>).x,
    posY: (n.position as Record<string, number>).y,
  }));
  savingLayout.value = true;
  try {
    await workflowApi.updateNodePositions(definitionId, positions);
    ElMessage.success('布局已保存');
    await loadNodes();
  } finally {
    savingLayout.value = false;
  }
}

// ---- import / export ----
function exportModel() {
  const payload: ProcessModelImportCommand = {
    nodes: nodes.value.map((node) => ({
      nodeKey: node.nodeKey,
      nodeName: node.nodeName,
      nodeType: node.nodeType,
      assigneeType: node.assigneeType,
      assigneeValue: node.assigneeValue ?? undefined,
      sortOrder: node.sortOrder,
      posX: node.posX,
      posY: node.posY,
    })),
    transitions: transitions.value.map((t) => ({
      fromNodeKey: t.fromNodeKey,
      toNodeKey: t.toNodeKey,
      action: t.action,
      conditionExpression: t.conditionExpression,
      sortOrder: t.sortOrder,
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
    payload = JSON.parse(await file.text()) as ProcessModelImportCommand;
    if (!Array.isArray(payload.nodes) || payload.nodes.length === 0) {
      throw new Error('流程模型 nodes 必须是非空数组');
    }
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
    rebuildCanvas();
    ElMessage.success('流程模型已导入');
  } finally {
    importing.value = false;
  }
}

// ---- helpers ----
function nodeName(nodeKey: string) {
  return nodes.value.find((n) => n.nodeKey === nodeKey)?.nodeName ?? nodeKey;
}

// ---- lifecycle ----
watch(
  () => selectedNodeKey.value,
  () => {
    // Sync Vue Flow's `selected` flag with our app-level selection.
    const current = flowNodes.value as unknown as Array<Record<string, unknown>>;
    flowNodes.value = current.map((n) => ({
      ...n,
      selected: n.id === selectedNodeKey.value,
    })) as unknown as Node[];
  },
);

onMounted(async () => {
  await loadData();
  // Defer to next tick so Vue Flow has measured the canvas before fit-view runs.
  await nextTick();
});

// Hand-craft TransitionEditDialog props bridge: the existing dialog doesn't
// accept preset keys, but adding them is non-disruptive and uses default null.
</script>

<style scoped>
.designer {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 12px;
  height: calc(100vh - 80px);
}

.designer__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.designer__title {
  font-size: 16px;
  font-weight: 600;
  flex: 1;
}

.designer__toolbar {
  display: flex;
  gap: 8px;
}

.designer__file-input {
  display: none;
}

.designer__body {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr) 320px;
  gap: 12px;
  min-height: 0;
}

.designer__palette,
.designer__inspector {
  display: grid;
  align-content: start;
  gap: 8px;
  padding: 12px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  overflow: auto;
}

.designer__panel-title {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 4px;
}

.palette__item {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  padding: 8px;
  background: var(--el-fill-color-light);
  border: 1px dashed var(--el-border-color);
  border-radius: 4px;
  cursor: grab;
  user-select: none;
}

.palette__item:active {
  cursor: grabbing;
}

.palette__item:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.palette__item strong {
  display: block;
  font-size: 13px;
}

.palette__item small {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.palette__icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: white;
  font-size: 14px;
}

.palette__tip {
  padding: 8px;
  background: var(--el-color-info-light-9);
  border-radius: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.designer__canvas {
  position: relative;
  min-width: 0;
  min-height: 0;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  overflow: hidden;
}

.designer__canvas :deep(.vue-flow__node) {
  cursor: pointer;
}

.designer__empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
  pointer-events: none;
}

.inspector__section {
  padding: 4px;
}
</style>