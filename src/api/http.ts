import axios from 'axios';
import { ElMessage } from 'element-plus';
import { globalLoading } from '@/stores/global-loading';
import { clearAccessToken, readAccessToken } from '@/stores/auth-storage';
import { currentLocale, i18n } from '@/locales';

export interface ApiResult<T> {
  success: boolean;
  code: string;
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  code: string;
  message: string;
  timestamp?: string;
  traceId?: string;
  requestId?: string;
}

export interface PageResponse<T> {
  records: T[];
  total: number;
  page: number;
  size: number;
}

export function unwrap<T>(response: { data: ApiResult<T> }) {
  if (!response.data.success) {
    throw new Error(response.data.message || response.data.code);
  }
  return response.data.data;
}

function createRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `qf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  globalLoading.start();
  const token = readAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const requestId = String(config.headers['X-Request-Id'] ?? createRequestId());
  config.headers['X-Request-Id'] = requestId;
  config.headers['X-Trace-Id'] = config.headers['X-Trace-Id'] ?? requestId;
  // Accept-Language follows the user's current locale so backend MessageSource
  // renders error.message in zh-CN / en-US accordingly. The default value is
  // installed by useLocaleStore() on boot; this fallback covers requests that
  // fire before pinia is fully ready (router guards on initial navigation).
  if (!config.headers['Accept-Language']) {
    config.headers['Accept-Language'] = currentLocale();
  }
  return config;
});

http.interceptors.response.use(
  (response) => {
    globalLoading.finish();
    return response;
  },
  (error) => {
    globalLoading.finish();
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (status === 401) {
      clearAccessToken();
      if (window.location.pathname !== '/login') {
        const redirect = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.assign(`/login?redirect=${redirect}`);
      }
      // On /login, propagate the server's error message so LoginView's
      // catch block renders it verbatim rather than the generic Axios message.
      const serverMessage = error.response?.data?.message;
      if (serverMessage) {
        error.message = serverMessage;
      }
    } else if (status === 403) {
      ElMessage.error(message || i18n.global.t('common.toast.forbidden'));
    } else if (status >= 500) {
      ElMessage.error(message || i18n.global.t('common.toast.networkError'));
    }

    return Promise.reject(error);
  },
);
