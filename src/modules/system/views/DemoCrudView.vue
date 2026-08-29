<template>
  <QfPageShell>
    <QfPageHeader
      title="Demo CRUD 验证页"
      description="演示 useTable、useDialogForm、useConfirmDelete 和共享组件的组合方式。"
    >
      <template #actions>
        <QfPermissionButton code="demo:item:update" type="primary" @click="dialog.openCreate()">
          新增项目
        </QfPermissionButton>
      </template>
    </QfPageHeader>

    <QfTablePanel title="项目列表" description="用于验证通用列表、表单和权限组件。">
      <QfDataTable
        :columns="columns"
        :data="table.allRows.value"
        :loading="table.loading.value"
        :actions-width="200"
      >
        <template #status="{ row }">
          <QfStatusTag :status="row.status" />
        </template>
        <template #actions="{ row }">
          <QfPermissionButton
            code="demo:item:update"
            text
            type="primary"
            @click="openEdit(row as DemoItem)"
          >
            编辑
          </QfPermissionButton>
          <QfPermissionButton
            code="demo:item:update"
            text
            type="danger"
            @click="handleDelete(row as DemoItem)"
          >
            删除
          </QfPermissionButton>
        </template>
      </QfDataTable>
    </QfTablePanel>

    <QfFormDialog
      v-model="dialog.visible.value"
      :title="dialog.isEditing.value ? '编辑项目' : '新增项目'"
      :model="dialog.form"
      :rules="rules"
      :loading="dialog.submitting.value"
      @submit="dialog.submit()"
      @cancel="dialog.cancel()"
    >
      <el-form-item label="名称" prop="name">
        <el-input v-model="dialog.form.name" />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input v-model="dialog.form.description" type="textarea" :rows="3" />
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
defineOptions({ name: 'DemoCrud' });
import { ref } from 'vue';
import type { FormRules } from 'element-plus';
import {
  QfDataTable,
  QfFormDialog,
  QfPageHeader,
  QfPageShell,
  QfTablePanel,
  QfStatusTag,
  QfPermissionButton,
} from '@/shared';
import type { QfTableColumn } from '@/shared';
import { useTable, useDialogForm, useConfirmDelete } from '@/shared';

interface DemoItem {
  id: number;
  name: string;
  description: string;
  status: string;
}

interface DemoForm {
  name: string;
  description: string;
  status: string;
}

// In-memory demo data (no backend)
const nextId = ref(1);
const allItems = ref<DemoItem[]>([
  { id: nextId.value++, name: '示例项目 A', description: '这是第一个示例项目', status: 'ENABLED' },
  { id: nextId.value++, name: '示例项目 B', description: '这是第二个示例项目', status: 'DISABLED' },
  { id: nextId.value++, name: '示例项目 C', description: '这是第三个示例项目', status: 'ENABLED' },
]);

const columns: QfTableColumn<DemoItem>[] = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: '名称', minWidth: 160 },
  { prop: 'description', label: '描述', minWidth: 200 },
  { prop: 'status', label: '状态', width: 120, slot: 'status' },
];

const rules: FormRules<DemoForm> = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
};

const table = useTable<DemoItem>({
  fetcher: () => Promise.resolve([...allItems.value]),
});

const dialog = useDialogForm<DemoForm>({
  defaults: { name: '', description: '', status: 'ENABLED' },
  async onSubmit(form, editingItem) {
    if (editingItem) {
      const item = editingItem as DemoItem;
      const idx = allItems.value.findIndex((i) => i.id === item.id);
      if (idx !== -1) {
        allItems.value[idx] = { ...item, ...form };
      }
    } else {
      allItems.value.push({ id: nextId.value++, ...form });
    }
    await table.reload();
  },
  successMessage: (isEdit) => (isEdit ? '项目已更新' : '项目已创建'),
});

const { confirmDelete } = useConfirmDelete();

function openEdit(row: DemoItem) {
  dialog.openEdit(row, { name: row.name, description: row.description, status: row.status });
}

async function handleDelete(row: DemoItem) {
  await confirmDelete(row.name, '项目');
  allItems.value = allItems.value.filter((i) => i.id !== row.id);
  await table.reload();
}
</script>
