<template>
  <section class="page">
    <header class="page__header">
      <div>
        <h1>部门管理</h1>
        <p>维护组织树、排序和部门启用状态。</p>
      </div>
      <QfPermissionButton code="system:dept:update" type="primary" @click="dialog.openCreate()">
        新增部门
      </QfPermissionButton>
    </header>

    <el-table
      v-loading="table.loading.value"
      :data="deptTree"
      border
      default-expand-all
      row-key="id"
    >
      <el-table-column prop="deptName" label="部门名称" min-width="180" />
      <el-table-column prop="parentId" label="上级 ID" width="110" />
      <el-table-column prop="sortOrder" label="排序" width="100" />
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <QfStatusTag :status="row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <QfPermissionButton
            code="system:dept:update"
            text
            type="primary"
            @click="
              dialog.openEdit(row, {
                parentId: row.parentId,
                deptName: row.deptName,
                sortOrder: row.sortOrder,
                status: row.status,
              })
            "
          >
            编辑
          </QfPermissionButton>
          <QfPermissionButton
            code="system:dept:update"
            text
            type="danger"
            @click="handleDelete(row)"
          >
            删除
          </QfPermissionButton>
        </template>
      </el-table-column>
    </el-table>

    <QfFormDialog
      v-model="dialog.visible.value"
      :title="dialog.isEditing.value ? '编辑部门' : '新增部门'"
      :model="dialog.form"
      :rules="rules"
      :loading="dialog.submitting.value"
      @submit="dialog.submit()"
      @cancel="dialog.cancel()"
    >
      <el-form-item label="部门名称" prop="deptName">
        <el-input v-model="dialog.form.deptName" />
      </el-form-item>
      <el-form-item label="上级部门" prop="parentId">
        <el-select v-model="dialog.form.parentId">
          <el-option label="根部门" :value="0" />
          <el-option
            v-for="dept in depts"
            :key="dept.id"
            :label="dept.deptName"
            :value="dept.id"
            :disabled="
              dialog.editingItem.value && (dialog.editingItem.value as SysDept)?.id === dept.id
            "
          />
        </el-select>
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
  </section>
</template>

<script setup lang="ts">
defineOptions({ name: 'DeptList' });
import { computed } from 'vue';
import type { FormRules } from 'element-plus';
import { QfFormDialog, QfStatusTag, QfPermissionButton } from '@/shared';
import { useTable, useDialogForm, useConfirmDelete } from '@/shared';
import { buildTree } from '@/shared/utils/tree';
import { iamApi, type DeptCommand, type SysDept } from '@/api/iam';

const rules: FormRules<DeptCommand> = {
  deptName: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
};

const table = useTable<SysDept>({ fetcher: () => iamApi.depts() });

// Expose raw depts for the parent select dropdown
const depts = computed(() => table.allRows.value);

const deptTree = computed(() =>
  buildTree<SysDept>(table.allRows.value as SysDept[], {
    idKey: 'id',
    parentKey: 'parentId',
    sortKey: 'sortOrder',
  }),
);

const dialog = useDialogForm<DeptCommand>({
  defaults: { parentId: 0, deptName: '', sortOrder: 0, status: 'ENABLED' },
  async onSubmit(form, editingItem) {
    if (editingItem) {
      await iamApi.updateDept((editingItem as SysDept).id, form);
    } else {
      await iamApi.createDept(form);
    }
    await table.reload();
  },
  successMessage: (isEdit) => (isEdit ? '部门已更新' : '部门已创建'),
});

const { confirmDelete } = useConfirmDelete();

async function handleDelete(row: SysDept) {
  await confirmDelete(row.deptName, '部门');
  await iamApi.deleteDept(row.id);
  await table.reload();
}
</script>
