<template>
  <section class="page">
    <header class="page__header">
      <div>
        <h1>用户管理</h1>
        <p>维护登录账号、状态、部门和角色关系。</p>
      </div>
      <el-button v-permission="'system:user:create'" type="primary" @click="openCreate">
        新增用户
      </el-button>
    </header>

    <el-form class="page__filters" inline @submit.prevent="loadUsers">
      <el-form-item label="关键字">
        <el-input v-model="keyword" clearable placeholder="账号或姓名" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadUsers"> 查询 </el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="users" border row-key="id">
      <el-table-column prop="username" label="账号" min-width="140" />
      <el-table-column prop="nickname" label="姓名" min-width="140" />
      <el-table-column prop="email" label="邮箱" min-width="180" />
      <el-table-column prop="mobile" label="手机号" min-width="140" />
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="row.status === 'ENABLED' ? 'success' : 'info'">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="380">
        <template #default="{ row }">
          <el-button v-permission="'system:user:update'" text type="primary" @click="openEdit(row)">
            编辑
          </el-button>
          <el-button v-permission="'system:user:view'" text type="primary" @click="openDetail(row)">
            详情
          </el-button>
          <el-button
            v-permission="'system:user:update'"
            text
            type="primary"
            @click="resetPassword(row)"
          >
            重置密码
          </el-button>
          <el-button
            v-permission="'system:user:disable'"
            text
            type="primary"
            @click="toggleStatus(row)"
          >
            {{ row.status === 'ENABLED' ? '禁用' : '启用' }}
          </el-button>
          <el-button
            v-permission="'system:user:update'"
            text
            type="danger"
            @click="deleteUser(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editingUser ? '编辑用户' : '新增用户'" width="520px">
      <el-form label-position="top" @submit.prevent="submit">
        <el-form-item label="账号">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item :label="editingUser ? '新密码' : '初始密码'">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            :placeholder="editingUser ? '留空则不修改密码' : '请输入初始密码'"
          />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="部门">
          <el-select v-model="form.deptId" placeholder="请选择部门">
            <el-option
              v-for="dept in depts"
              :key="dept.id"
              :label="dept.deptName"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.roleIds" multiple placeholder="请选择角色">
            <el-option
              v-for="role in roles"
              :key="role.id"
              :label="role.roleName"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.mobile" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false"> 取消 </el-button>
        <el-button type="primary" :loading="submitting" @click="submit"> 保存 </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="用户详情" width="520px">
      <el-descriptions v-if="detailUser" :column="1" border>
        <el-descriptions-item label="账号">
          {{ detailUser.username }}
        </el-descriptions-item>
        <el-descriptions-item label="姓名">
          {{ detailUser.nickname }}
        </el-descriptions-item>
        <el-descriptions-item label="部门">
          {{ findDeptName(detailUser.deptId) }}
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
      <template #footer>
        <el-button @click="detailVisible = false"> 关闭 </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { iamApi, type SysDept, type SysRole, type SysUser, type UserCommand } from '@/api/iam';

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const detailVisible = ref(false);
const editingUser = ref<SysUser | null>(null);
const detailUser = ref<SysUser | null>(null);
const keyword = ref('');
const users = ref<SysUser[]>([]);
const depts = ref<SysDept[]>([]);
const roles = ref<SysRole[]>([]);
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

async function loadUsers() {
  loading.value = true;
  try {
    users.value = await iamApi.users(keyword.value);
  } finally {
    loading.value = false;
  }
}

async function loadOptions() {
  [depts.value, roles.value] = await Promise.all([iamApi.depts(), iamApi.roles()]);
}

function openCreate() {
  editingUser.value = null;
  Object.assign(form, {
    deptId: depts.value[0]?.id ?? null,
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
    await loadUsers();
  } finally {
    submitting.value = false;
  }
}

async function resetPassword(row: SysUser) {
  const result = await ElMessageBox.prompt(`请输入 ${row.username} 的新密码`, '重置密码', {
    inputType: 'password',
    inputPattern: /^.{6,}$/,
    inputErrorMessage: '密码至少 6 位',
  });
  await iamApi.resetPassword(row.id, result.value);
  ElMessage.success('密码已重置');
}

async function toggleStatus(row: SysUser) {
  const nextStatus = row.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
  await iamApi.updateUserStatus(row.id, nextStatus);
  ElMessage.success('状态已更新');
  await loadUsers();
}

async function deleteUser(row: SysUser) {
  await ElMessageBox.confirm(`确认删除用户 ${row.username}？`, '删除用户', { type: 'warning' });
  await iamApi.deleteUser(row.id);
  ElMessage.success('用户已删除');
  await loadUsers();
}

function findDeptName(deptId: number | null) {
  return depts.value.find((dept) => dept.id === deptId)?.deptName ?? '-';
}

function findRoleNames(roleIds: number[]) {
  const names = roleIds
    .map((roleId) => roles.value.find((role) => role.id === roleId)?.roleName)
    .filter(Boolean);
  return names.length > 0 ? names.join('、') : '-';
}

onMounted(async () => {
  await Promise.all([loadUsers(), loadOptions()]);
});
</script>
