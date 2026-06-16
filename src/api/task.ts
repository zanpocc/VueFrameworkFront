import { http, unwrap, type ApiResult } from './http';

export interface AsyncTask {
  id: number;
  outboxMessageId: number;
  taskType: string;
  taskName: string;
  taskParam: string | null;
  idempotentKey: string;
  status: string;
  retryCount: number;
  maxRetries: number;
  lastError: string | null;
  nextRetryAt: string | null;
  lockedBy: string | null;
  lockedAt: string | null;
  manualAction: string | null;
  manualComment: string | null;
  manualHandledBy: string | null;
  manualHandledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AsyncTaskCommand {
  taskType: string;
  taskName: string;
  taskParam: string;
  idempotentKey: string;
  maxRetries: number;
}

export interface AsyncTaskLog {
  id: number;
  taskId: number;
  attemptNo: number;
  status: string;
  message: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface OutboxMessage {
  id: number;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: string | null;
  idempotentKey: string | null;
  status: string;
  retryCount: number;
  maxRetries: number;
  lastError: string | null;
  nextRetryAt: string | null;
  createdAt: string;
  publishedAt: string | null;
}

export const taskApi = {
  tasks(status = '') {
    return http.get<ApiResult<AsyncTask[]>>('/tasks', { params: { status } }).then(unwrap);
  },
  createTask(payload: AsyncTaskCommand) {
    return http.post<ApiResult<AsyncTask>>('/tasks', payload).then(unwrap);
  },
  taskDetail(id: number) {
    return http.get<ApiResult<AsyncTask>>(`/tasks/${id}`).then(unwrap);
  },
  taskLogs(id: number) {
    return http.get<ApiResult<AsyncTaskLog[]>>(`/tasks/${id}/logs`).then(unwrap);
  },
  retryTask(id: number, comment?: string) {
    return http.post<ApiResult<AsyncTask>>(`/tasks/${id}/retry`, { comment }).then(unwrap);
  },
  cancelTask(id: number, comment?: string) {
    return http.post<ApiResult<AsyncTask>>(`/tasks/${id}/cancel`, { comment }).then(unwrap);
  },
  ignoreTask(id: number, comment?: string) {
    return http.post<ApiResult<AsyncTask>>(`/tasks/${id}/ignore`, { comment }).then(unwrap);
  },
  restoreTask(id: number, comment?: string) {
    return http.post<ApiResult<AsyncTask>>(`/tasks/${id}/restore`, { comment }).then(unwrap);
  },
  dispatch(batchSize = 10) {
    return http
      .post<ApiResult<number>>('/tasks/dispatch', null, { params: { batchSize } })
      .then(unwrap);
  },
  outbox(status = '') {
    return http
      .get<ApiResult<OutboxMessage[]>>('/tasks/outbox', { params: { status } })
      .then(unwrap);
  },
  retryOutbox(id: number) {
    return http.post<ApiResult<OutboxMessage>>(`/tasks/outbox/${id}/retry`).then(unwrap);
  },
};
