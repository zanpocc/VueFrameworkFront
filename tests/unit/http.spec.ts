import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { AxiosAdapter } from 'axios';
import { http } from '@/api/http';
import { globalLoading } from '@/stores/global-loading';
import { readAccessToken, writeAccessToken } from '@/stores/auth-storage';

const elMessageError = vi.hoisted(() => vi.fn());

vi.mock('element-plus', async (importOriginal) => ({
  ...(await importOriginal<typeof import('element-plus')>()),
  ElMessage: {
    error: elMessageError,
  },
}));

describe('http client', () => {
  beforeEach(() => {
    window.localStorage.clear();
    globalLoading.reset();
  });

  it('injects bearer token into requests', async () => {
    writeAccessToken('token-1');

    const adapter: AxiosAdapter = async (config) => {
      return {
        data: { ok: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    const response = await http.get('/probe', { adapter });

    expect(response.config.headers.Authorization).toBe('Bearer token-1');
  });

  it('injects request and trace headers into requests', async () => {
    const adapter: AxiosAdapter = async (config) => {
      return {
        data: { ok: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    const response = await http.get('/probe', { adapter });

    expect(response.config.headers['X-Request-Id']).toEqual(expect.any(String));
    expect(response.config.headers['X-Trace-Id']).toBe(response.config.headers['X-Request-Id']);
    expect(globalLoading.loading.value).toBe(false);
  });

  it('clears token after 401 response', async () => {
    writeAccessToken('expired-token');
    window.history.pushState({}, '', '/login');

    const adapter: AxiosAdapter = async (config) =>
      Promise.reject({
        config,
        response: {
          status: 401,
          data: { message: '登录已过期' },
          headers: {},
          config,
        },
      });

    await expect(http.get('/auth/me', { adapter })).rejects.toMatchObject({
      response: {
        status: 401,
      },
    });

    expect(readAccessToken()).toBeNull();
  });

  it('shows permission message after 403 response', async () => {
    const adapter: AxiosAdapter = async (config) =>
      Promise.reject({
        config,
        response: {
          status: 403,
          data: { message: '没有用户管理权限' },
          headers: {},
          config,
        },
      });

    await expect(http.get('/iam/users', { adapter })).rejects.toMatchObject({
      response: {
        status: 403,
      },
    });

    expect(elMessageError).toHaveBeenCalledWith('没有用户管理权限');
  });
});
