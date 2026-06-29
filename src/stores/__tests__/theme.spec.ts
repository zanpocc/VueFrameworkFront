import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useThemeStore } from '../theme';

/**
 * Controllable matchMedia mock — jsdom doesn't implement it. `setSystemDark`
 * flips the prefers-color-scheme result and fires the change listener so we can
 * exercise the system-follow path deterministically.
 */
function installMatchMedia(initialDark: boolean) {
  let dark = initialDark;
  const listeners: Array<(e: { matches: boolean }) => void> = [];
  const mql = {
    get matches() {
      return dark;
    },
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => listeners.push(cb),
    removeEventListener: vi.fn(),
  };
  window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia;
  return {
    setSystemDark(next: boolean) {
      dark = next;
      listeners.forEach((cb) => cb({ matches: next }));
    },
  };
}

describe('useThemeStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to system mode and follows the OS preference when nothing is stored', () => {
    installMatchMedia(true);

    const store = useThemeStore();

    expect(store.mode).toBe('system');
    expect(store.isDark).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('setMode("dark") adds the dark class and persists to localStorage', () => {
    installMatchMedia(false);
    const store = useThemeStore();

    store.setMode('dark');

    expect(store.isDark).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('qf-theme')).toBe('dark');
  });

  it('setMode("light") removes the dark class regardless of OS preference', () => {
    installMatchMedia(true);
    const store = useThemeStore();
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    store.setMode('light');

    expect(store.isDark).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('qf-theme')).toBe('light');
  });

  it('reads the stored mode on init', () => {
    installMatchMedia(false);
    localStorage.setItem('qf-theme', 'dark');

    const store = useThemeStore();

    expect(store.mode).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('falls back to system mode for an invalid stored value', () => {
    installMatchMedia(false);
    localStorage.setItem('qf-theme', 'neon');

    const store = useThemeStore();

    expect(store.mode).toBe('system');
  });

  it('reacts to OS preference changes only while in system mode', () => {
    const media = installMatchMedia(false);
    const store = useThemeStore();
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // system mode → follows the OS flip.
    media.setSystemDark(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // explicit light → OS flips are ignored.
    store.setMode('light');
    media.setSystemDark(false);
    media.setSystemDark(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
