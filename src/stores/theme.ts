import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

/** 三档主题：light / dark 是显式选择，system 跟随操作系统 `prefers-color-scheme`。 */
export const THEME_MODES = ['light', 'dark', 'system'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

const STORAGE_KEY = 'qf-theme';
const DEFAULT_MODE: ThemeMode = 'system';
const DARK_QUERY = '(prefers-color-scheme: dark)';

function readStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (THEME_MODES as readonly string[]).includes(stored)) {
      return stored as ThemeMode;
    }
  } catch {
    /* ignore SSR / 隐私模式 */
  }
  return DEFAULT_MODE;
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(DARK_QUERY).matches
    : false;
}

/**
 * 单一主题真源 —— 切换时同时联动：
 *   ①store ②`<html class="dark">`（同时驱动 Element Plus 暗色变量与 --qf-* 设计令牌）③localStorage
 * 任何业务代码读主题都走 store，禁止直接读 localStorage / classList。
 * index.html 内联脚本只负责首屏防闪烁（FOUC），store 启动后接管，逻辑与之一致。
 *
 * `systemDark` 是 matchMedia 的可观察镜像：`isDark` 依赖它，system 模式下 OS 切换能实时驱动
 * `<html>` 类名与切换器图标。matchMedia.matches 本身非响应式，必须由监听器写回 ref。
 */
export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>(readStoredMode());
  const systemDark = ref(systemPrefersDark());
  const isDark = computed(() => (mode.value === 'system' ? systemDark.value : mode.value === 'dark'));

  applyTheme();
  watchSystemPreference();

  function setMode(next: ThemeMode) {
    if (!(THEME_MODES as readonly string[]).includes(next)) {
      next = DEFAULT_MODE;
    }
    mode.value = next;
    applyTheme();
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore SSR / 隐私模式 */
    }
  }

  function applyTheme() {
    if (typeof document === 'undefined') {
      return;
    }
    document.documentElement.classList.toggle('dark', isDark.value);
  }

  // OS 主题变化时同步 systemDark；system 模式下重新应用主题，显式 light/dark 不受影响。
  function watchSystemPreference() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    window.matchMedia(DARK_QUERY).addEventListener('change', (event) => {
      systemDark.value = event.matches;
      if (mode.value === 'system') {
        applyTheme();
      }
    });
  }

  return {
    mode,
    isDark,
    setMode,
  };
});
