import { http, unwrap, type ApiResult } from './http';

// ---- Form Definition ----

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

export interface FormTableBinding {
  id: number;
  formId: number;
  physicalTable: string;
  businessPkColumn: string;
  dbSchema: string | null;
  serviceName: string | null;
  datasourceKey: string;
  updateMode: string;
  createdBy: string | null;
  createdAt: string;
}

export interface FormTableBindingCommand {
  physicalTable: string;
  businessPkColumn: string;
  dbSchema?: string;
  serviceName?: string;
  datasourceKey?: string;
  updateMode?: string;
}

// ---- Process Definition ----

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

export interface DefinitionNode {
  id: number;
  definitionId: number;
  nodeKey: string;
  nodeName: string;
  nodeType: string;
  assigneeType: string;
  assigneeValue: string | null;
  multiMode: string | null;
  sortOrder: number;
  posX: number | null;
  posY: number | null;
  createdAt: string;
}

export interface NodeCommand {
  nodeKey: string;
  nodeName: string;
  nodeType: string;
  assigneeType?: string;
  assigneeValue?: string;
  multiMode?: string;
  sortOrder?: number;
  posX?: number | null;
  posY?: number | null;
}

export interface DefinitionTransition {
  id: number;
  definitionId: number;
  fromNodeKey: string;
  toNodeKey: string;
  action: string;
  conditionExpression: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface TransitionCommand {
  fromNodeKey: string;
  toNodeKey: string;
  action: string;
  conditionExpression?: string | null;
  sortOrder?: number;
}

export interface ProcessModelImportCommand {
  nodes: NodeCommand[];
  transitions?: TransitionCommand[];
}

export interface ProcessModelImportResult {
  nodes: DefinitionNode[];
  transitions: DefinitionTransition[];
}

// ---- Process Instance ----

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

export interface StartProcessCommand {
  processKey: string;
  title: string;
  businessKey?: string;
  formData?: string;
}

export interface WorkflowEvent {
  id: number;
  instanceId: number;
  eventType: string;
  nodeKey: string | null;
  operator: string | null;
  payload: string | null;
  createdAt: string;
}

// ---- Task ----

export interface WorkflowTask {
  id: number;
  instanceId: number;
  processTitle: string;
  taskName: string;
  assignee: string;
  status: string;
  nodeKey: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface TaskActionCommand {
  action: string;
  comment?: string;
}

// ---- History ----

export interface WorkflowHistory {
  id: number;
  instanceId: number;
  taskId: number | null;
  operator: string;
  action: string;
  comment: string | null;
  createdAt: string;
}

// ---- CC (Carbon Copy) ----

export interface CCRecord {
  id: number;
  instanceId: number;
  nodeKey: string | null;
  ccTo: string;
  ccFrom: string | null;
  title: string | null;
  readAt: string | null;
  createdAt: string;
}

// ---- API ----

export const workflowApi = {
  // Forms
  forms() {
    return http.get<ApiResult<FormDefinition[]>>('/workflow/forms').then(unwrap);
  },
  createForm(payload: FormDefinitionCommand) {
    return http.post<ApiResult<FormDefinition>>('/workflow/forms', payload).then(unwrap);
  },
  getFormBinding(formId: number) {
    return http
      .get<ApiResult<FormTableBinding | null>>(`/workflow/forms/${formId}/binding`)
      .then(unwrap);
  },
  bindForm(formId: number, payload: FormTableBindingCommand) {
    return http
      .post<ApiResult<FormTableBinding>>(`/workflow/forms/${formId}/binding`, payload)
      .then(unwrap);
  },
  unbindForm(formId: number) {
    return http.delete<ApiResult<void>>(`/workflow/forms/${formId}/binding`).then(unwrap);
  },

  // Definitions
  definitions() {
    return http.get<ApiResult<ProcessDefinition[]>>('/workflow/definitions').then(unwrap);
  },
  createDefinition(payload: ProcessDefinitionCommand) {
    return http.post<ApiResult<ProcessDefinition>>('/workflow/definitions', payload).then(unwrap);
  },
  updateDefinitionStatus(definitionId: number, status: string) {
    return http
      .patch<
        ApiResult<ProcessDefinition>
      >(`/workflow/definitions/${definitionId}/status`, null, { params: { status } })
      .then(unwrap);
  },
  importDefinitionModel(definitionId: number, payload: ProcessModelImportCommand) {
    return http
      .post<
        ApiResult<ProcessModelImportResult>
      >(`/workflow/definitions/${definitionId}/model/import`, payload)
      .then(unwrap);
  },
  getDefinitionNodes(definitionId: number) {
    return http
      .get<ApiResult<DefinitionNode[]>>(`/workflow/definitions/${definitionId}/nodes`)
      .then(unwrap);
  },
  addDefinitionNode(definitionId: number, payload: NodeCommand) {
    return http
      .post<ApiResult<DefinitionNode>>(`/workflow/definitions/${definitionId}/nodes`, payload)
      .then(unwrap);
  },
  deleteDefinitionNode(definitionId: number, nodeKey: string) {
    return http
      .delete<ApiResult<void>>(`/workflow/definitions/${definitionId}/nodes/${nodeKey}`)
      .then(unwrap);
  },
  updateNodePositions(
    definitionId: number,
    positions: Array<{ nodeKey: string; posX: number; posY: number }>,
  ) {
    return http
      .patch<
        ApiResult<void>
      >(`/workflow/definitions/${definitionId}/nodes/positions`, { positions })
      .then(unwrap);
  },
  getDefinitionTransitions(definitionId: number) {
    return http
      .get<ApiResult<DefinitionTransition[]>>(`/workflow/definitions/${definitionId}/transitions`)
      .then(unwrap);
  },
  addDefinitionTransition(definitionId: number, payload: TransitionCommand) {
    return http
      .post<
        ApiResult<DefinitionTransition>
      >(`/workflow/definitions/${definitionId}/transitions`, payload)
      .then(unwrap);
  },
  deleteDefinitionTransition(definitionId: number, transitionId: number) {
    return http
      .delete<ApiResult<void>>(`/workflow/definitions/${definitionId}/transitions/${transitionId}`)
      .then(unwrap);
  },

  // Instances
  instances() {
    return http.get<ApiResult<ProcessInstance[]>>('/workflow/instances').then(unwrap);
  },
  startProcess(payload: StartProcessCommand) {
    return http.post<ApiResult<ProcessInstance>>('/workflow/instances', payload).then(unwrap);
  },
  getInstanceEvents(instanceId: number) {
    return http
      .get<ApiResult<WorkflowEvent[]>>(`/workflow/instances/${instanceId}/events`)
      .then(unwrap);
  },
  withdrawInstance(instanceId: number, payload?: { comment?: string }) {
    return http
      .post<ApiResult<ProcessInstance>>(`/workflow/instances/${instanceId}/withdraw`, payload)
      .then(unwrap);
  },
  terminateInstance(instanceId: number, payload?: { comment?: string }) {
    return http
      .post<ApiResult<ProcessInstance>>(`/workflow/instances/${instanceId}/terminate`, payload)
      .then(unwrap);
  },
  ccInstance(instanceId: number, payload: { targetUser: string; comment?: string }) {
    return http.post<ApiResult<void>>(`/workflow/instances/${instanceId}/cc`, payload).then(unwrap);
  },
  history(instanceId: number) {
    return http
      .get<ApiResult<WorkflowHistory[]>>(`/workflow/instances/${instanceId}/history`)
      .then(unwrap);
  },

  // Tasks
  todoTasks() {
    return http.get<ApiResult<WorkflowTask[]>>('/workflow/tasks/todo').then(unwrap);
  },
  doneTasks() {
    return http.get<ApiResult<WorkflowTask[]>>('/workflow/tasks/done').then(unwrap);
  },
  completeTask(id: number, payload: TaskActionCommand) {
    return http
      .post<ApiResult<ProcessInstance>>(`/workflow/tasks/${id}/complete`, payload)
      .then(unwrap);
  },

  // CC
  getCCList() {
    return http.get<ApiResult<CCRecord[]>>('/workflow/cc').then(unwrap);
  },
  markCCRead(ccId: number) {
    return http.post<ApiResult<void>>(`/workflow/cc/${ccId}/read`).then(unwrap);
  },
};
