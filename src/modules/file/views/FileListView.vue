<template>
  <QfPageShell>
    <QfPageHeader
      title="文件管理"
      description="管理平台文件元数据，上传、预览和下载本地或对象存储中的文件。"
    >
      <template #actions>
        <el-button :loading="diagnosticLoading" @click="loadStorageDiagnostics">
          <el-icon><Refresh /></el-icon>
          <span>刷新诊断</span>
        </el-button>
        <el-upload :show-file-list="false" :auto-upload="false" :on-change="uploadFile">
          <el-button v-permission="'system:file:view'" type="primary">
            <el-icon><Upload /></el-icon>
            <span>上传文件</span>
          </el-button>
        </el-upload>
      </template>
    </QfPageHeader>

    <div class="storage-diagnostic">
      <el-descriptions v-if="storageDiagnostic" :column="3" border>
        <el-descriptions-item label="当前后端">
          <el-tag :type="storageDiagnostic.health === 'UP' ? 'success' : 'danger'">
            {{ storageDiagnostic.activeStorageType }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Bucket">
          {{ storageDiagnostic.bucketName }}
        </el-descriptions-item>
        <el-descriptions-item label="健康状态">
          {{ storageDiagnostic.health }}
        </el-descriptions-item>
        <el-descriptions-item label="可用后端">
          {{ storageDiagnostic.availableStorageTypes.join(', ') || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="本地根目录">
          {{ storageDiagnostic.localRoot }}
        </el-descriptions-item>
        <el-descriptions-item label="S3 端点">
          {{ storageDiagnostic.s3Enabled ? storageDiagnostic.s3Endpoint || '-' : '未启用' }}
        </el-descriptions-item>
        <el-descriptions-item label="最大上传">
          {{ formatSize(storageDiagnostic.maxFileSizeBytes) }}
        </el-descriptions-item>
        <el-descriptions-item label="最大预览">
          {{ formatSize(storageDiagnostic.maxPreviewSizeBytes) }}
        </el-descriptions-item>
        <el-descriptions-item label="诊断信息">
          {{ storageDiagnostic.message }}
        </el-descriptions-item>
      </el-descriptions>
      <el-empty v-else description="暂无存储诊断信息" :image-size="48" />
    </div>

    <QfTablePanel title="文件列表" description="查看文件元数据，并执行详情、预览和下载操作。">
      <QfDataTable
        :columns="columns"
        :data="table.allRows.value"
        :loading="table.loading.value"
        :page-size="20"
        :actions-width="220"
      >
        <template #filters="{ reload, reset }">
          <el-form-item label="状态">
            <el-select
              v-model="table.filters.status"
              clearable
              placeholder="全部"
              class="qf-field--lg"
            >
              <el-option label="有效" value="ACTIVE" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="reload()">
              <el-icon><Search /></el-icon>
              <span>查询</span>
            </el-button>
            <el-button @click="reset()">
              <el-icon><Refresh /></el-icon>
              <span>重置</span>
            </el-button>
          </el-form-item>
        </template>

        <template #fileSize="{ row }">
          {{ formatSize(row.fileSize) }}
        </template>

        <template #status="{ row }">
          <QfStatusTag :status="row.status" />
        </template>

        <template #actions="{ row }">
          <QfTableActions :actions="getFileActions(row as FileObject)" :max-inline="2" />
        </template>
      </QfDataTable>
    </QfTablePanel>

    <el-dialog v-model="detailVisible" title="文件详情" width="720px">
      <el-descriptions v-if="currentFile" :column="1" border>
        <el-descriptions-item label="文件名">
          {{ currentFile.originalFilename }}
        </el-descriptions-item>
        <el-descriptions-item label="存储后端">
          {{ currentFile.storageType }}
        </el-descriptions-item>
        <el-descriptions-item label="Bucket">
          {{ currentFile.bucketName }}
        </el-descriptions-item>
        <el-descriptions-item label="对象 Key">
          {{ currentFile.objectKey }}
        </el-descriptions-item>
        <el-descriptions-item label="Content-Type">
          {{ currentFile.contentType }}
        </el-descriptions-item>
        <el-descriptions-item label="文件大小">
          {{ formatSize(currentFile.fileSize) }}
        </el-descriptions-item>
        <el-descriptions-item label="SHA-256">
          <span class="file-sha">{{ currentFile.fileSha256 }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="上传人">
          {{ currentFile.uploadedBy }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ currentFile.createdAt }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog
      v-model="previewVisible"
      title="文件预览"
      width="820px"
      @closed="clearPreviewContent"
    >
      <div v-if="previewInfo" class="preview-panel">
        <div class="preview-panel__status">
          <el-tag :type="previewInfo.previewable ? 'success' : 'info'">
            {{ previewInfo.previewable ? '可预览' : '不可预览' }}
          </el-tag>
          <span>{{ previewInfo.previewType }}</span>
        </div>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="文件名">
            {{ previewInfo.originalFilename }}
          </el-descriptions-item>
          <el-descriptions-item label="Content-Type">
            {{ previewInfo.contentType }}
          </el-descriptions-item>
          <el-descriptions-item label="文件大小">
            {{ formatSize(previewInfo.fileSize) }}
          </el-descriptions-item>
          <el-descriptions-item label="预览地址">
            {{ previewInfo.previewUrl || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="说明">
            {{ previewInfo.reason || '当前文件类型可用于后续在线预览渲染。' }}
          </el-descriptions-item>
        </el-descriptions>
        <div v-loading="previewLoading" class="preview-content">
          <el-image
            v-if="previewInfo.previewType === 'IMAGE' && previewObjectUrl"
            :src="previewObjectUrl"
            fit="contain"
            class="preview-image"
          />
          <iframe
            v-else-if="previewInfo.previewType === 'PDF' && previewObjectUrl"
            :src="previewObjectUrl"
            class="preview-frame"
            title="PDF 预览"
          />
          <pre v-else-if="previewInfo.previewType === 'TEXT'" class="preview-text">{{
            previewText
          }}</pre>
          <el-empty v-else :description="previewInfo.reason || '当前文件类型暂不支持在线渲染'" />
        </div>
      </div>
    </el-dialog>
  </QfPageShell>
</template>

<script setup lang="ts">
defineOptions({ name: 'FileList' });

import { ref } from 'vue';
import { ElMessage, type UploadFile } from 'element-plus';
import { Refresh, Search, Upload } from '@element-plus/icons-vue';
import {
  QfDataTable,
  QfPageHeader,
  QfPageShell,
  QfStatusTag,
  QfTableActions,
  QfTablePanel,
  formatSize,
} from '@/shared';
import type { QfTableColumn, QfActionItem } from '@/shared';
import { useTable } from '@/shared';
import {
  fileApi,
  type FileObject,
  type FilePreviewInfo,
  type FileStorageDiagnostic,
} from '@/api/file';

const columns: QfTableColumn<FileObject>[] = [
  { prop: 'originalFilename', label: '文件名', minWidth: 180, showOverflowTooltip: true },
  { prop: 'storageType', label: '存储', width: 100 },
  { prop: 'bucketName', label: 'Bucket', minWidth: 140, showOverflowTooltip: true },
  { prop: 'contentType', label: '类型', minWidth: 150, showOverflowTooltip: true },
  { prop: 'fileSize', label: '大小', width: 110, slot: 'fileSize' },
  { prop: 'status', label: '状态', width: 100, slot: 'status' },
  { prop: 'uploadedBy', label: '上传人', width: 120 },
  { prop: 'createdAt', label: '上传时间', minWidth: 170 },
];

const table = useTable<FileObject, { status: string }>({
  fetcher: (filters) => fileApi.files(filters.status),
  defaultFilters: { status: '' },
});

const uploading = ref(false);
const diagnosticLoading = ref(false);
const storageDiagnostic = ref<FileStorageDiagnostic | null>(null);
const detailVisible = ref(false);
const previewVisible = ref(false);
const currentFile = ref<FileObject | null>(null);
const previewInfo = ref<FilePreviewInfo | null>(null);
const previewLoading = ref(false);
const previewObjectUrl = ref('');
const previewText = ref('');

function getFileActions(row: FileObject): QfActionItem[] {
  return [
    { label: '详情', handler: () => openDetail(row) },
    { label: '预览', handler: () => openPreview(row) },
    { label: '下载', handler: () => downloadFile(row) },
  ];
}

async function loadStorageDiagnostics() {
  diagnosticLoading.value = true;
  try {
    storageDiagnostic.value = await fileApi.storageDiagnostics();
  } finally {
    diagnosticLoading.value = false;
  }
}

async function uploadFile(uploadFileInfo: UploadFile) {
  if (!uploadFileInfo.raw || uploading.value) {
    return;
  }
  uploading.value = true;
  try {
    await fileApi.upload(uploadFileInfo.raw);
    ElMessage.success('文件已上传');
    await Promise.all([table.reload(), loadStorageDiagnostics()]);
  } finally {
    uploading.value = false;
  }
}

async function openDetail(row: FileObject) {
  currentFile.value = await fileApi.file(row.id);
  detailVisible.value = true;
}

async function openPreview(row: FileObject) {
  clearPreviewContent();
  previewInfo.value = await fileApi.previewInfo(row.id);
  previewVisible.value = true;
  if (!previewInfo.value.previewable) {
    return;
  }
  await loadPreviewContent(row);
}

async function loadPreviewContent(row: FileObject) {
  if (!previewInfo.value || !['IMAGE', 'PDF', 'TEXT'].includes(previewInfo.value.previewType)) {
    return;
  }
  previewLoading.value = true;
  try {
    const response = await fileApi.download(row.id);
    const blob = new Blob([response.data], {
      type: previewInfo.value.contentType || row.contentType || 'application/octet-stream',
    });
    if (previewInfo.value.previewType === 'TEXT') {
      previewText.value = await blob.text();
    } else {
      previewObjectUrl.value = window.URL.createObjectURL(blob);
    }
  } finally {
    previewLoading.value = false;
  }
}

function clearPreviewContent() {
  if (previewObjectUrl.value) {
    window.URL.revokeObjectURL(previewObjectUrl.value);
  }
  previewObjectUrl.value = '';
  previewText.value = '';
  previewLoading.value = false;
}

async function downloadFile(row: FileObject) {
  const response = await fileApi.download(row.id);
  const blob = new Blob([response.data], {
    type: row.contentType || 'application/octet-stream',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = row.originalFilename || `file-${row.id}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

void loadStorageDiagnostics();
</script>

<style scoped>
.storage-diagnostic {
  background: var(--qf-color-bg-surface);
  border: 1px solid var(--qf-color-border-soft);
  border-radius: var(--qf-border-radius);
}

.file-sha {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  overflow-wrap: anywhere;
}

.preview-panel {
  display: grid;
  gap: var(--qf-spacing-md);
}

.preview-panel__status {
  display: flex;
  gap: var(--qf-spacing-sm);
  align-items: center;
}

.preview-content {
  min-height: 220px;
  border: 1px solid var(--qf-color-border);
  border-radius: var(--qf-border-radius);
}

.preview-image {
  width: 100%;
  max-height: 520px;
}

.preview-frame {
  width: 100%;
  height: 560px;
  border: 0;
}

.preview-text {
  max-height: 520px;
  padding: var(--qf-spacing-md);
  margin: 0;
  overflow: auto;
  white-space: pre-wrap;
}
</style>
