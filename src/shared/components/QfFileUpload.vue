<template>
  <el-upload
    :file-list="uploadFileList"
    :multiple="multiple"
    :accept="accept"
    :limit="maxCount"
    :show-file-list="showFileList"
    :auto-upload="false"
    :on-change="handleChange"
    :on-remove="handleRemove"
    :on-exceed="handleExceed"
  >
    <slot>
      <el-button>
        <el-icon><Upload /></el-icon>
        <span>{{ buttonText ?? '点击上传' }}</span>
      </el-button>
    </slot>
    <template v-if="$slots.tip" #tip>
      <slot name="tip" />
    </template>
  </el-upload>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  ElButton,
  ElIcon,
  ElMessage,
  ElUpload,
  type UploadFile,
  type UploadUserFile,
} from 'element-plus';
import { Upload } from '@element-plus/icons-vue';
import { fileApi, type FileObject } from '@/api/file';

/**
 * 共享文件上传组件：
 *
 * - 实际上传走项目已有的 `fileApi.upload`，复用统一的 axios 实例与鉴权；
 * - v-model 暴露后端返回的 fileId（单文件时为 number，多文件时为 number[]）；
 * - 客户端先做大小、数量校验，不做内容校验；
 * - 上传成功后写入 selectedFiles 缓存，便于显示文件名。
 */
const props = defineProps<{
  /** v-model 绑定的文件 id 或 id 列表。 */
  modelValue: number | number[] | null;
  /** 是否多文件上传。默认 false。 */
  multiple?: boolean;
  /** accept 透传给 el-upload，例如 `.jpg,.png` 或 `image/*`。 */
  accept?: string;
  /** 单文件最大体积，单位 MB。0 或未设置表示不限制。 */
  maxSize?: number;
  /** 最大文件数，默认 5。 */
  maxCount?: number;
  /** 是否展示文件列表，默认 true。 */
  showFileList?: boolean;
  /** 自定义触发按钮文案。 */
  buttonText?: string;
}>();

const emit = defineEmits<{
  /** v-model 更新；单文件返回 number 或 null，多文件返回 number[]。 */
  (event: 'update:modelValue', value: number | number[] | null): void;
  /** 单文件上传成功时触发，便于父组件读取完整元数据。 */
  (event: 'success', file: FileObject): void;
  /** 上传或校验失败时触发，message 为提示文案。 */
  (event: 'error', message: string): void;
}>();

const maxCount = computed(() => (props.multiple ? (props.maxCount ?? 5) : 1));
const showFileList = computed(() => props.showFileList !== false);

// 内部维护已上传文件列表，用于在 UI 上展示文件名与状态。
const selectedFiles = ref<FileObject[]>([]);

const uploadFileList = computed<UploadUserFile[]>(() =>
  selectedFiles.value.map((file) => ({
    name: file.originalFilename,
    url: '',
    status: 'success',
    uid: file.id,
  })),
);

function isOverSize(file: File): boolean {
  if (!props.maxSize || props.maxSize <= 0) {
    return false;
  }
  return file.size > props.maxSize * 1024 * 1024;
}

function syncModel() {
  if (props.multiple) {
    emit(
      'update:modelValue',
      selectedFiles.value.map((file) => file.id),
    );
  } else {
    emit('update:modelValue', selectedFiles.value[0]?.id ?? null);
  }
}

async function handleChange(uploadFile: UploadFile) {
  if (!uploadFile.raw) {
    return;
  }
  const rawFile = uploadFile.raw;

  if (isOverSize(rawFile)) {
    const message = `文件大小不能超过 ${props.maxSize}MB`;
    ElMessage.error(message);
    emit('error', message);
    return;
  }

  try {
    const uploaded = await fileApi.upload(rawFile);
    if (props.multiple) {
      selectedFiles.value = [...selectedFiles.value, uploaded].slice(0, maxCount.value);
    } else {
      selectedFiles.value = [uploaded];
    }
    syncModel();
    emit('success', uploaded);
  } catch (error) {
    const message = error instanceof Error ? error.message : '文件上传失败';
    ElMessage.error(message);
    emit('error', message);
  }
}

function handleRemove(uploadFile: UploadFile) {
  selectedFiles.value = selectedFiles.value.filter((file) => file.id !== uploadFile.uid);
  syncModel();
}

function handleExceed() {
  const message = `最多只能上传 ${maxCount.value} 个文件`;
  ElMessage.warning(message);
  emit('error', message);
}

// 当外部清空 modelValue（例如表单 reset）时，同步清理内部缓存。
watch(
  () => props.modelValue,
  (value) => {
    if (value === null || (Array.isArray(value) && value.length === 0)) {
      selectedFiles.value = [];
    }
  },
);
</script>
