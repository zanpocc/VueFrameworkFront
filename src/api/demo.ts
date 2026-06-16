import { http, unwrap, type ApiResult } from './http';

// ---- Repair Order ----

export interface RepairOrderAttachmentView {
  id: number;
  orderId: number;
  fileId: number;
  uploadedAt: string;
}

export interface RepairOrderView {
  id: number;
  code: string;
  title: string;
  description: string;
  applicant: string;
  equipmentCode: string;
  wfInstanceId: number | null;
  wfStatus: string;
  wfCurrentNode: string | null;
  wfStartedAt: string | null;
  wfEndedAt: string | null;
  wfBusinessKey: string | null;
  createdAt: string;
  updatedAt: string;
  attachments: RepairOrderAttachmentView[];
}

export interface RepairOrderSubmitCommand {
  title: string;
  description?: string;
  equipmentCode: string;
  attachmentFileIds?: number[];
}

// ---- API ----

export const demoApi = {
  repairOrders() {
    return http.get<ApiResult<RepairOrderView[]>>('/demo/repair-orders').then(unwrap);
  },
  repairOrder(id: number) {
    return http.get<ApiResult<RepairOrderView>>(`/demo/repair-orders/${id}`).then(unwrap);
  },
  submitRepairOrder(payload: RepairOrderSubmitCommand) {
    return http.post<ApiResult<RepairOrderView>>('/demo/repair-orders', payload).then(unwrap);
  },
  cancelRepairOrder(id: number) {
    return http.post<ApiResult<RepairOrderView>>(`/demo/repair-orders/${id}/cancel`).then(unwrap);
  },
};
