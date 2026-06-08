import { http, type ApiResult } from './http';

export interface SysConfig {
  id: number;
  configGroup: string;
  configKey: string;
  configValue: string | null;
  valueType: string;
  sensitive: boolean;
  editable: boolean;
  remark: string | null;
}

export type ConfigCommand = Omit<SysConfig, 'id'>;

export interface DictType {
  id: number;
  dictCode: string;
  dictName: string;
  status: string;
  remark: string | null;
}

export type DictTypeCommand = Omit<DictType, 'id'>;

export interface DictItem {
  id: number;
  dictCode: string;
  itemLabel: string;
  itemValue: string;
  sortOrder: number;
  status: string;
  remark: string | null;
}

export type DictItemCommand = Omit<DictItem, 'id'>;

export interface LoginLog {
  id: number;
  username: string;
  success: boolean;
  message: string | null;
  loginIp: string | null;
  userAgent: string | null;
  loginAt: string;
}

export interface OperationLog {
  id: number;
  username: string;
  moduleName: string;
  operationType: string;
  resourceName: string | null;
  success: boolean;
  message: string | null;
  operatedAt: string;
}

function unwrap<T>(response: { data: ApiResult<T> }) {
  if (!response.data.success) {
    throw new Error(response.data.message || response.data.code);
  }
  return response.data.data;
}

export const systemApi = {
  configs(keyword = '') {
    return http
      .get<ApiResult<SysConfig[]>>('/system/configs', { params: { keyword } })
      .then(unwrap);
  },
  createConfig(payload: ConfigCommand) {
    return http.post<ApiResult<SysConfig>>('/system/configs', payload).then(unwrap);
  },
  updateConfig(id: number, payload: ConfigCommand) {
    return http.put<ApiResult<SysConfig>>(`/system/configs/${id}`, payload).then(unwrap);
  },
  deleteConfig(id: number) {
    return http.delete<ApiResult<void>>(`/system/configs/${id}`).then(unwrap);
  },
  dictTypes(keyword = '') {
    return http
      .get<ApiResult<DictType[]>>('/system/dict-types', { params: { keyword } })
      .then(unwrap);
  },
  createDictType(payload: DictTypeCommand) {
    return http.post<ApiResult<DictType>>('/system/dict-types', payload).then(unwrap);
  },
  updateDictType(id: number, payload: DictTypeCommand) {
    return http.put<ApiResult<DictType>>(`/system/dict-types/${id}`, payload).then(unwrap);
  },
  deleteDictType(id: number) {
    return http.delete<ApiResult<void>>(`/system/dict-types/${id}`).then(unwrap);
  },
  dictItems(dictCode = '') {
    return http
      .get<ApiResult<DictItem[]>>('/system/dict-items', { params: { dictCode } })
      .then(unwrap);
  },
  createDictItem(payload: DictItemCommand) {
    return http.post<ApiResult<DictItem>>('/system/dict-items', payload).then(unwrap);
  },
  updateDictItem(id: number, payload: DictItemCommand) {
    return http.put<ApiResult<DictItem>>(`/system/dict-items/${id}`, payload).then(unwrap);
  },
  deleteDictItem(id: number) {
    return http.delete<ApiResult<void>>(`/system/dict-items/${id}`).then(unwrap);
  },
  loginLogs(username = '') {
    return http
      .get<ApiResult<LoginLog[]>>('/system/login-logs', { params: { username } })
      .then(unwrap);
  },
  operationLogs(username = '') {
    return http
      .get<ApiResult<OperationLog[]>>('/system/operation-logs', { params: { username } })
      .then(unwrap);
  },
};
