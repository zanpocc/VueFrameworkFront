import { http, unwrap, type ApiResult } from './http';

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

export interface SlowSqlRecord {
  occurredAt: string;
  durationMs: number;
  thresholdMs: number;
  traceId: string | null;
  statementId: string;
  sql: string;
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
  slowSql() {
    return http.get<ApiResult<SlowSqlRecord[]>>('/system/data/slow-sql').then(unwrap);
  },
};
