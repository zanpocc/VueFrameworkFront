import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import MainLayout from '@/layouts/MainLayout.vue';
import LoginView from '@/modules/auth/views/LoginView.vue';
import DashboardView from '@/modules/system/views/DashboardView.vue';
import PlaceholderView from '@/modules/system/views/PlaceholderView.vue';
import ConfigListView from '@/modules/system/views/ConfigListView.vue';
import DataGovernanceView from '@/modules/system/views/DataGovernanceView.vue';
import DictListView from '@/modules/system/views/DictListView.vue';
import LogListView from '@/modules/system/views/LogListView.vue';
import TaskListView from '@/modules/async-task/views/TaskListView.vue';
import WorkflowCenterView from '@/modules/workflow/views/WorkflowCenterView.vue';
import FileListView from '@/modules/file/views/FileListView.vue';
import UserListView from '@/modules/iam/views/UserListView.vue';
import DeptListView from '@/modules/iam/views/DeptListView.vue';
import PostListView from '@/modules/iam/views/PostListView.vue';
import RoleListView from '@/modules/iam/views/RoleListView.vue';
import MenuListView from '@/modules/iam/views/MenuListView.vue';
import { useAuthStore } from '@/stores/auth';
import type { MenuTreeNode } from '@/api/auth';

const componentMap: Record<string, RouteRecordRaw['component']> = {
  DashboardView,
  'system/DashboardView': DashboardView,
  'system/ConfigListView': ConfigListView,
  'system/DataGovernanceView': DataGovernanceView,
  'system/DictListView': DictListView,
  'system/LogListView': LogListView,
  'system/TaskListView': TaskListView,
  'workflow/WorkflowCenterView': WorkflowCenterView,
  'file/FileListView': FileListView,
  'iam/UserListView': UserListView,
  'iam/DeptListView': DeptListView,
  'iam/PostListView': PostListView,
  'iam/RoleListView': RoleListView,
  'iam/MenuListView': MenuListView,
  PlaceholderView,
};

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      public: true,
      title: '登录',
    },
  },
  {
    path: '/',
    name: 'root',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'dashboard',
        component: DashboardView,
        meta: {
          title: '工作台',
          permissions: ['dashboard:view'],
        },
      },
    ],
  },
  {
    path: '/403',
    name: 'forbidden',
    component: PlaceholderView,
    meta: {
      public: true,
      title: '没有权限',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

function resolveComponent(menu: MenuTreeNode) {
  if (!menu.component) {
    return PlaceholderView;
  }
  return componentMap[menu.component] ?? PlaceholderView;
}

function registerMenuRoutes(menus: MenuTreeNode[]) {
  const visit = (menu: MenuTreeNode) => {
    if (menu.routePath && menu.routeName && !router.hasRoute(menu.routeName)) {
      router.addRoute('root', {
        path: menu.routePath,
        name: menu.routeName,
        component: resolveComponent(menu),
        meta: {
          title: menu.title,
          permissions: menu.permissionCode ? [menu.permissionCode] : [],
        },
      });
    }
    menu.children.forEach(visit);
  };

  menus.forEach(visit);
}

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  if (to.meta.public) {
    return true;
  }

  if (!authStore.isAuthenticated) {
    return {
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    };
  }

  if (!authStore.bootstrapped) {
    await authStore.loadSession();
    registerMenuRoutes(authStore.menus);
    return to.fullPath;
  }

  if (authStore.menus.length > 0) {
    registerMenuRoutes(authStore.menus);
  }

  const requiredPermissions = (to.meta.permissions || []) as string[];
  if (
    requiredPermissions.length > 0 &&
    !requiredPermissions.every((permission) => authStore.hasPermission(permission))
  ) {
    return { name: 'forbidden' };
  }

  return true;
});
