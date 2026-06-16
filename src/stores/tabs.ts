import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export interface TabItem {
  path: string;
  name: string;
  title: string;
  closable: boolean;
}

export const useTabStore = defineStore('tabs', () => {
  const tabs = ref<TabItem[]>([]);

  /** Component names for KeepAlive include — matches route names. */
  const cachedNames = computed(() => tabs.value.map((t) => t.name).filter(Boolean));

  function addTab(tab: TabItem) {
    if (!tabs.value.some((t) => t.path === tab.path)) {
      tabs.value.push(tab);
    }
  }

  function removeTab(path: string) {
    const index = tabs.value.findIndex((t) => t.path === path);
    if (index !== -1) {
      tabs.value.splice(index, 1);
    }
  }

  function removeOtherTabs(keepPath: string) {
    tabs.value = tabs.value.filter((t) => t.path === keepPath || !t.closable);
  }

  function removeAllTabs() {
    tabs.value = tabs.value.filter((t) => !t.closable);
  }

  return { tabs, cachedNames, addTab, removeTab, removeOtherTabs, removeAllTabs };
});
