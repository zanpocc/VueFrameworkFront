<template>
  <QfDetailDrawer
    :model-value="modelValue"
    :title="`流程详情：${instance?.title ?? ''}`"
    :loading="loading"
    width="760px"
    @update:model-value="emit('update:modelValue', $event)"
    @open="loadData"
  >
    <template v-if="instance">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="状态">
          <QfStatusTag :status="instance.status" :mapping="WORKFLOW_STATUS_MAP" />
        </el-descriptions-item>
        <el-descriptions-item label="发起人">{{ instance.initiator }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ instance.startedAt }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ instance.endedAt ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="当前处理人">{{
          instance.currentAssignee ?? '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="业务标识">{{
          instance.businessKey ?? '-'
        }}</el-descriptions-item>
      </el-descriptions>

      <template v-if="formSchema && formDataObj">
        <el-divider content-position="left">表单数据</el-divider>
        <QfFormRenderer :schema="formSchema" :model-value="formDataObj" :disabled="true" />
      </template>

      <el-divider content-position="left">流程监控</el-divider>
      <WorkflowDiagram
        :nodes="definitionNodes"
        :transitions="definitionTransitions"
        :active-node-key="activeNodeKey"
        :visited-node-keys="visitedNodeKeys"
      />
      <el-timeline v-if="eventRows.length > 0" class="instance-detail__events">
        <el-timeline-item
          v-for="event in eventRows"
          :key="event.id"
          :timestamp="event.createdAt"
          placement="top"
        >
          <div>
            <strong>{{ event.eventType }}</strong>
            <span v-if="event.nodeKey" class="instance-detail__event-node">
              {{ event.nodeKey }}
            </span>
          </div>
          <div v-if="event.operator" class="instance-detail__comment">
            操作人：{{ event.operator }}
          </div>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无流程事件" :image-size="60" />

      <el-divider content-position="left">审批历史</el-divider>
      <el-timeline v-if="historyRows.length > 0">
        <el-timeline-item
          v-for="item in historyRows"
          :key="item.id"
          :timestamp="item.createdAt"
          placement="top"
        >
          <div>
            <strong>{{ item.operator }}</strong>
            <QfStatusTag
              :status="item.action"
              :mapping="ACTION_STATUS_MAP"
              style="margin-left: 8px"
            />
          </div>
          <div v-if="item.comment" class="instance-detail__comment">{{ item.comment }}</div>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无审批记录" :image-size="60" />
    </template>

    <template #footer>
      <el-button
        v-if="instance?.status === 'RUNNING' && isInitiator"
        type="warning"
        @click="handleWithdraw"
      >
        撤回
      </el-button>
      <QfPermissionButton
        v-if="instance?.status === 'RUNNING'"
        code="workflow:instance:start"
        type="danger"
        @click="handleTerminate"
      >
        终止
      </QfPermissionButton>
    </template>
  </QfDetailDrawer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { QfDetailDrawer, QfPermissionButton, QfStatusTag } from '@/shared';
import { QfFormRenderer, parseSchema } from '@/form-engine';
import type { FormSchema } from '@/form-engine';
import {
  workflowApi,
  type DefinitionNode,
  type DefinitionTransition,
  type ProcessInstance,
  type WorkflowEvent,
  type WorkflowHistory,
} from '@/api/workflow';
import { useAuthStore } from '@/stores/auth';
import { ACTION_STATUS_MAP, WORKFLOW_STATUS_MAP } from '../constants';
import WorkflowDiagram from './WorkflowDiagram.vue';

const props = defineProps<{
  modelValue: boolean;
  instance: ProcessInstance | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  actioned: [];
}>();

const authStore = useAuthStore();
const loading = ref(false);
const historyRows = ref<WorkflowHistory[]>([]);
const eventRows = ref<WorkflowEvent[]>([]);
const definitionNodes = ref<DefinitionNode[]>([]);
const definitionTransitions = ref<DefinitionTransition[]>([]);
const formSchema = ref<FormSchema | null>(null);
const formDataObj = ref<Record<string, unknown> | null>(null);

const isInitiator = computed(() => {
  if (!props.instance) return false;
  return props.instance.initiator === authStore.user?.username;
});

const visitedNodeKeys = computed(() =>
  Array.from(new Set(eventRows.value.map((event) => event.nodeKey).filter(Boolean) as string[])),
);

const activeNodeKey = computed(() => {
  const lastEvent = [...eventRows.value].reverse().find((event) => event.nodeKey);
  return lastEvent?.nodeKey ?? null;
});

async function loadData() {
  if (!props.instance) return;
  loading.value = true;

  try {
    const [history, events, nodes, transitions, forms] = await Promise.all([
      workflowApi.history(props.instance.id).catch(() => []),
      workflowApi.getInstanceEvents(props.instance.id).catch(() => []),
      workflowApi.getDefinitionNodes(props.instance.definitionId).catch(() => []),
      workflowApi.getDefinitionTransitions(props.instance.definitionId).catch(() => []),
      props.instance.formId ? workflowApi.forms().catch(() => []) : Promise.resolve([]),
    ]);

    historyRows.value = history;
    eventRows.value = events;
    definitionNodes.value = nodes;
    definitionTransitions.value = transitions;

    const form = forms.find((item) => item.id === props.instance!.formId);
    formSchema.value = form?.schemaJson ? parseSchema(form.schemaJson) : null;

    if (props.instance.formData) {
      try {
        formDataObj.value = JSON.parse(props.instance.formData);
      } catch {
        formDataObj.value = null;
      }
    } else {
      formDataObj.value = null;
    }
  } finally {
    loading.value = false;
  }
}

async function handleWithdraw() {
  if (!props.instance) return;
  await ElMessageBox.confirm('确定要撤回此流程吗？', '撤回确认', { type: 'warning' });
  await workflowApi.withdrawInstance(props.instance.id);
  ElMessage.success('流程已撤回');
  emit('actioned');
  emit('update:modelValue', false);
}

async function handleTerminate() {
  if (!props.instance) return;
  await ElMessageBox.confirm('确定要终止此流程吗？此操作不可撤销。', '终止确认', { type: 'error' });
  await workflowApi.terminateInstance(props.instance.id);
  ElMessage.success('流程已终止');
  emit('actioned');
  emit('update:modelValue', false);
}
</script>

<style scoped>
.instance-detail__comment {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.instance-detail__events {
  margin-top: 12px;
}

.instance-detail__event-node {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
