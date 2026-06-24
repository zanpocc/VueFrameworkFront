<template>
  <section class="page">
    <header class="page__header">
      <div>
        <h1>{{ t('iam.menu.title') }}</h1>
        <p>{{ t('iam.menu.subtitle') }}</p>
      </div>
      <QfPermissionButton code="system:menu:view" type="primary" @click="openCreate">
        {{ t('iam.menu.create') }}
      </QfPermissionButton>
    </header>

    <el-table v-loading="loading" :data="menuTree" border default-expand-all row-key="id">
      <el-table-column prop="title" :label="t('iam.menu.columns.name')" min-width="160" />
      <el-table-column prop="menuType" :label="t('iam.menu.columns.type')" width="100" />
      <el-table-column prop="routePath" :label="t('iam.menu.columns.route')" min-width="160" />
      <el-table-column prop="component" :label="t('iam.menu.columns.component')" min-width="180" />
      <el-table-column
        prop="permissionCode"
        :label="t('iam.menu.columns.permissionCode')"
        min-width="180"
      />
      <el-table-column prop="status" :label="t('iam.menu.columns.status')" width="110">
        <template #default="{ row }">
          <QfStatusTag :status="row.status" />
        </template>
      </el-table-column>
      <el-table-column :label="t('common.button.more')" width="160">
        <template #default="{ row }">
          <QfPermissionButton code="system:menu:view" text type="primary" @click="openEdit(row)">
            {{ t('common.button.edit') }}
          </QfPermissionButton>
          <QfPermissionButton code="system:menu:view" text type="danger" @click="deleteMenu(row)">
            {{ t('common.button.delete') }}
          </QfPermissionButton>
        </template>
      </el-table-column>
    </el-table>

    <QfFormDialog
      v-model="dialogVisible"
      :title="editingMenu ? t('iam.menu.editTitle') : t('iam.menu.createTitle')"
      :model="form"
      :rules="rules"
      :loading="submitting"
      width="620px"
      @submit="submit"
    >
      <el-form-item :label="t('iam.menu.form.name')" prop="title">
        <el-input v-model="form.title" />
      </el-form-item>
      <el-form-item :label="t('iam.menu.form.parent')" prop="parentId">
        <el-select v-model="form.parentId">
          <el-option :label="t('iam.menu.form.parentRoot')" :value="0" />
          <el-option
            v-for="menu in menus"
            :key="menu.id"
            :label="menu.title"
            :value="menu.id"
            :disabled="editingMenu?.id === menu.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('iam.menu.form.type')" prop="menuType">
        <el-select v-model="form.menuType">
          <el-option :label="t('iam.menu.form.typeMenu')" value="MENU" />
          <el-option :label="t('iam.menu.form.typeButton')" value="BUTTON" />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('iam.menu.form.routeName')" prop="routeName">
        <el-input v-model="form.routeName" />
      </el-form-item>
      <el-form-item :label="t('iam.menu.form.routePath')" prop="routePath">
        <el-input v-model="form.routePath" />
      </el-form-item>
      <el-form-item :label="t('iam.menu.form.component')" prop="component">
        <el-input v-model="form.component" />
      </el-form-item>
      <el-form-item :label="t('iam.menu.form.icon')" prop="icon">
        <QfIconSelect v-model="form.icon" />
      </el-form-item>
      <el-form-item :label="t('iam.menu.form.permissionCode')" prop="permissionCode">
        <el-input v-model="form.permissionCode" />
      </el-form-item>
      <el-form-item :label="t('iam.menu.form.sortOrder')" prop="sortOrder">
        <el-input-number v-model="form.sortOrder" :min="0" />
      </el-form-item>
      <el-form-item :label="t('iam.menu.form.status')" prop="status">
        <el-select v-model="form.status">
          <el-option :label="t('common.status.enabled')" value="ENABLED" />
          <el-option :label="t('common.status.disabled')" value="DISABLED" />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('iam.menu.form.visible')" prop="visible">
        <el-switch v-model="form.visible" />
      </el-form-item>
    </QfFormDialog>
  </section>
</template>

<script setup lang="ts">
defineOptions({ name: 'MenuList' });
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormRules } from 'element-plus';
import { iamApi, type MenuCommand, type SysMenu } from '@/api/iam';
import { QfFormDialog, QfIconSelect, QfPermissionButton, QfStatusTag } from '@/shared';
import { buildTree } from '@/shared/utils/tree';

const { t } = useI18n();
const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const menus = ref<SysMenu[]>([]);
const editingMenu = ref<SysMenu | null>(null);
const form = reactive<MenuCommand>({
  parentId: 0,
  menuType: 'MENU',
  title: '',
  routeName: '',
  routePath: '',
  component: '',
  icon: '',
  permissionCode: '',
  visible: true,
  sortOrder: 0,
  status: 'ENABLED',
});

const rules = computed<FormRules<MenuCommand>>(() => ({
  title: [{ required: true, message: t('iam.menu.validation.titleRequired'), trigger: 'blur' }],
  menuType: [{ required: true, message: t('iam.menu.validation.menuTypeRequired'), trigger: 'change' }],
  routeName: [
    { required: true, message: t('iam.menu.validation.routeNameRequired'), trigger: 'blur' },
  ],
  routePath: [
    { required: true, message: t('iam.menu.validation.routePathRequired'), trigger: 'blur' },
  ],
  status: [{ required: true, message: t('iam.menu.validation.statusRequired'), trigger: 'change' }],
}));

const menuTree = computed(() =>
  buildTree<SysMenu>(menus.value, { idKey: 'id', parentKey: 'parentId', sortKey: 'sortOrder' }),
);

async function loadMenus() {
  loading.value = true;
  try {
    menus.value = await iamApi.menus();
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingMenu.value = null;
  Object.assign(form, {
    parentId: 0,
    menuType: 'MENU',
    title: '',
    routeName: '',
    routePath: '',
    component: '',
    icon: '',
    permissionCode: '',
    visible: true,
    sortOrder: 0,
    status: 'ENABLED',
  });
  dialogVisible.value = true;
}

function openEdit(row: SysMenu) {
  editingMenu.value = row;
  Object.assign(form, {
    parentId: row.parentId,
    menuType: row.menuType,
    title: row.title,
    routeName: row.routeName ?? '',
    routePath: row.routePath ?? '',
    component: row.component ?? '',
    icon: row.icon ?? '',
    permissionCode: row.permissionCode ?? '',
    visible: row.visible,
    sortOrder: row.sortOrder,
    status: row.status,
  });
  dialogVisible.value = true;
}

async function submit() {
  submitting.value = true;
  try {
    if (editingMenu.value) {
      await iamApi.updateMenu(editingMenu.value.id, form);
      ElMessage.success(t('iam.menu.toast.updated'));
    } else {
      await iamApi.createMenu(form);
      ElMessage.success(t('iam.menu.toast.created'));
    }
    dialogVisible.value = false;
    await loadMenus();
  } finally {
    submitting.value = false;
  }
}

async function deleteMenu(row: SysMenu) {
  await ElMessageBox.confirm(
    t('iam.menu.deleteConfirm', { name: row.title }),
    t('iam.menu.deleteTitle'),
    { type: 'warning' },
  );
  await iamApi.deleteMenu(row.id);
  ElMessage.success(t('iam.menu.toast.deleted'));
  await loadMenus();
}

onMounted(loadMenus);
</script>
