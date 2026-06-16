import { http, unwrap, type ApiResult } from './http';

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

export interface Notice {
  id: number;
  title: string;
  noticeType: string;
  content: string;
  status: string;
  pinned: boolean;
  sortOrder: number;
  publisher: string | null;
  publishedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NoticeCommand = Pick<
  Notice,
  'title' | 'noticeType' | 'content' | 'status' | 'pinned' | 'sortOrder'
>;

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

export interface AuditEvent {
  id: number;
  username: string;
  module: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  detail: string | null;
  success: boolean;
  traceId: string | null;
  clientIp: string | null;
  createdAt: string;
}

export interface ExceptionLog {
  id: number;
  exceptionClass: string;
  message: string | null;
  stackTrace: string | null;
  requestMethod: string | null;
  requestUri: string | null;
  username: string | null;
  traceId: string | null;
  clientIp: string | null;
  createdAt: string;
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
  refreshConfigCache() {
    return http.post<ApiResult<void>>('/system/configs/cache/refresh').then(unwrap);
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
  notices(keyword = '', status = '') {
    return http
      .get<ApiResult<Notice[]>>('/system/notices', { params: { keyword, status } })
      .then(unwrap);
  },
  createNotice(payload: NoticeCommand) {
    return http.post<ApiResult<Notice>>('/system/notices', payload).then(unwrap);
  },
  updateNotice(id: number, payload: NoticeCommand) {
    return http.put<ApiResult<Notice>>(`/system/notices/${id}`, payload).then(unwrap);
  },
  publishNotice(id: number) {
    return http.post<ApiResult<Notice>>(`/system/notices/${id}/publish`).then(unwrap);
  },
  revokeNotice(id: number) {
    return http.post<ApiResult<Notice>>(`/system/notices/${id}/revoke`).then(unwrap);
  },
  deleteNotice(id: number) {
    return http.delete<ApiResult<void>>(`/system/notices/${id}`).then(unwrap);
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
  auditEvents(module = '', username = '') {
    return http
      .get<ApiResult<AuditEvent[]>>('/system/audit-events', { params: { module, username } })
      .then(unwrap);
  },
  exceptionLogs(exceptionClass = '', username = '') {
    return http
      .get<ApiResult<ExceptionLog[]>>('/system/exception-logs', {
        params: { exceptionClass, username },
      })
      .then(unwrap);
  },
};
