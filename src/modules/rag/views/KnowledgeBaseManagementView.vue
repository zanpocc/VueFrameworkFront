<template>
  <QfPageShell class="rag-page">
    <QfPageHeader
      title="知识库管理"
      description="维护知识库、文档和索引，并通过检索试验台验证召回质量。"
    >
      <template #actions>
        <el-button :icon="Refresh" :loading="loading" @click="loadKnowledgeBases"> 刷新 </el-button>
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">新建知识库</el-button>
      </template>
    </QfPageHeader>

    <section class="rag-page__overview">
      <QfCard class="rag-page__intro" title="知识库管理流程">
        <div class="rag-page__steps">
          <div v-for="step in steps" :key="step.number" class="rag-page__step">
            <span>{{ step.number }}</span>
            <div>
              <strong>{{ step.title }}</strong>
              <small>{{ step.description }}</small>
            </div>
          </div>
        </div>
      </QfCard>
      <QfCard class="rag-page__status" title="当前索引">
        <dl>
          <div>
            <dt>知识库</dt>
            <dd>{{ knowledgeBases.length }}</dd>
          </div>
          <div>
            <dt>文档</dt>
            <dd>{{ selectedKnowledgeBase?.documentCount ?? 0 }}</dd>
          </div>
          <div>
            <dt>Embedding</dt>
            <dd>{{ selectedKnowledgeBase?.embeddingDimension ?? '—' }}</dd>
          </div>
        </dl>
      </QfCard>
    </section>

    <section class="rag-page__workspace">
      <QfTablePanel title="知识库" description="按知识库隔离文档和检索范围">
        <template #actions>
          <el-select
            v-model="selectedKnowledgeBaseId"
            class="rag-page__kb-select"
            placeholder="选择知识库"
            no-data-text="暂无知识库"
          >
            <el-option
              v-for="item in knowledgeBases"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </template>
        <div class="rag-page__kb-list">
          <button
            v-for="item in knowledgeBases"
            :key="item.id"
            type="button"
            class="rag-page__kb-item"
            :class="{ 'rag-page__kb-item--active': item.id === selectedKnowledgeBaseId }"
            @click="selectedKnowledgeBaseId = item.id"
          >
            <span class="rag-page__kb-icon"
              ><el-icon><Collection /></el-icon
            ></span>
            <span class="rag-page__kb-copy">
              <strong>{{ item.name }}</strong>
              <small>{{ item.code }} · {{ item.documentCount }} 个文档</small>
            </span>
            <el-icon><ArrowRight /></el-icon>
          </button>
          <div v-if="knowledgeBases.length === 0" class="rag-page__empty">
            <el-icon><Collection /></el-icon>
            <span>先新建一个知识库</span>
          </div>
        </div>
      </QfTablePanel>

      <QfTablePanel title="文档" description="支持 PDF、TXT、Markdown、CSV、JSON、XML">
        <template #actions>
          <el-upload
            v-if="selectedKnowledgeBaseId"
            :show-file-list="false"
            :http-request="uploadDocument"
            accept=".pdf,.txt,.md,.markdown,.csv,.json,.xml"
          >
            <el-button type="primary" :icon="Upload">上传文档</el-button>
          </el-upload>
        </template>
        <el-table v-loading="documentsLoading" :data="documents" size="small" row-key="id">
          <el-table-column prop="title" label="文档" min-width="220" show-overflow-tooltip />
          <el-table-column prop="sourceType" label="类型" width="90" />
          <el-table-column prop="chunkCount" label="分段" width="80" />
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <div class="rag-page__document-status">
                <QfStatusTag
                  :status="row.status"
                  :label="documentStatusLabels[row.status] ?? row.status"
                  :mapping="DOCUMENT_STATUS_MAP"
                />
                <el-tooltip
                  v-if="row.status === 'FAILED' && row.errorMessage"
                  :content="row.errorMessage"
                  placement="top"
                >
                  <span class="rag-page__document-error">查看原因</span>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.status !== 'INDEXING'"
                link
                type="primary"
                :loading="indexingDocumentId === row.id"
                @click="indexDocument(row)"
              >
                {{ row.status === 'INDEXED' ? '重建索引' : '建立索引' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="!documentsLoading && documents.length === 0" class="rag-page__table-empty">
          暂无文档，上传第一本 Intel 开发手册吧
        </div>
      </QfTablePanel>
    </section>

    <section class="rag-page__tools">
      <QfTablePanel
        title="检索试验台"
        description="先看召回片段，再判断 Embedding 和切分参数是否合适"
      >
        <template #actions>
          <el-button
            type="primary"
            :loading="searching"
            :disabled="!selectedKnowledgeBaseId"
            @click="runSearch"
          >
            检索
          </el-button>
        </template>
        <el-input
          v-model="searchQuery"
          type="textarea"
          :rows="3"
          maxlength="2000"
          show-word-limit
          placeholder="例如：How does CPUID report the processor feature information?"
          @keydown.ctrl.enter="runSearch"
        />
        <div v-if="searchResponse" class="rag-page__results">
          <div class="rag-page__results-heading">
            <strong>召回 {{ searchResponse.hits.length }} 个片段</strong>
            <span>技术词 + 定义证据 + 语义相关性</span>
          </div>
          <article v-for="hit in searchResponse.hits" :key="hit.chunkId" class="rag-page__result">
            <header>
              <strong>{{ hit.documentTitle }}</strong>
              <span>p.{{ hit.pageNumber }} · {{ formatScore(hit.score) }}</span>
            </header>
            <p>{{ hit.content }}</p>
          </article>
          <div v-if="searchResponse.hits.length === 0" class="rag-page__table-empty">
            没有召回片段，请确认文档已经建立索引。
          </div>
        </div>
      </QfTablePanel>
    </section>

    <el-dialog
      v-model="createDialogVisible"
      title="新建知识库"
      width="460px"
      @closed="resetCreateForm"
    >
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-position="top">
        <el-form-item label="名称" prop="name">
          <el-input v-model="createForm.name" placeholder="例如：Intel x86 开发手册" />
        </el-form-item>
        <el-form-item label="编码" prop="code">
          <el-input v-model="createForm.code" placeholder="例如：intel-x86-manuals" />
        </el-form-item>
        <el-form-item label="说明" prop="description">
          <el-input v-model="createForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="createKnowledgeBase">创建</el-button>
      </template>
    </el-dialog>
  </QfPageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import axios from 'axios';
import type { FormInstance, FormRules, UploadRequestOptions } from 'element-plus';
import { ElMessage } from 'element-plus';
import { ArrowRight, Collection, Plus, Refresh, Upload } from '@element-plus/icons-vue';
import { ragApi, type KnowledgeBase, type RagDocument, type SearchResponse } from '@/api/rag';
import { QfCard, QfPageHeader, QfPageShell, QfStatusTag, QfTablePanel } from '@/shared';

defineOptions({ name: 'KnowledgeBaseManagementView' });

const DOCUMENT_STATUS_MAP = {
  INDEXED: 'success',
  INDEXING: 'warning',
  PENDING: 'info',
  FAILED: 'danger',
} as const;
const documentStatusLabels: Record<string, string> = {
  INDEXED: '已索引',
  INDEXING: '索引中',
  PENDING: '待索引',
  FAILED: '失败',
};
const steps = [
  { number: '01', title: '创建知识库', description: '为资料集定义隔离边界' },
  { number: '02', title: '上传手册', description: '原文件走现有文件存储' },
  { number: '03', title: '建立索引', description: '按页切分并写入 Qdrant' },
  { number: '04', title: '验证召回', description: '确认分段和相关性质量' },
];

const knowledgeBases = ref<KnowledgeBase[]>([]);
const documents = ref<RagDocument[]>([]);
const selectedKnowledgeBaseId = ref<number>();
const loading = ref(false);
const documentsLoading = ref(false);
const indexingDocumentId = ref<number>();
const searching = ref(false);
const searchQuery = ref('');
const searchResponse = ref<SearchResponse>();
const createDialogVisible = ref(false);
const creating = ref(false);
const createFormRef = ref<FormInstance>();
const createForm = reactive({ name: '', code: '', description: '' });
type UploadError = Parameters<UploadRequestOptions['onError']>[0];
const createRules: FormRules = {
  name: [{ required: true, message: '请输入知识库名称', trigger: 'blur' }],
  code: [
    { required: true, message: '请输入知识库编码', trigger: 'blur' },
    {
      pattern: /^[a-z0-9][a-z0-9_-]*$/,
      message: '编码使用小写字母、数字、下划线或短横线',
      trigger: 'blur',
    },
  ],
};

const selectedKnowledgeBase = computed(() =>
  knowledgeBases.value.find((item) => item.id === selectedKnowledgeBaseId.value),
);

watch(selectedKnowledgeBaseId, (id) => {
  if (id) {
    void loadDocuments(id);
  } else {
    documents.value = [];
  }
  searchResponse.value = undefined;
});

async function loadKnowledgeBases() {
  loading.value = true;
  try {
    knowledgeBases.value = await ragApi.knowledgeBases();
    if (!knowledgeBases.value.some((item) => item.id === selectedKnowledgeBaseId.value)) {
      selectedKnowledgeBaseId.value = knowledgeBases.value[0]?.id;
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '知识库加载失败');
  } finally {
    loading.value = false;
  }
}

async function loadDocuments(knowledgeBaseId: number) {
  documentsLoading.value = true;
  try {
    documents.value = await ragApi.documents(knowledgeBaseId);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '文档加载失败');
  } finally {
    documentsLoading.value = false;
  }
}

function openCreateDialog() {
  createDialogVisible.value = true;
}

async function createKnowledgeBase() {
  if (!createFormRef.value) return;
  await createFormRef.value.validate(async (valid) => {
    if (!valid) return;
    creating.value = true;
    try {
      const created = await ragApi.createKnowledgeBase(createForm);
      knowledgeBases.value = [created, ...knowledgeBases.value];
      selectedKnowledgeBaseId.value = created.id;
      createDialogVisible.value = false;
      ElMessage.success('知识库创建成功');
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '知识库创建失败');
    } finally {
      creating.value = false;
    }
  });
}

function resetCreateForm() {
  createForm.name = '';
  createForm.code = '';
  createForm.description = '';
  createFormRef.value?.resetFields();
}

function toUploadError(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return new Error(error.response?.data?.message || error.message || '文档上传失败');
  }
  return error instanceof Error ? error : new Error('文档上传失败');
}

async function uploadDocument(options: UploadRequestOptions) {
  if (!selectedKnowledgeBaseId.value) {
    options.onError(new Error('请先选择知识库') as UploadError);
    return;
  }
  try {
    const document = await ragApi.uploadDocument(selectedKnowledgeBaseId.value, options.file);
    options.onSuccess(document);
    documents.value = [document, ...documents.value];
    ElMessage.success('文档上传成功，请点击“建立索引”');
  } catch (error) {
    const uploadError = toUploadError(error);
    ElMessage.error(uploadError.message);
    options.onError(uploadError as UploadError);
  }
}

async function indexDocument(document: RagDocument) {
  indexingDocumentId.value = document.id;
  try {
    const queued = await ragApi.indexDocument(document.id);
    documents.value = documents.value.map((item) => (item.id === queued.id ? queued : item));
    ElMessage.info('索引任务已提交，后台处理中，请稍候');
    await waitForIndex(queued.id);
  } catch (error) {
    await loadDocuments(document.knowledgeBaseId);
    ElMessage.error(error instanceof Error ? error.message : '索引建立失败');
  } finally {
    indexingDocumentId.value = undefined;
  }
}

async function waitForIndex(documentId: number) {
  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    const current = await ragApi.document(documentId);
    documents.value = documents.value.map((item) => (item.id === current.id ? current : item));
    if (current.status === 'INDEXED') {
      await loadKnowledgeBases();
      ElMessage.success(`索引建立成功，共 ${current.chunkCount} 个分段`);
      return;
    }
    if (current.status === 'FAILED') {
      throw new Error(current.errorMessage || '索引建立失败，请查看后端日志');
    }
    await new Promise((resolve) => window.setTimeout(resolve, 3000));
  }
  throw new Error('索引仍在后台处理中，请稍后刷新文档状态');
}

async function runSearch() {
  if (!selectedKnowledgeBaseId.value || !searchQuery.value.trim()) {
    ElMessage.warning('请选择知识库并输入检索内容');
    return;
  }
  searching.value = true;
  try {
    searchResponse.value = await ragApi.search({
      knowledgeBaseId: selectedKnowledgeBaseId.value,
      query: searchQuery.value,
    });
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '检索失败');
  } finally {
    searching.value = false;
  }
}

function formatScore(score: number) {
  return score.toFixed(4);
}

onMounted(() => void loadKnowledgeBases());
</script>

<style scoped>
.rag-page {
  gap: var(--qf-spacing-lg);
}

.rag-page__overview,
.rag-page__workspace,
.rag-page__tools {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(250px, 0.34fr);
  gap: var(--qf-spacing-md);
  align-items: start;
}

.rag-page__document-status {
  display: inline-flex;
  align-items: center;
  gap: var(--qf-spacing-xs);
}

.rag-page__document-error {
  color: var(--qf-color-danger);
  cursor: help;
  font-size: var(--qf-font-size-xs);
}

.rag-page__workspace {
  grid-template-columns: minmax(250px, 0.7fr) minmax(0, 1.5fr);
}

.rag-page__tools {
  grid-template-columns: minmax(0, 1fr);
}

.rag-page__intro :deep(.qf-card__body),
.rag-page__status :deep(.qf-card__body) {
  min-height: 156px;
}

.rag-page__steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--qf-spacing-md);
}

.rag-page__step {
  display: flex;
  gap: var(--qf-spacing-sm);
  align-items: flex-start;
}

.rag-page__step > span {
  color: var(--qf-color-primary);
  font-size: var(--qf-font-size-caption);
  font-weight: 700;
  letter-spacing: 0.08em;
}

.rag-page__step > div,
.rag-page__kb-copy {
  display: grid;
  gap: var(--qf-spacing-2xs);
  min-width: 0;
}

.rag-page__step small,
.rag-page__kb-copy small,
.rag-page__status dt {
  color: var(--qf-color-text-secondary);
  font-size: var(--qf-font-size-caption);
}

.rag-page__status dl {
  display: grid;
  gap: var(--qf-spacing-sm);
  margin: 0;
}

.rag-page__status dl div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: var(--qf-spacing-sm);
  border-bottom: 1px solid var(--qf-color-border-soft);
}

.rag-page__status dl div:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.rag-page__status dd {
  margin: 0;
  color: var(--qf-color-text-primary);
  font-size: var(--qf-font-size-subtitle);
  font-weight: 700;
}

.rag-page__kb-select {
  width: 180px;
}

.rag-page__kb-list {
  display: grid;
  gap: var(--qf-spacing-xs);
  padding: var(--qf-spacing-sm);
}

.rag-page__kb-item {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  gap: var(--qf-spacing-sm);
  align-items: center;
  width: 100%;
  padding: var(--qf-spacing-sm);
  color: var(--qf-color-text-primary);
  text-align: left;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--qf-border-radius-sm);
  cursor: pointer;
  transition: 160ms ease;
}

.rag-page__kb-item:hover,
.rag-page__kb-item--active {
  background: var(--qf-color-primary-soft);
  border-color: var(--qf-color-primary-light);
}

.rag-page__kb-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--qf-color-primary);
  background: var(--qf-color-bg-muted);
  border-radius: var(--qf-border-radius-sm);
}

.rag-page__kb-item > .el-icon {
  color: var(--qf-color-text-placeholder);
}

.rag-page__table-empty,
.rag-page__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  color: var(--qf-color-text-secondary);
  font-size: var(--qf-font-size-caption);
}

.rag-page__empty {
  flex-direction: column;
  gap: var(--qf-spacing-xs);
  min-height: 180px;
}

.rag-page__empty .el-icon {
  color: var(--qf-color-primary);
  font-size: 24px;
}

.rag-page__results {
  max-height: 460px;
  padding-right: var(--qf-spacing-xs);
  overflow-y: auto;
  display: grid;
  gap: var(--qf-spacing-sm);
  margin-top: var(--qf-spacing-md);
}

.rag-page__results-heading,
.rag-page__result header {
  display: flex;
  gap: var(--qf-spacing-sm);
  align-items: center;
  justify-content: space-between;
}

.rag-page__result {
  padding: var(--qf-spacing-md);
  background: var(--qf-color-bg-muted);
  border: 1px solid var(--qf-color-border-soft);
  border-radius: var(--qf-border-radius-sm);
}

.rag-page__result p {
  margin: var(--qf-spacing-sm) 0 0;
  color: var(--qf-color-text-secondary);
  line-height: 1.7;
  white-space: pre-wrap;
}

.rag-page__results-heading span,
.rag-page__result header span {
  color: var(--qf-color-text-secondary);
  font-size: var(--qf-font-size-caption);
}

@media (width <= 960px) {
  .rag-page__overview,
  .rag-page__workspace,
  .rag-page__tools {
    grid-template-columns: 1fr;
  }
}

@media (width <= 700px) {
  .rag-page__steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 480px) {
  .rag-page__steps {
    grid-template-columns: 1fr;
  }
}
</style>
