<template>
  <el-container
    class="app-shell"
    :class="{ 'app-shell--mobile': isMobile, 'app-shell--sidebar-collapsed': isCollapsed }"
  >
    <div v-if="isMobile && !isCollapsed" class="app-shell__scrim" @click="isCollapsed = true" />
    <el-aside
      class="app-shell__aside"
      :class="{ 'is-mobile-open': isMobile && !isCollapsed }"
      :width="isCollapsed ? '64px' : '224px'"
    >
      <div class="app-shell__brand">
        <span class="app-shell__brand-mark">Q</span>
        <span v-if="!isCollapsed" class="app-shell__brand-copy">
          <strong>{{ t('layout.brand') }}</strong>
          <small>Platform Console</small>
        </span>
      </div>
      <div v-if="!isCollapsed" class="app-shell__menu-search">
        <el-input
          v-model="menuKeyword"
          clearable
          :placeholder="t('layout.sidebar.searchMenu')"
          size="small"
        />
      </div>
      <el-menu
        class="app-shell__menu"
        router
        :default-active="activeMenu"
        :collapse="isCollapsed"
        @select="handleMenuSelect"
      >
        <MenuNode v-for="item in filteredMenus" :key="item.id" :menu="item" />
      </el-menu>
    </el-aside>
    <el-container class="app-shell__body">
      <el-header class="app-shell__header">
        <div class="app-shell__header-left">
          <el-button
            class="app-shell__collapse-btn"
            text
            circle
            :title="isCollapsed ? '展开菜单' : '收起菜单'"
            @click="isCollapsed = !isCollapsed"
          >
            <Fold v-if="!isCollapsed" />
            <Expand v-else />
          </el-button>
          <AppBreadcrumb />
        </div>
        <div class="app-shell__header-right">
          <ThemeSwitcher />
          <LocaleSwitcher />
          <el-dropdown
            trigger="click"
            @command="handleCommand"
            @visible-change="handleNotificationDropdown"
          >
            <el-badge :value="notificationStore.unreadCount" :hidden="!notificationStore.hasUnread">
              <el-button text :title="t('layout.notifications.title')">
                <el-icon><Bell /></el-icon>
              </el-button>
            </el-badge>
            <template #dropdown>
              <el-dropdown-menu class="app-shell__notifications">
                <el-dropdown-item disabled>
                  {{
                    notificationStore.connected
                      ? t('layout.notifications.connected')
                      : t('layout.notifications.disconnected')
                  }}
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
                <el-dropdown-item
                  v-if="authStore.hasPermission('system:notice:view')"
                  command="notices"
                >
                  {{ t('layout.notifications.viewAll') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown trigger="click" @command="handleCommand">
            <el-button class="app-shell__user-button" text>
              <span class="app-shell__user-avatar">{{ userInitial }}</span>
              <span class="app-shell__user-name">{{ authStore.displayName }}</span>
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
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from 'vue';
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
const isMobile = ref(false);
const menuKeyword = ref('');
const isGlobalLoading = globalLoading.loading;
const userInitial = computed(() => authStore.displayName.trim().charAt(0).toUpperCase() || 'Q');

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

function syncViewport() {
  const mobile = window.innerWidth <= 900;
  if (mobile && !isMobile.value) {
    isCollapsed.value = true;
  }
  isMobile.value = mobile;
}

function handleMenuSelect() {
  if (isMobile.value) {
    isCollapsed.value = true;
  }
}

onMounted(() => {
  syncViewport();
  window.addEventListener('resize', syncViewport);
});

onBeforeUnmount(() => {
  notificationStore.disconnect();
  window.removeEventListener('resize', syncViewport);
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
  background: var(--qf-color-bg-page);
}

.app-shell__aside {
  z-index: 100;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--qf-color-bg-surface);
  border-right: 1px solid var(--qf-color-border-soft);
  transition:
    width 0.22s ease,
    transform 0.22s ease;
}

.app-shell__brand {
  display: flex;
  gap: 11px;
  align-items: center;
  height: var(--qf-layout-header-height);
  padding: 0 17px;
  overflow: hidden;
  white-space: nowrap;
  border-bottom: 1px solid var(--qf-color-border-soft);
}

.app-shell__brand-mark {
  display: inline-flex;
  flex: 0 0 30px;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  color: #fff;
  background: linear-gradient(135deg, #2563eb 0%, #60a5fa 100%);
  border-radius: 9px;
  box-shadow: 0 5px 12px rgb(37 99 235 / 25%);
  font-size: 17px;
  font-weight: 800;
}

.app-shell__brand-copy {
  display: grid;
  gap: 1px;
  min-width: 0;
}

.app-shell__brand-copy strong {
  overflow: hidden;
  color: var(--qf-color-text-primary);
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
}

.app-shell__brand-copy small {
  color: var(--qf-color-text-secondary);
  font-size: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.app-shell__menu-search {
  padding: 12px 12px 6px;
}

.app-shell__menu-search :deep(.el-input__wrapper) {
  background: var(--qf-color-bg-muted);
  box-shadow: none;
}

.app-shell__menu {
  padding: 8px 8px 16px;
  border-right: 0;
  background: transparent;
}

.app-shell__menu :deep(.el-menu-item),
.app-shell__menu :deep(.el-sub-menu__title) {
  height: 40px;
  margin: 3px 0;
  padding: 0 12px !important;
  overflow: hidden;
  color: var(--qf-color-text-secondary);
  border-radius: 8px;
  line-height: 40px;
  transition:
    color 0.18s ease,
    background-color 0.18s ease;
}

.app-shell__menu :deep(.el-menu-item .el-icon),
.app-shell__menu :deep(.el-sub-menu__title .el-icon) {
  margin-right: 10px;
  color: currentcolor;
  font-size: 16px;
}

.app-shell__menu :deep(.el-menu-item:hover),
.app-shell__menu :deep(.el-sub-menu__title:hover) {
  color: var(--el-color-primary);
  background: var(--qf-color-primary-soft);
}

.app-shell__menu :deep(.el-menu-item.is-active) {
  position: relative;
  color: var(--el-color-primary);
  background: var(--qf-color-primary-soft);
  font-weight: 600;
}

.app-shell__menu :deep(.el-menu-item.is-active::before) {
  position: absolute;
  top: 9px;
  bottom: 9px;
  left: 0;
  width: 3px;
  background: var(--el-color-primary);
  border-radius: 0 3px 3px 0;
  content: '';
}

.app-shell__menu :deep(.el-sub-menu .el-menu) {
  background: transparent;
}

.app-shell__menu :deep(.el-sub-menu .el-menu-item) {
  min-width: 0;
  padding-left: 40px !important;
}

.app-shell__body {
  min-width: 0;
}

.app-shell__header {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--qf-layout-header-height);
  padding: 0 20px;
  background: var(--qf-color-bg-surface);
  border-bottom: 1px solid var(--qf-color-border-soft);
}

.app-shell__header-left,
.app-shell__header-right {
  display: flex;
  align-items: center;
}

.app-shell__header-left {
  gap: 14px;
  min-width: 0;
}

.app-shell__header-right {
  gap: 2px;
  flex-shrink: 0;
}

.app-shell__collapse-btn {
  width: 34px;
  height: 34px;
  color: var(--qf-color-text-secondary);
  font-size: 17px;
}

.app-shell__collapse-btn:hover {
  color: var(--el-color-primary);
  background: var(--qf-color-primary-soft);
}

.app-shell__header :deep(.el-button) {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.app-shell__header-right :deep(.el-button.is-text) {
  color: var(--qf-color-text-secondary);
}

.app-shell__header-right :deep(.el-button.is-text:hover) {
  color: var(--el-color-primary);
  background: var(--qf-color-primary-soft);
}

.app-shell__user-button {
  padding-right: 4px;
  padding-left: 8px;
}

.app-shell__user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  color: #fff;
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
}

.app-shell__user-name {
  max-width: 120px;
  overflow: hidden;
  color: var(--qf-color-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
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
  min-width: 0;
  min-height: calc(100vh - var(--qf-layout-header-height) - var(--qf-layout-tabs-height));
  padding: 18px 20px 24px;
  overflow: auto;
  background: var(--qf-color-bg-page);
}

.app-shell__loading-bar {
  height: 2px;
  overflow: hidden;
  background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-success));
  animation: qf-loading-slide 1.1s ease-in-out infinite alternate;
}

.app-shell__scrim {
  display: none;
}

@keyframes qf-loading-slide {
  from {
    transform: translateX(-35%);
  }

  to {
    transform: translateX(35%);
  }
}

@media (width <= 900px) {
  .app-shell--mobile .app-shell__aside {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    width: var(--qf-layout-sidebar-width) !important;
    transform: translateX(-100%);
    box-shadow: 12px 0 32px rgb(15 23 42 / 15%);
  }

  .app-shell--mobile .app-shell__aside.is-mobile-open {
    transform: translateX(0);
  }

  .app-shell--mobile .app-shell__scrim {
    position: fixed;
    z-index: 90;
    inset: 0;
    display: block;
    background: rgb(15 23 42 / 45%);
  }

  .app-shell__header {
    padding: 0 14px;
  }

  .app-shell__main {
    padding: 14px;
  }

  .app-shell__user-name {
    display: none;
  }
}
</style>
