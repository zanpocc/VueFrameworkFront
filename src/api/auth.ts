import { http, type ApiResult } from './http';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserProfile {
  id: number;
  username: string;
  nickname: string;
  email: string | null;
}

export interface MenuTreeNode {
  id: number;
  parentId: number | null;
  title: string;
  routeName: string;
  routePath: string;
  component: string | null;
  icon: string | null;
  permissionCode: string | null;
  visible: boolean;
  children: MenuTreeNode[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserProfile;
  permissions: string[];
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutResponse {
  invalidated: boolean;
}

function unwrap<T>(response: { data: ApiResult<T> }) {
  if (!response.data.success) {
    throw new Error(response.data.message || response.data.code);
  }
  return response.data.data;
}

export const authApi = {
  login(payload: LoginRequest) {
    return http.post<ApiResult<LoginResponse>>('/auth/login', payload).then(unwrap);
  },
  refresh(payload: RefreshTokenRequest) {
    return http.post<ApiResult<LoginResponse>>('/auth/refresh', payload).then(unwrap);
  },
  logout() {
    return http.post<ApiResult<LogoutResponse>>('/auth/logout').then(unwrap);
  },
  me() {
    return http.get<ApiResult<UserProfile>>('/auth/me').then(unwrap);
  },
  menus() {
    return http.get<ApiResult<MenuTreeNode[]>>('/auth/menus').then(unwrap);
  },
  permissions() {
    return http.get<ApiResult<string[]>>('/auth/permissions').then(unwrap);
  },
};
