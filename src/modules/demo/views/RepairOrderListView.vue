<template>
  <QfPageShell>
    <QfPageHeader title="报修工单" description="提交设备报修并查看处理记录。">
      <template #actions>
        <QfPermissionButton code="demo:repair:submit" type="primary" @click="dialog.openCreate()">
          提交报修
        </QfPermissionButton>
      </template>
    </QfPageHeader>

    <QfTablePanel title="报修工单列表" description="查看已提交的设备报修单。">
      <QfDataTable
        :columns="columns"
        :data="table.allRows.value"
        :loading="table.loading.value"
        :actions-width="120"
      >
        <template #actions="{ row }">
          <QfTableActions :actions="getActions(row)" :max-inline="1" />
        </template>
      </QfDataTable>
    </QfTablePanel>

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

    <RepairOrderDetailDrawer v-model="detailVisible" :order="detailOrder" />
  </QfPageShell>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { FormRules } from 'element-plus';
import {
  QfDataTable,
  QfFormDialog,
  QfTableActions,
  QfPermissionButton,
  QfFileUpload,
  QfPageHeader,
  QfPageShell,
  QfTablePanel,
} from '@/shared';
import type { QfTableColumn, QfActionItem } from '@/shared';
import { useTable, useDialogForm } from '@/shared';
import { demoApi, type RepairOrderView, type RepairOrderSubmitCommand } from '@/api/demo';
import RepairOrderDetailDrawer from '../components/RepairOrderDetailDrawer.vue';

defineOptions({ name: 'RepairOrderList' });

const columns: QfTableColumn<RepairOrderView>[] = [
  { prop: 'code', label: '单号', width: 180 },
  { prop: 'title', label: '故障标题', minWidth: 160 },
  { prop: 'equipmentCode', label: '设备编码', width: 120 },
  { prop: 'applicant', label: '申请人', width: 100 },
  { prop: 'createdAt', label: '创建时间', width: 170 },
];

const table = useTable<RepairOrderView>({
  fetcher: () => demoApi.repairOrders(),
});

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

const detailVisible = ref(false);
const detailOrder = ref<RepairOrderView | null>(null);

function openDetail(row: RepairOrderView) {
  detailOrder.value = row;
  detailVisible.value = true;
}

function getActions(row: unknown): QfActionItem[] {
  const repairOrder = row as RepairOrderView;
  return [
    {
      label: '详情',
      type: 'primary',
      handler: () => openDetail(repairOrder),
    },
  ];
}
</script>
