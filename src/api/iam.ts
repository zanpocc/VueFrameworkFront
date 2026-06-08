import { http, type ApiResult } from './http';

export interface SysUser {
  id: number;
  deptId: number | null;
  username: string;
  nickname: string;
  email: string | null;
  mobile: string | null;
  status: string;
  roleIds: number[];
}

export interface UserCommand {
  deptId: number | null;
  username: string;
  password?: string;
  nickname: string;
  email?: string;
  mobile?: string;
  status: string;
  roleIds: number[];
}

export interface SysDept {
  id: number;
  parentId: number;
  deptName: string;
  sortOrder: number;
  status: string;
}

export interface DeptCommand {
  parentId: number;
  deptName: string;
  sortOrder: number;
  status: string;
}

export interface SysRole {
  id: number;
  roleCode: string;
  roleName: string;
  sortOrder: number;
  status: string;
}

export interface SysPost {
  id: number;
  postCode: string;
  postName: string;
  sortOrder: number;
  status: string;
}

export interface PostCommand {
  postCode: string;
  postName: string;
  sortOrder: number;
  status: string;
}

export interface RoleDataScope {
  id?: number;
  roleId?: number;
  scopeType: string;
  scopeValue: string;
}

export interface SysMenu {
  id: number;
  parentId: number;
  menuType: string;
  title: string;
  routeName: string | null;
  routePath: string | null;
  component: string | null;
  icon: string | null;
  permissionCode: string | null;
  visible: boolean;
  sortOrder: number;
  status: string;
}

export interface MenuCommand {
  parentId: number;
  menuType: string;
  title: string;
  routeName?: string;
  routePath?: string;
  component?: string;
  icon?: string;
  permissionCode?: string;
  visible: boolean;
  sortOrder: number;
  status: string;
}

export interface SysPermission {
  id: number;
  permissionCode: string;
  permissionName: string;
  resourceType: string;
  status: string;
}

function unwrap<T>(response: { data: ApiResult<T> }) {
  if (!response.data.success) {
    throw new Error(response.data.message || response.data.code);
  }
  return response.data.data;
}

export const iamApi = {
  users(keyword = '') {
    return http.get<ApiResult<SysUser[]>>('/iam/users', { params: { keyword } }).then(unwrap);
  },
  user(id: number) {
    return http.get<ApiResult<SysUser>>(`/iam/users/${id}`).then(unwrap);
  },
  createUser(payload: UserCommand) {
    return http.post<ApiResult<SysUser>>('/iam/users', payload).then(unwrap);
  },
  updateUser(id: number, payload: UserCommand) {
    return http.put<ApiResult<SysUser>>(`/iam/users/${id}`, payload).then(unwrap);
  },
  updateUserStatus(id: number, status: string) {
    return http
      .patch<ApiResult<SysUser>>(`/iam/users/${id}/status`, null, { params: { status } })
      .then(unwrap);
  },
  resetPassword(id: number, password: string) {
    return http.put<ApiResult<void>>(`/iam/users/${id}/password`, { password }).then(unwrap);
  },
  deleteUser(id: number) {
    return http.delete<ApiResult<void>>(`/iam/users/${id}`).then(unwrap);
  },
  depts() {
    return http.get<ApiResult<SysDept[]>>('/iam/depts').then(unwrap);
  },
  createDept(payload: DeptCommand) {
    return http.post<ApiResult<SysDept>>('/iam/depts', payload).then(unwrap);
  },
  updateDept(id: number, payload: DeptCommand) {
    return http.put<ApiResult<SysDept>>(`/iam/depts/${id}`, payload).then(unwrap);
  },
  deleteDept(id: number) {
    return http.delete<ApiResult<void>>(`/iam/depts/${id}`).then(unwrap);
  },
  roles() {
    return http.get<ApiResult<SysRole[]>>('/iam/roles').then(unwrap);
  },
  role(id: number) {
    return http.get<ApiResult<SysRole>>(`/iam/roles/${id}`).then(unwrap);
  },
  createRole(payload: Omit<SysRole, 'id'>) {
    return http.post<ApiResult<SysRole>>('/iam/roles', payload).then(unwrap);
  },
  updateRole(id: number, payload: Omit<SysRole, 'id'>) {
    return http.put<ApiResult<SysRole>>(`/iam/roles/${id}`, payload).then(unwrap);
  },
  deleteRole(id: number) {
    return http.delete<ApiResult<void>>(`/iam/roles/${id}`).then(unwrap);
  },
  updateRoleStatus(id: number, status: string) {
    return http
      .patch<ApiResult<SysRole>>(`/iam/roles/${id}/status`, null, { params: { status } })
      .then(unwrap);
  },
  posts() {
    return http.get<ApiResult<SysPost[]>>('/iam/posts').then(unwrap);
  },
  createPost(payload: PostCommand) {
    return http.post<ApiResult<SysPost>>('/iam/posts', payload).then(unwrap);
  },
  updatePost(id: number, payload: PostCommand) {
    return http.put<ApiResult<SysPost>>(`/iam/posts/${id}`, payload).then(unwrap);
  },
  deletePost(id: number) {
    return http.delete<ApiResult<void>>(`/iam/posts/${id}`).then(unwrap);
  },
  menus() {
    return http.get<ApiResult<SysMenu[]>>('/iam/menus').then(unwrap);
  },
  createMenu(payload: MenuCommand) {
    return http.post<ApiResult<SysMenu>>('/iam/menus', payload).then(unwrap);
  },
  updateMenu(id: number, payload: MenuCommand) {
    return http.put<ApiResult<SysMenu>>(`/iam/menus/${id}`, payload).then(unwrap);
  },
  deleteMenu(id: number) {
    return http.delete<ApiResult<void>>(`/iam/menus/${id}`).then(unwrap);
  },
  permissions() {
    return http.get<ApiResult<SysPermission[]>>('/iam/permissions').then(unwrap);
  },
  assignRoleMenus(id: number, ids: number[]) {
    return http.put<ApiResult<void>>(`/iam/roles/${id}/menus`, { ids }).then(unwrap);
  },
  assignRolePermissions(id: number, ids: number[]) {
    return http.put<ApiResult<void>>(`/iam/roles/${id}/permissions`, { ids }).then(unwrap);
  },
  roleDataScopes(id: number) {
    return http.get<ApiResult<RoleDataScope[]>>(`/iam/roles/${id}/data-scopes`).then(unwrap);
  },
  assignRoleDataScopes(id: number, scopes: RoleDataScope[]) {
    return http.put<ApiResult<void>>(`/iam/roles/${id}/data-scopes`, scopes).then(unwrap);
  },
};
