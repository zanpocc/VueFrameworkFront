<template>
  <QfPageShell class="rag-chat-page">
    <QfPageHeader
      title="智能问答"
      description="选择一个知识库，基于已建立索引的文档进行问答，并查看回答引用。"
    >
      <template #actions>
        <el-button :icon="Refresh" :loading="loading" @click="loadKnowledgeBases">
          刷新知识库
        </el-button>
      </template>
    </QfPageHeader>

    <section class="rag-chat-page__layout">
      <QfTablePanel title="问答范围" description="问答只会检索当前知识库中的已索引文档。">
        <template #actions>
          <el-tag v-if="selectedKnowledgeBase" type="info">
            {{ selectedKnowledgeBase.name }}
          </el-tag>
        </template>
        <el-select
          v-model="selectedKnowledgeBaseId"
          class="rag-chat-page__kb-select"
          placeholder="选择知识库"
          no-data-text="暂无知识库，请先到知识库管理创建"
          :loading="loading"
          filterable
        >
          <el-option
            v-for="item in knowledgeBases"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>

        <div v-if="selectedKnowledgeBase" class="rag-chat-page__kb-summary">
          <div class="rag-chat-page__kb-icon">
            <el-icon><Collection /></el-icon>
          </div>
          <div>
            <strong>{{ selectedKnowledgeBase.name }}</strong>
            <p>{{ selectedKnowledgeBase.description || '暂无知识库说明' }}</p>
          </div>
          <dl>
            <div>
              <dt>文档</dt>
              <dd>{{ selectedKnowledgeBase.documentCount }}</dd>
            </div>
            <div>
              <dt>向量维度</dt>
              <dd>{{ selectedKnowledgeBase.embeddingDimension }}</dd>
            </div>
          </dl>
        </div>

        <div v-else class="rag-chat-page__empty">
          <el-icon><Collection /></el-icon>
          <strong>还没有可用知识库</strong>
          <span>请先在“知识库管理”中创建知识库并建立文档索引。</span>
        </div>
      </QfTablePanel>

      <QfTablePanel title="对话" description="回答由当前知识库的检索结果生成，并附带文档引用。">
        <template #actions>
          <el-button
            type="primary"
            :loading="chatting"
            :disabled="!selectedKnowledgeBaseId"
            @click="runChat"
          >
            发送问题
          </el-button>
        </template>
        <el-input
          v-model="question"
          type="textarea"
          :rows="5"
          maxlength="4000"
          show-word-limit
          :disabled="!selectedKnowledgeBaseId"
          placeholder="例如：What is the purpose of the CR3 register?"
          @keydown.ctrl.enter="runChat"
        />

        <el-alert
          v-if="!chatResponse && !chatting"
          class="rag-chat-page__hint"
          title="先选择知识库，再输入问题。Ctrl + Enter 可以快速发送。"
          type="info"
          :closable="false"
        />

        <div v-if="chatResponse" class="rag-chat-page__answer">
          <div class="rag-chat-page__answer-heading">
            <span class="rag-chat-page__answer-label">回答</span>
            <span v-if="chatResponse.sessionId">会话 #{{ chatResponse.sessionId }}</span>
          </div>
          <p>{{ chatResponse.answer }}</p>
          <div class="rag-chat-page__citations">
            <span
              v-for="citation in chatResponse.citations"
              :key="`${citation.documentId}-${citation.pageNumber}-${citation.score}`"
            >
              {{ citation.documentTitle }} · p.{{ citation.pageNumber }}
            </span>
          </div>
        </div>
      </QfTablePanel>
    </section>
  </QfPageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Collection, Refresh } from '@element-plus/icons-vue';
import { ragApi, type ChatResponse, type KnowledgeBase } from '@/api/rag';
import { QfPageHeader, QfPageShell, QfTablePanel } from '@/shared';

defineOptions({ name: 'RagChatView' });

const knowledgeBases = ref<KnowledgeBase[]>([]);
const selectedKnowledgeBaseId = ref<number>();
const question = ref('');
const sessionId = ref<number>();
const chatResponse = ref<ChatResponse>();
const loading = ref(false);
const chatting = ref(false);

const selectedKnowledgeBase = computed(() =>
  knowledgeBases.value.find((item) => item.id === selectedKnowledgeBaseId.value),
);

watch(selectedKnowledgeBaseId, () => {
  sessionId.value = undefined;
  chatResponse.value = undefined;
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

async function runChat() {
  if (!selectedKnowledgeBaseId.value || !question.value.trim()) {
    ElMessage.warning('请选择知识库并输入问题');
    return;
  }
  chatting.value = true;
  try {
    const response = await ragApi.chat({
      knowledgeBaseId: selectedKnowledgeBaseId.value,
      sessionId: sessionId.value,
      question: question.value,
    });
    sessionId.value = response.sessionId;
    chatResponse.value = response;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '问答失败');
  } finally {
    chatting.value = false;
  }
}

onMounted(() => void loadKnowledgeBases());
</script>

<style scoped>
.rag-chat-page {
  gap: var(--qf-spacing-lg);
}

.rag-chat-page__layout {
  display: grid;
  grid-template-columns: minmax(260px, 0.72fr) minmax(0, 1.5fr);
  gap: var(--qf-spacing-md);
  align-items: start;
}

.rag-chat-page__kb-select {
  width: 100%;
}

.rag-chat-page__kb-summary {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: var(--qf-spacing-sm);
  margin-top: var(--qf-spacing-lg);
  padding: var(--qf-spacing-md);
  background: var(--qf-color-bg-muted);
  border: 1px solid var(--qf-color-border-soft);
  border-radius: var(--qf-border-radius-sm);
}

.rag-chat-page__kb-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: var(--qf-color-primary);
  background: var(--qf-color-primary-soft);
  border-radius: var(--qf-border-radius-sm);
  font-size: 20px;
}

.rag-chat-page__kb-summary p {
  margin: var(--qf-spacing-2xs) 0 0;
  color: var(--qf-color-text-secondary);
  font-size: var(--qf-font-size-caption);
  line-height: 1.6;
}

.rag-chat-page__kb-summary dl {
  display: flex;
  grid-column: 1 / -1;
  gap: var(--qf-spacing-lg);
  margin: var(--qf-spacing-sm) 0 0;
}

.rag-chat-page__kb-summary dl div {
  display: grid;
  gap: var(--qf-spacing-2xs);
}

.rag-chat-page__kb-summary dt {
  color: var(--qf-color-text-secondary);
  font-size: var(--qf-font-size-caption);
}

.rag-chat-page__kb-summary dd {
  margin: 0;
  color: var(--qf-color-text-primary);
  font-weight: 700;
}

.rag-chat-page__empty {
  display: flex;
  flex-direction: column;
  gap: var(--qf-spacing-xs);
  align-items: center;
  justify-content: center;
  min-height: 180px;
  color: var(--qf-color-text-secondary);
  text-align: center;
}

.rag-chat-page__empty .el-icon {
  color: var(--qf-color-primary);
  font-size: 28px;
}

.rag-chat-page__empty span {
  font-size: var(--qf-font-size-caption);
}

.rag-chat-page__hint {
  margin-top: var(--qf-spacing-md);
}

.rag-chat-page__answer {
  max-height: 520px;
  margin-top: var(--qf-spacing-md);
  padding: var(--qf-spacing-lg);
  overflow-y: auto;
  background: var(--qf-color-primary-soft);
  border: 1px solid var(--qf-color-primary-light);
  border-radius: var(--qf-border-radius-sm);
}

.rag-chat-page__answer-heading {
  display: flex;
  gap: var(--qf-spacing-sm);
  align-items: center;
  justify-content: space-between;
  color: var(--qf-color-text-secondary);
  font-size: var(--qf-font-size-caption);
}

.rag-chat-page__answer-label {
  color: var(--qf-color-primary-strong);
  font-weight: 700;
}

.rag-chat-page__answer p {
  margin: var(--qf-spacing-sm) 0 0;
  color: var(--qf-color-text-primary);
  line-height: 1.8;
  white-space: pre-wrap;
}

.rag-chat-page__citations {
  display: flex;
  flex-wrap: wrap;
  gap: var(--qf-spacing-xs);
  margin-top: var(--qf-spacing-lg);
}

.rag-chat-page__citations span {
  padding: var(--qf-spacing-2xs) var(--qf-spacing-xs);
  color: var(--qf-color-primary-strong);
  background: var(--qf-color-bg-surface);
  border-radius: var(--qf-border-radius-sm);
  font-size: var(--qf-font-size-caption);
}

@media (width <= 800px) {
  .rag-chat-page__layout {
    grid-template-columns: 1fr;
  }
}
</style>
