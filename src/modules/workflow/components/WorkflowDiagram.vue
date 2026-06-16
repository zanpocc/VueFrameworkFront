<template>
  <div class="workflow-diagram" aria-label="流程图">
    <div v-if="orderedNodes.length > 0" class="workflow-diagram__track">
      <template v-for="(node, index) in orderedNodes" :key="node.nodeKey">
        <div
          class="workflow-diagram__node"
          :class="{
            'workflow-diagram__node--active': node.nodeKey === activeNodeKey,
            'workflow-diagram__node--visited': visitedNodeKeys.includes(node.nodeKey),
            'workflow-diagram__node--clickable': interactive,
          }"
          role="button"
          tabindex="0"
          @click="emit('node-click', node)"
          @keydown.enter.prevent="emit('node-click', node)"
          @keydown.space.prevent="emit('node-click', node)"
        >
          <span class="workflow-diagram__node-type">{{ nodeTypeText(node.nodeType) }}</span>
          <strong>{{ node.nodeName }}</strong>
          <small>{{ node.nodeKey }}</small>
          <span v-if="node.assigneeValue" class="workflow-diagram__assignee">
            {{ node.assigneeType }} / {{ node.assigneeValue }}
          </span>
        </div>

        <div v-if="index < orderedNodes.length - 1" class="workflow-diagram__arrow">
          <span>{{ transitionText(node.nodeKey, orderedNodes[index + 1]?.nodeKey) }}</span>
        </div>
      </template>
    </div>

    <el-empty v-else description="暂无流程节点" :image-size="60" />

    <div v-if="extraTransitions.length > 0" class="workflow-diagram__branches">
      <span
        v-for="transition in extraTransitions"
        :key="transition.id"
        class="workflow-diagram__branch"
      >
        {{ transition.fromNodeKey }} -- {{ transition.action }} --> {{ transition.toNodeKey }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElEmpty } from 'element-plus';
import type { DefinitionNode, DefinitionTransition } from '@/api/workflow';

const props = withDefaults(
  defineProps<{
    nodes: DefinitionNode[];
    transitions: DefinitionTransition[];
    activeNodeKey?: string | null;
    visitedNodeKeys?: string[];
    interactive?: boolean;
  }>(),
  {
    activeNodeKey: null,
    visitedNodeKeys: () => [],
    interactive: false,
  },
);

const emit = defineEmits<{
  (event: 'node-click', node: DefinitionNode): void;
}>();

const orderedNodes = computed(() => {
  const byKey = new Map(props.nodes.map((node) => [node.nodeKey, node]));
  const ordered: DefinitionNode[] = [];
  const visited = new Set<string>();
  const startNode =
    props.nodes.find((node) => node.nodeType === 'START') ??
    [...props.nodes].sort((a, b) => a.sortOrder - b.sortOrder)[0];

  let current: DefinitionNode | undefined = startNode;
  while (current && !visited.has(current.nodeKey)) {
    ordered.push(current);
    visited.add(current.nodeKey);
    const nextTransition = props.transitions
      .filter((transition) => transition.fromNodeKey === current?.nodeKey)
      .sort((a, b) => a.sortOrder - b.sortOrder)[0];
    current = nextTransition ? byKey.get(nextTransition.toNodeKey) : undefined;
  }

  const remaining = props.nodes
    .filter((node) => !visited.has(node.nodeKey))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return [...ordered, ...remaining];
});

const mainEdgeKeys = computed(() => {
  const keys = new Set<string>();
  orderedNodes.value.forEach((node, index) => {
    const next = orderedNodes.value[index + 1];
    if (next) {
      keys.add(edgeKey(node.nodeKey, next.nodeKey));
    }
  });
  return keys;
});

const extraTransitions = computed(() =>
  props.transitions.filter(
    (transition) => !mainEdgeKeys.value.has(edgeKey(transition.fromNodeKey, transition.toNodeKey)),
  ),
);

function transitionText(fromNodeKey: string, toNodeKey?: string) {
  const transition = props.transitions.find(
    (item) => item.fromNodeKey === fromNodeKey && item.toNodeKey === toNodeKey,
  );
  return transition?.action ?? 'NEXT';
}

function nodeTypeText(type: string) {
  const map: Record<string, string> = {
    START: '开始',
    APPROVAL: '审批',
    END: '结束',
  };
  return map[type] ?? type;
}

function edgeKey(from: string, to: string) {
  return `${from}->${to}`;
}
</script>

<style scoped>
.workflow-diagram {
  display: grid;
  gap: 12px;
}

.workflow-diagram__track {
  display: flex;
  gap: 8px;
  align-items: stretch;
  overflow-x: auto;
  padding: 4px 0;
}

.workflow-diagram__node {
  display: grid;
  gap: 4px;
  min-width: 150px;
  padding: 10px 12px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
}

.workflow-diagram__node--clickable {
  cursor: pointer;
}

.workflow-diagram__node--clickable:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
}

.workflow-diagram__node--visited {
  border-color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}

.workflow-diagram__node--active {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}

.workflow-diagram__node-type,
.workflow-diagram__assignee,
.workflow-diagram__node small {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.workflow-diagram__arrow {
  display: grid;
  flex: 0 0 84px;
  place-items: center;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.workflow-diagram__arrow::before {
  width: 100%;
  height: 1px;
  margin-bottom: -11px;
  content: '';
  background: var(--el-border-color);
}

.workflow-diagram__arrow span {
  z-index: 1;
  padding: 0 6px;
  background: var(--el-bg-color);
}

.workflow-diagram__branches {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.workflow-diagram__branch {
  padding: 4px 8px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: 4px;
  font-size: 12px;
}
</style>
