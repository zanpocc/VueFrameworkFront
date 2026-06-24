import { defineStore } from 'pinia';
import { ref } from 'vue';
import zhCnElement from 'element-plus/dist/locale/zh-cn.mjs';
import enElement from 'element-plus/dist/locale/en.mjs';
import type { Language } from 'element-plus/es/locale';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  currentLocale,
  setI18nLocale,
  type AppLocale,
} from '@/locales';
import { http } from '@/api/http';

const ELEMENT_LOCALE_MAP: Record<AppLocale, Language> = {
  'zh-CN': zhCnElement,
  'en-US': enElement,
};

const STORAGE_KEY = 'locale';

/**
 * 单一 locale 真源 —— 切换时同时联动：
 *   ①store ②vue-i18n.global.locale ③Element Plus locale ④axios Accept-Language ⑤localStorage
 * 任何业务代码读 locale 都走 store，禁止直接读 localStorage / i18n.global.locale。
 */
export const useLocaleStore = defineStore('locale', () => {
  const locale = ref<AppLocale>(currentLocale());
  const elementLocale = ref<Language>(ELEMENT_LOCALE_MAP[locale.value]);

  applyAxiosHeader(locale.value);

  function setLocale(next: AppLocale) {
    if (!(SUPPORTED_LOCALES as readonly string[]).includes(next)) {
      next = DEFAULT_LOCALE;
    }
    if (next === locale.value) {
      return;
    }
    locale.value = next;
    elementLocale.value = ELEMENT_LOCALE_MAP[next];
    setI18nLocale(next);
    applyAxiosHeader(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore SSR / 隐私模式 */
    }
  }

  return {
    locale,
    elementLocale,
    setLocale,
  };
});

function applyAxiosHeader(locale: AppLocale) {
  http.defaults.headers.common['Accept-Language'] = locale;
}
