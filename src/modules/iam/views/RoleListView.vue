<template>
  <section class="page">
    <header class="page__header">
      <div>
        <h1>角色管理</h1>
        <p>维护角色并分配菜单、按钮权限。</p>
      </div>
      <el-button v-permission="'system:role:update'" type="primary" @click="openCreate">
        新增角色
      </el-button>
    </header>

    <el-table v-loading="loading" :data="roles" border row-key="id">
      <el-table-column prop="roleCode" label="角色编码" min-width="160" />
      <el-table-column prop="roleName" label="角色名称" min-width="160" />
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="row.status === 'ENABLED' ? 'success' : 'info'">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280">
        <template #default="{ row }">
          <el-button v-permission="'system:role:update'" text type="primary" @click="openEdit(row)">
            编辑
          </el-button>
          <el-button
            v-permission="'system:role:update'"
            text
            type="primary"
            @click="openAuthorize(row)"
          >
            授权
          </el-button>
          <el-button
            v-permission="'system:role:update'"
            text
            type="danger"
            @click="deleteRole(row)"
          >
            删除
          </el-button>
          <el-button
            v-permission="'system:role:update'"
            text
            type="primary"
            @click="toggleRoleStatus(row)"
          >
            {{ row.status === 'ENABLED' ? '禁用' : '启用' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="roleDialogVisible"
      :title="editingRole ? '编辑角色' : '新增角色'"
      width="480px"
    >
      <el-form label-position="top">
        <el-form-item label="角色编码">
          <el-input v-model="roleForm.roleCode" />
        </el-form-item>
        <el-form-item label="角色名称">
          <el-input v-model="roleForm.roleName" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="roleForm.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="roleForm.status">
            <el-option label="启用" value="ENABLED" />
            <el-option label="禁用" value="DISABLED" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false"> 取消 </el-button>
        <el-button type="primary" :loading="roleSubmitting" @click="submitRole"> 保存 </el-button>
      </template>
    </el-dialog>

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
          <el-form label-position="top">
            <el-form-item label="范围类型">
              <el-select v-model="dataScope.scopeType">
                <el-option label="全部数据" value="ALL" />
                <el-option label="本部门" value="DEPT" />
                <el-option label="本人数据" value="SELF" />
                <el-option label="自定义" value="CUSTOM" />
              </el-select>
            </el-form-item>
            <el-form-item label="范围值">
              <el-input
                v-model="dataScope.scopeValue"
                placeholder="部门 ID 或自定义表达式，全部/本人可留空"
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
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  iamApi,
  type RoleDataScope,
  type SysMenu,
  type SysPermission,
  type SysRole,
} from '@/api/iam';

const loading = ref(false);
const submitting = ref(false);
const roleSubmitting = ref(false);
const dialogVisible = ref(false);
const roleDialogVisible = ref(false);
const roles = ref<SysRole[]>([]);
const menus = ref<SysMenu[]>([]);
const permissions = ref<SysPermission[]>([]);
const currentRole = ref<SysRole | null>(null);
const editingRole = ref<SysRole | null>(null);
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

async function loadData() {
  loading.value = true;
  try {
    [roles.value, menus.value, permissions.value] = await Promise.all([
      iamApi.roles(),
      iamApi.menus(),
      iamApi.permissions(),
    ]);
  } finally {
    loading.value = false;
  }
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
    await loadData();
  } finally {
    roleSubmitting.value = false;
  }
}

async function deleteRole(role: SysRole) {
  await ElMessageBox.confirm(`确认删除角色 ${role.roleName}？`, '删除角色', { type: 'warning' });
  await iamApi.deleteRole(role.id);
  ElMessage.success('角色已删除');
  await loadData();
}

async function toggleRoleStatus(role: SysRole) {
  const nextStatus = role.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
  await iamApi.updateRoleStatus(role.id, nextStatus);
  ElMessage.success('角色状态已更新');
  await loadData();
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

onMounted(loadData);
</script>
