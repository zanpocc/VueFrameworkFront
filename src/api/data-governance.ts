import { http, type ApiResult } from './http';

export interface DataSourceDiagnostic {
  name: string;
  url: string;
  defaultSource: boolean;
  health: string;
}

export interface ShardRoute {
  logicTable: string;
  routeKey: string;
  actualTable: string;
}

function unwrap<T>(response: { data: ApiResult<T> }) {
  if (!response.data.success) {
    throw new Error(response.data.message || response.data.code);
  }
  return response.data.data;
}

export const dataGovernanceApi = {
  sources() {
    return http.get<ApiResult<DataSourceDiagnostic[]>>('/system/data/sources').then(unwrap);
  },
  current() {
    return http.get<ApiResult<string>>('/system/data/current').then(unwrap);
  },
  readonlyProbe() {
    return http.get<ApiResult<string>>('/system/data/readonly-probe').then(unwrap);
  },
  operationLogRoute(date: string) {
    return http
      .get<ApiResult<ShardRoute>>('/system/data/sharding/operation-log', { params: { date } })
      .then(unwrap);
  },
  asyncTaskRoute(date: string) {
    return http
      .get<ApiResult<ShardRoute>>('/system/data/sharding/async-task', { params: { date } })
      .then(unwrap);
  },
};
