export const REPAIR_WF_STATUS_MAP = {
  NOT_STARTED: 'info',
  RUNNING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  CANCELED: 'info',
  TERMINATED: 'danger',
} as const satisfies Record<string, 'success' | 'warning' | 'danger' | 'info'>;
