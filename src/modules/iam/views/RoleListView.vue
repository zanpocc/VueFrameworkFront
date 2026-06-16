<template>
  <section class="page">
    <header class="page__header">
      <div>
        <h1>角色管理</h1>
        <p>维护角色、菜单、按钮权限和数据范围。</p>
      </div>
      <QfPermissionButton code="system:role:update" type="primary" @click="openCreate">
        新增角色
      </QfPermissionButton>
    </header>

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
        <QfTableActions :actions="getActions(row as SysRole)" :max-inline="2" />
      </template>
    </QfDataTable>

    <QfFormDialog
      v-model="roleDialogVisible"
      :title="editingRole ? '编辑角色' : '新增角色'"
      :model="roleForm"
      :rules="roleRules"
      :loading="roleSubmitting"
      width="480px"
      @submit="submitRole"
    >
      <el-form-item label="角色编码" prop="roleCode">
        <el-input v-model="roleForm.roleCode" />
      </el-form-item>
      <el-form-item label="角色名称" prop="roleName">
        <el-input v-model="roleForm.roleName" />
      </el-form-item>
      <el-form-item label="排序" prop="sortOrder">
        <el-input-number v-model="roleForm.sortOrder" :min="0" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="roleForm.status">
          <el-option label="启用" value="ENABLED" />
          <el-option label="禁用" value="DISABLED" />
        </el-select>
      </el-form-item>
    </QfFormDialog>

    <el-dialog v-model="dialogVisible" title="角色授权" width="620px">
      <el-tabs>
        <el-tab-pane label="菜单">
          <el-checkbox-group v-model="selectedMenuIds">
            <el-checkbox v-for="menu in menus" :key="menu.id" :value="menu.id">
              {{ menu.title }}
            </el-checkbox>
          </el-checkbox-group>
        </el-tab-pane>
        <el-tab-pane label="按钮权限">
          <el-checkbox-group v-model="selectedPermissionIds">
            <el-checkbox
              v-for="permission in permissions"
              :key="permission.id"
              :value="permission.id"
            >
              {{ permission.permissionName }}（{{ permission.permissionCode }}）
            </el-checkbox>
          </el-checkbox-group>
        </el-tab-pane>
        <el-tab-pane label="数据范围">
          <el-form
            ref="dataScopeFormRef"
            :model="dataScope"
            :rules="dataScopeRules"
            label-position="top"
          >
            <el-form-item label="范围类型" prop="scopeType">
              <el-select v-model="dataScope.scopeType">
                <el-option label="全部数据" value="ALL" />
                <el-option label="部门数据" value="DEPT" />
                <el-option label="本人数据" value="SELF" />
                <el-option label="自定义" value="CUSTOM" />
              </el-select>
            </el-form-item>
            <el-form-item label="范围值" prop="scopeValue">
              <el-input
                v-model="dataScope.scopeValue"
                placeholder="部门 ID 或自定义表达式；全部/本人数据可留空"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="dialogVisible = false"> 取消 </el-button>
        <el-button type="primary" :loading="submitting" @click="submitAuthorize"> 保存 </el-button>
      </template>
    </el-dialog>

    <QfDetailDrawer
      v-model="relatedUsersVisible"
      :title="currentRole ? `关联用户 - ${currentRole.roleName}` : '关联用户'"
      width="720px"
      :loading="relatedUsersLoading"
    >
      <QfDataTable :columns="relatedUserColumns" :data="relatedUsers" :page-size="10" />
    </QfDetailDrawer>
  </section>
</template>

<script setup lang="ts">
defineOptions({ name: 'RoleList' });
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import {
  QfDataTable,
  QfStatusTag,
  QfPermissionButton,
  QfTableActions,
  QfFormDialog,
  QfDetailDrawer,
} from '@/shared';
import type { QfTableColumn, QfActionItem } from '@/shared';
import { useTable } from '@/shared';
import {
  iamApi,
  type RoleDataScope,
  type SysMenu,
  type SysPermission,
  type SysRole,
  type SysUser,
} from '@/api/iam';

const columns: QfTableColumn<SysRole>[] = [
  { prop: 'roleCode', label: '角色编码', minWidth: 160 },
  { prop: 'roleName', label: '角色名称', minWidth: 160 },
  { prop: 'status', label: '状态', width: 120, slot: 'status' },
];

const relatedUserColumns: QfTableColumn<SysUser>[] = [
  { prop: 'username', label: '账号', minWidth: 150 },
  { prop: 'nickname', label: '姓名', minWidth: 140 },
  { prop: 'mobile', label: '手机', minWidth: 140 },
  { prop: 'email', label: '邮箱', minWidth: 180 },
  { prop: 'status', label: '状态', width: 100 },
];

const table = useTable<SysRole>({ fetcher: () => iamApi.roles() });

const submitting = ref(false);
const roleSubmitting = ref(false);
const dataScopeFormRef = ref<FormInstance>();
const dialogVisible = ref(false);
const roleDialogVisible = ref(false);
const relatedUsersVisible = ref(false);
const relatedUsersLoading = ref(false);
const menus = ref<SysMenu[]>([]);
const permissions = ref<SysPermission[]>([]);
const currentRole = ref<SysRole | null>(null);
const editingRole = ref<SysRole | null>(null);
const relatedUsers = ref<SysUser[]>([]);
const selectedMenuIds = ref<number[]>([]);
const selectedPermissionIds = ref<number[]>([]);
const dataScope = ref<RoleDataScope>({
  scopeType: 'ALL',
  scopeValue: '',
});
const roleForm = ref<Omit<SysRole, 'id'>>({
  roleCode: '',
  roleName: '',
  sortOrder: 0,
  status: 'ENABLED',
});

const roleRules: FormRules<Omit<SysRole, 'id'>> = {
  roleCode: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
};

const dataScopeRules: FormRules<RoleDataScope> = {
  scopeType: [{ required: true, message: '请选择范围类型', trigger: 'change' }],
};

async function loadOptions() {
  [menus.value, permissions.value] = await Promise.all([iamApi.menus(), iamApi.permissions()]);
}

function openCreate() {
  editingRole.value = null;
  roleForm.value = {
    roleCode: '',
    roleName: '',
    sortOrder: 0,
    status: 'ENABLED',
  };
  roleDialogVisible.value = true;
}

function openEdit(role: SysRole) {
  editingRole.value = role;
  roleForm.value = {
    roleCode: role.roleCode,
    roleName: role.roleName,
    sortOrder: role.sortOrder,
    status: role.status,
  };
  roleDialogVisible.value = true;
}

async function submitRole() {
  roleSubmitting.value = true;
  try {
    if (editingRole.value) {
      await iamApi.updateRole(editingRole.value.id, roleForm.value);
      ElMessage.success('角色已更新');
    } else {
      await iamApi.createRole(roleForm.value);
      ElMessage.success('角色已创建');
    }
    roleDialogVisible.value = false;
    await table.reload();
  } finally {
    roleSubmitting.value = false;
  }
}

async function deleteRole(role: SysRole) {
  await ElMessageBox.confirm(`确认删除角色 ${role.roleName}？`, '删除角色', { type: 'warning' });
  await iamApi.deleteRole(role.id);
  ElMessage.success('角色已删除');
  await table.reload();
}

async function toggleStatus(role: SysRole) {
  const nextStatus = role.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
  await iamApi.updateRoleStatus(role.id, nextStatus);
  ElMessage.success('角色状态已更新');
  await table.reload();
}

function getActions(row: SysRole): QfActionItem[] {
  return [
    { label: '编辑', permission: 'system:role:update', handler: () => openEdit(row) },
    { label: '授权', permission: 'system:role:update', handler: () => openAuthorize(row) },
    { label: '用户', handler: () => openRelatedUsers(row) },
    {
      label: '删除',
      type: 'danger',
      permission: 'system:role:update',
      handler: () => deleteRole(row),
    },
    {
      label: row.status === 'ENABLED' ? '禁用' : '启用',
      permission: 'system:role:update',
      handler: () => toggleStatus(row),
    },
  ];
}

async function openAuthorize(role: SysRole) {
  currentRole.value = role;
  selectedMenuIds.value = menus.value.map((menu) => menu.id);
  selectedPermissionIds.value = permissions.value.map((permission) => permission.id);
  const scopes = await iamApi.roleDataScopes(role.id);
  dataScope.value = scopes[0] ?? { scopeType: 'ALL', scopeValue: '' };
  dialogVisible.value = true;
}

async function submitAuthorize() {
  if (!currentRole.value) {
    return;
  }

  await dataScopeFormRef.value?.validate();
  submitting.value = true;
  try {
    await Promise.all([
      iamApi.assignRoleMenus(currentRole.value.id, selectedMenuIds.value),
      iamApi.assignRolePermissions(currentRole.value.id, selectedPermissionIds.value),
      iamApi.assignRoleDataScopes(currentRole.value.id, [dataScope.value]),
    ]);
    ElMessage.success('授权已保存');
    dialogVisible.value = false;
  } finally {
    submitting.value = false;
  }
}

async function openRelatedUsers(role: SysRole) {
  currentRole.value = role;
  relatedUsersVisible.value = true;
  relatedUsersLoading.value = true;
  try {
    const users = await iamApi.users();
    relatedUsers.value = users.filter((user) => user.roleIds.includes(role.id));
  } finally {
    relatedUsersLoading.value = false;
  }
}

onMounted(loadOptions);
</script>
