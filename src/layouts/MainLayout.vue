<template>
  <el-container class="app-shell">
    <el-aside class="app-shell__aside" width="232px">
      <div class="app-shell__brand">QuickFramework</div>
      <el-menu router :default-active="activeMenu">
        <MenuNode v-for="item in authStore.visibleMenus" :key="item.id" :menu="item" />
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="app-shell__header">
        <span>企业平台脚手架</span>
        <el-dropdown trigger="click" @command="handleCommand">
          <el-button text>
            <el-icon><User /></el-icon>
            <span>{{ authStore.displayName }}</span>
            <el-icon><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout"> 退出登录 </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>
      <el-main class="app-shell__main">
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import {
  ArrowDown,
  Briefcase,
  Checked,
  Collection,
  Connection,
  Document,
  EditPen,
  Menu,
  Monitor,
  OfficeBuilding,
  Operation,
  Setting,
  Share,
  Timer,
  Tools,
  Tickets,
  User,
  UserFilled,
} from '@element-plus/icons-vue';
import { ElIcon, ElMenuItem, ElSubMenu } from 'element-plus';
import type { MenuTreeNode } from '@/api/auth';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const activeMenu = computed(() => route.path);

const iconMap = {
  Monitor,
  Menu,
  Briefcase,
  Checked,
  Collection,
  Connection,
  Document,
  EditPen,
  OfficeBuilding,
  Operation,
  Setting,
  Share,
  Timer,
  Tools,
  Tickets,
  User,
  UserFilled,
};

const MenuNode = defineComponent({
  name: 'MenuNode',
  props: {
    menu: {
      type: Object as () => MenuTreeNode,
      required: true,
    },
  },
  setup(props) {
    const visibleChildren = computed(() =>
      props.menu.children.filter((child) => child.visible !== false),
    );
    const renderTitle = () => {
      const icon = props.menu.icon ? iconMap[props.menu.icon as keyof typeof iconMap] : Monitor;
      return [h(ElIcon, null, () => h(icon)), h('span', null, props.menu.title)];
    };

    return () => {
      if (visibleChildren.value.length > 0) {
        return h(
          ElSubMenu,
          { index: props.menu.routePath || String(props.menu.id) },
          {
            title: renderTitle,
            default: () => visibleChildren.value.map((child) => h(MenuNode, { menu: child })),
          },
        );
      }

      return h(
        ElMenuItem,
        { index: props.menu.routePath },
        {
          default: renderTitle,
        },
      );
    };
  },
});

async function handleCommand(command: string) {
  if (command === 'logout') {
    await authStore.logout();
    await router.replace('/login');
  }
}
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
}

.app-shell__aside {
  border-right: 1px solid #e5e7eb;
  background: #fff;
}

.app-shell__brand {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 20px;
  font-size: 16px;
  font-weight: 700;
  border-bottom: 1px solid #e5e7eb;
}

.app-shell__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  font-weight: 600;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}

.app-shell__header :deep(.el-button) {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.app-shell__main {
  padding: 20px;
}
</style>
