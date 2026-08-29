<template>
  <QfPageShell>
    <QfPageHeader title="岗位管理" description="维护岗位编码、名称、排序和状态。">
      <template #actions>
        <QfPermissionButton code="system:post:update" type="primary" @click="dialog.openCreate()">
          新增岗位
        </QfPermissionButton>
      </template>
    </QfPageHeader>

    <QfTablePanel title="岗位列表" description="维护岗位编码、名称、排序和状态。">
      <QfDataTable
        :columns="columns"
        :data="table.allRows.value"
        :loading="table.loading.value"
        :actions-width="180"
      >
        <template #status="{ row }">
          <QfStatusTag :status="row.status" />
        </template>
        <template #actions="{ row }">
          <QfPermissionButton
            code="system:post:update"
            text
            type="primary"
            @click="openEditPost(row as SysPost)"
          >
            编辑
          </QfPermissionButton>
          <QfPermissionButton
            code="system:post:update"
            text
            type="danger"
            @click="handleDelete(row as SysPost)"
          >
            删除
          </QfPermissionButton>
        </template>
      </QfDataTable>
    </QfTablePanel>

    <QfFormDialog
      v-model="dialog.visible.value"
      :title="dialog.isEditing.value ? '编辑岗位' : '新增岗位'"
      :model="dialog.form"
      :rules="rules"
      :loading="dialog.submitting.value"
      @submit="dialog.submit()"
      @cancel="dialog.cancel()"
    >
      <el-form-item label="岗位编码" prop="postCode">
        <el-input v-model="dialog.form.postCode" />
      </el-form-item>
      <el-form-item label="岗位名称" prop="postName">
        <el-input v-model="dialog.form.postName" />
      </el-form-item>
      <el-form-item label="排序" prop="sortOrder">
        <el-input-number v-model="dialog.form.sortOrder" :min="0" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="dialog.form.status">
          <el-option label="启用" value="ENABLED" />
          <el-option label="禁用" value="DISABLED" />
        </el-select>
      </el-form-item>
    </QfFormDialog>
  </QfPageShell>
</template>

<script setup lang="ts">
defineOptions({ name: 'PostList' });
import type { FormRules } from 'element-plus';
import {
  QfDataTable,
  QfFormDialog,
  QfPageHeader,
  QfPageShell,
  QfStatusTag,
  QfPermissionButton,
  QfTablePanel,
} from '@/shared';
import type { QfTableColumn } from '@/shared';
import { useTable, useDialogForm, useConfirmDelete } from '@/shared';
import { iamApi, type PostCommand, type SysPost } from '@/api/iam';

const columns: QfTableColumn<SysPost>[] = [
  { prop: 'postCode', label: '岗位编码', minWidth: 160 },
  { prop: 'postName', label: '岗位名称', minWidth: 160 },
  { prop: 'sortOrder', label: '排序', width: 100 },
  { prop: 'status', label: '状态', width: 120, slot: 'status' },
];

const rules: FormRules<PostCommand> = {
  postCode: [{ required: true, message: '请输入岗位编码', trigger: 'blur' }],
  postName: [{ required: true, message: '请输入岗位名称', trigger: 'blur' }],
};

const table = useTable<SysPost>({ fetcher: () => iamApi.posts() });

const dialog = useDialogForm<PostCommand>({
  defaults: { postCode: '', postName: '', sortOrder: 0, status: 'ENABLED' },
  async onSubmit(form, editingItem) {
    if (editingItem) {
      await iamApi.updatePost((editingItem as SysPost).id, form);
    } else {
      await iamApi.createPost(form);
    }
    await table.reload();
  },
  successMessage: (isEdit) => (isEdit ? '岗位已更新' : '岗位已创建'),
});

const { confirmDelete } = useConfirmDelete();

function openEditPost(row: SysPost) {
  dialog.openEdit(row, {
    postCode: row.postCode,
    postName: row.postName,
    sortOrder: row.sortOrder,
    status: row.status,
  });
}

async function handleDelete(row: SysPost) {
  await confirmDelete(row.postName, '岗位');
  await iamApi.deletePost(row.id);
  await table.reload();
}
</script>
