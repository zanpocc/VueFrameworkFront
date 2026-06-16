<template>
  <QfDetailDrawer
    :model-value="modelValue"
    :title="`报修单详情：${order?.code ?? ''}`"
    :loading="loading"
    width="700px"
    @update:model-value="emit('update:modelValue', $event)"
    @open="loadData"
  >
    <template v-if="order">
      <!-- 基本信息 -->
      <el-descriptions :column="2" border>
        <el-descriptions-item label="单号">{{ order.code }}</el-descriptions-item>
        <el-descriptions-item label="标题">{{ order.title }}</el-descriptions-item>
        <el-descriptions-item label="设备编码">{{ order.equipmentCode }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ order.applicant }}</el-descriptions-item>
        <el-descriptions-item label="流程状态">
          <QfStatusTag :status="order.wfStatus" :mapping="REPAIR_WF_STATUS_MAP" />
        </el-descriptions-item>
        <el-descriptions-item label="当前节点">
          {{ order.wfCurrentNode ?? '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="发起时间">{{ order.wfStartedAt ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ order.wfEndedAt ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">
          {{ order.createdAt }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 故障描述 -->
      <template v-if="order.description">
        <el-divider content-position="left">故障描述</el-divider>
        <div class="repair-detail__description">{{ order.description }}</div>
      </template>

      <!-- 表单数据（只读） -->
      <template v-if="formSchema && formDataObj">
        <el-divider content-position="left">表单数据</el-divider>
        <QfFormRenderer :schema="formSchema" :model-value="formDataObj" :disabled="true" />
      </template>

      <!-- 附件 -->
      <template v-if="order.attachments.length > 0">
        <el-divider content-position="left">附件</el-divider>
        <div class="repair-detail__attachments">
          <div v-for="att in order.attachments" :key="att.id" class="repair-detail__attachment">
            <el-link type="primary" :href="`/api/files/${att.fileId}/download`" target="_blank">
              附件 #{{ att.fileId }}
            </el-link>
            <span class="repair-detail__attachment-time">{{ att.uploadedAt }}</span>
          </div>
        </div>
      </template>

      <!-- 审批历史 -->
      <template v-if="order.wfInstanceId">
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
            <div v-if="item.comment" class="repair-detail__comment">{{ item.comment }}</div>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无审批记录" :image-size="60" />
      </template>

      <template v-else>
        <el-divider content-position="left">流程状态</el-divider>
        <el-empty description="流程未发起" :image-size="60" />
      </template>
    </template>
  </QfDetailDrawer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { QfDetailDrawer, QfStatusTag } from '@/shared';
import { QfFormRenderer, parseSchema } from '@/form-engine';
import type { FormSchema } from '@/form-engine';
import type { RepairOrderView } from '@/api/demo';
import { workflowApi, type WorkflowHistory } from '@/api/workflow';
import { REPAIR_WF_STATUS_MAP } from '../constants';
import { ACTION_STATUS_MAP } from '@/modules/workflow/constants';

const props = defineProps<{
  modelValue: boolean;
  order: RepairOrderView | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const loading = ref(false);
const historyRows = ref<WorkflowHistory[]>([]);
const formSchema = ref<FormSchema | null>(null);
const formDataObj = ref<Record<string, unknown> | null>(null);

async function loadData() {
  if (!props.order) return;
  loading.value = true;

  try {
    if (props.order.wfInstanceId) {
      const [history, forms] = await Promise.all([
        workflowApi.history(props.order.wfInstanceId).catch(() => []),
        workflowApi.forms().catch(() => []),
      ]);

      historyRows.value = history;

      const form = forms.find((f) => f.formKey === 'demo-repair-order');
      if (form?.schemaJson) {
        formSchema.value = parseSchema(form.schemaJson);
      }

      formDataObj.value = {
        title: props.order.title,
        description: props.order.description,
        equipmentCode: props.order.equipmentCode,
      };
    } else {
      historyRows.value = [];
      formSchema.value = null;
      formDataObj.value = null;
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.repair-detail__description {
  color: var(--el-text-color-regular);
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.repair-detail__attachments {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.repair-detail__attachment {
  display: flex;
  align-items: center;
  gap: 12px;
}

.repair-detail__attachment-time {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.repair-detail__comment {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
