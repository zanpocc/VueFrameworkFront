<template>
  <div class="user-page">
    <!-- 左侧部门树 -->
    <aside class="user-page__dept-sidebar">
      <div class="user-page__dept-header">
        <span>部门</span>
        <el-button
          v-if="selectedDeptId !== null"
          text
          type="primary"
          size="small"
          @click="clearDeptFilter"
        >
          全部
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
          <el-empty description="暂无部门" :image-size="40" />
        </template>
      </el-tree>
    </aside>

    <!-- 右侧用户列表 -->
    <section class="user-page__content">
      <header class="user-page__header">
        <div>
          <h1>用户管理</h1>
          <p>
            维护账号、状态、部门和角色绑定
            <span v-if="selectedDeptId !== null"> · 当前部门：{{ selectedDeptName }}</span>
          </p>
        </div>
      </header>

      <QfSearchPanel @search="searchUsers" @reset="resetUserSearch">
        <el-form-item label="关键字">
          <el-input
            v-model="table.filters.keyword"
            clearable
            placeholder="账号或姓名"
            class="user-page__filter"
            @keyup.enter="searchUsers"
          />
        </el-form-item>
        <template #more>
          <el-form-item label="状态">
            <el-select v-model="userStatus" clearable placeholder="请选择" class="user-page__filter">
              <el-option label="启用" value="ENABLED" />
              <el-option label="禁用" value="DISABLED" />
            </el-select>
          </el-form-item>
        </template>
      </QfSearchPanel>

      <QfTablePanel title="用户列表" description="查询结果和账号操作">
        <template #actions>
          <QfPermissionButton code="system:user:create" type="success" @click="openCreate">
            新增用户
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
        :title="editingUser ? '编辑用户' : '新增用户'"
        :model="form"
        :rules="rules"
        :loading="submitting"
        width="520px"
        @submit="submit"
      >
        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item :label="editingUser ? '新密码' : '初始密码'" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            :placeholder="editingUser ? '留空则保持原密码' : '请输入初始密码'"
          />
        </el-form-item>
        <el-form-item label="姓名" prop="nickname">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="部门" prop="deptId">
          <QfDeptSelect v-model="form.deptId" placeholder="请选择部门" />
        </el-form-item>
        <el-form-item label="角色" prop="roleIds">
          <QfRoleSelect v-model="form.roleIds" multiple placeholder="请选择角色" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="手机号" prop="mobile">
          <el-input v-model="form.mobile" />
        </el-form-item>
      </QfFormDialog>

      <QfDetailDrawer v-model="detailVisible" title="用户详情" width="520px">
        <el-descriptions v-if="detailUser" :column="1" border>
          <el-descriptions-item label="账号">
            {{ detailUser.username }}
          </el-descriptions-item>
          <el-descriptions-item label="姓名">
            {{ detailUser.nickname }}
          </el-descriptions-item>
          <el-descriptions-item label="部门">
            {{ detailUser.deptId ? getDeptName(detailUser.deptId) : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="角色">
            {{ findRoleNames(detailUser.roleIds) }}
          </el-descriptions-item>
          <el-descriptions-item label="邮箱">
            {{ detailUser.email || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="手机号">
            {{ detailUser.mobile || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            {{ detailUser.status }}
          </el-descriptions-item>
        </el-descriptions>
      </QfDetailDrawer>
    </section>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'UserList' });
import { reactive, ref, computed, onMounted } from 'vue';
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
  QfDetailDrawer,
  QfSearchPanel,
  QfTablePanel,
} from '@/shared';
import type { QfTableColumn, QfActionItem } from '@/shared';
import { useTable, useDeptSelect } from '@/shared';
import type { TreeNode } from '@/shared/utils/tree';

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

const rules: FormRules<UserCommand> = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [
    {
      validator: (_rule, value, callback) => {
        if (!editingUser.value && !value) {
          callback(new Error('请输入密码'));
          return;
        }
        if (value && value.length < 6) {
          callback(new Error('至少 6 个字符'));
          return;
        }
        callback();
      },
      trigger: 'blur',
    },
  ],
  nickname: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  deptId: [{ required: true, message: '请选择部门', trigger: 'change' }],
  roleIds: [{ type: 'array', required: true, min: 1, message: '请选择角色', trigger: 'change' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
};

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

// ---- Table ----
const columns: QfTableColumn<SysUser>[] = [
  { prop: 'username', label: '账号', minWidth: 140 },
  { prop: 'nickname', label: '姓名', minWidth: 140 },
  { prop: 'email', label: '邮箱', minWidth: 180 },
  { prop: 'mobile', label: '手机号', minWidth: 140 },
  { prop: 'status', label: '状态', width: 120, slot: 'status' },
];

async function searchUsers() {
  await table.reload();
}

async function resetUserSearch() {
  userStatus.value = '';
  await table.reset();
}

function getActions(row: SysUser): QfActionItem[] {
  return [
    { label: '编辑', permission: 'system:user:update', handler: () => openEdit(row) },
    { label: '详情', permission: 'system:user:view', handler: () => openDetail(row) },
    { label: '重置密码', permission: 'system:user:update', handler: () => resetPassword(row) },
    {
      label: row.status === 'ENABLED' ? '禁用' : '启用',
      permission: 'system:user:disable',
      handler: () => toggleStatus(row),
    },
    {
      label: '删除',
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
      ElMessage.success('用户已更新');
    } else {
      await iamApi.createUser(form);
      ElMessage.success('用户已创建');
    }
    dialogVisible.value = false;
    await table.reload();
  } finally {
    submitting.value = false;
  }
}

async function resetPassword(row: SysUser) {
  const result = await ElMessageBox.prompt(`请输入 ${row.username} 的新密码`, '重置密码', {
    inputType: 'password',
    inputPattern: /^.{6,}$/,
    inputErrorMessage: '至少 6 个字符',
  });
  await iamApi.resetPassword(row.id, result.value);
  ElMessage.success('密码已重置');
}

async function toggleStatus(row: SysUser) {
  const nextStatus = row.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
  await iamApi.updateUserStatus(row.id, nextStatus);
  ElMessage.success('状态已更新');
  await table.reload();
}

async function deleteUser(row: SysUser) {
  await ElMessageBox.confirm(`确认删除用户 ${row.username}？`, '删除用户', { type: 'warning' });
  await iamApi.deleteUser(row.id);
  ElMessage.success('用户已删除');
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
  border-radius: 6px;
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
  border-radius: 4px;
}

.user-page__content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  min-width: 0;
}

.user-page__header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}

.user-page__header h1 {
  margin: 0 0 4px;
  font-size: 22px;
  line-height: 1.25;
}

.user-page__header p {
  margin: 0;
  color: var(--qf-color-text-secondary);
  font-size: 13px;
}

.user-page__filter {
  width: 220px;
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
  .user-page__header {
    flex-direction: column;
    align-items: stretch;
  }

  .user-page__filter {
    width: 100%;
  }
}
</style>
