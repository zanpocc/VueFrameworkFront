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
      <el-descriptions :column="2" border>
        <el-descriptions-item label="单号">{{ order.code }}</el-descriptions-item>
        <el-descriptions-item label="标题">{{ order.title }}</el-descriptions-item>
        <el-descriptions-item label="设备编码">{{ order.equipmentCode }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ order.applicant }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">
          {{ order.createdAt }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间" :span="2">
          {{ order.updatedAt }}
        </el-descriptions-item>
      </el-descriptions>

      <template v-if="order.description">
        <el-divider content-position="left">故障描述</el-divider>
        <div class="repair-detail__description">{{ order.description }}</div>
      </template>

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
    </template>
  </QfDetailDrawer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { QfDetailDrawer } from '@/shared';
import type { RepairOrderView } from '@/api/demo';

defineProps<{
  modelValue: boolean;
  order: RepairOrderView | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const loading = ref(false);

async function loadData() {
  loading.value = false;
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
</style>
