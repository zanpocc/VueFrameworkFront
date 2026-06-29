import { http, unwrap, type ApiResult } from './http';

const MULTIPART_THRESHOLD = 8 * 1024 * 1024;
const MULTIPART_PART_SIZE = 8 * 1024 * 1024;

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

export interface FileStorageDiagnostic {
  activeStorageType: string;
  bucketName: string;
  health: string;
  message: string;
  activeStorageAvailable: boolean;
  availableStorageTypes: string[];
  localRoot: string;
  maxFileSizeBytes: number;
  maxPreviewSizeBytes: number;
  s3Enabled: boolean;
  s3Endpoint: string;
  s3Region: string;
  s3PathStyleAccess: boolean;
}

export interface MultipartPartView {
  partNumber: number;
  etag: string;
  partSize: number;
  status: string;
}

export interface MultipartUploadInitView {
  uploadId: number | null;
  objectKey: string;
  partSize: number;
  partCount: number;
  uploadedParts: MultipartPartView[];
  file: FileObject | null;
}

export interface MultipartUploadSessionView {
  uploadId: number;
  storageType: string;
  bucketName: string;
  objectKey: string;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  fileSha256: string;
  partSize: number;
  partCount: number;
  uploadedPartCount: number;
  status: string;
  createdBy: string;
  createTime: string;
  updateTime: string;
  uploadedParts: MultipartPartView[];
}

export const fileApi = {
  files(status = '') {
    return http.get<ApiResult<FileObject[]>>('/files', { params: { status } }).then(unwrap);
  },
  storageDiagnostics() {
    return http.get<ApiResult<FileStorageDiagnostic>>('/files/storage/diagnostics').then(unwrap);
  },
  upload(file: File) {
    if (file.size < MULTIPART_THRESHOLD) {
      return uploadSingle(file);
    }
    return uploadMultipart(file);
  },
  initMultipart(file: File, fileSha256: string) {
    const partSize = MULTIPART_PART_SIZE;
    return http
      .post<ApiResult<MultipartUploadInitView>>('/files/multipart/init', {
        originalFilename: file.name,
        contentType: file.type || 'application/octet-stream',
        fileSize: file.size,
        fileSha256,
        partSize,
        partCount: Math.ceil(file.size / partSize),
      })
      .then(unwrap);
  },
  uploadPart(uploadId: number, partNumber: number, part: Blob) {
    const formData = new FormData();
    formData.append('file', part, `part-${partNumber}`);
    return http
      .put<ApiResult<MultipartPartView>>(`/files/multipart/${uploadId}/parts/${partNumber}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then(unwrap);
  },
  multipartStatus(uploadId: number) {
    return http.get<ApiResult<MultipartUploadSessionView>>(`/files/multipart/${uploadId}`).then(unwrap);
  },
  completeMultipart(uploadId: number, fileSha256: string, parts: MultipartPartView[]) {
    return http
      .post<ApiResult<FileObject>>(`/files/multipart/${uploadId}/complete`, {
        fileSha256,
        parts: parts.map((part) => ({ partNumber: part.partNumber, etag: part.etag })),
      })
      .then(unwrap);
  },
  abortMultipart(uploadId: number) {
    return http.post<ApiResult<void>>(`/files/multipart/${uploadId}/abort`).then(unwrap);
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

function uploadSingle(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return http
    .post<ApiResult<FileObject>>('/files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    .then(unwrap);
}

async function uploadMultipart(file: File) {
  const fileSha256 = await sha256(file);
  const session = await fileApi.initMultipart(file, fileSha256);
  if (session.file) {
    return session.file;
  }
  if (!session.uploadId) {
    throw new Error('分片上传初始化失败');
  }
  const uploadedParts = new Map(session.uploadedParts.map((part) => [part.partNumber, part]));
  try {
    for (let partNumber = 1; partNumber <= session.partCount; partNumber += 1) {
      if (uploadedParts.has(partNumber)) {
        continue;
      }
      const start = (partNumber - 1) * session.partSize;
      const end = Math.min(start + session.partSize, file.size);
      const uploaded = await fileApi.uploadPart(session.uploadId, partNumber, file.slice(start, end));
      uploadedParts.set(partNumber, uploaded);
    }
    return await fileApi.completeMultipart(
      session.uploadId,
      fileSha256,
      Array.from(uploadedParts.values()).sort((left, right) => left.partNumber - right.partNumber),
    );
  } catch (error) {
    await fileApi.abortMultipart(session.uploadId).catch(() => undefined);
    throw error;
  }
}

async function sha256(file: File) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('当前浏览器不支持大文件完整性校验');
  }
  const digest = await globalThis.crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
