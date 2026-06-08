import { http, type ApiResult } from './http';

export interface FormDefinition {
  id: number;
  formKey: string;
  formName: string;
  version: number;
  schemaJson: string;
  status: string;
  createdBy: string | null;
  createdAt: string;
}

export interface FormDefinitionCommand {
  formKey: string;
  formName: string;
  schemaJson: string;
  status: string;
}

export interface ProcessDefinition {
  id: number;
  processKey: string;
  processName: string;
  version: number;
  formId: number;
  formName: string;
  status: string;
  assigneeType: string;
  assigneeValue: string;
  createdBy: string | null;
  createdAt: string;
}

export interface ProcessDefinitionCommand {
  processKey: string;
  processName: string;
  formId: number;
  status: string;
  assigneeType: string;
  assigneeValue: string;
}

export interface ProcessInstance {
  id: number;
  definitionId: number;
  formId: number;
  title: string;
  businessKey: string | null;
  initiator: string;
  status: string;
  currentAssignee: string | null;
  formData: string | null;
  startedAt: string;
  endedAt: string | null;
}

export interface WorkflowTask {
  id: number;
  instanceId: number;
  processTitle: string;
  taskName: string;
  assignee: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
}

export interface WorkflowHistory {
  id: number;
  instanceId: number;
  taskId: number | null;
  operator: string;
  action: string;
  comment: string | null;
  createdAt: string;
}

function unwrap<T>(response: { data: ApiResult<T> }) {
  if (!response.data.success) {
    throw new Error(response.data.message || response.data.code);
  }
  return response.data.data;
}

export const workflowApi = {
  forms() {
    return http.get<ApiResult<FormDefinition[]>>('/workflow/forms').then(unwrap);
  },
  createForm(payload: FormDefinitionCommand) {
    return http.post<ApiResult<FormDefinition>>('/workflow/forms', payload).then(unwrap);
  },
  definitions() {
    return http.get<ApiResult<ProcessDefinition[]>>('/workflow/definitions').then(unwrap);
  },
  createDefinition(payload: ProcessDefinitionCommand) {
    return http.post<ApiResult<ProcessDefinition>>('/workflow/definitions', payload).then(unwrap);
  },
  instances() {
    return http.get<ApiResult<ProcessInstance[]>>('/workflow/instances').then(unwrap);
  },
  startProcess(payload: {
    processKey: string;
    title: string;
    businessKey: string;
    formData: string;
  }) {
    return http.post<ApiResult<ProcessInstance>>('/workflow/instances', payload).then(unwrap);
  },
  todoTasks() {
    return http.get<ApiResult<WorkflowTask[]>>('/workflow/tasks/todo').then(unwrap);
  },
  completeTask(id: number, payload: { action: string; comment: string }) {
    return http
      .post<ApiResult<ProcessInstance>>(`/workflow/tasks/${id}/complete`, payload)
      .then(unwrap);
  },
  history(instanceId: number) {
    return http
      .get<ApiResult<WorkflowHistory[]>>(`/workflow/instances/${instanceId}/history`)
      .then(unwrap);
  },
};
