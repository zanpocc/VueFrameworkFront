<template>
  <div>
    <div class="repair-toolbar">
      <QfPermissionButton code="demo:repair:submit" type="primary" @click="dialog.openCreate()">
        提交报修
      </QfPermissionButton>
    </div>

    <QfDataTable
      :columns="columns"
      :data="filteredRows"
      :loading="table.loading.value"
      :actions-width="160"
    >
      <template #filters="{ reload }">
        <el-select
          v-model="statusFilter"
          placeholder="流程状态"
          clearable
          style="width: 140px"
          @change="reload"
        >
          <el-option label="全部" value="" />
          <el-option label="运行中" value="RUNNING" />
          <el-option label="已通过" value="APPROVED" />
          <el-option label="已拒绝" value="REJECTED" />
          <el-option label="已取消" value="CANCELED" />
        </el-select>
      </template>
      <template #wfStatus="{ row }">
        <QfStatusTag :status="row.wfStatus" :mapping="REPAIR_WF_STATUS_MAP" />
      </template>
      <template #actions="{ row }">
        <QfTableActions :actions="getActions(row)" :max-inline="2" />
      </template>
    </QfDataTable>

    <!-- 提交报修对话框 -->
    <QfFormDialog
      v-model="dialog.visible.value"
      title="提交报修单"
      :model="dialog.form"
      :rules="rules"
      :loading="dialog.submitting.value"
      @submit="dialog.submit()"
      @cancel="dialog.cancel()"
    >
      <el-form-item label="故障标题" prop="title">
        <el-input
          v-model="dialog.form.title"
          placeholder="如: 3号产线压合机异常"
          maxlength="128"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="故障描述" prop="description">
        <el-input
          v-model="dialog.form.description"
          type="textarea"
          :rows="3"
          placeholder="详细描述故障现象"
          maxlength="2000"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="设备编码" prop="equipmentCode">
        <el-input v-model="dialog.form.equipmentCode" placeholder="如: EQ-001" maxlength="64" />
      </el-form-item>
      <el-form-item label="附件">
        <QfFileUpload v-model="dialog.form.attachmentFileIds!" :multiple="true" :max-count="5" />
      </el-form-item>
    </QfFormDialog>

    <!-- 详情抽屉 -->
    <RepairOrderDetailDrawer v-model="detailVisible" :order="detailOrder" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import {
  QfDataTable,
  QfFormDialog,
  QfStatusTag,
  QfTableActions,
  QfPermissionButton,
  QfFileUpload,
} from '@/shared';
import type { QfTableColumn, QfActionItem } from '@/shared';
import { useTable, useDialogForm } from '@/shared';
import { demoApi, type RepairOrderView, type RepairOrderSubmitCommand } from '@/api/demo';
import { REPAIR_WF_STATUS_MAP } from '../constants';
import RepairOrderDetailDrawer from '../components/RepairOrderDetailDrawer.vue';

defineOptions({ name: 'RepairOrderList' });

const columns: QfTableColumn<RepairOrderView>[] = [
  { prop: 'code', label: '单号', width: 180 },
  { prop: 'title', label: '故障标题', minWidth: 160 },
  { prop: 'equipmentCode', label: '设备编码', width: 120 },
  { prop: 'applicant', label: '申请人', width: 100 },
  { prop: 'wfStatus', label: '流程状态', width: 110, slot: 'wfStatus' },
  { prop: 'createdAt', label: '创建时间', width: 170 },
];

const statusFilter = ref('');

const table = useTable<RepairOrderView>({
  fetcher: () => demoApi.repairOrders(),
});

const filteredRows = computed(() => {
  const rows = table.allRows.value;
  if (!statusFilter.value) return rows;
  return rows.filter((r) => r.wfStatus === statusFilter.value);
});

// ---- Submit dialog ----
const dialog = useDialogForm<RepairOrderSubmitCommand>({
  defaults: { title: '', description: '', equipmentCode: '', attachmentFileIds: [] },
  async onSubmit(form) {
    await demoApi.submitRepairOrder(form);
  },
  successMessage: () => '报修单已提交',
});

const rules: FormRules = {
  title: [{ required: true, message: '请输入故障标题', trigger: 'blur' }],
  equipmentCode: [{ required: true, message: '请输入设备编码', trigger: 'blur' }],
};

// ---- Detail drawer ----
const detailVisible = ref(false);
const detailOrder = ref<RepairOrderView | null>(null);

function openDetail(row: RepairOrderView) {
  detailOrder.value = row;
  detailVisible.value = true;
}

async function handleCancel(row: RepairOrderView) {
  try {
    await demoApi.cancelRepairOrder(row.id);
    ElMessage.success('报修单已取消');
  } catch {
    // 后端 stub 返回 501，http interceptor 已展示错误信息
  } finally {
    await table.reload();
  }
}

function getActions(row: unknown): QfActionItem[] {
  const r = row as RepairOrderView;
  return [
    {
      label: '详情',
      type: 'primary',
      handler: () => openDetail(r),
    },
    ...(r.wfStatus === 'RUNNING'
      ? [
          {
            label: '取消',
            type: 'danger' as const,
            permission: 'demo:repair:cancel',
            handler: () => handleCancel(r),
          },
        ]
      : []),
  ];
}
</script>

<style scoped>
.repair-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}
</style>
