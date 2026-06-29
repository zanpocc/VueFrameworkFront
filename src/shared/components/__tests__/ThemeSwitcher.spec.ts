import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ElementPlus from 'element-plus';
import { i18n } from '@/locales';
import ThemeSwitcher from '../../ThemeSwitcher.vue';
import { useThemeStore } from '@/stores/theme';

/** jsdom lacks matchMedia — provide a stub so the store can read prefers-color-scheme. */
function installMatchMedia(dark: boolean) {
  const mql = {
    matches: dark,
    media: '(prefers-color-scheme: dark)',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia;
}

function mountSwitcher() {
  return mount(ThemeSwitcher, {
    global: { plugins: [ElementPlus, i18n] },
    attachTo: document.body,
  });
}

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    installMatchMedia(false);
    // jsdom boots with navigator.language='en-US'; assert labels in zh-CN deterministically.
    i18n.global.locale.value = 'zh-CN';
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('renders the three theme options with i18n labels', () => {
    mountSwitcher();

    const items = document.querySelectorAll('.el-dropdown-menu__item');
    expect(items.length).toBe(3);
    const labels = Array.from(items).map((el) => el.textContent ?? '');
    expect(labels.some((t) => t.includes('浅色'))).toBe(true);
    expect(labels.some((t) => t.includes('深色'))).toBe(true);
    expect(labels.some((t) => t.includes('跟随系统'))).toBe(true);
  });

  it('disables the option matching the current mode', () => {
    const store = useThemeStore();
    store.setMode('dark');
    mountSwitcher();

    const items = document.querySelectorAll('.el-dropdown-menu__item');
    const darkItem = Array.from(items).find((el) => el.textContent?.includes('深色'));
    expect(darkItem?.classList.contains('is-disabled')).toBe(true);
  });

  it('switches the theme when a dropdown command fires', async () => {
    const wrapper = mountSwitcher();
    const store = useThemeStore();
    expect(store.mode).toBe('system');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    const dropdown = wrapper.findComponent({ name: 'ElDropdown' });
    dropdown.vm.$emit('command', 'dark');
    await wrapper.vm.$nextTick();

    expect(store.mode).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
