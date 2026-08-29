<template>
  <QfPageShell class="user-page">
    <!-- 左侧部门树 -->
    <aside class="user-page__dept-sidebar">
      <div class="user-page__dept-header">
        <span>{{ t('iam.user.deptSidebar') }}</span>
        <el-button
          v-if="selectedDeptId !== null"
          text
          type="primary"
          size="small"
          @click="clearDeptFilter"
        >
          {{ t('common.button.all') }}
        </el-button>
      </div>
      <el-tree
        v-loading="deptLoading"
        class="user-page__dept-tree"
        :data="deptTree"
        :props="{ label: 'deptName', children: 'children' }"
        node-key="id"
        highlight-current
        default-expand-all
        :expand-on-click-node="false"
        @node-click="onDeptClick"
      >
        <template #empty>
          <el-empty :description="t('iam.user.deptEmpty')" :image-size="40" />
        </template>
      </el-tree>
    </aside>

    <!-- 右侧用户列表 -->
    <section class="user-page__content">
      <QfPageHeader :title="t('iam.user.title')">
        <template #description>
          {{ t('iam.user.subtitle') }}
          <span v-if="selectedDeptId !== null">
            · {{ t('iam.user.currentDept', { name: selectedDeptName }) }}
          </span>
        </template>
      </QfPageHeader>

      <QfSearchPanel @search="searchUsers" @reset="resetUserSearch">
        <el-form-item :label="t('iam.user.form.keyword')">
          <el-input
            v-model="table.filters.keyword"
            clearable
            :placeholder="t('iam.user.form.keywordPlaceholder')"
            class="user-page__filter"
            @keyup.enter="searchUsers"
          />
        </el-form-item>
        <template #more>
          <el-form-item :label="t('iam.user.form.status')">
            <el-select
              v-model="userStatus"
              clearable
              :placeholder="t('common.placeholder.select')"
              class="user-page__filter"
            >
              <el-option :label="t('common.status.enabled')" value="ENABLED" />
              <el-option :label="t('common.status.disabled')" value="DISABLED" />
            </el-select>
          </el-form-item>
        </template>
      </QfSearchPanel>

      <QfTablePanel :title="t('iam.user.listTitle')" :description="t('iam.user.listDescription')">
        <template #actions>
          <QfPermissionButton code="system:user:create" type="success" @click="openCreate">
            {{ t('iam.user.create') }}
          </QfPermissionButton>
        </template>
        <QfDataTable
          :columns="columns"
          :data="filteredRows"
          :loading="table.loading.value"
          :actions-width="260"
          class="user-page__table"
        >
          <template #status="{ row }">
            <QfStatusTag :status="(row as SysUser).status" />
          </template>

          <template #actions="{ row }">
            <QfTableActions :actions="getActions(row as SysUser)" :max-inline="2" />
          </template>
        </QfDataTable>
      </QfTablePanel>

      <QfFormDialog
        v-model="dialogVisible"
        :title="editingUser ? t('iam.user.editTitle') : t('iam.user.createTitle')"
        :model="form"
        :rules="rules"
        :loading="submitting"
        width="520px"
        @submit="submit"
      >
        <el-form-item :label="t('iam.user.form.username')" prop="username">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item
          :label="editingUser ? t('iam.user.form.newPassword') : t('iam.user.form.initialPassword')"
          prop="password"
        >
          <el-input
            v-model="form.password"
            type="password"
            show-password
            :placeholder="
              editingUser
                ? t('iam.user.form.passwordPlaceholderEdit')
                : t('iam.user.form.passwordPlaceholderCreate')
            "
          />
        </el-form-item>
        <el-form-item :label="t('iam.user.form.nickname')" prop="nickname">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item :label="t('iam.user.form.dept')" prop="deptId">
          <QfDeptSelect v-model="form.deptId" :placeholder="t('iam.user.form.deptPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('iam.user.form.role')" prop="roleIds">
          <QfRoleSelect
            v-model="form.roleIds"
            multiple
            :placeholder="t('iam.user.form.rolePlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('iam.user.form.email')" prop="email">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item :label="t('iam.user.form.mobile')" prop="mobile">
          <el-input v-model="form.mobile" />
        </el-form-item>
      </QfFormDialog>

      <QfDetailDrawer v-model="detailVisible" :title="t('iam.user.detailTitle')" width="520px">
        <el-descriptions v-if="detailUser" :column="1" border>
          <el-descriptions-item :label="t('iam.user.columns.username')">
            {{ detailUser.username }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('iam.user.columns.nickname')">
            {{ detailUser.nickname }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('iam.user.columns.dept')">
            {{ detailUser.deptId ? getDeptName(detailUser.deptId) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('iam.user.columns.role')">
            {{ findRoleNames(detailUser.roleIds) }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('iam.user.columns.email')">
            {{ detailUser.email || '-' }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('iam.user.columns.mobile')">
            {{ detailUser.mobile || '-' }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('iam.user.columns.status')">
            {{ detailUser.status }}
          </el-descriptions-item>
        </el-descriptions>
      </QfDetailDrawer>
    </section>
  </QfPageShell>
</template>

<script setup lang="ts">
defineOptions({ name: 'UserList' });
import { reactive, ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormRules } from 'element-plus';
import { iamApi, type SysDept, type SysRole, type SysUser, type UserCommand } from '@/api/iam';
import {
  QfDataTable,
  QfStatusTag,
  QfPermissionButton,
  QfTableActions,
  QfDeptSelect,
  QfRoleSelect,
  QfFormDialog,
  QfPageHeader,
  QfPageShell,
  QfDetailDrawer,
  QfSearchPanel,
  QfTablePanel,
} from '@/shared';
import type { QfTableColumn, QfActionItem } from '@/shared';
import { useTable, useDeptSelect } from '@/shared';
import type { TreeNode } from '@/shared/utils/tree';

const { t } = useI18n();
const submitting = ref(false);
const dialogVisible = ref(false);
const detailVisible = ref(false);
const editingUser = ref<SysUser | null>(null);
const detailUser = ref<SysUser | null>(null);
const roles = ref<SysRole[]>([]);
const userStatus = ref('');
const form = reactive<UserCommand>({
  deptId: null,
  username: '',
  password: '',
  nickname: '',
  email: '',
  mobile: '',
  status: 'ENABLED',
  roleIds: [],
});

// rules 走 computed 以响应 locale 切换；validator 内同样调 t() 拿当前 locale 文案。
const rules = computed<FormRules<UserCommand>>(() => ({
  username: [
    { required: true, message: t('iam.user.validation.usernameRequired'), trigger: 'blur' },
  ],
  password: [
    {
      validator: (_rule, value, callback) => {
        if (!editingUser.value && !value) {
          callback(new Error(t('iam.user.validation.passwordRequired')));
          return;
        }
        if (value && value.length < 6) {
          callback(new Error(t('iam.user.validation.passwordMinLength')));
          return;
        }
        callback();
      },
      trigger: 'blur',
    },
  ],
  nickname: [
    { required: true, message: t('iam.user.validation.nicknameRequired'), trigger: 'blur' },
  ],
  deptId: [{ required: true, message: t('iam.user.validation.deptRequired'), trigger: 'change' }],
  roleIds: [
    {
      type: 'array',
      required: true,
      min: 1,
      message: t('iam.user.validation.roleRequired'),
      trigger: 'change',
    },
  ],
  email: [{ type: 'email', message: t('iam.user.validation.emailInvalid'), trigger: 'blur' }],
}));

const table = useTable<SysUser, { keyword: string }>({
  fetcher: (f) => iamApi.users(f.keyword),
  defaultFilters: { keyword: '' },
});

// ---- Dept sidebar ----
const { loadDepts, getDeptTree, getDeptName } = useDeptSelect();
const deptLoading = ref(false);
const deptTree = getDeptTree();
const selectedDeptId = ref<number | null>(null);

onMounted(async () => {
  deptLoading.value = true;
  try {
    await loadDepts();
  } finally {
    deptLoading.value = false;
  }
});

function onDeptClick(data: TreeNode<SysDept>) {
  selectedDeptId.value = data.id;
}

function clearDeptFilter() {
  selectedDeptId.value = null;
}

const filteredRows = computed(() => {
  const rows = table.allRows.value;
  return rows.filter((u) => {
    const matchedDept = selectedDeptId.value === null || u.deptId === selectedDeptId.value;
    const matchedStatus = !userStatus.value || u.status === userStatus.value;
    return matchedDept && matchedStatus;
  });
});

const selectedDeptName = computed(() =>
  selectedDeptId.value === null ? '' : getDeptName(selectedDeptId.value),
);

// columns 走 computed 让 label 跟随 locale 切换。
const columns = computed<QfTableColumn<SysUser>[]>(() => [
  { prop: 'username', label: t('iam.user.columns.username'), minWidth: 140 },
  { prop: 'nickname', label: t('iam.user.columns.nickname'), minWidth: 140 },
  { prop: 'email', label: t('iam.user.columns.email'), minWidth: 180 },
  { prop: 'mobile', label: t('iam.user.columns.mobile'), minWidth: 140 },
  { prop: 'status', label: t('iam.user.columns.status'), width: 120, slot: 'status' },
]);

async function searchUsers() {
  await table.reload();
}

async function resetUserSearch() {
  userStatus.value = '';
  await table.reset();
}

function getActions(row: SysUser): QfActionItem[] {
  return [
    {
      label: t('common.button.edit'),
      permission: 'system:user:update',
      handler: () => openEdit(row),
    },
    {
      label: t('common.button.detail'),
      permission: 'system:user:view',
      handler: () => openDetail(row),
    },
    {
      label: t('common.button.resetPassword'),
      permission: 'system:user:update',
      handler: () => resetPassword(row),
    },
    {
      label: row.status === 'ENABLED' ? t('common.button.disable') : t('common.button.enable'),
      permission: 'system:user:disable',
      handler: () => toggleStatus(row),
    },
    {
      label: t('common.button.delete'),
      type: 'danger',
      permission: 'system:user:update',
      handler: () => deleteUser(row),
    },
  ];
}

async function loadOptions() {
  roles.value = await iamApi.roles();
}

function openCreate() {
  editingUser.value = null;
  Object.assign(form, {
    deptId: selectedDeptId.value,
    username: '',
    password: 'ChangeMe123',
    nickname: '',
    email: '',
    mobile: '',
    status: 'ENABLED',
    roleIds: roles.value[0] ? [roles.value[0].id] : [],
  });
  dialogVisible.value = true;
}

function openEdit(row: SysUser) {
  editingUser.value = row;
  Object.assign(form, {
    deptId: row.deptId,
    username: row.username,
    password: '',
    nickname: row.nickname,
    email: row.email ?? '',
    mobile: row.mobile ?? '',
    status: row.status,
    roleIds: row.roleIds,
  });
  dialogVisible.value = true;
}

async function openDetail(row: SysUser) {
  detailUser.value = await iamApi.user(row.id);
  detailVisible.value = true;
}

async function submit() {
  submitting.value = true;
  try {
    if (editingUser.value) {
      await iamApi.updateUser(editingUser.value.id, form);
      ElMessage.success(t('iam.user.toast.updated'));
    } else {
      await iamApi.createUser(form);
      ElMessage.success(t('iam.user.toast.created'));
    }
    dialogVisible.value = false;
    await table.reload();
  } finally {
    submitting.value = false;
  }
}

async function resetPassword(row: SysUser) {
  const result = await ElMessageBox.prompt(
    t('iam.user.resetPasswordPrompt', { name: row.username }),
    t('iam.user.resetPasswordTitle'),
    {
      inputType: 'password',
      inputPattern: /^.{6,}$/,
      inputErrorMessage: t('iam.user.validation.passwordMinLength'),
    },
  );
  await iamApi.resetPassword(row.id, result.value);
  ElMessage.success(t('iam.user.toast.passwordReset'));
}

async function toggleStatus(row: SysUser) {
  const nextStatus = row.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
  await iamApi.updateUserStatus(row.id, nextStatus);
  ElMessage.success(t('iam.user.toast.statusUpdated'));
  await table.reload();
}

async function deleteUser(row: SysUser) {
  await ElMessageBox.confirm(
    t('iam.user.deleteConfirm', { name: row.username }),
    t('iam.user.deleteTitle'),
    { type: 'warning' },
  );
  await iamApi.deleteUser(row.id);
  ElMessage.success(t('iam.user.toast.deleted'));
  await table.reload();
}

function findRoleNames(roleIds: number[]) {
  const names = roleIds
    .map((roleId) => roles.value.find((role) => role.id === roleId)?.roleName)
    .filter(Boolean);
  return names.length > 0 ? names.join(', ') : '-';
}

loadOptions();
</script>

<style scoped>
.user-page {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 14px;
  height: calc(100vh - 136px);
  min-height: 520px;
}

.user-page__dept-sidebar {
  min-height: 0;
  background: var(--qf-color-bg-surface);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--qf-border-radius);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-page__dept-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  padding: 0 12px;
  font-size: 14px;
  font-weight: 600;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.user-page__dept-tree {
  flex: 1;
  min-height: 0;
  padding: 8px 6px;
  overflow: auto;
}

.user-page__dept-tree :deep(.el-tree-node__content) {
  height: 30px;
  border-radius: var(--qf-border-radius-sm);
}

.user-page__content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  min-width: 0;
}

.user-page__filter {
  width: var(--qf-field-width-xl);
}

@media (width <= 900px) {
  .user-page {
    grid-template-columns: 1fr;
    height: auto;
    min-height: 0;
  }

  .user-page__dept-sidebar {
    max-height: 260px;
  }
}

@media (width <= 640px) {
  .user-page__filter {
    width: 100%;
  }
}
</style>
