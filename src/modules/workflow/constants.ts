/**
 * 工作流模块通用状态映射常量。
 */

export const WORKFLOW_STATUS_MAP = {
  RUNNING: 'warning',
  COMPLETED: 'success',
  APPROVED: 'success',
  REJECTED: 'danger',
  WITHDRAWN: 'info',
  TERMINATED: 'danger',
  CANCELED: 'info',
  NOT_STARTED: 'info',
  DRAFT: 'info',
  PUBLISHED: 'success',
  DISABLED: 'danger',
} as const satisfies Record<string, 'success' | 'warning' | 'danger' | 'info'>;

export const TASK_STATUS_MAP = {
  TODO: 'warning',
  APPROVE: 'success',
  REJECT: 'danger',
  WITHDRAWN: 'info',
  TERMINATED: 'danger',
} as const satisfies Record<string, 'success' | 'warning' | 'danger' | 'info'>;

export const ACTION_STATUS_MAP = {
  APPROVE: 'success',
  REJECT: 'danger',
  START: 'warning',
  WITHDRAWN: 'info',
  TERMINATED: 'danger',
} as const satisfies Record<string, 'success' | 'warning' | 'danger' | 'info'>;
