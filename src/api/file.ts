import { http, type ApiResult } from './http';

export interface FileObject {
  id: number;
  storageType: string;
  bucketName: string;
  objectKey: string;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  fileSha256: string;
  status: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FilePreviewInfo {
  id: number;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  previewable: boolean;
  previewType: 'IMAGE' | 'TEXT' | 'PDF' | 'NONE' | string;
  previewUrl: string | null;
  reason: string;
}

function unwrap<T>(response: { data: ApiResult<T> }) {
  if (!response.data.success) {
    throw new Error(response.data.message || response.data.code);
  }
  return response.data.data;
}

export const fileApi = {
  files(status = '') {
    return http.get<ApiResult<FileObject[]>>('/files', { params: { status } }).then(unwrap);
  },
  upload(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return http
      .post<ApiResult<FileObject>>('/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then(unwrap);
  },
  file(id: number) {
    return http.get<ApiResult<FileObject>>(`/files/${id}`).then(unwrap);
  },
  previewInfo(id: number) {
    return http.get<ApiResult<FilePreviewInfo>>(`/files/${id}/preview-info`).then(unwrap);
  },
  download(id: number) {
    return http.get<Blob>(`/files/${id}/download`, { responseType: 'blob' });
  },
};
