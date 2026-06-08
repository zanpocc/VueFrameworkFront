<template>
  <section class="page">
    <header class="page__header">
      <div>
        <h1>文件管理</h1>
        <p>管理平台文件元数据，上传和下载本地或对象存储中的文件。</p>
      </div>
      <div class="file-actions">
        <el-upload :show-file-list="false" :auto-upload="false" :on-change="uploadFile">
          <el-button v-permission="'system:file:view'" type="primary">
            <el-icon><Upload /></el-icon>
            <span>上传文件</span>
          </el-button>
        </el-upload>
      </div>
    </header>

    <el-form class="page__filters" inline @submit.prevent="loadFiles">
      <el-form-item label="状态">
        <el-select v-model="status" clearable placeholder="全部" style="width: 180px">
          <el-option label="有效" value="ACTIVE" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadFiles">
          <el-icon><Search /></el-icon>
          <span>查询</span>
        </el-button>
        <el-button @click="resetFilters">
          <el-icon><Refresh /></el-icon>
          <span>重置</span>
        </el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="files" border row-key="id">
      <el-table-column prop="originalFilename" label="文件名" min-width="180" show-overflow-tooltip />
      <el-table-column prop="storageType" label="存储" width="100" />
      <el-table-column prop="bucketName" label="Bucket" min-width="140" show-overflow-tooltip />
      <el-table-column prop="contentType" label="类型" min-width="150" show-overflow-tooltip />
      <el-table-column label="大小" width="110">
        <template #default="{ row }">
          {{ formatSize(row.fileSize) }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="uploadedBy" label="上传人" width="120" />
      <el-table-column prop="createdAt" label="上传时间" min-width="170" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button text type="primary" @click="openDetail(row)">详情</el-button>
          <el-button text type="primary" @click="openPreview(row)">预览</el-button>
          <el-button text type="primary" @click="downloadFile(row)">下载</el-button>
        </template>
      </el-table-column>
    </el-table>

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

    <el-dialog v-model="previewVisible" title="文件预览" width="720px">
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
      </div>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage, type UploadFile } from 'element-plus';
import { Refresh, Search, Upload } from '@element-plus/icons-vue';
import { fileApi, type FileObject, type FilePreviewInfo } from '@/api/file';

const loading = ref(false);
const uploading = ref(false);
const status = ref('');
const files = ref<FileObject[]>([]);
const detailVisible = ref(false);
const previewVisible = ref(false);
const currentFile = ref<FileObject | null>(null);
const previewInfo = ref<FilePreviewInfo | null>(null);

async function loadFiles() {
  loading.value = true;
  try {
    files.value = await fileApi.files(status.value);
  } finally {
    loading.value = false;
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
    await loadFiles();
  } finally {
    uploading.value = false;
  }
}

function resetFilters() {
  status.value = '';
  void loadFiles();
}

async function openDetail(row: FileObject) {
  currentFile.value = await fileApi.file(row.id);
  detailVisible.value = true;
}

async function openPreview(row: FileObject) {
  previewInfo.value = await fileApi.previewInfo(row.id);
  previewVisible.value = true;
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

function formatSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

onMounted(loadFiles);
</script>

<style scoped>
.file-actions {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.file-actions :deep(.el-button) {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.file-sha {
  font-family:
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Consolas,
    monospace;
  overflow-wrap: anywhere;
}

.preview-panel {
  display: grid;
  gap: 12px;
}

.preview-panel__status {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
