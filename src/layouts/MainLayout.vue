<template>
  <el-container class="app-shell">
    <el-aside class="app-shell__aside" :width="isCollapsed ? '64px' : '232px'">
      <div class="app-shell__brand">
        <span v-if="!isCollapsed" class="app-shell__brand-text">{{ t('layout.brand') }}</span>
        <span v-else class="app-shell__brand-icon">QF</span>
      </div>
      <div v-if="!isCollapsed" class="app-shell__menu-search">
        <el-input
          v-model="menuKeyword"
          clearable
          :placeholder="t('layout.sidebar.searchMenu')"
          size="small"
        />
      </div>
      <el-menu router :default-active="activeMenu" :collapse="isCollapsed">
        <MenuNode v-for="item in filteredMenus" :key="item.id" :menu="item" />
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="app-shell__header">
        <div class="app-shell__header-left">
          <el-icon class="app-shell__collapse-btn" @click="isCollapsed = !isCollapsed">
            <Fold v-if="!isCollapsed" />
            <Expand v-else />
          </el-icon>
          <AppBreadcrumb />
        </div>
        <div class="app-shell__header-right">
          <ThemeSwitcher />
          <LocaleSwitcher />
          <el-dropdown trigger="click" @command="handleCommand" @visible-change="handleNotificationDropdown">
            <el-badge :value="notificationStore.unreadCount" :hidden="!notificationStore.hasUnread">
              <el-button text :title="t('layout.notifications.title')">
                <el-icon><Bell /></el-icon>
              </el-button>
            </el-badge>
            <template #dropdown>
              <el-dropdown-menu class="app-shell__notifications">
                <el-dropdown-item disabled>
                  {{ notificationStore.connected ? t('layout.notifications.connected') : t('layout.notifications.disconnected') }}
                </el-dropdown-item>
                <el-dropdown-item v-if="notificationStore.notices.length === 0" disabled>
                  {{ t('layout.notifications.empty') }}
                </el-dropdown-item>
                <el-dropdown-item
                  v-for="notice in notificationStore.notices"
                  :key="notice.eventId"
                  class="app-shell__notification-item"
                  disabled
                >
                  <span>{{ notificationActionText(notice.action, notice.title) }}</span>
                </el-dropdown-item>
                <el-dropdown-item v-if="authStore.hasPermission('system:notice:view')" command="notices">
                  {{ t('layout.notifications.viewAll') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown trigger="click" @command="handleCommand">
            <el-button text>
              <el-icon><User /></el-icon>
              <span>{{ authStore.displayName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">
                  {{ t('layout.topbar.logout') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <AppTabNav />
      <div v-if="isGlobalLoading" class="app-shell__loading-bar" />
      <el-main class="app-shell__main">
        <RouterView v-slot="{ Component }">
          <KeepAlive :include="tabStore.cachedNames">
            <component :is="Component" :key="$route.path" />
          </KeepAlive>
        </RouterView>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onBeforeUnmount, ref, watch } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  ArrowDown,
  Bell,
  Briefcase,
  Checked,
  Collection,
  Connection,
  Document,
  EditPen,
  Expand,
  Fold,
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
import { globalLoading } from '@/stores/global-loading';
import { useNotificationStore, type NoticeNotification } from '@/stores/notifications';
import { useTabStore } from '@/stores/tabs';
import AppBreadcrumb from '@/components/AppBreadcrumb.vue';
import AppTabNav from '@/components/AppTabNav.vue';
import LocaleSwitcher from '@/shared/LocaleSwitcher.vue';
import ThemeSwitcher from '@/shared/ThemeSwitcher.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const tabStore = useTabStore();
const activeMenu = computed(() => route.path);
const isCollapsed = ref(false);
const menuKeyword = ref('');
const isGlobalLoading = globalLoading.loading;

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

const filteredMenus = computed(() => {
  const keyword = menuKeyword.value.trim().toLowerCase();
  if (!keyword) {
    return authStore.visibleMenus;
  }
  return filterMenus(authStore.visibleMenus, keyword);
});

function filterMenus(menus: MenuTreeNode[], keyword: string): MenuTreeNode[] {
  return menus
    .map((menu) => {
      const children = filterMenus(menu.children ?? [], keyword);
      const matched =
        menu.title.toLowerCase().includes(keyword) ||
        menu.routePath.toLowerCase().includes(keyword);
      if (!matched && children.length === 0) {
        return null;
      }
      return { ...menu, children };
    })
    .filter((menu): menu is MenuTreeNode => menu !== null);
}

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

watch(
  () => authStore.token,
  (token) => {
    if (token) {
      notificationStore.connect();
    } else {
      notificationStore.disconnect();
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  notificationStore.disconnect();
});

function handleNotificationDropdown(visible: boolean) {
  if (visible) {
    notificationStore.markAllRead();
  }
}

function notificationActionText(action: NoticeNotification['action'], title: string) {
  return t(`layout.notifications.actions.${action.toLowerCase()}`, { title });
}

async function handleCommand(command: string) {
  if (command === 'notices') {
    await router.push('/system/notices');
    return;
  }
  if (command === 'logout') {
    notificationStore.disconnect();
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
  border-right: 1px solid var(--qf-border-color);
  background: var(--qf-color-bg-surface);
  transition: width 0.2s;
  overflow: hidden;
}

.app-shell__brand {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 56px;
  font-size: var(--qf-font-size-subtitle);
  font-weight: var(--qf-font-weight-heading);
  border-bottom: 1px solid var(--qf-border-color);
  white-space: nowrap;
  overflow: hidden;
}

.app-shell__brand-text {
  padding: 0 20px;
}

.app-shell__brand-icon {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-color-primary);
}

.app-shell__menu-search {
  padding: 10px 12px;
  border-bottom: 1px solid var(--qf-border-color);
}

.app-shell__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  font-weight: var(--qf-font-weight-semibold);
  background: var(--qf-color-bg-surface);
  border-bottom: 1px solid var(--qf-border-color);
}

.app-shell__header-left {
  display: flex;
  gap: var(--qf-spacing-md);
  align-items: center;
}

.app-shell__header-right {
  display: flex;
  gap: var(--qf-spacing-sm);
  align-items: center;
}

.app-shell__collapse-btn {
  font-size: 18px;
  cursor: pointer;
  transition: color 0.15s;
}

.app-shell__collapse-btn:hover {
  color: var(--el-color-primary);
}

.app-shell__header :deep(.el-button) {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.app-shell__notification-item {
  max-width: 320px;
}

.app-shell__notification-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-shell__main {
  padding: 20px;
}

.app-shell__loading-bar {
  height: 2px;
  overflow: hidden;
  background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-success));
  animation: qf-loading-slide 1.1s ease-in-out infinite alternate;
}

@keyframes qf-loading-slide {
  from {
    transform: translateX(-35%);
  }

  to {
    transform: translateX(35%);
  }
}
</style>
