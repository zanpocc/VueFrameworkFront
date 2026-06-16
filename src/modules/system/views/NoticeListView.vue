<template>
  <section class="page">
    <header class="page__header">
      <div>
        <h1>公告通知</h1>
        <p>维护平台公告、发布状态和置顶顺序。</p>
      </div>
      <QfPermissionButton code="system:notice:update" type="primary" @click="dialog.openCreate()">
        新增公告
      </QfPermissionButton>
    </header>

    <QfDataTable
      :columns="columns"
      :data="table.allRows.value"
      :loading="table.loading.value"
      :actions-width="260"
    >
      <template #filters="{ filters, reload: doReload }">
        <el-input
          v-model="filters.keyword"
          clearable
          placeholder="标题或类型"
          style="width: 200px"
          @clear="doReload"
          @keyup.enter="doReload"
        />
        <el-select
          v-model="filters.status"
          clearable
          placeholder="发布状态"
          style="width: 160px"
          @change="doReload"
        >
          <el-option label="草稿" value="DRAFT" />
          <el-option label="已发布" value="PUBLISHED" />
        </el-select>
        <el-button type="primary" @click="doReload">查询</el-button>
      </template>

      <template #status="{ row }">
        <el-tag :type="(row as Notice).status === 'PUBLISHED' ? 'success' : 'info'">
          {{ statusText((row as Notice).status) }}
        </el-tag>
      </template>

      <template #attrs="{ row }">
        <el-tag v-if="(row as Notice).pinned" type="warning">置顶</el-tag>
        <el-tag>{{ typeText((row as Notice).noticeType) }}</el-tag>
      </template>

      <template #actions="{ row }">
        <QfPermissionButton
          code="system:notice:update"
          text
          type="primary"
          @click="openEdit(row as Notice)"
        >
          编辑
        </QfPermissionButton>
        <QfPermissionButton
          v-if="(row as Notice).status !== 'PUBLISHED'"
          code="system:notice:publish"
          text
          type="success"
          @click="publish(row as Notice)"
        >
          发布
        </QfPermissionButton>
        <QfPermissionButton
          v-else
          code="system:notice:publish"
          text
          type="warning"
          @click="revoke(row as Notice)"
        >
          撤回
        </QfPermissionButton>
        <QfPermissionButton
          code="system:notice:update"
          text
          type="danger"
          @click="remove(row as Notice)"
        >
          删除
        </QfPermissionButton>
      </template>
    </QfDataTable>

    <QfFormDialog
      v-model="dialog.visible.value"
      :title="dialog.isEditing.value ? '编辑公告' : '新增公告'"
      :model="dialog.form"
      :rules="rules"
      :loading="dialog.submitting.value"
      width="680px"
      @submit="dialog.submit()"
      @cancel="dialog.cancel()"
    >
      <el-form-item label="标题" prop="title">
        <el-input v-model="dialog.form.title" maxlength="120" show-word-limit />
      </el-form-item>
      <el-form-item label="类型" prop="noticeType">
        <el-select v-model="dialog.form.noticeType">
          <el-option label="公告" value="NOTICE" />
          <el-option label="通知" value="ANNOUNCEMENT" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="dialog.form.status">
          <el-radio-button label="DRAFT">草稿</el-radio-button>
          <el-radio-button label="PUBLISHED">已发布</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="排序">
        <el-input-number v-model="dialog.form.sortOrder" :min="0" :max="9999" />
        <el-checkbox v-model="dialog.form.pinned" class="notice-form__pinned">置顶</el-checkbox>
      </el-form-item>
      <el-form-item label="内容" prop="content">
        <el-input
          v-model="dialog.form.content"
          type="textarea"
          :rows="8"
          maxlength="4000"
          show-word-limit
        />
      </el-form-item>
    </QfFormDialog>
  </section>
</template>

<script setup lang="ts">
defineOptions({ name: 'NoticeList' });

import type { FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { QfDataTable, QfFormDialog, QfPermissionButton } from '@/shared';
import type { QfTableColumn } from '@/shared';
import { useConfirmDelete, useDialogForm, useTable } from '@/shared';
import { systemApi, type Notice, type NoticeCommand } from '@/api/system';

const columns: QfTableColumn<Notice>[] = [
  { prop: 'title', label: '标题', minWidth: 220, showOverflowTooltip: true },
  { label: '属性', width: 150, slot: 'attrs' },
  { label: '状态', width: 110, slot: 'status' },
  { prop: 'publisher', label: '发布人', width: 120 },
  { prop: 'publishedAt', label: '发布时间', minWidth: 180, showOverflowTooltip: true },
];

const rules: FormRules<NoticeCommand> = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  noticeType: [{ required: true, message: '请选择类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
};

const table = useTable<Notice, { keyword: string; status: string }>({
  fetcher: (filters) => systemApi.notices(filters.keyword, filters.status),
  defaultFilters: { keyword: '', status: '' },
});

const dialog = useDialogForm<NoticeCommand>({
  defaults: {
    title: '',
    noticeType: 'NOTICE',
    content: '',
    status: 'DRAFT',
    pinned: false,
    sortOrder: 0,
  },
  async onSubmit(form, editingItem) {
    if (editingItem) {
      await systemApi.updateNotice((editingItem as Notice).id, form);
    } else {
      await systemApi.createNotice(form);
    }
    await table.reload();
  },
  successMessage: (isEdit) => (isEdit ? '公告已更新' : '公告已创建'),
});

const { confirmDelete } = useConfirmDelete();

function openEdit(row: Notice) {
  dialog.openEdit(row, {
    title: row.title,
    noticeType: row.noticeType,
    content: row.content,
    status: row.status,
    pinned: row.pinned,
    sortOrder: row.sortOrder,
  });
}

async function publish(row: Notice) {
  await systemApi.publishNotice(row.id);
  ElMessage.success('公告已发布');
  await table.reload();
}

async function revoke(row: Notice) {
  await systemApi.revokeNotice(row.id);
  ElMessage.success('公告已撤回');
  await table.reload();
}

async function remove(row: Notice) {
  await confirmDelete(row.title, '公告');
  await systemApi.deleteNotice(row.id);
  await table.reload();
}

function statusText(status: string) {
  return status === 'PUBLISHED' ? '已发布' : '草稿';
}

function typeText(type: string) {
  return type === 'ANNOUNCEMENT' ? '通知' : '公告';
}
</script>

<style scoped>
.notice-form__pinned {
  margin-left: 16px;
}
</style>
