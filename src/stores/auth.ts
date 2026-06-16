import { defineStore } from 'pinia';
import { authApi, type LoginRequest, type MenuTreeNode, type UserProfile } from '@/api/auth';
import {
  clearAccessToken,
  clearRefreshToken,
  readAccessToken,
  readRefreshToken,
  writeAccessToken,
  writeRefreshToken,
} from './auth-storage';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  menus: MenuTreeNode[];
  permissions: string[];
  bootstrapped: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: readAccessToken(),
    refreshToken: readRefreshToken(),
    user: null,
    menus: [],
    permissions: [],
    bootstrapped: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    displayName: (state) => state.user?.nickname || state.user?.username || '',
    visibleMenus: (state) => state.menus.filter((menu) => menu.visible !== false),
  },
  actions: {
    hasPermission(permission: string) {
      return this.permissions.includes(permission);
    },
    setSession(
      token: string,
      refreshToken: string | null,
      user: UserProfile,
      permissions: string[],
    ) {
      this.token = token;
      this.refreshToken = refreshToken;
      this.user = user;
      this.permissions = permissions;
      writeAccessToken(token);
      if (refreshToken) {
        writeRefreshToken(refreshToken);
      }
    },
    async login(payload: LoginRequest) {
      const response = await authApi.login(payload);
      this.setSession(
        response.accessToken,
        response.refreshToken,
        response.user,
        response.permissions,
      );
      await this.loadSession();
    },
    async refreshSession() {
      if (!this.refreshToken) {
        this.clearSession();
        return false;
      }

      const response = await authApi.refresh({ refreshToken: this.refreshToken });
      this.setSession(
        response.accessToken,
        response.refreshToken,
        response.user,
        response.permissions,
      );
      await this.loadSession();
      return true;
    },
    async loadSession() {
      if (!this.token) {
        this.bootstrapped = true;
        return;
      }

      try {
        const [user, menus, permissions] = await Promise.all([
          authApi.me(),
          authApi.menus(),
          authApi.permissions(),
        ]);
        this.user = user;
        this.menus = menus;
        this.permissions = permissions;
      } catch {
        // Token expired or backend unreachable — clear session so the router
        // guard redirects to login instead of leaving the user on a white screen.
        this.clearSession();
      } finally {
        this.bootstrapped = true;
      }
    },
    clearSession() {
      this.token = null;
      this.refreshToken = null;
      this.user = null;
      this.menus = [];
      this.permissions = [];
      this.bootstrapped = false;
      clearAccessToken();
      clearRefreshToken();
    },
    async logout() {
      try {
        if (this.token) {
          await authApi.logout();
        }
      } finally {
        this.clearSession();
      }
    },
  },
});
