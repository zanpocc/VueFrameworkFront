<template>
  <QfPageShell>
    <QfPageHeader :title="t('iam.role.title')" :description="t('iam.role.subtitle')">
      <template #actions>
        <QfPermissionButton code="system:role:update" type="primary" @click="openCreate">
          {{ t('iam.role.create') }}
        </QfPermissionButton>
      </template>
    </QfPageHeader>

    <QfTablePanel title="角色列表" description="维护角色状态和菜单、按钮、数据范围授权。">
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
    </QfTablePanel>

    <QfFormDialog
      v-model="roleDialogVisible"
      :title="editingRole ? t('iam.role.editTitle') : t('iam.role.createTitle')"
      :model="roleForm"
      :rules="roleRules"
      :loading="roleSubmitting"
      width="480px"
      @submit="submitRole"
    >
      <el-form-item :label="t('iam.role.form.code')" prop="roleCode">
        <el-input v-model="roleForm.roleCode" />
      </el-form-item>
      <el-form-item :label="t('iam.role.form.name')" prop="roleName">
        <el-input v-model="roleForm.roleName" />
      </el-form-item>
      <el-form-item :label="t('iam.role.form.sortOrder')" prop="sortOrder">
        <el-input-number v-model="roleForm.sortOrder" :min="0" />
      </el-form-item>
      <el-form-item :label="t('iam.role.form.status')" prop="status">
        <el-select v-model="roleForm.status">
          <el-option :label="t('common.status.enabled')" value="ENABLED" />
          <el-option :label="t('common.status.disabled')" value="DISABLED" />
        </el-select>
      </el-form-item>
    </QfFormDialog>

    <el-dialog v-model="dialogVisible" :title="t('iam.role.authorize')" width="620px">
      <el-tabs>
        <el-tab-pane :label="t('iam.role.tabs.menu')">
          <el-checkbox-group v-model="selectedMenuIds">
            <el-checkbox v-for="menu in menus" :key="menu.id" :value="menu.id">
              {{ menu.title }}
            </el-checkbox>
          </el-checkbox-group>
        </el-tab-pane>
        <el-tab-pane :label="t('iam.role.tabs.permission')">
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
        <el-tab-pane :label="t('iam.role.tabs.dataScope')">
          <el-form
            ref="dataScopeFormRef"
            :model="dataScope"
            :rules="dataScopeRules"
            label-position="top"
          >
            <el-form-item :label="t('iam.role.dataScope.type')" prop="scopeType">
              <el-select v-model="dataScope.scopeType">
                <el-option :label="t('iam.role.dataScope.typeAll')" value="ALL" />
                <el-option :label="t('iam.role.dataScope.typeDept')" value="DEPT" />
                <el-option :label="t('iam.role.dataScope.typeSelf')" value="SELF" />
                <el-option :label="t('iam.role.dataScope.typeCustom')" value="CUSTOM" />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('iam.role.dataScope.value')" prop="scopeValue">
              <el-input
                v-model="dataScope.scopeValue"
                :placeholder="t('iam.role.dataScope.valuePlaceholder')"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('common.button.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="submitAuthorize">
          {{ t('common.button.save') }}
        </el-button>
      </template>
    </el-dialog>

    <QfDetailDrawer
      v-model="relatedUsersVisible"
      :title="
        currentRole
          ? t('iam.role.relatedUsersOf', { name: currentRole.roleName })
          : t('iam.role.relatedUsers')
      "
      width="720px"
      :loading="relatedUsersLoading"
    >
      <QfDataTable :columns="relatedUserColumns" :data="relatedUsers" :page-size="10" />
    </QfDetailDrawer>
  </QfPageShell>
</template>

<script setup lang="ts">
defineOptions({ name: 'RoleList' });
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import {
  QfDataTable,
  QfStatusTag,
  QfPermissionButton,
  QfTableActions,
  QfFormDialog,
  QfDetailDrawer,
  QfPageHeader,
  QfPageShell,
  QfTablePanel,
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

const { t } = useI18n();

// columns / 表单 rules 全部走 computed，让 locale 切换可以重新计算 label/message。
const columns = computed<QfTableColumn<SysRole>[]>(() => [
  { prop: 'roleCode', label: t('iam.role.columns.code'), minWidth: 160 },
  { prop: 'roleName', label: t('iam.role.columns.name'), minWidth: 160 },
  { prop: 'status', label: t('iam.role.columns.status'), width: 120, slot: 'status' },
]);

const relatedUserColumns = computed<QfTableColumn<SysUser>[]>(() => [
  { prop: 'username', label: t('iam.user.columns.username'), minWidth: 150 },
  { prop: 'nickname', label: t('iam.user.columns.nickname'), minWidth: 140 },
  { prop: 'mobile', label: t('iam.user.columns.mobile'), minWidth: 140 },
  { prop: 'email', label: t('iam.user.columns.email'), minWidth: 180 },
  { prop: 'status', label: t('iam.user.columns.status'), width: 100 },
]);

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

const roleRules = computed<FormRules<Omit<SysRole, 'id'>>>(() => ({
  roleCode: [{ required: true, message: t('iam.role.validation.codeRequired'), trigger: 'blur' }],
  roleName: [{ required: true, message: t('iam.role.validation.nameRequired'), trigger: 'blur' }],
  status: [{ required: true, message: t('iam.role.validation.statusRequired'), trigger: 'change' }],
}));

const dataScopeRules = computed<FormRules<RoleDataScope>>(() => ({
  scopeType: [
    { required: true, message: t('iam.role.validation.scopeTypeRequired'), trigger: 'change' },
  ],
}));

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
      ElMessage.success(t('iam.role.toast.updated'));
    } else {
      await iamApi.createRole(roleForm.value);
      ElMessage.success(t('iam.role.toast.created'));
    }
    roleDialogVisible.value = false;
    await table.reload();
  } finally {
    roleSubmitting.value = false;
  }
}

async function deleteRole(role: SysRole) {
  await ElMessageBox.confirm(
    t('iam.role.deleteConfirm', { name: role.roleName }),
    t('iam.role.deleteTitle'),
    { type: 'warning' },
  );
  await iamApi.deleteRole(role.id);
  ElMessage.success(t('iam.role.toast.deleted'));
  await table.reload();
}

async function toggleStatus(role: SysRole) {
  const nextStatus = role.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
  await iamApi.updateRoleStatus(role.id, nextStatus);
  ElMessage.success(t('iam.role.toast.statusUpdated'));
  await table.reload();
}

function getActions(row: SysRole): QfActionItem[] {
  return [
    {
      label: t('common.button.edit'),
      permission: 'system:role:update',
      handler: () => openEdit(row),
    },
    {
      label: t('iam.role.actions.authorize'),
      permission: 'system:role:update',
      handler: () => openAuthorize(row),
    },
    { label: t('iam.role.actions.users'), handler: () => openRelatedUsers(row) },
    {
      label: t('common.button.delete'),
      type: 'danger',
      permission: 'system:role:update',
      handler: () => deleteRole(row),
    },
    {
      label: row.status === 'ENABLED' ? t('common.button.disable') : t('common.button.enable'),
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
    ElMessage.success(t('iam.role.toast.authorizeSaved'));
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
