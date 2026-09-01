import { createI18n } from 'vue-i18n';
import zhCN from './zh-CN';
import enUS from './en-US';

/**
 * Supported locale codes. Aligned with backend platform-web `LocaleResolver` —
 * which clamps unrecognized Accept-Language values to zh-CN.
 */
export const SUPPORTED_LOCALES = ['zh-CN', 'en-US'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'zh-CN';

export function resolveInitialLocale(): AppLocale {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('locale') : null;
  if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) {
    return stored as AppLocale;
  }
  // Keep the first-run experience deterministic across IDE, CI and browsers.
  // Users can switch to English explicitly and the choice is persisted above.
  return DEFAULT_LOCALE;
}

// legacy:false → composition mode 强制开启；globalInjection:true 让模板里可以直接写 $t('xxx')。
// 在 <script setup> 内推荐 useI18n()；模板里直接用 $t 可以减少 import 噪声。
export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: resolveInitialLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
  // 关掉 missing key 警告 —— v1 文案仍在不断补 key，控制台噪声没有信号价值。
  missingWarn: false,
  fallbackWarn: false,
});

/**
 * Programmatic access from non-component layers (axios interceptor, store).
 * Inside .vue files prefer `useI18n()` so reactivity 走 hook 路径。
 */
export function currentLocale(): AppLocale {
  return i18n.global.locale.value as AppLocale;
}

export function setI18nLocale(locale: AppLocale) {
  i18n.global.locale.value = locale;
}
