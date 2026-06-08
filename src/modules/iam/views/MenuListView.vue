<template>
  <section class="page">
    <header class="page__header">
      <div>
        <h1>菜单管理</h1>
        <p>维护路由、组件、菜单权限和按钮权限编码。</p>
      </div>
      <el-button v-permission="'system:menu:view'" type="primary" @click="openCreate">
        新增菜单
      </el-button>
    </header>

    <el-table v-loading="loading" :data="menuTree" border default-expand-all row-key="id">
      <el-table-column prop="title" label="名称" min-width="160" />
      <el-table-column prop="menuType" label="类型" width="100" />
      <el-table-column prop="routePath" label="路由" min-width="160" />
      <el-table-column prop="component" label="组件" min-width="180" />
      <el-table-column prop="permissionCode" label="权限编码" min-width="180" />
      <el-table-column prop="status" label="状态" width="110" />
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button text type="primary" @click="openEdit(row)"> 编辑 </el-button>
          <el-button text type="danger" @click="deleteMenu(row)"> 删除 </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editingMenu ? '编辑菜单' : '新增菜单'" width="620px">
      <el-form label-position="top">
        <el-form-item label="名称">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="上级菜单">
          <el-select v-model="form.parentId">
            <el-option label="根菜单" :value="0" />
            <el-option
              v-for="menu in menus"
              :key="menu.id"
              :label="menu.title"
              :value="menu.id"
              :disabled="editingMenu?.id === menu.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.menuType">
            <el-option label="菜单" value="MENU" />
            <el-option label="按钮" value="BUTTON" />
          </el-select>
        </el-form-item>
        <el-form-item label="路由名称">
          <el-input v-model="form.routeName" />
        </el-form-item>
        <el-form-item label="路由路径">
          <el-input v-model="form.routePath" />
        </el-form-item>
        <el-form-item label="组件路径">
          <el-input v-model="form.component" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="form.icon" />
        </el-form-item>
        <el-form-item label="权限编码">
          <el-input v-model="form.permissionCode" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option label="启用" value="ENABLED" />
            <el-option label="禁用" value="DISABLED" />
          </el-select>
        </el-form-item>
        <el-form-item label="显示">
          <el-switch v-model="form.visible" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false"> 取消 </el-button>
        <el-button type="primary" :loading="submitting" @click="submit"> 保存 </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { iamApi, type MenuCommand, type SysMenu } from '@/api/iam';

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
type MenuNode = SysMenu & { children?: MenuNode[] };

const menuTree = computed(() => buildMenuTree(menus.value));

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
      ElMessage.success('菜单已更新');
    } else {
      await iamApi.createMenu(form);
      ElMessage.success('菜单已创建');
    }
    dialogVisible.value = false;
    await loadMenus();
  } finally {
    submitting.value = false;
  }
}

async function deleteMenu(row: SysMenu) {
  await ElMessageBox.confirm(`确认删除菜单 ${row.title}？`, '删除菜单', { type: 'warning' });
  await iamApi.deleteMenu(row.id);
  ElMessage.success('菜单已删除');
  await loadMenus();
}

function buildMenuTree(items: SysMenu[]) {
  const nodeMap = new Map<number, MenuNode>();
  const roots: MenuNode[] = [];

  for (const item of items) {
    nodeMap.set(item.id, { ...item, children: [] });
  }

  for (const node of nodeMap.values()) {
    const parent = nodeMap.get(node.parentId);
    if (parent) {
      parent.children?.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (nodes: MenuNode[]) => {
    nodes.sort((left, right) => left.sortOrder - right.sortOrder || left.id - right.id);
    for (const node of nodes) {
      sortNodes(node.children ?? []);
      if (node.children?.length === 0) {
        delete node.children;
      }
    }
  };
  sortNodes(roots);
  return roots;
}

onMounted(loadMenus);
</script>
