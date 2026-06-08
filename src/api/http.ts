import axios from 'axios';
import { ElMessage } from 'element-plus';
import { clearAccessToken, readAccessToken } from '@/stores/auth-storage';

export interface ApiResult<T> {
  success: boolean;
  code: string;
  message: string;
  data: T;
  timestamp: string;
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  const token = readAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (status === 401) {
      clearAccessToken();
      if (window.location.pathname !== '/login') {
        const redirect = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.assign(`/login?redirect=${redirect}`);
      }
    } else if (status === 403) {
      ElMessage.error(message || '没有权限执行该操作');
    } else if (status >= 500) {
      ElMessage.error(message || '服务暂时不可用');
    }

    return Promise.reject(error);
  },
);
