<template>
  <div v-if="tabStore.tabs.length > 0" class="app-tab-nav">
    <div
      v-for="tab in tabStore.tabs"
      :key="tab.path"
      class="app-tab-nav__tab"
      :class="{ 'app-tab-nav__tab--active': tab.path === activePath }"
      @click="navigateTo(tab)"
      @contextmenu.prevent="showContextMenu($event, tab)"
    >
      <el-icon v-if="tab.path === '/'" class="app-tab-nav__home"><House /></el-icon>
      <span class="app-tab-nav__label">{{ tab.title }}</span>
      <span v-if="tab.closable" class="app-tab-nav__close" @click.stop="closeTab(tab)"
        >&times;</span
      >
    </div>

    <!-- Right-click context menu -->
    <Teleport to="body">
      <div
        v-if="contextMenuVisible"
        class="app-tab-nav__context-menu"
        :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
      >
        <div class="app-tab-nav__context-item" @click="closeCurrentTab">关闭当前</div>
        <div class="app-tab-nav__context-item" @click="closeOtherTabs">关闭其它</div>
        <div class="app-tab-nav__context-item" @click="closeAllTabs">关闭所有</div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { House } from '@element-plus/icons-vue';
import { useTabStore, type TabItem } from '@/stores/tabs';

const route = useRoute();
const router = useRouter();
const tabStore = useTabStore();

const activePath = computed(() => route.path);

// Track tabs from route changes
const stopWatch = await import('vue').then(({ watch }) =>
  watch(
    () => route.path,
    (path) => {
      if (route.meta.public) return;

      const title = (route.meta.title as string) || route.name?.toString() || path;
      tabStore.addTab({
        path,
        name: route.name?.toString() || path,
        title,
        closable: path !== '/',
      });
    },
    { immediate: true },
  ),
);

// Context menu state
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuTab = ref<TabItem | null>(null);

function showContextMenu(event: MouseEvent, tab: TabItem) {
  contextMenuTab.value = tab;
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  contextMenuVisible.value = true;
}

function hideContextMenu() {
  contextMenuVisible.value = false;
}

function navigateTo(tab: TabItem) {
  if (tab.path !== route.path) {
    router.push(tab.path);
  }
}

function closeTab(tab: TabItem) {
  const wasActive = tab.path === route.path;
  const tabs = tabStore.tabs;
  const index = tabs.findIndex((t) => t.path === tab.path);

  tabStore.removeTab(tab.path);

  // If closing the active tab, navigate to the nearest remaining tab
  if (wasActive && tabs.length > 0) {
    const newIndex = Math.min(index, tabs.length - 1);
    router.push(tabs[newIndex]!.path);
  }
}

function closeCurrentTab() {
  hideContextMenu();
  if (contextMenuTab.value) {
    closeTab(contextMenuTab.value);
  }
}

function closeOtherTabs() {
  hideContextMenu();
  if (!contextMenuTab.value) return;
  const keepPath = contextMenuTab.value.path;
  tabStore.removeOtherTabs(keepPath);
  // If current route was removed, navigate to the kept tab
  if (!tabStore.tabs.some((t) => t.path === route.path)) {
    router.push(keepPath);
  }
}

function closeAllTabs() {
  hideContextMenu();
  tabStore.removeAllTabs();
  // Navigate to the first remaining tab (dashboard)
  if (tabStore.tabs.length > 0) {
    router.push(tabStore.tabs[0]!.path);
  }
}

// Close context menu on click outside
function onDocumentClick() {
  if (contextMenuVisible.value) {
    hideContextMenu();
  }
}

import { onMounted } from 'vue';
onMounted(() => document.addEventListener('click', onDocumentClick));
onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick);
  stopWatch();
});
</script>

<style scoped>
.app-tab-nav {
  display: flex;
  gap: var(--qf-spacing-xs);
  height: var(--qf-layout-tabs-height);
  padding: 6px 20px;
  overflow: auto hidden;
  background: var(--qf-color-bg-surface);
  border-bottom: 1px solid var(--qf-color-border-soft);
}

.app-tab-nav__tab {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  flex: 0 0 auto;
  min-width: 86px;
  height: 32px;
  padding: 0 11px;
  color: var(--qf-color-text-secondary);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--qf-border-radius);
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
  transition:
    color 0.18s ease,
    background-color 0.18s ease,
    border-color 0.18s ease;
}

.app-tab-nav__tab:hover {
  color: var(--el-color-primary);
  background: var(--qf-color-primary-soft);
}

.app-tab-nav__tab--active {
  color: var(--el-color-primary);
  background: var(--qf-color-primary-soft);
  border-color: var(--el-color-primary-light-8);
  font-weight: 600;
}

.app-tab-nav__home {
  font-size: 14px;
}

.app-tab-nav__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  font-size: 12px;
  line-height: 1;
  color: var(--qf-color-text-secondary);
  border-radius: var(--qf-border-radius-round);
  transition: all 0.15s;
}

.app-tab-nav__close:hover {
  color: var(--qf-color-on-primary);
  background: var(--el-color-danger);
}

.app-tab-nav__context-menu {
  position: fixed;
  z-index: 3000;
  min-width: 120px;
  padding: 4px 0;
  background: var(--qf-color-bg-surface);
  border: 1px solid var(--qf-color-border-soft);
  border-radius: var(--qf-border-radius-lg);
  box-shadow: var(--qf-shadow-popover);
}

.app-tab-nav__context-item {
  padding: 8px 14px;
  color: var(--qf-color-text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.1s;
}

.app-tab-nav__context-item:hover {
  background: var(--el-fill-color-light);
}
</style>
