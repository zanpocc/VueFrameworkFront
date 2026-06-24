import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import MainLayout from '@/layouts/MainLayout.vue';
import LoginView from '@/modules/auth/views/LoginView.vue';
import DashboardView from '@/modules/system/views/DashboardView.vue';
import PlaceholderView from '@/modules/system/views/PlaceholderView.vue';
import ConfigListView from '@/modules/system/views/ConfigListView.vue';
import DataGovernanceView from '@/modules/system/views/DataGovernanceView.vue';
import DictListView from '@/modules/system/views/DictListView.vue';
import LogListView from '@/modules/system/views/LogListView.vue';
import NoticeListView from '@/modules/system/views/NoticeListView.vue';
import TaskListView from '@/modules/async-task/views/TaskListView.vue';
import WorkflowCenterView from '@/modules/workflow/views/WorkflowCenterView.vue';
import FormListView from '@/modules/workflow/views/FormListView.vue';
import DefinitionListView from '@/modules/workflow/views/DefinitionListView.vue';
import TodoTaskListView from '@/modules/workflow/views/TodoTaskListView.vue';
import DoneTaskListView from '@/modules/workflow/views/DoneTaskListView.vue';
import InstanceListView from '@/modules/workflow/views/InstanceListView.vue';
import CCListView from '@/modules/workflow/views/CCListView.vue';
import DefinitionEditorView from '@/modules/workflow/views/DefinitionEditorView.vue';
import DefinitionDesignerView from '@/modules/workflow/views/DefinitionDesignerView.vue';
import RepairOrderListView from '@/modules/demo/views/RepairOrderListView.vue';
import FileListView from '@/modules/file/views/FileListView.vue';
import UserListView from '@/modules/iam/views/UserListView.vue';
import DeptListView from '@/modules/iam/views/DeptListView.vue';
import PostListView from '@/modules/iam/views/PostListView.vue';
import RoleListView from '@/modules/iam/views/RoleListView.vue';
import MenuListView from '@/modules/iam/views/MenuListView.vue';
import ForbiddenView from '@/components/error/ForbiddenView.vue';
import NotFoundView from '@/components/error/NotFoundView.vue';
import ServerErrorView from '@/components/error/ServerErrorView.vue';
import DemoCrudView from '@/modules/system/views/DemoCrudView.vue';
import { useAuthStore } from '@/stores/auth';
import type { MenuTreeNode } from '@/api/auth';

const componentMap: Record<string, RouteRecordRaw['component']> = {
  DashboardView,
  'system/DashboardView': DashboardView,
  'system/ConfigListView': ConfigListView,
  'system/DataGovernanceView': DataGovernanceView,
  'system/DictListView': DictListView,
  'system/LogListView': LogListView,
  'system/NoticeListView': NoticeListView,
  'system/TaskListView': TaskListView,
  'workflow/WorkflowCenterView': WorkflowCenterView,
  'workflow/FormListView': FormListView,
  'workflow/DefinitionListView': DefinitionListView,
  'workflow/TodoTaskListView': TodoTaskListView,
  'workflow/DoneTaskListView': DoneTaskListView,
  'workflow/InstanceListView': InstanceListView,
  'workflow/CCListView': CCListView,
  'workflow/DefinitionEditorView': DefinitionEditorView,
  'workflow/DefinitionDesignerView': DefinitionDesignerView,
  'demo/RepairOrderListView': RepairOrderListView,
  'file/FileListView': FileListView,
  'iam/UserListView': UserListView,
  'iam/DeptListView': DeptListView,
  'iam/PostListView': PostListView,
  'iam/RoleListView': RoleListView,
  'iam/MenuListView': MenuListView,
  PlaceholderView,
  DemoCrudView,
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
  // Dev-only playground for src/shared 组件演示，生产构建不暴露入口菜单。
  ...(import.meta.env.DEV
    ? [
        {
          path: '/shared/playground',
          name: 'shared-playground',
          component: () => import('@/shared/SharedPlayground.vue'),
          meta: {
            public: true,
            title: '共享组件演示',
          },
        } as RouteRecordRaw,
      ]
    : []),
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
      {
        path: 'workflow/definition/:id/editor',
        name: 'definition-editor',
        component: DefinitionEditorView,
        meta: {
          title: '流程节点编辑',
          permissions: ['workflow:definition:update'],
        },
      },
      {
        path: 'workflow/definition/:id/designer',
        name: 'definition-designer',
        component: DefinitionDesignerView,
        meta: {
          title: '流程画板设计',
          permissions: ['workflow:definition:update'],
        },
      },
      // Dev-only Demo CRUD page — showcases the full shared layer
      ...(import.meta.env.DEV
        ? [
            {
              path: 'demo-crud',
              name: 'demo-crud',
              component: DemoCrudView,
              meta: {
                title: 'Demo CRUD',
                permissions: ['dashboard:view'],
              },
            } as RouteRecordRaw,
          ]
        : []),
    ],
  },
  {
    path: '/403',
    name: 'forbidden',
    component: ForbiddenView,
    meta: {
      public: true,
      title: '没有权限',
    },
  },
  {
    path: '/404',
    name: 'not-found',
    component: NotFoundView,
    meta: {
      public: true,
      title: '页面不存在',
    },
  },
  {
    path: '/500',
    name: 'server-error',
    component: ServerErrorView,
    meta: {
      public: true,
      title: '服务器错误',
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
    try {
      await authStore.loadSession();
    } catch {
      // loadSession itself handles errors internally (clears session),
      // but guard against any unexpected rejections so we never white-screen.
    }

    // If loadSession cleared the token (backend error / expired), redirect to login.
    if (!authStore.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } };
    }

    registerMenuRoutes(authStore.menus);
    return to.fullPath;
  }

  if (authStore.menus.length > 0) {
    registerMenuRoutes(authStore.menus);
  }

  // After registering dynamic routes, if the current path still resolves to
  // the catch-all redirect (i.e., no matching route was found), redirect to 404.
  const resolved = router.resolve(to.fullPath);
  const isCatchAll =
    resolved.matched.length > 0 &&
    resolved.matched[resolved.matched.length - 1]?.name === undefined &&
    resolved.path !== '/' &&
    !router.hasRoute(String(to.name ?? ''));

  if (isCatchAll) {
    return { name: 'not-found' };
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
